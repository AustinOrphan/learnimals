import { test, expect } from '@austinorphan/e2e-core';

test.describe('Learnimals Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Learnimals/i);

    // Check main heading exists
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check for subject links (Math, Science, Reading, Art, Coding)
    const mathLink = page.getByRole('link', { name: /math/i });
    await expect(mathLink).toBeVisible();
  });

  test('subject page loads', async ({ page }) => {
    await page.goto('/pages/math.html');

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();

    // Check for math-specific content
    const content = page.locator('main, .content, .container').first();
    await expect(content).toBeVisible();
  });
});
