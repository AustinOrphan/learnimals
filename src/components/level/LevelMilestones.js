/**
 * LevelMilestones.js
 * 
 * Component for managing level milestone rewards and special unlocks
 */


// Level milestone definitions
const LEVEL_MILESTONES = {
  5: {
    rewards: [
      { type: 'badge', id: 'first-steps-mastery', icon: '🌟', text: 'First Steps Mastery Badge' },
      { type: 'feature', id: 'profile-customization', icon: '🎨', text: 'Profile Customization Unlocked' }
    ],
    celebration: 'common',
    message: 'You\'re getting the hang of learning!'
  },
  
  10: {
    rewards: [
      { type: 'badge', id: 'double-digits', icon: '🏆', text: 'Double Digits Achievement' },
      { type: 'feature', id: 'advanced-games', icon: '🎮', text: 'Advanced Game Modes Unlocked' },
      { type: 'boost', id: 'xp-boost-10', icon: '⚡', text: '10% XP Boost for 1 week' }
    ],
    celebration: 'rare',
    message: 'Double digits - amazing progress!'
  },
  
  15: {
    rewards: [
      { type: 'badge', id: 'consistent-learner', icon: '📚', text: 'Consistent Learner Badge' },
      { type: 'feature', id: 'custom-themes', icon: '🎨', text: 'Custom Themes Unlocked' }
    ],
    celebration: 'common',
    message: 'You\'re developing great learning habits!'
  },
  
  20: {
    rewards: [
      { type: 'badge', id: 'knowledge-seeker', icon: '🔍', text: 'Knowledge Seeker Badge' },
      { type: 'feature', id: 'progress-analytics', icon: '📊', text: 'Progress Analytics Unlocked' },
      { type: 'boost', id: 'xp-boost-15', icon: '⚡', text: '15% XP Boost for 1 week' }
    ],
    celebration: 'rare',
    message: 'Your dedication to learning is impressive!'
  },
  
  25: {
    rewards: [
      { type: 'badge', id: 'quarter-century', icon: '🥈', text: 'Quarter Century Learner' },
      { type: 'feature', id: 'mentor-mode', icon: '👨‍🏫', text: 'Mentor Mode Unlocked' },
      { type: 'title', id: 'scholar', icon: '🎓', text: 'Scholar Title' }
    ],
    celebration: 'epic',
    message: 'Quarter-century of learning excellence!'
  },
  
  30: {
    rewards: [
      { type: 'badge', id: 'expert-path', icon: '🛤️', text: 'Expert Path Badge' },
      { type: 'boost', id: 'xp-boost-20', icon: '⚡', text: '20% XP Boost for 2 weeks' }
    ],
    celebration: 'rare',
    message: 'You\'re on the path to expertise!'
  },
  
  40: {
    rewards: [
      { type: 'badge', id: 'wisdom-keeper', icon: '🦉', text: 'Wisdom Keeper Badge' },
      { type: 'feature', id: 'advanced-analytics', icon: '📈', text: 'Advanced Analytics Suite' },
      { type: 'title', id: 'expert', icon: '💎', text: 'Expert Title' }
    ],
    celebration: 'epic',
    message: 'Your expertise is truly showing!'
  },
  
  50: {
    rewards: [
      { type: 'badge', id: 'halfway-hero', icon: '🥇', text: 'Halfway to Greatness' },
      { type: 'feature', id: 'create-content', icon: '✍️', text: 'Content Creation Tools' },
      { type: 'boost', id: 'xp-boost-25', icon: '⚡', text: '25% XP Boost for 1 month' },
      { type: 'title', id: 'master', icon: '👑', text: 'Master Title' }
    ],
    celebration: 'legendary',
    message: 'Halfway to greatness - incredible achievement!'
  },
  
  75: {
    rewards: [
      { type: 'badge', id: 'almost-legend', icon: '🌟', text: 'Almost Legendary' },
      { type: 'feature', id: 'beta-features', icon: '🚀', text: 'Beta Features Access' },
      { type: 'title', id: 'champion', icon: '🏆', text: 'Champion Title' }
    ],
    celebration: 'legendary',
    message: 'You\'re almost legendary!'
  },
  
  100: {
    rewards: [
      { type: 'badge', id: 'legend-status', icon: '👑', text: 'Legend Status Achieved' },
      { type: 'feature', id: 'prestige-mode', icon: '✨', text: 'Prestige Mode Unlocked' },
      { type: 'boost', id: 'xp-boost-50', icon: '⚡', text: '50% XP Boost (Permanent)' },
      { type: 'title', id: 'legend', icon: '⭐', text: 'Legend Title' },
      { type: 'special', id: 'hall-of-fame', icon: '🏛️', text: 'Hall of Fame Entry' }
    ],
    celebration: 'prestige',
    message: 'Welcome to Legend status - you\'ve joined the elite!'
  }
};

