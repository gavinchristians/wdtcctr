import { test, expect } from '@playwright/test';

test('app boots and renders the game canvas', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));

  await page.goto('/');

  const shell = page.getByTestId('app-shell');
  await expect(shell).toBeVisible();

  const canvas = page.getByTestId('game-canvas').locator('canvas');
  await expect(canvas).toBeVisible();

  const size = await canvas.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(size.width).toBeGreaterThan(0);
  expect(size.height).toBeGreaterThan(0);

  // Drive the directional input pipeline; if any handler throws (bad ref,
  // missing event listener, etc.) it surfaces as a pageerror.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);

  await expect(canvas).toBeVisible();
  expect(errors, errors.map((e) => e.message).join('\n')).toEqual([]);
});
