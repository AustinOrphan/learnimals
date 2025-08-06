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
/**
 * Set semantic UI variables based on theme mode with enhanced token support
 * Integrates with the expanded semantic token system from semantic-tokens.css
 * @param {string} mode - 'light' or 'dark'
 * @param {string} themeName - Optional theme name for variant tokens
 */
export function setSemanticVariables(mode, themeName = null) {
  // Get enhanced theme service if available
  const themeService = window.themeService;
  
  // Enhanced semantic variables for comprehensive token support
  const semanticVars = {
    // Text color tokens (enhanced hierarchy)
    '--text-primary': mode === 'dark' ? 'var(--color-gray-100)' : 'var(--color-gray-900)',
    '--text-secondary': mode === 'dark' ? 'var(--color-gray-300)' : 'var(--color-gray-600)',
    '--text-tertiary': mode === 'dark' ? 'var(--color-gray-400)' : 'var(--color-gray-500)',
    '--text-muted': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-400)',
    '--text-disabled': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-300)',
    '--text-heading': mode === 'dark' ? 'var(--color-gray-50)' : 'var(--accent-color-opp)',
    '--text-subheading': mode === 'dark' ? 'var(--color-gray-200)' : 'var(--color-gray-700)',
    '--text-body': mode === 'dark' ? 'var(--color-gray-100)' : 'var(--text-color)',
    '--text-caption': mode === 'dark' ? 'var(--color-gray-400)' : 'var(--color-gray-500)',
    '--text-label': mode === 'dark' ? 'var(--color-gray-200)' : 'var(--color-gray-700)',
    '--text-placeholder': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-400)',

    // Text contrast tokens
    '--text-on-light': 'var(--color-gray-900)',
    '--text-on-dark': 'var(--color-gray-50)',
    '--text-on-primary': 'var(--color-white)',
    '--text-on-secondary': 'var(--color-white)',
    '--text-on-accent': mode === 'dark' ? 'var(--color-black)' : 'var(--color-white)',

    // Surface and background tokens (enhanced)
    '--surface-primary': mode === 'dark' ? 'var(--color-gray-900)' : 'var(--background-color)',
    '--surface-secondary': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--surface-tertiary': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-100)',
    '--surface-inverse': mode === 'dark' ? 'var(--color-white)' : 'var(--color-gray-900)',
    '--surface-elevated': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-white)',
    
    // Background aliases for backward compatibility
    '--bg-body': mode === 'dark' ? 'var(--color-gray-900)' : 'var(--background-color)',
    '--bg-card': mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
    '--bg-card-alt': mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    '--bg-panel': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--bg-sidebar': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--bg-header': mode === 'dark' ? 'var(--color-gray-900)' : 'var(--color-white)',
    '--bg-footer': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--bg-highlight': mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',

    // Interactive state tokens (enhanced)
    '--interactive-primary': 'var(--primary-color)',
    '--interactive-primary-hover': mode === 'dark'
      ? 'color-mix(in srgb, var(--primary-color) 80%, white)'
      : 'color-mix(in srgb, var(--primary-color) 80%, black)',
    '--interactive-primary-active': mode === 'dark'
      ? 'color-mix(in srgb, var(--primary-color) 60%, white)'
      : 'color-mix(in srgb, var(--primary-color) 60%, black)',
    '--interactive-secondary': 'var(--secondary-color)',
    '--interactive-secondary-hover': mode === 'dark'
      ? 'color-mix(in srgb, var(--secondary-color) 80%, white)'
      : 'color-mix(in srgb, var(--secondary-color) 80%, black)',
    
    // Interactive background tokens
    '--interactive-bg': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-white)',
    '--interactive-bg-hover': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-50)',
    '--interactive-bg-active': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-100)',
    '--interactive-bg-selected': 'var(--primary-color)',
    '--interactive-bg-focus': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-50)',

    // Accent color tokens
    '--accent-primary': 'var(--primary-color)',
    '--accent-primary-hover': 'var(--interactive-primary-hover)',
    '--accent-secondary': 'var(--secondary-color)',
    '--accent-tertiary': 'var(--accent-color)',
    '--accent-color-alpha-30': mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',

    // Status color tokens (enhanced for dark mode)
    '--status-success': mode === 'dark' ? '#4ade80' : '#22c55e',
    '--status-warning': mode === 'dark' ? '#fbbf24' : '#f59e0b',
    '--status-error': mode === 'dark' ? '#f87171' : '#ef4444',
    '--status-info': mode === 'dark' ? '#60a5fa' : '#3b82f6',
    
    // Status background tokens
    '--status-success-bg': mode === 'dark' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)',
    '--status-warning-bg': mode === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)',
    '--status-error-bg': mode === 'dark' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    '--status-info-bg': mode === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    
    // Legacy status aliases
    '--success-color': mode === 'dark' ? '#4ade80' : '#22c55e',
    '--error-color': mode === 'dark' ? '#f87171' : '#ef4444',
    '--text-danger': mode === 'dark' ? '#f87171' : '#dc2626',

    // Border color tokens (enhanced)
    '--border-primary': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-200)',
    '--border-secondary': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-100)',
    '--border-strong': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-400)',
    '--border-subtle': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--border-hover': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-300)',
    '--border-active': mode === 'dark' ? 'var(--color-gray-400)' : 'var(--color-gray-400)',
    '--border-focus': 'var(--primary-color)',
    '--border-selected': 'var(--primary-color)',
    
    // Legacy border aliases
    '--border-color': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-200)',
    '--border-color-light': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-100)',
    '--border-color-accent': 'var(--accent-color)',

    // Shadow and elevation tokens
    '--shadow-color': mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
    '--shadow-color-strong': mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.2)',

    // Focus and accessibility tokens
    '--focus-ring-color': 'var(--accent-primary)',
    '--focus-primary': 'var(--primary-color)',
    '--focus-outline': '2px solid var(--primary-color)',
    '--focus-outline-offset': '2px',

    // Navigation tokens
    '--nav-bg': mode === 'dark' ? 'var(--color-gray-900)' : 'var(--color-white)',
    '--nav-text': mode === 'dark' ? 'var(--color-gray-100)' : 'var(--color-gray-900)',
    '--nav-text-hover': mode === 'dark' ? 'var(--color-gray-50)' : 'var(--color-gray-700)',
    '--nav-text-current': 'var(--color-white)',
    '--nav-item-bg-hover': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-50)',
    '--nav-item-bg-active': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-100)',

    // Form and input tokens
    '--input-bg': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-white)',
    '--input-bg-hover': mode === 'dark' ? 'var(--color-gray-700)' : 'var(--color-gray-50)',
    '--input-bg-focus': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-white)',
    '--input-bg-disabled': mode === 'dark' ? 'var(--color-gray-800)' : 'var(--color-gray-50)',
    '--input-text': mode === 'dark' ? 'var(--color-gray-100)' : 'var(--color-gray-900)',
    '--input-text-placeholder': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-400)',
    '--input-border': mode === 'dark' ? 'var(--color-gray-600)' : 'var(--color-gray-200)',
    '--input-border-hover': mode === 'dark' ? 'var(--color-gray-500)' : 'var(--color-gray-300)',
    '--input-border-focus': 'var(--primary-color)',

    // Button tokens
    '--button-primary': 'var(--interactive-primary)',
    '--button-primary-hover': 'var(--interactive-primary-hover)',
    '--button-secondary': 'var(--interactive-secondary)',
    '--button-secondary-hover': 'var(--interactive-secondary-hover)'
  };

  // Apply semantic variables
  applyColors(semanticVars);

  // Apply theme variant tokens if theme service is available and theme is specified
  if (themeService && themeName && typeof themeService.applyThemeVariantTokens === 'function') {
    try {
      themeService.applyThemeVariantTokens(themeName, mode);
    } catch (error) {
      console.warn('Failed to apply theme variant tokens:', error);
    }
  }

  // Update CSS custom properties for theme-specific tokens based on theme name
  if (themeName) {
    updateThemeSpecificTokens(themeName, mode);
  }
}

