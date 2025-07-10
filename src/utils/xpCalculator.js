/**
 * xpCalculator.js
 * 
 * XP and level calculation utilities for the enhanced profile system
 */

const XP_CONFIG = {
  // Base XP values
  baseSessionXP: 10,
  perfectGameBonus: 50,
  firstTimeBonus: 25,
  dailyBonusXP: 20,
  streakBonusPerDay: 5,
  
  // Multipliers
  difficultyMultipliers: {
    easy: 0.8,
    medium: 1.0,
    hard: 1.5,
    expert: 2.0
  },
  
  // Achievement XP values
  achievementXP: {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100
  },
  
  // Game-specific bonuses
  gameCompletionXP: {
    'word-scramble': 15,
    'number-line-jump': 15,
    'element-match': 20,
    'sentence-builder': 20,
    'color-palette': 25
  },
  
  // Level curve settings
  levelCurve: {
    baseXP: 100,
    exponent: 2,
    scaling: 1
  }
};

class XPCalculator {
  /**
   * Calculate XP from a game session
   * @param {Object} sessionData - Game session data
   * @returns {Object} XP breakdown
   */
  calculateSessionXP(sessionData) {
    const breakdown = {
      base: XP_CONFIG.baseSessionXP,
      accuracy: 0,
      score: 0,
      time: 0,
      difficulty: 0,
      completion: 0,
      bonuses: [],
      total: 0
    };
    
    // Accuracy bonus (0-20 XP based on accuracy)
    if (sessionData.accuracy !== undefined) {
      breakdown.accuracy = Math.floor((sessionData.accuracy / 100) * 20);
    }
    
    // Score bonus (1 XP per 100 points)
    if (sessionData.score) {
      breakdown.score = Math.floor(sessionData.score / 100);
    }
    
    // Time bonus (faster completion = more XP)
    if (sessionData.duration && sessionData.expectedDuration) {
      const timeRatio = sessionData.expectedDuration / sessionData.duration;
      if (timeRatio > 1) {
        breakdown.time = Math.floor((timeRatio - 1) * 10);
        breakdown.bonuses.push({
          name: 'Speed Bonus',
          xp: breakdown.time
        });
      }
    }
    
    // Difficulty multiplier
    const difficulty = sessionData.difficulty || 'medium';
    const multiplier = XP_CONFIG.difficultyMultipliers[difficulty];
    breakdown.difficulty = Math.floor(breakdown.base * (multiplier - 1));
    
    // Completion bonus
    if (sessionData.completed) {
      const gameType = sessionData.gameType;
      breakdown.completion = XP_CONFIG.gameCompletionXP[gameType] || 10;
    }
    
    // Perfect game bonus
    if (sessionData.accuracy === 100 && sessionData.completed) {
      breakdown.bonuses.push({
        name: 'Perfect Game',
        xp: XP_CONFIG.perfectGameBonus
      });
    }
    
    // First time playing bonus
    if (sessionData.firstTime) {
      breakdown.bonuses.push({
        name: 'First Time',
        xp: XP_CONFIG.firstTimeBonus
      });
    }
    
    // Calculate total
    breakdown.total = breakdown.base + 
                     breakdown.accuracy + 
                     breakdown.score + 
                     breakdown.time + 
                     breakdown.difficulty + 
                     breakdown.completion;
    
    // Add bonuses
    breakdown.bonuses.forEach(bonus => {
      breakdown.total += bonus.xp;
    });
    
    return breakdown;
  }
  
  /**
   * Calculate daily bonus XP
   * @param {number} streakDays - Current streak
   * @returns {number} Bonus XP
   */
  calculateDailyBonus(streakDays) {
    const baseBonus = XP_CONFIG.dailyBonusXP;
    const streakBonus = Math.min(streakDays * XP_CONFIG.streakBonusPerDay, 50); // Cap at 50
    return baseBonus + streakBonus;
  }
  
  /**
   * Calculate XP from achievement
   * @param {Object} achievement - Achievement data
   * @returns {number} XP value
   */
  calculateAchievementXP(achievement) {
    const rarity = achievement.rarity || 'common';
    return XP_CONFIG.achievementXP[rarity] || 10;
  }
  
  /**
   * Calculate level from total XP
   * @param {number} totalXP - Total XP
   * @returns {number} Level
   */
  calculateLevel(totalXP) {
    // Level = floor(sqrt(XP / baseXP)) + 1
    const { baseXP, exponent, scaling } = XP_CONFIG.levelCurve;
    return Math.floor(Math.pow(totalXP / (baseXP * scaling), 1 / exponent)) + 1;
  }
  
  /**
   * Calculate XP required for a specific level
   * @param {number} level - Target level
   * @returns {number} Total XP required
   */
  calculateXPForLevel(level) {
    // XP = baseXP * (level - 1)^exponent * scaling
    const { baseXP, exponent, scaling } = XP_CONFIG.levelCurve;
    if (level <= 1) return 0;
    return Math.floor(baseXP * Math.pow(level - 1, exponent) * scaling);
  }
  
