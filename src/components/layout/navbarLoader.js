// src/components/layout/navbarLoader.js
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
  : '/src/components/layout';
const navbarPath = basePath + '/navbar.html';

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
