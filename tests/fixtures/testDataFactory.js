/**
 * Comprehensive Test Data Factory
 * Provides realistic test data for characters, games, progress, and other entities
 */

// Utility functions for generating test data
const generateId = (prefix = 'test') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start = new Date(2024, 0, 1), end = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Character Test Data Factory
export const CharacterFactory = {
  create: (overrides = {}) => ({
    id: generateId('char'),
    name: randomChoice(['Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Ruby', 'Oliver', 'Zoe']),
    species: {
      primary: randomChoice(['cat', 'dog', 'bird', 'rabbit', 'hamster']),
      secondary: null
    },
    favoriteColor: randomChoice(['blue', 'red', 'green', 'purple', 'orange', 'pink', 'yellow']),
    customizations: {
      accessories: randomChoice([
        [],
        ['hat'],
        ['glasses'],
        ['bow-tie'],
        ['hat', 'glasses'],
        ['scarf', 'hat']
      ]),
      pattern: randomChoice(['solid', 'stripes', 'spots', 'polka-dots']),
      size: randomChoice(['small', 'medium', 'large'])
    },
    personality: {
      traits: randomChoice([
        ['curious', 'friendly'],
        ['brave', 'adventurous'],
        ['calm', 'thoughtful'],
        ['energetic', 'playful'],
        ['creative', 'artistic']
      ]),
      favoriteSubjects: randomChoice([
        ['math'],
        ['science'],
        ['math', 'science'],
        ['reading', 'art'],
        ['coding', 'math']
      ])
    },
    createdAt: randomDate().toISOString(),
    lastModified: new Date().toISOString(),
    version: '2.0',
    ...overrides
  }),

  createBasic: (name = 'TestChar', species = 'cat') => ({
    id: generateId('char'),
    name,
    species: { primary: species, secondary: null },
    favoriteColor: 'blue',
    createdAt: new Date().toISOString(),
    version: '2.0'
  }),

  createWithProgress: (overrides = {}) => {
    const character = CharacterFactory.create(overrides);
    return {
      ...character,
      gameStats: {
        gamesPlayed: randomNumber(0, 50),
        totalScore: randomNumber(0, 10000),
        highestScore: randomNumber(500, 2000),
        totalTime: randomNumber(600, 18000), // 10 minutes to 5 hours
        favoriteGames: randomChoice([
          ['bubble-pop'],
          ['word-scramble', 'bubble-pop'],
          ['element-match', 'number-line-jump']
        ])
      },
      achievements: randomChoice([
        [],
        ['first_steps'],
        ['first_steps', 'math_explorer'],
        ['first_steps', 'science_lover', 'high_scorer']
      ])
    };
  },

  createBatch: (count = 5) => {
    return Array.from({ length: count }, () => CharacterFactory.create());
  }
};

