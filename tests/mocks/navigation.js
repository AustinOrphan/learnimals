/**
 * Mock for src/components/layout/navigation.js
 * Provides fast mock implementation for tests to prevent dynamic import timeouts
 */

import { vi } from 'vitest';

// Mock navigation functionality
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
    // Listen for navbar loaded event
    document.addEventListener('navbarLoaded', () => {
      this.init();
    });

    // Listen for escape key to close mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Close menu when clicking outside
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

// Auto-initialize when module loads
let navigationComponent;

function initNavigation() {
  if (!navigationComponent) {
    navigationComponent = new MockNavigationComponent();
  }
}

// Initialize immediately if navbar already exists, otherwise wait for event
if (document.getElementById('mobile-menu')) {
  initNavigation();
} else {
  document.addEventListener('navbarLoaded', initNavigation);
}

export default MockNavigationComponent;