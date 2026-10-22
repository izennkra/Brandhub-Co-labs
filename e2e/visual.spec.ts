import { expect, test } from '@playwright/test';

// Captures de référence des 11 pages à 1440 px (cadre validé face au Figma, tâche 10).
// Après un changement visuel voulu : npm run test:e2e -- visual --update-snapshots
const PAGES = [
  'outils/motif',
  'outils/illustration',
  'outils/layout-editor',
  'ressources/logo',
  'ressources/typographie',
  'ressources/couleur',
  'ressources/iconographie',
  'ressources/imagerie',
  'ressources/patterns',
  'ressources/inspiration',
  'ressources/qr-code',
];

for (const path of PAGES) {
  test(`rendu de référence : ${path}`, async ({ page }) => {
    await page.goto(`/${path}`);
    await page.evaluate(() => document.fonts.ready);
    // Iconographie : les icônes viennent du service visual.systems ; on attend la grille, puis on la masque.
    const icons = page.getByRole('list', { name: 'Icônes' });
    if (path.endsWith('iconographie')) await icons.waitFor();
    // La scène du moteur est animée : on la masque et on compare le cadre autour.
    await expect(page).toHaveScreenshot(`${path.replace('/', '-')}.png`, {
      maxDiffPixels: 50,
      threshold: 0.02,
      mask: [page.locator('main #scene'), icons],
    });
  });
}
