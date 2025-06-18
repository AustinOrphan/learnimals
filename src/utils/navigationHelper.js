// Navigation Helper for Learnimals
// Provides absolute URL resolution for navigation links

class NavigationHelper {
  constructor() {
    this.baseUrl = this.detectBaseUrl();
    console.log('Navigation Helper initialized with base URL:', this.baseUrl);
  }

  detectBaseUrl() {
    // Get the current URL and find the project root
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    
    // Find where 'learnimals' appears in the path
    const learnimalsIndex = currentPath.toLowerCase().indexOf('learnimals');
    if (learnimalsIndex !== -1) {
      // Extract everything up to and including 'learnimals'
      const pathToLearnimals = currentPath.substring(0, currentPath.indexOf('learnimals') + 'learnimals'.length);
      return window.location.origin + pathToLearnimals;
    }
    
    // Fallback: assume we're in the project root
    return window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/');
  }

  // Get absolute URL for any path within the project
  getUrl(relativePath) {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return this.baseUrl + '/' + cleanPath;
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
        console.log(`Updated ${navKey} link to:`, link.href);
      }
    });

    // Update images with data-img attributes
    document.querySelectorAll('[data-img]').forEach(img => {
      const imgKey = img.getAttribute('data-img');
      img.src = this.getImageUrl(imgKey);
      console.log(`Updated ${imgKey} image to:`, img.src);
    });
  }

  // Navigate to a page programmatically
  navigateTo(page) {
    const url = this.getSubjectUrl(page);
    console.log(`Navigating to: ${url}`);
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

