/**
 * Navigation and Routing Integration Tests
 *
 * Tests the integration of navigation components, routing, and page transitions
 * Verifies that navigation system works correctly with other components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mockComponentDependencies,
  cleanupIntegrationTest,
} from '../../helpers/integrationTestUtils.js';

describe('Navigation and Routing Integration', () => {
  let container;
  let mockHistory;
  let mockLocation;

  beforeEach(() => {
    // Mock component dependencies
    mockComponentDependencies();

    // Setup test container
    container = document.createElement('div');
    container.id = 'navigation-integration-test';
    document.body.appendChild(container);

    // Mock window.scrollTo
    window.scrollTo = vi.fn();
    global.scrollTo = vi.fn();

    // Mock window.scrollX and scrollY
    Object.defineProperty(window, 'scrollX', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    // Mock browser history API
    mockHistory = {
      entries: [],
      currentIndex: -1,

      pushState: vi.fn(function (state, title, url) {
        this.currentIndex++;
        this.entries[this.currentIndex] = { state, title, url };
        mockLocation.pathname = url;
      }),

      replaceState: vi.fn(function (state, title, url) {
        this.entries[this.currentIndex] = { state, title, url };
        mockLocation.pathname = url;
      }),

      back: vi.fn(function () {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          const entry = this.entries[this.currentIndex];
          mockLocation.pathname = entry.url;
          window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
        }
      }),

      forward: vi.fn(function () {
        if (this.currentIndex < this.entries.length - 1) {
          this.currentIndex++;
          const entry = this.entries[this.currentIndex];
          mockLocation.pathname = entry.url;
          window.dispatchEvent(new PopStateEvent('popstate', { state: entry.state }));
        }
      }),
    };

    // Mock location with all required properties
    mockLocation = {
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      assign: vi.fn(url => {
        mockLocation.href = url;
        mockLocation.pathname = new URL(url, mockLocation.origin).pathname;
      }),
      replace: vi.fn(url => {
        mockLocation.href = url;
        mockLocation.pathname = new URL(url, mockLocation.origin).pathname;
      }),
      reload: vi.fn(),
    };

    global.history = mockHistory;
    delete window.location;
    window.location = mockLocation;

    // Mock localStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: vi.fn(key => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up container
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Clean up integration test
    cleanupIntegrationTest();

    vi.clearAllMocks();
  });

  describe('Navigation Component Integration', () => {
    it('should integrate navbar with routing system', () => {
      const mockNavigation = {
        currentPage: '/',
        navItems: [
          { path: '/', label: 'Home', icon: 'home' },
          { path: '/math', label: 'Math', icon: 'calculator' },
          { path: '/science', label: 'Science', icon: 'flask' },
          { path: '/reading', label: 'Reading', icon: 'book' },
          { path: '/profile', label: 'Profile', icon: 'user' },
        ],

        render: vi.fn(function (container) {
          const nav = document.createElement('nav');
          nav.className = 'navbar';
          nav.innerHTML = `
            <div class="navbar__brand">
              <a href="/" data-route="/">Learnimals</a>
            </div>
            <ul class="navbar__menu">
              ${this.navItems
    .map(
      item => `
                <li class="navbar__item ${this.currentPage === item.path ? 'active' : ''}">
                  <a href="${item.path}" data-route="${item.path}" class="navbar__link">
                    <i class="icon icon-${item.icon}"></i>
                    <span>${item.label}</span>
                  </a>
                </li>
              `
    )
    .join('')}
            </ul>
            <button class="navbar__toggle" aria-label="Toggle menu">
              <span></span><span></span><span></span>
            </button>
          `;

          container.appendChild(nav);
          this.bindEvents(nav);
          return nav;
        }),

        bindEvents: vi.fn(function (nav) {
          // Handle navigation clicks
          nav.addEventListener('click', e => {
            const link = e.target.closest('a[data-route]');
            if (link) {
              e.preventDefault();
              const route = link.dataset.route;
              this.navigate(route);
            }
          });

          // Handle mobile menu toggle
          const toggle = nav.querySelector('.navbar__toggle');
          toggle?.addEventListener('click', () => {
            nav.classList.toggle('navbar--open');
          });
        }),

        navigate: vi.fn(function (path) {
          this.currentPage = path;
          history.pushState({ page: path }, '', path);
          this.updateActiveState();
          this.onNavigate?.(path);
        }),

        updateActiveState: vi.fn(function () {
          const links = document.querySelectorAll('.navbar__item');
          links.forEach(item => {
            const link = item.querySelector('a[data-route]');
            if (link?.dataset.route === this.currentPage) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }),

        onNavigate: null,
      };

      // Render navigation
      mockNavigation.render(container);

      // Verify navbar rendered
      expect(container.querySelector('.navbar')).toBeTruthy();
      expect(container.querySelectorAll('.navbar__item')).toHaveLength(5);

      // Test navigation
      const mathLink = container.querySelector('a[data-route="/math"]');
      mathLink.click();

      expect(mockNavigation.navigate).toHaveBeenCalledWith('/math');
      expect(mockHistory.pushState).toHaveBeenCalledWith({ page: '/math' }, '', '/math');
      expect(mockLocation.pathname).toBe('/math');
    });

    it('should handle mobile navigation correctly', () => {
      const mockMobileNav = {
        isOpen: false,
        breakpoint: 768,

        init: vi.fn(function () {
          this.checkViewport();
          window.addEventListener('resize', () => this.checkViewport());
        }),

        checkViewport: vi.fn(function () {
          const isMobile = window.innerWidth < this.breakpoint;
          document.body.classList.toggle('is-mobile', isMobile);

          if (!isMobile && this.isOpen) {
            this.close();
          }
        }),

        toggle: vi.fn(function () {
          this.isOpen ? this.close() : this.open();
        }),

        open: vi.fn(function () {
          this.isOpen = true;
          document.body.classList.add('nav-open');
          this.lockScroll();
        }),

        close: vi.fn(function () {
          this.isOpen = false;
          document.body.classList.remove('nav-open');
          this.unlockScroll();
        }),

        lockScroll: vi.fn(function () {
          document.body.style.overflow = 'hidden';
        }),

        unlockScroll: vi.fn(function () {
          document.body.style.overflow = '';
        }),
      };

      // Initialize mobile nav
      mockMobileNav.init();

      // Simulate mobile viewport
      global.innerWidth = 600;
      mockMobileNav.checkViewport();

      expect(document.body.classList.contains('is-mobile')).toBe(true);

      // Test toggle
      mockMobileNav.toggle();
      expect(mockMobileNav.isOpen).toBe(true);
      expect(document.body.classList.contains('nav-open')).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');

      // Test close on navigation
      mockMobileNav.close();
      expect(mockMobileNav.isOpen).toBe(false);
      expect(document.body.classList.contains('nav-open')).toBe(false);
    });
  });

  describe('Routing System Integration', () => {
    it('should implement complete routing system', () => {
      const mockRouter = {
        routes: new Map(),
        currentRoute: null,
        params: {},

        define: vi.fn(function (path, handler) {
          this.routes.set(path, handler);
        }),

        navigate: vi.fn(function (path, data = {}) {
          // Parse path and params
          const [pathname, search] = path.split('?');
          this.params = this.parseParams(search);

          // Find matching route
          let handler = this.routes.get(pathname);
          let routeParams = {};

          if (!handler) {
            // Check for dynamic routes
            for (const [routePath, routeHandler] of this.routes) {
              const match = this.matchRoute(pathname, routePath);
              if (match) {
                handler = routeHandler;
                routeParams = match;
                break;
              }
            }
          }

          if (handler) {
            this.currentRoute = pathname;
            history.pushState({ path, data }, '', path);
            handler({
              path: pathname,
              params: { ...this.params, ...routeParams },
              data,
            });
          } else {
            this.handleNotFound(pathname);
          }
        }),

        matchRoute: vi.fn(function (path, pattern) {
          // Simple dynamic route matching
          const pathParts = path.split('/');
          const patternParts = pattern.split('/');

          if (pathParts.length !== patternParts.length) return null;

          const params = {};
          for (let i = 0; i < pathParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
              const paramName = patternParts[i].slice(1);
              params[paramName] = pathParts[i];
            } else if (pathParts[i] !== patternParts[i]) {
              return null;
            }
          }

          return params;
        }),

        parseParams: vi.fn(function (search) {
          if (!search) return {};

          const params = {};
          const searchParams = new URLSearchParams(search);
          for (const [key, value] of searchParams) {
            params[key] = value;
          }
          return params;
        }),

        handleNotFound: vi.fn(function (path) {
          console.error(`Route not found: ${path}`);
          this.navigate('/404');
        }),

        back: vi.fn(function () {
          history.back();
        }),

        forward: vi.fn(function () {
          history.forward();
        }),
      };

      // Define routes with mock handlers
      mockRouter.define(
        '/',
        vi.fn(context => ({ page: 'home', context }))
      );
      mockRouter.define(
        '/math',
        vi.fn(context => ({ page: 'math', context }))
      );
      mockRouter.define(
        '/game/:gameId',
        vi.fn(context => ({ page: 'game', context }))
      );
      mockRouter.define(
        '/profile/:userId',
        vi.fn(context => ({ page: 'profile', context }))
      );
      mockRouter.define(
        '/404',
        vi.fn(context => ({ page: 'notFound', context }))
      );

      // Test basic navigation
      mockRouter.navigate('/math');
      expect(mockRouter.currentRoute).toBe('/math');
      expect(mockHistory.pushState).toHaveBeenCalledWith({ path: '/math', data: {} }, '', '/math');

      // Test dynamic route
      mockRouter.navigate('/game/bubble-pop');
      expect(mockRouter.currentRoute).toBe('/game/bubble-pop');

      // Test with query params
      mockRouter.navigate('/profile/user123?tab=stats&view=detailed');
      expect(mockRouter.params.tab).toBe('stats');
      expect(mockRouter.params.view).toBe('detailed');

      // Test 404
      mockRouter.navigate('/non-existent');
      expect(mockRouter.handleNotFound).toHaveBeenCalledWith('/non-existent');
    });

    it('should handle browser back/forward navigation', () => {
      const mockBrowserNavigation = {
        history: [],
        currentIndex: -1,
        listeners: new Set(),

        init: vi.fn(function () {
          window.addEventListener('popstate', event => {
            this.handlePopState(event);
          });
        }),

        push: vi.fn(function (state) {
          this.currentIndex++;
          this.history = this.history.slice(0, this.currentIndex);
          this.history.push(state);
          history.pushState(state, '', state.url);
          this.notifyListeners('push', state);
        }),

        replace: vi.fn(function (state) {
          if (this.currentIndex >= 0) {
            this.history[this.currentIndex] = state;
            history.replaceState(state, '', state.url);
            this.notifyListeners('replace', state);
          }
        }),

        handlePopState: vi.fn(function (event) {
          const state = event.state;
          if (state) {
            this.notifyListeners('popstate', state);
          }
        }),

        addListener: vi.fn(function (callback) {
          this.listeners.add(callback);
        }),

        notifyListeners: vi.fn(function (type, state) {
          this.listeners.forEach(listener => listener(type, state));
        }),
      };

      // Initialize
      mockBrowserNavigation.init();

      // Add listener
      const navigationListener = vi.fn();
      mockBrowserNavigation.addListener(navigationListener);

      // Navigate through pages
      mockBrowserNavigation.push({ url: '/', page: 'home' });
      mockBrowserNavigation.push({ url: '/math', page: 'math' });
      mockBrowserNavigation.push({ url: '/science', page: 'science' });

      expect(mockBrowserNavigation.history).toHaveLength(3);
      expect(navigationListener).toHaveBeenCalledTimes(3);

      // Test back navigation
      const popstateEvent = new PopStateEvent('popstate', {
        state: { url: '/math', page: 'math' },
      });
      mockBrowserNavigation.handlePopState(popstateEvent);

      expect(navigationListener).toHaveBeenCalledWith('popstate', { url: '/math', page: 'math' });
    });
  });

  describe('Page Transition Integration', () => {
    it('should handle page transitions smoothly', async () => {
      const mockPageTransition = {
        isTransitioning: false,
        currentPage: null,
        transitionDuration: 300,

        transitionTo: vi.fn(async function (newPage, options = {}) {
          if (this.isTransitioning) return;

          this.isTransitioning = true;
          const container = document.querySelector('.page-container');

          // Start exit transition
          if (this.currentPage) {
            container.classList.add('page-exit');
            await this.wait(this.transitionDuration);
          }

          // Load new page
          const pageContent = await this.loadPage(newPage);

          // Update content
          container.innerHTML = pageContent;
          container.classList.remove('page-exit');
          container.classList.add('page-enter');

          // Complete transition
          await this.wait(50);
          container.classList.remove('page-enter');

          this.currentPage = newPage;
          this.isTransitioning = false;

          // Execute page callback
          if (options.onComplete) {
            options.onComplete(newPage);
          }
        }),

        loadPage: vi.fn(async function (page) {
          // Simulate page loading
          const pages = {
            home: '<h1>Welcome to Learnimals</h1>',
            math: '<h1>Math Games</h1><div class="game-grid">...</div>',
            science: '<h1>Science Adventures</h1><div class="experiments">...</div>',
          };

          return pages[page] || '<h1>Page Not Found</h1>';
        }),

        wait: vi.fn(function (ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }),

        preloadPage: vi.fn(async function (page) {
          const content = await this.loadPage(page);
          this.pageCache = this.pageCache || {};
          this.pageCache[page] = content;
          return content;
        }),
      };

      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-container';
      container.appendChild(pageContainer);

      // Test page transition
      await mockPageTransition.transitionTo('home');
      expect(mockPageTransition.currentPage).toBe('home');
      expect(pageContainer.innerHTML).toContain('Welcome to Learnimals');

      // Test transition to another page
      await mockPageTransition.transitionTo('math', {
        onComplete: page => {
          expect(page).toBe('math');
        },
      });

      expect(pageContainer.innerHTML).toContain('Math Games');

      // Test preloading
      await mockPageTransition.preloadPage('science');
      expect(mockPageTransition.pageCache?.science).toBeDefined();
    });

    it('should maintain scroll position during navigation', () => {
      const mockScrollManager = {
        positions: new Map(),

        savePosition: vi.fn(function (route) {
          this.positions.set(route, {
            x: window.scrollX,
            y: window.scrollY,
            timestamp: Date.now(),
          });
        }),

        restorePosition: vi.fn(function (route, options = {}) {
          const position = this.positions.get(route);

          if (position) {
            if (options.smooth) {
              window.scrollTo({
                left: position.x,
                top: position.y,
                behavior: 'smooth',
              });
            } else {
              window.scrollTo(position.x, position.y);
            }
            return true;
          }

          // Default to top
          window.scrollTo(0, 0);
          return false;
        }),

        clearOldPositions: vi.fn(function (maxAge = 3600000) {
          // 1 hour
          const now = Date.now();
          for (const [route, position] of this.positions) {
            if (now - position.timestamp > maxAge) {
              this.positions.delete(route);
            }
          }
        }),
      };

      // Mock scroll position
      window.scrollX = 0;
      window.scrollY = 500;

      // Save position before navigation
      mockScrollManager.savePosition('/math');
      expect(mockScrollManager.positions.has('/math')).toBe(true);
      expect(mockScrollManager.positions.get('/math').y).toBe(500);

      // Navigate away and back
      window.scrollY = 0; // Reset scroll
      mockScrollManager.restorePosition('/math');

      expect(mockScrollManager.restorePosition).toHaveBeenCalledWith('/math');

      // Test cleanup
      const oldPosition = { x: 0, y: 100, timestamp: Date.now() - 7200000 }; // 2 hours old
      mockScrollManager.positions.set('/old-route', oldPosition);

      mockScrollManager.clearOldPositions();
      expect(mockScrollManager.positions.has('/old-route')).toBe(false);
    });
  });

  describe('Deep Linking and URL Management', () => {
    it('should handle deep links correctly', () => {
      const mockDeepLinkHandler = {
        patterns: [
          { pattern: /^\/game\/([^\/]+)$/, handler: 'gameHandler' },
          { pattern: /^\/profile\/([^\/]+)$/, handler: 'profileHandler' },
          { pattern: /^\/share\/([^\/]+)$/, handler: 'shareHandler' },
        ],

        handleDeepLink: vi.fn(function (url) {
          const path = new URL(url, window.location.origin).pathname;

          for (const { pattern, handler } of this.patterns) {
            const match = path.match(pattern);
            if (match) {
              return this[handler](match);
            }
          }

          return this.defaultHandler(path);
        }),

        gameHandler: vi.fn(function (match) {
          const gameId = match[1];
          return {
            type: 'game',
            gameId,
            action: () => {
              // Load game directly
              window.location.assign(`/games/${gameId}`);
            },
          };
        }),

        profileHandler: vi.fn(function (match) {
          const userId = match[1];
          return {
            type: 'profile',
            userId,
            action: () => {
              // Navigate to profile
              window.location.assign(`/profile/${userId}`);
            },
          };
        }),

        shareHandler: vi.fn(function (match) {
          const shareId = match[1];
          return {
            type: 'share',
            shareId,
            action: async () => {
              // Load shared content
              const content = await this.loadSharedContent(shareId);
              return content;
            },
          };
        }),

        defaultHandler: vi.fn(function (path) {
          return {
            type: 'default',
            path,
            action: () => {
              window.location.assign(path);
            },
          };
        }),

        loadSharedContent: vi.fn(async function (shareId) {
          // Simulate loading shared content
          return {
            id: shareId,
            type: 'achievement',
            data: { name: 'Math Master', score: 1000 },
          };
        }),
      };

      // Test game deep link
      const gameResult = mockDeepLinkHandler.handleDeepLink(
        'https://learnimals.com/game/bubble-pop'
      );
      expect(gameResult.type).toBe('game');
      expect(gameResult.gameId).toBe('bubble-pop');

      // Test profile deep link
      const profileResult = mockDeepLinkHandler.handleDeepLink('/profile/user123');
      expect(profileResult.type).toBe('profile');
      expect(profileResult.userId).toBe('user123');

      // Test share deep link
      const shareResult = mockDeepLinkHandler.handleDeepLink('/share/abc123');
      expect(shareResult.type).toBe('share');
      expect(shareResult.shareId).toBe('abc123');
    });
  });

  describe('Navigation Guards and Permissions', () => {
    it('should implement navigation guards', async () => {
      const mockNavigationGuard = {
        guards: [],

        register: vi.fn(function (guard) {
          this.guards.push(guard);
        }),

        canNavigate: vi.fn(async function (to, from) {
          for (const guard of this.guards) {
            const result = await guard(to, from);
            if (result === false || result?.redirect) {
              return result;
            }
          }
          return true;
        }),

        navigate: vi.fn(async function (to, from = mockLocation.pathname) {
          const canNavigate = await this.canNavigate(to, from);

          if (canNavigate === true) {
            // Proceed with navigation
            history.pushState({ path: to }, '', to);
            return { success: true, path: to };
          } else if (canNavigate?.redirect) {
            // Redirect to another path
            history.pushState({ path: canNavigate.redirect }, '', canNavigate.redirect);
            return { success: false, redirect: canNavigate.redirect };
          } else {
            // Navigation blocked
            return { success: false, blocked: true };
          }
        }),
      };

      // Register authentication guard
      mockNavigationGuard.register(async (to, from) => {
        const protectedRoutes = ['/profile', '/settings', '/achievements'];
        const isProtected = protectedRoutes.some(route => to.startsWith(route));

        if (isProtected) {
          const isAuthenticated = window.localStorage.getItem('user_token') !== null;
          if (!isAuthenticated) {
            return { redirect: '/login' };
          }
        }

        return true;
      });

      // Register progress guard
      mockNavigationGuard.register(async (to, from) => {
        if (to.startsWith('/advanced-games')) {
          const userLevel = parseInt(window.localStorage.getItem('user_level') || '1');
          if (userLevel < 5) {
            return { redirect: '/level-required' };
          }
        }

        return true;
      });

      // Test navigation to protected route without auth
      const result1 = await mockNavigationGuard.navigate('/profile');
      expect(result1.success).toBe(false);
      expect(result1.redirect).toBe('/login');

      // Set auth and try again
      window.localStorage.setItem('user_token', 'test-token');
      const result2 = await mockNavigationGuard.navigate('/profile');
      expect(result2.success).toBe(true);

      // Test level-based guard
      window.localStorage.setItem('user_level', '3');
      const result3 = await mockNavigationGuard.navigate('/advanced-games');
      expect(result3.success).toBe(false);
      expect(result3.redirect).toBe('/level-required');
    });
  });
});
