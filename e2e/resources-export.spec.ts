import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Exports réels des Ressources : logos déclinés (SVG, PNG, PDF), polices en .zip.
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><rect width="20" height="20" fill="#000"/><circle cx="30" cy="10" r="10"/></svg>';

async function download(page: Page, name: string | RegExp) {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name }).click(),
  ]);
  return { name: file.suggestedFilename(), data: await readFile((await file.path())!) };
}

test('Logo : chaque déclinaison s’exporte en SVG, PNG et PDF', async ({ page }) => {
  await page.goto('/ressources/logo');
  await page.evaluate((svg) => {
    localStorage.setItem(
      'bhc.store.res-colors',
      JSON.stringify({ a: { group: 'principale', name: 'Orange', hex: '#EC5F14', order: 0 } }),
    );
    localStorage.setItem(
      'bhc.store.res-logo-groups',
      JSON.stringify({ principal: { name: 'Logo principal', svg, order: 0 } }),
    );
  }, LOGO);
  await page.reload();

  const svg = await download(page, 'Télécharger Logo principal Orange en SVG');
  expect(svg.name).toBe('logo-principal-orange.svg');
  expect(svg.data.toString()).toContain('#EC5F14');
  expect(svg.data.toString()).not.toContain('#000');

  const png = await download(page, 'Télécharger Logo principal Orange en PNG');
  expect(png.data.subarray(1, 4).toString()).toBe('PNG');

  const pdf = await download(page, 'Télécharger Logo principal Orange en PDF');
  expect(pdf.name).toBe('logo-principal-orange.pdf');
  expect(pdf.data.subarray(0, 4).toString()).toBe('%PDF');
});

test('Typographie : toute la famille Geist en .zip, avec chaque variante', async ({ page }) => {
  await page.goto('/ressources/typographie');
  const zip = await download(page, /Télécharger la famille complète/);
  expect(zip.name).toBe('geist.zip');
  expect(zip.data.subarray(0, 2).toString()).toBe('PK');
  const content = zip.data.toString('latin1');
  for (const file of ['Geist-Regular.ttf', 'Geist-BoldItalic.ttf', 'Geist-Variable.ttf', 'OFL.txt'])
    expect(content).toContain(file);
});
