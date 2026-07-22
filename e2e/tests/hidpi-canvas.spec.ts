import { test, expect } from '@playwright/test';

// Regression guard for the BaseGame HiDPI canvas bug: BaseGame.resizeCanvas()
// used to size the canvas backing store to devicePixelRatio while games laid
// out objects against `canvas.width`/`canvas.height` (the device-pixel-scaled
// buffer), so at DPR > 1 objects were positioned using an inflated bound and
// rendered roughly `dpr` times too far right/down — off the visible buffer.
// BaseGame now exposes logical (CSS-pixel) `this.width`/`this.height` that
// games lay out against, and scales the 2D context via an absolute
// `setTransform(dpr, 0, 0, dpr, 0, 0)` so drawing stays crisp and in-bounds
// at any device pixel ratio. This spec pins that contract for two of the
// five affected games (bubble-pop, ecosystem-safari) at DPR 2.
test.use({ deviceScaleFactor: 2 });

test.describe('BaseGame HiDPI canvas', () => {
  test('bubble-pop lays out bubbles within the HiDPI canvas buffer', async ({ page }) => {
    await page.goto('/games/bubble-pop/');
    await page.waitForFunction(() => {
      const w = window as any;
      for (const k of Object.keys(w)) {
        const v = w[k];
        if (v && Array.isArray(v.bubbles) && v.canvas) return true;
        if (v && v.game && Array.isArray(v.game.bubbles)) return true;
      }
      return false;
    });

    const result = await page.evaluate(() => {
      const w = window as any;
      let g: any = null;
      for (const k of Object.keys(w)) {
        const v = w[k];
        if (v && Array.isArray(v.bubbles) && v.canvas) g = v;
        else if (v && v.game && Array.isArray(v.game.bubbles)) g = v.game;
      }
      const active = g.bubbles.filter((b: any) => b.active !== false);
      const maxX = Math.max(...active.map((b: any) => b.x));
      const ctx = g.canvas.getContext('2d');
      const scaleX = ctx.getTransform().a;
      return { maxX, scaleX, canvasWidth: g.canvas.width };
    });

    expect(result.scaleX).toBeGreaterThan(1); // sanity: HiDPI transform is active
    expect(result.maxX * result.scaleX).toBeLessThanOrEqual(result.canvasWidth);
  });

  test('ecosystem-safari lays out creatures within the HiDPI canvas buffer', async ({ page }) => {
    await page.goto('/games/ecosystem-safari/');
    await page.waitForFunction(() => (window as any).ecosystemGame);
    await page.waitForFunction(
      () => ((window as any).ecosystemGame.creatures || []).length > 0,
      undefined,
      { timeout: 15000 }
    );

    const result = await page.evaluate(() => {
      const g = (window as any).ecosystemGame;
      const creatures = g.creatures;
      const maxX = Math.max(...creatures.map((c: any) => c.x));
      const maxY = Math.max(...creatures.map((c: any) => c.y));
      const ctx = g.canvas.getContext('2d');
      const t = ctx.getTransform();
      return {
        maxX,
        maxY,
        scaleX: t.a,
        scaleY: t.d,
        canvasWidth: g.canvas.width,
        canvasHeight: g.canvas.height,
      };
    });

    expect(result.scaleX).toBeGreaterThan(1); // sanity: HiDPI transform is active
    expect(result.maxX * result.scaleX).toBeLessThanOrEqual(result.canvasWidth);
    expect(result.maxY * result.scaleY).toBeLessThanOrEqual(result.canvasHeight);
  });
});
