/**
 * ProgressService - High-level API for tracking user progress across all activities
 * 
 * This service provides a clean, unified interface for progress tracking that builds
 * on the existing UserProgress and EnhancedProgressTracker infrastructure.
 * 
 * Key Features:
 * - Activity tracking (start/complete)
 * - Subject progress calculation
 * - Streak tracking
 * - Achievement checking
 * - Progress analytics
 * - Data export capabilities
 * - Event-driven architecture
 * 
 * @author Claude Code Assistant
 * @version 1.0.0
 * @see Issue #225
 */

// Import dependencies
import userProgress from '../features/user/userProgress.js';
import enhancedProgressTracker from './EnhancedProgressTracker.js';

class ProgressService {
  constructor(options = {}) {
    this.userProgress = options.userProgress || userProgress;
    this.enhancedTracker = options.enhancedTracker || enhancedProgressTracker;
    this.eventListeners = new Map();
    this.sessionId = this.generateSessionId();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.cacheCleanupInterval = null; // Store interval ID for cleanup
    this.documentListeners = []; // Track document listeners for cleanup
    
    this.init();
  }

  /**
   * Initialize the service
   */
  init() {
    // Set up event forwarding from underlying services
    this.setupEventForwarding();
    
    // Initialize cache cleanup interval
    this.clearExpiredCache();
    this.cacheCleanupInterval = setInterval(() => this.clearExpiredCache(), this.cacheExpiry);
  }

  /**
   * Generate a unique session ID for tracking
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up event forwarding from underlying services
   */
  setupEventForwarding() {
    // Forward events from UserProgress with tracked listeners
    const userDataHandler = (event) => {
      this.emit('progress:updated', event.detail);
    };
    const achievementHandler = (event) => {
      this.emit('achievement:unlocked', event.detail);
    };
    
    document.addEventListener('userDataUpdated', userDataHandler);
    document.addEventListener('achievementUnlocked', achievementHandler);
    
    // Track listeners for cleanup
    this.documentListeners.push(
      { type: 'userDataUpdated', handler: userDataHandler },
      { type: 'achievementUnlocked', handler: achievementHandler }
    );
  }

