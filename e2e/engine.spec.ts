import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.locator('main #scene');

// Empreinte simple de l'image du canvas (nombre de pixels clairs et leur barycentre), lue juste
// après le rendu du moteur, dans la même image : le tampon WebGL est vidé ensuite.
async function snapshot(page: Page) {
  return scene(page).evaluate(
    (canvas: HTMLCanvasElement) =>
      new Promise<{ lit: number; x: number; y: number; width: number }>((resolve) =>
        requestAnimationFrame(() => {
          const copy = document.createElement('canvas');
          copy.width = canvas.width;
          copy.height = canvas.height;
          const ctx = copy.getContext('2d')!;
          ctx.drawImage(canvas, 0, 0);
          const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
          let lit = 0;
          let sx = 0;
          let sy = 0;
          let minX = Infinity;
          let maxX = -Infinity;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] + data[i + 1] + data[i + 2] > 300) {
              const p = i / 4;
              lit++;
              const px = p % copy.width;
              sx += px;
              sy += Math.floor(p / copy.width);
              minX = Math.min(minX, px);
              maxX = Math.max(maxX, px);
            }
          }
          resolve({ lit, x: lit ? sx / lit : 0, y: lit ? sy / lit : 0, width: lit ? maxX - minX : 0 });
        }),
      ),
  );
}

test('Motif affiche le moteur dans la zone centrale, sans erreur', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));

  await page.goto('/outils/motif');
  await expect(scene(page)).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => (await snapshot(page)).lit, { timeout: 15000 }).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test('la molette zoome et glisser fait tourner le motif', async ({ page }) => {
  await page.goto('/outils/motif');
  await expect.poll(async () => (await snapshot(page)).lit, { timeout: 15000 }).toBeGreaterThan(1000);
  await page.waitForTimeout(4000); // le motif finit d'apparaître
  const box = (await scene(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  const before = await snapshot(page);
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, 900);
  await expect
    .poll(async () => (await snapshot(page)).width, { timeout: 5000 })
    .toBeLessThan(before.width * 0.7);

  const zoomed = await snapshot(page);
  await page.mouse.move(cx - 150, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 150, cy - 60, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(async () => {
      const turned = await snapshot(page);
      return (
        Math.abs(turned.x - zoomed.x) + Math.abs(turned.y - zoomed.y) + Math.abs(turned.width - zoomed.width)
      );
    })
    .toBeGreaterThan(3);
});

test('la scène quitte la page sur Ressource et revient sur Motif', async ({ page }) => {
  await page.goto('/outils/motif');
  await expect(scene(page)).toBeVisible({ timeout: 15000 });

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Ressource' }).click();
  await expect(scene(page)).toHaveCount(0);
  await expect(page.locator('#labels')).toBeHidden();

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Tool' }).click();
  await expect(scene(page)).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).lit, { timeout: 15000 }).toBeGreaterThan(1000);
});
