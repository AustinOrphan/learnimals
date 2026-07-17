// Navigation Helper for Learnimals
// Provides absolute URL resolution for navigation links

// Use shared logger factory created by navbarLoader.js
// Always use window.logger to avoid redeclaration errors
if (typeof window !== 'undefined' && !window.logger) {
  window.logger = window.createLogger
    ? window.createLogger('NavigationHelper')
    : {
      debug: (...args) => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log('[NavigationHelper DEBUG]', ...args);
        }
      },
      error: (...args) => console.error('[NavigationHelper ERROR]', ...args),
      warn: (...args) => console.warn('[NavigationHelper WARN]', ...args),
      info: (...args) => console.info('[NavigationHelper INFO]', ...args),
    };
}

class NavigationHelper {
  constructor() {
    this.baseUrl = this.detectBaseUrl();
    if (typeof window !== 'undefined' && window.logger) {
      window.logger.debug('Navigation Helper initialized with base URL:', this.baseUrl);
    }
  }

  detectBaseUrl() {
    // Get the current URL and find the project root
    const currentPath = window.location.pathname;

    // Find where 'learnimals' appears as a separate path segment
    const pathSegments = currentPath.split('/');
    const learnimalsSegmentIndex = pathSegments.findIndex(
      segment => segment.toLowerCase() === 'learnimals'
    );

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
    return this.getUrl(`src/features/subjects/${subject}/${subject}.html`);
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
      home: 'src/pages/index.html',
      about: 'src/pages/about.html',
      contact: 'src/pages/contact.html',
      profile: 'src/pages/profile.html',

      // Subjects
      math: 'src/features/subjects/math/math.html',
      science: 'src/features/subjects/science/science.html',
      reading: 'src/features/subjects/reading/reading.html',
      art: 'src/features/subjects/art/art.html',
      coding: 'src/features/subjects/coding/coding.html',
      bubblepop: 'src/features/subjects/shared/bubblepop.html',
    };

    // Update links with data-nav attributes
    document.querySelectorAll('[data-nav]').forEach(link => {
      const navKey = link.getAttribute('data-nav');
      if (linkMappings[navKey]) {
        link.href = this.getUrl(linkMappings[navKey]);
        if (typeof window !== 'undefined' && window.logger) {
          window.logger.debug(`Updated ${navKey} link to:`, link.href);
        }
      }
    });

    // Update images with data-img attributes
    document.querySelectorAll('[data-img]').forEach(img => {
      const imgKey = img.getAttribute('data-img');
      img.src = this.getImageUrl(imgKey);
      if (typeof window !== 'undefined' && window.logger) {
        window.logger.debug(`Updated ${imgKey} image to:`, img.src);
      }
    });
  }

  // Navigate to a page programmatically
  navigateTo(page) {
    const url = this.getSubjectUrl(page);
    if (typeof window !== 'undefined' && window.logger) {
      window.logger.debug(`Navigating to: ${url}`);
    }
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

// Make available for dynamic imports and browser compatibility
if (typeof window !== 'undefined') {
  window.NavigationHelper = NavigationHelper;
}
