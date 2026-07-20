// Enhanced Progress Tracker for Learnimals Games
// Comprehensive tracking system integrating all educational games with achievements and analytics

import userProgress from '../user/userProgress.js';
import {
  getAllAchievements,
  getGameAchievements,
  getCrossGameAchievements,
  getAchievementById,
} from './achievementDefinitions.js';
import logger from './logger.js';

export class EnhancedProgressTracker {
  constructor() {
    this.achievements = getAllAchievements();
    this.gameStats = new Map();
    this.crossGameProgress = {
      totalChallenges: 0,
      totalScore: 0,
      totalTime: 0,
      gamesPlayed: new Set(),
      dailyStreak: 0,
      lastPlayDate: null,
      overallAccuracy: 0,
      sessionData: [],
    };

    // Game-specific analytics
    this.gameAnalytics = {
      'word-scramble': { sessions: [], totalWords: 0, averageTime: 0, hintsUsed: 0 },
      'number-line-jump': { sessions: [], totalEquations: 0, averageAccuracy: 0, levelsReached: 0 },
      'element-match': {
        sessions: [],
        elementsLearned: new Set(),
        totalMatches: 0,
        perfectRounds: 0,
      },
      'sentence-builder': { sessions: [], sentencesBuilt: 0, grammarAccuracy: 0, hintsUsed: 0 },
      'color-palette': {
        sessions: [],
        colorsCreated: 0,
        palettesBuilt: 0,
        theoryMastered: new Set(),
      },
    };

    this.achievementProgress = new Map();
    this.init();
  }

  /**
   * Initialize the progress tracker
   */
  init() {
    this.loadProgressData();
    this.initializeAchievementProgress();
    this.setupEventListeners();
    logger.debug('Enhanced Progress Tracker initialized');
  }

  /**
   * Load existing progress data
   */
  loadProgressData() {
    try {
      const savedProgress = localStorage.getItem('learnimals-enhanced-progress');
      if (savedProgress) {
        const data = JSON.parse(savedProgress);
        this.crossGameProgress = { ...this.crossGameProgress, ...data.crossGameProgress };
        this.gameAnalytics = { ...this.gameAnalytics, ...data.gameAnalytics };

        // Convert Sets back from arrays
        this.crossGameProgress.gamesPlayed = new Set(data.crossGameProgress?.gamesPlayed || []);
        Object.keys(this.gameAnalytics).forEach(game => {
          if (this.gameAnalytics[game].elementsLearned) {
            this.gameAnalytics[game].elementsLearned = new Set(
              this.gameAnalytics[game].elementsLearned
            );
          }
          if (this.gameAnalytics[game].theoryMastered) {
            this.gameAnalytics[game].theoryMastered = new Set(
              this.gameAnalytics[game].theoryMastered
            );
          }
        });
      }
    } catch (error) {
      logger.error('Error loading enhanced progress data:', error);
    }
  }

  /**
   * Save progress data to localStorage
   */
  saveProgressData() {
    try {
      const dataToSave = {
        crossGameProgress: {
          ...this.crossGameProgress,
          gamesPlayed: Array.from(this.crossGameProgress.gamesPlayed),
        },
        gameAnalytics: {},
      };

      // Convert Sets to arrays for JSON serialization
      Object.keys(this.gameAnalytics).forEach(game => {
        dataToSave.gameAnalytics[game] = {
          ...this.gameAnalytics[game],
          elementsLearned: this.gameAnalytics[game].elementsLearned
            ? Array.from(this.gameAnalytics[game].elementsLearned)
            : [],
          theoryMastered: this.gameAnalytics[game].theoryMastered
            ? Array.from(this.gameAnalytics[game].theoryMastered)
            : [],
        };
      });

      localStorage.setItem('learnimals-enhanced-progress', JSON.stringify(dataToSave));

      // Also update the legacy userProgress system
      this.updateLegacyProgress();

      return true;
    } catch (error) {
      logger.error('Error saving enhanced progress data:', error);
      return false;
    }
  }

  /**
   * Initialize achievement progress tracking
   */
  initializeAchievementProgress() {
    Object.keys(this.achievements).forEach(achievementId => {
      if (!this.achievementProgress.has(achievementId)) {
        this.achievementProgress.set(achievementId, {
          progress: 0,
          unlocked: false,
          dateUnlocked: null,
          conditions: {},
        });
      }
    });
  }

