/**
 * Integration Test Utilities
 * Helpers for managing cross-component interactions in integration tests
 */

import { vi } from 'vitest';

/**
 * Mock window.createLogger for components that use it
 */
export function mockCreateLogger() {
  if (!window.createLogger) {
    window.createLogger = vi.fn(_prefix => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    }));
  }
  return window.createLogger;
}

/**
 * Mock component dependencies for integration tests
 */
export function mockComponentDependencies() {
  // Mock logger
  mockCreateLogger();

  // Mock other common window utilities
  if (!window.ProgressFactory) {
    window.ProgressFactory = {
      createUserProgress: vi.fn(() => ({
        userId: 'test-user',
        level: 1,
        points: 0,
        achievements: [],
      })),
    };
  }

  if (!window.CharacterFactory) {
    window.CharacterFactory = {
      create: vi.fn(() => ({
        id: 'test-character',
        name: 'Test Character',
        type: 'default',
      })),
    };
  }

  // Mock navigation components
  if (!window.NavigationComponent) {
    window.NavigationComponent = {
      init: vi.fn(),
      navigate: vi.fn(),
      updateActiveLink: vi.fn(),
    };
  }

  if (!window.navigationHelper) {
    window.navigationHelper = {
      init: vi.fn(),
      setActivePage: vi.fn(),
      updatePageLinks: vi.fn(),
    };
  }
}

/**
 * Setup DOM structure for navigation tests
 */
export function setupNavigationDOM() {
  document.body.innerHTML = `
    <div id="navbar-placeholder"></div>
    <div id="main-content"></div>
    <div class="page-container"></div>
  `;
}

/**
 * Mock fetch responses for component resources
 */
export function mockComponentFetches() {
  const originalFetch = global.fetch;

  global.fetch = vi.fn(url => {
    // Mock navbar.html
    if (url.includes('navbar.html')) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
          <nav id="navbar" class="navbar">
            <div class="navbar-brand">
              <a href="/" class="navbar-logo">Learnimals</a>
            </div>
            <ul class="navbar-menu">
              <li><a href="/" data-page="home">Home</a></li>
              <li><a href="/math" data-page="math">Math</a></li>
              <li><a href="/science" data-page="science">Science</a></li>
              <li><a href="/reading" data-page="reading">Reading</a></li>
            </ul>
            <button class="navbar-toggle" aria-label="Toggle menu">
              <span></span>
            </button>
          </nav>
        `),
      });
    }

    // Mock navigation.js
    if (url.includes('navigation.js') || url.includes('NavigationComponent')) {
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
          // Mock NavigationComponent
          window.NavigationComponent = {
            init: function() {
              console.log('NavigationComponent initialized');
              this.setupEventListeners();
            },
            setupEventListeners: function() {
              const links = document.querySelectorAll('[data-page]');
              links.forEach(link => {
                link.addEventListener('click', (e) => {
                  e.preventDefault();
                  this.navigate(link.dataset.page);
                });
              });
            },
            navigate: function(page) {
              console.log('Navigating to', page);
              window.dispatchEvent(new CustomEvent('navigation', { detail: { page } }));
            }
          };
        `),
      });
    }

    // Default response for other resources
    return originalFetch(url);
  });

  return () => {
    global.fetch = originalFetch;
  };
}

/**
 * Create isolated component context
 */
export function createComponentContext() {
  const context = {
    events: [],
    state: {},
    cleanup: [],
  };

  // Track events
  const eventListener = event => {
    context.events.push({
      type: event.type,
      detail: event.detail,
      timestamp: Date.now(),
    });
  };

  window.addEventListener('navigation', eventListener);
  window.addEventListener('navbarLoaded', eventListener);
  window.addEventListener('componentReady', eventListener);

  context.cleanup.push(() => {
    window.removeEventListener('navigation', eventListener);
    window.removeEventListener('navbarLoaded', eventListener);
    window.removeEventListener('componentReady', eventListener);
  });

  return {
    ...context,
    destroy() {
      context.cleanup.forEach(fn => fn());
    },
  };
}

/**
 * Wait for component to be ready
 */
export async function waitForComponent(componentName, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Component ${componentName} did not initialize within ${timeout}ms`));
    }, timeout);

    const checkComponent = () => {
      if (window[componentName]) {
        clearTimeout(timer);
        resolve(window[componentName]);
      } else {
        requestAnimationFrame(checkComponent);
      }
    };

    checkComponent();
  });
}

/**
 * Simulate component interaction
 */
export function simulateComponentInteraction(fromComponent, toComponent, action, data) {
  const event = new CustomEvent('component-interaction', {
    detail: {
      from: fromComponent,
      to: toComponent,
      action,
      data,
      timestamp: Date.now(),
    },
  });

  window.dispatchEvent(event);

  // If target component has a handler, call it
  if (window[toComponent] && typeof window[toComponent][action] === 'function') {
    return window[toComponent][action](data);
  }
}

/**
 * Clean up after integration tests
 */
export function cleanupIntegrationTest() {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Clear window properties
  const windowProps = [
    'createLogger',
    'NavigationComponent',
    'navigationHelper',
    'ProgressFactory',
    'CharacterFactory',
  ];

  windowProps.forEach(prop => {
    delete window[prop];
  });

  // Clear localStorage
  localStorage.clear();
  sessionStorage.clear();
}

export default {
  mockCreateLogger,
  mockComponentDependencies,
  setupNavigationDOM,
  mockComponentFetches,
  createComponentContext,
  waitForComponent,
  simulateComponentInteraction,
  cleanupIntegrationTest,
};
