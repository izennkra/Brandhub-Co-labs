import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { formatHsl, formatRgb, isLight, normalizeHex } from '../src/lib/resources/colors';
import { lockEditor } from '../src/lib/resources/editor';
import { sizedSvg } from '../src/lib/resources/svg';
import { LOCAL_EDITOR_CODE } from '../src/lib/store/store';

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

async function unlock(user = userEvent.setup()) {
  await user.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
  await user.type(screen.getByLabelText('Code'), LOCAL_EDITOR_CODE);
  await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
  await screen.findByRole('heading', { name: 'Mode édition' });
  return user;
}

afterEach(() => act(() => lockEditor()));

describe('calculs de couleur', () => {
  it('normalise un code HEX et calcule RVB et TSL', () => {
    expect(normalizeHex(' ec5f14 ')).toBe('#EC5F14');
    expect(normalizeHex('#e51')).toBe('#EE5511');
    expect(normalizeHex('orange')).toBeNull();
    expect(formatRgb('#EC5F14')).toBe('rgb(236 95 20)');
    expect(formatHsl('#EC5F14')).toBe('hsl(21 85% 50%)');
    expect(isLight('#F1E2DA')).toBe(true);
    expect(isLight('#431604')).toBe(false);
  });
});

describe('icônes', () => {
  it('copie le SVG à la taille et à la couleur choisies', () => {
    const out = sizedSvg(LOGO, 32, '#EC5F14');
    expect(out).toContain('width="32"');
    expect(out).toContain('height="32"');
    expect(out).toContain('color="#EC5F14"');
  });
});

describe('mode édition des Ressources', () => {
  it('refuse un mauvais code, accepte le bon, puis se verrouille', async () => {
    renderAt('/ressources/couleur');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
    await user.type(screen.getByLabelText('Code'), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce code ne fonctionne pas.');
    expect(screen.queryByRole('button', { name: /Ajouter une couleur/ })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Code'));
    await user.type(screen.getByLabelText('Code'), LOCAL_EDITOR_CODE);
    await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
    await screen.findByRole('heading', { name: 'Mode édition' });
    expect(screen.getAllByRole('button', { name: /Ajouter une couleur/ })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    expect(screen.queryByRole('button', { name: /Ajouter une couleur/ })).not.toBeInTheDocument();
  });

  it('Couleur : ajoute une couleur, saisit son code, puis la montre en lecture avec RVB et TSL', async () => {
    renderAt('/ressources/couleur');
    expect(await screen.findByText('Aucune couleur pour l’instant.')).toBeInTheDocument();
    const user = await unlock();
    await user.click(screen.getAllByRole('button', { name: /Ajouter une couleur/ })[0]);
    const name = await screen.findByRole('textbox', { name: 'Nom de la couleur' });
    await user.clear(name);
    await user.type(name, 'Orange{Enter}');
    await user.type(screen.getByRole('textbox', { name: 'Code HEX de Orange' }), 'ec5f14{Enter}');
    await waitFor(() =>
      expect(JSON.stringify(JSON.parse(localStorage.getItem('bhc.store.res-colors')!))).toContain('#EC5F14'),
    );

    await user.click(screen.getByRole('button', { name: 'Verrouiller' }));
    const list = await screen.findByRole('list', { name: 'Couleurs de marque' });
    expect(within(list).getByText('Orange')).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Copier RVB rgb(236 95 20)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger la palette (CSS)' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  it('Logo : crée un groupe, dépose un SVG, le renomme et le supprime en deux temps', async () => {
    renderAt('/ressources/logo');
    expect(await screen.findByText('Aucun logo pour l’instant.')).toBeInTheDocument();
    const user = await unlock();
    await user.click(screen.getByRole('button', { name: /Nouveau groupe/ }));
    const input = (await screen.findByLabelText(/Dépose tes logos SVG/)) as HTMLInputElement;
    await user.upload(input, new File([LOGO], 'logo-noir.svg', { type: 'image/svg+xml' }));
    const name = await screen.findByRole('textbox', { name: 'Nom du logo Logo noir' });
    await user.clear(name);
    await user.type(name, 'Logo principal{Enter}');
    await screen.findByRole('button', { name: 'Télécharger Logo principal en SVG' });

    await user.click(screen.getByRole('button', { name: 'Supprimer Logo principal' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer la suppression de Logo principal' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Télécharger Logo principal en SVG' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('Logo : un fichier qui n’est pas un SVG est refusé', async () => {
    renderAt('/ressources/logo');
    const user = await unlock();
    await user.click(await screen.findByRole('button', { name: /Nouveau groupe/ }));
    const input = (await screen.findByLabelText(/Dépose tes logos SVG/)) as HTMLInputElement;
    await userEvent.setup({ applyAccept: false }).upload(input, new File(['bonjour'], 'notes.svg'));
    expect(await screen.findByText('« notes.svg » n’est pas un SVG.')).toBeInTheDocument();
  });

  it('Typographie : Geist par défaut, avec son échelle', async () => {
    renderAt('/ressources/typographie');
    expect(await screen.findByText('Geist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger Geist (variable)' })).toBeInTheDocument();
    expect(screen.getByText('Titre XXL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier le code CSS' })).toBeInTheDocument();
  });

  it('Patterns prédéfinis : filtre par format, en attendant les layouts', async () => {
    renderAt('/ressources/patterns');
    const filters = await screen.findByRole('group', { name: 'Filtrer par format' });
    expect(
      within(filters)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Tout', '1:1', '4:5', '9:16', '16:9', '4:3', 'A4', 'Bannière']);
    expect(screen.getByText(/apparaîtront ici/)).toBeInTheDocument();
  });

  it('Inspiration et Imagerie : vides au départ', async () => {
    renderAt('/ressources/inspiration');
    expect(await screen.findByText('Aucune image d’inspiration pour l’instant.')).toBeInTheDocument();
  });
});
