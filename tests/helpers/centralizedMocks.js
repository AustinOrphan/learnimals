/**
 * Centralized Mock Definitions
 * Provides consistent mock implementations across all test files
 */

/**
 * Logger Mock - matches the actual logger.js exports
 */
export const createLoggerMock = vi => ({
  default: {
    level: 2, // INFO level
    enabled: true,
    getLogLevel: vi.fn().mockReturnValue(2),
    setLevel: vi.fn(),
    setEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    shouldLog: vi.fn().mockReturnValue(true),
    formatMessage: vi.fn().mockImplementation((level, message, args) => {
      const timestamp = new Date().toISOString().slice(11, 23);
      return [`[${timestamp}] ${level}:`, message, ...args];
    }),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    game: vi.fn(),
    user: vi.fn(),
    perf: vi.fn(),
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
});

/**
 * Progress Tracker Mock
 */
export const createProgressTrackerMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    track: vi.fn(),
    getProgress: vi.fn().mockReturnValue({}),
    save: vi.fn(),
    load: vi.fn(),
    reset: vi.fn(),
    updateScore: vi.fn(),
    updateLevel: vi.fn(),
    getTotalScore: vi.fn().mockReturnValue(0),
    getCurrentLevel: vi.fn().mockReturnValue(1),
    getAchievements: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({}),
  })),
});

/**
 * Achievement System Mock
 */
export const createAchievementSystemMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    unlock: vi.fn(),
    check: vi.fn(),
    getAchievements: vi.fn().mockReturnValue([]),
    isUnlocked: vi.fn().mockReturnValue(false),
    getProgress: vi.fn().mockReturnValue(0),
    getUnlockedCount: vi.fn().mockReturnValue(0),
    getTotalCount: vi.fn().mockReturnValue(10),
    getCategories: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
  })),
});

/**
 * Modal Component Mock
 */
export const createModalMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
    isVisible: vi.fn().mockReturnValue(false),
    setContent: vi.fn(),
    setTitle: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    element: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
        toggle: vi.fn(),
      },
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelector: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    },
  })),
  Modal: vi.fn(),
});

/**
 * Theme Registry Mock
 */
export const createThemeRegistryMock = () => ({
  themes: new Map([
    ['default', { name: 'Default', colors: { primary: '#007bff' } }],
    ['dark', { name: 'Dark', colors: { primary: '#6c757d' } }],
  ]),
  getTheme: vi.fn().mockImplementation(name => ({
    name: name || 'Default',
    colors: { primary: '#007bff' },
  })),
  getAllThemes: vi.fn().mockReturnValue([
    { name: 'Default', colors: { primary: '#007bff' } },
    { name: 'Dark', colors: { primary: '#6c757d' } },
  ]),
  registerTheme: vi.fn(),
  hasTheme: vi.fn().mockReturnValue(true),
});

/**
 * Theme Manager Utils Mock
 */
export const createThemeManagerUtilsMock = () => ({
  applyTheme: vi.fn(),
  removeTheme: vi.fn(),
  getAppliedTheme: vi.fn().mockReturnValue('default'),
  validateTheme: vi.fn().mockReturnValue(true),
  mergeThemes: vi.fn().mockImplementation((base, override) => ({ ...base, ...override })),
});

/**
 * Performance Utils Mock
 */
export const createPerformanceUtilsMock = () => ({
  performanceMonitor: {
    mark: vi.fn(),
    measure: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
    clear: vi.fn(),
  },
  memoryMonitor: {
    check: vi.fn().mockReturnValue({ used: 1000000, total: 10000000 }),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
  },
  fpsMonitor: {
    start: vi.fn(),
    stop: vi.fn(),
    getFPS: vi.fn().mockReturnValue(60),
    getAverageFPS: vi.fn().mockReturnValue(58),
  },
  domBatcher: {
    batch: vi.fn().mockImplementation(fn => fn()),
    flush: vi.fn(),
  },
  rafThrottle: vi.fn().mockImplementation(fn => fn),
});

/**
 * Game Registry Mock
 */
