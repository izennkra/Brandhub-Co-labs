import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Layout editor : page d'essai (rien n'est enregistré) où l'on place des copies du motif et des
// illustrations, rendus par le moteur, nets à toute taille, manipulables en 3D, puis exportés.
type EngineHandle = {
  core: { S: Record<string, unknown>; imgList: { name: string; inLoop?: boolean }[] };
  layout: { live: { cam?: { theta: number } } | null };
};
const engine = <T>(page: Page, read: (e: EngineHandle) => T) =>
  page.evaluate(async (source) => {
    // module servi par Vite en développement (chemin résolu dans la page, pas par TypeScript)
    const url = '/src/lib/pattern-engine/loadEngine.ts';
    const { loadEngine } = (await import(url)) as { loadEngine: () => Promise<EngineHandle> };
    return new Function('e', `return (${source})(e)`)(await loadEngine()) as T;
  }, read.toString());

// pixels dessinés dans l'aperçu du premier calque de motif
const drawn = (page: Page) =>
  page
    .locator('main canvas[aria-hidden="true"]')
    .first()
    .evaluate((canvas: HTMLCanvasElement) => {
      const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
      let n = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
      return n;
    });

async function add(page: Page, kind: 'Motif' | 'Illustration') {
  await page.goto('/outils/layout-editor');
  await page.getByRole('main').getByRole('button', { name: kind, exact: true }).first().click();
  await expect.poll(() => drawn(page), { timeout: 15000 }).toBeGreaterThan(500);
}

const field = async (page: Page, name: string) =>
  Number(await page.getByRole('textbox', { name, exact: true }).inputValue());

test('le calque épouse la forme, à bord perdu ; rien n’est gardé au rechargement', async ({ page }) => {
  await add(page, 'Motif');
  const [x, y, w, h] = await Promise.all(
    ['Position X', 'Position Y', 'Largeur', 'Hauteur'].map((name) => field(page, name)),
  );
  // il couvre le frame 1080 × 1920, centré
  expect(x).toBeLessThanOrEqual(0);
  expect(y).toBeLessThanOrEqual(0);
  expect(x + w).toBeGreaterThanOrEqual(1080);
  expect(y + h).toBeGreaterThanOrEqual(1920);
  expect(Math.abs(x + w / 2 - 540)).toBeLessThanOrEqual(1);
  // fond transparent : les coins du calque sont vides
  const corner = await page
    .locator('main canvas[aria-hidden="true"]')
    .evaluate((c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 4, 4).data[3]);
  expect(corner).toBe(0);
  await page.getByRole('button', { name: '1:1', exact: true }).click();
  await expect(page.getByText('1080×1080')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Place un motif dans ce format.')).toBeVisible();
  await expect(page.getByText('1080×1920')).toBeVisible();
});

test('zoom du plan de travail : boutons, ⌘ + molette, ajuster', async ({ page }) => {
  await page.goto('/outils/layout-editor');
  await expect(page.getByText('1080×1920')).toBeVisible(); // le plan de travail a mesuré sa taille
  const zoom = page.getByRole('group', { name: 'Zoom du plan de travail' });
  const percent = async () => Number((await zoom.locator('span').textContent())!.replace(/\D/g, ''));
  const fitted = await percent();
  await zoom.getByRole('button', { name: 'Zoomer', exact: true }).click();
  expect(Math.abs((await percent()) - fitted * 1.25)).toBeLessThanOrEqual(1);
  await page.mouse.move(500, 400);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -300);
  await page.keyboard.up('Control');
  await expect.poll(percent).toBeGreaterThan(Math.round(fitted * 1.25));
  await zoom.getByRole('button', { name: 'Ajuster à l’écran' }).click();
  expect(await percent()).toBe(fitted);
});

