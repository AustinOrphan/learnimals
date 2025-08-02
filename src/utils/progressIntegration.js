/**
 * progressIntegration.js
 *
 * Utility functions to help integrate games with the EnhancedProgressTracker
 * Provides standardized methods for tracking game events and progress
 */

import EnhancedProgressTracker from './EnhancedProgressTracker.js';

// Singleton instance
let progressTracker = null;

/**
 * Get or create the progress tracker instance
 * @returns {EnhancedProgressTracker} The progress tracker instance
 */
export function getProgressTracker() {
  if (!progressTracker) {
    progressTracker = new EnhancedProgressTracker();
  }
  return progressTracker;
}

/**
 * Initialize progress tracking for a game
 * @param {string} gameId - The game identifier
 * @param {Object} gameInfo - Additional game information
 */
export function initializeGameProgress(gameId, gameInfo = {}) {
  const tracker = getProgressTracker();

  // Mark game as played
  tracker.markGamePlayed(gameId);

  // Initialize session
  const sessionId = Date.now().toString();

  return {
    tracker,
    sessionId,
    gameId,
    startTime: Date.now(),
    sessionData: {
      score: 0,
      accuracy: 100,
      questionsAnswered: 0,
      correctAnswers: 0,
      mistakes: 0,
      hintsUsed: 0,
      ...gameInfo,
    },
  };
}

/**
 * Track a game event (answer, action, etc.)
 * @param {Object} session - The game session object
 * @param {Object} eventData - Event details
 */
export function trackGameEvent(session, eventData) {
  const { type, correct, score, skillType } = eventData;

  switch (type) {
  case 'answer':
    session.sessionData.questionsAnswered++;
    if (correct) {
      session.sessionData.correctAnswers++;
    } else {
      session.sessionData.mistakes++;
    }
    session.sessionData.accuracy =
        (session.sessionData.correctAnswers / session.sessionData.questionsAnswered) * 100;
    break;

  case 'hint':
    session.sessionData.hintsUsed++;
    break;

  case 'score':
    session.sessionData.score += score || 0;
    break;

  case 'skill':
    if (!session.sessionData.skills) {
      session.sessionData.skills = {};
    }
    if (!session.sessionData.skills[skillType]) {
      session.sessionData.skills[skillType] = {
        attempts: 0,
        correct: 0,
      };
    }
    session.sessionData.skills[skillType].attempts++;
    if (correct) {
      session.sessionData.skills[skillType].correct++;
    }
    break;
  }

  // Check for achievements after each event
  checkEventAchievements(session, eventData);
}

/**
 * End a game session and save progress
 * @param {Object} session - The game session object
 * @param {Object} finalData - Final session data
 */
export function endGameSession(session, finalData = {}) {
  const duration = Math.floor((Date.now() - session.startTime) / 1000);

  const sessionResult = {
    gameId: session.gameId,
    score: session.sessionData.score,
    accuracy: session.sessionData.accuracy,
    totalQuestions: session.sessionData.questionsAnswered,
    correctAnswers: session.sessionData.correctAnswers,
    mistakes: session.sessionData.mistakes,
    hintsUsed: session.sessionData.hintsUsed,
    duration,
    timestamp: Date.now(),
    ...finalData,
  };

  // Update progress tracker
  session.tracker.updateGameProgress(session.gameId, sessionResult);

  // Check for session-end achievements
  checkSessionAchievements(session, sessionResult);

  return sessionResult;
}

/**
 * Check for achievements based on game events
 * @param {Object} session - The game session object
 * @param {Object} eventData - Event details
 */
function checkEventAchievements(session, eventData) {
  const { gameId, tracker, sessionData } = session;

  // Perfect streak achievements
  if (sessionData.questionsAnswered >= 5 && sessionData.accuracy === 100) {
    tracker.checkAchievement(`${gameId}-perfect-start`);
  }

  if (sessionData.questionsAnswered >= 10 && sessionData.accuracy === 100) {
    tracker.checkAchievement(`${gameId}-flawless-ten`);
  }

  // No hints achievement
  if (sessionData.questionsAnswered >= 20 && sessionData.hintsUsed === 0) {
    tracker.checkAchievement(`${gameId}-no-hints-needed`);
  }

  // Game-specific event achievements
  checkGameSpecificEventAchievements(gameId, session, eventData);
}

/**
 * Check for achievements at session end
 * @param {Object} session - The game session object
 * @param {Object} sessionResult - Final session results
 */
function checkSessionAchievements(session, sessionResult) {
  const { gameId, tracker } = session;

  // High score achievement
  const analytics = tracker.gameAnalytics[gameId];
  if (analytics && sessionResult.score === analytics.highScore) {
    tracker.checkAchievement(`${gameId}-high-scorer`);
  }

  // Perfect game achievement
  if (sessionResult.accuracy === 100 && sessionResult.totalQuestions >= 20) {
    tracker.checkAchievement(`${gameId}-perfectionist`);
  }

  // Speed achievements
  if (sessionResult.duration <= 120 && sessionResult.score >= 100) {
    tracker.checkAchievement(`${gameId}-speed-demon`);
  }

  // Check all cross-game achievements
  tracker.checkAllCrossGameAchievements();
}

