import { expect, test } from '@playwright/test';

test('pages Ressource : panneau latéral et bouton Exporter en bas à droite', async ({ page }) => {
  await page.goto('/ressources/logo');
  const toggle = page.getByRole('button', { name: 'Modifier les ressources' });
  const download = page.getByRole('button', { name: 'Exporter toutes les ressources (.zip)' });

  // Le bouton Exporter est en bas à droite de l'écran, sous le bouton de panneau.
  const viewport = page.viewportSize()!;
  const box = (await download.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 60);
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 60);
  expect((await toggle.boundingBox())!.y).toBeLessThan(box.y);

  // Ouvert, le panneau prend la place de la bande : son en-tête le replie, l'export est en bas.
  await toggle.click();
  const panel = page.getByRole('complementary', { name: 'Panneau latéral' });
  await expect(panel).toBeVisible();
  await expect(toggle).toBeHidden();
  await expect(panel.getByRole('button', { name: 'Éditeur' })).toBeFocused();
  await expect(panel.getByRole('button', { name: 'Exporter toutes les ressources' })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Panneau latéral' })).toBeHidden();
  await expect(toggle).toBeFocused();
});
