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
  
  // Mock window.location (handle read-only and existing properties)
  try {
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
  } catch (e) {
    // If location already exists and can't be redefined, just modify properties
    if (window.location) {
      try {
        // Avoid setting href to prevent JSDOM navigation errors
        Object.defineProperty(window.location, 'hostname', { value: 'localhost', writable: true, configurable: true });
        Object.defineProperty(window.location, 'pathname', { value: '/', writable: true, configurable: true });
        Object.defineProperty(window.location, 'origin', { value: 'http://localhost:3000', writable: true, configurable: true });
        Object.defineProperty(window.location, 'protocol', { value: 'http:', writable: true, configurable: true });
        Object.defineProperty(window.location, 'port', { value: '3000', writable: true, configurable: true });
        Object.defineProperty(window.location, 'search', { value: '', writable: true, configurable: true });
        Object.defineProperty(window.location, 'hash', { value: '', writable: true, configurable: true });
        Object.defineProperty(window.location, 'assign', { value: vi.fn(), writable: true, configurable: true });
        Object.defineProperty(window.location, 'reload', { value: vi.fn(), writable: true, configurable: true });
        Object.defineProperty(window.location, 'replace', { value: vi.fn(), writable: true, configurable: true });
      } catch (assignError) {
        // If Object.assign fails, individual property assignment
        try {
          window.location.hostname = 'localhost';
          window.location.pathname = '/';
        } catch (propError) {
          // Some properties might be read-only, continue silently
        }
      }
    }
  }
  
  // Setup DOM environment
  document.body.innerHTML = '';
  
  // Mock document.currentScript for navbarLoader tests
  Object.defineProperty(document, 'currentScript', {
    value: {
      src: 'http://localhost:3000/src/components/layout/navbarLoader.js'
    },
    writable: true,
    configurable: true
  });
  
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
      
      // Mock navigation JavaScript files
      if (url.includes('navigationHelper.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('// Mock navigationHelper.js content\nclass NavigationHelper { constructor() {} }')
        });
      }
      
      if (url.includes('navbarLoader.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('// Mock navbarLoader.js content')
        });
      }
      
      if (url.includes('navigation.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('// Mock navigation.js content')
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
  if (document.body) {
    document.body.innerHTML = '';
  }
  if (document.head) {
    document.head.innerHTML = '';
  }
  
  // Reset localStorage (with null check)
  if (window.localStorage) {
    window.localStorage.clear();
  }
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }
  
  // Reset location
  window.location.pathname = '/';
  window.location.search = '';
  window.location.hash = '';
  
  // Create fresh navbar placeholder for each test
  if (document.createElement && document.body) {
    const navbarPlaceholder = document.createElement('div');
    navbarPlaceholder.id = 'navbar-placeholder';
    document.body.appendChild(navbarPlaceholder);
  }
  
  // Reset global state
  global.testState = {
    components: new Map(),
    mockData: new Map(),
    eventListeners: []
  };
});

afterEach(() => {
  // Clean up any remaining timers if they're mocked
  if (vi.isFakeTimers()) {
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
  }
  
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
  }
};

// Global test utilities for navigation testing
global.createMockNavbar = () => {
  return `
    <header class="navbar">
      <div class="navbar-logo">
        <a href="/src/pages/index.html">
          <img src="/public/images/logo.png" alt="Learnimals Logo" />
        </a>
      </div>
      <button id="mobile-menu" class="mobile-menu-button" aria-label="Toggle mobile menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="nav-menu" class="navbar-links" aria-label="Main navigation">
        <ul>
          <li><a href="/src/pages/index.html">Home</a></li>
          <li><a href="/src/pages/math.html">Math</a></li>
          <li><a href="/src/pages/science.html">Science</a></li>
          <li><a href="/src/pages/reading.html">Reading</a></li>
          <li><a href="/src/pages/art.html">Art</a></li>
          <li><a href="/src/pages/coding.html">Coding</a></li>
        </ul>
      </nav>
    </header>
  `;
};

// Add the remaining testUtils methods to the global.testUtils object
global.testUtils.simulateEvent = (element, eventType, options = {}) => {
    // Use document.createEvent for better jsdom compatibility
    const event = document.createEvent('Event');
    event.initEvent(eventType, true, true); // bubbles, cancelable
    
    // Add any additional options
    Object.assign(event, options);
    
    element.dispatchEvent(event);
    return event;
};
  
/**
 * Create test container
 */
global.testUtils.createTestContainer = (id = 'test-container') => {
    const container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
    return container;
};

/**
 * Mock component module with proper ES6/CommonJS compatibility
 */
global.testUtils.mockComponent = (componentPath, mockImplementation) => {
    return vi.doMock(componentPath, () => {
      const mock = typeof mockImplementation === 'function' 
        ? mockImplementation 
        : () => mockImplementation;
      
      return {
        default: mock,
        [componentPath.split('/').pop().replace('.js', '')]: mock
      };
    });
};

/**
 * Advance timers and flush promises
 */
