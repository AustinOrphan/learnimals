import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM testing (instead of 'node')
    environment: 'jsdom',
    
    // Global test settings
    globals: true,
    
    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],
    
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
    }
  },
  
  // Resolve configuration for imports (must match vite.config.js)
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@features': '/src/features',
      '@styles': '/src/styles',
      '@pages': '/src/pages',
      '@templates': '/src/templates',
      '@config': '/src/config.js',
      '@public': '/public',
      '@test': '/tests'
    }
  }
});