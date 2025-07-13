import js from '@eslint/js';

export default [
  {
    // Apply to all JS files
    files: ['src/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        getComputedStyle: 'readonly',
        
        // Canvas/WebGL globals
        CanvasRenderingContext2D: 'readonly',
        HTMLCanvasElement: 'readonly',
        Image: 'readonly',
        
        // Animation globals
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        
        // Audio globals
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        
        // DOM Events and Elements
        Element: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        KeyboardEvent: 'readonly',
        
        // Timing functions
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Math and utility globals
        Math: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly',
        
        // Additional browser globals
        FormData: 'readonly',
        screen: 'readonly',
        Audio: 'readonly',
        alert: 'readonly',
        Card: 'readonly',
        DOMParser: 'readonly',
        Intl: 'readonly',
        
        // Node.js globals (for scripts and tests)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      
      // Allow console.log for development/debugging
      'no-console': 'off',
      
      // Allow unused variables starting with underscore
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      
      // Prefer const for variables that are never reassigned
      'prefer-const': 'warn',
      
      // Require semicolons
      'semi': ['error', 'always'],
      
      // Enforce consistent indentation (2 spaces to match existing codebase)
      'indent': ['error', 2],
      
      // Enforce consistent quotes (single quotes)
      'quotes': ['error', 'single'],
      
      // Allow trailing commas in multiline
      'comma-dangle': ['error', 'only-multiline'],
      
      // Enable strict undef checking
      'no-undef': 'error',
      'no-redeclare': 'warn'
    }
  },
  {
    // Node.js specific configuration for scripts
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        // Additional Node.js globals for scripts
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  },
  {
    // Test-specific configuration
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        
        // JSDOM globals for testing
        global: 'readonly'
      }
    }
  }
];