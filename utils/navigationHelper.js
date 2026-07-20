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
    return this.getUrl(`pages/${pageName}.html`);
  }

  getSubjectUrl(subject) {
    return this.getUrl(`subjects/${subject}/`);
  }

  getImageUrl(imageName) {
    return this.getUrl(`public/images/${imageName}`);
  }

  getComponentUrl(componentName) {
    return this.getUrl(`components/layout/${componentName}.html`);
  }

  // Update all navigation links on the page
  updateNavigationLinks() {
    const linkMappings = {
      // Pages (homepage is the site root)
      home: '',
      about: 'pages/about.html',
      contact: 'pages/contact.html',
      profile: 'pages/profile.html',

      // Subjects (clean directory URLs, served by <subject>/index.html)
      math: 'subjects/math/',
      science: 'subjects/science/',
      reading: 'subjects/reading/',
      art: 'subjects/art/',
      coding: 'subjects/coding/',
      bubblepop: 'games/bubble-pop/',
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

// Dual-use: ES module (imported by tests + available for dynamic import) and
// browser global. It MUST be loaded via <script type="module"> in HTML — a
// classic <script> cannot parse the export below.
export default NavigationHelper;

if (typeof window !== 'undefined') {
  window.NavigationHelper = NavigationHelper;
}
