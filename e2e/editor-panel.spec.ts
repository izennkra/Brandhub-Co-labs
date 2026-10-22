import { expect, test, type Page } from '@playwright/test';

const panel = (page: Page) => page.getByRole('complementary', { name: 'Éditeur' });
const stageWidth = (page: Page) =>
  page.locator('main [aria-busy]').evaluate((el) => el.getBoundingClientRect().width);

test('le panneau Éditeur se masque, la zone centrale s’élargit, puis il revient', async ({ page }) => {
  await page.goto('/outils/motif');
  await expect(panel(page)).toBeVisible();
  const before = await stageWidth(page);

  await page.getByRole('button', { name: 'Éditeur' }).click();
  await expect(panel(page)).toBeHidden();
  expect(await stageWidth(page)).toBeGreaterThan(before + 200);

  const reopen = page.getByRole('button', { name: 'Afficher l’éditeur' });
  await expect(reopen).toBeFocused();
  await reopen.click();
  await expect(panel(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Éditeur' })).toBeFocused();
});

test('⌥ H masque et réaffiche le panneau ; H seul ne fait rien', async ({ page }) => {
  await page.goto('/outils/layout-editor');
  // Attendre que la page soit prête (raccourci clavier branché) avant d'appuyer sur H.
  await expect(panel(page)).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('h');
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Alt+KeyH');
  await expect(panel(page)).toBeHidden();
  await page.keyboard.press('Alt+KeyH');
  await expect(panel(page)).toBeVisible();
});

test('une section se déplie au clavier', async ({ page }) => {
  await page.goto('/outils/motif');
  const toggle = page.getByRole('button', { name: 'Rotation' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'Rotation' })).toBeVisible();
});

test('les réglages du Motif se règlent au clavier et pilotent le moteur', async ({ page }) => {
  await page.goto('/outils/motif');
  const lobes = panel(page).getByRole('slider', { name: 'Renflements' });
  await expect(lobes).toBeVisible({ timeout: 15000 });
  await lobes.focus();
  await page.keyboard.press('End');
  await expect(lobes).toHaveAttribute('aria-valuetext', '12');
  await page.keyboard.press('Home');
  await expect(lobes).toHaveAttribute('aria-valuetext', '1');
  await page.keyboard.press('ArrowRight');
  await expect(lobes).toHaveAttribute('aria-valuetext', '2');

  // Membrane → Ligne : le préréglage de la Ligne s'applique (4 renflements), Réseau disparaît.
  await panel(page).getByRole('button', { name: 'Ligne' }).click();
  await expect(lobes).toHaveAttribute('aria-valuetext', '4');
  await expect(panel(page).getByRole('group', { name: 'Mode de la ligne' })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Réseau' })).toHaveCount(0);
});

// Chaque texte du panneau tient sur une ligne, sans être coupé, et la barre de chaque curseur
// couvre son libellé sans que le repère touche la valeur, à 0 % comme à 100 %.
async function layoutProblems(page: Page) {
  return panel(page).evaluate((aside) => {
    const problems: string[] = [];
    aside.querySelectorAll('details').forEach((d) => (d.open = true));
    const texts = aside.querySelectorAll<HTMLElement>(
      '[class*="_label_"], [class*="_value_"], [class*="_segment_"], [class*="_choiceLabel_"]',
    );
    for (const el of texts) {
      if (!el.offsetParent) continue;
      if (el.scrollWidth > el.clientWidth + 1) problems.push(`coupé : ${el.textContent}`);
      if (getComputedStyle(el).whiteSpace !== 'nowrap')
        problems.push(`peut passer sur 2 lignes : ${el.textContent}`);
    }
    for (const input of aside.querySelectorAll<HTMLInputElement>('input[type="range"]')) {
      const row = input.parentElement!;
      if (!row.offsetParent) continue;
      const label = row.querySelector('[class*="_label_"]')!.getBoundingClientRect();
      const value = row.querySelector('[class*="_value_"]')!.getBoundingClientRect();
      const before = row.style.getPropertyValue('--progress');
      for (const p of ['0', '1']) {
        row.style.setProperty('--progress', p);
        const end = row.querySelector('[class*="_fill_"]')!.getBoundingClientRect().right;
        // repère : 2 px de large, 8 px avant le bout de la barre ; la valeur a 8 px de marge à gauche
        if (end - 10 < label.right) problems.push(`repère sur le libellé à ${p} : ${input.ariaLabel}`);
        if (end - 8 > value.left + 8) problems.push(`repère sur la valeur à ${p} : ${input.ariaLabel}`);
      }
      row.style.setProperty('--progress', before);
    }
    return problems;
  });
}

test('panneau Motif : textes sur une ligne et barres justes, dans tous les états', async ({ page }) => {
  await page.goto('/outils/motif');
  await expect(panel(page).getByRole('slider', { name: 'Renflements' })).toBeVisible({ timeout: 15000 });
  await panel(page).getByText('Réglage avancé').click();
  const closed = panel(page).locator('button[aria-expanded="false"]');
  while ((await closed.count()) > 0) await closed.first().click();
  expect(await layoutProblems(page)).toEqual([]);
  await panel(page).getByRole('button', { name: 'Ligne' }).click();
  for (const mode of ['Aléatoire', 'Données', 'Process']) {
    await panel(page).getByRole('button', { name: mode }).click();
    expect(await layoutProblems(page), mode).toEqual([]);
  }
});

test('aller-retour Motif ↔ Illustration : chaque mode garde ses réglages', async ({ page }) => {
  // « Taille » existe dans les deux modes : le prototype garde une valeur par mode (IMG_KEYS).
  const size = () => panel(page).getByRole('slider', { name: 'Taille', exact: true });
  const menu = page.getByRole('navigation', { name: 'Navigation principale' });
  await page.goto('/outils/motif');
  await expect(size()).toBeVisible({ timeout: 15000 });
  await size().focus();
  await page.keyboard.press('End');
  await expect(size()).toHaveAttribute('aria-valuetext', '3.50');

  await menu.getByRole('link', { name: 'Illustration' }).click();
  await expect(page.locator('main #scene')).toBeVisible();
  await expect(size()).toHaveAttribute('aria-valuetext', '1.00'); // valeur d'origine de l'Illustration
  await size().focus();
  await page.keyboard.press('Home');
  await expect(size()).toHaveAttribute('aria-valuetext', '0.20');

  await menu.getByRole('link', { name: 'Motif' }).click();
  await expect(size()).toHaveAttribute('aria-valuetext', '3.50');
  await menu.getByRole('link', { name: 'Illustration' }).click();
  await expect(size()).toHaveAttribute('aria-valuetext', '0.20');
});

test('panneau Illustration : textes sur une ligne et barres justes', async ({ page }) => {
  await page.goto('/outils/illustration');
  await expect(panel(page).getByRole('slider', { name: 'Luminosité' })).toBeVisible({ timeout: 15000 });
  await panel(page).getByText('Réglage avancé').click();
  const closed = panel(page).locator('button[aria-expanded="false"]');
  while ((await closed.count()) > 0) await closed.first().click();
  expect(await layoutProblems(page)).toEqual([]);
});

test('l’effet au survol est désactivé à l’ouverture du Motif et de l’Illustration, et s’active', async ({
  page,
}) => {
  const toggle = () => panel(page).getByRole('switch', { name: 'Effet au survol' });
  for (const path of ['/outils/motif', '/outils/illustration']) {
    await page.goto(path);
    await panel(page).getByRole('button', { name: 'Survol' }).click();
    await expect(toggle()).toBeVisible({ timeout: 15000 });
    await expect(toggle()).not.toBeChecked();
  }
  await panel(page).getByText('Effet au survol').click();
  await expect(toggle()).toBeChecked();
});
