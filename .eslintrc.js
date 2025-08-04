module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],

    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // Allow console.log for development/debugging
        'no-console': 'off',
        
        // Allow unused variables starting with underscore
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        
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
        
        // Enable strict undef checking with proper globals defined
        'no-undef': 'error',
        'no-redeclare': 'warn',
        
        // Prevent mixed module patterns through code quality rules
        'no-restricted-syntax': [
            'error',
            // Prevent module.exports usage
            {
                'selector': 'AssignmentExpression[left.type="MemberExpression"][left.object.name="module"][left.property.name="exports"]',
                'message': 'CommonJS module.exports is forbidden. Use ES6 export default or named exports instead.'
            },
            // Prevent typeof module checks  
            {
                'selector': 'BinaryExpression[left.type="UnaryExpression"][left.operator="typeof"][left.argument.name="module"]',
                'message': 'Mixed module pattern detected (typeof module check). Use clean ES6 modules only.'
            },
            // Prevent direct window assignments (with some exceptions)
            {
                'selector': 'AssignmentExpression[left.type="MemberExpression"][left.object.name="window"]:not([left.property.name="LearnimalsModuleRegistry"]):not([left.property.name="convertNumber"])',
                'message': 'Direct window assignments should be avoided. Use ModuleRegistry for component registration or explicit exceptions for legacy compatibility.'
            }
        ],
        
        // Additional quality rules for modern JS
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'warn',
        'prefer-template': 'warn',

    },
    globals: {
        // Browser globals
        'window': 'readonly',
        'document': 'readonly',
        'console': 'readonly',
        'navigator': 'readonly',
        'localStorage': 'readonly',
        'sessionStorage': 'readonly',
        'fetch': 'readonly',
        'performance': 'readonly',
        'getComputedStyle': 'readonly',
        
        // Canvas/WebGL globals
        'CanvasRenderingContext2D': 'readonly',
        'HTMLCanvasElement': 'readonly',
        'Image': 'readonly',
        
        // Animation globals
        'requestAnimationFrame': 'readonly',
        'cancelAnimationFrame': 'readonly',
        
        // Audio globals
        'AudioContext': 'readonly',
        'webkitAudioContext': 'readonly',
        
        // DOM Events and Elements
        'Element': 'readonly',
        'HTMLElement': 'readonly',
        'Event': 'readonly',
        'CustomEvent': 'readonly',
        'MouseEvent': 'readonly',
        'TouchEvent': 'readonly',
        'KeyboardEvent': 'readonly',
        
        // Timing functions
        'setTimeout': 'readonly',
        'clearTimeout': 'readonly',
        'setInterval': 'readonly',
        'clearInterval': 'readonly',
        
        // Math and utility globals
        'Math': 'readonly',
        'parseInt': 'readonly',
        'parseFloat': 'readonly',
        'isNaN': 'readonly',
        'isFinite': 'readonly'
    }
};