  /**
   * Setup event listeners for game events
   */
  setupEventListeners() {
    // Listen for game completion events
    document.addEventListener('gameSessionComplete', event => {
      this.trackGameSession(event.detail);
    });

    // Listen for achievement unlock events
    document.addEventListener('achievementUnlocked', event => {
      this.onAchievementUnlocked(event.detail);
    });
  }

  /**
   * Track a complete game session
   * @param {Object} sessionData - Game session data
   */
  trackGameSession(sessionData) {
    const { gameType, score, time, accuracy, level, challengesCompleted, metadata } = sessionData;

    // Update cross-game progress
    this.crossGameProgress.totalChallenges += challengesCompleted || 1;
    this.crossGameProgress.totalScore += score || 0;
    this.crossGameProgress.totalTime += time || 0;
    this.crossGameProgress.gamesPlayed.add(gameType);

    // Update overall accuracy
    const totalSessions = this.getTotalSessions();
    const oldAccuracy = this.crossGameProgress.overallAccuracy * (totalSessions - 1);
    this.crossGameProgress.overallAccuracy = (oldAccuracy + (accuracy || 0)) / totalSessions;

    // Update daily streak
    this.updateDailyStreak();

    // Track game-specific analytics
    this.trackGameSpecificProgress(gameType, sessionData);

    // Check achievements
    this.checkAchievements(gameType, sessionData);

    // Add to session history
    this.crossGameProgress.sessionData.push({
      gameType,
      timestamp: new Date().toISOString(),
      score,
      time,
      accuracy,
      level,
      challengesCompleted,
      metadata,
    });

    // Keep only last 100 sessions
    if (this.crossGameProgress.sessionData.length > 100) {
      this.crossGameProgress.sessionData.shift();
    }

    this.saveProgressData();

    // Dispatch progress update event
    document.dispatchEvent(
      new CustomEvent('progressUpdated', {
        detail: { gameType, sessionData },
      })
    );

    logger.debug(`Tracked session for ${gameType}:`, sessionData);
  }

  /**
   * Track game-specific progress
   * @param {string} gameType - Type of game
   * @param {Object} sessionData - Session data
   */
  trackGameSpecificProgress(gameType, sessionData) {
    if (!this.gameAnalytics[gameType]) {
      this.gameAnalytics[gameType] = { sessions: [] };
    }

    const analytics = this.gameAnalytics[gameType];
    analytics.sessions.push({
      timestamp: new Date().toISOString(),
      ...sessionData,
    });

    switch (gameType) {
      case 'word-scramble':
        analytics.totalWords += sessionData.wordsCompleted || 0;
        analytics.hintsUsed += sessionData.hintsUsed || 0;
        analytics.averageTime = this.calculateAverageTime(analytics.sessions);
        break;

      case 'number-line-jump':
        analytics.totalEquations += sessionData.equationsCompleted || 0;
        analytics.levelsReached = Math.max(analytics.levelsReached || 0, sessionData.level || 0);
        analytics.averageAccuracy = this.calculateAverageAccuracy(analytics.sessions);
        break;

      case 'element-match':
        if (sessionData.elementsLearned) {
          sessionData.elementsLearned.forEach(element => {
            analytics.elementsLearned.add(element);
          });
        }
        analytics.totalMatches += sessionData.matchesCompleted || 0;
        analytics.perfectRounds += sessionData.perfectRounds || 0;
        break;

      case 'sentence-builder':
        analytics.sentencesBuilt += sessionData.sentencesCompleted || 0;
        analytics.hintsUsed += sessionData.hintsUsed || 0;
        analytics.grammarAccuracy = this.calculateAverageAccuracy(analytics.sessions);
        break;

      case 'color-palette':
        analytics.colorsCreated += sessionData.colorsCreated || 0;
        analytics.palettesBuilt += sessionData.palettesCreated || 0;
        if (sessionData.theoryLearned) {
          sessionData.theoryLearned.forEach(concept => {
            analytics.theoryMastered.add(concept);
          });
        }
        break;
    }

    // Keep only last 50 sessions per game
    if (analytics.sessions.length > 50) {
      analytics.sessions.shift();
    }
  }

