import { test, expect } from '@playwright/test';

test('homepage shows toolbar and canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Platform Atlas');
  await expect(page.locator('canvas')).toBeVisible();
});

test('toolbar contains action buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Roadmap' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suggest' })).toBeVisible();
});
