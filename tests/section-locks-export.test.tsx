import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { lockEditor } from '../src/lib/resources/editor';
import { resourceExportEntries } from '../src/lib/resources/exportAll';
import { getStore, LOCAL_EDITOR_CODE } from '../src/lib/store/store';

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

async function unlock(user = userEvent.setup()) {
  await user.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
  await user.type(screen.getByLabelText('Code'), LOCAL_EDITOR_CODE);
  await user.click(screen.getByRole('button', { name: 'Déverrouiller' }));
  await screen.findByRole('heading', { name: 'Mode édition' });
  return user;
}

afterEach(() => act(() => lockEditor()));

describe('sections verrouillées', () => {
  it('l’éditeur verrouille une section : cadenas dans le menu, contenu caché aux visiteurs', async () => {
    renderAt('/ressources/inspiration');
    const user = await unlock();
    const locks = screen.getByRole('group', { name: 'Sections verrouillées' });
    await user.click(within(locks).getByRole('switch', { name: 'Inspiration' }));

    expect(await screen.findByRole('link', { name: 'Inspiration, verrouillée' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Logo' })).toBeInTheDocument();
    // avec le code, le contenu reste visible
    expect(screen.queryByText('Cette section est verrouillée pour le moment.')).not.toBeInTheDocument();

    act(() => lockEditor());
    expect(await screen.findByText('Cette section est verrouillée pour le moment.')).toBeInTheDocument();
    expect(screen.queryByText('Aucune image d’inspiration pour l’instant.')).not.toBeInTheDocument();
    // pour un visiteur, la section verrouillée n'est plus un lien : on ne peut pas l'ouvrir
    expect(screen.queryByRole('link', { name: /Inspiration/ })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('navigation', { name: 'Navigation principale' }))
        .getByText('Inspiration')
        .closest('[aria-disabled="true"]'),
    ).not.toBeNull();
  });

  it('un visiteur ne peut pas ouvrir une section verrouillée depuis le menu', async () => {
    await getStore().put('res-locked', 'imagerie', { path: '/ressources/imagerie' });
    renderAt('/ressources/logo');
    const item = (await screen.findByText(', verrouillée')).closest('[aria-disabled="true"]') as HTMLElement;
    expect(item).toHaveTextContent('Imagerie');
    await userEvent.click(item);
    expect(screen.getByRole('heading', { level: 1, name: 'Logo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Couleur' })).toBeInTheDocument();
  });

  it('l’éditeur la rouvre : plus de cadenas', async () => {
    await getStore().put('res-locked', 'imagerie', { path: '/ressources/imagerie' });
    renderAt('/ressources/imagerie');
    expect(await screen.findByText(', verrouillée')).toBeInTheDocument();
    const user = await unlock();
    // avec le code, la section verrouillée reste un lien
    expect(await screen.findByRole('link', { name: 'Imagerie, verrouillée' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Imagerie' }));
    expect(await screen.findByRole('link', { name: 'Imagerie' })).toBeInTheDocument();
  });

  it('un visiteur ne voit pas les interrupteurs de verrouillage', async () => {
    renderAt('/ressources/logo');
    await userEvent.click(screen.getByRole('button', { name: 'Modifier les ressources' }));
    expect(screen.queryByRole('group', { name: 'Sections verrouillées' })).not.toBeInTheDocument();
  });
});

describe('export complet des Ressources', () => {
  async function seed() {
    const store = getStore();
    await store.put('res-colors', 'orange', {
      name: 'Orange',
      hex: '#EC5F14',
      group: 'principale',
      order: 0,
    });
    await store.put('res-imagery', 'a', { name: 'Portrait', url: PIXEL, width: 1, height: 1, order: 0 });
    await store.put('res-imagery', 'b', { name: 'Portrait', url: PIXEL, width: 1, height: 1, order: 1 });
    await store.put('res-inspiration', 'c', { name: 'Référence', url: PIXEL, width: 1, height: 1, order: 0 });
  }

  it('réunit toutes les sections dans un seul fichier, rangées par dossier numéroté', async () => {
    await seed();
    const entries = await resourceExportEntries(() => true);
    const names = entries.map((e) => e.name);
    expect(names).toContain('03-couleur/palette.css');
    expect(names).toContain('05-imagerie/portrait.png');
    expect(names).toContain('05-imagerie/portrait-2.png'); // même nom : pas d'écrasement
    expect(names).toContain('07-inspiration/reference.png');
    const css = await entries.find((e) => e.name === '03-couleur/palette.css')!.data.text();
    expect(css).toContain('--orange: #EC5F14;');
  });

  it('laisse de côté les sections écartées (verrouillées pour un visiteur)', async () => {
    await seed();
    const entries = await resourceExportEntries((path) => path !== '/ressources/inspiration');
    const names = entries.map((e) => e.name);
    expect(names.some((n) => n.startsWith('07-inspiration/'))).toBe(false);
    expect(names).toContain('05-imagerie/portrait.png');
  });

  it('ne renvoie rien quand tout est vide', async () => {
    const entries = await resourceExportEntries((path) => path !== '/ressources/typographie');
    expect(entries).toHaveLength(0);
  });
});
