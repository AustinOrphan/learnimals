// Theme Initializer for Learnimals
// This script initializes theme support and ensures consistency across pages

(function() {
  // Check if a theme is stored in localStorage
  const savedTheme = localStorage.getItem('learnimals-theme');
  
  // Apply the saved theme immediately to prevent flash of unstyled content
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Check for system preference if no saved theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'night');
    }
  }
  
  // Function to toggle between light and dark theme
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
    const newTheme = currentTheme === 'night' ? 'default' : 'night';
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save preference
    localStorage.setItem('learnimals-theme', newTheme);
    
    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        newTheme === 'night' ? '#222f3e' : '#ffeaa7'
      );
    }
    
    // Dispatch event for other components
    const event = new CustomEvent('themeChanged', { 
      detail: { theme: newTheme } 
    });
    document.dispatchEvent(event);
  }
  
  // Initialize theme toggle buttons when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggleButtons = document.querySelectorAll('#theme-toggle');
    
    themeToggleButtons.forEach(button => {
      button.addEventListener('click', toggleTheme);
      
      // Update button text based on current theme
      const currentTheme = document.documentElement.getAttribute('data-theme');
      button.textContent = currentTheme === 'night' ? '☀️ Light' : '🌙 Dark';
      
      // Add ARIA attributes
      button.setAttribute('aria-label', `Switch to ${currentTheme === 'night' ? 'light' : 'dark'} mode`);
    });
    
    // Listen for theme changes from other sources
    document.addEventListener('themeChanged', function(e) {
      themeToggleButtons.forEach(button => {
        button.textContent = e.detail.theme === 'night' ? '☀️ Light' : '🌙 Dark';
        button.setAttribute('aria-label', `Switch to ${e.detail.theme === 'night' ? 'light' : 'dark'} mode`);
      });
    });
  });
  
  // Export for module usage
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { toggleTheme };
  } else {
    window.themeInitializer = { toggleTheme };
  }
})();