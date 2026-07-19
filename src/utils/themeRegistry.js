// Theme Registry - Centralized theme configuration
// Export theme definitions for use across the application

/**
 * Theme Registry - Centralized theme configuration for Learnimals
 *
 * This module exports theme configurations that can be used by ThemeManager
 * and ThemeSwitcher to ensure consistent theming across the application.
 */

// Define common colors used across themes
export const COMMON_COLORS = {
  '--color-white': 'rgb(255, 255, 255)',
  '--color-black': 'rgb(0, 0, 0)',
  '--color-gray-100': 'rgb(245, 246, 250)',
  '--color-gray-200': 'rgb(223, 230, 233)',
  '--color-gray-300': 'rgb(178, 190, 195)',
  '--color-gray-400': 'rgb(99, 110, 114)',
  '--color-gray-500': 'rgb(45, 52, 54)',
};

// Define base theme colors
export const THEME_BASE_COLORS = {
  default: {
    '--default-color-1': 'rgb(68, 209, 174)' /* Mint */,
    '--default-color-2': 'rgb(147, 229, 209)' /* Lighter mint */,
    '--default-color-3': 'rgb(9, 132, 227)' /* Blue */,
    '--default-color-4': 'rgb(116, 185, 255)' /* Light blue */,
    '--default-color-5': 'rgb(241, 217, 140)' /* Yellow */,
    '--default-color-6': 'rgb(247, 242, 173)' /* Light Yellow */,
    '--default-color-7': 'rgb(76, 79, 169)' /* Purple */,
    '--default-color-8': 'rgb(137, 103, 154)' /* Light Purple */,
    '--default-color-light': 'rgb(253, 246, 227)' /* Light bg */,
    '--default-color-light-alt': 'rgb(255, 253, 246)' /* Light bg alt */,
    '--default-color-dark': 'rgb(61, 81, 101)' /* Dark bg */,
    '--default-color-dark-alt': 'rgb(20, 34, 51)' /* Dark bg alt */,
  },
  ocean: {
    '--ocean-color-1': 'rgb(10, 189, 227)' /* Cyan */,
    '--ocean-color-2': 'rgb(72, 219, 251)' /* Light cyan */,
    '--ocean-color-3': 'rgb(27, 156, 252)' /* Blue */,
    '--ocean-color-4': 'rgb(69, 170, 242)' /* Light blue */,
    '--ocean-color-5': 'rgb(200, 214, 229)' /* Light accent */,
    '--ocean-color-6': 'rgb(119, 140, 163)' /* Gray accent */,
    '--ocean-color-7': 'rgb(0, 73, 141)' /* Dark blue */,
    '--ocean-color-8': 'rgb(64, 115, 158)' /* Medium blue */,
    '--ocean-color-light': 'rgb(241, 242, 246)' /* Light bg */,
    '--ocean-color-light-alt': 'rgb(255, 255, 255)' /* Light bg alt */,
    '--ocean-color-dark': 'rgb(10, 61, 98)' /* Dark bg */,
    '--ocean-color-dark-alt': 'rgb(5, 36, 64)' /* Dark bg alt */,
  },
  forest: {
    '--forest-color-1': 'rgb(106, 176, 76)' /* Green */,
    '--forest-color-2': 'rgb(120, 224, 143)' /* Light green */,
    '--forest-color-3': 'rgb(186, 220, 88)' /* Lime */,
    '--forest-color-4': 'rgb(184, 233, 148)' /* Light lime */,
    '--forest-color-5': 'rgb(255, 190, 118)' /* Orange */,
    '--forest-color-6': 'rgb(246, 185, 59)' /* Yellow */,
    '--forest-color-7': 'rgb(76, 117, 38)' /* Dark green */,
    '--forest-color-8': 'rgb(121, 159, 88)' /* Medium green */,
    '--forest-color-light': 'rgb(245, 245, 240)' /* Light bg */,
    '--forest-color-light-alt': 'rgb(255, 255, 250)' /* Light bg alt */,
    '--forest-color-dark': 'rgb(30, 58, 30)' /* Dark bg */,
    '--forest-color-dark-alt': 'rgb(19, 39, 19)' /* Dark bg alt */,
  },
  candy: {
    '--candy-color-1': 'rgb(224, 86, 253)' /* Pink */,
    '--candy-color-2': 'rgb(190, 46, 221)' /* Dark pink */,
    '--candy-color-3': 'rgb(255, 159, 243)' /* Light pink */,
    '--candy-color-4': 'rgb(108, 92, 231)' /* Purple */,
    '--candy-color-5': 'rgb(255, 234, 167)' /* Yellow */,
    '--candy-color-6': 'rgb(249, 202, 36)' /* Gold */,
    '--candy-color-7': 'rgb(148, 33, 146)' /* Dark purple */,
    '--candy-color-8': 'rgb(180, 90, 211)' /* Medium purple */,
    '--candy-color-light': 'rgb(255, 238, 247)' /* Light bg */,
    '--candy-color-light-alt': 'rgb(255, 248, 253)' /* Light bg alt */,
    '--candy-color-dark': 'rgb(111, 30, 136)' /* Dark bg */,
    '--candy-color-dark-alt': 'rgb(81, 16, 99)' /* Dark bg alt */,
  },
  space: {
    '--space-color-1': 'rgb(123, 104, 238)' /* Purple */,
    '--space-color-2': 'rgb(138, 43, 226)' /* Dark purple */,
    '--space-color-3': 'rgb(148, 0, 211)' /* Deep purple */,
    '--space-color-4': 'rgb(72, 61, 139)' /* Dark blue */,
    '--space-color-5': 'rgb(173, 216, 230)' /* Light blue */,
    '--space-color-6': 'rgb(176, 196, 222)' /* Slate */,
    '--space-color-7': 'rgb(45, 52, 164)' /* Navy */,
    '--space-color-8': 'rgb(95, 103, 174)' /* Medium blue-purple */,
    '--space-color-light': 'rgb(240, 248, 255)' /* Light bg */,
    '--space-color-light-alt': 'rgb(248, 252, 255)' /* Light bg alt */,
    '--space-color-dark': 'rgb(25, 25, 112)' /* Dark bg */,
    '--space-color-dark-alt': 'rgb(13, 13, 70)' /* Dark bg alt */,
  },
  sunset: {
    '--sunset-color-1': 'rgb(255, 99, 71)' /* Tomato */,
    '--sunset-color-2': 'rgb(233, 150, 122)' /* Salmon */,
    '--sunset-color-3': 'rgb(255, 165, 0)' /* Orange */,
    '--sunset-color-4': 'rgb(255, 140, 0)' /* Dark orange */,
    '--sunset-color-5': 'rgb(255, 218, 185)' /* Peach */,
    '--sunset-color-6': 'rgb(250, 128, 114)' /* Coral */,
    '--sunset-color-7': 'rgb(178, 34, 34)' /* Firebrick */,
    '--sunset-color-8': 'rgb(205, 92, 92)' /* Indian red */,
    '--sunset-color-light': 'rgb(255, 245, 238)' /* Light bg */,
    '--sunset-color-light-alt': 'rgb(255, 250, 246)' /* Light bg alt */,
    '--sunset-color-dark': 'rgb(139, 0, 0)' /* Dark bg */,
    '--sunset-color-dark-alt': 'rgb(94, 0, 0)' /* Dark bg alt */,
  },
  neon: {
    '--neon-color-1': 'rgb(0, 255, 255)' /* Cyan */,
    '--neon-color-2': 'rgb(255, 105, 180)' /* Pink */,
    '--neon-color-3': 'rgb(255, 0, 255)' /* Magenta */,
    '--neon-color-4': 'rgb(127, 255, 212)' /* Aqua */,
    '--neon-color-5': 'rgb(0, 255, 127)' /* Green */,
    '--neon-color-6': 'rgb(75, 0, 130)' /* Indigo */,
    '--neon-color-7': 'rgb(148, 0, 211)' /* Violet */,
    '--neon-color-8': 'rgb(138, 43, 226)' /* Blue violet */,
    '--neon-color-light': 'rgb(240, 255, 255)' /* Light bg */,
    '--neon-color-light-alt': 'rgb(248, 255, 255)' /* Light bg alt */,
    '--neon-color-dark': 'rgb(0, 0, 0)' /* Dark bg */,
    '--neon-color-dark-alt': 'rgb(20, 20, 20)' /* Dark bg alt */,
  },
  vintage: {
    '--vintage-color-1': 'rgb(188, 143, 143)' /* Rosy brown */,
    '--vintage-color-2': 'rgb(160, 82, 45)' /* Sienna */,
    '--vintage-color-3': 'rgb(205, 133, 63)' /* Peru */,
    '--vintage-color-4': 'rgb(139, 69, 19)' /* Saddle brown */,
    '--vintage-color-5': 'rgb(222, 184, 135)' /* Burlywood */,
    '--vintage-color-6': 'rgb(184, 134, 11)' /* Dark goldenrod */,
    '--vintage-color-7': 'rgb(85, 107, 47)' /* Dark olive green */,
    '--vintage-color-8': 'rgb(107, 142, 35)' /* Olive drab */,
    '--vintage-color-light': 'rgb(245, 245, 220)' /* Light bg */,
    '--vintage-color-light-alt': 'rgb(250, 250, 235)' /* Light bg alt */,
    '--vintage-color-dark': 'rgb(47, 79, 79)' /* Dark bg */,
    '--vintage-color-dark-alt': 'rgb(33, 55, 55)' /* Dark bg alt */,
  },
};

