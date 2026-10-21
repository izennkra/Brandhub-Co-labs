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

test('les tokens et la police Geist sont appliqués', async ({ page }) => {
  await page.goto('/');

  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(235, 226, 217)');
  await expect(body).toHaveCSS('color', 'rgb(67, 22, 4)');
  await expect(body).toHaveCSS('font-size', '14px');

  const geistLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('14px "Geist Variable"');
  });
  expect(geistLoaded).toBe(true);
});
