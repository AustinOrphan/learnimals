module.exports = {
  root: true,
  
  // Environment configuration
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: false, // We use Vitest, not Jest
  },
  
  // Parser configuration
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  
  // Extended configurations (only using what's currently available)
  extends: [
    'eslint:recommended'
  ],
  
  // Global variables specific to Learnimals
  globals: {
    // Browser APIs
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    console: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    fetch: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    
    // Canvas and Graphics APIs
    HTMLCanvasElement: 'readonly',
    CanvasRenderingContext2D: 'readonly',
    Image: 'readonly',
    ImageData: 'readonly',
    Path2D: 'readonly',
    
    // Animation and Timing APIs
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    performance: 'readonly',
    
    // Event APIs
    Event: 'readonly',
    CustomEvent: 'readonly',
    EventTarget: 'readonly',
    
    // DOM APIs
    Element: 'readonly',
    HTMLElement: 'readonly',
    HTMLInputElement: 'readonly',
    HTMLButtonElement: 'readonly',
    HTMLFormElement: 'readonly',
    HTMLImageElement: 'readonly',
    HTMLAudioElement: 'readonly',
    HTMLVideoElement: 'readonly',
    Node: 'readonly',
    NodeList: 'readonly',
    DOMParser: 'readonly',
    MutationObserver: 'readonly',
    ResizeObserver: 'readonly',
    IntersectionObserver: 'readonly',
    
    // Web APIs
    WebSocket: 'readonly',
    Worker: 'readonly',
    ServiceWorker: 'readonly',
    
    // Testing globals (Vitest)
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    vi: 'readonly',
    vitest: 'readonly'
  },
  
  // Enhanced rule configuration
  rules: {
    // Error Prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-unreachable': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    'no-undef': 'error',
    'no-redeclare': 'error',
    'no-shadow': 'error',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    
    // Code Quality
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines': ['warn', 300],
    'max-lines-per-function': ['warn', 50],
    'max-params': ['warn', 4],
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2, 100, 1000],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true 
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // ES6+ Features
    'arrow-body-style': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'prefer-destructuring': ['error', {
      array: true,
      object: true
    }, {
      enforceForRenamedProperties: false
    }],
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'dot-notation': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'warn',
    'no-implicit-coercion': 'error',
    'no-lonely-if': 'error',
    'no-throw-literal': 'error',
    'no-unneeded-ternary': 'error',
    'no-useless-return': 'error',
    'prefer-object-spread': 'error',
    'yoda': 'error',
    
    // Style (basic formatting)
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'only-multiline'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'comma-spacing': ['error', { before: false, after: true }],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'space-before-blocks': 'error',
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error'
  },
  
  // Override rules for specific file patterns
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        jest: false,
        node: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly'
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'no-unused-expressions': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '.*rc.js', 'scripts/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Game files - allow more complexity
      files: ['src/features/games/**/*.js', 'src/components/games/**/*.js'],
      rules: {
        'complexity': ['warn', 15],
        'max-lines-per-function': ['warn', 75],
        'no-magic-numbers': 'off' // Games often have magic numbers for coordinates, etc.
      }
    }
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'public/serviceWorker.js', // Generated file
    'tests/coverage/',
    'tests/results/'
  ]
};