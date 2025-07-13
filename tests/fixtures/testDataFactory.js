/**
 * Test Data Factory
 * 
 * Provides realistic test data for the Learnimals application
 * Supports dynamic data generation and edge cases
 */

/**
 * Character Data Factory
 */
export const CharacterFactory = {
  create: (overrides = {}) => ({
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Max',
    species: {
      primary: 'cat',
      secondary: null
    },
    appearance: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        eyes: '#2C3E50'
      },
      patterns: {
        type: 'none',
        density: 50
      },
      features: {
        eyes: 'round',
        eyeSize: 'medium',
        mouth: 'smile',
        ears: 'pointed'
      }
    },
    personality: {
      traits: {
        enthusiasm: 75,
        patience: 60,
        playfulness: 80,
        empathy: 70,
        curiosity: 85
      },
      catchphrase: 'Let\'s learn together!',
      voice: {
        pitch: 1.2,
        rate: 1.0,
        volume: 0.8
      }
    },
    stats: {
      level: 1,
      experience: 0,
      gamesPlayed: 0,
      lessonsCompleted: 0
    },
    preferences: {
      favoriteSubjects: ['math', 'science'],
      difficulty: 'medium',
      themes: ['default']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createMinimal: (overrides = {}) => ({
    id: `char_minimal_${Date.now()}`,
    name: 'Test Character',
    species: { primary: 'cat' },
    appearance: { colors: { primary: '#FF0000' } },
    ...overrides
  }),

  createWithEdgeCases: () => ({
    ...CharacterFactory.create(),
    name: '', // Empty name
    appearance: {
      colors: {
        primary: '#000000', // Black
        secondary: '#FFFFFF', // White
        accent: '#FF00FF', // Magenta
        eyes: '#00FF00' // Green
      }
    },
    personality: {
      traits: {
        enthusiasm: 0, // Minimum
        patience: 100, // Maximum
        playfulness: 50, // Middle
        empathy: 0,
        curiosity: 100
      }
    }
  })
};

/**
 * Game Data Factory
 */
export const GameFactory = {
  createBubblePopGame: (overrides = {}) => ({
    gameId: 'bubble-pop',
    title: 'Bubble Pop Math',
    subject: 'math',
    difficulty: 'medium',
    settings: {
      timeLimit: 60,
      bubbleCount: 8,
      maxNumber: 20,
      minNumber: 1,
      scoreMultiplier: 1.0
    },
    state: {
      score: 0,
      level: 1,
      timeRemaining: 60,
      isRunning: false,
      isPaused: false
    },
    ...overrides
  }),

  createWordScrambleGame: (overrides = {}) => ({
    gameId: 'word-scramble',
    title: 'Word Scramble',
    subject: 'reading',
    difficulty: 'easy',
    settings: {
      timeLimit: 90,
      wordLength: 5,
      hintsEnabled: true
    },
    state: {
      score: 0,
      currentWord: 'HELLO',
      scrambledWord: 'LOLEH',
      timeRemaining: 90,
      hintsUsed: 0
    },
    ...overrides
  }),

  createGameSession: (overrides = {}) => ({
    sessionId: `session_${Date.now()}`,
    characterId: 'char_123',
    gameId: 'bubble-pop',
    startTime: new Date().toISOString(),
    endTime: null,
    score: 0,
    achievements: [],
    statistics: {
      correctAnswers: 0,
      wrongAnswers: 0,
      totalTime: 0,
      averageResponseTime: 0
    },
    ...overrides
  })
};

/**
 * Progress Data Factory
 */
export const ProgressFactory = {
  createUserProgress: (overrides = {}) => ({
    userId: 'user_123',
    characterId: 'char_123',
    totalExperience: 100,
    level: 2,
    subjects: {
      math: {
        experience: 50,
        level: 1,
        gamesCompleted: 5,
        averageScore: 85
      },
      science: {
        experience: 30,
        level: 1,
        gamesCompleted: 3,
        averageScore: 90
      },
      reading: {
        experience: 20,
        level: 1,
        gamesCompleted: 2,
        averageScore: 75
      }
    },
    achievements: [
      {
        id: 'first_game',
        name: 'First Steps',
        description: 'Complete your first game',
        unlockedAt: new Date().toISOString()
      }
    ],
    streaks: {
      current: 3,
      longest: 7,
      lastPlayDate: new Date().toISOString()
    },
    ...overrides
  }),

  createAchievement: (overrides = {}) => ({
    id: `achievement_${Date.now()}`,
    name: 'Math Master',
    description: 'Score 100% on 10 math games',
    category: 'math',
    rarity: 'common',
    points: 50,
    requirements: {
      gamesCompleted: 10,
      minScore: 100,
      subject: 'math'
    },
    isUnlocked: false,
    unlockedAt: null,
    ...overrides
  })
};

/**
 * Theme Data Factory
 */
export const ThemeFactory = {
  createTheme: (overrides = {}) => ({
    id: 'default',
    name: 'Default Theme',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#45B7D1',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      text: {
        primary: '#2C3E50',
        secondary: '#7F8C8D',
        disabled: '#BDC3C7'
      }
    },
    fonts: {
      primary: 'Inter, sans-serif',
      heading: 'Poppins, sans-serif',
      monospace: 'Fira Code, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    isActive: false,
    ...overrides
  })
};