// Game Test Data Factory
export const GameFactory = {
  create: (overrides = {}) => ({
    id: generateId('game'),
    name: randomChoice(['Bubble Pop', 'Word Scramble', 'Element Match', 'Number Line Jump', 'Color Palette']),
    type: randomChoice(['arcade', 'puzzle', 'memory', 'educational', 'creative']),
    subject: randomChoice(['math', 'science', 'reading', 'art', 'coding']),
    difficulty: randomChoice(['easy', 'medium', 'hard']),
    config: {
      timeLimit: randomChoice([30, 60, 90, 120]), // seconds
      maxLives: randomChoice([3, 5, null]),
      scoreMultiplier: randomChoice([1, 1.5, 2]),
      powerUpsEnabled: randomChoice([true, false])
    },
    assets: {
      images: [`/images/games/${generateId('img')}.png`],
      sounds: [`/audio/games/${generateId('sound')}.mp3`],
      sprites: [`/sprites/${generateId('sprite')}.json`]
    },
    createdAt: randomDate().toISOString(),
    version: '1.0',
    ...overrides
  }),

  createSession: (gameId = null, playerId = null, overrides = {}) => ({
    sessionId: generateId('session'),
    gameId: gameId || generateId('game'),
    playerId: playerId || generateId('player'),
    startTime: Date.now(),
    endTime: null,
    state: randomChoice(['initialized', 'running', 'paused', 'completed', 'abandoned']),
    score: randomNumber(0, 2000),
    level: randomNumber(1, 5),
    timeElapsed: randomNumber(0, 300), // seconds
    moves: randomNumber(0, 100),
    accuracy: randomNumber(60, 100), // percentage
    powerUpsUsed: randomChoice([[], ['speed_boost'], ['extra_time', 'double_points']]),
    achievements: randomChoice([[], ['perfect_level'], ['speed_demon', 'high_scorer']]),
    metadata: {
      browser: randomChoice(['Chrome', 'Firefox', 'Safari', 'Edge']),
      device: randomChoice(['desktop', 'tablet', 'mobile']),
      viewport: randomChoice(['1920x1080', '768x1024', '375x667'])
    },
    ...overrides
  }),

  createLeaderboard: (gameId, count = 10) => {
    return Array.from({ length: count }, (_, index) => ({
      rank: index + 1,
      gameId,
      playerName: randomChoice(['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Taylor']),
      score: randomNumber(1000, 5000) - (index * 100), // Decreasing scores
      level: randomNumber(1, 10),
      timeCompleted: randomNumber(30, 300),
      achievements: randomChoice([[], ['speed_run'], ['perfect_game', 'high_scorer']]),
      playedAt: randomDate().toISOString()
    }));
  }
};

// Progress Test Data Factory
export const ProgressFactory = {
  create: (overrides = {}) => ({
    userId: generateId('user'),
    subjects: {
      math: {
        totalTime: randomNumber(600, 7200), // 10 minutes to 2 hours
        activitiesCompleted: randomNumber(0, 20),
        gamesPlayed: randomNumber(0, 30),
        averageScore: randomNumber(300, 800),
        highestScore: randomNumber(800, 2000),
        lastActivity: randomDate().toISOString(),
        activities: Array.from({ length: randomNumber(1, 5) }, () => ({
          name: randomChoice(['bubble-pop', 'number-line-jump', 'place-value']),
          score: randomNumber(200, 1000),
          timeSpent: randomNumber(60, 600),
          completedAt: randomDate().toISOString(),
          accuracy: randomNumber(70, 100)
        }))
      },
      science: {
        totalTime: randomNumber(300, 5400),
        activitiesCompleted: randomNumber(0, 15),
        gamesPlayed: randomNumber(0, 25),
        averageScore: randomNumber(250, 750),
        highestScore: randomNumber(700, 1800),
        lastActivity: randomDate().toISOString(),
        activities: Array.from({ length: randomNumber(1, 4) }, () => ({
          name: randomChoice(['element-match', 'periodic-table', 'chemistry-lab']),
          score: randomNumber(150, 900),
          timeSpent: randomNumber(90, 500),
          completedAt: randomDate().toISOString(),
          accuracy: randomNumber(65, 95)
        }))
      }
    },
    overall: {
      totalScore: randomNumber(1000, 15000),
      totalTime: randomNumber(1800, 25200), // 30 minutes to 7 hours
      totalActivities: randomNumber(5, 50),
      level: randomNumber(1, 10),
      xp: randomNumber(500, 8000),
      completionRate: randomNumber(25, 95) // percentage
    },
    streaks: {
      current: randomNumber(0, 15),
      longest: randomNumber(5, 30),
      lastActivity: randomDate().toISOString(),
      history: Array.from({ length: 7 }, (_, index) => ({
        date: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        activities: randomNumber(0, 5),
        timeSpent: randomNumber(0, 3600)
      }))
    },
    lastUpdated: new Date().toISOString(),
    ...overrides
  }),

  createAchievement: (overrides = {}) => ({
    id: generateId('achievement'),
    name: randomChoice(['First Steps', 'Math Explorer', 'Science Lover', 'High Scorer', 'Speed Demon']),
    description: 'Complete your first activity',
    category: randomChoice(['milestone', 'skill', 'social', 'special']),
    criteria: {
      type: randomChoice(['activities_completed', 'score_achieved', 'time_spent', 'streak_maintained']),
      value: randomNumber(1, 100),
      subject: randomChoice([null, 'math', 'science', 'reading'])
    },
    reward: {
      xp: randomNumber(50, 500),
      badge: randomChoice(['beginner', 'explorer', 'master', 'legend']),
      unlockables: randomChoice([[], ['new_character'], ['special_theme']])
    },
    rarity: randomChoice(['common', 'uncommon', 'rare', 'epic', 'legendary']),
    unlockedAt: randomChoice([null, randomDate().toISOString()]),
    progress: randomNumber(0, 100), // percentage
    ...overrides
  }),

  createGoal: (overrides = {}) => ({
    id: generateId('goal'),
    type: randomChoice(['score', 'time', 'activities', 'streak']),
    title: randomChoice(['Score Master', 'Study Marathon', 'Activity Explorer', 'Consistency King']),
    description: 'Reach your learning target',
    target: randomNumber(100, 10000),
    current: randomNumber(0, 5000),
    startDate: randomDate(new Date(2024, 0, 1)).toISOString(),
    deadline: randomDate(new Date(), new Date(2024, 11, 31)).toISOString(),
    status: randomChoice(['active', 'completed', 'paused', 'expired']),
    reward: {
      xp: randomNumber(100, 1000),
      badge: randomChoice(['goal_crusher', 'determined', 'focused']),
      bonus: randomChoice([null, 'double_xp_weekend', 'new_game_unlock'])
    },
    ...overrides
  })
};

