/**
 * Achievement System
 *
 * Manages achievements, unlocking, and tracking for the Learnimals application
 */

import logger from '../utils/logger.js';

export default class AchievementSystem {
  constructor(options = {}) {
    this.achievements = new Map();
    this.userAchievements = new Set();
    this.listeners = new Set();
    this.storageKey = options.storageKey || 'learnimals_achievements';

    this.initializeDefaultAchievements();
    this.loadUserAchievements();
  }

  /**
   * Initialize default achievements
   */
  initializeDefaultAchievements() {
    const defaultAchievements = [
      {
        id: 'first_game',
        name: 'First Steps',
        description: 'Complete your first game',
        category: 'general',
        requirements: { gamesCompleted: 1 },
        points: 10,
        rarity: 'common',
      },
      {
        id: 'math_beginner',
        name: 'Math Explorer',
        description: 'Complete 5 math games',
        category: 'math',
        requirements: { subject: 'math', gamesCompleted: 5 },
        points: 25,
        rarity: 'common',
      },
      {
        id: 'perfect_score',
        name: 'Perfect!',
        description: 'Get a perfect score in any game',
        category: 'performance',
        requirements: { perfectScore: true },
        points: 50,
        rarity: 'uncommon',
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a game in under 30 seconds',
        category: 'performance',
        requirements: { maxTime: 30 },
        points: 75,
        rarity: 'rare',
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 7-day play streak',
        category: 'consistency',
        requirements: { streak: 7 },
        points: 100,
        rarity: 'epic',
      },
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Load user achievements from storage
   */
  loadUserAchievements() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const achievements = JSON.parse(stored);
        achievements.forEach(id => this.userAchievements.add(id));
      }
    } catch (error) {
      logger.error('Failed to load user achievements:', error);
    }
  }

  /**
   * Save user achievements to storage
   */
  saveUserAchievements() {
    try {
      const achievements = Array.from(this.userAchievements);
      localStorage.setItem(this.storageKey, JSON.stringify(achievements));
    } catch (error) {
      logger.error('Failed to save user achievements:', error);
    }
  }

  /**
   * Check if user has unlocked an achievement
   * @param {string} achievementId - Achievement ID
   * @returns {boolean} True if unlocked
   */
  hasAchievement(achievementId) {
    return this.userAchievements.has(achievementId);
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - Achievement ID
   * @returns {Object|null} Achievement data if newly unlocked
   */
  unlock(achievementId) {
    if (this.hasAchievement(achievementId)) {
      return null; // Already unlocked
    }

    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      logger.warn(`Achievement not found: ${achievementId}`);
      return null;
    }

    this.userAchievements.add(achievementId);
    this.saveUserAchievements();

    const unlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    this.notifyListeners('achievement_unlocked', unlockedAchievement);
    logger.info(`Achievement unlocked: ${achievement.name}`);

    return unlockedAchievement;
  }

  /**
   * Check and possibly unlock a single achievement by id. BaseGame calls
   * this after it has already detected the triggering condition (e.g. a
   * streak of 5). Unlocks only if the achievement is defined and its
   * requirements are satisfied by the context — otherwise a safe no-op.
   * @param {string} achievementId
   * @param {Object} context
   * @returns {Object|null} the newly-unlocked achievement, or null
   */
  checkAchievement(achievementId, context = {}) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || this.hasAchievement(achievementId)) {
      return null;
    }
    if (this.meetsRequirements(achievement, context)) {
      return this.unlock(achievementId);
    }
    return null;
  }

  /**
   * Check achievements against game data
   * @param {Object} gameData - Game completion data
   * @returns {Array} Newly unlocked achievements
   */
  check(gameData) {
    const newlyUnlocked = [];

    this.achievements.forEach((achievement, id) => {
      if (this.hasAchievement(id)) return;

      if (this.meetsRequirements(achievement, gameData)) {
        const unlocked = this.unlock(id);
        if (unlocked) {
          newlyUnlocked.push(unlocked);
        }
      }
    });

    return newlyUnlocked;
  }

  /**
   * Check if requirements are met
   * @param {Object} achievement - Achievement data
   * @param {Object} gameData - Game data to check against
   * @returns {boolean} True if requirements met
   */
  meetsRequirements(achievement, gameData) {
    const { requirements } = achievement;

    // Check subject requirement
    if (requirements.subject && gameData.subject !== requirements.subject) {
      return false;
    }

    // Check games completed
    if (requirements.gamesCompleted && gameData.gamesCompleted < requirements.gamesCompleted) {
      return false;
    }

    // Check perfect score
    if (requirements.perfectScore && !gameData.perfectScore) {
      return false;
    }

    // Check max time
    if (requirements.maxTime && gameData.completionTime > requirements.maxTime) {
      return false;
    }

    // Check streak
    if (requirements.streak && gameData.currentStreak < requirements.streak) {
      return false;
    }

    return true;
  }

  /**
   * Get all achievements
   * @returns {Array} All achievements with unlock status
   */
  getAchievements() {
    return Array.from(this.achievements.entries()).map(([id, achievement]) => ({
      ...achievement,
      isUnlocked: this.hasAchievement(id),
      unlockedAt: this.hasAchievement(id) ? new Date().toISOString() : null,
    }));
  }

  /**
   * Get unlocked achievements
   * @returns {Array} Unlocked achievements
   */
  getUnlockedAchievements() {
    return this.getAchievements().filter(achievement => achievement.isUnlocked);
  }

  /**
   * Get achievements by category
   * @param {string} category - Category name
   * @returns {Array} Achievements in category
   */
  getAchievementsByCategory(category) {
    return this.getAchievements().filter(achievement => achievement.category === category);
  }

  /**
   * Get total points earned
   * @returns {number} Total points
   */
  getTotalPoints() {
    return this.getUnlockedAchievements().reduce((total, achievement) => {
      return total + (achievement.points || 0);
    }, 0);
  }

  /**
   * Add achievement listener
   * @param {Function} listener - Event listener
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove achievement listener
   * @param {Function} listener - Event listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        logger.error('Achievement listener error:', error);
      }
    });
  }

  /**
   * Reset all achievements (for testing)
   */
  reset() {
    this.userAchievements.clear();
    this.saveUserAchievements();
    this.notifyListeners('achievements_reset', {});
  }

  /**
   * Destroy achievement system
   */
  destroy() {
    this.listeners.clear();
    this.achievements.clear();
    this.userAchievements.clear();
  }
}
