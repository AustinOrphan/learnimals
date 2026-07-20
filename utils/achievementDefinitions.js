// Achievement Definitions for Learnimals Games
// Comprehensive achievement system covering all educational games and cross-game progress

/**
 * Achievement categories and definitions for all games in Learnimals
 * Each achievement includes criteria, rewards, and educational value
 */

export const achievementCategories = {
  GAME_SPECIFIC: 'game-specific',
  CROSS_GAME: 'cross-game',
  MILESTONE: 'milestone',
  MASTERY: 'mastery',
  EXPLORATION: 'exploration',
};

export const achievementDifficulty = {
  BRONZE: { multiplier: 1, color: '#CD7F32', icon: '🥉' },
  SILVER: { multiplier: 2, color: '#C0C0C0', icon: '🥈' },
  GOLD: { multiplier: 3, color: '#FFD700', icon: '🥇' },
  PLATINUM: { multiplier: 5, color: '#E5E4E2', icon: '💎' },
};

// Game-specific achievements
export const gameAchievements = {
  // Word Scramble (Reading) - Bella the Bunny
  'word-scramble': {
    'first-word': {
      id: 'first-word',
      name: 'First Word',
      description: 'Complete your first word scramble puzzle',
      icon: '📝',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.BRONZE,
      criteria: {
        type: 'count',
        event: 'word-completed',
        target: 1,
      },
      reward: {
        points: 50,
        badge: 'Word Explorer',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'speed-reader': {
      id: 'speed-reader',
      name: 'Speed Reader',
      description: 'Solve a word puzzle in under 30 seconds',
      icon: '⚡',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'time',
        event: 'word-completed',
        target: 30000, // 30 seconds in milliseconds
        comparison: 'less_than',
      },
      reward: {
        points: 100,
        badge: 'Lightning Reader',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'vocabulary-master': {
      id: 'vocabulary-master',
      name: 'Vocabulary Master',
      description: 'Complete 10 word scramble puzzles',
      icon: '📚',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'count',
        event: 'word-completed',
        target: 10,
      },
      reward: {
        points: 300,
        badge: 'Word Master',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'perfect-round': {
      id: 'perfect-round',
      name: 'Perfect Round',
      description: 'Complete a word without using any hints',
      icon: '🎯',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'perfect',
        event: 'word-completed',
        condition: 'no-hints',
      },
      reward: {
        points: 150,
        badge: 'Perfect Speller',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'reading-streak': {
      id: 'reading-streak',
      name: 'Reading Streak',
      description: 'Complete 5 word puzzles in a row without mistakes',
      icon: '🔥',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'streak',
        event: 'word-completed',
        target: 5,
        condition: 'perfect',
      },
      reward: {
        points: 250,
        badge: 'Reading Champion',
      },
      character: 'Bella',
      subject: 'reading',
    },
  },

  // Number Line Jump (Math) - Leo the Lion
  'number-line-jump': {
    'first-jump': {
      id: 'first-jump',
      name: 'First Jump',
      description: 'Complete your first number line equation',
      icon: '🦘',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.BRONZE,
      criteria: {
        type: 'count',
        event: 'equation-completed',
        target: 1,
      },
      reward: {
        points: 50,
        badge: 'Number Explorer',
      },
      character: 'Leo',
      subject: 'math',
    },
    'math-whiz': {
      id: 'math-whiz',
      name: 'Math Whiz',
      description: 'Solve 10 equations correctly',
      icon: '🧮',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'count',
        event: 'equation-completed',
        target: 10,
        condition: 'correct',
      },
      reward: {
        points: 300,
        badge: 'Math Genius',
      },
      character: 'Leo',
      subject: 'math',
    },
    'speed-calculator': {
      id: 'speed-calculator',
      name: 'Speed Calculator',
      description: 'Solve an equation in under 20 seconds',
      icon: '💨',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'time',
        event: 'equation-completed',
        target: 20000,
        comparison: 'less_than',
      },
      reward: {
        points: 150,
        badge: 'Quick Thinker',
      },
      character: 'Leo',
      subject: 'math',
    },
    'perfect-precision': {
      id: 'perfect-precision',
      name: 'Perfect Precision',
      description: 'Complete a level without any mistakes',
      icon: '🎯',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'perfect',
        event: 'level-completed',
        condition: 'no-mistakes',
      },
      reward: {
        points: 200,
        badge: 'Precision Master',
      },
      character: 'Leo',
      subject: 'math',
    },
    'number-master': {
      id: 'number-master',
      name: 'Number Master',
      description: 'Reach level 5 in Number Line Jump',
      icon: '👑',
      category: achievementCategories.MILESTONE,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'level',
        event: 'level-reached',
        target: 5,
      },
      reward: {
        points: 400,
        badge: 'Number King',
      },
      character: 'Leo',
      subject: 'math',
    },
  },

  // Element Match (Science) - Sage the Owl
  'element-match': {
    'first-discovery': {
      id: 'first-discovery',
      name: 'First Discovery',
      description: 'Match your first chemical element',
      icon: '🔬',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.BRONZE,
      criteria: {
        type: 'count',
        event: 'element-matched',
        target: 1,
      },
      reward: {
        points: 50,
        badge: 'Young Scientist',
      },
      character: 'Sage',
      subject: 'science',
    },
    'element-explorer': {
      id: 'element-explorer',
      name: 'Element Explorer',
      description: 'Learn about 15 different elements',
      icon: '🧪',
      category: achievementCategories.EXPLORATION,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'unique_count',
        event: 'element-learned',
        target: 15,
      },
      reward: {
        points: 350,
        badge: 'Chemistry Explorer',
      },
      character: 'Sage',
      subject: 'science',
    },
    'chemistry-star': {
      id: 'chemistry-star',
      name: 'Chemistry Star',
      description: 'Complete all difficulty levels in Element Match',
      icon: '⭐',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.PLATINUM,
      criteria: {
        type: 'difficulty_completion',
        event: 'difficulty-completed',
        target: ['easy', 'medium', 'hard'],
      },
      reward: {
        points: 500,
        badge: 'Chemistry Star',
      },
      character: 'Sage',
      subject: 'science',
    },
    'perfect-memory': {
      id: 'perfect-memory',
      name: 'Perfect Memory',
      description: 'Complete a round with perfect element matches',
      icon: '🧠',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'perfect',
        event: 'round-completed',
        condition: 'perfect-accuracy',
      },
      reward: {
        points: 200,
        badge: 'Memory Master',
      },
      character: 'Sage',
      subject: 'science',
    },
    'science-streak': {
      id: 'science-streak',
      name: 'Science Streak',
      description: 'Make 5 perfect element matches in a row',
      icon: '🔥',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'streak',
        event: 'element-matched',
        target: 5,
        condition: 'perfect',
      },
      reward: {
        points: 300,
        badge: 'Science Champion',
      },
      character: 'Sage',
      subject: 'science',
    },
  },

  // Sentence Builder (Reading) - Bella the Bunny
  'sentence-builder': {
    'grammar-beginner': {
      id: 'grammar-beginner',
      name: 'Grammar Beginner',
      description: 'Build your first complete sentence',
      icon: '✏️',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.BRONZE,
      criteria: {
        type: 'count',
        event: 'sentence-completed',
        target: 1,
      },
      reward: {
        points: 50,
        badge: 'Grammar Explorer',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'sentence-master': {
      id: 'sentence-master',
      name: 'Sentence Master',
      description: 'Complete 10 sentence building challenges',
      icon: '📖',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'count',
        event: 'sentence-completed',
        target: 10,
      },
      reward: {
        points: 300,
        badge: 'Sentence Master',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'perfect-grammar': {
      id: 'perfect-grammar',
      name: 'Perfect Grammar',
      description: 'Complete a round without any grammar mistakes',
      icon: '✅',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'perfect',
        event: 'round-completed',
        condition: 'perfect-grammar',
      },
      reward: {
        points: 200,
        badge: 'Grammar Guru',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'reading-comprehension': {
      id: 'reading-comprehension',
      name: 'Reading Comprehension',
      description: 'Complete all difficulty levels in Sentence Builder',
      icon: '🎓',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.PLATINUM,
      criteria: {
        type: 'difficulty_completion',
        event: 'difficulty-completed',
        target: ['easy', 'medium', 'hard'],
      },
      reward: {
        points: 500,
        badge: 'Reading Scholar',
      },
      character: 'Bella',
      subject: 'reading',
    },
    'language-artist': {
      id: 'language-artist',
      name: 'Language Artist',
      description: 'Create 25 perfect sentences',
      icon: '🎨',
      category: achievementCategories.EXPLORATION,
      difficulty: achievementDifficulty.PLATINUM,
      criteria: {
        type: 'count',
        event: 'sentence-completed',
        target: 25,
        condition: 'perfect',
      },
      reward: {
        points: 600,
        badge: 'Language Artist',
      },
      character: 'Bella',
      subject: 'reading',
    },
  },

  // Color Palette (Art) - Aria the Owl
  'color-palette': {
    'first-mix': {
      id: 'first-mix',
      name: 'First Mix',
      description: 'Create your first color by mixing primaries',
      icon: '🎨',
      category: achievementCategories.GAME_SPECIFIC,
      difficulty: achievementDifficulty.BRONZE,
      criteria: {
        type: 'count',
        event: 'color-mixed',
        target: 1,
      },
      reward: {
        points: 50,
        badge: 'Color Explorer',
      },
      character: 'Aria',
      subject: 'art',
    },
    'color-theory-student': {
      id: 'color-theory-student',
      name: 'Color Theory Student',
      description: 'Learn all primary and secondary colors',
      icon: '🌈',
      category: achievementCategories.EXPLORATION,
      difficulty: achievementDifficulty.SILVER,
      criteria: {
        type: 'knowledge',
        event: 'colors-learned',
        target: ['red', 'blue', 'yellow', 'orange', 'green', 'purple'],
      },
      reward: {
        points: 200,
        badge: 'Color Student',
      },
      character: 'Aria',
      subject: 'art',
    },
    'palette-creator': {
      id: 'palette-creator',
      name: 'Palette Creator',
      description: 'Create 5 beautiful color schemes',
      icon: '🖌️',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.GOLD,
      criteria: {
        type: 'count',
        event: 'palette-created',
        target: 5,
      },
      reward: {
        points: 300,
        badge: 'Palette Master',
      },
      character: 'Aria',
      subject: 'art',
    },
    'rainbow-master': {
      id: 'rainbow-master',
      name: 'Rainbow Master',
      description: 'Complete all color theory challenges',
      icon: '🌈',
      category: achievementCategories.MASTERY,
      difficulty: achievementDifficulty.PLATINUM,
      criteria: {
        type: 'completion',
        event: 'all-challenges-completed',
        target: 'color-theory',
      },
      reward: {
        points: 500,
        badge: 'Rainbow Master',
      },
      character: 'Aria',
      subject: 'art',
    },
    'artistic-vision': {
      id: 'artistic-vision',
      name: 'Artistic Vision',
      description: 'Create 10 perfect color palettes',
      icon: '👁️‍🗨️',
      category: achievementCategories.EXPLORATION,
      difficulty: achievementDifficulty.PLATINUM,
      criteria: {
        type: 'count',
        event: 'palette-created',
        target: 10,
        condition: 'perfect',
      },
      reward: {
        points: 600,
        badge: 'Artistic Visionary',
      },
      character: 'Aria',
      subject: 'art',
    },
  },
};

// Cross-game achievements that span multiple subjects
export const crossGameAchievements = {
  'multi-subject-learner': {
    id: 'multi-subject-learner',
    name: 'Multi-Subject Learner',
    description: 'Play all 5 educational games',
    icon: '🎯',
    category: achievementCategories.CROSS_GAME,
    difficulty: achievementDifficulty.GOLD,
    criteria: {
      type: 'games_played',
      target: [
        'word-scramble',
        'number-line-jump',
        'element-match',
        'sentence-builder',
        'color-palette',
      ],
    },
    reward: {
      points: 400,
      badge: 'Well-Rounded Learner',
    },
    subjects: ['math', 'science', 'reading', 'art'],
  },
  'knowledge-seeker': {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Earn 10 achievements across all games',
    icon: '🔍',
    category: achievementCategories.CROSS_GAME,
    difficulty: achievementDifficulty.GOLD,
    criteria: {
      type: 'achievements_earned',
      target: 10,
    },
    reward: {
      points: 500,
      badge: 'Knowledge Seeker',
    },
    subjects: ['math', 'science', 'reading', 'art'],
  },
  'learning-champion': {
    id: 'learning-champion',
    name: 'Learning Champion',
    description: 'Complete 50 challenges across all games',
    icon: '🏆',
    category: achievementCategories.CROSS_GAME,
    difficulty: achievementDifficulty.PLATINUM,
    criteria: {
      type: 'total_challenges',
      target: 50,
    },
    reward: {
      points: 1000,
      badge: 'Learning Champion',
    },
    subjects: ['math', 'science', 'reading', 'art'],
  },
  'perfect-student': {
    id: 'perfect-student',
    name: 'Perfect Student',
    description: 'Maintain 90% accuracy across all games',
    icon: '💯',
    category: achievementCategories.MASTERY,
    difficulty: achievementDifficulty.PLATINUM,
    criteria: {
      type: 'overall_accuracy',
      target: 90,
      minimum_attempts: 20,
    },
    reward: {
      points: 800,
      badge: 'Perfect Student',
    },
    subjects: ['math', 'science', 'reading', 'art'],
  },
  'dedicated-learner': {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Play educational games for 7 consecutive days',
    icon: '📅',
    category: achievementCategories.MILESTONE,
    difficulty: achievementDifficulty.GOLD,
    criteria: {
      type: 'consecutive_days',
      target: 7,
    },
    reward: {
      points: 350,
      badge: 'Dedicated Learner',
    },
    subjects: ['math', 'science', 'reading', 'art'],
  },
};

/**
 * Get all achievements for a specific game
 * @param {string} gameType - Type of game
 * @returns {Object} Game-specific achievements
 */
export function getGameAchievements(gameType) {
  return gameAchievements[gameType] || {};
}

/**
 * Get all cross-game achievements
 * @returns {Object} Cross-game achievements
 */
export function getCrossGameAchievements() {
  return crossGameAchievements;
}

/**
 * Get all achievements (game-specific and cross-game)
 * @returns {Object} All achievements
 */
export function getAllAchievements() {
  const allAchievements = {};

  // Add all game-specific achievements
  Object.values(gameAchievements).forEach(gameAchs => {
    Object.assign(allAchievements, gameAchs);
  });

  // Add cross-game achievements
  Object.assign(allAchievements, crossGameAchievements);

  return allAchievements;
}

/**
 * Get achievement by ID
 * @param {string} achievementId - Achievement identifier
 * @returns {Object|null} Achievement object or null
 */
export function getAchievementById(achievementId) {
  const allAchievements = getAllAchievements();
  return allAchievements[achievementId] || null;
}

/**
 * Get achievements by subject
 * @param {string} subject - Subject name
 * @returns {Array} Achievements for the subject
 */
export function getAchievementsBySubject(subject) {
  const allAchievements = getAllAchievements();
  return Object.values(allAchievements).filter(
    achievement =>
      achievement.subject === subject ||
      (achievement.subjects && achievement.subjects.includes(subject))
  );
}

/**
 * Get achievements by difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Achievements of specified difficulty
 */
export function getAchievementsByDifficulty(difficulty) {
  const allAchievements = getAllAchievements();
  return Object.values(allAchievements).filter(
    achievement => achievement.difficulty === achievementDifficulty[difficulty.toUpperCase()]
  );
}

/**
 * Calculate total possible points from all achievements
 * @returns {number} Total possible points
 */
export function getTotalPossiblePoints() {
  const allAchievements = getAllAchievements();
  return Object.values(allAchievements).reduce((total, achievement) => {
    return total + achievement.reward.points;
  }, 0);
}

export default {
  gameAchievements,
  crossGameAchievements,
  achievementCategories,
  achievementDifficulty,
  getGameAchievements,
  getCrossGameAchievements,
  getAllAchievements,
  getAchievementById,
  getAchievementsBySubject,
  getAchievementsByDifficulty,
  getTotalPossiblePoints,
};
