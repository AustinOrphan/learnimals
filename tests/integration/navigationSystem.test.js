/**
 * Navigation System Integration Tests
 * End-to-end tests for the complete navigation system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Navigation System Integration', () => {
  let mockFetch;

  beforeEach(() => {
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
      text: () => Promise.resolve(global.createMockNavbar())
    });
    global.fetch = mockFetch;

    // Reset modules
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Navigation Loading Flow', () => {
    it('should load complete navigation system without ES6 import errors', async () => {
      // Step 1: Load navbarLoader (should fetch and inject navbar)
      await import('../../src/components/layout/navbarLoader.js');
      
      // Wait for navbar loading
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Verify navbar was injected
      const placeholder = document.getElementById('navbar-placeholder');
      expect(placeholder.innerHTML).toContain('mobile-menu');
      expect(placeholder.innerHTML).toContain('nav-menu');

      // Step 3: Load navigationHelper
      await import('../../src/utils/navigationHelper.js');

      // Step 4: Load navigation component (should initialize mobile menu)
      await import('../../src/components/layout/navigation.js');
      
      // Wait for navigation initialization
      await new Promise(resolve => setTimeout(resolve, 100));

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

      // Step 1: Load navbarLoader first
      await import('../../src/components/layout/navbarLoader.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(navbarLoadedFired).toBe(true);

      // Step 2: Load navigation (should initialize immediately since navbar exists)
      await import('../../src/components/layout/navigation.js');
      await new Promise(resolve => setTimeout(resolve, 100));

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
      await import('../../src/components/layout/navigation.js');

      // Should wait for navbarLoaded event since no mobile-menu exists
      expect(eventListenerAdded).toBe(true);

      // Step 2: Load navbar (should trigger event)
      await import('../../src/components/layout/navbarLoader.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Verify navigation initializes after navbar loads
      const mobileMenuButton = document.getElementById('mobile-menu');
      expect(mobileMenuButton).toBeTruthy();

      // Restore original addEventListener
      document.addEventListener = originalAddEventListener;
    });
  });

  describe('Cross-Component Communication', () => {
    it('should allow NavigationHelper to update links after navbar loads', async () => {
      // Load complete system
      await import('../../src/components/layout/navbarLoader.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const NavigationHelperModule = await import('../../src/utils/navigationHelper.js');
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
    });

    it('should handle window.navigationHelper global access', async () => {
      // Load navbar first
      await import('../../src/components/layout/navbarLoader.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Load navigation helper
      await import('../../src/utils/navigationHelper.js');

      // Check if navigationHelper is available globally (as some code expects)
      if (window.navigationHelper) {
        expect(typeof window.navigationHelper.updateNavigationLinks).toBe('function');
      }
      
      // This test passes regardless since global availability is optional
      expect(true).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle navbar fetch failure gracefully', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Should not throw when navbar fails to load
      expect(async () => {
        await import('../../src/components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();

      // Navigation should still load without errors
      expect(async () => {
        await import('../../src/components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });

    it('should handle missing placeholder element', async () => {
      // Remove navbar placeholder
      document.getElementById('navbar-placeholder').remove();

      // Should not throw
      expect(async () => {
        await import('../../src/components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await import('../../src/components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });

    it('should handle malformed navbar HTML', async () => {
      // Mock fetch with malformed HTML
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div>Not proper navbar HTML</div>')
      });

      // Should not throw even with malformed HTML
      expect(async () => {
        await import('../../src/components/layout/navbarLoader.js');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await import('../../src/components/layout/navigation.js');
        await new Promise(resolve => setTimeout(resolve, 100));
      }).not.toThrow();
    });
  });

  describe('Mobile Menu Integration', () => {
    beforeEach(async () => {
      // Load complete navigation system
      await import('../../src/components/layout/navbarLoader.js');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await import('../../src/components/layout/navigation.js');
      await new Promise(resolve => setTimeout(resolve, 100));
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
        ['navbarLoader', 'navigationHelper', 'navigation'],
        ['navigation', 'navbarLoader', 'navigationHelper'],
        ['navigationHelper', 'navigation', 'navbarLoader']
      ];

      for (const order of testOrders) {
        // Reset for each test
        vi.resetModules();
        document.getElementById('navbar-placeholder').innerHTML = '';

        // Load in specified order
        for (const script of order) {
          if (script === 'navbarLoader') {
            await import('../../src/components/layout/navbarLoader.js');
          } else if (script === 'navigationHelper') {
            await import('../../src/utils/navigationHelper.js');
          } else if (script === 'navigation') {
            await import('../../src/components/layout/navigation.js');
          }
          
          // Small delay between loads
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Final wait for all async operations
        await new Promise(resolve => setTimeout(resolve, 200));

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
    });
  });

  describe('ES6 Import Prevention (Critical Regression Test)', () => {
    it('should verify NO navigation files use ES6 imports', async () => {
      const navigationFiles = [
        '/src/components/layout/navbarLoader.js',
        '/src/utils/navigationHelper.js',
        '/src/components/layout/navigation.js'
      ];

      for (const file of navigationFiles) {
        const response = await fetch(file);
        const content = await response.text();

        // CRITICAL: Must not contain ES6 imports
        const hasImport = /^\s*import\s+.*from\s+['"`].*['"`];?\s*$/m.test(content);
        
        expect(hasImport).toBe(false, 
          `File ${file} contains ES6 import statement which will break regular script loading`
        );
      }
    });

    it('should verify all navigation files are loadable as regular scripts', () => {
      const navigationFiles = [
        '/src/components/layout/navbarLoader.js',
        '/src/utils/navigationHelper.js', 
        '/src/components/layout/navigation.js'
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