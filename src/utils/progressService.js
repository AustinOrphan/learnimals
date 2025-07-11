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

// Import dependencies - these should be available in the global scope
// UserProgress from '../features/user/userProgress.js'
// EnhancedProgressTracker from './EnhancedProgressTracker.js'

class ProgressService {
  constructor(options = {}) {
    // eslint-disable-next-line no-undef
    this.userProgress = options.userProgress || new UserProgress();
    // eslint-disable-next-line no-undef
    this.enhancedTracker = options.enhancedTracker || new EnhancedProgressTracker();
    this.eventListeners = new Map();
    this.sessionId = this.generateSessionId();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    this.init();
  }

  /**
   * Initialize the service
   */
  init() {
    // Set up event forwarding from underlying services
    this.setupEventForwarding();
    
    // Initialize cache
    this.clearExpiredCache();
    setInterval(() => this.clearExpiredCache(), this.cacheExpiry);
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
    // Forward events from UserProgress
    document.addEventListener('userDataUpdated', (event) => {
      this.emit('progress:updated', event.detail);
    });
    
    document.addEventListener('achievementUnlocked', (event) => {
      this.emit('achievement:unlocked', event.detail);
    });
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
        isFirstCompletion: !session?.previousCompletions
      });
      
      return true;
    } catch (error) {
      console.error('Error tracking activity completion:', error);
      return false;
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
    const subjects = ['math', 'reading', 'science', 'art', 'coding'];
    const progressData = {};
    
    for (const subject of subjects) {
      progressData[subject] = await this.getSubjectProgress(subject);
    }
    
    return progressData;
  }

  /**
   * Calculate subject progress from user data
   * @param {string} subjectId - Subject identifier
   * @returns {Object} Calculated progress data
   */
  calculateSubjectProgress(subjectId) {
    const userData = this.userProgress.userData;
    const subjectProgress = userData.progress[subjectId];
    
    if (!subjectProgress) {
      return {
        subjectId,
        level: 1,
        completionRate: 0,
        completedActivities: 0,
        totalActivities: 0,
        averageScore: 0,
        totalTime: 0,
        lastActivity: null
      };
    }
    
    // Calculate metrics based on subject type
    let completedActivities = 0;
    const totalTime = 0;
    let scores = [];
    
    if (subjectId === 'math') {
      completedActivities = subjectProgress.lessonsCompleted || 0;
      scores = Array(subjectProgress.questionsAnswered || 0).fill(
        ((subjectProgress.correctAnswers || 0) / Math.max(subjectProgress.questionsAnswered || 1, 1)) * 100
      );
    } else if (subjectId === 'reading') {
      completedActivities = subjectProgress.storiesRead || 0;
    } else if (subjectId === 'science') {
      completedActivities = subjectProgress.experimentsCompleted || 0;
    } else if (subjectId === 'art') {
      completedActivities = subjectProgress.projectsCompleted || 0;
    }
    
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;
    
    return {
      subjectId,
      level: subjectProgress.level || 1,
      completionRate: completedActivities > 0 ? 100 : 0, // Simplified for now
      completedActivities,
      totalActivities: completedActivities * 1.5, // Estimated total
      averageScore,
      totalTime,
      lastActivity: subjectProgress.lastActivity
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
      const updateData = {
        [subjectId === 'math' ? 'lessonCompleted' : 'activityCompleted']: true,
        score: progressData.score,
        timeSpent: progressData.timeSpent,
        ...progressData
      };
      
      // Update via UserProgress based on subject
      let success = false;
      
      switch (subjectId) {
      case 'math':
        success = this.userProgress.updateMathProgress(updateData);
        break;
      case 'reading':
        success = this.userProgress.updateReadingProgress(updateData);
        break;
      case 'science':
        success = this.userProgress.updateScienceProgress(updateData);
        break;
      case 'art':
        success = this.userProgress.updateArtProgress(updateData);
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
      
      // Emit events for new achievements
      newAchievements.forEach(achievement => {
        this.emit('achievement:unlocked', { achievement });
      });
      
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
   * Convert data to CSV format
   * @param {Object} data - Data to convert
   * @returns {string} CSV formatted data
   */
  convertToCSV(data) {
    // Simplified CSV export - implement as needed
    const rows = [];
    rows.push('Subject,Level,Completed Activities,Average Score,Last Activity');
    
    Object.entries(data.progress).forEach(([subject, progress]) => {
      if (progress) {
        rows.push([
          subject,
          progress.level,
          progress.completedActivities,
          Math.round(progress.averageScore),
          progress.lastActivity || 'Never'
        ].join(','));
      }
    });
    
    return rows.join('\n');
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