// Mobile Menu Handler
// Provides mobile menu toggle functionality for responsive navigation

class MobileMenuHandler {
  constructor() {
    this.menuButtonId = 'mobile-menu';
    this.navMenuId = 'nav-menu';
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupMobileMenu());
    } else {
      this.setupMobileMenu();
    }
  }

  setupMobileMenu() {
    const mobileMenuButton = document.getElementById(this.menuButtonId);
    const navMenu = document.getElementById(this.navMenuId);

    if (!mobileMenuButton || !navMenu) {
      console.warn('Mobile menu elements not found. Expected elements with IDs:', this.menuButtonId, this.navMenuId);
      return;
    }

    mobileMenuButton.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!mobileMenuButton.contains(event.target) && !navMenu.contains(event.target)) {
        this.closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    const mobileMenuButton = document.getElementById(this.menuButtonId);
    const navMenu = document.getElementById(this.navMenuId);

    if (!mobileMenuButton || !navMenu) {return;}

    // Toggle the active class on both elements
    navMenu.classList.toggle('active');
    mobileMenuButton.classList.toggle('active');

    // Update aria-expanded attribute for accessibility
    const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
    mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
  }

  closeMenu() {
    const mobileMenuButton = document.getElementById(this.menuButtonId);
    const navMenu = document.getElementById(this.navMenuId);

    if (!mobileMenuButton || !navMenu) {return;}

    // Remove active class from both elements
    navMenu.classList.remove('active');
    mobileMenuButton.classList.remove('active');

    // Update aria-expanded attribute
    mobileMenuButton.setAttribute('aria-expanded', 'false');
  }

  openMenu() {
    const mobileMenuButton = document.getElementById(this.menuButtonId);
    const navMenu = document.getElementById(this.navMenuId);

    if (!mobileMenuButton || !navMenu) {return;}

    // Add active class to both elements
    navMenu.classList.add('active');
    mobileMenuButton.classList.add('active');

    // Update aria-expanded attribute
    mobileMenuButton.setAttribute('aria-expanded', 'true');
  }
}

// Create and export the mobile menu handler instance
const mobileMenuHandler = new MobileMenuHandler();

// Make it globally accessible
if (typeof window !== 'undefined') {
  window.mobileMenuHandler = mobileMenuHandler;
}

export default mobileMenuHandler;