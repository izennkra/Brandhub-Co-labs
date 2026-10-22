import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { EXPORT_SCALES } from '../src/lib/pattern-engine/export-options';
import { stamp } from '../src/lib/pattern-engine/exporter';
import { getEngine } from '../src/lib/pattern-engine/createEngine';

async function openExport(path = '/outils/motif') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  // replié à l'arrivée (Figma « Tool / Motif »), une fois le moteur chargé
  const toggle = await screen.findByRole('button', { name: 'Export', expanded: false });
  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const S = (await getEngine()).core.S as Record<string, unknown>;
  return { user, S };
}
const group = (name: string) => screen.getByRole('group', { name });
const pressed = (name: string) =>
  [...group(name).querySelectorAll('[aria-pressed="true"]')].map((b) => b.textContent);

describe('bloc Export du panneau (Figma + dock du prototype)', () => {
  it('propose les tailles du Figma et nomme les fichiers comme le prototype', () => {
    expect(EXPORT_SCALES).toEqual([1, 2, 3, 4, 6]);
    expect(stamp(new Date(2026, 9, 22, 9, 5, 7))).toBe('20261022-090507');
  });

  it('Image : taille, format et arrière-plan transparent (absent en JPEG)', async () => {
    const { user, S } = await openExport();
    S.expTab = 0;
    S.expSize = 1;
    S.expFmt = 0;
    S.expBg = false;
    await user.click(screen.getByRole('button', { name: 'Image' }));
    await user.click(screen.getByRole('button', { name: '4x' }));
    expect(S.expSize).toBe(3);
    expect(pressed('Taille')).toEqual(['4x']);

    const transparent = screen.getByRole('switch', { name: 'Arrière-plan transparent' });
    expect(transparent).toBeChecked();
    await user.click(transparent);
    expect(S.expBg).toBe(true);

    await user.click(screen.getByRole('button', { name: 'JPEG' }));
    expect(S.expFmt).toBe(2);
    expect(screen.queryByRole('switch', { name: 'Arrière-plan transparent' })).toBeNull();
  });

  it('Vidéo : construction de A à Z ou durée ; Figma : mode et plugin', async () => {
    const { user, S } = await openExport();
    S.videoBuild = false;
    await user.click(screen.getByRole('button', { name: 'Vidéo' }));
    expect(S.expTab).toBe(2);
    expect(screen.getByRole('spinbutton', { name: 'Durée de la vidéo en secondes' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Construction de A à Z' }));
    expect(S.videoBuild).toBe(true);
    expect(screen.getByText('Du premier trait à la forme terminée.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer la vidéo' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Figma' }));
    await user.click(within(group('Motif collé dans Figma')).getByRole('button', { name: 'Image' }));
    expect(S.figmaMode).toBe(1);
    expect(screen.getByRole('button', { name: 'Copier pour le plugin' })).toBeInTheDocument();
  });

  it('borne la durée de la vidéo entre 2 et 60 secondes', async () => {
    const { user, S } = await openExport();
    S.videoBuild = false;
    await user.click(screen.getByRole('button', { name: 'Vidéo' }));
    const input = screen.getByRole('spinbutton', { name: 'Durée de la vidéo en secondes' });
    await user.clear(input);
    await user.type(input, '90');
    await user.tab();
    expect(S.videoDur).toBe(60);
  });

  it('le bouton lance l’export de l’onglet choisi', async () => {
    const { user, S } = await openExport();
    S.exported = 0;
    await user.click(screen.getByRole('button', { name: 'SVG' }));
    await user.click(screen.getByRole('button', { name: 'Exporter le SVG' }));
    expect(S.exported).toBe(1);
  });

  it('reste désactivé sur le Layout editor (pas encore de moteur)', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/outils/layout-editor'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-disabled', 'true');
  });
});
