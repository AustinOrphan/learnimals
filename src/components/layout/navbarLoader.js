// src/components/layout/navbarLoader.js
// Get the current script's path to determine the correct navbar.html location
import logger from '../../utils/logger.js';

const {currentScript} = document;
const scriptPath = currentScript.src;
const basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
const navbarPath = `${basePath  }/navbar.html`;

fetch(navbarPath)
  .then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.text();
  })
  .then((data) => {
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
  .catch((error) => {
    logger.error('Failed to load navbar:', error);
    logger.error('Attempted to load from:', navbarPath);
  });
