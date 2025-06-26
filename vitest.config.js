/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'happy-dom',
    
    // Test patterns
    include: [
      'tests/**/*.{test,spec}.js',
      'src/**/*.{test,spec}.js'
    ],
    
    // Global setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'tests/coverage',
      include: ['src/**/*.js'],
      exclude: [
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'node_modules/**',
        'tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test setup files
    setupFiles: ['tests/setup.js'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Reporter
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: 'tests/results/test-results.json',
      html: 'tests/results/test-results.html'
    }
  },
  
  // Resolve configuration for modules
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@features': '/src/features',
      '@styles': '/src/styles'
    }
  },
  
  // Define global variables for browser APIs
  define: {
    global: 'globalThis'
  }
});