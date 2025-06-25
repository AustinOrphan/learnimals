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
        
        // Disable some rules that might be too strict for a learning project
        'no-undef': 'off', // Canvas/DOM globals might not be recognized
        'no-redeclare': 'warn'
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
        
        // Canvas/WebGL globals
        'CanvasRenderingContext2D': 'readonly',
        'HTMLCanvasElement': 'readonly',
        
        // Game-specific globals that might be used
        'requestAnimationFrame': 'readonly',
        'cancelAnimationFrame': 'readonly'
    }
};
