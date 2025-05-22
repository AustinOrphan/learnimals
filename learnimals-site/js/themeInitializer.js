// Theme Initializer for Learnimals
// This script initializes theme support and ensures consistency across pages
import { getPreferredColorScheme } from './utils/themeManagerUtils.js';

(function() {
  // Check if theme preferences are stored in localStorage
  const savedThemeName = localStorage.getItem('learnimals-theme-name');
  const savedThemeMode = localStorage.getItem('learnimals-theme-mode');
  
  // Apply the saved theme immediately to prevent flash of unstyled content
  if (savedThemeName) {
    document.documentElement.setAttribute('data-theme-name', savedThemeName);
  }
  
  // Apply the saved mode or use system preference
  if (savedThemeMode) {
    document.documentElement.setAttribute('data-theme', savedThemeMode === 'dark' ? 'night' : savedThemeName);
  } else {
    // Check for system preference if no saved mode
    const preferredMode = getPreferredColorScheme();
    if (preferredMode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'night');
      localStorage.setItem('learnimals-theme-mode', 'dark');
    }
  }
  
  // Function to toggle between light and dark theme
  function toggleMode() {
    // Use themeSwitcher if available (preferred method)
    if (window.themeSwitcher && typeof window.themeSwitcher.toggleTheme === 'function') {
      window.themeSwitcher.toggleTheme();
      return;
    }
    
    // Use themeManager if available, otherwise fallback to basic toggle
    if (window.themeManager && typeof window.themeManager.toggleMode === 'function') {
      window.themeManager.toggleMode();
      return;
    }
    
    // Fallback toggle implementation
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    const newMode = currentTheme === 'night' ? 'light' : 'dark';
    const newTheme = newMode === 'dark' ? 'night' : (savedThemeName || 'default');
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save preference
    localStorage.setItem('learnimals-theme-mode', newMode);
    
    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        newMode === 'dark' ? '#222f3e' : '#ffeaa7'
      );
    }
    
    // Dispatch event for other components
    const event = new CustomEvent('themeChanged', { 
      detail: { 
        theme: savedThemeName || 'default',
        mode: newMode
      } 
    });
    document.dispatchEvent(event);
  }
  
  // Theme toggle buttons in footers have been removed
  // All theme toggling is now handled by themeSwitcher component
  document.addEventListener('DOMContentLoaded', function() {
    // No need to initialize theme toggle buttons anymore as they've been removed from footers
    // The themeSwitcher component will handle all theme switching functionality
  });
  
  // Export for module usage
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { toggleMode };
  } else {
    window.themeInitializer = { toggleMode };
  }
})();