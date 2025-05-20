// Theme Switcher Component for Learnimals
// This component creates a theme selection interface

class ThemeSwitcher {
  constructor() {
    this.themeButtonId = 'theme-switcher-button';
    this.themeMenuId = 'theme-menu';
    this.isMenuOpen = false;
    this.themeToggleBtn = document.getElementById('theme-toggle');
    
    // Only initialize if we're in a browser environment
    if (typeof window !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  init() {
    // Create the theme switcher UI
    this.createThemeSwitcherUI();
    
    // Set up the theme toggle button if it exists
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    // Add event listeners to the theme menu button
    const themeMenuBtn = document.getElementById(this.themeButtonId);
    if (themeMenuBtn) {
      themeMenuBtn.addEventListener('click', () => this.toggleMenu());
    }
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !e.target.closest(`#${this.themeMenuId}`) && 
          !e.target.closest(`#${this.themeButtonId}`)) {
        this.closeMenu();
      }
    });
    
    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
    
    // Update the active theme indicator
    this.updateActiveTheme();
    
    // Listen for theme changes from other sources
    document.addEventListener('themeChanged', () => this.updateActiveTheme());
  }
  
  createThemeSwitcherUI() {
    // Check if the container already exists
    if (document.querySelector('.theme-switcher-container')) {
      return; // Theme switcher UI already exists
    }
    
    // Create container for the theme switcher
    const container = document.createElement('div');
    container.className = 'theme-switcher-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '100';
    
    // Create the toggle button
    const button = document.createElement('button');
    button.id = this.themeButtonId;
    button.className = 'theme-switcher-button';
    button.setAttribute('aria-label', 'Change theme');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', this.themeMenuId);
    button.innerHTML = '<span class="theme-icon">🎨</span>';
    
    // Style the button
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '50%';
    button.style.border = 'none';
    button.style.background = 'var(--primary-color)';
    button.style.color = 'white';
    button.style.fontSize = '24px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)';
    button.style.transition = 'transform 0.2s';
    
    // Create the theme menu (hidden initially)
    const menu = document.createElement('div');
    menu.id = this.themeMenuId;
    menu.className = 'theme-menu';
    menu.setAttribute('aria-label', 'Theme selection menu');
    menu.setAttribute('role', 'menu');
    
    // Style the menu
    menu.style.position = 'absolute';
    menu.style.bottom = '60px';
    menu.style.right = '0';
    menu.style.background = 'white';
    menu.style.borderRadius = '10px';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    menu.style.display = 'none';
    menu.style.flexDirection = 'column';
    menu.style.gap = '8px';
    menu.style.minWidth = '150px';
    
    // Get themes from the theme manager
    let themes = ['default', 'ocean', 'forest', 'night'];
    try {
      if (window.themeManager && typeof window.themeManager.getAvailableThemes === 'function') {
        const managerThemes = window.themeManager.getAvailableThemes();
        if (Array.isArray(managerThemes) && managerThemes.length > 0) {
          themes = managerThemes;
        }
      }
    } catch (error) {
      console.warn('Error getting themes from theme manager:', error);
    }
    
    // Create a button for each theme
    themes.forEach(theme => {
      const themeButton = document.createElement('button');
      themeButton.className = 'theme-option';
      themeButton.setAttribute('data-theme', theme);
      themeButton.setAttribute('role', 'menuitem');
      
      // Get emoji for each theme
      const themeEmoji = this.getThemeEmoji(theme);
      
      themeButton.innerHTML = `${themeEmoji} <span>${this.capitalizeFirstLetter(theme)}</span>`;
      
      // Style the theme button
      themeButton.style.padding = '8px 12px';
      themeButton.style.border = 'none';
      themeButton.style.borderRadius = '6px';
      themeButton.style.textAlign = 'left';
      themeButton.style.background = 'transparent';
      themeButton.style.cursor = 'pointer';
      themeButton.style.display = 'flex';
      themeButton.style.alignItems = 'center';
      themeButton.style.gap = '8px';
      themeButton.style.width = '100%';
      themeButton.style.transition = 'background-color 0.2s';
      
      // Add event listener to change theme
      themeButton.addEventListener('click', () => {
        try {
          if (window.themeManager && typeof window.themeManager.applyTheme === 'function') {
            window.themeManager.applyTheme(theme);
          } else {
            // Fallback implementation
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('learnimals-theme', theme);
          }
        } catch (error) {
          console.warn('Error applying theme:', error);
        }
        this.closeMenu();
      });
      
      // Hover effect
      themeButton.addEventListener('mouseover', () => {
        themeButton.style.backgroundColor = '#f0f0f0';
      });
      
      themeButton.addEventListener('mouseout', () => {
        themeButton.style.backgroundColor = 'transparent';
      });
      
      menu.appendChild(themeButton);
    });
    
    // Add elements to the DOM
    container.appendChild(menu);
    container.appendChild(button);
    document.body.appendChild(container);
  }
  
  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
  
  openMenu() {
    const menu = document.getElementById(this.themeMenuId);
    const button = document.getElementById(this.themeButtonId);
    
    menu.style.display = 'flex';
    button.setAttribute('aria-expanded', 'true');
    button.style.transform = 'rotate(45deg)';
    this.isMenuOpen = true;
  }
  
  closeMenu() {
    const menu = document.getElementById(this.themeMenuId);
    const button = document.getElementById(this.themeButtonId);
    
    menu.style.display = 'none';
    button.setAttribute('aria-expanded', 'false');
    button.style.transform = 'rotate(0deg)';
    this.isMenuOpen = false;
  }
  
  updateActiveTheme() {
    let currentTheme = 'default';
    
    try {
      if (window.themeManager && typeof window.themeManager.getCurrentTheme === 'function') {
        currentTheme = window.themeManager.getCurrentTheme();
      } else {
        // Fallback: try to get theme from localStorage
        const savedTheme = localStorage.getItem('learnimals-theme');
        if (savedTheme) {
          currentTheme = savedTheme;
        }
      }
    } catch (error) {
      console.warn('Error getting current theme:', error);
    }
    
    const themeButtons = document.querySelectorAll('.theme-option');
    
    themeButtons.forEach(button => {
      const theme = button.getAttribute('data-theme');
      if (theme === currentTheme) {
        button.style.backgroundColor = '#e6f7ff';
        button.style.fontWeight = 'bold';
        button.setAttribute('aria-current', 'true');
      } else {
        button.style.backgroundColor = 'transparent';
        button.style.fontWeight = 'normal';
        button.removeAttribute('aria-current');
      }
    });
  }
  
  getThemeEmoji(theme) {
    const emojis = {
      'default': '☀️',
      'ocean': '🌊',
      'forest': '🌲',
      'night': '🌙'
    };
    
    return emojis[theme] || '🎨';
  }
  
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // Simple theme toggle functionality
  toggleTheme() {
    if (window.themeManager) {
      const currentTheme = window.themeManager.getCurrentTheme();
      const nextTheme = currentTheme === 'night' ? 'default' : 'night';
      window.themeManager.applyTheme(nextTheme);
    } else {
      document.body.classList.toggle('dark-theme');
    }
  }
}

// Create and export the theme switcher instance
const themeSwitcher = new ThemeSwitcher();

// Make it globally accessible
if (typeof window !== 'undefined') {
  window.themeSwitcher = themeSwitcher;
}

export default themeSwitcher;