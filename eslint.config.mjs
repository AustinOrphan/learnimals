import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      '_site/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.claudeCodeStuffToStashForNow/**',
      'dedupe-archive/**',
    ],
  },
  {
    // Apply to all JS files
    files: ['**/*.js'],
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
        Blob: 'readonly',
        URL: 'readonly',

        // Observer APIs
        ResizeObserver: 'readonly',
        PerformanceObserver: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',

        // Speech API
        SpeechSynthesisUtterance: 'readonly',
        speechSynthesis: 'readonly',

        // Module system (for ES modules)
        module: 'readonly',

        // Component classes (project-specific)
        BaseComponent: 'readonly',
        createCharacter: 'readonly',

        // Additional browser APIs
        indexedDB: 'readonly',
        confirm: 'readonly',
        Event: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      // Allow console.log for development/debugging
      'no-console': 'off',

      // Allow unused variables starting with underscore
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Prefer const for variables that are never reassigned
      'prefer-const': 'warn',

      // Formatting (semicolons, indentation, quotes, trailing commas) is
      // owned by Prettier (.prettierrc.json) — stylistic ESLint rules were
      // removed 2026-07-19 because the two fought over edge cases (3,400+
      // false errors after a full prettier pass). ESLint owns correctness.

      // Enable strict undef checking
      'no-undef': 'error',
      'no-redeclare': 'warn',
    },
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
        __filename: 'readonly',
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
      },
    },
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
        test: 'readonly',

        // JSDOM globals for testing
        global: 'readonly',

        // Node.js globals for tests
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',

        // Test utilities
        testUtils: 'readonly',
        TestDataUtils: 'readonly',
      },
    },
  },
  {
    // Special configuration for character generation test file
    files: ['character-generation/test-character-system.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    // Service worker context (root shim + public worker)
    files: ['**/serviceWorker.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        importScripts: 'readonly',
        skipWaiting: 'readonly',
        registration: 'readonly',
      },
    },
  },
  {
    // Node-run config + build scripts at the repo root
    files: ['*.config.js', '*.config.mjs', 'vitest.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
];