  /**
   * Check and update achievements based on game session
   * @param {string} gameType - Type of game
   * @param {Object} sessionData - Session data
   */
  checkAchievements(gameType, sessionData) {
    // Check game-specific achievements
    const gameAchievements = getGameAchievements(gameType);
    Object.values(gameAchievements).forEach(achievement => {
      this.checkSingleAchievement(achievement, gameType, sessionData);
    });

    // Check cross-game achievements
    const crossGameAchievements = getCrossGameAchievements();
    Object.values(crossGameAchievements).forEach(achievement => {
      this.checkCrossGameAchievement(achievement);
    });
  }

  /**
   * Check a single achievement for completion
   * @param {Object} achievement - Achievement definition
   * @param {string} gameType - Type of game
   * @param {Object} sessionData - Session data
   */
  checkSingleAchievement(achievement, gameType, sessionData) {
    const progress = this.achievementProgress.get(achievement.id);
    if (!progress || progress.unlocked) return;

    const { criteria } = achievement;
    let currentValue = 0;
    let achieved = false;

    switch (criteria.type) {
      case 'count':
        currentValue = this.getCountForEvent(criteria.event, gameType, criteria.condition);
        achieved = currentValue >= criteria.target;
        break;

      case 'time':
        currentValue = sessionData.time || 0;
        achieved =
          criteria.comparison === 'less_than'
            ? currentValue < criteria.target
            : currentValue >= criteria.target;
        break;

      case 'perfect':
        achieved = this.checkPerfectCondition(criteria.condition, sessionData);
        currentValue = achieved ? 1 : 0;
        break;

      case 'streak':
        currentValue = this.getStreakForEvent(criteria.event, gameType, criteria.condition);
        achieved = currentValue >= criteria.target;
        break;

      case 'level':
        currentValue = sessionData.level || 0;
        achieved = currentValue >= criteria.target;
        break;

      case 'difficulty_completion':
        currentValue = this.getDifficultyCompletion(gameType);
        achieved = criteria.target.every(diff => currentValue.includes(diff));
        break;

      case 'unique_count':
        currentValue = this.getUniqueCountForEvent(criteria.event, gameType);
        achieved = currentValue >= criteria.target;
        break;
    }

    // Update progress
    progress.progress = currentValue;

    if (achieved && !progress.unlocked) {
      this.unlockAchievement(achievement.id);
    }
  }

  /**
   * Check cross-game achievements
   * @param {Object} achievement - Achievement definition
   */
  checkCrossGameAchievement(achievement) {
    const progress = this.achievementProgress.get(achievement.id);
    if (!progress || progress.unlocked) return;

    const { criteria } = achievement;
    let currentValue = 0;
    let achieved = false;

    switch (criteria.type) {
      case 'games_played':
        currentValue = Array.from(this.crossGameProgress.gamesPlayed);
        achieved = criteria.target.every(game => currentValue.includes(game));
        break;

      case 'achievements_earned':
        currentValue = Array.from(this.achievementProgress.values()).filter(p => p.unlocked).length;
        achieved = currentValue >= criteria.target;
        break;

      case 'total_challenges':
        currentValue = this.crossGameProgress.totalChallenges;
        achieved = currentValue >= criteria.target;
        break;

      case 'overall_accuracy':
        currentValue = this.crossGameProgress.overallAccuracy;
        achieved =
          currentValue >= criteria.target &&
          this.getTotalSessions() >= (criteria.minimum_attempts || 10);
        break;

      case 'consecutive_days':
        currentValue = this.crossGameProgress.dailyStreak;
        achieved = currentValue >= criteria.target;
        break;
    }

    progress.progress = currentValue;

    if (achieved && !progress.unlocked) {
      this.unlockAchievement(achievement.id);
    }
  }

  /**
   * Unlock an achievement
   * @param {string} achievementId - Achievement ID
   */
  unlockAchievement(achievementId) {
    const achievement = getAchievementById(achievementId);
    const progress = this.achievementProgress.get(achievementId);

    if (!achievement || !progress || progress.unlocked) return;

    progress.unlocked = true;
    progress.dateUnlocked = new Date().toISOString();

    // Add points to total score
    this.crossGameProgress.totalScore += achievement.reward.points;

    // Update legacy achievement system
    userProgress.updateAchievementProgress(achievementId, progress.progress);

    // Dispatch achievement unlocked event
    document.dispatchEvent(
      new CustomEvent('achievementUnlocked', {
        detail: { achievement, progress },
      })
    );

    this.saveProgressData();

    logger.info(`Achievement unlocked: ${achievement.name}`);
  }

  /**
   * Update daily streak
   */
  updateDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastPlayDate = this.crossGameProgress.lastPlayDate;

