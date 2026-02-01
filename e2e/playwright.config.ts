import { createConfig } from '@austinorphan/e2e-core/playwright.config.base';

export default createConfig('learnimals', {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: './test-results',
});
