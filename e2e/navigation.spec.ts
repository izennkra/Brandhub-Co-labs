import { expect, test } from '@playwright/test';

const TOOL_PAGES = [
  { path: '/outils/motif', title: 'Motif' },
  { path: '/outils/illustrations', title: 'Illustrations iconographique' },
  { path: '/outils/layout-editor', title: 'Layout editor' },
];

test("l'accueil redirige vers Motif", async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/outils/motif');
  await expect(page.getByRole('heading', { level: 1, name: 'Motif' })).toBeAttached();
});

test('on passe d’une page Tool à l’autre au clic', async ({ page }) => {
  await page.goto('/outils/motif');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });

  for (const { path, title } of TOOL_PAGES) {
    await nav.getByRole('link', { name: title }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeAttached();
    await expect(nav.getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
  }
});

for (const { path, title } of TOOL_PAGES) {
  test(`${title} s’ouvre par son adresse et reste affiché après rafraîchissement`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(`${title} · Brand Hub · Co-labs`);
    await page.reload();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeAttached();
  });
}

test('la navigation se fait au clavier', async ({ page }) => {
  await page.goto('/outils/motif');
  const target = page.getByRole('link', { name: 'Layout editor' });
  for (let i = 0; i < 5 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/outils/layout-editor');
});