    if (!lastPlayDate) {
      this.crossGameProgress.dailyStreak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      if (lastPlayDate === yesterdayDate) {
        this.crossGameProgress.dailyStreak++;
      } else if (lastPlayDate !== today) {
        this.crossGameProgress.dailyStreak = 1;
      }
    }

    this.crossGameProgress.lastPlayDate = today;
  }

  /**
   * Get count for specific event
   * @param {string} event - Event type
   * @param {string} gameType - Game type
   * @param {string} condition - Optional condition
   * @returns {number} Count
   */
  getCountForEvent(event, gameType, _condition) {
    const analytics = this.gameAnalytics[gameType];
    if (!analytics) return 0;

    switch (event) {
      case 'word-completed':
        return analytics.totalWords || 0;
      case 'equation-completed':
        return analytics.totalEquations || 0;
      case 'element-matched':
        return analytics.totalMatches || 0;
      case 'sentence-completed':
        return analytics.sentencesBuilt || 0;
      case 'color-mixed':
        return analytics.colorsCreated || 0;
      case 'palette-created':
        return analytics.palettesBuilt || 0;
      default:
        return 0;
    }
  }

  /**
   * Get unique count for specific event
   * @param {string} event - Event type
   * @param {string} gameType - Game type
   * @returns {number} Unique count
   */
  getUniqueCountForEvent(event, gameType) {
    const analytics = this.gameAnalytics[gameType];
    if (!analytics) return 0;

    switch (event) {
      case 'element-learned':
        return analytics.elementsLearned?.size || 0;
      default:
        return 0;
    }
  }

  /**
   * Get streak count for specific event
   * @param {string} event - Event type
   * @param {string} gameType - Game type
   * @param {string} condition - Condition for streak
   * @returns {number} Streak count
   */
  getStreakForEvent(event, gameType, condition) {
    const analytics = this.gameAnalytics[gameType];
    if (!analytics || !analytics.sessions.length) return 0;

    let streak = 0;
    for (let i = analytics.sessions.length - 1; i >= 0; i--) {
      const session = analytics.sessions[i];
      if (this.checkPerfectCondition(condition, session)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check perfect condition
   * @param {string} condition - Condition to check
   * @param {Object} sessionData - Session data
   * @returns {boolean} Whether condition is met
   */
  checkPerfectCondition(condition, sessionData) {
    switch (condition) {
      case 'no-hints':
        return (sessionData.hintsUsed || 0) === 0;
      case 'no-mistakes':
        return (sessionData.mistakes || 0) === 0;
      case 'perfect-accuracy':
        return (sessionData.accuracy || 0) === 100;
      case 'perfect-grammar':
        return (sessionData.grammarErrors || 0) === 0;
      case 'perfect':
        return (sessionData.accuracy || 0) >= 95;
      default:
        return false;
    }
  }

  /**
   * Get difficulty completion for game
   * @param {string} gameType - Game type
   * @returns {Array} Completed difficulties
   */
  getDifficultyCompletion(gameType) {
    const analytics = this.gameAnalytics[gameType];
    if (!analytics) return [];

    const completedDifficulties = new Set();
    analytics.sessions.forEach(session => {
      if (session.completed && session.difficulty) {
        completedDifficulties.add(session.difficulty);
      }
    });

    return Array.from(completedDifficulties);
  }

  /**
   * Calculate average time from sessions
   * @param {Array} sessions - Session array
   * @returns {number} Average time
   */
  calculateAverageTime(sessions) {
    if (!sessions.length) return 0;
    const totalTime = sessions.reduce((sum, session) => sum + (session.time || 0), 0);
    return totalTime / sessions.length;
  }

  /**
   * Calculate average accuracy from sessions
   * @param {Array} sessions - Session array
   * @returns {number} Average accuracy
   */
  calculateAverageAccuracy(sessions) {
    if (!sessions.length) return 0;
    const totalAccuracy = sessions.reduce((sum, session) => sum + (session.accuracy || 0), 0);
    return totalAccuracy / sessions.length;
  }

  /**
   * Get total number of sessions across all games
   * @returns {number} Total sessions
   */
  getTotalSessions() {
    return Object.values(this.gameAnalytics).reduce(
      (total, analytics) => total + (analytics.sessions?.length || 0),
      0
    );
  }

  /**
   * Update legacy progress system
   */
  updateLegacyProgress() {
    // Update legacy userProgress with cross-game data

    // Update each subject based on game analytics
    Object.keys(this.gameAnalytics).forEach(gameType => {
      const analytics = this.gameAnalytics[gameType];

      switch (gameType) {
        case 'number-line-jump':
          userProgress.updateMathProgress({
            questionsAnswered: analytics.totalEquations || 0,
            correctAnswers: Math.round(
              ((analytics.totalEquations || 0) * (analytics.averageAccuracy || 0)) / 100
            ),
          });
          break;

        case 'word-scramble':
        case 'sentence-builder':
          userProgress.updateReadingProgress({
            wordsLearned: analytics.totalWords || analytics.sentencesBuilt || 0,
          });
          break;

        case 'element-match':
          userProgress.updateScienceProgress({
            factsLearned: analytics.elementsLearned?.size || 0,
          });
          break;

        case 'color-palette':
          userProgress.updateArtProgress({
            techniqueLearned: analytics.theoryMastered?.size || 0,
          });
          break;
      }
    });
  }

  /**
   * Get comprehensive progress summary
   * @returns {Object} Progress summary
   */
  /**
   * Mark a game as played (registers it in cross-game progress + analytics).
   * @param {string} gameId
   */
  markGamePlayed(gameId) {
    if (!gameId) return;
    this.crossGameProgress.gamesPlayed.add(gameId);
    if (!this.gameAnalytics[gameId]) {
      this.gameAnalytics[gameId] = this.getDefaultGameAnalytics();
    }
    this.saveProgressData();
  }

  /**
   * Update a game's progress from a completed session. Routes through the
   * full session pipeline (analytics, achievements, persistence, events).
   * @param {string} gameId
   * @param {Object} sessionResult
   */
  updateGameProgress(gameId, sessionResult = {}) {
    this.trackGameSession({ gameType: gameId, ...sessionResult });
  }

  /**
   * Check (and unlock if defined) a single achievement by id. Game-specific
   * dynamic ids that aren't in the achievement catalog are a safe no-op —
   * progressIntegration calls this speculatively after each session.
   * @param {string} achievementId
   * @returns {Object|null}
   */
  checkAchievement(achievementId) {
    if (!achievementId || !this.achievements || !this.achievements[achievementId]) {
      return null;
    }
    const progress = this.achievementProgress.get(achievementId);
    if (progress && progress.unlocked) {
      return null;
    }
    return this.unlockAchievement(achievementId);
  }

  /**
   * Evaluate every cross-game achievement against current progress.
   * @returns {void}
   */
  checkAllCrossGameAchievements() {
    const crossGameTypes = new Set([
      'games_played',
      'achievements_earned',
      'total_challenges',
      'overall_accuracy',
      'consecutive_days',
    ]);
    Object.values(this.achievements || {}).forEach(achievement => {
      if (achievement && achievement.criteria && crossGameTypes.has(achievement.criteria.type)) {
        this.checkCrossGameAchievement(achievement);
      }
    });
  }

  /**
   * Default per-game analytics shape used as a fallback.
   * @returns {Object}
   */
  getDefaultGameAnalytics() {
    return {
      sessions: [],
      totalScore: 0,
      bestScore: 0,
      averageAccuracy: 0,
      timesPlayed: 0,
    };
  }

  getProgressSummary() {
    const unlockedAchievements = Array.from(this.achievementProgress.values()).filter(
      p => p.unlocked
    );

    return {
      crossGame: {
        totalChallenges: this.crossGameProgress.totalChallenges,
        totalScore: this.crossGameProgress.totalScore,
        totalTime: this.crossGameProgress.totalTime,
        gamesPlayed: Array.from(this.crossGameProgress.gamesPlayed),
        dailyStreak: this.crossGameProgress.dailyStreak,
        overallAccuracy: Math.round(this.crossGameProgress.overallAccuracy),
        totalSessions: this.getTotalSessions(),
      },
      achievements: {
        total: Object.keys(this.achievements).length,
        unlocked: unlockedAchievements.length,
        points: unlockedAchievements.reduce((total, progress) => {
          const achievement = getAchievementById(progress.achievementId);
          return total + (achievement?.reward.points || 0);
        }, 0),
        recent: this.getRecentAchievements(5),
      },
      gameAnalytics: this.getGameAnalyticsSummary(),
      recentActivity: this.getRecentActivity(10),
    };
  }

  /**
   * Get game analytics summary
   * @returns {Object} Game analytics
   */
  getGameAnalyticsSummary() {
    const summary = {};

    Object.keys(this.gameAnalytics).forEach(gameType => {
      const analytics = this.gameAnalytics[gameType];
      summary[gameType] = {
        sessionsPlayed: analytics.sessions?.length || 0,
        lastPlayed: analytics.sessions?.length
          ? analytics.sessions[analytics.sessions.length - 1].timestamp
          : null,
        ...analytics,
      };

      // Convert Sets to arrays for JSON serialization
      if (summary[gameType].elementsLearned) {
        summary[gameType].elementsLearned = Array.from(summary[gameType].elementsLearned);
      }
      if (summary[gameType].theoryMastered) {
        summary[gameType].theoryMastered = Array.from(summary[gameType].theoryMastered);
      }
    });

    return summary;
  }

  /**
   * Get recent achievements
   * @param {number} limit - Number of achievements to return
   * @returns {Array} Recent achievements
   */
  getRecentAchievements(limit = 5) {
    return Array.from(this.achievementProgress.entries())
      .filter(([_, progress]) => progress.unlocked && progress.dateUnlocked)
      .sort((a, b) => new Date(b[1].dateUnlocked) - new Date(a[1].dateUnlocked))
      .slice(0, limit)
      .map(([achievementId, progress]) => ({
        ...getAchievementById(achievementId),
        dateUnlocked: progress.dateUnlocked,
      }));
  }

  /**
   * Get recent activity across all games
   * @param {number} limit - Number of activities to return
   * @returns {Array} Recent activities
   */
  getRecentActivity(limit = 10) {
    return this.crossGameProgress.sessionData
      .slice(-limit)
      .reverse()
      .map(session => ({
        ...session,
        gameTitle: this.getGameTitle(session.gameType),
        description: this.getActivityDescription(session),
      }));
  }

  /**
   * Get human-readable game title
   * @param {string} gameType - Game type
   * @returns {string} Game title
   */
  getGameTitle(gameType) {
    const titles = {
      'word-scramble': 'Word Scramble',
      'number-line-jump': 'Number Line Jump',
      'element-match': 'Element Match',
      'sentence-builder': 'Sentence Builder',
      'color-palette': 'Color Palette',
    };
    return titles[gameType] || gameType;
  }

  /**
   * Get activity description
   * @param {Object} session - Session data
   * @returns {string} Activity description
   */
  getActivityDescription(session) {
    const gameTitle = this.getGameTitle(session.gameType);
    const score = session.score || 0;
    const accuracy = session.accuracy || 0;

    return `Played ${gameTitle} - Score: ${score}, Accuracy: ${Math.round(accuracy)}%`;
  }

  /**
   * Handle achievement unlocked event
   * @param {Object} detail - Achievement detail
   */
  onAchievementUnlocked(detail) {
    logger.info('Achievement unlocked:', detail.achievement.name);

    // Could trigger UI notifications, sounds, etc.
    if (typeof window !== 'undefined' && window.showAchievementNotification) {
      window.showAchievementNotification(detail.achievement);
    }
  }

  /**
   * Reset all progress data
   */
  resetProgress() {
    this.crossGameProgress = {
      totalChallenges: 0,
      totalScore: 0,
      totalTime: 0,
      gamesPlayed: new Set(),
      dailyStreak: 0,
      lastPlayDate: null,
      overallAccuracy: 0,
      sessionData: [],
    };

    this.gameAnalytics = {
      'word-scramble': { sessions: [], totalWords: 0, averageTime: 0, hintsUsed: 0 },
      'number-line-jump': { sessions: [], totalEquations: 0, averageAccuracy: 0, levelsReached: 0 },
      'element-match': {
        sessions: [],
        elementsLearned: new Set(),
        totalMatches: 0,
        perfectRounds: 0,
      },
      'sentence-builder': { sessions: [], sentencesBuilt: 0, grammarAccuracy: 0, hintsUsed: 0 },
      'color-palette': {
        sessions: [],
        colorsCreated: 0,
        palettesBuilt: 0,
        theoryMastered: new Set(),
      },
    };

    this.achievementProgress.clear();
    this.initializeAchievementProgress();
    this.saveProgressData();
  }
}

// Create and export singleton instance
const enhancedProgressTracker = new EnhancedProgressTracker();
export default enhancedProgressTracker;
