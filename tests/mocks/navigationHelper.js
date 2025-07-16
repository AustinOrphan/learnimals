/**
 * Mock for src/utils/navigationHelper.js
 * Provides fast mock implementation for tests to prevent dynamic import timeouts
 */

import { vi } from 'vitest';

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
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseUrl}/src/pages/${url}`;
  }

  updateNavigationLinks() {
    // Mock implementation - find and update nav links
    const links = document.querySelectorAll('#nav-menu a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        link.setAttribute('href', this.resolveUrl(href));
      }
    });
  }

  highlightCurrentPage() {
    // Mock implementation - highlight current page
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('#nav-menu a');
    links.forEach(link => {
      if (link.getAttribute('href')?.includes(currentPath)) {
        link.classList.add('active');
      }
    });
  }
}

// Set up global access for tests that expect it
if (typeof window !== 'undefined') {
  window.navigationHelper = new MockNavigationHelper();
}

export default MockNavigationHelper;