  /**
   * Calculate XP progress within current level
   * @param {number} totalXP - Total XP
   * @returns {Object} Progress data
   */
  calculateLevelProgress(totalXP) {
    const currentLevel = this.calculateLevel(totalXP);
    const currentLevelXP = this.calculateXPForLevel(currentLevel);
    const nextLevelXP = this.calculateXPForLevel(currentLevel + 1);
    const xpIntoLevel = totalXP - currentLevelXP;
    const xpForLevel = nextLevelXP - currentLevelXP;
    
    return {
      level: currentLevel,
      xpIntoLevel,
      xpForLevel,
      progress: xpIntoLevel / xpForLevel,
      xpToNext: xpForLevel - xpIntoLevel,
      totalXP,
      currentLevelXP,
      nextLevelXP
    };
  }
  
  /**
   * Get level title based on level
   * @param {number} level - Current level
   * @returns {string} Title
   */
  getLevelTitle(level) {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Learner';
    if (level < 20) return 'Student';
    if (level < 30) return 'Scholar';
    if (level < 40) return 'Expert';
    if (level < 50) return 'Master';
    if (level < 75) return 'Champion';
    if (level < 100) return 'Legend';
    return 'Grandmaster';
  }
  
  /**
   * Get prestige level (for levels 100+)
   * @param {number} level - Current level
   * @returns {Object} Prestige data
   */
  getPrestigeInfo(level) {
    if (level < 100) {
      return {
        prestige: 0,
        prestigeLevel: 0,
        stars: 0
      };
    }
    
    const prestige = Math.floor(level / 100);
    const prestigeLevel = level % 100;
    
    return {
      prestige,
      prestigeLevel: prestigeLevel || 100,
      stars: prestige,
      title: `Prestige ${prestige} ${this.getLevelTitle(prestigeLevel || 100)}`
    };
  }
  
  /**
   * Calculate combo multiplier
   * @param {number} comboCount - Current combo
   * @returns {number} Multiplier
   */
  calculateComboMultiplier(comboCount) {
    if (comboCount < 5) return 1;
    if (comboCount < 10) return 1.2;
    if (comboCount < 20) return 1.5;
    if (comboCount < 50) return 2;
    return 2.5;
  }
  
  /**
   * Get XP event description
   * @param {Object} xpBreakdown - XP breakdown from calculateSessionXP
   * @returns {Array} Event descriptions
   */
  getXPEventDescriptions(xpBreakdown) {
    const events = [];
    
    events.push({
      text: 'Base XP',
      value: `+${xpBreakdown.base}`,
      type: 'base'
    });
    
    if (xpBreakdown.accuracy > 0) {
      events.push({
        text: 'Accuracy Bonus',
        value: `+${xpBreakdown.accuracy}`,
        type: 'bonus'
      });
    }
    
    if (xpBreakdown.score > 0) {
      events.push({
        text: 'Score Bonus',
        value: `+${xpBreakdown.score}`,
        type: 'bonus'
      });
    }
    
    if (xpBreakdown.difficulty > 0) {
      events.push({
        text: 'Difficulty Bonus',
        value: `+${xpBreakdown.difficulty}`,
        type: 'bonus'
      });
    }
    
    if (xpBreakdown.completion > 0) {
      events.push({
        text: 'Completion Bonus',
        value: `+${xpBreakdown.completion}`,
        type: 'bonus'
      });
    }
    
    xpBreakdown.bonuses.forEach(bonus => {
      events.push({
        text: bonus.name,
        value: `+${bonus.xp}`,
        type: 'special'
      });
    });
    
    events.push({
      text: 'Total XP',
      value: `+${xpBreakdown.total}`,
      type: 'total'
    });
    
    return events;
  }
  
  /**
   * Estimate time to next level
   * @param {Object} progressData - Level progress data
   * @param {number} averageXPPerSession - Average XP per game session
   * @returns {Object} Time estimate
   */
  estimateTimeToLevel(progressData, averageXPPerSession = 50) {
    const xpNeeded = progressData.xpToNext;
    const sessionsNeeded = Math.ceil(xpNeeded / averageXPPerSession);
    
    return {
      xpNeeded,
      sessionsNeeded,
      estimatedMinutes: sessionsNeeded * 10, // Assume 10 min per session
      description: this.getTimeEstimateDescription(sessionsNeeded)
    };
  }
  
  /**
   * Get human-readable time estimate
   * @param {number} sessions - Number of sessions
   * @returns {string} Description
   */
  getTimeEstimateDescription(sessions) {
    if (sessions <= 1) return 'Next game!';
    if (sessions <= 3) return 'A few more games';
    if (sessions <= 10) return 'Several games';
    if (sessions <= 20) return 'Many games';
    return 'Keep playing!';
  }
}

// Create singleton instance
const xpCalculator = new XPCalculator();

// Export both the class and instance
export { XPCalculator, XP_CONFIG };
export default xpCalculator;