test('agrandi, le motif reste net : l’aperçu est calculé à la taille affichée', async ({ page }) => {
  await add(page, 'Motif');
  for (const [name, value] of [
    ['Largeur', '2160'],
    ['Hauteur', '3840'],
  ]) {
    await page.getByRole('textbox', { name }).fill(value);
    await page.getByRole('textbox', { name }).press('Enter');
  }
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
  await page.getByRole('button', { name: 'Zoomer', exact: true }).click();
  const preview = page.locator('main canvas[aria-hidden="true"]').first();
  await expect
    .poll(() =>
      preview.evaluate(
        (c: HTMLCanvasElement) => c.width / (c.getBoundingClientRect().width * devicePixelRatio),
      ),
    )
    .toBeGreaterThanOrEqual(0.97);
});

test('double-clic : mode 3D ; tourner, déplacer, pivoter ; le fond se règle sur le frame', async ({
  page,
}) => {
  test.setTimeout(60000); // beaucoup d'étapes, lentes quand toute la suite tourne
  await page.goto('/outils/motif');
  await expect(page.locator('main #scene')).toBeVisible();
  const toolBg = await engine(page, (e) => e.core.S.bg);
  await add(page, 'Motif');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Dézoomer' }).click();
  const box = (await page.locator('main canvas[aria-hidden="true"]').boundingBox())!;
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  await page.mouse.dblclick(cx, cy);
  await expect(page.getByText(/Mode 3D ·/)).toBeVisible();
  // glisser : la forme tourne, puis le calque se réajuste
  const before = await engine(page, (e) => e.layout.live?.cam?.theta);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy, { steps: 6 });
  await page.mouse.up();
  expect(await engine(page, (e) => e.layout.live?.cam?.theta)).not.toBe(before);
  // poignée ✥ : déplacer
  const x0 = await field(page, 'Position X');
  const grip = (await page.getByTitle('Déplacer').boundingBox())!;
  await page.mouse.move(grip.x + 5, grip.y + 5);
  await page.mouse.down();
  await page.mouse.move(grip.x + 65, grip.y + 5, { steps: 4 });
  await page.mouse.up();
  expect(await field(page, 'Position X')).toBeGreaterThan(x0);
  // rond : pivoter
  const rotate = (await page.getByTitle(/Pivoter/).boundingBox())!;
  await page.mouse.move(rotate.x + 6, rotate.y + 6);
  await page.mouse.down();
  await page.mouse.move(rotate.x + 200, rotate.y + 150, { steps: 6 });
  await page.mouse.up();
  expect(await field(page, 'Rotation en degrés')).toBeGreaterThan(0);
  // fond : réglé sur le frame, les formes s'y fondent ; l'outil garde le sien
  await page.getByRole('radiogroup', { name: 'Fond du frame' }).getByLabel('Orange').check({ force: true });
  await expect.poll(() => engine(page, (e) => e.core.S.bg)).toBe('orange');
  await page.getByRole('link', { name: 'Motif' }).click();
  await expect.poll(() => engine(page, (e) => e.core.S.bg)).toBe(toolBg);
});

test('boucle d’illustrations propre au calque, dans l’ordre choisi', async ({ page }) => {
  await add(page, 'Illustration');
  await page.getByText('Boucle entre les illustrations').click();
  const loop = page.getByRole('list', { name: 'Illustrations de la boucle' });
  const names = await loop.locator('li').allTextContents();
  await loop.getByText(names[2]).click();
  await loop.getByText(names[0]).click();
  await expect(loop.locator('li').first()).toHaveText(`1. ${names[2]}`);
  await expect(loop.locator('li').nth(1)).toHaveText(`2. ${names[0]}`);
  await page.getByRole('button', { name: `Avancer ${names[0]} dans la boucle` }).click();
  await expect(loop.locator('li').first()).toHaveText(`1. ${names[0]}`);
  // la bibliothèque de l'outil Illustration ne bouge pas
  expect(await engine(page, (e) => e.core.imgList.map((i) => i.name))).toEqual(names);
});

test('export du frame en PNG, à la taille du format', async ({ page }) => {
  await add(page, 'Motif');
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