/**
 * Update theme-specific tokens for enhanced theme variants
 * @param {string} themeName - Theme name (ocean, forest, space, etc.)
 * @param {string} mode - Theme mode (light, dark)
 */
function updateThemeSpecificTokens(themeName, mode) {
  const themeSpecificTokens = {};

  // Apply theme-specific brand tokens
  switch (themeName) {
    case 'ocean':
      Object.assign(themeSpecificTokens, {
        '--brand-primary': '#4a90e2',
        '--brand-secondary': '#357abd',
        '--character-math-bear': '#4a90e2',
        '--theme-ocean-bg': 'linear-gradient(135deg, #4a90e2, #357abd)',
        '--text-on-ocean': '#ffffff',
        '--text-on-ocean-secondary': 'rgba(255, 255, 255, 0.9)'
      });
      break;
      
    case 'forest':
      Object.assign(themeSpecificTokens, {
        '--brand-primary': '#5cb85c',
        '--brand-secondary': '#449d44', 
        '--character-science-fox': '#5cb85c',
        '--theme-forest-bg': 'linear-gradient(135deg, #5cb85c, #449d44)',
        '--text-on-forest': '#ffffff',
        '--text-on-forest-secondary': 'rgba(255, 255, 255, 0.9)'
      });
      break;
      
    case 'space':
      Object.assign(themeSpecificTokens, {
        '--brand-primary': '#6f42c1',
        '--brand-secondary': '#5a32a3',
        '--character-reading-owl': '#6f42c1', 
        '--theme-space-bg': 'linear-gradient(135deg, #6f42c1, #5a32a3)',
        '--text-on-space': '#ffffff',
        '--text-on-space-secondary': 'rgba(255, 255, 255, 0.9)'
      });
      break;
      
    case 'sunset':
      Object.assign(themeSpecificTokens, {
        '--brand-primary': '#fd7e14',
        '--brand-secondary': '#e55a00',
        '--character-art-cat': '#fd7e14',
        '--theme-sunset-bg': 'linear-gradient(135deg, #fd7e14, #e55a00)'
      });
      break;
  }

  // Apply theme-specific tokens if any were defined
  if (Object.keys(themeSpecificTokens).length > 0) {
    applyColors(themeSpecificTokens);
  }
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
