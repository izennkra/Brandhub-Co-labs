import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

const panel = () => screen.queryByRole('complementary', { name: 'Éditeur' });
const sectionTitles = () =>
  within(panel() as HTMLElement)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent);

describe('panneau Éditeur des pages Tool', () => {
  it('reprend les sections du Figma pour chaque page', () => {
    renderAt('/outils/motif');
    expect(sectionTitles()).toEqual([
      'Préréglages partagés',
      'Réseau',
      'Volume',
      'Pastilles',
      'Survol',
      'Rotation',
      'Couleurs',
    ]);
  });

  it('change de sections selon la page', async () => {
    renderAt('/outils/motif');
    await userEvent.click(screen.getByRole('link', { name: 'Layout editor' }));
    expect(sectionTitles()).toEqual([
      'Layout',
      'Format',
      'Calques',
      'Fill',
      'Pastilles',
      'Survol',
      'Rotation',
      'Couleurs',
    ]);
  });

  it('ouvre et ferme une section, avec aria-expanded à jour', async () => {
    renderAt('/outils/motif');
    const toggle = screen.getByRole('button', { name: 'Réseau' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: 'Réseau' })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Réseau' })).toBeVisible();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('se masque et se réaffiche au clic', async () => {
    renderAt('/outils/motif');
    await userEvent.click(screen.getByRole('button', { name: 'Éditeur' }));
    expect(panel()).not.toBeInTheDocument();

    const reopen = screen.getByRole('button', { name: 'Afficher l’éditeur' });
    expect(reopen).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(reopen);
    expect(panel()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Éditeur' })).toHaveFocus();
  });

  it('se masque et se réaffiche avec la touche H', async () => {
    renderAt('/outils/motif');
    await userEvent.keyboard('h');
    expect(panel()).not.toBeInTheDocument();
    await userEvent.keyboard('h');
    expect(panel()).toBeInTheDocument();
  });

  it('ignore H combiné à une touche de raccourci du système', async () => {
    renderAt('/outils/motif');
    await userEvent.keyboard('{Meta>}h{/Meta}');
    expect(panel()).toBeInTheDocument();
  });

  it('reste masqué quand on change de page Tool', async () => {
    renderAt('/outils/motif');
    await userEvent.click(screen.getByRole('button', { name: 'Éditeur' }));
    await userEvent.click(screen.getByRole('link', { name: 'Illustration' }));
    expect(panel()).not.toBeInTheDocument();
  });

  it('affiche le bouton Export, désactivé pour l’instant', () => {
    renderAt('/outils/motif');
    expect(within(panel() as HTMLElement).getByRole('button', { name: /Export/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it("n'existe pas sur les pages Ressource", () => {
    renderAt('/ressources/logo');
    expect(panel()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Afficher l’éditeur' })).not.toBeInTheDocument();
  });
});

describe('panneau Motif branché au moteur', () => {
  it('affiche les réglages essentiels du Figma dans leur section', async () => {
    renderAt('/outils/motif');
    const volume = await screen.findByRole('region', { name: 'Volume' });
    expect(within(volume).getByRole('group', { name: 'Structure' })).toBeInTheDocument();
    expect(within(volume).getByRole('slider', { name: 'Renflements' })).toBeInTheDocument();
    expect(
      within(volume).queryByRole('slider', { name: 'Étirement des renflements' }),
    ).not.toBeInTheDocument();
    const dots = screen.getByRole('region', { name: 'Pastilles' });
    expect(
      within(dots)
        .getAllByRole('slider')
        .map((s) => s.getAttribute('aria-label')),
    ).toEqual(['Taille']);
  });

  it('« Réglage avancé » ajoute les autres réglages et la section Circulation, et se mémorise', async () => {
    const user = userEvent.setup();
    renderAt('/outils/motif');
    await screen.findByRole('slider', { name: 'Renflements' });
    expect(screen.queryByRole('button', { name: 'Circulation' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Réglage avancé' }));
    expect(screen.getByRole('slider', { name: 'Étirement des renflements' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Circulation' })).toBeInTheDocument();
    expect(localStorage.getItem('bhc.expert')).toBe('1');
  });

  it('bouger un réglage passe par le moteur ; la Ligne masque Réseau et montre ses réglages', async () => {
    const user = userEvent.setup();
    renderAt('/outils/motif');
    const lobes = await screen.findByRole('slider', { name: 'Renflements' });
    fireEvent.change(lobes, { target: { value: '7' } });
    expect(lobes).toHaveAttribute('aria-valuetext', '7');
    expect(screen.getByRole('button', { name: 'Réseau' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ligne' }));
    expect(screen.queryByRole('button', { name: 'Réseau' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Mode de la ligne' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Membrane' }));
    expect(screen.getByRole('button', { name: 'Réseau' })).toBeInTheDocument();
  });

  it('les pages sans moteur n’ont pas d’interrupteur « Réglage avancé »', () => {
    renderAt('/outils/layout-editor');
    expect(screen.queryByRole('switch', { name: 'Réglage avancé' })).not.toBeInTheDocument();
  });
});
