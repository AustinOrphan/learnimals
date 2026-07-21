// components/layout/navbarLoader.js
// Get the current script's path to determine the correct navbar.html location

// Simple logger fallback for non-module script loading.
// This factory will be reused by other scripts like navigationHelper.js.
if (!window.createLogger) {
  window.createLogger = prefix => {
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return {
      debug: (...args) => isDev && console.log(`[${prefix} DEBUG]`, ...args),
      error: (...args) => console.error(`[${prefix} ERROR]`, ...args),
      warn: (...args) => console.warn(`[${prefix} WARN]`, ...args),
      info: (...args) => console.info(`[${prefix} INFO]`, ...args),
    };
  };
}
const logger = window.createLogger('NavbarLoader');

const currentScript = document.currentScript;
const scriptPath = currentScript ? currentScript.src : '';
const basePath = scriptPath
  ? scriptPath.substring(0, scriptPath.lastIndexOf('/'))
  : '/components/layout';
const navbarPath = basePath + '/navbar.html';

// Wire the mobile hamburger toggle. Idempotent: sets a data flag so it never
// binds twice, even if navigation.js is also present on the page (that script
// checks the same flag and skips its own hamburger setup).
function wireMobileMenu() {
  const button = document.getElementById('mobile-menu');
  const navMenu = document.getElementById('nav-menu');
  if (!button || !navMenu || button.dataset.menuBound === '1') {
    return;
  }
  button.dataset.menuBound = '1';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'nav-menu');

  const close = () => {
    navMenu.classList.remove('active');
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', event => {
    event.stopPropagation();
    const open = navMenu.classList.toggle('active');
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close when tapping outside the menu, or pressing Escape.
  document.addEventListener('click', event => {
    if (!navMenu.contains(event.target) && !button.contains(event.target)) {
      close();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      close();
    }
  });

  // Close after choosing a destination on mobile.
  navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
}

fetch(navbarPath)
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.text();
  })
  .then(data => {
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
      placeholder.innerHTML = data;
      logger.debug('Navbar loaded successfully from:', navbarPath);

      // Wire the mobile hamburger menu right here, so it works on EVERY page
      // that loads the shared navbar — not only the handful that also happen to
      // include navigation.js. The navbar is injected asynchronously, so a
      // handler bound on DOMContentLoaded would run before this element exists.
      wireMobileMenu();

      // Update navigation links if navigation helper is available
      if (window.navigationHelper) {
        window.navigationHelper.updateNavigationLinks();
      }

      // Dispatch event to let other scripts know navbar is loaded
      const navbarLoadedEvent = new CustomEvent('navbarLoaded');
      document.dispatchEvent(navbarLoadedEvent);
    } else {
      logger.error('navbar-placeholder element not found');
    }
  })
  .catch(error => {
    logger.error('Failed to load navbar:', error);
    logger.error('Attempted to load from:', navbarPath);
  });
