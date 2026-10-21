import { expect, test } from '@playwright/test';

// Captures de référence des 10 pages à 1440 px (cadre validé face au Figma, tâche 10).
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
];

for (const path of PAGES) {
  test(`rendu de référence : ${path}`, async ({ page }) => {
    await page.goto(`/${path}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${path.replace('/', '-')}.png`, {
      maxDiffPixels: 50,
      threshold: 0.02,
    });
  });
}
