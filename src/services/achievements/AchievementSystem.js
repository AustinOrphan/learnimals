/**
 * Achievement System
 * Manages user achievements, badges, and gamification features
 */

import { dbService } from '../database/IndexedDBService.js';
import { progressService } from '../progress/ProgressService.js';
import { STORES, generateId } from '../database/schema.js';
import logger from '../../utils/logger.js';

export class AchievementSystem {
  constructor() {
    this.achievementDefinitions = new Map();
    this.subscribers = new Set();
    this.unlockedAchievements = new Map(); // Cache for quick lookups
    this.progressUnsubscribe = null;
  }

  /**
   * Initialize the achievement system
   */
  async initialize() {
    await dbService.initialize();

    // Subscribe to progress events
    this.progressUnsubscribe = progressService.subscribe(event => {
      this._handleProgressEvent(event);
    });

    // Load default achievements
    this._loadDefaultAchievements();

    // Load user achievements into cache
    await this._loadUserAchievements();

    logger.info('AchievementSystem initialized');
  }

  /**
   * Load default achievement definitions
   * @private
   */
  _loadDefaultAchievements() {
    const achievements = [
      // First Steps Achievements
      {
        id: 'first_activity',
        type: 'milestone',
        title: 'First Steps',
        description: 'Complete your first learning activity',
        icon: '🎯',
        points: 10,
        rarity: 'common',
        criteria: {
          type: 'activity_count',
          threshold: 1,
        },
      },
      {
        id: 'first_perfect_score',
        type: 'performance',
        title: 'Perfect!',
        description: 'Get a perfect score on any activity',
        icon: '⭐',
        points: 25,
        rarity: 'uncommon',
        criteria: {
          type: 'perfect_score',
          threshold: 1,
        },
      },

      // Subject-Specific Achievements
      {
        id: 'math_beginner',
        type: 'subject',
        subject: 'math',
        title: 'Math Explorer',
        description: 'Complete 5 math activities',
        icon: '🔢',
        points: 50,
        rarity: 'common',
        criteria: {
          type: 'subject_activities',
          subject: 'math',
          threshold: 5,
        },
      },
      {
        id: 'science_beginner',
        type: 'subject',
        subject: 'science',
        title: 'Young Scientist',
        description: 'Complete 5 science activities',
        icon: '🔬',
        points: 50,
        rarity: 'common',
        criteria: {
          type: 'subject_activities',
          subject: 'science',
          threshold: 5,
        },
      },
      {
        id: 'reading_beginner',
        type: 'subject',
        subject: 'reading',
        title: 'Bookworm',
        description: 'Complete 5 reading activities',
        icon: '📚',
        points: 50,
        rarity: 'common',
        criteria: {
          type: 'subject_activities',
          subject: 'reading',
          threshold: 5,
        },
      },
      {
        id: 'art_beginner',
        type: 'subject',
        subject: 'art',
        title: 'Creative Mind',
        description: 'Complete 5 art activities',
        icon: '🎨',
        points: 50,
        rarity: 'common',
        criteria: {
          type: 'subject_activities',
          subject: 'art',
          threshold: 5,
        },
      },

      // Streak Achievements
      {
        id: 'streak_3',
        type: 'streak',
        title: 'Getting Started',
        description: 'Learn for 3 days in a row',
        icon: '🔥',
        points: 75,
        rarity: 'uncommon',
        criteria: {
          type: 'streak',
          threshold: 3,
        },
      },
      {
        id: 'streak_7',
        type: 'streak',
        title: 'Week Warrior',
        description: 'Learn for 7 days in a row',
        icon: '💪',
        points: 150,
        rarity: 'rare',
        criteria: {
          type: 'streak',
          threshold: 7,
        },
      },
      {
        id: 'streak_30',
        type: 'streak',
        title: 'Learning Legend',
        description: 'Learn for 30 days in a row',
        icon: '👑',
        points: 500,
        rarity: 'legendary',
        criteria: {
          type: 'streak',
          threshold: 30,
        },
      },

      // Performance Achievements
      {
        id: 'high_scorer',
        type: 'performance',
        title: 'High Scorer',
        description: 'Achieve an average score of 90% or higher',
        icon: '🏆',
        points: 100,
        rarity: 'rare',
        criteria: {
          type: 'average_score',
          threshold: 90,
          minimum_activities: 10,
        },
      },
      {
        id: 'speed_learner',
        type: 'performance',
        title: 'Speed Learner',
        description: 'Complete 10 activities in under 5 minutes each',
        icon: '⚡',
        points: 75,
        rarity: 'uncommon',
        criteria: {
          type: 'fast_completion',
          threshold: 10,
          max_time: 300000, // 5 minutes in milliseconds
        },
      },

      // Special Achievements
      {
        id: 'early_bird',
        type: 'special',
        title: 'Early Bird',
        description: 'Complete activities in the morning (6-9 AM)',
        icon: '🌅',
        points: 50,
        rarity: 'uncommon',
        criteria: {
          type: 'time_of_day',
          start_hour: 6,
          end_hour: 9,
          threshold: 5,
        },
      },
      {
        id: 'night_owl',
        type: 'special',
        title: 'Night Owl',
        description: 'Complete activities in the evening (6-9 PM)',
        icon: '🦉',
        points: 50,
        rarity: 'uncommon',
        criteria: {
          type: 'time_of_day',
          start_hour: 18,
          end_hour: 21,
          threshold: 5,
        },
      },

      // Mastery Achievements
      {
        id: 'subject_master_math',
        type: 'mastery',
        subject: 'math',
        title: 'Math Master',
        description: 'Complete 50 math activities with 80%+ average score',
        icon: '🧮',
        points: 300,
        rarity: 'epic',
        criteria: {
          type: 'subject_mastery',
          subject: 'math',
          activities: 50,
          average_score: 80,
        },
      },
      {
        id: 'all_rounder',
        type: 'mastery',
        title: 'All-Rounder',
        description: 'Complete activities in all 4 subjects',
        icon: '🌟',
        points: 200,
        rarity: 'rare',
        criteria: {
          type: 'all_subjects',
          subjects: ['math', 'science', 'reading', 'art'],
          min_per_subject: 3,
        },
      },
    ];

    achievements.forEach(achievement => {
      this.achievementDefinitions.set(achievement.id, achievement);
    });

    logger.debug(`Loaded ${achievements.length} achievement definitions`);
  }