export const createGameRegistryMock = () => ({
  GameRegistryUtil: {
    validateGameConfig: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
    }),
    normalizeConfig: vi.fn().mockImplementation(config => config),
    getRequiredFields: vi.fn().mockReturnValue(['id', 'name', 'gameClass', 'scriptPath']),
    getSupportedSubjects: vi.fn().mockReturnValue(['math', 'science', 'reading', 'art', 'coding']),
    getSupportedDifficulties: vi.fn().mockReturnValue(['easy', 'medium', 'hard']),
  },
  gameRegistry: new Map([
    [
      'test-game',
      {
        id: 'test-game',
        name: 'Test Game',
        gameClass: 'TestGame',
        scriptPath: '/test.js',
        subject: 'math',
      },
    ],
  ]),
  registerGame: vi.fn(),
  getGame: vi.fn().mockImplementation(id => ({
    id: id || 'test-game',
    name: 'Test Game',
    gameClass: 'TestGame',
    scriptPath: '/test.js',
    subject: 'math',
  })),
  getAllGames: vi.fn().mockReturnValue([]),
});

/**
 * Accessibility Service Mock
 */
export const createAccessibilityServiceMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    announce: vi.fn(),
    setFocusTrap: vi.fn(),
    removeFocusTrap: vi.fn(),
    addSkipLink: vi.fn(),
    removeSkipLink: vi.fn(),
    applyPreferences: vi.fn(),
    detectPreferences: vi.fn().mockReturnValue({
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardOnly: false,
    }),
    updatePreference: vi.fn(),
  })),
  AccessibilityService: vi.fn(),
});

/**
 * Mobile Optimization Service Mock
 */
export const createMobileOptimizationServiceMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    optimizeForDevice: vi.fn(),
    adaptToNetwork: vi.fn(),
    enableTouchOptimizations: vi.fn(),
    monitorPerformance: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      fps: 60,
      memory: { used: 1000000, total: 10000000 },
      network: { type: '4g', downlink: 10 },
    }),
    isMobile: vi.fn().mockReturnValue(false),
    isTablet: vi.fn().mockReturnValue(false),
  })),
  MobileOptimizationService: vi.fn(),
  mobileOptimizationService: {
    initialize: vi.fn(),
    destroy: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
  },
});

/**
 * Lazy Load Manager Mock
 */
export const createLazyLoadManagerMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    loadImage: vi.fn(),
    loadComponent: vi.fn(),
    preloadImages: vi.fn(),
    getLoadingStats: vi.fn().mockReturnValue({
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
    }),
    observeElement: vi.fn(),
    unobserveElement: vi.fn(),
  })),
  LazyLoadManager: vi.fn(),
  lazyLoadManager: {
    initialize: vi.fn(),
    loadImage: vi.fn(),
    getLoadingStats: vi.fn().mockReturnValue({}),
  },
});

/**
 * Bundle Optimizer Mock
 */
export const createBundleOptimizerMock = () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    preloadResource: vi.fn(),
    prefetchResources: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      totalBundles: 0,
      totalSize: 0,
      averageLoadTime: 0,
    }),
    clearCache: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  BundleOptimizer: vi.fn(),
  bundleOptimizer: {
    initialize: vi.fn(),
    preloadResource: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
  },
});

/**
 * Common DOM mocks for components
 */
export const createDOMMocks = () => ({
  document: {
    createElement: vi.fn().mockImplementation(tag => ({
      tagName: tag.toUpperCase(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
        toggle: vi.fn(),
      },
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      textContent: '',
      innerHTML: '',
    })),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([]),
    getElementById: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
    },
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  },
});

/**
 * Utility function to apply all common mocks
 */
export const applyCommonMocks = () => {
  // Apply to vitest global scope if available
  if (typeof vi !== 'undefined') {
    vi.mock('../../utils/logger.js', createLoggerMock);
    vi.mock('../../progress/ProgressTracker.js', createProgressTrackerMock);
    vi.mock('../../progress/AchievementSystem.js', createAchievementSystemMock);
  }
};

/**
 * Mock factory for creating consistent mocks across tests
 */
export const mockFactory = {
  logger: createLoggerMock,
  progressTracker: createProgressTrackerMock,
  achievementSystem: createAchievementSystemMock,
  modal: createModalMock,
  themeRegistry: createThemeRegistryMock,
  themeManagerUtils: createThemeManagerUtilsMock,
  performanceUtils: createPerformanceUtilsMock,
  gameRegistry: createGameRegistryMock,
  accessibilityService: createAccessibilityServiceMock,
  mobileOptimizationService: createMobileOptimizationServiceMock,
  lazyLoadManager: createLazyLoadManagerMock,
  bundleOptimizer: createBundleOptimizerMock,
  dom: createDOMMocks,
};

export default mockFactory;