// Derived theme colors with mappings for light/dark modes
export const THEME_COLORS = {
  default: {
    light: createLightTheme('default'),
    dark: createDarkTheme('default'),
  },
  ocean: {
    light: createLightTheme('ocean'),
    dark: createDarkTheme('ocean'),
  },
  forest: {
    light: createLightTheme('forest'),
    dark: createDarkTheme('forest'),
  },
  candy: {
    light: createLightTheme('candy'),
    dark: createDarkTheme('candy'),
  },
  space: {
    light: createLightTheme('space'),
    dark: createDarkTheme('space'),
  },
  sunset: {
    light: createLightTheme('sunset'),
    dark: createDarkTheme('sunset'),
  },
  neon: {
    light: createLightTheme('neon'),
    dark: createDarkTheme('neon'),
  },
  vintage: {
    light: createLightTheme('vintage'),
    dark: createDarkTheme('vintage'),
  },
};

// Helper function to create light theme
function createLightTheme(themeName) {
  return {
    '--primary-color': `var(--${themeName}-color-1)`,
    '--primary-color-alt': `var(--${themeName}-color-2)`,
    '--secondary-color': `var(--${themeName}-color-3)`,
    '--secondary-color-alt': `var(--${themeName}-color-4)`,
    '--accent-color': `var(--${themeName}-color-5)`,
    '--accent-color-alt': `var(--${themeName}-color-6)`,
    '--accent-color-opp': `var(--${themeName}-color-7)`,
    '--accent-color-opp-alt': `var(--${themeName}-color-8)`,
    '--text-color': `var(--${themeName}-color-dark)`,
    '--text-color-alt': `var(--${themeName}-color-dark-alt)`,
    '--text-color-secondary': `var(--${themeName}-color-dark-alt)`,
    '--background-color': `var(--${themeName}-color-light)`,
    '--background-color-alt': `var(--${themeName}-color-light-alt)`,
  };
}