  /**
   * Clean up all resources and event listeners
   * Call this when the service is no longer needed
   */
  destroy() {
    // Clear cache cleanup interval
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    
    // Remove all document event listeners
    this.documentListeners.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler);
    });
    this.documentListeners = [];
    
    // Clear all event listeners
    this.eventListeners.clear();
    
    // Clear cache
    this.clearCache();
    
    // Clear references
    this.userProgress = null;
    this.enhancedTracker = null;
  }

  // ============================================================================
  // CORE ACTIVITY TRACKING API
  // ============================================================================

  /**
   * Track the start of an activity
   * @param {string} activityId - Unique identifier for the activity
   * @param {string} subjectId - Subject (math, reading, science, art, etc.)
   * @param {Object} metadata - Additional activity metadata
   * @returns {Promise<boolean>} Success status
   */
  async trackActivityStart(activityId, subjectId, metadata = {}) {
    // Input validation
    if (!activityId || typeof activityId !== 'string') {
      throw new Error('Valid activityId is required');
    }
    if (!subjectId || typeof subjectId !== 'string') {
      throw new Error('Valid subjectId is required');
    }
    
    try {
      const startTime = Date.now();
      
      // Create activity session record
      const session = {
        activityId,
        subjectId,
        sessionId: this.sessionId,
        startTime,
        metadata,
        status: 'in-progress'
      };
      
      // Store in cache for quick access
      this.setCache(`session_${activityId}`, session);
      
      // Track with enhanced tracker
      this.enhancedTracker.trackGameSession({
        gameId: activityId,
        subject: subjectId,
        sessionStart: new Date(startTime),
        ...metadata
      });
      
      // Emit event
      this.emit('activity:started', {
        activityId,
        subjectId,
        sessionId: this.sessionId,
        timestamp: startTime,
        metadata
      });
      
      return true;
    } catch (error) {
      console.error('Error tracking activity start:', error);
      return false;
    }
  }

  /**
   * Track the completion of an activity
   * @param {string} activityId - Unique identifier for the activity
   * @param {number} score - Score achieved (0-100)
   * @param {number} timeSpent - Time spent in milliseconds
   * @param {Object} metadata - Additional completion metadata
   * @returns {Promise<boolean>} Success status
   */
  async trackActivityComplete(activityId, score, timeSpent, metadata = {}) {
    // Input validation
    if (!activityId || typeof activityId !== 'string') {
      throw new Error('Valid activityId is required');
    }
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }
    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      throw new Error('TimeSpent must be a positive number');
    }
    
    try {
      const completionTime = Date.now();
      
      // Get session from cache
      const session = this.getCache(`session_${activityId}`);
      if (!session) {
        console.warn(`No session found for activity ${activityId}`);
      }
      
      const subjectId = session?.subjectId || metadata.subjectId || 'general';
      
      // Update appropriate subject progress
      const progressData = {
        score,
        timeSpent,
        completedAt: completionTime,
        sessionId: this.sessionId,
        ...metadata
      };
      
      await this.updateSubjectProgress(subjectId, progressData);
      
      // Track with enhanced tracker
      this.enhancedTracker.trackGameSession({
        gameId: activityId,
        subject: subjectId,
        score,
        timeSpent: timeSpent / 1000, // Convert to seconds
        sessionEnd: new Date(completionTime)
      });
      
      // Check achievements
      await this.checkAchievements({ activityId, subjectId, score, timeSpent });
      
      // Update streak
      await this.updateStreak();
      
      // Check if this is the first completion of this activity
      const isFirstCompletion = this.isFirstActivityCompletion(activityId);
      
      // Clear session cache
      this.removeCache(`session_${activityId}`);
      
      // Emit completion event
      this.emit('activity:completed', {
        activityId,
        subjectId,
        score,
        timeSpent,
        sessionId: this.sessionId,
        timestamp: completionTime,
        metadata,
        isFirstCompletion
      });
      
      return true;
    } catch (error) {
      console.error('Error tracking activity completion:', error);
      return false;
    }
  }

  /**
   * Check if this is the first time an activity has been completed
   * @param {string} activityId - Activity identifier
   * @returns {boolean} True if this is the first completion
   */
  isFirstActivityCompletion(activityId) {
    try {
      const userData = this.userProgress.userData;
      if (!userData || !userData.progress) {
        return true; // No progress data means first completion
      }
      
      // Check across all subjects for any record of this activity
      for (const subjectData of Object.values(userData.progress)) {
        if (subjectData.completedActivities && 
            subjectData.completedActivities.includes(activityId)) {
          return false; // Found previous completion
        }
        
        // Also check in activities array if it exists
        if (subjectData.activities && 
            subjectData.activities.find(a => a.id === activityId && a.completed)) {
          return false; // Found previous completion
        }
      }
      
      return true; // No previous completion found
    } catch (error) {
      console.error('Error checking first completion:', error);
      return true; // Default to true on error
    }
  }

  // ============================================================================
  // SUBJECT PROGRESS API
  // ============================================================================

  /**
   * Get progress data for a specific subject
   * @param {string} subjectId - Subject identifier
   * @returns {Promise<Object>} Subject progress data
   */
  async getSubjectProgress(subjectId) {
    // Input validation
    if (!subjectId || typeof subjectId !== 'string') {
      throw new Error('Valid subjectId is required');
    }
    
    try {
      const cacheKey = `subject_progress_${subjectId}`;
      
      // Check cache first
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Calculate fresh progress data
      const progress = this.calculateSubjectProgress(subjectId);
      
      // Cache the result
      this.setCache(cacheKey, progress);
      
      return progress;
    } catch (error) {
      console.error(`Error getting subject progress for ${subjectId}:`, error);
      return null;
    }
  }

  /**
   * Get progress data for all subjects
   * @returns {Promise<Object>} All subjects progress data
   */
  async getAllSubjectsProgress() {
    try {
      // Get subjects dynamically from user progress data
      const userData = this.userProgress.userData;
      const subjects = userData && userData.progress 
        ? Object.keys(userData.progress)
        : ['math', 'reading', 'science', 'art', 'coding']; // Fallback to default subjects
      
      // Run progress fetching in parallel for better performance
      const promises = subjects.map(subject => this.getSubjectProgress(subject));
      const results = await Promise.all(promises);
      
      const progressData = {};
      subjects.forEach((subject, index) => {
        progressData[subject] = results[index];
      });
      
      return progressData;
    } catch (error) {
      console.error('Error getting all subjects progress:', error);
      return {};
    }
  }

  /**
   * Calculate subject progress from user data
   * @param {string} subjectId - Subject identifier
   * @returns {Object} Calculated progress data
   */
  calculateSubjectProgress(subjectId) {
    try {
      const userData = this.userProgress.userData;
      if (!userData || !userData.progress) {
        console.warn('No user data available for progress calculation');
        return this.getEmptyProgress(subjectId);
      }
      
      const subjectProgress = userData.progress[subjectId];
    
      if (!subjectProgress) {
        return this.getEmptyProgress(subjectId);
      }
    
      // Calculate metrics based on subject type
      let completedActivities = 0;
      let totalTime = 0;
      let scores = [];
    
      if (subjectId === 'math') {
        completedActivities = subjectProgress.lessonsCompleted || 0;
        totalTime = subjectProgress.totalTimeSpent || 0;
        if (subjectProgress.questionsAnswered > 0) {
          const accuracy = (subjectProgress.correctAnswers || 0) / subjectProgress.questionsAnswered;
          scores.push(accuracy * 100);
        }
      } else if (subjectId === 'reading') {
        completedActivities = subjectProgress.storiesRead || 0;
        totalTime = subjectProgress.readingTime || 0;
        if (subjectProgress.comprehensionScores) {
          scores = subjectProgress.comprehensionScores;
        }
      } else if (subjectId === 'science') {
        completedActivities = subjectProgress.experimentsCompleted || 0;
        totalTime = subjectProgress.labTime || 0;
        if (subjectProgress.experimentScores) {
          scores = subjectProgress.experimentScores;
        }
      } else if (subjectId === 'art') {
        completedActivities = subjectProgress.projectsCompleted || 0;
        totalTime = subjectProgress.creativeTime || 0;
        if (subjectProgress.projectRatings) {
          scores = subjectProgress.projectRatings;
        }
      } else if (subjectId === 'coding') {
        completedActivities = subjectProgress.challengesCompleted || 0;
        totalTime = subjectProgress.codingTime || 0;
        if (subjectProgress.challengeScores) {
          scores = subjectProgress.challengeScores;
        }
      }
    
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
    
      // Calculate completion rate based on predefined curriculum sizes
      const curriculumSizes = {
        math: 50,      // 50 lessons
        reading: 30,   // 30 stories
        science: 25,   // 25 experiments
        art: 20,       // 20 projects
        coding: 40     // 40 challenges
      };
    
      const totalActivities = curriculumSizes[subjectId] || 30;
      const completionRate = totalActivities > 0 
        ? Math.min((completedActivities / totalActivities) * 100, 100)
        : 0;
    
      return {
        subjectId,
        level: subjectProgress.level || 1,
        completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimals
        completedActivities,
        totalActivities,
        averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimals
        totalTime,
        lastActivity: subjectProgress.lastActivity
      };
    } catch (error) {
      console.error(`Error calculating progress for ${subjectId}:`, error);
      return this.getEmptyProgress(subjectId);
    }
  }

  /**
   * Get empty progress object for a subject
   * @param {string} subjectId - Subject identifier
   * @returns {Object} Empty progress data
   */
  getEmptyProgress(subjectId) {
    const curriculumSizes = {
      math: 50,
      reading: 30,
      science: 25,
      art: 20,
      coding: 40
    };
    
    return {
      subjectId,
      level: 1,
      completionRate: 0,
      completedActivities: 0,
      totalActivities: curriculumSizes[subjectId] || 30,
      averageScore: 0,
      totalTime: 0,
      lastActivity: null
    };
  }

  /**
   * Update subject progress with new data
   * @param {string} subjectId - Subject identifier
   * @param {Object} progressData - Progress update data
   * @returns {Promise<boolean>} Success status
   */
  async updateSubjectProgress(subjectId, progressData) {
    try {
      // Create subject-specific updateData based on what each method expects
      let updateData;
      let success = false;
      
      switch (subjectId) {
      case 'math':
        updateData = {
          lessonCompleted: true,
          score: progressData.score,
          timeSpent: progressData.timeSpent,
          correctAnswers: progressData.correctAnswers || 1,
          questionsAnswered: progressData.questionsAnswered || 1,
          ...progressData
        };
        success = this.userProgress.updateMathProgress(updateData);
        break;
      case 'reading':
        updateData = {
          storyRead: true,
          comprehensionScore: progressData.score || 0,
          timeSpent: progressData.timeSpent,
          bookData: progressData.bookData || { title: progressData.activityId },
          ...progressData
        };
        success = this.userProgress.updateReadingProgress(updateData);
        break;
      case 'science':
        updateData = {
          experimentCompleted: true,
          score: progressData.score || 0,
          timeSpent: progressData.timeSpent,
          experimentData: progressData.experimentData || { name: progressData.activityId },
          ...progressData
        };
        success = this.userProgress.updateScienceProgress(updateData);
        break;
      case 'art':
        updateData = {
          projectCompleted: true,
          rating: progressData.score || 0,
          timeSpent: progressData.timeSpent,
          projectData: progressData.projectData || { name: progressData.activityId },
          ...progressData
        };
        success = this.userProgress.updateArtProgress(updateData);
        break;
      case 'coding':
        updateData = {
          challengeCompleted: true,
          score: progressData.score || 0,
          timeSpent: progressData.timeSpent,
          challengeData: progressData.challengeData || { name: progressData.activityId },
          ...progressData
        };
        // Fallback to generic activity completed if coding-specific method doesn't exist
        if (typeof this.userProgress.updateCodingProgress === 'function') {
          success = this.userProgress.updateCodingProgress(updateData);
        } else {
          success = this.userProgress.updateProgress(subjectId, updateData);
        }
        break;
      default:
        console.warn(`Unknown subject: ${subjectId}`);
        success = false;
      }
      
      // Clear cached progress for this subject
      this.removeCache(`subject_progress_${subjectId}`);
      
      return success;
    } catch (error) {
      console.error(`Error updating ${subjectId} progress:`, error);
      return false;
    }
  }

  // ============================================================================
  // STREAK MANAGEMENT API
  // ============================================================================

  /**
   * Update user's daily learning streak
   * @returns {Promise<Object>} Updated streak data
   */
  async updateStreak() {
    try {
      this.userProgress.checkDailyStreak();
      this.enhancedTracker.updateDailyStreak();
      
      const streak = await this.getCurrentStreak();
      
      this.emit('streak:updated', streak);
      
      return streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  }

  /**
   * Get current streak information
   * @returns {Promise<Object>} Current streak data
   */
  async getCurrentStreak() {
    try {
      const profile = this.userProgress.getProfile();
      return profile.streak || { current: 0, max: 0 };
    } catch (error) {
      console.error('Error getting current streak:', error);
      return { current: 0, max: 0 };
    }
  }

  // ============================================================================
  // ACHIEVEMENT SYSTEM API
  // ============================================================================

  /**
   * Check and unlock achievements based on context
   * @param {Object} context - Achievement checking context
   * @returns {Promise<Array>} Newly unlocked achievements
   */
  async checkAchievements(context = {}) {
    try {
      const beforeAchievements = this.getUnlockedAchievements();
      
      // Let the enhanced tracker check achievements
      this.enhancedTracker.checkAchievements(context);
      
      const afterAchievements = this.getUnlockedAchievements();
      
      // Find newly unlocked achievements
      const newAchievements = afterAchievements.filter(
        after => !beforeAchievements.find(before => before.id === after.id)
      );
      
      // Note: Achievement events are automatically emitted by setupEventForwarding
      // when the underlying UserProgress emits 'achievementUnlocked' events
      
      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get all unlocked achievements
   * @returns {Array} Unlocked achievements
   */
  getUnlockedAchievements() {
    try {
      return this.userProgress.getAchievements().filter(a => a.unlocked);
    } catch (error) {
      console.error('Error getting unlocked achievements:', error);
      return [];
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING API
  // ============================================================================

  /**
   * Get comprehensive progress summary
   * @param {string} timeframe - Time range ('all', 'week', 'month')
   * @returns {Promise<Object>} Progress summary
   */
  async getProgressSummary(timeframe = 'all') {
    try {
      const cacheKey = `summary_${timeframe}`;
      
      // Check cache
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Get base summary from UserProgress
      const baseSummary = this.userProgress.getProgressSummary();
      
      // Enhance with additional analytics
      const enhancedSummary = {
        ...baseSummary,
        sessionId: this.sessionId,
        timeframe,
        subjects: await this.getAllSubjectsProgress(),
        streak: await this.getCurrentStreak(),
        analytics: this.enhancedTracker.getProgressSummary(),
        generatedAt: Date.now()
      };
      
      // Cache the result
      this.setCache(cacheKey, enhancedSummary);
      
      return enhancedSummary;
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return null;
    }
  }

  /**
   * Get detailed progress analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getProgressAnalytics(options = {}) {
    try {
      const analytics = {
        summary: await this.getProgressSummary(options.timeframe),
        gameAnalytics: this.enhancedTracker.getGameAnalyticsSummary(),
        recentActivity: this.userProgress.getRecentActivity(options.limit || 10),
        recentAchievements: this.userProgress.getRecentAchievements(options.achievementLimit || 5),
        generatedAt: Date.now()
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      return null;
    }
  }

  // ============================================================================
  // DATA EXPORT API
  // ============================================================================

  /**
   * Export progress data in specified format
   * @param {string} format - Export format ('json', 'csv')
   * @param {Object} options - Export options
   * @returns {Promise<string|Object>} Exported data
   */
  async exportProgress(format = 'json', options = {}) {
    try {
      const data = {
        exportInfo: {
          format,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          sessionId: this.sessionId
        },
        profile: this.userProgress.getProfile(),
        progress: await this.getAllSubjectsProgress(),
        achievements: this.userProgress.getAchievements(),
        analytics: await this.getProgressAnalytics(options),
        settings: this.userProgress.getSettings()
      };
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(data);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting progress:', error);
      return null;
    }
  }

  /**
   * Convert data to CSV format with proper escaping
   * @param {Object} data - Data to convert
   * @returns {string} CSV formatted data
   */
  convertToCSV(data) {
    const rows = [];
    rows.push('Subject,Level,Completed Activities,Average Score,Last Activity');
    
    Object.entries(data.progress).forEach(([subject, progress]) => {
      if (progress) {
        rows.push([
          this.escapeCSVField(subject),
          progress.level,
          progress.completedActivities,
          Math.round(progress.averageScore),
          this.escapeCSVField(progress.lastActivity || 'Never')
        ].join(','));
      }
    });
    
    return rows.join('\n');
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   * @param {*} field - Field value to escape
   * @returns {string} Escaped field value
   */
  escapeCSVField(field) {
    if (field == null) return '';
    
    const stringField = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
  }

  // ============================================================================
  // EVENT SYSTEM API
  // ============================================================================

  /**
   * Add event listener
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {Function} callback - Event callback to remove
   */
  off(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {*} value - Cache value
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Remove cache entry
   * @param {string} key - Cache key
   */
  removeCache(key) {
    this.cache.delete(key);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export for ES6 modules
export default ProgressService;

// Make available for non-module scripts
if (typeof window !== 'undefined') {
  window.ProgressService = ProgressService;
}