/**
 * Mock Data for Components
 */
export const ComponentMockData = {
  navigationItems: [
    { text: 'Home', href: '/src/pages/index.html', isActive: true },
    { text: 'Math', href: '/src/pages/math.html', isActive: false },
    { text: 'Science', href: '/src/pages/science.html', isActive: false },
    { text: 'Reading', href: '/src/pages/reading.html', isActive: false }
  ],

  modalData: {
    title: 'Test Modal',
    content: '<p>This is test content</p>',
    buttons: [
      { text: 'Cancel', action: 'cancel', variant: 'secondary' },
      { text: 'Confirm', action: 'confirm', variant: 'primary' }
    ]
  },

  formData: {
    character: {
      name: 'Test Character',
      species: 'cat',
      favoriteColor: '#FF6B6B'
    },
    settings: {
      soundEnabled: true,
      difficulty: 'medium',
      theme: 'default'
    }
  }
};

/**
 * Edge Case Data
 */
export const EdgeCaseData = {
  emptyData: {
    character: { name: '', species: '', appearance: null },
    progress: { experience: 0, level: 0, subjects: {} },
    game: { score: 0, state: null }
  },

  extremeValues: {
    character: {
      name: 'A'.repeat(100), // Very long name
      personality: {
        traits: {
          enthusiasm: 999, // Over maximum
          patience: -10, // Under minimum
          playfulness: 50.5 // Decimal value
        }
      }
    },
    progress: {
      experience: Number.MAX_SAFE_INTEGER,
      level: -1 // Invalid level
    }
  },

  maliciousData: {
    xssAttempts: [
      '<script>alert("xss")</script>',
      '"><img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '\'\"><svg/onload=alert(/XSS/)>',
      '${alert(1)}'
    ],
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'/*"
    ]
  }
};

/**
 * Utility functions for test data
 */
export const TestDataUtils = {
  /**
   * Generate a random ID
   */
  generateId: (prefix = 'test') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Create array of test data
   */
  createArray: (factory, count = 3, overrides = {}) => {
    return Array.from({ length: count }, (_, index) => 
      factory({ ...overrides, id: TestDataUtils.generateId(), index })
    );
  },

  /**
   * Deep clone object
   */
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

  /**
   * Merge objects deeply
   */
  deepMerge: (target, source) => {
    const result = { ...target };
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = TestDataUtils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    return result;
  }
};

export default {
  CharacterFactory,
  GameFactory,
  ProgressFactory,
  ThemeFactory,
  ComponentMockData,
  EdgeCaseData,
  TestDataUtils
};