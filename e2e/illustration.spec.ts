import { expect, test, type Page } from '@playwright/test';

// Image PNG de 1 × 1 pixel, pour l'import.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

// Bibliothèque de départ : les 2 modèles 3D (en tête) et les 3 images du moteur.
const START = 5;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Éditeur' });
const names = (page: Page) =>
  panel(page)
    .getByRole('list', { name: 'Images' })
    .getByRole('listitem')
    .locator('button[aria-current]')
    .allTextContents()
    .then((all) => all.map((name) => name.replace(' · non enregistrée', '')));

test('Illustration : une image ajoutée ne reste que si on l’enregistre ; réordonner et retirer', async ({
  page,
}) => {
  await page.goto('/outils/illustration');
  const strip = page.getByRole('group', { name: 'Bande d’images' });
  await expect(strip).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(START);
  const demo = await names(page);
  const add = () =>
    page
      .getByLabel('Importer des images')
      .setInputFiles({ name: 'carre.png', mimeType: 'image/png', buffer: PNG });

  // Sans « Enregistrer », l'image ne vit que le temps de la visite.
  await add();
  await expect.poll(() => names(page)).toEqual([...demo, 'carre']);
  await expect(panel(page).getByRole('button', { name: 'carre · non enregistrée' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(strip.getByRole('button', { name: 'Afficher carre' })).toBeVisible();
  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual(demo);

  // Enregistrée : elle reste, pour tout le monde.
  await add();
  await expect.poll(() => names(page)).toEqual([...demo, 'carre']);
  await panel(page).getByRole('button', { name: 'Enregistrer l’illustration' }).click();
  await expect(panel(page).getByRole('button', { name: 'carre', exact: true })).toBeVisible();
  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual([...demo, 'carre']);

  await panel(page).getByRole('button', { name: 'Déplacer carre' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => names(page)).toEqual([...demo.slice(0, -1), 'carre', ...demo.slice(-1)]);
  await page.waitForTimeout(500);
  await page.reload();
  await expect
    .poll(() => names(page), { timeout: 15000 })
    .toEqual([...demo.slice(0, -1), 'carre', ...demo.slice(-1)]);

  // site sans stockage partagé : tout reste dans ce navigateur, la croix supprime pour de bon
  await panel(page).getByRole('button', { name: 'Supprimer définitivement carre' }).click();
  await panel(page).getByRole('button', { name: 'Confirmer la suppression définitive de carre' }).click();
  await expect.poll(() => names(page)).toEqual(demo);
  await page.reload();
  await expect.poll(() => names(page), { timeout: 15000 }).toEqual(demo);
});

test('Illustration : choisir une image dans le bandeau la montre dans la liste', async ({ page }) => {
  await page.goto('/outils/illustration');
  const strip = page.getByRole('group', { name: 'Bande d’images' });
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(START);
  const [, second] = await names(page);
  await strip.getByRole('button', { name: `Afficher ${second}` }).click();
  await expect(panel(page).getByRole('button', { name: second, exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

// Luminosité moyenne de la scène, lue juste après un rendu (le tampon WebGL est vidé ensuite).
const sceneBrightness = (page: Page) =>
  page.locator('main #scene').evaluate(
    (canvas: HTMLCanvasElement) =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() => {
          const copy = document.createElement('canvas');
          copy.width = 200;
          copy.height = 200;
          const ctx = copy.getContext('2d')!;
          ctx.drawImage(canvas, 0, 0, 200, 200);
          const { data } = ctx.getImageData(0, 0, 200, 200);
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
          resolve(sum / (data.length / 4) / 3);
        }),
      ),
  );

test('Illustration : les tons sont propres à chaque image, agissent sur le rendu et se rétablissent', async ({
  page,
}) => {
  await page.goto('/outils/illustration');
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(START);
  const [first, second] = await names(page);
  const bright = panel(page).getByRole('slider', { name: 'Luminosité' });
  await page.waitForTimeout(1500); // l'image d'ouverture a fini de se former
  const before = await sceneBrightness(page);

  await bright.focus();
  await page.keyboard.press('Home');
  await expect(bright).toHaveAttribute('aria-valuetext', '-100');
  await expect.poll(() => sceneBrightness(page), { timeout: 10000 }).not.toBeCloseTo(before, 0);

  await panel(page).getByRole('button', { name: second, exact: true }).click();
  await expect(bright).toHaveAttribute('aria-valuetext', '0');
  await panel(page).getByRole('button', { name: first, exact: true }).click();
  await expect(bright).toHaveAttribute('aria-valuetext', '-100');

  await panel(page).getByText('Réglage avancé').click();
  await panel(page).getByRole('button', { name: 'Rétablir les tons' }).click();
  await expect(bright).toHaveAttribute('aria-valuetext', '0');
});

test('Illustration : « Boucle d’images » ajoute les coches de boucle dans le bandeau', async ({ page }) => {
  await page.goto('/outils/illustration');
  const strip = page.getByRole('group', { name: 'Bande d’images' });
  await expect.poll(async () => (await names(page)).length, { timeout: 15000 }).toBe(START);
  await expect(strip.getByRole('button', { name: /dans la boucle/ })).toHaveCount(0);
  await panel(page).getByRole('button', { name: 'Animation' }).click();
  await panel(page).getByText('Boucle d’images').click();
  await expect(strip.getByRole('button', { name: /dans la boucle/ })).toHaveCount(START);
});

test('Illustration : un modèle 3D tourne vraiment quand on le fait tourner', async ({ page }) => {
  await page.goto('/outils/illustration');
  const prism = panel(page).getByRole('button', { name: 'Prisme (modèle 3D)', exact: true });
  await expect(prism).toBeVisible({ timeout: 15000 });
  await prism.click();
  await page.waitForTimeout(2500); // la vue du modèle a fini de se former
  const scene = page.locator('main #scene');
  const before = await scene.screenshot();
  const box = (await scene.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(2500);
  expect(Buffer.compare(before, await scene.screenshot())).not.toBe(0);
});
