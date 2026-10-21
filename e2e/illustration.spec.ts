import { expect, test, type Page } from '@playwright/test';

// Image PNG de 1 × 1 pixel, pour l'import.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

const panel = (page: Page) => page.getByRole('complementary', { name: 'Éditeur' });
const names = (page: Page) =>
  panel(page)
    .getByRole('list', { name: 'Images' })
    .getByRole('listitem')
    .locator('button[aria-current]')
    .allTextContents();

test('Illustration : ajouter, garder après rafraîchissement, réordonner et retirer une image', async ({
  page,
}) => {
  await page.goto('/outils/illustration');
  const strip = page.getByRole('group', { name: 'Bande d’images' });
  await expect(strip).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(3);
  const demo = await names(page);

  await page
    .getByLabel('Importer des images')
    .setInputFiles({ name: 'carre.png', mimeType: 'image/png', buffer: PNG });
  await expect.poll(() => names(page)).toEqual([...demo, 'carre']);
  await expect(panel(page).getByRole('button', { name: 'carre', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(strip.getByRole('button', { name: 'Afficher carre' })).toBeVisible();

  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual([...demo, 'carre']);

  await panel(page).getByRole('button', { name: 'Déplacer carre' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => names(page)).toEqual([demo[0], demo[1], 'carre', demo[2]]);
  // Le moteur enregistre l'ordre 600 ms après le dernier changement (saveImageMeta du prototype).
  await page.waitForTimeout(1000);
  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual([demo[0], demo[1], 'carre', demo[2]]);

  await panel(page).getByRole('button', { name: 'Supprimer carre' }).click();
  await panel(page).getByRole('button', { name: 'Confirmer la suppression de carre' }).click();
  await expect.poll(() => names(page)).toEqual(demo);
  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual(demo);
});

test('Illustration : choisir une image dans le bandeau la montre dans la liste', async ({ page }) => {
  await page.goto('/outils/illustration');
  const strip = page.getByRole('group', { name: 'Bande d’images' });
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(3);
  const [, second] = await names(page);
  await strip.getByRole('button', { name: `Afficher ${second}` }).click();
  await expect(panel(page).getByRole('button', { name: second, exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
});
