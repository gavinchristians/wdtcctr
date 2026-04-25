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

  // Walk forward across the spawn lanes; this exercises the world hookup,
  // occupancy lookups, and camera follow without any expectations about
  // which tiles are open beyond the START_GRASS_LANES carve-out.
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(60);
  }

  // Exercise the Phase 3 yaw + input-queue paths: a right-then-up sequence
  // rotates the chicken twice in quick succession, stressing the queue's
  // single-slot capacity. This used to be the path most likely to throw if
  // queueing/yaw-dampening regressed.
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(40);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);

  // Slam into the kill zone repeatedly - inputs should be rejected
  // silently rather than throwing or blanking the canvas.
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(20);
  }

  await page.waitForTimeout(200);

  await expect(canvas).toBeVisible();
  expect(errors, errors.map((e) => e.message).join('\n')).toEqual([]);
});
