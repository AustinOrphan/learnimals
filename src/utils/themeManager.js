// Theme Manager for Learnimals
// Handles theme switching, persistence, and prefers-color-scheme detection
import { COMMON_COLORS, THEME_BASE_COLORS, THEME_COLORS, THEME_DEFINITIONS } from './themeRegistry.js';
import { applyColors, setSemanticVariables, updateMetaThemeColor, getPreferredColorScheme } from './themeManagerUtils.js';

class ThemeManager {
  constructor() {
    // Import theme definitions from the registry
    this.commonColors = COMMON_COLORS;
    this.themeBaseColors = THEME_BASE_COLORS;
    this.themeColors = THEME_COLORS;
    this.themeDefinitions = THEME_DEFINITIONS;

    
    // Current theme state
    this.currentTheme = {
      name: 'default',
      mode: 'light'
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    // Check if user has saved theme preferences
    const savedThemeName = localStorage.getItem('learnimals-theme-name');
    const savedThemeMode = localStorage.getItem('learnimals-theme-mode');
    
    // Set initial theme based on saved preferences or system preferences
    if (savedThemeName && this.themeColors[savedThemeName]) {
      this.currentTheme.name = savedThemeName;
      
      if (savedThemeMode && (savedThemeMode === 'light' || savedThemeMode === 'dark')) {
        this.currentTheme.mode = savedThemeMode;
      }    } else {
      // Default theme name is 'default', check for system dark/light preference
      this.currentTheme.mode = getPreferredColorScheme();
    }
    
    // Apply the current theme
    this.applyCurrentTheme();
    
    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if user hasn't explicitly set a theme mode
        if (!localStorage.getItem('learnimals-theme-mode')) {
          this.currentTheme.mode = e.matches ? 'dark' : 'light';
          this.applyCurrentTheme();
        }
      });
    }
  }
  applyCurrentTheme() {
    const { name, mode } = this.currentTheme;
    
    // First apply common colors
    applyColors(this.commonColors);
    
    // Then apply base theme colors
    if (this.themeBaseColors[name]) {
      applyColors(this.themeBaseColors[name]);
    }
    
    // Apply the specific theme mapping
    const themeColors = this.themeColors[name][mode];
    if (!themeColors) return;
    
    // Apply theme-specific CSS variables
    applyColors(themeColors);
    
    // Apply semantic variables for consistent component styling
    setSemanticVariables(mode);
    
    // Add theme classes to body element
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .replace(/theme-mode-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${name}`);
    document.body.classList.add(`theme-mode-${mode}`);
    
    // Set data-theme attribute for compatibility with existing CSS
    document.documentElement.setAttribute('data-theme', mode === 'dark' ? 'night' : name);
    
    // Save preferences to localStorage
    localStorage.setItem('learnimals-theme-name', name);
    localStorage.setItem('learnimals-theme-mode', mode);
    
    // Dispatch event for other components that need to react
    const event = new CustomEvent('themeChanged', { 
      detail: { 
        theme: name,
        mode: mode 
      } 
    });
    document.dispatchEvent(event);
    
    // Update theme meta tag for browser UI
    updateMetaThemeColor();
  }
  
  // Set theme name (color theme)
  setTheme(themeName) {
    if (this.themeColors[themeName]) {
      this.currentTheme.name = themeName;
      this.applyCurrentTheme();
      return true;
    }
    return false;
  }
  
  // Toggle between light and dark mode
  toggleMode() {
    this.currentTheme.mode = this.currentTheme.mode === 'light' ? 'dark' : 'light';
    this.applyCurrentTheme();
    return this.currentTheme.mode;
  }
  
  // Set specific mode
  setMode(mode) {
    if (mode === 'light' || mode === 'dark') {
      this.currentTheme.mode = mode;
      this.applyCurrentTheme();
      return true;
    }
    return false;
  }
  
  // Get current theme information
  getCurrentTheme() {
    return { ...this.currentTheme };
  }
  
  // Get list of available themes
  getAvailableThemes() {
    return Object.keys(this.themeColors);
  }
  
  // Register a new theme
  registerTheme(name, colorSet) {
    if (colorSet.light && colorSet.dark) {
      this.themeColors[name] = colorSet;
      return true;
    }
    return false;
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

// Add a global accessor for use in HTML
window.themeManager = themeManager;

// Initialize theme on load - already handled in init() so this is redundant

export default themeManager;