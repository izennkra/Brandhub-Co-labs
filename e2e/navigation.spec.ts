import { expect, test, type Page } from '@playwright/test';

const TOOL_PAGES = [
  { path: '/outils/motif', title: 'Motif' },
  { path: '/outils/illustration', title: 'Illustration' },
  { path: '/outils/layout-editor', title: 'Layout editor' },
];

const RESOURCE_PAGES = [
  { path: '/ressources/logo', title: 'Logo' },
  { path: '/ressources/typographie', title: 'Typographie' },
  { path: '/ressources/couleur', title: 'Couleur' },
  { path: '/ressources/iconographie', title: 'Iconographie' },
  { path: '/ressources/imagerie', title: 'Imagerie' },
  { path: '/ressources/patterns', title: 'Patterns prédéfinis' },
  { path: '/ressources/inspiration', title: 'Inspiration' },
];

const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Navigation principale' });
const sectionsNav = (page: Page) => page.getByRole('navigation', { name: 'Sections' });

test("l'accueil redirige vers Motif", async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/outils/motif');
  await expect(page.getByRole('heading', { level: 1, name: 'Motif' })).toBeAttached();
});

for (const [section, pages, first] of [
  ['Tool', TOOL_PAGES, '/outils/motif'],
  ['Ressource', RESOURCE_PAGES, '/ressources/logo'],
] as const) {
  test(`on parcourt toutes les pages ${section} au clic`, async ({ page }) => {
    await page.goto(first);
    for (const { path, title } of pages) {
      await mainNav(page).getByRole('link', { name: title }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeAttached();
      await expect(mainNav(page).getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
    }
  });
}

for (const { path, title } of [...TOOL_PAGES, ...RESOURCE_PAGES]) {
  test(`${title} s’ouvre par son adresse et reste affiché après rafraîchissement`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(`${title} · Brand Hub · Co-labs`);
    await page.reload();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeAttached();
  });
}

test('le sélecteur Tool / Ressource garde la dernière page de chaque section', async ({ page }) => {
  await page.goto('/outils/layout-editor');
  await sectionsNav(page).getByRole('link', { name: 'Ressource' }).click();
  await expect(page).toHaveURL('/ressources/logo');
  await mainNav(page).getByRole('link', { name: 'Inspiration' }).click();

  await sectionsNav(page).getByRole('link', { name: 'Tool' }).click();
  await expect(page).toHaveURL('/outils/layout-editor');
  await sectionsNav(page).getByRole('link', { name: 'Ressource' }).click();
  await expect(page).toHaveURL('/ressources/inspiration');
});

test('la navigation se fait au clavier', async ({ page }) => {
  await page.goto('/outils/motif');
  const target = page.getByRole('link', { name: 'Layout editor' });
  for (let i = 0; i < 8 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/outils/layout-editor');
});