  /**
   * Load user achievements into cache
   * @private
   */
  async _loadUserAchievements() {
    try {
      const allAchievements = await dbService.getAll(STORES.ACHIEVEMENTS);

      allAchievements.forEach(achievement => {
        if (!this.unlockedAchievements.has(achievement.userId)) {
          this.unlockedAchievements.set(achievement.userId, new Set());
        }
        this.unlockedAchievements.get(achievement.userId).add(achievement.type);
      });

      logger.debug(`Loaded ${allAchievements.length} user achievements into cache`);
    } catch (error) {
      logger.error('Failed to load user achievements:', error);
    }
  }

  /**
   * Handle progress events to check for new achievements
   * @private
   */
  async _handleProgressEvent(event) {
    if (!event.userId) return;

    try {
      switch (event.type) {
      case 'activity:completed':
        await this._checkActivityAchievements(event.userId, event);
        break;
      case 'session:ended':
        await this._checkSessionAchievements(event.userId, event);
        break;
      }
    } catch (error) {
      logger.error('Error handling progress event for achievements:', error);
    }
  }

  /**
   * Check for achievements after activity completion
   * @private
   */
  async _checkActivityAchievements(userId, event) {
    const userProgress = await progressService.getUserProgress(userId);

    // Check all achievement definitions
    for (const [achievementId, definition] of this.achievementDefinitions) {
      if (await this._hasAchievement(userId, achievementId)) {
        continue; // Already unlocked
      }

      const isUnlocked = await this._evaluateAchievementCriteria(definition, userProgress, event);

      if (isUnlocked) {
        await this._unlockAchievement(userId, achievementId);
      }
    }
  }

