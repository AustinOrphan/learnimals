module.exports = {
  root: true,
  
  // Environment configuration
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: false, // We use Vitest, not Jest
    vitest: true
  },
  
  // Parser configuration
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  
  // Extended configurations
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:jsdoc/recommended',
    'plugin:security/recommended-legacy',
    'plugin:unicorn/recommended',
    'plugin:sonarjs/recommended',
    'plugin:promise/recommended',
    'plugin:n/recommended',
    'prettier' // Must be last to override other configs
  ],
  
  // Plugin configuration
  plugins: [
    'import',
    'jsdoc',
    'security',
    'unicorn', 
    'sonarjs',
    'promise',
    'n',
    'prettier'
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
  
  // Rule configuration
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // Error Prevention
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
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
    'template-curly-spacing': 'error',
    
    // ES6+ Features
    'arrow-body-style': ['error', 'as-needed'],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'prefer-destructuring': ['error', {
      array: true,
      object: true
    }, {
      enforceForRenamedProperties: false
    }],
    
    // Import/Export
    'import/order': ['error', {
      groups: [
        'builtin',
        'external', 
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],
    'import/no-unresolved': 'off', // Disabled due to browser module resolution
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    'import/no-default-export': 'off',
    'import/prefer-default-export': 'off',
    
    // JSDoc
    'jsdoc/require-description': 'warn',
    'jsdoc/require-description-complete-sentence': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'warn',
    'jsdoc/newline-after-description': 'warn',
    
    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Unicorn (Modern JS practices)
    'unicorn/filename-case': ['error', { case: 'camelCase' }],
    'unicorn/prevent-abbreviations': 'off', // Too restrictive for our use case
    'unicorn/no-array-reduce': 'off', // Reduce is useful
    'unicorn/no-null': 'off', // null is sometimes needed
    'unicorn/prefer-module': 'off', // We use CommonJS for some files
    'unicorn/prefer-top-level-await': 'off', // Not always appropriate
    'unicorn/numeric-separators-style': 'error',
    'unicorn/prefer-array-some': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/throw-new-error': 'error',
    
    // SonarJS (Bug detection)
    'sonarjs/cognitive-complexity': ['warn', 15],
    'sonarjs/max-switch-cases': ['warn', 10],
    'sonarjs/no-all-duplicated-branches': 'error',
    'sonarjs/no-collapsible-if': 'error',
    'sonarjs/no-collection-size-mischeck': 'error',
    'sonarjs/no-duplicate-string': ['warn', 3],
    'sonarjs/no-duplicated-branches': 'error',
    'sonarjs/no-element-overwrite': 'error',
    'sonarjs/no-empty-collection': 'error',
    'sonarjs/no-extra-arguments': 'error',
    'sonarjs/no-identical-conditions': 'error',
    'sonarjs/no-identical-expressions': 'error',
    'sonarjs/no-ignored-return': 'error',
    'sonarjs/no-inverted-boolean-check': 'error',
    'sonarjs/no-one-iteration-loop': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-redundant-jump': 'error',
    'sonarjs/no-same-line-conditional': 'error',
    'sonarjs/no-small-switch': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/no-use-of-empty-return-value': 'error',
    'sonarjs/non-existent-operator': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/prefer-object-literal': 'error',
    'sonarjs/prefer-single-boolean-return': 'error',
    'sonarjs/prefer-while': 'error',
    
    // Promise handling
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'error',
    'promise/valid-params': 'error',
    
    // Node.js specific (for scripts)
    'n/no-unsupported-features/es-syntax': 'off', // We support modern ES features
    'n/no-missing-import': 'off', // Browser modules don't follow Node resolution
    'n/no-extraneous-import': 'off',
    'n/file-extension-in-import': 'off'
  },
  
  // Override rules for specific file patterns
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        vitest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'jsdoc/require-jsdoc': 'off'
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '.*rc.js', 'scripts/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off',
        'jsdoc/require-jsdoc': 'off',
        'unicorn/prefer-module': 'off'
      }
    },
    {
      // Component files - stricter JSDoc requirements
      files: ['src/components/**/*.js'],
      rules: {
        'jsdoc/require-jsdoc': ['error', {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false
          }
        }]
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
  
  // Settings for plugins
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json']
      }
    },
    jsdoc: {
      mode: 'jsdoc'
    }
  },
  
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