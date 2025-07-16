/**
 * badgeDefinitions.js
 * 
 * Visual badge definitions for achievements with rarity tiers
 */

// Badge rarity definitions
export const BADGE_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Rarity colors and effects
export const RARITY_CONFIG = {
  common: {
    color: '#8B8B8B',
    borderColor: '#6B6B6B',
    glowColor: 'rgba(139, 139, 139, 0.3)',
    particleCount: 0,
    animationClass: 'badge-common'
  },
  rare: {
    color: '#4A90E2',
    borderColor: '#357ABD',
    glowColor: 'rgba(74, 144, 226, 0.4)',
    particleCount: 3,
    animationClass: 'badge-rare'
  },
  epic: {
    color: '#9B59B6',
    borderColor: '#7B3F96',
    glowColor: 'rgba(155, 89, 182, 0.5)',
    particleCount: 5,
    animationClass: 'badge-epic'
  },
  legendary: {
    color: '#F39C12',
    borderColor: '#D68910',
    glowColor: 'rgba(243, 156, 18, 0.6)',
    particleCount: 8,
    animationClass: 'badge-legendary'
  }
};

// Badge shape definitions
export const BADGE_SHAPES = {
  CIRCLE: 'circle',
  HEXAGON: 'hexagon',
  SHIELD: 'shield',
  STAR: 'star',
  DIAMOND: 'diamond',
  RIBBON: 'ribbon'
};

// Badge definitions mapped to achievement IDs
export const BADGE_DEFINITIONS = {
  // Word Scramble badges
  'word-scramble-first-word': {
    name: 'First Steps',
    icon: '✏️',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Unscrambled your first word'
  },
  'word-scramble-word-streak': {
    name: 'Word Streak',
    icon: '🔥',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.RARE,
    description: '10 words in a row without mistakes'
  },
  'word-scramble-speed-demon': {
    name: 'Lightning Fast',
    icon: '⚡',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.RARE,
    description: 'Complete 20 words in under 2 minutes'
  },
  'word-scramble-no-hints': {
    name: 'Independent',
    icon: '🧠',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Complete a game without hints'
  },
  'word-scramble-perfectionist': {
    name: 'Word Master',
    icon: '👑',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Perfect accuracy in 50 words'
  },
  
  // Number Line Jump badges
  'number-line-jump-first-jump': {
    name: 'Leap of Faith',
    icon: '🦘',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Complete your first jump'
  },
  'number-line-jump-perfect-10': {
    name: 'Perfect Ten',
    icon: '🎯',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.RARE,
    description: '10 perfect jumps in a row'
  },
  'number-line-jump-high-level': {
    name: 'Mountain Climber',
    icon: '🏔️',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Reach level 20'
  },
  'number-line-jump-equation-expert': {
    name: 'Math Genius',
    icon: '🧮',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Solve 100 complex equations'
  },
  
  // Element Match badges
  'element-match-first-match': {
    name: 'Chemist in Training',
    icon: '🧪',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Match your first element'
  },
  'element-match-periodic-scholar': {
    name: 'Periodic Scholar',
    icon: '📊',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.RARE,
    description: 'Learn 20 elements'
  },
  'element-match-chemistry-champion': {
    name: 'Chemistry Champion',
    icon: '🏆',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Master all match types'
  },
  'element-match-element-master': {
    name: 'Element Master',
    icon: '⚛️',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Learn all elements'
  },
  
  // Sentence Builder badges
  'sentence-builder-first-sentence': {
    name: 'Wordsmith',
    icon: '📝',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Build your first sentence'
  },
  'sentence-builder-grammar-guru': {
    name: 'Grammar Guru',
    icon: '📚',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.RARE,
    description: '20 perfect sentences'
  },
  'sentence-builder-creative-writer': {
    name: 'Creative Writer',
    icon: '✍️',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Use all word types'
  },
  'sentence-builder-sentence-sculptor': {
    name: 'Sentence Sculptor',
    icon: '🎨',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Master complex sentences'
  },
  
  // Color Palette badges
  'color-palette-first-mix': {
    name: 'Color Explorer',
    icon: '🎨',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Mix your first color'
  },
  'color-palette-rainbow-creator': {
    name: 'Rainbow Creator',
    icon: '🌈',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.RARE,
    description: 'Create all primary colors'
  },
  'color-palette-harmony-hero': {
    name: 'Harmony Hero',
    icon: '🎭',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Master color harmonies'
  },
  'color-palette-palette-master': {
    name: 'Palette Master',
    icon: '👨‍🎨',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Create 50 perfect palettes'
  },
  
  // Cross-game achievements
  'multi-subject-learner': {
    name: 'Renaissance Kid',
    icon: '🎓',
    shape: BADGE_SHAPES.DIAMOND,
    rarity: BADGE_RARITY.RARE,
    description: 'Play all 5 games'
  },
  'achievement-hunter': {
    name: 'Collector',
    icon: '🏅',
    shape: BADGE_SHAPES.HEXAGON,
    rarity: BADGE_RARITY.EPIC,
    description: 'Earn 25 achievements'
  },
  'dedication-medal': {
    name: 'Dedicated Learner',
    icon: '💎',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: '7-day learning streak'
  },
  'learning-legend': {
    name: 'Learning Legend',
    icon: '🌟',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Earn all achievements'
  },
  
  // Level-based badges
  'level-5': {
    name: 'Rising Star',
    icon: '⭐',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.COMMON,
    description: 'Reach level 5'
  },
  'level-10': {
    name: 'Bright Student',
    icon: '🌟',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.RARE,
    description: 'Reach level 10'
  },
  'level-25': {
    name: 'Scholar',
    icon: '📖',
    shape: BADGE_SHAPES.SHIELD,
    rarity: BADGE_RARITY.EPIC,
    description: 'Reach level 25'
  },
  'level-50': {
    name: 'Master Learner',
    icon: '🎯',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Reach level 50'
  },
  'level-100': {
    name: 'Grandmaster',
    icon: '👑',
    shape: BADGE_SHAPES.STAR,
    rarity: BADGE_RARITY.LEGENDARY,
    description: 'Reach level 100',
    special: true,
    animation: 'rainbow-glow'
  }
};