  /**
   * Check for achievements after session end
   * @private
   */
  async _checkSessionAchievements(userId, event) {
    // Session-specific achievements can be checked here
    // For now, delegate to activity achievements
    await this._checkActivityAchievements(userId, event);
  }

  /**
   * Evaluate whether achievement criteria are met
   * @private
   */
  async _evaluateAchievementCriteria(definition, userProgress, _event) {
    const { criteria } = definition;

    switch (criteria.type) {
    case 'activity_count':
      return userProgress.totalActivities >= criteria.threshold;

    case 'perfect_score': {
      // Check if any completed activity has perfect score
      const allProgress = await dbService.queryByIndex(
        STORES.PROGRESS,
        'userId',
        userProgress.userId
      );
      return allProgress.some(p => p.status === 'completed' && p.score >= 100);
    }

    case 'subject_activities': {
      const subjectProgress = userProgress.subjects[criteria.subject];
      return subjectProgress && subjectProgress.completed >= criteria.threshold;
    }

    case 'streak':
      return userProgress.overall.streak >= criteria.threshold;

    case 'average_score':
      return (
        userProgress.completedActivities >= criteria.minimum_activities &&
          userProgress.overall.averageScore >= criteria.threshold
      );

    case 'fast_completion': {
      const fastActivities = await this._countFastCompletions(
        userProgress.userId,
        criteria.max_time
      );
      return fastActivities >= criteria.threshold;
    }

    case 'time_of_day': {
      const timeActivities = await this._countTimeOfDayActivities(
        userProgress.userId,
        criteria.start_hour,
        criteria.end_hour
      );
      return timeActivities >= criteria.threshold;
    }

    case 'subject_mastery': {
      const masterySubject = userProgress.subjects[criteria.subject];
      return (
        masterySubject &&
          masterySubject.completed >= criteria.activities &&
          masterySubject.averageScore >= criteria.average_score
      );
    }

    case 'all_subjects':
      return criteria.subjects.every(subject => {
        const subjectData = userProgress.subjects[subject];
        return subjectData && subjectData.completed >= criteria.min_per_subject;
      });

    default:
      logger.warn(`Unknown achievement criteria type: ${criteria.type}`);
      return false;
    }
  }

  /**
   * Count activities completed within time limit
   * @private
   */
  async _countFastCompletions(userId, maxTime) {
    const allProgress = await dbService.queryByIndex(STORES.PROGRESS, 'userId', userId);
    return allProgress.filter(
      p => p.status === 'completed' && p.timeSpent && p.timeSpent <= maxTime
    ).length;
  }

  /**
   * Count activities completed during specific time of day
   * @private
   */
  async _countTimeOfDayActivities(userId, startHour, endHour) {
    const allProgress = await dbService.queryByIndex(STORES.PROGRESS, 'userId', userId);
    return allProgress.filter(p => {
      if (p.status !== 'completed' || !p.timestamp) return false;

      const completionHour = new Date(p.timestamp).getHours();
      return completionHour >= startHour && completionHour <= endHour;
    }).length;
  }

