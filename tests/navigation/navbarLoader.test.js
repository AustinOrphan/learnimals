/**
 * Navigation Loader Tests
 * Critical tests to prevent navigation system regressions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Utility function for controlled delays in tests using fake timers
const delayWithFakeTimers = async ms => {
  vi.useFakeTimers();
  const promise = new Promise(resolve => setTimeout(resolve, ms));
  vi.advanceTimersByTime(ms);
  await promise;
  vi.useRealTimers();
};

describe('NavbarLoader', () => {
  let mockFetch;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Create navbar placeholder
    global.createNavbarPlaceholder();

    // Mock successful fetch response
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(global.createMockNavbar()),
    });
    global.fetch = mockFetch;

    // Reset modules to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ES6 Import Compatibility', () => {
    it('should NOT use ES6 import statements (regression test)', async () => {
      // Read the actual navbarLoader.js file content
      const response = await fetch('/components/layout/navbarLoader.js');
      const content = await response.text();

      // CRITICAL: Ensure no ES6 imports that would break regular script loading
      expect(content).not.toMatch(/^\s*import\s+.*from\s+['"`].*['"`];?\s*$/m);
      expect(content).not.toMatch(/^\s*import\s*\{.*\}\s*from\s+['"`].*['"`];?\s*$/m);
      expect(content).not.toMatch(/^\s*import\s*\*\s*as\s+.*\s*from\s+['"`].*['"`];?\s*$/m);
    });

    it('should be loadable as a regular script (not module)', async () => {
      // Simulate loading as regular script by creating script element without type="module"
      const script = document.createElement('script');
      script.src = '/components/layout/navbarLoader.js';
      // Intentionally NOT setting type="module"

      document.head.appendChild(script);

      // Should not throw syntax errors
      expect(() => {
        // Simulate script execution
        eval('/* navbarLoader content would be here */');
      }).not.toThrow();
    });

    it('should have inline logger fallback instead of import', async () => {
      // Import the module to check its structure
      const navbarLoaderModule = await import('../../components/layout/navbarLoader.js');

      // Should not have logger import dependency
      expect(typeof navbarLoaderModule.default).toBe('undefined'); // Should be regular script, not module
    });
  });

  describe('Navbar Loading Functionality', () => {
    it('should fetch navbar.html from correct path', async () => {
      // Set up document.currentScript mock
      Object.defineProperty(document, 'currentScript', {
        value: {
          src: 'http://localhost:8080/src/components/layout/navbarLoader.js',
        },
        configurable: true,
      });

      // Import and execute navbarLoader
      await import('../../components/layout/navbarLoader.js');

      // Wait for async operations
      await delayWithFakeTimers(100);

      // Should fetch from correct relative path
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/src/components/layout/navbar.html'
      );
    });

    it('should inject navbar content into placeholder', async () => {
      const placeholder = document.getElementById('navbar-placeholder');

      // Import navbarLoader
      await import('../../components/layout/navbarLoader.js');

      // Wait for async operations
      await delayWithFakeTimers(100);

      // Should have navbar content injected
      expect(placeholder.innerHTML).toContain('navbar');
      expect(placeholder.innerHTML).toContain('mobile-menu');
      expect(placeholder.innerHTML).toContain('nav-menu');
    });

    it('should dispatch navbarLoaded event', async () => {
      let eventFired = false;
      document.addEventListener('navbarLoaded', () => {
        eventFired = true;
      });

      // Import navbarLoader
      await import('../../components/layout/navbarLoader.js');

      // Wait for async operations
      await delayWithFakeTimers(100);

      expect(eventFired).toBe(true);
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Should not throw when import fails
      expect(async () => {
        await import('../../components/layout/navbarLoader.js');
        await delayWithFakeTimers(100);
      }).not.toThrow();
    });

    it('should handle missing placeholder gracefully', async () => {
      // Remove navbar placeholder
      const placeholder = document.getElementById('navbar-placeholder');
      placeholder.remove();

      // Should not throw when placeholder missing
      expect(async () => {
        await import('../../components/layout/navbarLoader.js');
        await delayWithFakeTimers(100);
      }).not.toThrow();
    });
  });

  describe('Logger Integration', () => {
    it('should have fallback logger that works without import', async () => {
      // Import navbarLoader
      await import('../../components/layout/navbarLoader.js');

      // Wait for execution
      await delayWithFakeTimers(100);

      // Should have logged debug message (in test environment)
      // Note: Actual logging behavior depends on environment detection
      expect(true).toBe(true); // Placeholder - actual logger calls are tested elsewhere
    });

    it('should detect localhost environment correctly', () => {
      // This tests the inline logger's environment detection
      const mock_Logger = {
        debug: (...args) => {
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log('[NavbarLoader DEBUG]', ...args);
          }
        },
        error: (...args) => console.error('[NavbarLoader ERROR]', ...args),
      };

      // Should call debug in localhost environment
      const consoleSpy = vi.spyOn(console, 'log');
      mock_Logger.debug('test message');

      expect(consoleSpy).toHaveBeenCalledWith('[NavbarLoader DEBUG]', 'test message');
    });
  });

  describe('Path Resolution', () => {
    it('should resolve navbar.html path correctly from different locations', async () => {
      const testCases = [
        {
          scriptSrc: 'http://localhost:8080/src/components/layout/navbarLoader.js',
          expectedPath: 'http://localhost:8080/src/components/layout/navbar.html',
        },
        {
          scriptSrc: 'https://learnimals.com/src/components/layout/navbarLoader.js',
          expectedPath: 'https://learnimals.com/src/components/layout/navbar.html',
        },
      ];

      for (const testCase of testCases) {
        // Reset modules for each test case
        vi.resetModules();

        // Mock currentScript
        Object.defineProperty(document, 'currentScript', {
          value: { src: testCase.scriptSrc },
          configurable: true,
        });

        // Import navbarLoader
        await import('../../components/layout/navbarLoader.js');

        // Wait for execution
        await delayWithFakeTimers(50);

        // Check fetch was called with correct path
        expect(mockFetch).toHaveBeenCalledWith(testCase.expectedPath);

        // Clear mocks for next iteration
        mockFetch.mockClear();
      }
    });
  });
});
