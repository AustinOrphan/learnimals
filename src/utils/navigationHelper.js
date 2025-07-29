// Navigation Helper for Learnimals
// Provides absolute URL resolution for navigation links

// Inline logger fallback for compatibility with regular script loading
// This avoids ES6 imports which would break non-module script usage
const createInlineLogger = (prefix) => {
  // Use global logger if available, fallback to console
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
  
  // Fallback for environments without global logger
  return {
    debug: (...args) => isDev && console.log(`[${prefix} DEBUG]`, ...args),
    error: (...args) => console.error(`[${prefix} ERROR]`, ...args),
    warn: (...args) => console.warn(`[${prefix} WARN]`, ...args),
    info: (...args) => console.info(`[${prefix} INFO]`, ...args),
  };
};

// Use shared logger factory created by navbarLoader.js, or fallback to inline logger
const logger = (typeof window !== 'undefined' && window.createLogger) 
  ? window.createLogger('NavigationHelper') 
  : createInlineLogger('NavigationHelper');

class NavigationHelper {
  constructor() {
    this.baseUrl = this.detectBaseUrl();
    logger.debug('Navigation Helper initialized with base URL:', this.baseUrl);
  }

  detectBaseUrl() {
    // Get the current URL and find the project root  
    const currentPath = window.location.pathname;
    
    // Find where 'learnimals' appears as a separate path segment
    const pathSegments = currentPath.split('/');
    const learnimalsSegmentIndex = pathSegments.findIndex(segment => segment.toLowerCase() === 'learnimals');
    
    if (learnimalsSegmentIndex !== -1) {
      // Extract everything up to and including 'learnimals'
      const pathToLearnimals = pathSegments.slice(0, learnimalsSegmentIndex + 1).join('/');
      return window.location.origin + pathToLearnimals;
    }
    
    // Fallback: return just the origin when learnimals not found in path
    return window.location.origin;
  }

  // Get absolute URL for any path within the project
  getUrl(relativePath) {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return this.baseUrl + '/' + cleanPath;
  }

  // Alias for getUrl (used by tests)
  resolveUrl(relativePath) {
    return this.getUrl(relativePath);
  }

  // Navigation shortcuts
  getPageUrl(pageName) {
    return this.getUrl(`src/pages/${pageName}.html`);
  }

  getSubjectUrl(subject) {
    return this.getUrl(`src/features/subjects/shared/${subject}.html`);
  }

  getImageUrl(imageName) {
    return this.getUrl(`public/images/${imageName}`);
  }

  getComponentUrl(componentName) {
    return this.getUrl(`src/components/layout/${componentName}.html`);
  }

  // Update all navigation links on the page
  updateNavigationLinks() {
    const linkMappings = {
      // Pages
      'home': 'src/pages/index.html',
      'about': 'src/pages/about.html',
      'contact': 'src/pages/contact.html',
      'profile': 'src/pages/profile.html',
      
      // Subjects
      'math': 'src/features/subjects/shared/math.html',
      'science': 'src/features/subjects/shared/science.html',
      'reading': 'src/features/subjects/shared/reading.html',
      'art': 'src/features/subjects/shared/art.html',
      'coding': 'src/features/subjects/shared/coding.html',
      'bubblepop': 'src/features/subjects/shared/bubblepop.html'
    };

    // Update links with data-nav attributes
    document.querySelectorAll('[data-nav]').forEach(link => {
      const navKey = link.getAttribute('data-nav');
      if (linkMappings[navKey]) {
        link.href = this.getUrl(linkMappings[navKey]);
        logger.debug(`Updated ${navKey} link to:`, link.href);
      }
    });

    // Update images with data-img attributes
    document.querySelectorAll('[data-img]').forEach(img => {
      const imgKey = img.getAttribute('data-img');
      img.src = this.getImageUrl(imgKey);
      logger.debug(`Updated ${imgKey} image to:`, img.src);
    });
  }

  // Navigate to a page programmatically
  navigateTo(page) {
    const url = this.getSubjectUrl(page);
    logger.debug(`Navigating to: ${url}`);
    window.location.href = url;
  }

  // Check if a URL is accessible
  async checkUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.navigationHelper = new NavigationHelper();
  
  // Auto-update navigation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.navigationHelper.updateNavigationLinks();
    });
  } else {
    window.navigationHelper.updateNavigationLinks();
  }
}

// Export for ES6 modules and testing
export default NavigationHelper;

// Make available for dynamic imports
if (typeof window !== 'undefined') {
  window.NavigationHelper = NavigationHelper;
}

