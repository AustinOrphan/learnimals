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
    try {
      // Check if user has saved theme preferences
      const savedThemeName = localStorage?.getItem('learnimals-theme-name');
      const savedThemeMode = localStorage?.getItem('learnimals-theme-mode');
      
      // Set initial theme based on saved preferences or system preferences
      if (savedThemeName && this.themeColors[savedThemeName]) {
        this.currentTheme.name = savedThemeName;
        
        if (savedThemeMode && (savedThemeMode === 'light' || savedThemeMode === 'dark')) {
          this.currentTheme.mode = savedThemeMode;
        }
      } else {
        // Default theme name is 'default', check for system dark/light preference
        this.currentTheme.mode = getPreferredColorScheme();
      }
    } catch (error) {
      console.warn('Error loading theme preferences:', error);
      // Use defaults if localStorage access fails
      this.currentTheme.mode = getPreferredColorScheme();
    }
    
    // Apply the current theme
    this.applyCurrentTheme();
    
    // Listen for system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if user hasn't explicitly set a theme mode
        try {
          if (!localStorage?.getItem('learnimals-theme-mode')) {
            this.currentTheme.mode = e.matches ? 'dark' : 'light';
            this.applyCurrentTheme();
          }
        } catch (error) {
          console.warn('Error checking theme mode preference:', error);
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
    try {
      localStorage?.setItem('learnimals-theme-name', name);
      localStorage?.setItem('learnimals-theme-mode', mode);
    } catch (error) {
      console.warn('Error saving theme preferences:', error);
    }
    
    // Dispatch event for other components that need to react
    const event = new CustomEvent('themeChanged', { 
      detail: { 
        theme: this.currentTheme,
        themeName: name,
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
      try {
        localStorage?.setItem('learnimals-theme-name', themeName);
      } catch (error) {
        console.warn('Error saving theme name:', error);
      }
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
      try {
        localStorage?.setItem('learnimals-theme-mode', mode);
      } catch (error) {
        console.warn('Error saving theme mode:', error);
      }
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
  
  // Alias methods for backward compatibility with tests
  switchTheme(themeName) {
    return this.setTheme(themeName);
  }
  
  switchMode(mode) {
    return this.setMode(mode);
  }
  
  // Get theme definition
  getThemeDefinition(themeName) {
    return this.themeDefinitions[themeName] || null;
  }
  
  // Check if current mode is dark
  isDarkMode() {
    return this.currentTheme.mode === 'dark';
  }
  
  // Get theme colors
  getThemeColors(themeName) {
    return this.themeColors[themeName] || null;
  }
  
  // Get base colors for mode
  getBaseColors(mode) {
    return this.themeBaseColors[mode] || null;
  }
  
  // Reset theme to default
  resetTheme() {
    this.currentTheme.name = 'default';
    this.currentTheme.mode = 'light';
    try {
      localStorage?.removeItem('learnimals-theme-name');
      localStorage?.removeItem('learnimals-theme-mode');
    } catch (error) {
      console.warn('Error removing theme preferences:', error);
    }
    this.applyCurrentTheme();
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

// Add a global accessor for use in HTML
if (typeof window !== 'undefined') {
  window.themeManager = themeManager;
}

// Initialize theme on load - already handled in init() so this is redundant

export default ThemeManager;
export { themeManager };