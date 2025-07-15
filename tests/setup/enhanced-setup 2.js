/**
 * Enhanced Test Setup
 * 
 * Comprehensive test environment setup for Learnimals application
 * Fixes module compatibility issues and provides robust testing foundation
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupGlobalMocks } from '../helpers/moduleResolver.js';

// Configure test environment
beforeAll(() => {
  // Use fake timers for all tests
  vi.useFakeTimers();
  
  // Setup global mocks for browser APIs
  setupGlobalMocks();
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
  
  // Mock window.location (use defineProperty to override non-configurable property)
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn()
    },
    writable: true,
    configurable: true
  });
  
  // Setup DOM environment
  document.body.innerHTML = '';
  
  // Mock navigation placeholder functions that tests expect
  global.createNavbarPlaceholder = vi.fn().mockImplementation(() => {
    const placeholder = document.createElement('div');
    placeholder.id = 'navbar-placeholder';
    document.body.appendChild(placeholder);
    return placeholder;
  });
  
  global.setupNavigationFileMocks = vi.fn().mockImplementation(() => {
    // Mock file content for navigation tests
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('navbar.html')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<nav id="navbar">Mock Navbar</nav>')
        });
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
  });
  
  // Mock module exports for CommonJS/ES6 compatibility
  global.mockModuleExports = vi.fn().mockImplementation((moduleObj, exportValue) => {
    if (typeof moduleObj === 'object' && moduleObj !== null) {
      try {
        // Try to set default export without breaking ES6 modules
        Object.defineProperty(moduleObj, 'default', {
          value: exportValue,
          writable: true,
          configurable: true
        });
      } catch (error) {
        // If we can't set the property, create a wrapper
        return { default: exportValue, ...moduleObj };
      }
    }
    return moduleObj;
  });
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Reset localStorage
  window.localStorage.clear();
  window.sessionStorage.clear();
  
  // Reset location
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';
  
  // Create fresh navbar placeholder for each test
  const navbarPlaceholder = document.createElement('div');
  navbarPlaceholder.id = 'navbar-placeholder';
  document.body.appendChild(navbarPlaceholder);
  
  // Reset global state
  global.testState = {
    components: new Map(),
    mockData: new Map(),
    eventListeners: []
  };
});

afterEach(() => {
  // Clean up any remaining timers
  vi.runOnlyPendingTimers();
  vi.clearAllTimers();
  
  // Clean up event listeners
  if (global.testState && global.testState.eventListeners) {
    global.testState.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
  }
  
  // Reset test state
  global.testState = null;
});

afterAll(() => {
  // Final cleanup
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * Custom test utilities
 */
global.testUtils = {
  /**
   * Wait for element to appear in DOM
   */
  waitForElement: async (selector, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },
  
  /**
   * Simulate user interaction
   */
  simulateEvent: (element, eventType, options = {}) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
    return event;
  },
  
  /**
   * Create test container
   */
  createTestContainer: (id = 'test-container') => {
    const container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
    return container;
  },
  
  /**
   * Mock component module with proper ES6/CommonJS compatibility
   */
  mockComponent: (componentPath, mockImplementation) => {
    return vi.doMock(componentPath, () => {
      const mock = typeof mockImplementation === 'function' 
        ? mockImplementation 
        : () => mockImplementation;
      
      return {
        default: mock,
        [componentPath.split('/').pop().replace('.js', '')]: mock
      };
    });
  },
  
  /**
   * Advance timers and flush promises
   */
  tick: async (ms = 0) => {
    if (ms > 0) {
      vi.advanceTimersByTime(ms);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

/**
 * Custom matchers
 */
expect.extend({
  toBeInDOM(received) {
    const pass = document.body.contains(received) || document.head.contains(received);
    return {
      pass,
      message: () => pass 
        ? `Expected element not to be in DOM`
        : `Expected element to be in DOM`
    };
  },
  
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () => pass
        ? `Expected element not to have class "${className}"`
        : `Expected element to have class "${className}"`
    };
  },
  
  toBeVisible(received) {
    const style = window.getComputedStyle(received);
    const pass = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    return {
      pass,
      message: () => pass
        ? `Expected element not to be visible`
        : `Expected element to be visible`
    };
  }
});

// Mock specific modules that commonly cause issues
vi.mock('../../src/features/progress/AchievementSystem.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    unlock: vi.fn(),
    check: vi.fn(),
    getAchievements: vi.fn().mockReturnValue([])
  }))
}));

vi.mock('../../src/features/progress/ProgressTracker.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    track: vi.fn(),
    getProgress: vi.fn().mockReturnValue({}),
    save: vi.fn()
  }))
}));

vi.mock('../../src/utils/logger.js', () => ({
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
    perf: vi.fn()
  },
  Logger: vi.fn(),
  LOG_LEVELS: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

// Export commonly used testing utilities
export {
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
};