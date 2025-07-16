import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM testing (instead of 'node')
    environment: 'jsdom',
    
    // Global test settings
    globals: true,
    
    // Setup files to run before tests
    setupFiles: ['./tests/setup/enhanced-setup.js'],
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,ts}',
      'src/**/*.{test,spec}.{js,mjs,ts}'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/mockData/**',
        'scripts/',
        'docs/',
        '.github/'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    
    // Test timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['default'],
    
    // Mock configuration
    server: {
      deps: {
        inline: ['jsdom']
      }
    },
    
    // Environment-specific mocks to prevent dynamic import timeouts
    pool: 'forks'
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': '/src',
      '@test': '/tests',
      '@vitest/browser/context': '/tests/mocks/browser-context.js',
      // Navigation module mocks to prevent dynamic import timeouts
      '../../src/utils/navigationHelper.js': '/tests/mocks/navigationHelper.js',
      '../../src/components/layout/navigation.js': '/tests/mocks/navigation.js',
      '../../src/components/layout/navbarLoader.js': '/tests/mocks/navbarLoader.js'
    }
  }
});