// Prestige milestones (every 100 levels after 100)
const PRESTIGE_MILESTONE_TEMPLATE = {
  rewards: [
    { type: 'badge', id: 'prestige-star', icon: '⭐', text: 'Prestige Star' },
    { type: 'feature', id: 'prestige-benefits', icon: '💫', text: 'Enhanced Prestige Benefits' },
    { type: 'boost', id: 'prestige-xp-boost', icon: '⚡', text: 'Prestige XP Multiplier' }
  ],
  celebration: 'prestige',
  message: 'Prestige level achieved - your dedication knows no bounds!'
};

class LevelMilestones {
  constructor() {
    this.unlockedMilestones = this.loadUnlockedMilestones();
    this.pendingRewards = [];
  }
  
  /**
   * Check if a level has milestone rewards
   * @param {number} level - Level to check
   * @returns {boolean} True if level has milestones
   */
  hasMilestone(level) {
    return Object.prototype.hasOwnProperty.call(LEVEL_MILESTONES, level) || (level >= 100 && level % 100 === 0);
  }
  
  /**
   * Get milestone data for a level
   * @param {number} level - Level to get milestone for
   * @returns {Object|null} Milestone data or null
   */
  getMilestone(level) {
    if (LEVEL_MILESTONES[level]) {
      return {
        level,
        ...LEVEL_MILESTONES[level],
        id: `milestone-${level}`
      };
    }
    
    if (level >= 100 && level % 100 === 0) {
      const prestigeLevel = Math.floor(level / 100);
      return {
        level,
        id: `prestige-${prestigeLevel}`,
        ...PRESTIGE_MILESTONE_TEMPLATE,
        message: `Prestige ${prestigeLevel} achieved - your dedication knows no bounds!`,
        rewards: PRESTIGE_MILESTONE_TEMPLATE.rewards.map(reward => ({
          ...reward,
          text: reward.text.replace('Prestige', `Prestige ${prestigeLevel}`)
        }))
      };
    }
    
    return null;
  }
  
  /**
   * Check for new milestones when leveling up
   * @param {number} oldLevel - Previous level
   * @param {number} newLevel - New level
   * @returns {Array} Array of milestone rewards
   */
  checkLevelUp(oldLevel, newLevel) {
    const newMilestones = [];
    
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      if (this.hasMilestone(level) && !this.isUnlocked(level)) {
        const milestone = this.getMilestone(level);
        if (milestone) {
          newMilestones.push(milestone);
          this.unlockMilestone(level);
        }
      }
    }
    
