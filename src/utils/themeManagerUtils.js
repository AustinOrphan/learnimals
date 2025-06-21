/**
 * Utility functions for theme management
 * Shared between ThemeManager and ThemeSwitcher
 */

/**
 * Helper function to apply theme colors to document root
 * @param {Object} colors - Object with CSS variable names and values
 */
export function applyColors(colors) {
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

/**
 * Set semantic UI variables based on theme mode
 * @param {string} mode - 'light' or 'dark'
 */
export function setSemanticVariables(mode) {
  // Set semantic UI variables for consistent component styling
  const semanticVars = {
    // Text colors
    '--text-primary': 'var(--text-color)',
    '--text-secondary': 'var(--text-color-secondary)',
    '--text-on-accent': mode === 'dark' ? 'var(--color-black)' : 'var(--color-white)',
    '--text-heading': 'var(--accent-color-opp)',
    
    // Background colors
    '--bg-body': 'var(--background-color)',
    '--bg-card': mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(255, 255, 255, 0.8)',
    '--bg-card-alt': mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.2)' 
      : 'rgba(0, 0, 0, 0.05)',
    '--bg-highlight': mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    
    // Accent colors
    '--accent-primary': 'var(--primary-color)',
    '--accent-secondary': 'var(--secondary-color)',
    '--accent-tertiary': 'var(--accent-color)',
    '--accent-color-alpha-30': mode === 'dark'
      ? 'rgba(255, 255, 255, 0.3)'
      : 'rgba(0, 0, 0, 0.3)',
    
    // Interactive states
    '--accent-primary-hover': mode === 'dark'
      ? 'color-mix(in srgb, var(--primary-color) 80%, white)'
      : 'color-mix(in srgb, var(--primary-color) 80%, black)',
    '--accent-secondary-hover': mode === 'dark'
      ? 'color-mix(in srgb, var(--secondary-color) 80%, white)'
      : 'color-mix(in srgb, var(--secondary-color) 80%, black)',
    
    // Border colors
    '--border-color': mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)',
    '--border-color-accent': 'var(--accent-color)',
    
    // Shadow
    '--shadow-color': mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.4)' 
      : 'rgba(0, 0, 0, 0.1)',
    '--shadow-color-strong': mode === 'dark'
      ? 'rgba(0, 0, 0, 0.7)'
      : 'rgba(0, 0, 0, 0.2)',
      
    // Focus
    '--focus-ring-color': 'var(--accent-primary)'
  };
  
  // Apply semantic variables
  applyColors(semanticVars);
}

/**
 * Update meta theme-color for browser UI
 */
export function updateMetaThemeColor() {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    // Use background color as theme color
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background-color')
      .trim();
    metaThemeColor.setAttribute('content', bgColor);
  }
}

/**
 * Get the system preferred color scheme
 * @returns {string} - 'dark' or 'light'
 */
export function getPreferredColorScheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
