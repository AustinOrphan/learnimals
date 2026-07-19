import { createSmokeTests, createPageLoadTest, createLinkCheckTest } from '@austinorphan/e2e-core';

// Standard smoke tests
createSmokeTests({
  appName: 'Learnimals',
  expectedTitle: /Learnimals/i,
  hasNavigation: true,
  hasInteractiveElements: true,
  customChecks: [
    {
      name: 'heading is visible',
      check: async page => {
        const heading = page.locator('h1').first();
        await page.waitForSelector('h1', { timeout: 5000 });
      },
    },
  ],
});

// Test specific subject pages
createPageLoadTest('/src/features/subjects/math/math.html', {
  expectedHeading: /math/i,
});

// Verify navigation links work
createLinkCheckTest({
  selector: 'nav a',
  maxLinksToCheck: 5,
  skipExternal: true,
});
