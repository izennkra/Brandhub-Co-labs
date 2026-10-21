import { expect, test, type Page } from '@playwright/test';

const panel = (page: Page) => page.getByRole('complementary', { name: 'Éditeur' });
const stageWidth = (page: Page) =>
  page.locator('main [aria-busy]').evaluate((el) => el.getBoundingClientRect().width);

test('le panneau Éditeur se masque, la zone centrale s’élargit, puis il revient', async ({ page }) => {
  await page.goto('/outils/motif');
  await expect(panel(page)).toBeVisible();
  const before = await stageWidth(page);

  await page.getByRole('button', { name: 'Éditeur' }).click();
  await expect(panel(page)).toBeHidden();
  expect(await stageWidth(page)).toBeGreaterThan(before + 200);

  const reopen = page.getByRole('button', { name: 'Afficher l’éditeur' });
  await expect(reopen).toBeFocused();
  await reopen.click();
  await expect(panel(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Éditeur' })).toBeFocused();
});

test('la touche H masque et réaffiche le panneau', async ({ page }) => {
  await page.goto('/outils/layout-editor');
  // Attendre que la page soit prête (raccourci clavier branché) avant d'appuyer sur H.
  await expect(panel(page)).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('h');
  await expect(panel(page)).toBeHidden();
  await page.keyboard.press('h');
  await expect(panel(page)).toBeVisible();
});

test('une section se déplie au clavier', async ({ page }) => {
  await page.goto('/outils/motif');
  const toggle = page.getByRole('button', { name: 'Rotation' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'Rotation' })).toBeVisible();
});
