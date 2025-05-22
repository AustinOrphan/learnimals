// Theme Test Page JavaScript
// Shows current theme and semantic variables

document.addEventListener('DOMContentLoaded', function() {
  updateThemeDisplay();
  
  // Listen for theme changes
  document.addEventListener('themeChanged', function(event) {
    updateThemeDisplay();
  });
});

// Update the theme info display
function updateThemeDisplay() {
  const themeElement = document.getElementById('current-theme');
  const modeElement = document.getElementById('current-mode');
  
  if (!themeElement || !modeElement) return;
  
  let theme = 'default';
  let mode = 'light';
  
  // Get theme info from themeManager if available
  if (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function') {
    const currentTheme = window.themeManager.getCurrentTheme();
    theme = currentTheme.name;
    mode = currentTheme.mode;
  } else {
    // Fallback to data attributes
    theme = document.documentElement.getAttribute('data-theme-name') || 'default';
    mode = document.documentElement.getAttribute('data-theme') === 'night' ? 'dark' : 'light';
  }
  
  // Update display
  themeElement.textContent = `Current Theme: ${theme}`;
  modeElement.textContent = `Current Mode: ${mode}`;
  
  // Add theme name as a class for styling
  themeElement.className = `theme-name theme-${theme}`;
  modeElement.className = `theme-mode theme-mode-${mode}`;
}
