import { render, screen, within } from '@testing-library/react';
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
