// Theme Manager for Learnimals
// Handles theme switching, persistence, and prefers-color-scheme detection

class ThemeManager {
  constructor() {
    // Available themes with light and dark variants
    // Define common colors
    this.commonColors = {
      '--color-white': 'rgb(255, 255, 255)',
      '--color-black': 'rgb(0, 0, 0)',
      '--color-gray-100': 'rgb(245, 246, 250)',
      '--color-gray-200': 'rgb(223, 230, 233)',
      '--color-gray-300': 'rgb(178, 190, 195)',
      '--color-gray-400': 'rgb(99, 110, 114)',
      '--color-gray-500': 'rgb(45, 52, 54)'
    };
    
    // Define base theme colors
    this.themeBaseColors = {
      default: {
        '--default-color-1': 'rgb(0, 184, 148)',
        '--default-color-2': 'rgb(0, 206, 201)',
        '--default-color-3': 'rgb(9, 132, 227)',
        '--default-color-4': 'rgb(116, 185, 255)',
        '--default-color-5': 'rgb(255, 234, 167)',
        '--default-color-6': 'rgb(104, 109, 224)',
        '--default-color-light': 'rgb(253, 246, 227)',
        '--default-color-dark': 'rgb(34, 47, 62)'
      },
      ocean: {
        '--ocean-color-1': 'rgb(10, 189, 227)',
        '--ocean-color-2': 'rgb(72, 219, 251)',
        '--ocean-color-3': 'rgb(27, 156, 252)',
        '--ocean-color-4': 'rgb(69, 170, 242)',
        '--ocean-color-5': 'rgb(200, 214, 229)',
        '--ocean-color-6': 'rgb(119, 140, 163)',
        '--ocean-color-light': 'rgb(241, 242, 246)',
        '--ocean-color-dark': 'rgb(10, 61, 98)'
      },
      forest: {
        '--forest-color-1': 'rgb(106, 176, 76)',
        '--forest-color-2': 'rgb(120, 224, 143)',
        '--forest-color-3': 'rgb(186, 220, 88)',
        '--forest-color-4': 'rgb(184, 233, 148)',
        '--forest-color-5': 'rgb(255, 190, 118)',
        '--forest-color-6': 'rgb(246, 185, 59)',
        '--forest-color-light': 'rgb(245, 245, 240)',
        '--forest-color-dark': 'rgb(30, 58, 30)'
      },
      candy: {
        '--candy-color-1': 'rgb(224, 86, 253)',
        '--candy-color-2': 'rgb(190, 46, 221)',
        '--candy-color-3': 'rgb(255, 159, 243)',
        '--candy-color-4': 'rgb(108, 92, 231)',
        '--candy-color-5': 'rgb(255, 234, 167)',
        '--candy-color-6': 'rgb(249, 202, 36)',
        '--candy-color-light': 'rgb(255, 238, 247)',
        '--candy-color-dark': 'rgb(111, 30, 136)'
      },
      space: {
        '--space-color-1': 'rgb(123, 104, 238)',
        '--space-color-2': 'rgb(138, 43, 226)',
        '--space-color-3': 'rgb(148, 0, 211)',
        '--space-color-4': 'rgb(72, 61, 139)',
        '--space-color-5': 'rgb(173, 216, 230)',
        '--space-color-6': 'rgb(176, 196, 222)',
        '--space-color-light': 'rgb(240, 248, 255)',
        '--space-color-dark': 'rgb(25, 25, 112)'
      },
      sunset: {
        '--sunset-color-1': 'rgb(255, 99, 71)',
        '--sunset-color-2': 'rgb(233, 150, 122)',
        '--sunset-color-3': 'rgb(255, 165, 0)',
        '--sunset-color-4': 'rgb(255, 140, 0)',
        '--sunset-color-5': 'rgb(255, 218, 185)',
        '--sunset-color-6': 'rgb(250, 128, 114)',
        '--sunset-color-light': 'rgb(255, 245, 238)',
        '--sunset-color-dark': 'rgb(139, 0, 0)'
      },
      neon: {
        '--neon-color-1': 'rgb(0, 255, 255)',
        '--neon-color-2': 'rgb(255, 105, 180)',
        '--neon-color-3': 'rgb(255, 0, 255)',
        '--neon-color-4': 'rgb(127, 255, 212)',
        '--neon-color-5': 'rgb(0, 255, 127)',
        '--neon-color-6': 'rgb(75, 0, 130)',
        '--neon-color-light': 'rgb(240, 255, 255)',
        '--neon-color-dark': 'rgb(0, 0, 0)'
      },
      vintage: {
        '--vintage-color-1': 'rgb(188, 143, 143)',
        '--vintage-color-2': 'rgb(160, 82, 45)',
        '--vintage-color-3': 'rgb(205, 133, 63)',
        '--vintage-color-4': 'rgb(139, 69, 19)',
        '--vintage-color-5': 'rgb(222, 184, 135)',
        '--vintage-color-6': 'rgb(184, 134, 11)',
        '--vintage-color-light': 'rgb(245, 245, 220)',
        '--vintage-color-dark': 'rgb(47, 79, 79)'
      }
    };
    
    // Theme mapping based on base colors
    // Each theme has 4 shared colors between light/dark modes and 4 colors that can differ
    this.themeColors = {
      default: {
        light: {
          '--primary-color': 'var(--default-color-1)',         // Shared: primary
          '--secondary-color': 'var(--default-color-3)',       // Shared: secondary
          '--accent-color': 'var(--default-color-5)',          // Shared: accent
          '--text-color': 'var(--default-color-dark)',         // Different: text
          '--text-color-secondary': 'var(--color-gray-400)',   // Different: text secondary
          '--background-color': 'var(--default-color-light)',  // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--default-color-1)',         // Shared: primary
          '--secondary-color': 'var(--default-color-3)',       // Shared: secondary
          '--accent-color': 'var(--default-color-5)',          // Shared: accent
          '--text-color': 'var(--default-color-light)',        // Different: text
          '--text-color-secondary': 'var(--color-gray-300)',   // Different: text secondary
          '--background-color': 'var(--default-color-dark)',   // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-500)' // Different: bg secondary
        }
      },
      ocean: {
        light: {
          '--primary-color': 'var(--ocean-color-1)',           // Shared: primary
          '--secondary-color': 'var(--ocean-color-3)',         // Shared: secondary
          '--accent-color': 'var(--ocean-color-5)',            // Shared: accent
          '--text-color': 'var(--ocean-color-dark)',           // Different: text
          '--text-color-secondary': 'var(--ocean-color-3)',    // Different: text secondary
          '--background-color': 'var(--ocean-color-light)',    // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--ocean-color-1)',           // Shared: primary
          '--secondary-color': 'var(--ocean-color-3)',         // Shared: secondary
          '--accent-color': 'var(--ocean-color-5)',            // Shared: accent
          '--text-color': 'var(--ocean-color-light)',          // Different: text
          '--text-color-secondary': 'var(--ocean-color-6)',    // Different: text secondary
          '--background-color': 'var(--ocean-color-dark)',     // Shared: background variant
          '--background-color-secondary': 'var(--ocean-color-4)' // Different: bg secondary
        }
      },
      forest: {
        light: {
          '--primary-color': 'var(--forest-color-1)',          // Shared: primary
          '--secondary-color': 'var(--forest-color-3)',        // Shared: secondary
          '--accent-color': 'var(--forest-color-5)',           // Shared: accent
          '--text-color': 'var(--forest-color-dark)',          // Different: text
          '--text-color-secondary': 'var(--forest-color-1)',   // Different: text secondary
          '--background-color': 'var(--forest-color-light)',   // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--forest-color-1)',          // Shared: primary
          '--secondary-color': 'var(--forest-color-3)',        // Shared: secondary
          '--accent-color': 'var(--forest-color-5)',           // Shared: accent
          '--text-color': 'var(--forest-color-light)',         // Different: text
          '--text-color-secondary': 'var(--forest-color-6)',   // Different: text secondary  
          '--background-color': 'var(--forest-color-dark)',    // Shared: background variant
          '--background-color-secondary': 'var(--forest-color-4)' // Different: bg secondary
        }
      },
      candy: {
        light: {
          '--primary-color': 'var(--candy-color-1)',           // Shared: primary
          '--secondary-color': 'var(--candy-color-3)',         // Shared: secondary
          '--accent-color': 'var(--candy-color-5)',            // Shared: accent
          '--text-color': 'var(--candy-color-4)',              // Different: text
          '--text-color-secondary': 'var(--candy-color-1)',    // Different: text secondary
          '--background-color': 'var(--candy-color-light)',    // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--candy-color-1)',           // Shared: primary
          '--secondary-color': 'var(--candy-color-3)',         // Shared: secondary
          '--accent-color': 'var(--candy-color-5)',            // Shared: accent
          '--text-color': 'var(--candy-color-light)',          // Different: text
          '--text-color-secondary': 'var(--candy-color-2)',    // Different: text secondary
          '--background-color': 'var(--candy-color-dark)',     // Shared: background variant
          '--background-color-secondary': 'var(--candy-color-6)' // Different: bg secondary
        }
      },
      space: {
        light: {
          '--primary-color': 'var(--space-color-1)',           // Shared: primary
          '--secondary-color': 'var(--space-color-3)',         // Shared: secondary
          '--accent-color': 'var(--space-color-5)',            // Shared: accent
          '--text-color': 'var(--space-color-dark)',           // Different: text
          '--text-color-secondary': 'var(--space-color-3)',    // Different: text secondary
          '--background-color': 'var(--space-color-light)',    // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--space-color-1)',           // Shared: primary
          '--secondary-color': 'var(--space-color-3)',         // Shared: secondary
          '--accent-color': 'var(--space-color-5)',            // Shared: accent
          '--text-color': 'var(--space-color-light)',          // Different: text
          '--text-color-secondary': 'var(--space-color-6)',    // Different: text secondary
          '--background-color': 'var(--space-color-dark)',     // Shared: background variant
          '--background-color-secondary': 'var(--space-color-4)' // Different: bg secondary
        }
      },
      sunset: {
        light: {
          '--primary-color': 'var(--sunset-color-1)',          // Shared: primary
          '--secondary-color': 'var(--sunset-color-3)',        // Shared: secondary
          '--accent-color': 'var(--sunset-color-5)',           // Shared: accent
          '--text-color': 'var(--sunset-color-4)',             // Different: text
          '--text-color-secondary': 'var(--sunset-color-3)',   // Different: text secondary
          '--background-color': 'var(--sunset-color-light)',   // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--sunset-color-1)',          // Shared: primary
          '--secondary-color': 'var(--sunset-color-3)',        // Shared: secondary
          '--accent-color': 'var(--sunset-color-5)',           // Shared: accent
          '--text-color': 'var(--sunset-color-light)',         // Different: text
          '--text-color-secondary': 'var(--sunset-color-6)',   // Different: text secondary
          '--background-color': 'var(--sunset-color-dark)',    // Shared: background variant
          '--background-color-secondary': 'var(--sunset-color-2)' // Different: bg secondary
        }
      },
      neon: {
        light: {
          '--primary-color': 'var(--neon-color-1)',            // Shared: primary
          '--secondary-color': 'var(--neon-color-2)',          // Shared: secondary
          '--accent-color': 'var(--neon-color-4)',             // Shared: accent
          '--text-color': 'var(--neon-color-6)',               // Different: text
          '--text-color-secondary': 'var(--neon-color-2)',     // Different: text secondary
          '--background-color': 'var(--neon-color-light)',     // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--neon-color-1)',            // Shared: primary
          '--secondary-color': 'var(--neon-color-2)',          // Shared: secondary
          '--accent-color': 'var(--neon-color-4)',             // Shared: accent
          '--text-color': 'var(--color-white)',                // Different: text
          '--text-color-secondary': 'var(--neon-color-5)',     // Different: text secondary
          '--background-color': 'var(--neon-color-dark)',      // Shared: background variant
          '--background-color-secondary': 'var(--neon-color-6)' // Different: bg secondary
        }
      },
      vintage: {
        light: {
          '--primary-color': 'var(--vintage-color-1)',         // Shared: primary
          '--secondary-color': 'var(--vintage-color-3)',       // Shared: secondary
          '--accent-color': 'var(--vintage-color-5)',          // Shared: accent
          '--text-color': 'var(--vintage-color-4)',            // Different: text
          '--text-color-secondary': 'var(--vintage-color-3)',  // Different: text secondary
          '--background-color': 'var(--vintage-color-light)',  // Shared: background variant
          '--background-color-secondary': 'var(--color-gray-100)' // Different: bg secondary
        },
        dark: {
          '--primary-color': 'var(--vintage-color-1)',         // Shared: primary
          '--secondary-color': 'var(--vintage-color-3)',       // Shared: secondary
          '--accent-color': 'var(--vintage-color-5)',          // Shared: accent
          '--text-color': 'var(--vintage-color-light)',        // Different: text
          '--text-color-secondary': 'var(--vintage-color-6)',  // Different: text secondary
          '--background-color': 'var(--vintage-color-dark)',   // Shared: background variant
          '--background-color-secondary': 'var(--vintage-color-2)' // Different: bg secondary
        }
      }
    };
    
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
      }
    } else {
      // Default theme name is 'default', check for system dark/light preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.currentTheme.mode = 'dark';
      }
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
    Object.keys(this.commonColors).forEach(property => {
      document.documentElement.style.setProperty(property, this.commonColors[property]);
    });
    
    // Then apply base theme colors
    if (this.themeBaseColors[name]) {
      Object.keys(this.themeBaseColors[name]).forEach(property => {
        document.documentElement.style.setProperty(property, this.themeBaseColors[name][property]);
      });
    }
    
    // Finally apply the specific theme mapping
    const themeColors = this.themeColors[name][mode];
    if (!themeColors) return;
    
    // Apply CSS variables to root element
    Object.keys(themeColors).forEach(property => {
      document.documentElement.style.setProperty(property, themeColors[property]);
    });
    
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
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors['--accent-color']);
    }
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