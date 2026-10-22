import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Layout editor : un motif placé dans le frame, rendu par le moteur, exporté et enregistré.
async function addMotif(page: Page) {
  await page.goto('/outils/layout-editor');
  await page.getByRole('main').getByRole('button', { name: 'Motif', exact: true }).first().click();
  const preview = page.locator('main canvas[aria-hidden="true"]');
  // le moteur dessine le calque : des pixels apparaissent dans l'aperçu
  await expect
    .poll(
      () =>
        preview.evaluate((canvas: HTMLCanvasElement) => {
          const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
          let drawn = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 0) drawn++;
          return drawn;
        }),
      { timeout: 15000 },
    )
    .toBeGreaterThan(500);
}

test('un motif remplit le frame et suit le format', async ({ page }) => {
  await addMotif(page);
  await expect(page.getByRole('textbox', { name: 'Largeur' })).toHaveValue('1080');
  await expect(page.getByRole('textbox', { name: 'Hauteur' })).toHaveValue('1920');
  await page.getByRole('button', { name: '1:1', exact: true }).click();
  await expect(page.getByText('1080×1080')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Hauteur' })).toHaveValue('1080');
  // déplacé au clavier depuis la scène
  await page.getByRole('textbox', { name: 'Position X' }).fill('40');
  await page.getByRole('textbox', { name: 'Position X' }).press('Enter');
  await expect(page.getByRole('textbox', { name: 'Position X' })).toHaveValue('40');
  // le layout est gardé après un rechargement
  await page.reload();
  await expect(page.getByRole('button', { name: 'Motif 1', exact: true })).toBeVisible();
  await expect(page.getByText('1080×1080')).toBeVisible();
});

test('export du frame en PNG, à la taille du format', async ({ page }) => {
  await addMotif(page);
  await page.getByRole('button', { name: 'Export', expanded: false }).click();
  await page.getByRole('button', { name: '2x' }).click();
  const [file] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.getByRole('button', { name: 'Exporter', exact: true }).click(),
  ]);
  expect(file.suggestedFilename()).toBe('brand-hub-co-labs-frame-1-2160x3840.png');
  const data = await readFile((await file.path())!);
  expect({ w: data.readUInt32BE(16), h: data.readUInt32BE(20) }).toEqual({ w: 2160, h: 3840 });
});

test('enregistrer le layout le demande le code, puis l’ajoute aux Patterns prédéfinis', async ({ page }) => {
  await addMotif(page);
  await page.getByRole('button', { name: 'Export', expanded: false }).click();
  const save = page.getByRole('button', { name: /Enregistrer dans Patterns prédéfinis/ });
  await save.click();
  await expect(page.getByLabel(/Code éditeur/)).toBeVisible();

  // mode édition déjà ouvert dans l'onglet (comme après un déverrouillage sur une page Ressource)
  await page.evaluate(() => sessionStorage.setItem('bhc.editorCode', 'code-de-test'));
  await page.reload();
  await page.getByRole('button', { name: 'Export', expanded: false }).click();
  await save.click();
  await expect(page.getByRole('status')).toContainText('enregistré dans Patterns prédéfinis', {
    timeout: 15000,
  });

  await page.goto('/ressources/patterns');
  await page.getByRole('button', { name: '9:16' }).click();
  await expect(page.getByRole('button', { name: 'Agrandir Frame 1' })).toBeVisible();
});
