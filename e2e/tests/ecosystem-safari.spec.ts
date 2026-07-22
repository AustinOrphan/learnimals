import { test, expect } from '@playwright/test';

test.describe('Ecosystem Safari', () => {
  test('loads the BaseGame version with a habitat, palette, and live panels', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await expect(page.locator('#ecosystem-canvas')).toBeVisible();
    await expect(page.locator('#eco-palette .eco-palette-item')).not.toHaveCount(0);
    await expect(page.locator('#eco-population-panel .eco-pop-row')).not.toHaveCount(0);
    expect(await page.evaluate(() => (window as any).ecosystemGame.constructor.name)).toBe(
      'EcosystemSafariGame'
    );
  });

  test('tapping a palette species adds it to the ecosystem', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    const before = await page.evaluate(
      () => (window as any).ecosystemGame.state_.populations.length
    );
    await page.locator('#eco-palette .eco-palette-item').first().click();
    await expect
      .poll(() => page.evaluate(() => (window as any).ecosystemGame.state_.populations.length))
      .toBeGreaterThan(before);
  });

  test('completing level 1 shows the win overlay with a lesson', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    // Add the intended species, then let the sim run out the survive timer.
    await page.locator('#eco-palette .eco-palette-item').first().click(); // rabbit is first in level 1 palette
    await expect(page.locator('#eco-win')).toBeVisible({ timeout: 40000 });
    await expect(page.locator('#eco-win-lesson')).not.toBeEmpty();
  });

  test('mobile viewport is playable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await expect(page.locator('#ecosystem-canvas')).toBeVisible();
  });
});
