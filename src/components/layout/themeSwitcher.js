// Theme Switcher Component for Learnimals
// This component creates a theme selection interface
import { THEME_DEFINITIONS } from '../../utils/themeRegistry.js';
import logger from '../../utils/logger.js';

class ThemeSwitcher {
  constructor() {
    this.themeButtonId = 'theme-switcher-button';
    this.themeMenuId = 'theme-menu';
    this.modeToggleId = 'mode-toggle-button';
    this.isMenuOpen = false;

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

    // Add event listeners to the theme menu button
    const themeMenuBtn = document.getElementById(this.themeButtonId);
    if (themeMenuBtn) {
      themeMenuBtn.addEventListener('click', () => this.toggleMenu());
    }

    // Close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (
        this.isMenuOpen &&
        !e.target.closest(`#${this.themeMenuId}`) &&
        !e.target.closest(`#${this.themeButtonId}`)
      ) {
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

    // Create the theme picker button
    const themeButton = document.createElement('button');
    themeButton.id = this.themeButtonId;
    themeButton.className = 'theme-button';
    themeButton.setAttribute('aria-label', 'Change theme colors');
    themeButton.setAttribute('aria-expanded', 'false');
    themeButton.setAttribute('aria-controls', this.themeMenuId);
    themeButton.innerHTML = ''; // Empty button for background only
    
    // Create separate emoji overlay that won't be affected by filters
    const emojiOverlay = document.createElement('span');
    emojiOverlay.className = 'theme-emoji-overlay';
    emojiOverlay.textContent = '🎨';
    emojiOverlay.setAttribute('aria-hidden', 'true');

    // Theme button styling is handled by CSS classes

    // Create the mode toggle button
    const modeButton = document.createElement('button');
    modeButton.id = this.modeToggleId;
    modeButton.className = 'theme-button';
    modeButton.setAttribute('aria-label', 'Toggle light/dark mode');

    // Get current mode
    const currentMode = window.themeManager
      ? window.themeManager.getCurrentTheme().mode
      : document.documentElement.getAttribute('data-theme') === 'night'
        ? 'dark'
        : 'light';

    modeButton.innerHTML =
      currentMode === 'dark'
        ? '<span class="mode-icon">☀️</span>'
        : '<span class="mode-icon">🌙</span>';

    // Mode button styling is handled by CSS classes

    // Create the theme menu (hidden initially)
    const menu = document.createElement('div');
    menu.id = this.themeMenuId;
    menu.className = 'theme-menu';
    menu.setAttribute('aria-label', 'Theme selection menu');
    menu.setAttribute('role', 'menu');

    // Menu styling is handled by CSS classes

    // Add menu title
    const menuTitle = document.createElement('div');
    menuTitle.className = 'theme-menu-title';
    menuTitle.textContent = 'Select Theme';
    menu.appendChild(menuTitle);

    // Get themes from the registry or fallback to theme manager

    let themeDefinitions = THEME_DEFINITIONS;
    try {
      if (
        window.themeManager &&
        typeof window.themeManager.getAvailableThemes === 'function'
      ) {
        const managerThemes = window.themeManager.getAvailableThemes();
        if (Array.isArray(managerThemes) && managerThemes.length > 0) {
          // Filter theme definitions to only include available themes
          themeDefinitions = THEME_DEFINITIONS.filter((def) =>
            managerThemes.includes(def.id),
          );
        }
      }
    } catch (error) {
      logger.warn('Error getting themes from theme manager:', error);
    }

    // Create a button for each theme
    themeDefinitions.forEach((themeDef) => {
      const themeButton = document.createElement('button');
      themeButton.className = 'theme-option';
      themeButton.setAttribute('data-theme', themeDef.id);
      themeButton.setAttribute('role', 'menuitem');

      themeButton.innerHTML = `${themeDef.icon} <span>${themeDef.title}</span>`;

      // Theme option styling is handled by CSS classes

      // Add event listener to change theme
      themeButton.addEventListener('click', () => {
        try {
          if (
            window.themeManager &&
            typeof window.themeManager.setTheme === 'function'
          ) {
            window.themeManager.setTheme(themeDef.id);
          } else {
            // Fallback implementation
            document.documentElement.setAttribute('data-theme', themeDef.id);
            localStorage.setItem('learnimals-theme-name', themeDef.id);
          }
        } catch (error) {
          logger.warn('Error applying theme:', error);
        }
        this.closeMenu();
      });

      // Hover effects are handled by CSS classes

      menu.appendChild(themeButton);
    });

    // Add elements to the DOM
    container.appendChild(menu);
    container.appendChild(themeButton);
    container.appendChild(emojiOverlay); // Add emoji overlay after button
    container.appendChild(modeButton);
    document.body.appendChild(container);

    // Add event listener to mode toggle button
    modeButton.addEventListener('click', () => {
      try {
        this.toggleTheme();
      } catch (error) {
        logger.warn('Error toggling mode:', error);
      }
    });
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

    menu.classList.add('menu-open');
    button.classList.add('menu-open');
    button.setAttribute('aria-expanded', 'true');
    this.isMenuOpen = true;
  }

