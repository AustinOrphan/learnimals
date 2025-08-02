/**
 * Enhanced Test Setup with test.extend
 * Provides comprehensive test fixtures and environment setup
 */

import { test as base, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/jest-dom';
import {
  CharacterFactory,
  GameFactory,
  ProgressFactory,
  ThemeFactory,
  MockFactory,
} from '../fixtures/testDataFactory.js';
import TestHelpers from '../helpers/testHelpers.js';

// Configure fake timers globally
beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// Enhanced test with fixtures using test.extend
export const test = base.extend({
  // Character fixtures
  character: async ({}, use) => {
    const character = CharacterFactory.create();
    await use(character);
  },

  characterWithProgress: async ({}, use) => {
    const character = CharacterFactory.createWithProgress();
    await use(character);
  },

  multipleCharacters: async ({}, use) => {
    const characters = CharacterFactory.createBatch(5);
    await use(characters);
  },

  // Game fixtures
  gameSession: async ({}, use) => {
    const session = GameFactory.createSession();
    await use(session);
  },

  gameWithLeaderboard: async ({}, use) => {
    const game = GameFactory.create();
    const leaderboard = GameFactory.createLeaderboard(game.id);
    await use({ game, leaderboard });
  },

  // Progress fixtures
  userProgress: async ({}, use) => {
    const progress = ProgressFactory.create();
    await use(progress);
  },

  progressWithAchievements: async ({}, use) => {
    const progress = ProgressFactory.create();
    const achievements = Array.from({ length: 3 }, () => ProgressFactory.createAchievement());
    const goals = Array.from({ length: 2 }, () => ProgressFactory.createGoal());

    await use({
      ...progress,
      achievements,
      goals,
    });
  },

  // Theme fixtures
  themeData: async ({}, use) => {
    const theme = ThemeFactory.create();
    const preferences = ThemeFactory.createUserPreferences();
    await use({ theme, preferences });
  },

  // DOM fixtures
  testContainer: async ({}, use) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    await use(container);

    // Cleanup
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  },

  testForm: async ({ testContainer }, use) => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="name" type="text" required />
      <select name="species">
        <option value="cat">Cat</option>
        <option value="dog">Dog</option>
      </select>
      <input name="color" type="text" />
      <button type="submit">Submit</button>
    `;
    testContainer.appendChild(form);

    await use(form);
  },

  gameCanvas: async ({ testContainer }, use) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.id = 'game-canvas';

    const mockContext = MockFactory.canvasContext();
    canvas.getContext = vi.fn(() => mockContext);

    testContainer.appendChild(canvas);

    await use({ canvas, context: mockContext });
  },

  // Mock services
  mockLocalStorage: async ({}, use) => {
    const storage = MockFactory.localStorage();

    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    });

    await use(storage);

    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  },

  mockFetch: async ({}, use) => {
    const defaultResponses = {
      '/api/character': { status: 200, data: CharacterFactory.create() },
      '/api/progress': { status: 200, data: ProgressFactory.create() },
      '/api/achievements': { status: 200, data: [] },
    };

    const mockFetch = MockFactory.fetch(defaultResponses);
    const originalFetch = window.fetch;

    window.fetch = mockFetch;

    await use(mockFetch);

    // Restore original fetch
    window.fetch = originalFetch;
  },

  // Security test fixtures
  securityTestData: async ({}, use) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')" />',
      'javascript:alert("XSS")',
      '<svg onload="alert(1)">',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    ];

    const sqlInjectionPayloads = [
      '\'; DROP TABLE users; --',
      '1\' OR \'1\'=\'1',
      '\'; UNION SELECT * FROM sensitive_data; --',
    ];

    const csrfToken = `csrf_${Math.random().toString(36).substr(2, 16)}`;

    await use({
      xssPayloads,
      sqlInjectionPayloads,
      csrfToken,
      sanitizedOutputs: xssPayloads.map(payload =>
        payload.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      ),
    });
  },

  // Performance test fixtures
  performanceMonitor: async ({}, use) => {
    const metrics = {
      startTime: Date.now(),
      marks: new Map(),
      measures: new Map(),
    };

    const monitor = {
      mark: name => {
        metrics.marks.set(name, Date.now());
      },

      measure: (name, startMark, endMark = null) => {
        const startTime = metrics.marks.get(startMark) || metrics.startTime;
        const endTime = endMark ? metrics.marks.get(endMark) : Date.now();
        const duration = endTime - startTime;

        metrics.measures.set(name, duration);
        return duration;
      },

      getMetrics: () => ({ ...metrics }),

      clear: () => {
        metrics.marks.clear();
        metrics.measures.clear();
      },
    };

    await use(monitor);
  },

  // Game testing fixtures
  gameTestEnvironment: async ({ gameCanvas, mockLocalStorage }, use) => {
    const gameState = {
      score: 0,
      level: 1,
      lives: 3,
      timeRemaining: 60,
      gameObjects: [],
      powerUps: [],
      paused: false,
    };

    const gameAPI = {
      updateScore: points => {
        gameState.score += points;
        return gameState.score;
      },

      nextLevel: () => {
        gameState.level++;
        gameState.timeRemaining = 60;
        return gameState.level;
      },

      loseLife: () => {
        gameState.lives--;
        return gameState.lives;
      },

      addGameObject: obj => {
        gameState.gameObjects.push(obj);
        return gameState.gameObjects.length;
      },

      pause: () => {
        gameState.paused = true;
      },

      resume: () => {
        gameState.paused = false;
      },

      getState: () => ({ ...gameState }),

      reset: () => {
        Object.assign(gameState, {
          score: 0,
          level: 1,
          lives: 3,
          timeRemaining: 60,
          gameObjects: [],
          powerUps: [],
          paused: false,
        });
      },
    };

    await use({
      gameState,
      gameAPI,
      canvas: gameCanvas.canvas,
      context: gameCanvas.context,
    });
  },

  // Accessibility testing fixtures
  accessibilityTestEnvironment: async ({ testContainer }, use) => {
    const a11yDOM = document.createElement('div');
    a11yDOM.innerHTML = `
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="#main">Skip to main content</a></li>
          <li><a href="/math">Math</a></li>
          <li><a href="/science">Science</a></li>
        </ul>
      </nav>
      
      <main id="main">
        <h1>Test Page</h1>
        <form>
          <label for="test-input">Test Input</label>
          <input id="test-input" type="text" aria-describedby="input-help" />
          <div id="input-help">Help text for the input</div>
          
          <button type="submit">Submit</button>
        </form>
        
        <div role="alert" aria-live="polite" id="status"></div>
      </main>
    `;

    testContainer.appendChild(a11yDOM);

    const a11yHelpers = {
      announceToScreenReader: message => {
        const statusElement = a11yDOM.querySelector('#status');
        statusElement.textContent = message;
      },

      getFocusableElements: () => {
        return a11yDOM.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      },

      checkTabOrder: () => {
        const focusableElements = Array.from(a11yHelpers.getFocusableElements());
        return focusableElements.map((el, index) => ({
          element: el,
          tabIndex: el.tabIndex,
          order: index,
        }));
      },
    };

    await use({ dom: a11yDOM, helpers: a11yHelpers });
  },

  // API testing fixtures
  apiTestEnvironment: async ({ mockFetch }, use) => {
    const apiResponses = new Map();
    const requestHistory = [];

    const api = {
      setResponse: (endpoint, response) => {
        apiResponses.set(endpoint, response);
      },

      makeRequest: async (endpoint, options = {}) => {
        const request = {
          endpoint,
          options,
          timestamp: Date.now(),
        };
        requestHistory.push(request);

        const response = apiResponses.get(endpoint) || { status: 404, data: null };

        return {
          ok: response.status < 400,
          status: response.status,
          json: () => Promise.resolve(response.data),
          text: () => Promise.resolve(JSON.stringify(response.data)),
        };
      },

      getRequestHistory: () => [...requestHistory],

      clearHistory: () => {
        requestHistory.length = 0;
      },
    };

    await use(api);
  },

  // Error simulation fixtures
  errorSimulator: async ({}, use) => {
    const simulator = {
      networkError: () => {
        throw new Error('Network request failed');
      },

      timeoutError: () => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      },

      validationError: field => {
        const error = new Error(`Validation failed for field: ${field}`);
        error.field = field;
        error.type = 'validation';
        return error;
      },

      permissionError: () => {
        const error = new Error('Permission denied');
        error.status = 403;
        error.type = 'permission';
        return error;
      },

      corruptedDataError: () => {
        const error = new Error('Data corruption detected');
        error.type = 'corruption';
        return error;
      },
    };

    await use(simulator);
  },
});

// Global test setup
beforeEach(() => {
  // Clear DOM
  document.body.innerHTML = '';

  // Reset CSS custom properties
  document.documentElement.style.cssText = '';

  // Clear any existing timers
  vi.clearAllTimers();

  // Reset console methods
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup DOM
  cleanup();

  // Clear any remaining timers
  vi.clearAllTimers();

  // Reset DOM
  document.body.innerHTML = '';

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

// Global error handler for tests
window.addEventListener('error', event => {
  console.error('Uncaught error in test:', event.error);
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection in test:', event.reason);
});

// Mock global APIs that might not be available in test environment
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => MockFactory.canvasContext());

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock performance API
if (!global.performance) {
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  };
}

// Mock memory API
if (!global.performance.memory) {
  global.performance.memory = {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 50, // 50MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
  };
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  return setTimeout(callback, 16); // 60fps
});

global.cancelAnimationFrame = vi.fn(id => {
  clearTimeout(id);
});

// Export test utilities
export { expect, describe, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
export { TestHelpers };
export default test;
