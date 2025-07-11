/**
 * Test Setup for Learnimals
 * Global test configuration and mocks
 */

import { vi } from 'vitest';

// Mock global fetch for navigation tests
global.fetch = vi.fn();

// Mock DOM APIs that may not be available in test environment
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    pathname: '/src/pages/index.html',
    href: 'http://localhost:8080/src/pages/index.html',
    origin: 'http://localhost:8080'
  },
  writable: true
});

// Mock document.currentScript for navbarLoader tests
Object.defineProperty(document, 'currentScript', {
  value: {
    src: 'http://localhost:8080/src/components/layout/navbarLoader.js'
  },
  writable: true,
  configurable: true
});

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Clean up after each test
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset console mocks
  vi.clearAllMocks();
});

// Global test utilities
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
          <li><a href="/src/features/subjects/shared/math.html">Math</a></li>
          <li><a href="/src/features/subjects/shared/science.html">Science</a></li>
        </ul>
      </nav>
    </header>
  `;
};

global.createNavbarPlaceholder = () => {
  const placeholder = document.createElement('div');
  placeholder.id = 'navbar-placeholder';
  document.body.appendChild(placeholder);
  return placeholder;
};

// Mock file content fetching for tests that read actual files
global.mockFileContent = (filePath, content) => {
  fetch.mockImplementation((url) => {
    if (url.includes(filePath)) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content)
      });
    }
    // Default fallback for other URLs
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('')
    });
  });
};

// Setup default file content mocks for navigation files
global.setupNavigationFileMocks = () => {
  fetch.mockImplementation((url) => {
    if (url.includes('navbarLoader.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// Simple logger fallback for non-module script loading
const logger = {
  debug: (...args) => console.log('[NavbarLoader DEBUG]', ...args),
  error: (...args) => console.error('[NavbarLoader ERROR]', ...args)
};
// Rest of navbarLoader code without ES6 imports
        `)
      });
    }
    if (url.includes('navigationHelper.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// Simple logger fallback for non-module script loading
const logger = {
  debug: (...args) => console.log('[NavigationHelper DEBUG]', ...args),
  error: (...args) => console.error('[NavigationHelper ERROR]', ...args)
};
class NavigationHelper {
  // NavigationHelper code without ES6 imports
}
        `)
      });
    }
    if (url.includes('navigation.js')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`
// navigation.js content without ES6 imports
class NavigationComponent {
  // Navigation component code
}
        `)
      });
    }
    if (url.includes('navbar.html')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(global.createMockNavbar())
      });
    }
    // Default fallback
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('')
    });
  });
};