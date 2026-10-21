import { expect, test } from '@playwright/test';

test.describe('petit écran (1024 px)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('la colonne de gauche se replie et se rouvre, le contenu reste utilisable', async ({ page }) => {
    await page.goto('/outils/motif');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    const menu = page.getByRole('button', { name: 'Ouvrir le menu' });

    await expect(nav).toBeHidden();
    await expect(page.getByRole('complementary', { name: 'Éditeur' })).toBeVisible();

    await menu.click();
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toBeFocused();

    await nav.getByRole('link', { name: 'Illustration' }).click();
    await expect(page).toHaveURL('/outils/illustration');
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('Échap et le clic sur le voile ferment le menu', async ({ page }) => {
    await page.goto('/ressources/logo');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    const menu = page.getByRole('button', { name: 'Ouvrir le menu' });

    await menu.click();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();

    await menu.click();
    await page.mouse.click(900, 400);
    await expect(nav).toBeHidden();
  });

  test('rien ne déborde horizontalement', async ({ page }) => {
    for (const path of ['/outils/layout-editor', '/ressources/inspiration']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
});
