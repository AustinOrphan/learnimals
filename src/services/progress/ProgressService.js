/**
 * Progress Service
 * Comprehensive progress tracking system for user activities and learning
 */

import { dbService } from '../database/IndexedDBService.js';
import { STORES, VALIDATION_SCHEMAS, generateId } from '../database/schema.js';
import logger from '../../utils/logger.js';

export class ProgressService {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Set();
    this.currentSession = null;
    this.sessionStartTime = null;
  }

  /**
   * Initialize the progress service
   */
  async initialize() {
    await dbService.initialize();

    // Subscribe to database changes
    this.unsubscribeDb = dbService.subscribe(event => {
      if (event.storeName === STORES.PROGRESS) {
        this._invalidateCache(event.data?.userId);
        this._notifySubscribers(event);
      }
    });

    logger.info('ProgressService initialized');
  }

  /**
   * Start a new learning session
   * @param {string} userId - User ID
   * @param {Object} sessionData - Additional session data
   * @returns {Promise<string>} - Session ID
   */
  async startSession(userId, sessionData = {}) {
    if (!userId) {
      throw new Error('User ID is required to start a session');
    }

    const sessionId = generateId('session');
    this.currentSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      activities: [],
      ...sessionData,
    };

    this.sessionStartTime = Date.now();

    // Store session in database
    await dbService.add(STORES.SESSIONS, this.currentSession);

    logger.info(`Started session ${sessionId} for user ${userId}`);
    this._notifySubscribers({
      type: 'session:started',
      sessionId,
      userId,
      timestamp: new Date(),
    });

    return sessionId;
  }

  /**
   * End the current learning session
   * @returns {Promise<Object>} - Session summary
   */
  async endSession() {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    const endTime = new Date();
    const duration = Date.now() - this.sessionStartTime;

    const sessionSummary = {
      ...this.currentSession,
      endTime,
      duration,
      activitiesCompleted: this.currentSession.activities.length,
      totalScore: this.currentSession.activities.reduce(
        (sum, activity) => sum + (activity.score || 0),
        0
      ),
    };

    // Update session in database
    await dbService.update(STORES.SESSIONS, sessionSummary);

    logger.info(`Ended session ${this.currentSession.id}, duration: ${duration}ms`);

    this._notifySubscribers({
      type: 'session:ended',
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      summary: sessionSummary,
      timestamp: endTime,
    });

    const result = { ...sessionSummary };
    this.currentSession = null;
    this.sessionStartTime = null;

    return result;
  }

  /**
   * Track activity start
   * @param {string} userId - User ID
   * @param {string} activityId - Activity ID
   * @param {Object} metadata - Additional activity metadata
   * @returns {Promise<string>} - Progress record ID
   */
  async trackActivityStart(userId, activityId, metadata = {}) {
    const progressData = {
      id: generateId('progress'),
      userId,
      activityId,
      subject: metadata.subject || 'unknown',
      status: 'started',
      startTime: new Date(),
      score: 0,
      completion: 0,
      timeSpent: 0,
      attempts: 1,
      data: {
        ...metadata,
        sessionId: this.currentSession?.id,
      },
    };

    // Validate data
    const errors = VALIDATION_SCHEMAS.PROGRESS
      ? // eslint-disable-next-line no-undef
      require('../database/schema.js').validateData(progressData, VALIDATION_SCHEMAS.PROGRESS)
      : [];

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    await dbService.add(STORES.PROGRESS, progressData);

    // Add to current session if active
    if (this.currentSession) {
      this.currentSession.activities.push({
        activityId,
        startTime: progressData.startTime,
        progressId: progressData.id,
      });
    }

    logger.debug(`Started tracking activity ${activityId} for user ${userId}`);

    this._notifySubscribers({
      type: 'activity:started',
      userId,
      activityId,
      progressId: progressData.id,
      timestamp: new Date(),
    });

    return progressData.id;
  }

  /**
   * Update activity progress
   * @param {string} progressId - Progress record ID
   * @param {Object} updates - Progress updates
   * @returns {Promise<boolean>} - Success status
   */
  async updateActivityProgress(progressId, updates) {
    const currentProgress = await dbService.get(STORES.PROGRESS, progressId);

    if (!currentProgress) {
      throw new Error(`Progress record ${progressId} not found`);
    }

    const updatedProgress = {
      ...currentProgress,
      ...updates,
      lastUpdated: new Date(),
      timeSpent: updates.timeSpent || currentProgress.timeSpent,
    };

    // Ensure completion is between 0 and 100
    if (updatedProgress.completion !== undefined) {
      updatedProgress.completion = Math.max(0, Math.min(100, updatedProgress.completion));
    }

    await dbService.update(STORES.PROGRESS, updatedProgress);

    this._invalidateCache(currentProgress.userId);

    logger.debug(`Updated progress ${progressId}:`, updates);

    this._notifySubscribers({
      type: 'activity:progress',
      progressId,
      userId: currentProgress.userId,
      activityId: currentProgress.activityId,
      updates,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Complete an activity
   * @param {string} progressId - Progress record ID
   * @param {Object} completionData - Final completion data
   * @returns {Promise<Object>} - Completion summary
   */
  async completeActivity(progressId, completionData = {}) {
    const currentProgress = await dbService.get(STORES.PROGRESS, progressId);

    if (!currentProgress) {
      throw new Error(`Progress record ${progressId} not found`);
    }

    const completionTime = new Date();
    const totalTime = completionTime - new Date(currentProgress.startTime);

    const completedProgress = {
      ...currentProgress,
      ...completionData,
      status: 'completed',
      completion: 100,
      endTime: completionTime,
      timeSpent: totalTime,
      timestamp: completionTime,
    };

    await dbService.update(STORES.PROGRESS, completedProgress);

    // Update current session activity
    if (this.currentSession) {
      const sessionActivity = this.currentSession.activities.find(a => a.progressId === progressId);
      if (sessionActivity) {
        sessionActivity.endTime = completionTime;
        sessionActivity.score = completedProgress.score;
        sessionActivity.timeSpent = totalTime;
      }
    }

    this._invalidateCache(currentProgress.userId);

    const summary = {
      userId: currentProgress.userId,
      activityId: currentProgress.activityId,
      subject: currentProgress.subject,
      score: completedProgress.score,
      timeSpent: totalTime,
      completedAt: completionTime,
    };

    logger.info(
      `Completed activity ${currentProgress.activityId} for user ${currentProgress.userId}`
    );

    this._notifySubscribers({
      type: 'activity:completed',
      progressId,
      ...summary,
      timestamp: completionTime,
    });

    return summary;
  }

  /**
   * Get user's progress for a specific subject
   * @param {string} userId - User ID
   * @param {string} subject - Subject name
   * @returns {Promise<Object>} - Progress summary
   */
  async getSubjectProgress(userId, subject) {
    const cacheKey = `${userId}_${subject}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        // 1 minute cache
        return cached.data;
      }
    }

    const progressRecords = await dbService.queryByIndex(STORES.PROGRESS, 'userActivity', [
      userId,
      subject,
    ]);

    const completedActivities = progressRecords.filter(p => p.status === 'completed');
    const inProgressActivities = progressRecords.filter(p => p.status === 'started');

    const totalScore = completedActivities.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTime = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const averageScore =
      completedActivities.length > 0 ? totalScore / completedActivities.length : 0;

    const progressSummary = {
      userId,
      subject,
      totalActivities: progressRecords.length,
      completedActivities: completedActivities.length,
      inProgressActivities: inProgressActivities.length,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTimeSpent: totalTime,
      completionRate:
        progressRecords.length > 0
          ? (completedActivities.length / progressRecords.length) * 100
          : 0,
      lastActivity:
        progressRecords.length > 0
          ? Math.max(...progressRecords.map(p => new Date(p.timestamp).getTime()))
          : null,
      recentActivities: progressRecords
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5),
    };

    // Cache the result
    this.cache.set(cacheKey, {
      data: progressSummary,
      timestamp: Date.now(),
    });

    return progressSummary;
  }

  /**
   * Get overall user progress across all subjects
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Overall progress summary
   */
  async getUserProgress(userId) {
    const allProgress = await dbService.queryByIndex(STORES.PROGRESS, 'userId', userId);

    if (allProgress.length === 0) {
      return {
        userId,
        totalActivities: 0,
        completedActivities: 0,
        subjects: {},
        overall: {
          completion: 0,
          averageScore: 0,
          totalTime: 0,
          streak: 0,
        },
      };
    }

    // Group by subject
    const subjectGroups = allProgress.reduce((groups, progress) => {
      const subject = progress.subject;
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(progress);
      return groups;
    }, {});

    // Calculate subject-specific progress
    const subjects = {};
    for (const [subject, records] of Object.entries(subjectGroups)) {
      const completed = records.filter(r => r.status === 'completed');
      subjects[subject] = {
        total: records.length,
        completed: completed.length,
        completion: records.length > 0 ? (completed.length / records.length) * 100 : 0,
        averageScore:
          completed.length > 0
            ? completed.reduce((sum, r) => sum + (r.score || 0), 0) / completed.length
            : 0,
        totalTime: records.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      };
    }

    // Calculate overall metrics
    const completedTotal = allProgress.filter(p => p.status === 'completed');
    const totalScore = completedTotal.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTime = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    // Calculate learning streak (consecutive days with activity)
    const streak = this._calculateStreak(userId, allProgress);

    return {
      userId,
      totalActivities: allProgress.length,
      completedActivities: completedTotal.length,
      subjects,
      overall: {
        completion: allProgress.length > 0 ? (completedTotal.length / allProgress.length) * 100 : 0,
        averageScore: completedTotal.length > 0 ? totalScore / completedTotal.length : 0,
        totalTime,
        streak,
      },
      lastActivity:
        allProgress.length > 0
          ? Math.max(...allProgress.map(p => new Date(p.timestamp).getTime()))
          : null,
    };
  }

  /**
   * Get user's learning streak
   * @param {string} userId - User ID
   * @param {Array} progressRecords - Optional pre-fetched progress records
   * @returns {number} - Current streak in days
   * @private
   */
  _calculateStreak(userId, progressRecords = null) {
    if (!progressRecords) {
      // This would need to be async, but keeping sync for now
      return 0;
    }

    const completedActivities = progressRecords
      .filter(p => p.status === 'completed')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (completedActivities.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const activityDates = [
      ...new Set(
        completedActivities.map(p => {
          const date = new Date(p.timestamp);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      ),
    ].sort((a, b) => b - a);

    for (const activityDate of activityDates) {
      const daysDiff = Math.floor((currentDate.getTime() - activityDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++;
        currentDate = new Date(activityDate);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Subscribe to progress events
   * @param {Function} callback - Event callback
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of progress events
   * @private
   */
  _notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in progress subscriber:', error);
      }
    });
  }

  /**
   * Invalidate cache for a user
   * @private
   */
  _invalidateCache(userId) {
    if (!userId) return;

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get progress analytics for a user
   * @param {string} userId - User ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} - Analytics data
   */
  async getAnalytics(userId, options = {}) {
    const { timeRange = 30, groupBy = 'day' } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const progressRecords = await dbService.queryByIndex(STORES.PROGRESS, 'userId', userId);

    const filteredRecords = progressRecords.filter(p => {
      const recordDate = new Date(p.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Group data by time period
    const grouped = this._groupProgressByTime(filteredRecords, groupBy);

    return {
      userId,
      timeRange,
      groupBy,
      totalRecords: filteredRecords.length,
      analytics: grouped,
      trends: this._calculateTrends(grouped),
    };
  }

  /**
   * Group progress records by time period
   * @private
   */
  _groupProgressByTime(records, groupBy) {
    const groups = {};

    records.forEach(record => {
      const date = new Date(record.timestamp);
      let key;

      switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = {
          date: key,
          activities: 0,
          completed: 0,
          totalScore: 0,
          totalTime: 0,
          subjects: {},
        };
      }

      const group = groups[key];
      group.activities++;

      if (record.status === 'completed') {
        group.completed++;
        group.totalScore += record.score || 0;
      }

      group.totalTime += record.timeSpent || 0;

      if (!group.subjects[record.subject]) {
        group.subjects[record.subject] = 0;
      }
      group.subjects[record.subject]++;
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate trends from grouped data
   * @private
   */
  _calculateTrends(groupedData) {
    if (groupedData.length < 2) {
      return { activities: 0, completion: 0, score: 0 };
    }

    const recent = groupedData.slice(-7); // Last 7 periods
    const previous = groupedData.slice(-14, -7); // Previous 7 periods

    const recentAvg = {
      activities: recent.reduce((sum, g) => sum + g.activities, 0) / recent.length,
      completion:
        recent.reduce((sum, g) => sum + (g.completed / g.activities || 0), 0) / recent.length,
      score: recent.reduce((sum, g) => sum + (g.totalScore / g.completed || 0), 0) / recent.length,
    };

    const previousAvg = {
      activities: previous.reduce((sum, g) => sum + g.activities, 0) / previous.length,
      completion:
        previous.reduce((sum, g) => sum + (g.completed / g.activities || 0), 0) / previous.length,
      score:
        previous.reduce((sum, g) => sum + (g.totalScore / g.completed || 0), 0) / previous.length,
    };

    return {
      activities: ((recentAvg.activities - previousAvg.activities) / previousAvg.activities) * 100,
      completion: ((recentAvg.completion - previousAvg.completion) / previousAvg.completion) * 100,
      score: ((recentAvg.score - previousAvg.score) / previousAvg.score) * 100,
    };
  }

  /**
   * Export user progress data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Exported progress data
   */
  async exportUserProgress(userId) {
    const [progress, sessions] = await Promise.all([
      dbService.queryByIndex(STORES.PROGRESS, 'userId', userId),
      dbService.queryByIndex(STORES.SESSIONS, 'userId', userId),
    ]);

    return {
      userId,
      exportedAt: new Date(),
      progress,
      sessions,
      summary: await this.getUserProgress(userId),
    };
  }

  /**
   * Clean up old progress data
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<number>} - Number of records deleted
   */
  async cleanupOldData(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const allProgress = await dbService.getAll(STORES.PROGRESS);
    const oldProgress = allProgress.filter(p => new Date(p.timestamp) < cutoffDate);

    let deletedCount = 0;
    for (const progress of oldProgress) {
      await dbService.delete(STORES.PROGRESS, progress.id);
      deletedCount++;
    }

    logger.info(`Cleaned up ${deletedCount} old progress records`);
    return deletedCount;
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.unsubscribeDb) {
      this.unsubscribeDb();
    }
    this.cache.clear();
    this.subscribers.clear();
    this.currentSession = null;
  }
}

// Create and export singleton instance
export const progressService = new ProgressService();
