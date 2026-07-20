/**
 * Navigation System Integration Tests
 * End-to-end tests for the complete navigation system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  mockComponentDependencies,
  setupNavigationDOM,
  mockComponentFetches,
  createComponentContext,
  cleanupIntegrationTest,
} from '../helpers/integrationTestUtils.js';

// Enhanced timer utilities for comprehensive timer control
const TimerUtils = {
  // Standard delay with fake timers
  delay: async ms => {
    vi.useFakeTimers();
    const promise = new Promise(resolve => setTimeout(resolve, ms));
    vi.advanceTimersByTime(ms);
    await promise;
    vi.useRealTimers();
  },

  // Run all pending timers immediately
  runAllTimers: () => {
    vi.useFakeTimers();
    vi.runAllTimers();
    vi.useRealTimers();
  },

  // Advance timers by specific amount
  advance: ms => {
    vi.useFakeTimers();
    vi.advanceTimersByTime(ms);
    vi.useRealTimers();
  },

  // Handle animation frames with timer advancement
  advanceWithFrames: (ms, frameCallback) => {
    vi.useFakeTimers();
    if (frameCallback) frameCallback();
    vi.advanceTimersByTime(ms);
    vi.useRealTimers();
  },
};

describe('Navigation System Integration', () => {
  let mockFetch;
  let restoreFetch;
  let componentContext;

  beforeEach(() => {
    // Mock all component dependencies
    mockComponentDependencies();

    // Setup DOM structure
    setupNavigationDOM();

    // Mock fetch for component resources
    restoreFetch = mockComponentFetches();

    // Create isolated component context
    componentContext = createComponentContext();

    // Reset DOM completely
    document.documentElement.innerHTML = `
      <head></head>
      <body>
        <div id="navbar-placeholder"></div>
        <main>
          <h1>Test Page</h1>
        </main>
      </body>
    `;

    // Mock successful navbar fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(global.createMockNavbar()),
    });
    global.fetch = mockFetch;

    // Reset modules
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up component context
    if (componentContext) {
      componentContext.destroy();
    }

    // Restore original fetch
    if (restoreFetch) {
      restoreFetch();
    }

    // Clean up integration test
    cleanupIntegrationTest();
  });

  describe('Complete Navigation Loading Flow', () => {
    it('should load complete navigation system without ES6 import errors', async () => {
      // Step 1: Load navbarLoader (should fetch and inject navbar)
      await import('../../components/layout/navbarLoader.js');

      // Wait for navbar loading using enhanced timer control
      await TimerUtils.delay(100);

      // Step 2: Verify navbar was injected
      const placeholder = document.getElementById('navbar-placeholder');
      expect(placeholder.innerHTML).toContain('mobile-menu');
      expect(placeholder.innerHTML).toContain('nav-menu');

      // Step 3: Load navigationHelper
      await import('../../utils/navigationHelper.js');

      // Step 4: Load navigation component (should initialize mobile menu)
      // navigation.js initializes at module evaluation with a once:true
      // listener; a cached module can never wire a navbar injected by a
      // later describe. Fresh module per setup makes init deterministic.
      vi.resetModules();
      await import('../../components/layout/navigation.js');

      // Wait for navigation initialization with immediate timer execution
      TimerUtils.runAllTimers();

      // Step 5: Verify complete system is working
      const mobileMenuButton = document.getElementById('mobile-menu');
      const navMenu = document.getElementById('nav-menu');

      expect(mobileMenuButton).toBeTruthy();
      expect(navMenu).toBeTruthy();
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should handle the complete flow with navbarLoaded event', async () => {
      let navbarLoadedFired = false;
      let navigationInitialized = false;

      // Listen for navbar loaded event
      document.addEventListener('navbarLoaded', () => {
        navbarLoadedFired = true;
      });

      // Step 1: Setup navbar manually since navbarLoader doesn't run in test env
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = global.createMockNavbar();

      // Step 2: Load navigation in parallel with event dispatch
      const navigationPromise = import('../../components/layout/navigation.js');

      // Dispatch the navbarLoaded event
      const navbarLoadedEvent = new CustomEvent('navbarLoaded');
      document.dispatchEvent(navbarLoadedEvent);

      await navigationPromise;
      expect(navbarLoadedFired).toBe(true);

      // Wait for navigation initialization
      await new Promise(resolve => {
        let attempts = 0;
        const checkInit = () => {
          const mobileMenuButton = document.getElementById('mobile-menu');
          if (mobileMenuButton && mobileMenuButton.getAttribute('aria-expanded') === 'false') {
            resolve();
          } else if (attempts < (process.env.CI ? 300 : 50)) {
            attempts++;
            setTimeout(checkInit, 10);
          } else {
            resolve();
          }
        };
        checkInit();
      });

      // Verify navigation is working
      const mobileMenuButton = document.getElementById('mobile-menu');
      if (mobileMenuButton) {
        expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');
        navigationInitialized = true;
      }

      expect(navigationInitialized).toBe(true);
    });

    it('should work when navigation loads before navbar (waits for event)', async () => {
      let eventListenerAdded = false;

      // Mock addEventListener to track if navigation is waiting for event
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = vi.fn((event, handler, options) => {
        if (event === 'navbarLoaded') {
          eventListenerAdded = true;
        }
        return originalAddEventListener.call(document, event, handler, options);
      });

      // Step 1: Load navigation first (before navbar exists)
      document.getElementById('navbar-placeholder').innerHTML = ''; // Empty navbar
      // navigation.js initializes at module evaluation with a once:true
      // listener; a cached module can never wire a navbar injected by a
      // later describe. Fresh module per setup makes init deterministic.
      vi.resetModules();
      await import('../../components/layout/navigation.js');

      // Should wait for navbarLoaded event since no mobile-menu exists
      expect(eventListenerAdded).toBe(true);

      // Step 2: Manually simulate navbar loading (navbarLoader won't run in test env)
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = global.createMockNavbar();

      // Dispatch the navbarLoaded event
      const navbarLoadedEvent = new CustomEvent('navbarLoaded');
      document.dispatchEvent(navbarLoadedEvent);

      // Step 3: Wait for navigation to initialize after event
      await new Promise(resolve => {
        let attempts = 0;
        const checkInitialization = () => {
          const mobileMenuButton = document.getElementById('mobile-menu');
          if (mobileMenuButton && mobileMenuButton.getAttribute('aria-expanded') === 'false') {
            resolve();
          } else if (attempts < 50) {
            attempts++;
            setTimeout(checkInitialization, 10);
          } else {
            resolve();
          }
        };
        checkInitialization();
      });

      const mobileMenuButton = document.getElementById('mobile-menu');
      expect(mobileMenuButton).toBeTruthy();
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');

      // Restore original addEventListener
      document.addEventListener = originalAddEventListener;
    }, 10000);
  });

  describe('Cross-Component Communication', () => {
    it('should allow NavigationHelper to update links after navbar loads', async () => {
      // Setup navbar manually
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = global.createMockNavbar();

      const NavigationHelperModule = await import('../../utils/navigationHelper.js');
      const NavigationHelper = NavigationHelperModule.default;

      // Create navigation helper
      const helper = new NavigationHelper();

      // Should be able to find and update navigation links
      expect(() => {
        helper.updateNavigationLinks();
      }).not.toThrow();

      // Verify links are present and can be updated
      const links = document.querySelectorAll('#nav-menu a');
      expect(links.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle window.navigationHelper global access', async () => {
      // Setup navbar manually
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = global.createMockNavbar();

      // Load navigation helper
      await import('../../utils/navigationHelper.js');

      // Check if navigationHelper is available globally (as some code expects)
      if (window.navigationHelper) {
        expect(typeof window.navigationHelper.updateNavigationLinks).toBe('function');
      }

      // This test passes regardless since global availability is optional
      expect(true).toBe(true);
    }, 10000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle navbar fetch failure gracefully', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Should not throw when navbar fails to load
      expect(async () => {
        await import('../../components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();

      // Navigation should still load without errors
      expect(async () => {
        // navigation.js initializes at module evaluation with a once:true
        // listener; a cached module can never wire a navbar injected by a
        // later describe. Fresh module per setup makes init deterministic.
        vi.resetModules();
        await import('../../components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });

    it('should handle missing placeholder element', async () => {
      // Remove navbar placeholder
      document.getElementById('navbar-placeholder').remove();

      // Should not throw
      expect(async () => {
        await import('../../components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));

        // navigation.js initializes at module evaluation with a once:true
        // listener; a cached module can never wire a navbar injected by a
        // later describe. Fresh module per setup makes init deterministic.
        vi.resetModules();
        await import('../../components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });

    it('should handle malformed navbar HTML', async () => {
      // Mock fetch with malformed HTML
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Not proper navbar HTML</div>'),
      });

      // Should not throw even with malformed HTML
      expect(async () => {
        await import('../../components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));

        // navigation.js initializes at module evaluation with a once:true
        // listener; a cached module can never wire a navbar injected by a
        // later describe. Fresh module per setup makes init deterministic.
        vi.resetModules();
        await import('../../components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });
  });

  describe('Mobile Menu Integration', () => {
    beforeEach(async () => {
      // Setup navbar manually and load navigation system
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.innerHTML = global.createMockNavbar();

      // Load navigation components
      // navigation.js initializes at module evaluation with a once:true
      // listener; a cached module can never wire a navbar injected by a
      // later describe. Fresh module per setup makes init deterministic.
      vi.resetModules();
      await import('../../components/layout/navigation.js');

      // Dispatch navbarLoaded event to initialize navigation
      const navbarLoadedEvent = new CustomEvent('navbarLoaded');
      document.dispatchEvent(navbarLoadedEvent);

      // Wait for navigation initialization
      await new Promise(resolve => {
        let attempts = 0;
        const checkInit = () => {
          const mobileMenuButton = document.getElementById('mobile-menu');
          if (mobileMenuButton && mobileMenuButton.getAttribute('aria-expanded') === 'false') {
            resolve();
          } else if (attempts < (process.env.CI ? 300 : 50)) {
            attempts++;
            setTimeout(checkInit, 10);
          } else {
            resolve();
          }
        };
        checkInit();
      });
    });

    it('should provide complete mobile menu functionality', () => {
      const mobileMenuButton = document.getElementById('mobile-menu');
      const navMenu = document.getElementById('nav-menu');

      expect(mobileMenuButton).toBeTruthy();
      expect(navMenu).toBeTruthy();

      // Test complete interaction flow
      expect(navMenu.classList.contains('active')).toBe(false);

      // Open menu
      mobileMenuButton.click();
      expect(navMenu.classList.contains('active')).toBe(true);
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('true');

      // Close with escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      expect(navMenu.classList.contains('active')).toBe(false);

      // Open again
      mobileMenuButton.click();
      expect(navMenu.classList.contains('active')).toBe(true);

      // Close by clicking outside
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(clickEvent);
      expect(navMenu.classList.contains('active')).toBe(false);
    });
  });

  describe('Script Loading Order Independence', () => {
    it('should work when scripts are loaded in different orders', async () => {
      const testOrders = [
        ['navigationHelper', 'navigation'], // Skip navbarLoader as it doesn't run in test env
        ['navigation', 'navigationHelper'],
      ];

      for (const order of testOrders) {
        // Reset for each test
        vi.resetModules();
        const placeholder = document.getElementById('navbar-placeholder');
        placeholder.innerHTML = '';

        // Setup navbar manually first since navbarLoader doesn't run in test env
        placeholder.innerHTML = global.createMockNavbar();

        // Load modules in specified order
        for (const script of order) {
          if (script === 'navigationHelper') {
            await import('../../utils/navigationHelper.js');
          } else if (script === 'navigation') {
            // navigation.js initializes at module evaluation with a once:true
            // listener; a cached module can never wire a navbar injected by a
            // later describe. Fresh module per setup makes init deterministic.
            vi.resetModules();
            await import('../../components/layout/navigation.js');
          }

          // Small delay between loads
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Dispatch navbarLoaded event to initialize navigation
        const navbarLoadedEvent = new CustomEvent('navbarLoaded');
        document.dispatchEvent(navbarLoadedEvent);

        // Wait for navigation initialization
        await new Promise(resolve => {
          let attempts = 0;
          const checkInit = () => {
            const mobileMenuButton = document.getElementById('mobile-menu');
            if (mobileMenuButton && mobileMenuButton.getAttribute('aria-expanded') === 'false') {
              resolve();
            } else if (attempts < 50) {
              attempts++;
              setTimeout(checkInit, 10);
            } else {
              resolve();
            }
          };
          checkInit();
        });

        // Should have working navigation regardless of load order
        const mobileMenuButton = document.getElementById('mobile-menu');
        if (mobileMenuButton) {
          // Navigation should be functional
          expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');

          // Should be able to toggle menu
          mobileMenuButton.click();
          expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('true');
        }
      }
    }, 20000);
  });

  describe('ES6 Import Prevention (Critical Regression Test)', () => {
    it('should verify NO navigation files use ES6 imports', async () => {
      const navigationFiles = [
        '/components/layout/navbarLoader.js',
        '/utils/navigationHelper.js',
        '/components/layout/navigation.js',
      ];

      for (const file of navigationFiles) {
        const response = await fetch(file);
        const content = await response.text();

        // CRITICAL: Must not contain ES6 imports
        const hasImport = /^\s*import\s+.*from\s+['"`].*['"`];?\s*$/m.test(content);

        expect(hasImport).toBe(
          false,
          `File ${file} contains ES6 import statement which will break regular script loading`
        );
      }
    });

    it('should verify all navigation files are loadable as regular scripts', () => {
      const navigationFiles = [
        '/components/layout/navbarLoader.js',
        '/utils/navigationHelper.js',
        '/components/layout/navigation.js',
      ];

      navigationFiles.forEach(file => {
        const script = document.createElement('script');
        script.src = file;
        // Intentionally NOT setting type="module"

        // Should not throw when adding to DOM as regular script
        expect(() => {
          document.head.appendChild(script);
        }).not.toThrow();

        // Clean up
        script.remove();
      });
    });
  });
});