  /**
   * Unlock an achievement for a user
   * @private
   */
  async _unlockAchievement(userId, achievementId) {
    const definition = this.achievementDefinitions.get(achievementId);
    if (!definition) {
      logger.error(`Achievement definition not found: ${achievementId}`);
      return;
    }

    const achievement = {
      id: generateId('achievement'),
      userId,
      type: achievementId,
      subject: definition.subject || null,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      points: definition.points,
      rarity: definition.rarity,
      unlockedAt: new Date(),
      metadata: {
        definition: definition.id,
      },
    };

    await dbService.add(STORES.ACHIEVEMENTS, achievement);

    // Update cache
    if (!this.unlockedAchievements.has(userId)) {
      this.unlockedAchievements.set(userId, new Set());
    }
    this.unlockedAchievements.get(userId).add(achievementId);

    logger.info(`Achievement unlocked: ${definition.title} for user ${userId}`);

    // Notify subscribers
    this._notifySubscribers({
      type: 'achievement:unlocked',
      userId,
      achievement,
      timestamp: new Date(),
    });

    // Show notification to user
    this._showAchievementNotification(achievement);
  }

  /**
   * Show achievement notification
   * @private
   */
  _showAchievementNotification(achievement) {
    // Create a toast notification for the achievement
    const notification = {
      type: 'achievement',
      title: '🎉 Achievement Unlocked!',
      message: `${achievement.icon} ${achievement.title}`,
      description: achievement.description,
      points: achievement.points,
      duration: 5000,
      actions: [
        {
          label: 'View All',
          action: () => this._openAchievementsPage(),
        },
      ],
    };

    // Emit notification event
    this._notifySubscribers({
      type: 'notification:show',
      notification,
      timestamp: new Date(),
    });
  }

  /**
   * Check if user has specific achievement
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<boolean>}
   */
  async _hasAchievement(userId, achievementId) {
    const userAchievements = this.unlockedAchievements.get(userId);
    return userAchievements && userAchievements.has(achievementId);
  }

  /**
   * Get all achievements for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - User's achievements
   */
  async getUserAchievements(userId) {
    const achievements = await dbService.queryByIndex(STORES.ACHIEVEMENTS, 'userId', userId);

    return achievements
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .map(achievement => ({
        ...achievement,
        isRecent: Date.now() - new Date(achievement.unlockedAt).getTime() < 24 * 60 * 60 * 1000,
      }));
  }

  /**
   * Get achievement progress for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Achievement progress summary
   */
  async getAchievementProgress(userId) {
    const userAchievements = await this.getUserAchievements(userId);
    const userProgress = await progressService.getUserProgress(userId);

    const progressByType = {};
    const availableAchievements = [];

    // Check progress for each achievement definition
    for (const [achievementId, definition] of this.achievementDefinitions) {
      const isUnlocked = await this._hasAchievement(userId, achievementId);

      if (!isUnlocked) {
        const progress = await this._calculateAchievementProgress(definition, userProgress);
        availableAchievements.push({
          ...definition,
          progress,
          isUnlocked: false,
        });
      }

      // Group by type
      if (!progressByType[definition.type]) {
        progressByType[definition.type] = {
          total: 0,
          unlocked: 0,
          points: 0,
        };
      }

      progressByType[definition.type].total++;
      if (isUnlocked) {
        progressByType[definition.type].unlocked++;
        progressByType[definition.type].points += definition.points;
      }
    }

    const totalPoints = userAchievements.reduce((sum, a) => sum + a.points, 0);
    const totalPossiblePoints = Array.from(this.achievementDefinitions.values()).reduce(
      (sum, def) => sum + def.points,
      0
    );

    return {
      userId,
      totalAchievements: userAchievements.length,
      totalPossibleAchievements: this.achievementDefinitions.size,
      totalPoints,
      totalPossiblePoints,
      completionPercentage: (userAchievements.length / this.achievementDefinitions.size) * 100,
      byType: progressByType,
      recentAchievements: userAchievements.filter(a => a.isRecent),
      availableAchievements: availableAchievements
        .filter(a => a.progress.percentage > 0)
        .sort((a, b) => b.progress.percentage - a.progress.percentage)
        .slice(0, 5), // Show top 5 in-progress achievements
    };
  }

