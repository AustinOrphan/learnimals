/**
 * Navbar Loader - Dual Mode (ES6 Module + Regular Script)
 * Dynamically loads navbar HTML and manages navigation integration
 * Works both as ES6 module and as regular script for backward compatibility
 */

// Inline logger implementation to avoid ES6 imports for backward compatibility
// This allows the file to be loaded as a regular script while also working as a module
const createInlineLogger = (prefix) => {
  // Use global logger if available, or attempt dynamic import for module usage
  const globalLogger = typeof window !== 'undefined' && window.logger;
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  if (globalLogger) {
    return {
      debug: (...args) => globalLogger.debug(`[${prefix}]`, ...args),
      error: (...args) => globalLogger.error(`[${prefix}]`, ...args),
      warn: (...args) => globalLogger.warn(`[${prefix}]`, ...args),
      info: (...args) => globalLogger.info(`[${prefix}]`, ...args),
    };
  }
  
  // Fallback logger for environments without global logger
  return {
    debug: (...args) => isDev && console.log(`[${prefix} DEBUG]`, ...args),
    error: (...args) => console.error(`[${prefix} ERROR]`, ...args),
    warn: (...args) => console.warn(`[${prefix} WARN]`, ...args),
    info: (...args) => console.info(`[${prefix} INFO]`, ...args),
  };
};

/**
 * Creates a logger factory for backward compatibility with non-module scripts
 * This is reused by other scripts like navigationHelper.js
 */
function createLoggerFactory() {
  if (typeof window !== 'undefined' && !window.createLogger) {
    window.createLogger = createInlineLogger;
  }
}

/**
 * Determines the navbar.html path using available methods
 * Works with both ES6 modules and regular scripts
 */
function getNavbarPath() {
  // Try document.currentScript first (works for regular scripts)
  if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
    const scriptPath = document.currentScript.src;
    const basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
    return basePath + '/navbar.html';
  }
  
  // For ES6 modules, check if import.meta is available
  try {
    if (import.meta && import.meta.url) {
      const moduleUrl = new URL(import.meta.url);
      const basePath = moduleUrl.pathname.substring(0, moduleUrl.pathname.lastIndexOf('/'));
      return `${moduleUrl.origin}${basePath}/navbar.html`;
    }
  } catch (e) {
    // import.meta not available, continue to fallback
  }
  
  // Fallback for test environments and edge cases
  // Assume we're in src/components/layout/ directory
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/learnimals/')) {
      const learnimalsIndex = currentPath.indexOf('/learnimals/');
      const basePath = currentPath.substring(0, learnimalsIndex + '/learnimals/'.length);
      return `${window.location.origin}${basePath}src/components/layout/navbar.html`;
    }
  }
  
  // Final fallback - use relative path from current location
  return './navbar.html';
}

/**
 * Loads navbar HTML and integrates with navigation system
 */
async function loadNavbar() {
  const navbarPath = getNavbarPath();
  const moduleLogger = createInlineLogger('NavbarLoader');
  
  try {
    const response = await fetch(navbarPath);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.text();
    const placeholder = document.getElementById('navbar-placeholder');
    
    if (placeholder) {
      placeholder.innerHTML = data;
      moduleLogger.debug('Navbar loaded successfully from:', navbarPath);
      
      // Update navigation links if navigation helper is available
      if (typeof window !== 'undefined' && window.navigationHelper) {
        window.navigationHelper.updateNavigationLinks();
      }
      
      // Dispatch event to let other scripts know navbar is loaded
      const navbarLoadedEvent = new CustomEvent('navbarLoaded');
      document.dispatchEvent(navbarLoadedEvent);
      
      return true;
    } else {
      moduleLogger.error('navbar-placeholder element not found');
      return false;
    }
  } catch (error) {
    moduleLogger.error('Failed to load navbar:', error);
    moduleLogger.error('Attempted to load from:', navbarPath);
    throw error;
  }
}

/**
 * Initialize navbar loader when DOM is ready
 * This provides backward compatibility for non-module usage
 */
function initializeNavbarLoader() {
  // Create logger factory for backward compatibility
  createLoggerFactory();
  
  // Load navbar when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
  } else {
    loadNavbar();
  }
}

// Auto-initialize when DOM is available (but not when running in Node.js)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeNavbarLoader();
}

// Make functions available globally for regular script usage
if (typeof window !== 'undefined') {
  window.NavbarLoader = {
    loadNavbar,
    createLoggerFactory,
    initializeNavbarLoader
  };
}

// For ES6 module compatibility (when imported)
// This approach allows the file to work both ways without syntax errors
if (typeof globalThis !== 'undefined') {
  globalThis.NavbarLoaderModule = {
    loadNavbar,
    createLoggerFactory,
    initializeNavbarLoader
  };
}
