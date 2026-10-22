import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Exports réels depuis la page Motif : le fichier téléchargé est lu et vérifié.
async function openExport(page: Page) {
  await page.goto('/outils/motif');
  await expect(page.locator('main #scene')).toBeVisible();
  // le motif se construit après l'ouverture : on attend qu'il ait ses pastilles
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          // module servi par Vite en développement (chemin résolu dans la page, pas par TypeScript)
          const url = '/src/lib/pattern-engine/loadEngine.ts';
          const { loadEngine } = (await import(url)) as {
            loadEngine: () => Promise<{ core: { lastN: number } }>;
          };
          return (await loadEngine()).core.lastN;
        }),
      { timeout: 15000 },
    )
    .toBeGreaterThan(1000);
  await page.getByRole('button', { name: 'Export', expanded: false }).click();
}

async function download(page: Page, button: string, timeout = 30000) {
  const [file] = await Promise.all([
    page.waitForEvent('download', { timeout }),
    page.getByRole('button', { name: button }).click(),
  ]);
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) };
}

test('Image : un PNG en 16:9, à 2 fois la hauteur de la scène', async ({ page }) => {
  await openExport(page);
  await page.getByRole('button', { name: '2x' }).click();
  await page.getByRole('button', { name: 'PNG' }).click();
  const size = await page
    .locator('main #scene')
    .evaluate((canvas) => canvas.getBoundingClientRect())
    .then((r) => ({ w: Math.round(r.width), h: Math.round(r.height) }));
  const { name, data } = await download(page, 'Exporter');
  expect(name).toMatch(/^brand-hub-co-labs-\d{8}-\d{6}-2x\.png$/);
  expect(data.subarray(1, 4).toString()).toBe('PNG');
  // le Motif s'exporte toujours en 16:9, quel que soit le format de la scène
  expect({ w: data.readUInt32BE(16), h: data.readUInt32BE(20) }).toEqual({
    w: Math.round((size.h * 16) / 9) * 2,
    h: size.h * 2,
  });
});

test('SVG : le fil et les pastilles en formes vectorielles', async ({ page }) => {
  await openExport(page);
  await page.getByRole('button', { name: 'SVG' }).click();
  const { name, data } = await download(page, 'Exporter le SVG');
  expect(name).toMatch(/\.svg$/);
  const svg = data.toString();
  expect(svg).toContain('<g id="Pastilles">');
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!.map(Number);
  expect(w / h).toBeCloseTo(16 / 9, 2);
  expect(svg.match(/<rect /g)?.length ?? 0).toBeGreaterThan(100);
});

test('Vidéo : un enregistrement de 2 secondes', async ({ page }) => {
  await openExport(page);
  await page.getByRole('button', { name: 'Vidéo' }).click();
  const duration = page.getByRole('spinbutton', { name: 'Durée de la vidéo en secondes' });
  await duration.fill('2');
  await duration.blur();
  const { name, data } = await download(page, 'Enregistrer la vidéo');
  expect(name).toMatch(/\.(mp4|webm)$/);
  expect(data.length).toBeGreaterThan(1000);
});