  /**
   * Calculate progress towards an achievement
   * @private
   */
  async _calculateAchievementProgress(definition, userProgress) {
    const { criteria } = definition;
    let current = 0;
    let total = criteria.threshold || 1;
    let percentage = 0;

    switch (criteria.type) {
    case 'activity_count':
      current = userProgress.totalActivities;
      total = criteria.threshold;
      break;

    case 'subject_activities': {
      const subjectProgress = userProgress.subjects[criteria.subject];
      current = subjectProgress ? subjectProgress.completed : 0;
      total = criteria.threshold;
      break;
    }

    case 'streak':
      current = userProgress.overall.streak;
      total = criteria.threshold;
      break;

    case 'average_score':
      if (userProgress.completedActivities >= criteria.minimum_activities) {
        current = Math.min(userProgress.overall.averageScore, criteria.threshold);
        total = criteria.threshold;
      }
      break;

      // Add more progress calculations as needed
    }

    percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

    return {
      current,
      total,
      percentage: Math.round(percentage),
      isComplete: percentage >= 100,
    };
  }

  /**
   * Get leaderboard data
   * @param {Object} options - Leaderboard options
   * @returns {Promise<Array>} - Leaderboard data
   */
  async getLeaderboard(options = {}) {
    const { type = 'points', limit = 10, timeframe = 'all' } = options;

    const allAchievements = await dbService.getAll(STORES.ACHIEVEMENTS);

    // Filter by timeframe if specified
    let filteredAchievements = allAchievements;
    if (timeframe !== 'all') {
      const cutoffDate = new Date();
      switch (timeframe) {
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      }
      filteredAchievements = allAchievements.filter(a => new Date(a.unlockedAt) >= cutoffDate);
    }

    // Group by user and calculate totals
    const userTotals = {};
    filteredAchievements.forEach(achievement => {
      if (!userTotals[achievement.userId]) {
        userTotals[achievement.userId] = {
          userId: achievement.userId,
          points: 0,
          achievements: 0,
          latestAchievement: null,
        };
      }

      userTotals[achievement.userId].points += achievement.points;
      userTotals[achievement.userId].achievements++;

      if (
        !userTotals[achievement.userId].latestAchievement ||
        new Date(achievement.unlockedAt) >
          new Date(userTotals[achievement.userId].latestAchievement)
      ) {
        userTotals[achievement.userId].latestAchievement = achievement.unlockedAt;
      }
    });

    // Sort and limit results
    const sortKey = type === 'points' ? 'points' : 'achievements';
    return Object.values(userTotals)
      .sort((a, b) => b[sortKey] - a[sortKey])
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  }

  /**
   * Add custom achievement definition
   * @param {Object} definition - Achievement definition
   */
  addAchievementDefinition(definition) {
    if (!definition.id || !definition.title || !definition.criteria) {
      throw new Error('Achievement definition must have id, title, and criteria');
    }

    this.achievementDefinitions.set(definition.id, {
      type: 'custom',
      points: 50,
      rarity: 'common',
      icon: '🏅',
      ...definition,
    });

    logger.info(`Added custom achievement: ${definition.title}`);
  }

  /**
   * Subscribe to achievement events
   * @param {Function} callback - Event callback
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of achievement events
   * @private
   */
  _notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('Error in achievement subscriber:', error);
      }
    });
  }

  /**
   * Open achievements page (placeholder)
   * @private
   */
  _openAchievementsPage() {
    // This would navigate to achievements page
    logger.info('Opening achievements page');
  }

  /**
   * Export user achievements
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Exported achievement data
   */
  async exportUserAchievements(userId) {
    const achievements = await this.getUserAchievements(userId);
    const progress = await this.getAchievementProgress(userId);

    return {
      userId,
      exportedAt: new Date(),
      achievements,
      progress,
    };
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.progressUnsubscribe) {
      this.progressUnsubscribe();
    }
    this.subscribers.clear();
    this.unlockedAchievements.clear();
  }
}

// Create and export singleton instance
export const achievementSystem = new AchievementSystem();
