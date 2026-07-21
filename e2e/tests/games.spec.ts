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

// Bubble Pop was migrated to the BaseGame version (BubblePopGameTemplate):
//  - it now extends BaseGame,
//  - BaseGame sizes the canvas buffer to its display box (no mobile squish),
//  - Bubble.update() floats bubbles up and off the top (was bobbing in place).
// Each browser-side block re-scans window because GameTemplateLoader's global
// name isn't guaranteed (installs a findGame() on window for reuse).
const INSTALL_FINDER = () => {
  (window as any).findGame = () => {
    for (const k of Object.keys(window)) {
      const v = (window as any)[k];
      if (v && Array.isArray(v.bubbles) && v.canvas) return v;
      if (v && v.game && Array.isArray(v.game.bubbles)) return v.game;
    }
    return null;
  };
};

test.describe('bubble-pop', () => {
  test('runs the BaseGame version without a squished canvas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/games/bubble-pop/');
    await page.waitForSelector('canvas');
    await page.evaluate(INSTALL_FINDER);
    await page.waitForFunction(() => (window as any).findGame());
    const info = await page.evaluate(() => {
      const g = (window as any).findGame();
      const c = g.canvas as HTMLCanvasElement;
      const r = c.getBoundingClientRect();
      return {
        className: g.constructor.name,
        bufAR: c.width / c.height,
        cssAR: r.width / r.height,
      };
    });
    expect(info.className).toBe('BubblePopGameTemplate');
    // Buffer aspect ratio must match the display box (no squish).
    expect(Math.abs(info.bufAR - info.cssAR)).toBeLessThan(0.05);
  });

  test('bubbles float up into view and a correct pop scores', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1100 });
    await page.goto('/games/bubble-pop/');
    const canvas = page.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    await page.evaluate(INSTALL_FINDER);
    await page.waitForFunction(() => (window as any).findGame());
    // Wait for the correct bubble to rise inside the visible canvas.
    await page.waitForFunction(
      () => {
        const g = (window as any).findGame();
        if (!g) return false;
        const cb = g.bubbles.find((b: any) => b.isCorrect);
        return cb && cb.y > cb.radius && cb.y < g.canvas.height - cb.radius;
      },
      undefined,
      { timeout: 10000 }
    );
    const before = await page.evaluate(() => (window as any).findGame().score);
    const pos = await page.evaluate(() => {
      const g = (window as any).findGame();
      const cb = g.bubbles.find((b: any) => b.isCorrect);
      const c = g.canvas;
      const r = c.getBoundingClientRect();
      return { x: cb.x * (r.width / c.width), y: cb.y * (r.height / c.height) };
    });
    await canvas.click({ position: pos });
    await expect
      .poll(() => page.evaluate(() => (window as any).findGame().score))
      .toBeGreaterThan(before);
  });
});