// Theme Test Data Factory
export const ThemeFactory = {
  create: (overrides = {}) => ({
    id: generateId('theme'),
    name: randomChoice(['Ocean Blue', 'Forest Green', 'Sunset Orange', 'Royal Purple', 'Cosmic Dark']),
    type: randomChoice(['light', 'dark']),
    category: randomChoice(['nature', 'space', 'fantasy', 'minimalist', 'colorful']),
    colors: {
      primary: randomChoice(['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']),
      secondary: randomChoice(['#1E40AF', '#047857', '#D97706', '#7C3AED', '#DC2626']),
      accent: randomChoice(['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171']),
      background: randomChoice(['#F8FAFC', '#F0FDF4', '#FFFBEB', '#FAF5FF', '#1F2937']),
      text: randomChoice(['#1F2937', '#064E3B', '#92400E', '#581C87', '#F9FAFB'])
    },
    properties: {
      darkMode: randomChoice([true, false]),
      animations: randomChoice([true, false]),
      patterns: randomChoice([null, 'dots', 'waves', 'geometric']),
      fontFamily: randomChoice(['Inter', 'Roboto', 'Open Sans', 'Poppins'])
    },
    availability: {
      free: randomChoice([true, false]),
      requiresLevel: randomChoice([null, 5, 10, 15]),
      requiresAchievement: randomChoice([null, 'theme_collector', 'color_master'])
    },
    ...overrides
  }),

  createUserPreferences: (overrides = {}) => ({
    currentTheme: 'ocean_blue',
    autoDetectDarkMode: randomChoice([true, false]),
    reducedMotion: randomChoice([true, false]),
    highContrast: randomChoice([true, false]),
    fontSize: randomChoice(['small', 'medium', 'large']),
    colorblindSupport: randomChoice([null, 'protanopia', 'deuteranopia', 'tritanopia']),
    customizations: {
      backgroundImage: randomChoice([null, '/images/custom-bg.jpg']),
      accentColor: randomChoice([null, '#FF6B9D', '#4ECDC4']),
      fontFamily: randomChoice([null, 'Comic Sans MS'])
    },
    ...overrides
  })
};