// Helper function to create dark theme
function createDarkTheme(themeName) {
  return {
    '--primary-color': `var(--${themeName}-color-1)`,
    '--primary-color-alt': `var(--${themeName}-color-2)`,
    '--secondary-color': `var(--${themeName}-color-3)`,
    '--secondary-color-alt': `var(--${themeName}-color-4)`,
    '--accent-color': `var(--${themeName}-color-7)`,
    '--accent-color-alt': `var(--${themeName}-color-8)`,
    '--accent-color-opp': `var(--${themeName}-color-5)`,
    '--accent-color-opp-alt': `var(--${themeName}-color-6)`,
    '--text-color': `var(--${themeName}-color-light)`,
    '--text-color-alt': `var(--${themeName}-color-light-alt)`,
    '--text-color-secondary': `var(--${themeName}-color-light-alt)`,
    '--background-color': `var(--${themeName}-color-dark-alt)`,
    '--background-color-alt': `var(--${themeName}-color-dark)`,
  };
}

// Theme names and display titles
export const THEME_DEFINITIONS = [
  { id: 'default', title: 'Default', icon: '🌈' },
  { id: 'ocean', title: 'Ocean', icon: '🌊' },
  { id: 'forest', title: 'Forest', icon: '🌳' },
  { id: 'candy', title: 'Candy', icon: '🍬' },
  { id: 'space', title: 'Space', icon: '🌌' },
  { id: 'sunset', title: 'Sunset', icon: '🌅' },
  { id: 'neon', title: 'Neon', icon: '✨' },
  { id: 'vintage', title: 'Vintage', icon: '📜' },
];
