import { test, expect } from '@playwright/test';

// Regression guards for two games that were fully broken:
//  - adventure-quest: the canvas click handler bailed before isPlaying was set,
//    so the intro Start button (drawn on the canvas) could never start the game.
//  - ecosystem-safari: init called a non-existent static window.Modal.show(),
//    throwing during construction so the game never initialised.

test.describe('adventure-quest', () => {
  test('clicking the intro Start button starts the game', async ({ page }) => {
    await page.goto('/games/adventure-quest/');
    // The loading overlay hides on a timer; wait for it before clicking.
    await page.waitForFunction(() => {
      const ls = document.getElementById('loadingScreen');
      return !ls || getComputedStyle(ls).display === 'none';
    });
    await page.waitForFunction(() => (window as any).adventureQuestGame?.startButtonBounds);
    expect(await page.evaluate(() => (window as any).adventureQuestGame.gameState.isPlaying)).toBe(
      false
    );
    // Click the centre of the on-canvas Start button (canvas → page coords).
    const pt = await page.evaluate(() => {
      const g = (window as any).adventureQuestGame;
      const c = g.canvas as HTMLCanvasElement;
      const r = c.getBoundingClientRect();
      const sb = g.startButtonBounds;
      return {
        x: r.left + (sb.x + sb.width / 2) * (r.width / c.width),
        y: r.top + (sb.y + sb.height / 2) * (r.height / c.height),
      };
    });
    await page.mouse.click(pt.x, pt.y);
    await expect
      .poll(() => page.evaluate(() => (window as any).adventureQuestGame.gameState.isPlaying))
      .toBe(true);
  });
});

test.describe('ecosystem-safari', () => {
  test('initialises without error and opens the welcome modal', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/games/ecosystem-safari/');
    // window.ecosystemGame is only set if construction completes (it used to throw).
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await expect(page.locator('.modal').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
