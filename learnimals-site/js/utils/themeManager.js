// Theme Manager for Learnimals
// Handles theme switching, persistence, and prefers-color-scheme detection

class ThemeManager {
  constructor() {
    // Available themes
    this.themes = {
      default: {
        '--primary-color': '#00b894',
        '--secondary-color': '#0984e3',
        '--accent-color': '#ffeaa7',
        '--text-color': '#2d3436',
        '--background-color': '#fdf6e3'
      },
      ocean: {
        '--primary-color': '#0abde3',
        '--secondary-color': '#1B9CFC',
        '--accent-color': '#c8d6e5',
        '--text-color': '#222f3e',
        '--background-color': '#f1f2f6'
      },
      forest: {
        '--primary-color': '#6ab04c',
        '--secondary-color': '#badc58',
        '--accent-color': '#ffbe76',
        '--text-color': '#2c3e50',
        '--background-color': '#f5f5f0'
      },
      night: {
        '--primary-color': '#7ed6df',
        '--secondary-color': '#e056fd',
        '--accent-color': '#686de0',
        '--text-color': '#dfe6e9',
        '--background-color': '#222f3e'
      }
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('learnimals-theme');
    
    if (savedTheme && this.themes[savedTheme]) {
      this.applyTheme(savedTheme);
    } else {
      // Check for system dark/light preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.applyTheme('night');
      } else {
        this.applyTheme('default');
      }
    }
    
    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if user hasn't explicitly set a theme
        if (!localStorage.getItem('learnimals-theme')) {
          this.applyTheme(e.matches ? 'night' : 'default');
        }
      });
    }
  }
  
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;
    
    // Apply CSS variables to root element
    Object.keys(theme).forEach(property => {
      document.documentElement.style.setProperty(property, theme[property]);
    });
    
    // Add theme class to body element
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeName}`);
    
    // Save preference to localStorage
    localStorage.setItem('learnimals-theme', themeName);
    
    // Dispatch event for other components that need to react
    const event = new CustomEvent('themeChanged', { detail: { theme: themeName } });
    document.dispatchEvent(event);
    
    // Update theme meta tag for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme['--accent-color']);
    }
  }
  
  // Get current theme name
  getCurrentTheme() {
    return localStorage.getItem('learnimals-theme') || 'default';
  }
  
  // Get list of available themes
  getAvailableThemes() {
    return Object.keys(this.themes);
  }
  
  // Register a new theme
  registerTheme(name, colorSet) {
    this.themes[name] = colorSet;
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

// Add a global accessor for use in HTML
window.themeManager = themeManager;

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('learnimals-theme');
  if (savedTheme) {
    themeManager.applyTheme(savedTheme);
  }
});

export default themeManager;