  closeMenu() {
    const menu = document.getElementById(this.themeMenuId);
    const button = document.getElementById(this.themeButtonId);

    menu.classList.remove('menu-open');
    button.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    this.isMenuOpen = false;
  }

  updateActiveTheme() {
    let currentTheme = 'default';
    let currentMode = 'light';

    try {
      if (
        window.themeManager &&
        typeof window.themeManager.getCurrentTheme === 'function'
      ) {
        const themeInfo = window.themeManager.getCurrentTheme();
        currentTheme = themeInfo.name;
        currentMode = themeInfo.mode;
      } else {
        // Fallback: try to get theme from localStorage
        const savedThemeName = localStorage.getItem('learnimals-theme-name');
        const savedThemeMode = localStorage.getItem('learnimals-theme-mode');

        if (savedThemeName) {
          currentTheme = savedThemeName;
        }

        if (savedThemeMode) {
          currentMode = savedThemeMode;
        } else if (
          document.documentElement.getAttribute('data-theme') === 'night'
        ) {
          currentMode = 'dark';
        }
      }
    } catch (error) {
      logger.warn('Error getting current theme:', error);
    }

    // Update theme buttons
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach((button) => {
      const theme = button.getAttribute('data-theme');
      if (theme === currentTheme) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'true');
      } else {
        button.classList.remove('active');
        button.removeAttribute('aria-current');
      }
    });

    // Update all toggle buttons
    this.updateToggleButtons(currentMode);
  }

  getThemeEmoji(theme) {
    // Use THEME_DEFINITIONS from registry to get the icon
    const themeDef = THEME_DEFINITIONS.find((t) => t.id === theme);
    return themeDef ? themeDef.icon : '🎨';
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Theme toggle functionality now handles both theme and mode
  toggleTheme() {
    let newMode;

    if (
      window.themeManager &&
      typeof window.themeManager.toggleMode === 'function'
    ) {
      newMode = window.themeManager.toggleMode();
    } else {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'night' ? 'default' : 'night';
      document.documentElement.setAttribute('data-theme', nextTheme);
      newMode = nextTheme === 'night' ? 'dark' : 'light';
      localStorage.setItem('learnimals-theme-mode', newMode);
    }

    // Update all toggle buttons
    this.updateToggleButtons(newMode);
  }

  // This method has been removed as the footer toggle is no longer used

  // Update all theme toggle buttons to show the correct state
  updateToggleButtons(mode) {
    // Get current mode if not provided
    if (!mode) {
      if (
        window.themeManager &&
        typeof window.themeManager.getCurrentTheme === 'function'
      ) {
        mode = window.themeManager.getCurrentTheme().mode;
      } else {
        mode =
          document.documentElement.getAttribute('data-theme') === 'night'
            ? 'dark'
            : 'light';
      }
    }

    // Update floating mode toggle
    const modeButton = document.getElementById(this.modeToggleId);
    if (modeButton) {
      modeButton.innerHTML =
        mode === 'dark'
          ? '<span class="mode-icon">☀️</span>'
          : '<span class="mode-icon">🌙</span>';
      modeButton.setAttribute(
        'aria-label',
        `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`,
      );
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
