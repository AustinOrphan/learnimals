import { test, expect } from '@playwright/test';

test.describe('Animals subject', () => {
  test('gallery shows the animals and links to a meet view', async ({ page }) => {
    await page.goto('/subjects/animals/');
    const cards = page.locator('.animal-card');
    await expect(cards).toHaveCount(7);

    await page.locator('.animal-card[href="#shark"]').click();
    await expect(page).toHaveURL(/#shark$/);
    await expect(page.locator('#meet-heading')).toContainText('Mango the Shark');
  });

  test('tapping the art shows a greeting', async ({ page }) => {
    await page.goto('/subjects/animals/#parrot');
    await page.locator('.meet-art').click();
    await expect(page.locator('#meet-speech')).not.toBeEmpty();
  });

  test('a fun fact reveals on tap', async ({ page }) => {
    await page.goto('/subjects/animals/#panda');
    const fact = page.locator('.fact-card').first();
    await fact.click();
    await expect(fact).toHaveClass(/revealed/);
  });

  test('quiz scores a full correct set', async ({ page }) => {
    await page.goto('/subjects/animals/#shark');
    // Answer each question with its correct option, scoped to the radio's
    // value so shuffled option order and overlapping fact text can't cause
    // an ambiguous click.
    await page.locator('input[value="Fish"]').check();
    await page.locator('input[value="Trees"]').check();
    await page.locator('input[value="By smelling"]').check();
    await page.getByRole('button', { name: 'Check Answers' }).click();
    await expect(page.locator('#quiz-result')).toContainText('right');
  });

  test('respects reduced motion (no reacting class lingers)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/subjects/animals/#lion');
    await page.locator('.meet-art').click();
    await expect(page.locator('#meet-speech')).not.toBeEmpty();
    await expect(page.locator('.meet-art')).not.toHaveClass(/reacting/);
  });

  test('works on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/subjects/animals/');
    await expect(page.locator('.animal-card')).toHaveCount(7);
  });

  test('returning to the gallery moves focus to its heading', async ({ page }) => {
    await page.goto('/subjects/animals/#shark');
    await page.locator('.meet-back').click();
    await expect(page).not.toHaveURL(/#shark$/);
    await expect(page.locator('#gallery-heading')).toBeFocused();
  });
});
