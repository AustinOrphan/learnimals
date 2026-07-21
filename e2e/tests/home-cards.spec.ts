import { test, expect } from '@playwright/test';

// Regression guard: the homepage subject cards must be horizontally centred at
// every breakpoint — including a partial last row. CSS Grid auto-fit left-aligns
// an orphan card; the layout uses flexbox + justify-content:center so every
// wrapped row (and the lone last card) stays centred. See styles/base/styles.css.

/** Group the card links into visual rows by their top offset. */
async function rowCenterSkew(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const feats = document.querySelector('.features') as HTMLElement;
    const fb = feats.getBoundingClientRect();
    const cs = getComputedStyle(feats);
    const contentL = fb.left + parseFloat(cs.paddingLeft);
    const contentR = fb.right - parseFloat(cs.paddingRight);
    const links = [...document.querySelectorAll('.features .feature-card-link')];
    const rowsMap: Record<number, DOMRect[]> = {};
    links.forEach(l => {
      const b = l.getBoundingClientRect();
      const k = Math.round(b.top);
      (rowsMap[k] ??= []).push(b);
    });
    const skews = Object.values(rowsMap).map(row => {
      const left = row[0].left - contentL;
      const right = contentR - row[row.length - 1].right;
      return Math.abs(left - right);
    });
    const widths = new Set(links.map(l => Math.round(l.getBoundingClientRect().width)));
    return { maxRowSkew: Math.max(...skews), distinctWidths: widths.size };
  });
}

test.describe('Homepage subject cards', () => {
  // 768px puts the 5 cards into 2 columns, so the 5th is a lone last-row card —
  // the exact case CSS Grid left-aligned. 375px is single-column.
  for (const width of [375, 768, 1000]) {
    test(`every row is centred and cards are uniform width at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.waitForSelector('.features .feature-card-link');
      const { maxRowSkew, distinctWidths } = await rowCenterSkew(page);
      expect(maxRowSkew).toBeLessThanOrEqual(2); // rows centred (equal outer gutters)
      expect(distinctWidths).toBe(1); // all cards the same width
    });
  }
});
