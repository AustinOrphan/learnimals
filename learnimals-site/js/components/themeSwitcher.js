// Theme Switcher Component for Learnimals
// This component creates a theme selection interface

class ThemeSwitcher {
  constructor() {
    this.themeButtonId = "theme-switcher-button";
    this.themeMenuId = "theme-menu";
    this.modeToggleId = "mode-toggle-button";
    this.isMenuOpen = false;

    // Only initialize if we're in a browser environment
    if (typeof window !== "undefined" && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
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
      themeMenuBtn.addEventListener("click", () => this.toggleMenu());
    }

    // Close menu when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (
        this.isMenuOpen &&
        !e.target.closest(`#${this.themeMenuId}`) &&
        !e.target.closest(`#${this.themeButtonId}`)
      ) {
        this.closeMenu();
      }
    });

    // Keyboard accessibility
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isMenuOpen) {
        this.closeMenu();
      }
    });

    // Update the active theme indicator
    this.updateActiveTheme();

    // Listen for theme changes from other sources
    document.addEventListener("themeChanged", () => this.updateActiveTheme());
  }

  createThemeSwitcherUI() {
    // Check if the container already exists
    if (document.querySelector(".theme-switcher-container")) {
      return; // Theme switcher UI already exists
    }

    // Create container for the theme switcher
    const container = document.createElement("div");
    container.className = "theme-switcher-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "100";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.alignItems = "flex-end";

    // Create the theme picker button
    const themeButton = document.createElement("button");
    themeButton.id = this.themeButtonId;
    themeButton.className = "theme-switcher-button";
    themeButton.setAttribute("aria-label", "Change theme colors");
    themeButton.setAttribute("aria-expanded", "false");
    themeButton.setAttribute("aria-controls", this.themeMenuId);
    themeButton.innerHTML = '<span class="theme-icon">🎨</span>';

    // Style the theme button
    themeButton.style.width = "42px";
    themeButton.style.height = "42px";
    themeButton.style.borderRadius = "50%";
    themeButton.style.border = "none";
    themeButton.style.background = "var(--primary-color)";
    themeButton.style.color = "var(--text-color)";
    themeButton.style.fontSize = "20px";
    themeButton.style.cursor = "pointer";
    themeButton.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
    themeButton.style.transition = "all 0.3s";

    // Create the mode toggle button
    const modeButton = document.createElement("button");
    modeButton.id = this.modeToggleId;
    modeButton.className = "mode-toggle-button";
    modeButton.setAttribute("aria-label", "Toggle light/dark mode");

    // Get current mode
    const currentMode = window.themeManager
      ? window.themeManager.getCurrentTheme().mode
      : document.documentElement.getAttribute("data-theme") === "night"
        ? "dark"
        : "light";

    modeButton.innerHTML =
      currentMode === "dark"
        ? '<span class="mode-icon">☀️</span>'
        : '<span class="mode-icon">🌙</span>';

    // Style the mode button
    modeButton.style.width = "42px";
    modeButton.style.height = "42px";
    modeButton.style.borderRadius = "50%";
    modeButton.style.border = "none";
    modeButton.style.background = "var(--accent-color-alt)";
    modeButton.style.color = "var(--text-color)";
    modeButton.style.fontSize = "20px";
    modeButton.style.cursor = "pointer";
    modeButton.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
    modeButton.style.transition = "all 0.3s";

    // Create the theme menu (hidden initially)
    const menu = document.createElement("div");
    menu.id = this.themeMenuId;
    menu.className = "theme-menu";
    menu.setAttribute("aria-label", "Theme selection menu");
    menu.setAttribute("role", "menu");

    // Style the menu
    menu.style.position = "absolute";
    menu.style.bottom = "110px"; // Positioned above both buttons
    menu.style.right = "0";
    menu.style.background = "var(--text-color)";
    menu.style.color = "var(--accent-color)";
    menu.style.borderRadius = "10px";
    menu.style.padding = "10px";
    menu.style.boxShadow = "0 5px 15px rgba(0,0,0,0.5)";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "8px";
    menu.style.minWidth = "150px";
    menu.style.transition =
      "background-color 0.3s, color 0.3s, box-shadow 0.3s";

    // Add menu title
    const menuTitle = document.createElement("div");
    menuTitle.textContent = "Select Theme";
    menuTitle.style.fontWeight = "bold";
    menuTitle.style.marginBottom = "5px";
    menuTitle.style.paddingBottom = "5px";
    menuTitle.style.borderBottom = "1px solid var(--primary-color)";
    menuTitle.style.transition = "border-bottom 0.3s";
    menu.appendChild(menuTitle);

    // Get themes from the theme manager
    let themes = ["default", "ocean", "forest", "candy", "space", "sunset", "neon", "vintage"];
    try {
      if (
        window.themeManager &&
        typeof window.themeManager.getAvailableThemes === "function"
      ) {
        const managerThemes = window.themeManager.getAvailableThemes();
        if (Array.isArray(managerThemes) && managerThemes.length > 0) {
          themes = managerThemes;
        }
      }
    } catch (error) {
      console.warn("Error getting themes from theme manager:", error);
    }

    // Create a button for each theme
    themes.forEach((theme) => {
      const themeButton = document.createElement("button");
      themeButton.className = "theme-option";
      themeButton.setAttribute("data-theme", theme);
      themeButton.setAttribute("role", "menuitem");

      // Get emoji for each theme
      const themeEmoji = this.getThemeEmoji(theme);

      themeButton.innerHTML = `${themeEmoji} <span>${this.capitalizeFirstLetter(theme)}</span>`;

      // Style the theme button
      themeButton.style.padding = "8px 12px";
      themeButton.style.border = "none";
      themeButton.style.borderRadius = "6px";
      themeButton.style.textAlign = "left";
      themeButton.style.background = "transparent";
      themeButton.style.cursor = "pointer";
      themeButton.style.display = "flex";
      themeButton.style.alignItems = "center";
      themeButton.style.gap = "8px";
      themeButton.style.width = "100%";
      themeButton.style.transition = "background-color 0.2s";

      // Add event listener to change theme
      themeButton.addEventListener("click", () => {
        try {
          if (
            window.themeManager &&
            typeof window.themeManager.setTheme === "function"
          ) {
            window.themeManager.setTheme(theme);
          } else {
            // Fallback implementation
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("learnimals-theme-name", theme);
          }
        } catch (error) {
          console.warn("Error applying theme:", error);
        }
        this.closeMenu();
      });

      // Hover effect
      themeButton.addEventListener("mouseover", () => {
        const isDarkMode = document.body.classList.contains("theme-mode-dark");
        themeButton.style.backgroundColor = isDarkMode
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.05)";
      });

      themeButton.addEventListener("mouseout", () => {
        themeButton.style.backgroundColor = "transparent";
      });

      menu.appendChild(themeButton);
    });

    // Add elements to the DOM
    container.appendChild(menu);
    container.appendChild(themeButton);
    container.appendChild(modeButton);
    document.body.appendChild(container);

    // Add event listener to mode toggle button
    modeButton.addEventListener("click", () => {
      try {
        this.toggleTheme();
      } catch (error) {
        console.warn("Error toggling mode:", error);
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

    menu.style.display = "flex";
    button.setAttribute("aria-expanded", "true");
    button.style.transform = "rotate(45deg)";
    this.isMenuOpen = true;
  }

  closeMenu() {
    const menu = document.getElementById(this.themeMenuId);
    const button = document.getElementById(this.themeButtonId);

    menu.style.display = "none";
    button.setAttribute("aria-expanded", "false");
    button.style.transform = "rotate(0deg)";
    this.isMenuOpen = false;
  }

  updateActiveTheme() {
    let currentTheme = "default";
    let currentMode = "light";

    try {
      if (
        window.themeManager &&
        typeof window.themeManager.getCurrentTheme === "function"
      ) {
        const themeInfo = window.themeManager.getCurrentTheme();
        currentTheme = themeInfo.name;
        currentMode = themeInfo.mode;
      } else {
        // Fallback: try to get theme from localStorage
        const savedThemeName = localStorage.getItem("learnimals-theme-name");
        const savedThemeMode = localStorage.getItem("learnimals-theme-mode");

        if (savedThemeName) {
          currentTheme = savedThemeName;
        }

        if (savedThemeMode) {
          currentMode = savedThemeMode;
        } else if (
          document.documentElement.getAttribute("data-theme") === "night"
        ) {
          currentMode = "dark";
        }
      }
    } catch (error) {
      console.warn("Error getting current theme:", error);
    }

    // Update theme buttons
    const themeButtons = document.querySelectorAll(".theme-option");
    themeButtons.forEach((button) => {
      const theme = button.getAttribute("data-theme");
      if (theme === currentTheme) {
        const isDarkMode = currentMode === "dark";
        button.style.backgroundColor = isDarkMode
          ? "rgba(255,255,255,0.15)"
          : "rgba(0,0,0,0.1)";
        button.style.fontWeight = "bold";
        button.setAttribute("aria-current", "true");
      } else {
        button.style.backgroundColor = "transparent";
        button.style.fontWeight = "normal";
        button.removeAttribute("aria-current");
      }
    });

    // Update all toggle buttons
    this.updateToggleButtons(currentMode);
  }

  getThemeEmoji(theme) {
    const emojis = {
      default: "🏠",
      ocean: "🌊",
      forest: "🌲",
      candy: "🍭",
      space: "🚀",
      sunset: "🌅",
      neon: "✨",
      vintage: "📜"
    };

    return emojis[theme] || "🎨";
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Theme toggle functionality now handles both theme and mode
  toggleTheme() {
    let newMode;

    if (
      window.themeManager &&
      typeof window.themeManager.toggleMode === "function"
    ) {
      newMode = window.themeManager.toggleMode();
    } else {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "night" ? "default" : "night";
      document.documentElement.setAttribute("data-theme", nextTheme);
      newMode = nextTheme === "night" ? "dark" : "light";
      localStorage.setItem("learnimals-theme-mode", newMode);
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
        typeof window.themeManager.getCurrentTheme === "function"
      ) {
        mode = window.themeManager.getCurrentTheme().mode;
      } else {
        mode =
          document.documentElement.getAttribute("data-theme") === "night"
            ? "dark"
            : "light";
      }
    }

    // Update floating mode toggle
    const modeButton = document.getElementById(this.modeToggleId);
    if (modeButton) {
      modeButton.innerHTML =
        mode === "dark"
          ? '<span class="mode-icon">☀️</span>'
          : '<span class="mode-icon">🌙</span>';
      modeButton.setAttribute(
        "aria-label",
        `Switch to ${mode === "dark" ? "light" : "dark"} mode`,
      );
    }
  }
}

// Create and export the theme switcher instance
const themeSwitcher = new ThemeSwitcher();

// Make it globally accessible
if (typeof window !== "undefined") {
  window.themeSwitcher = themeSwitcher;
}

export default themeSwitcher;
