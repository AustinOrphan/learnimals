import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

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
        '.github/',
        'dist/'
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
    deps: {
      inline: ['jsdom']
    }
  },
  
  // Resolve configuration for imports - aligned with vite.config.js
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@templates': fileURLToPath(new URL('./src/templates', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config.js', import.meta.url)),
      '@public': fileURLToPath(new URL('./public', import.meta.url)),
      '@test': fileURLToPath(new URL('./tests', import.meta.url))
    }
  },

  // Environment variables - align with vite.config.js
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
});