// DOM Mock Utilities
export const DOMUtils = {
  setupElementMocks: () => {
    // Mock getBoundingClientRect for all elements
    if (!Element.prototype.getBoundingClientRect) {
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        x: 0,
        y: 0
      });
    }
    
    // Mock scrollIntoView
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
    
    // Mock focus and blur methods
    if (!Element.prototype.focus) {
      Element.prototype.focus = vi.fn();
    }
    
    if (!Element.prototype.blur) {
      Element.prototype.blur = vi.fn();
    }
    
    // Mock click method
    if (!Element.prototype.click) {
      Element.prototype.click = vi.fn();
    }
    
    // Mock computedStyle
    if (!window.getComputedStyle) {
      window.getComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(''),
        visibility: 'visible',
        display: 'block',
        opacity: '1'
      });
    }
    
    // Mock Canvas API
    if (!HTMLCanvasElement.prototype.getContext) {
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Array(4).fill(0)
        }),
        putImageData: vi.fn(),
        createImageData: vi.fn().mockReturnValue({
          data: new Array(4).fill(0)
        }),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn()
      });
    }
    
    if (!HTMLCanvasElement.prototype.toDataURL) {
      HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }
  },
  
  createMockElement: (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }
};

// Component Mock Data Factory
export const ComponentMockData = {
  modalData: {
    title: 'Test Modal',
    content: 'This is test modal content',
    size: 'medium',
    buttons: [
      { text: 'OK', type: 'primary', action: 'confirm' },
      { text: 'Cancel', type: 'secondary', action: 'cancel' }
    ],
    closeOnOverlay: true,
    closeOnEscape: true,
    onShow: null,
    onHide: null,
    onConfirm: null,
    onCancel: null
  },
  
  cardData: {
    title: 'Test Card',
    content: 'Test card content',
    image: '/images/test-card.jpg',
    actions: [
      { text: 'Learn More', href: '/learn-more' }
    ]
  },
  
  formData: {
    fields: [
      { name: 'username', type: 'text', label: 'Username', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'password', type: 'password', label: 'Password', required: true }
    ],
    submitText: 'Submit',
    cancelText: 'Cancel'
  }
};

// Test Environment Factory
export const EnvironmentFactory = {
  createBrowserEnv: (overrides = {}) => ({
    userAgent: randomChoice([
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ]),
    viewport: {
      width: randomChoice([1920, 1366, 768, 375]),
      height: randomChoice([1080, 768, 1024, 667])
    },
    screen: {
      colorDepth: randomChoice([24, 32]),
      pixelRatio: randomChoice([1, 1.5, 2, 3])
    },
    capabilities: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: randomChoice([true, false]),
      webGL: randomChoice([true, false]),
      touchSupport: randomChoice([true, false])
    },
    performance: {
      memory: randomChoice([4, 8, 16, 32]) * 1024 * 1024 * 1024, // GB in bytes
      cores: randomChoice([2, 4, 6, 8]),
      connection: randomChoice(['slow-2g', '2g', '3g', '4g', 'wifi'])
    },
    ...overrides
  }),

  createTestSession: (overrides = {}) => ({
    sessionId: generateId('test_session'),
    testSuite: randomChoice(['unit', 'integration', 'e2e', 'performance']),
    startTime: Date.now(),
    environment: randomChoice(['development', 'testing', 'staging']),
    config: {
      timeout: randomNumber(5000, 30000),
      retries: randomNumber(0, 3),
      parallel: randomChoice([true, false]),
      coverage: randomChoice([true, false])
    },
    metadata: {
      nodeVersion: randomChoice(['18.17.0', '20.5.0', '21.1.0']),
      vitestVersion: '1.6.0',
      os: randomChoice(['linux', 'darwin', 'win32']),
      ci: randomChoice([true, false])
    },
    ...overrides
  })
};

