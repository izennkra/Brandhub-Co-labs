import { expect, test } from '@playwright/test';

test("l'application démarre sans erreur", async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  await expect(page).toHaveTitle('Brand Hub · Co-labs');
  await expect(page.getByRole('heading', { level: 1, name: 'co-labs' })).toBeVisible();
  expect(errors).toEqual([]);
});