/**
 * Game-specific achievement checking
 * @param {string} gameId - The game identifier
 * @param {Object} session - The game session object
 * @param {Object} eventData - Event details
 */
function checkGameSpecificEventAchievements(gameId, session, eventData) {
  const { tracker, sessionData } = session;

  switch (gameId) {
  case 'word-scramble':
    // Long word achievements
    if (eventData.wordLength >= 7 && eventData.correct) {
      tracker.checkAchievement('word-scramble-word-wizard');
    }
    break;

  case 'number-line-jump':
    // Complex equation achievements
    if (eventData.equationType === 'complex' && eventData.correct) {
      const complexCorrect = (sessionData.complexCorrect || 0) + 1;
      session.sessionData.complexCorrect = complexCorrect;
      if (complexCorrect >= 10) {
        tracker.checkAchievement('number-line-jump-equation-expert');
      }
    }
    break;

  case 'element-match':
    // Multiple match type achievements
    if (eventData.matchType && eventData.correct) {
      if (!sessionData.matchTypes) {
        session.sessionData.matchTypes = new Set();
      }
      session.sessionData.matchTypes.add(eventData.matchType);
      if (session.sessionData.matchTypes.size >= 5) {
        tracker.checkAchievement('element-match-chemistry-champion');
      }
    }
    break;

  case 'sentence-builder':
    // Complex sentence achievements
    if (eventData.sentenceComplexity === 'complex' && eventData.correct) {
      const complexSentences = (sessionData.complexSentences || 0) + 1;
      session.sessionData.complexSentences = complexSentences;
      if (complexSentences >= 5) {
        tracker.checkAchievement('sentence-builder-sentence-sculptor');
      }
    }
    break;

  case 'color-palette':
    // Color harmony achievements
    if (eventData.harmonyType && eventData.correct) {
      if (!sessionData.harmonies) {
        session.sessionData.harmonies = new Set();
      }
      session.sessionData.harmonies.add(eventData.harmonyType);
      if (session.sessionData.harmonies.size >= 4) {
        tracker.checkAchievement('color-palette-harmony-hero');
      }
    }
    break;
  }
}

/**
 * Helper function to format progress data for display
 * @param {string} gameId - The game identifier
 * @returns {Object} Formatted progress data
 */
export function getGameProgressSummary(gameId) {
  const tracker = getProgressTracker();
  const analytics = tracker.gameAnalytics[gameId] || tracker.getDefaultGameAnalytics();
  const achievements = tracker.getGameAchievements(gameId);

  return {
    sessionsPlayed: analytics.sessionsPlayed,
    totalTime: analytics.totalTimePlayed,
    highScore: analytics.highScore,
    averageScore: Math.round(analytics.averageScore),
    accuracy: Math.round(analytics.accuracy),
    achievements: {
      unlocked: achievements.filter(a => a.unlocked).length,
      total: achievements.length,
      recent: achievements
        .filter(a => a.unlocked)
        .sort((a, b) => b.unlockedAt - a.unlockedAt)
        .slice(0, 3),
    },
    recentSessions: analytics.sessionHistory.slice(-5).reverse(),
  };
}

/**
 * Create a progress display element
 * @param {string} gameId - The game identifier
 * @returns {HTMLElement} Progress display element
 */
export function createProgressDisplay(gameId) {
  const summary = getGameProgressSummary(gameId);

  const display = document.createElement('div');
  display.className = 'game-progress-display';

  display.innerHTML = `
    <div class="progress-stats">
      <div class="stat">
        <span class="stat-value">${summary.highScore}</span>
        <span class="stat-label">High Score</span>
      </div>
      <div class="stat">
        <span class="stat-value">${summary.accuracy}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      <div class="stat">
        <span class="stat-value">${summary.achievements.unlocked}/${summary.achievements.total}</span>
        <span class="stat-label">Achievements</span>
      </div>
    </div>
    ${
  summary.achievements.recent.length > 0
    ? `
      <div class="recent-achievements">
        <h4>Recent Achievements</h4>
        ${summary.achievements.recent
    .map(
      a => `
          <div class="achievement-badge">
            <span class="badge-icon">${a.icon}</span>
            <span class="badge-name">${a.name}</span>
          </div>
        `
    )
    .join('')}
      </div>
    `
    : ''
}
  `;

  return display;
}

/**
 * Show achievement unlock animation
 * @param {Object} achievement - The achievement object
 */
export function showAchievementUnlock(achievement) {
  // Dispatch event for dashboard notification
  window.dispatchEvent(
    new CustomEvent('achievementUnlocked', {
      detail: achievement,
    })
  );

  // Also show in-game notification if desired
  const notification = document.createElement('div');
  notification.className = 'game-achievement-unlock';
  notification.innerHTML = `
    <div class="unlock-icon">${achievement.icon}</div>
    <div class="unlock-text">
      <div class="unlock-title">Achievement Unlocked!</div>
      <div class="unlock-name">${achievement.name}</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Export all functions
export default {
  getProgressTracker,
  initializeGameProgress,
  trackGameEvent,
  endGameSession,
  getGameProgressSummary,
  createProgressDisplay,
  showAchievementUnlock,
};
