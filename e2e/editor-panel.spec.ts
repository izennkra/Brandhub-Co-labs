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

test('les réglages du Motif se règlent au clavier et pilotent le moteur', async ({ page }) => {
  await page.goto('/outils/motif');
  const lobes = panel(page).getByRole('slider', { name: 'Renflements' });
  await expect(lobes).toBeVisible({ timeout: 15000 });
  await lobes.focus();
  await page.keyboard.press('End');
  await expect(lobes).toHaveAttribute('aria-valuetext', '12');
  await page.keyboard.press('Home');
  await expect(lobes).toHaveAttribute('aria-valuetext', '1');
  await page.keyboard.press('ArrowRight');
  await expect(lobes).toHaveAttribute('aria-valuetext', '2');

  // Membrane → Ligne : le préréglage de la Ligne s'applique (4 renflements), Réseau disparaît.
  await panel(page).getByRole('button', { name: 'Ligne' }).click();
  await expect(lobes).toHaveAttribute('aria-valuetext', '4');
  await expect(panel(page).getByRole('group', { name: 'Mode de la ligne' })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Réseau' })).toHaveCount(0);
});