    return newMilestones;
  }
  
  /**
   * Check if a milestone is already unlocked
   * @param {number} level - Level to check
   * @returns {boolean} True if unlocked
   */
  isUnlocked(level) {
    return this.unlockedMilestones.includes(level);
  }
  
  /**
   * Unlock a milestone
   * @param {number} level - Level to unlock
   */
  unlockMilestone(level) {
    if (!this.isUnlocked(level)) {
      this.unlockedMilestones.push(level);
      this.saveUnlockedMilestones();
    }
  }
  
  /**
   * Get all unlocked milestones
   * @returns {Array} Array of unlocked milestone levels
   */
  getUnlockedMilestones() {
    return [...this.unlockedMilestones];
  }
  
  /**
   * Get next milestone
   * @param {number} currentLevel - Current level
   * @returns {Object|null} Next milestone data
   */
  getNextMilestone(currentLevel) {
    const milestoneKeys = Object.keys(LEVEL_MILESTONES).map(Number).sort((a, b) => a - b);
    
    // Check regular milestones
    for (const level of milestoneKeys) {
      if (level > currentLevel) {
        return {
          level,
          levelsToGo: level - currentLevel,
          ...this.getMilestone(level)
        };
      }
    }
    
    // Check prestige milestones
    if (currentLevel >= 100) {
      const nextPrestige = Math.ceil(currentLevel / 100) * 100;
      if (nextPrestige > currentLevel) {
        return {
          level: nextPrestige,
          levelsToGo: nextPrestige - currentLevel,
          ...this.getMilestone(nextPrestige)
        };
      }
    } else {
      // Next prestige is level 100
      return {
        level: 100,
        levelsToGo: 100 - currentLevel,
        ...this.getMilestone(100)
      };
    }
    
    return null;
  }
  
  /**
   * Get milestone progress for display
   * @param {number} currentLevel - Current level
   * @returns {Object} Progress data
   */
  getMilestoneProgress(currentLevel) {
    const next = this.getNextMilestone(currentLevel);
    if (!next) return null;
    
    let previousMilestone = 0;
    const milestoneKeys = Object.keys(LEVEL_MILESTONES).map(Number).sort((a, b) => a - b);
    
    for (const level of milestoneKeys) {
      if (level > currentLevel) break;
      previousMilestone = level;
    }
    
    if (currentLevel >= 100) {
      previousMilestone = Math.floor(currentLevel / 100) * 100;
    }
    
    const totalLevels = next.level - previousMilestone;
    const completedLevels = currentLevel - previousMilestone;
    const progress = totalLevels > 0 ? completedLevels / totalLevels : 0;
    
    return {
      next,
      previousMilestone,
      totalLevels,
      completedLevels,
      progress,
      percentage: Math.round(progress * 100)
    };
  }
  
  /**
   * Apply milestone rewards
   * @param {Object} milestone - Milestone data
   * @returns {Array} Applied rewards
   */
  applyRewards(milestone) {
    const appliedRewards = [];
    
    for (const reward of milestone.rewards) {
      try {
        const result = this.applyReward(reward);
        if (result) {
          appliedRewards.push({
            ...reward,
            applied: true,
            result
          });
        }
      } catch (error) {
        console.warn(`Failed to apply reward ${reward.id}:`, error);
        appliedRewards.push({
          ...reward,
          applied: false,
          error: error.message
        });
      }
    }
    
    return appliedRewards;
  }
  
  /**
   * Apply individual reward
   * @param {Object} reward - Reward data
   * @returns {Object|null} Application result
   */
  applyReward(reward) {
    switch (reward.type) {
    case 'badge':
      return this.applyBadgeReward(reward);
    case 'feature':
      return this.applyFeatureReward(reward);
    case 'boost':
      return this.applyBoostReward(reward);
    case 'title':
      return this.applyTitleReward(reward);
    case 'special':
      return this.applySpecialReward(reward);
    default:
      console.warn(`Unknown reward type: ${reward.type}`);
      return null;
    }
  }
  
  /**
   * Apply badge reward
   * @param {Object} reward - Badge reward
   * @returns {Object} Application result
   */
  applyBadgeReward(reward) {
    // This would integrate with the badge/achievement system
    // For now, just return success
    return {
      type: 'badge',
      message: `${reward.text} unlocked!`,
      data: reward
    };
  }
  
  /**
   * Apply feature reward
   * @param {Object} reward - Feature reward
   * @returns {Object} Application result
   */
  applyFeatureReward(reward) {
    // Store unlocked features
    const unlockedFeatures = this.getUnlockedFeatures();
    if (!unlockedFeatures.includes(reward.id)) {
      unlockedFeatures.push(reward.id);
      this.saveUnlockedFeatures(unlockedFeatures);
    }
    
    return {
      type: 'feature',
      message: `${reward.text}!`,
      data: reward
    };
  }
  
  /**
   * Apply boost reward
   * @param {Object} reward - Boost reward
   * @returns {Object} Application result
   */
  applyBoostReward(reward) {
    // Store active boosts
    const boosts = this.getActiveBoosts();
    const duration = this.getBoostDuration(reward.id);
    
    boosts.push({
      id: reward.id,
      type: 'xp_multiplier',
      value: this.getBoostValue(reward.id),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration).toISOString(),
      description: reward.text
    });
    
    this.saveActiveBoosts(boosts);
    
    return {
      type: 'boost',
      message: `${reward.text} activated!`,
      data: reward
    };
  }
  
  /**
   * Apply title reward
   * @param {Object} reward - Title reward
   * @returns {Object} Application result
   */
  applyTitleReward(reward) {
    // Store unlocked titles
    const unlockedTitles = this.getUnlockedTitles();
    if (!unlockedTitles.includes(reward.id)) {
      unlockedTitles.push(reward.id);
      this.saveUnlockedTitles(unlockedTitles);
    }
    
    return {
      type: 'title',
      message: `${reward.text} earned!`,
      data: reward
    };
  }
  
  /**
   * Apply special reward
   * @param {Object} reward - Special reward
   * @returns {Object} Application result
   */
  applySpecialReward(reward) {
    // Handle special rewards like hall of fame entry
    return {
      type: 'special',
      message: `${reward.text}!`,
      data: reward
    };
  }
  
  /**
   * Get boost duration in milliseconds
   * @param {string} boostId - Boost ID
   * @returns {number} Duration in milliseconds
   */
  getBoostDuration(boostId) {
    const durations = {
      'xp-boost-10': 7 * 24 * 60 * 60 * 1000,  // 1 week
      'xp-boost-15': 7 * 24 * 60 * 60 * 1000,  // 1 week
      'xp-boost-20': 14 * 24 * 60 * 60 * 1000, // 2 weeks
      'xp-boost-25': 30 * 24 * 60 * 60 * 1000, // 1 month
      'xp-boost-50': Number.MAX_SAFE_INTEGER,   // Permanent
      'prestige-xp-boost': Number.MAX_SAFE_INTEGER // Permanent
    };
    
    return durations[boostId] || 24 * 60 * 60 * 1000; // Default 1 day
  }
  
  /**
   * Get boost value (multiplier)
   * @param {string} boostId - Boost ID
   * @returns {number} Boost multiplier
   */
  getBoostValue(boostId) {
    const values = {
      'xp-boost-10': 1.1,   // 10%
      'xp-boost-15': 1.15,  // 15%
      'xp-boost-20': 1.2,   // 20%
      'xp-boost-25': 1.25,  // 25%
      'xp-boost-50': 1.5,   // 50%
      'prestige-xp-boost': 1.5 // 50%
    };
    
    return values[boostId] || 1.1; // Default 10%
  }
  
  /**
   * Load unlocked milestones from storage
   * @returns {Array} Array of unlocked milestone levels
   */
  loadUnlockedMilestones() {
    try {
      const stored = localStorage.getItem('learnimals-unlocked-milestones');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Error loading unlocked milestones:', e);
      return [];
    }
  }
  
  /**
   * Save unlocked milestones to storage
   */
  saveUnlockedMilestones() {
    try {
      localStorage.setItem('learnimals-unlocked-milestones', JSON.stringify(this.unlockedMilestones));
    } catch (e) {
      console.warn('Error saving unlocked milestones:', e);
    }
  }
  
  /**
   * Get unlocked features
   * @returns {Array} Array of unlocked feature IDs
   */
  getUnlockedFeatures() {
    try {
      const stored = localStorage.getItem('learnimals-unlocked-features');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Save unlocked features
   * @param {Array} features - Array of feature IDs
   */
  saveUnlockedFeatures(features) {
    try {
      localStorage.setItem('learnimals-unlocked-features', JSON.stringify(features));
    } catch (e) {
      console.warn('Error saving unlocked features:', e);
    }
  }
  
  /**
   * Get active boosts
   * @returns {Array} Array of active boost objects
   */
  getActiveBoosts() {
    try {
      const stored = localStorage.getItem('learnimals-active-boosts');
      const boosts = stored ? JSON.parse(stored) : [];
      
      // Filter out expired boosts
      const now = new Date();
      const activeBoosts = boosts.filter(boost => new Date(boost.endDate) > now);
      
      // Save filtered list if it changed
      if (activeBoosts.length !== boosts.length) {
        this.saveActiveBoosts(activeBoosts);
      }
      
      return activeBoosts;
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Save active boosts
   * @param {Array} boosts - Array of boost objects
   */
  saveActiveBoosts(boosts) {
    try {
      localStorage.setItem('learnimals-active-boosts', JSON.stringify(boosts));
    } catch (e) {
      console.warn('Error saving active boosts:', e);
    }
  }
  
  /**
   * Get unlocked titles
   * @returns {Array} Array of unlocked title IDs
   */
  getUnlockedTitles() {
    try {
      const stored = localStorage.getItem('learnimals-unlocked-titles');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Save unlocked titles
   * @param {Array} titles - Array of title IDs
   */
  saveUnlockedTitles(titles) {
    try {
      localStorage.setItem('learnimals-unlocked-titles', JSON.stringify(titles));
    } catch (e) {
      console.warn('Error saving unlocked titles:', e);
    }
  }
  
  /**
   * Get current XP multiplier from active boosts
   * @returns {number} XP multiplier
   */
  getCurrentXPMultiplier() {
    const boosts = this.getActiveBoosts();
    let multiplier = 1;
    
    for (const boost of boosts) {
      if (boost.type === 'xp_multiplier') {
        multiplier *= boost.value;
      }
    }
    
    return multiplier;
  }
  
  /**
   * Static method to get singleton instance
   */
  static getInstance() {
    if (!LevelMilestones.instance) {
      LevelMilestones.instance = new LevelMilestones();
    }
    return LevelMilestones.instance;
  }
}

// Export milestone constants for external use
export { LEVEL_MILESTONES, PRESTIGE_MILESTONE_TEMPLATE };
export default LevelMilestones;