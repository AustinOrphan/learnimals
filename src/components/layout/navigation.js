// Navigation Component for Learnimals
// This script handles the responsive mobile menu functionality

class NavigationComponent {
  constructor() {
    this.mobileMenuButton = document.getElementById('mobile-menu');
    this.navMenu = document.getElementById('nav-menu');
    this.menuOpen = false;

    // Only initialize if elements exist
    if (this.mobileMenuButton && this.navMenu) {
      this.init();
    } else {
      console.warn('Navigation elements not found. Menu functionality disabled.');
    }
  }

  init() {
    // Set ARIA attributes on load
    this.mobileMenuButton.setAttribute('aria-expanded', 'false');
    this.mobileMenuButton.setAttribute('aria-controls', 'nav-menu');

    // Add the event listener for mobile menu toggle
    this.mobileMenuButton.addEventListener('click', () => this.toggleMenu());

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.menuOpen &&
          !this.navMenu.contains(e.target) &&
          !this.mobileMenuButton.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Add keyboard accessibility
    this.addKeyboardSupport();

    // Set current page in navigation
    this.highlightCurrentPage();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.navMenu.classList.toggle('active');
    this.mobileMenuButton.classList.toggle('active');
    this.mobileMenuButton.setAttribute('aria-expanded', this.menuOpen ? 'true' : 'false');
  }

  closeMenu() {
    this.menuOpen = false;
    this.navMenu.classList.remove('active');
    this.mobileMenuButton.classList.remove('active');
    this.mobileMenuButton.setAttribute('aria-expanded', 'false');
  }

  addKeyboardSupport() {
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuOpen) {
        this.closeMenu();
      }
    });

    // Make menu items accessible with keyboard
    const menuLinks = this.navMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('keydown', (e) => {
        // Close menu on enter or space when link is focused
        if ((e.key === 'Enter' || e.key === ' ') && window.innerWidth <= 768) {
          setTimeout(() => this.closeMenu(), 100);
        }
      });
    });
  }

  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const menuLinks = this.navMenu.querySelectorAll('a');

    menuLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      // Check if the current path ends with the link path
      // or if we're on index.html and the link is to the home page
      const isCurrentPage =
        currentPath.endsWith(linkPath) ||
        (currentPath.endsWith('/') && linkPath === 'index.html') ||
        (currentPath.endsWith('index.html') && linkPath === 'index.html');

      if (isCurrentPage) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('current-page');
      }
    });
  }
}

// Initialize the navigation when both DOM and navbar are loaded
function initializeNavigation() {
  const navComponent = new NavigationComponent();

  // Make the navigation component globally accessible
  window.navComponent = navComponent;
}

// Check if navbar is already loaded or wait for it
function waitForNavbar() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    // Navbar already exists, initialize immediately
    initializeNavigation();
  } else {
    // Wait for navbar to be loaded
    document.addEventListener('navbarLoaded', initializeNavigation, { once: true });
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForNavbar);
} else {
  // DOM already loaded
  waitForNavbar();
}