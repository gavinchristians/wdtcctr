import { test, expect } from '@playwright/test';

test('app boots and renders the game canvas', async ({ page }) => {
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
});
