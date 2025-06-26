/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [
      'tests/integration/**/*.{test,spec}.js'
    ],
    name: 'integration',
    environment: 'happy-dom',
    testTimeout: 30000
  }
});