// Badge categories for filtering
export const BADGE_CATEGORIES = {
  GAME: 'game',
  LEVEL: 'level',
  SOCIAL: 'social',
  SPECIAL: 'special',
  SEASONAL: 'seasonal'
};

// Get badge by achievement ID
export function getBadgeByAchievementId(achievementId) {
  return BADGE_DEFINITIONS[achievementId] || {
    name: 'Unknown Badge',
    icon: '❓',
    shape: BADGE_SHAPES.CIRCLE,
    rarity: BADGE_RARITY.COMMON,
    description: 'Mystery achievement'
  };
}

// Get badges by rarity
export function getBadgesByRarity(rarity) {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([_, badge]) => badge.rarity === rarity)
    .map(([id, badge]) => ({ id, ...badge }));
}

// Get badges by category
export function getBadgesByCategory(_category) {
  // This would need to be implemented based on achievement categories
  // For now, return all badges
  return Object.entries(BADGE_DEFINITIONS)
    .map(([id, badge]) => ({ id, ...badge }));
}

// Calculate badge score (for sorting/ranking)
export function calculateBadgeScore(badge) {
  const rarityScores = {
    [BADGE_RARITY.COMMON]: 10,
    [BADGE_RARITY.RARE]: 25,
    [BADGE_RARITY.EPIC]: 50,
    [BADGE_RARITY.LEGENDARY]: 100
  };
  
  let score = rarityScores[badge.rarity] || 0;
  if (badge.special) score += 50;
  
  return score;
}

// Get badge collection stats
export function getBadgeCollectionStats(unlockedBadgeIds) {
  const stats = {
    total: Object.keys(BADGE_DEFINITIONS).length,
    unlocked: unlockedBadgeIds.length,
    byRarity: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    },
    score: 0,
    nextMilestone: null
  };
  
  unlockedBadgeIds.forEach(badgeId => {
    const badge = BADGE_DEFINITIONS[badgeId];
    if (badge) {
      stats.byRarity[badge.rarity]++;
      stats.score += calculateBadgeScore(badge);
    }
  });
  
  // Calculate next milestone
  const milestones = [10, 25, 50, 75, 100];
  stats.nextMilestone = milestones.find(m => stats.unlocked < m) || null;
  
  return stats;
}

// Create badge element (for rendering)
export function createBadgeElement(badgeId, unlocked = false) {
  const badge = getBadgeByAchievementId(badgeId);
  const rarityConfig = RARITY_CONFIG[badge.rarity];
  
  const element = document.createElement('div');
  element.className = `badge ${badge.shape} ${rarityConfig.animationClass} ${unlocked ? 'unlocked' : 'locked'}`;
  element.style.setProperty('--badge-color', rarityConfig.color);
  element.style.setProperty('--badge-border', rarityConfig.borderColor);
  element.style.setProperty('--badge-glow', rarityConfig.glowColor);
  
  element.innerHTML = `
    <div class="badge-icon">${badge.icon}</div>
    <div class="badge-name">${badge.name}</div>
    ${badge.special ? '<div class="badge-special-effect"></div>' : ''}
  `;
  
  if (unlocked && rarityConfig.particleCount > 0) {
    // Add particle effects for rare+ badges
    for (let i = 0; i < rarityConfig.particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'badge-particle';
      particle.style.animationDelay = `${i * 0.2}s`;
      element.appendChild(particle);
    }
  }
  
  return element;
}

export default {
  BADGE_RARITY,
  RARITY_CONFIG,
  BADGE_SHAPES,
  BADGE_DEFINITIONS,
  BADGE_CATEGORIES,
  getBadgeByAchievementId,
  getBadgesByRarity,
  getBadgesByCategory,
  calculateBadgeScore,
  getBadgeCollectionStats,
  createBadgeElement
};