// Edge Cases and Error Scenarios Factory
export const EdgeCaseFactory = {
  createInvalidCharacter: () => ({
    // Missing required fields
    name: '',
    species: null,
    favoriteColor: undefined
  }),

  createCorruptedData: () => ({
    id: 'corrupted_data',
    data: 'invalid_json_structure',
    timestamp: 'not_a_date',
    score: 'not_a_number',
    nested: {
      deeply: {
        broken: undefined
      }
    }
  }),

  createMaliciousInput: () => ({
    xssAttempt: '<script>alert("XSS")</script>',
    sqlInjection: '\'; DROP TABLE users; --',
    pathTraversal: '../../../etc/passwd',
    prototypePolutation: '__proto__.isAdmin',
    htmlInjection: '<img src="x" onerror="evil()" />',
    cssInjection: 'body { background: url("javascript:alert(1)") }',
    jsonPayload: '{"__proto__": {"isAdmin": true}}',
    oversizedData: 'A'.repeat(1000000), // 1MB string
    unicodeExploit: '\u0000\u001F\uFEFF\uFFFE',
    regexDos: '(a+)+$' // ReDoS pattern
  }),

  createNetworkErrors: () => [
    { type: 'timeout', message: 'Request timeout', code: 'ETIMEDOUT' },
    { type: 'connection', message: 'Connection refused', code: 'ECONNREFUSED' },
    { type: 'dns', message: 'DNS resolution failed', code: 'ENOTFOUND' },
    { type: 'ssl', message: 'SSL certificate error', code: 'CERT_UNTRUSTED' },
    { type: 'cors', message: 'CORS policy violation', code: 'CORS_ERROR' }
  ],

  createPerformanceStress: () => ({
    largeDataset: Array.from({ length: 10000 }, (_, i) => CharacterFactory.create({ id: `stress_${i}` })),
    deepNesting: Array.from({ length: 100 }, () => ({ nested: {} })).reduceRight((acc, obj) => ({ ...obj, nested: acc }), {}),
    memoryIntensive: {
      images: Array.from({ length: 50 }, () => 'data:image/png;base64,' + 'A'.repeat(100000)),
      sounds: Array.from({ length: 20 }, () => 'data:audio/wav;base64,' + 'B'.repeat(500000))
    },
    cpuIntensive: {
      calculations: Array.from({ length: 1000000 }, (_, i) => Math.random() * i),
      iterations: 1000000
    }
  })
};

// Mock Data Generators
export const MockFactory = {
  localStorage: () => {
    const storage = new Map();
    return {
      getItem: vi.fn((key) => storage.get(key) || null),
      setItem: vi.fn((key, value) => storage.set(key, value)),
      removeItem: vi.fn((key) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      length: 0,
      key: vi.fn()
    };
  },

  fetch: (responses = {}) => {
    return vi.fn((url) => {
      const response = responses[url] || { status: 200, json: () => Promise.resolve({}) };
      return Promise.resolve({
        ok: response.status < 400,
        status: response.status,
        json: () => Promise.resolve(response.data || {}),
        text: () => Promise.resolve(response.text || ''),
        headers: new Map(Object.entries(response.headers || {}))
      });
    });
  },

  canvasContext: () => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn()
  })
};

// Validation helpers
export const ValidationHelpers = {
  isValidCharacter: (character) => {
    return (
      character &&
      typeof character.name === 'string' &&
      character.name.length > 0 &&
      character.species &&
      typeof character.species.primary === 'string' &&
      typeof character.favoriteColor === 'string'
    );
  },

  isValidGameSession: (session) => {
    return (
      session &&
      typeof session.sessionId === 'string' &&
      typeof session.gameId === 'string' &&
      typeof session.score === 'number' &&
      session.score >= 0
    );
  },

  isValidProgress: (progress) => {
    return (
      progress &&
      progress.overall &&
      typeof progress.overall.totalScore === 'number' &&
      typeof progress.overall.totalTime === 'number' &&
      progress.subjects &&
      typeof progress.subjects === 'object'
    );
  }
};

export default {
  CharacterFactory,
  GameFactory,
  ProgressFactory,
  ThemeFactory,
  EnvironmentFactory,
  EdgeCaseFactory,
  MockFactory,
  ValidationHelpers
};