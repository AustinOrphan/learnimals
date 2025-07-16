/**
 * Mock for src/components/layout/navbarLoader.js
 * Provides fast mock implementation for tests to prevent dynamic import timeouts
 */

import { vi } from 'vitest';

// Mock navbarLoader functionality
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

    // Use mock navbar HTML
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
    // Mock path resolution
    return '/src/components/layout/navbar.html';
  }
}

// Auto-load navbar when module loads
const loader = new MockNavbarLoader();
loader.loadNavbar();

export default MockNavbarLoader;