import { expect, test } from '@playwright/test';

test('pages Ressource : panneau latéral et bouton Télécharger en bas à droite', async ({ page }) => {
  await page.goto('/ressources/logo');
  const toggle = page.getByRole('button', { name: 'Panneau latéral' });
  const download = page.getByRole('button', { name: 'Télécharger' });

  // Le bouton Télécharger est en bas à droite de l'écran, sous le bouton de panneau.
  const viewport = page.viewportSize()!;
  const box = (await download.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 60);
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 60);
  expect((await toggle.boundingBox())!.y).toBeLessThan(box.y);

  await toggle.click();
  await expect(page.getByRole('complementary', { name: 'Panneau latéral' })).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Panneau latéral' })).toBeHidden();
  await expect(toggle).toBeFocused();
});