global.testUtils.tick = async (ms = 0) => {
    if (ms > 0) {
      vi.advanceTimersByTime(ms);
    }
    await new Promise(resolve => setTimeout(resolve, 0));
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

// Mock navigation modules to prevent dynamic import timeouts
vi.mock('../../src/utils/navigationHelper.js', () => {
  class MockNavigationHelper {
    constructor() {
      this.baseUrl = 'http://localhost:3000';
      this.logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
    }

    resolveUrl(url) {
      if (url.startsWith('http')) return url;
      return `${this.baseUrl}/src/pages/${url}`;
    }

    updateNavigationLinks() {
      const links = document.querySelectorAll('#nav-menu a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
          link.setAttribute('href', this.resolveUrl(href));
        }
      });
    }

    highlightCurrentPage() {
      const currentPath = window.location.pathname;
      const links = document.querySelectorAll('#nav-menu a');
      links.forEach(link => {
        if (link.getAttribute('href')?.includes(currentPath)) {
          link.classList.add('active');
        }
      });
    }
  }

  // Set up global access
  if (typeof window !== 'undefined') {
    window.navigationHelper = new MockNavigationHelper();
  }

  return { default: MockNavigationHelper };
});

vi.mock('../../src/components/layout/navigation.js', () => {
  class MockNavigationComponent {
    constructor() {
      this.isInitialized = false;
      this.mobileMenuOpen = false;
      this.init();
    }

    init() {
      this.isInitialized = true;
      this.setupMobileMenu();
      this.setupEventListeners();
    }

    setupMobileMenu() {
      const mobileMenuButton = document.getElementById('mobile-menu');
      const navMenu = document.getElementById('nav-menu');
      
      if (mobileMenuButton && navMenu) {
        mobileMenuButton.addEventListener('click', () => {
          this.toggleMobileMenu();
        });
      }
    }

    setupEventListeners() {
      document.addEventListener('navbarLoaded', () => {
        this.init();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.mobileMenuOpen) {
          this.closeMobileMenu();
        }
      });

      document.addEventListener('click', (e) => {
        const navMenu = document.getElementById('nav-menu');
        const mobileMenuButton = document.getElementById('mobile-menu');
        
        if (this.mobileMenuOpen && navMenu && !navMenu.contains(e.target) && e.target !== mobileMenuButton) {
          this.closeMobileMenu();
        }
      });
    }

    toggleMobileMenu() {
      if (this.mobileMenuOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    }

    openMobileMenu() {
      const mobileMenuButton = document.getElementById('mobile-menu');
      const navMenu = document.getElementById('nav-menu');
      
      if (mobileMenuButton && navMenu) {
        this.mobileMenuOpen = true;
        navMenu.classList.add('active');
        mobileMenuButton.setAttribute('aria-expanded', 'true');
      }
    }

    closeMobileMenu() {
      const mobileMenuButton = document.getElementById('mobile-menu');
      const navMenu = document.getElementById('nav-menu');
      
      if (mobileMenuButton && navMenu) {
        this.mobileMenuOpen = false;
        navMenu.classList.remove('active');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      }
    }
  }

  // Auto-initialize
  let navigationComponent;

  function initNavigation() {
    if (!navigationComponent) {
      navigationComponent = new MockNavigationComponent();
    }
  }

  if (document.getElementById('mobile-menu')) {
    initNavigation();
  } else {
    document.addEventListener('navbarLoaded', initNavigation);
  }

  return { 
    default: MockNavigationComponent,
    NavigationComponent: MockNavigationComponent 
  };
});

vi.mock('../../src/components/layout/navbarLoader.js', () => {
  class MockNavbarLoader {
    constructor() {
      this.loaded = false;
      this.logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      };
    }

    async loadNavbar() {
      const placeholder = document.getElementById('navbar-placeholder');
      if (!placeholder) {
        this.logger.warn('Navbar placeholder not found');
        return;
      }

      const mockNavbarHtml = `
        <header class="navbar">
          <div class="navbar-logo">
            <a href="/src/pages/index.html">
              <img src="/public/images/logo.png" alt="Learnimals Logo" />
            </a>
          </div>
          <button id="mobile-menu" class="mobile-menu-button" aria-label="Toggle mobile menu" aria-expanded="false">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav id="nav-menu" class="navbar-links" aria-label="Main navigation">
            <ul>
              <li><a href="/src/pages/index.html">Home</a></li>
              <li><a href="/src/pages/math.html">Math</a></li>
              <li><a href="/src/pages/science.html">Science</a></li>
              <li><a href="/src/pages/reading.html">Reading</a></li>
              <li><a href="/src/pages/art.html">Art</a></li>
              <li><a href="/src/pages/coding.html">Coding</a></li>
            </ul>
          </nav>
        </header>
      `;

      placeholder.innerHTML = mockNavbarHtml;
      this.loaded = true;

      // Dispatch navbarLoaded event
      const event = document.createEvent('Event');
      event.initEvent('navbarLoaded', true, true);
      document.dispatchEvent(event);

      this.logger.info('Mock navbar loaded successfully');
    }

    resolveNavbarPath() {
      return '/src/components/layout/navbar.html';
    }
  }

  // Auto-load navbar when module loads
  const loader = new MockNavbarLoader();
  loader.loadNavbar();

  return { default: MockNavbarLoader };
});

// Export commonly used testing utilities
export {
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
};