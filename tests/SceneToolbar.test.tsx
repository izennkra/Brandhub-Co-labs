import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../src/app/routes';
import { engineEvents, getEngine } from '../src/lib/pattern-engine/createEngine';

const renderAt = (path: string) =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);

describe('barre de scène et notifications', () => {
  it('lecture / pause, nouvelle forme au clic et avec la touche R', async () => {
    const user = userEvent.setup();
    renderAt('/outils/motif');
    const S = (await getEngine()).core.S;
    S.paused = false;
    S.newShapes = 0;
    await user.click(await screen.findByRole('button', { name: 'Mettre en pause' }));
    expect(screen.getByRole('button', { name: 'Reprendre' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reprendre' }));
    await user.click(screen.getByRole('button', { name: 'Nouvelle forme' }));
    await user.keyboard('r');
    expect(S.newShapes).toBe(2);
  });

  it('en Illustration, le bouton devient « Rejouer »', async () => {
    renderAt('/outils/illustration');
    expect(await screen.findByRole('button', { name: 'Rejouer' })).toBeInTheDocument();
  });

  it('les messages du moteur sont affichés dans une zone annoncée', async () => {
    renderAt('/outils/motif');
    await screen.findByRole('button', { name: 'Nouvelle forme' });
    act(() => {
      engineEvents.dispatchEvent(
        new CustomEvent('toast', { detail: 'Garde au moins une couleur de pastilles.' }),
      );
    });
    expect(screen.getByRole('status')).toHaveTextContent('Garde au moins une couleur de pastilles.');
  });

  it('H seul ne masque plus le panneau, ⌥ H oui', async () => {
    const user = userEvent.setup();
    renderAt('/outils/motif');
    await screen.findByRole('button', { name: 'Nouvelle forme' });
    await user.keyboard('h');
    expect(screen.getByRole('complementary', { name: 'Éditeur' })).toBeInTheDocument();
    await user.keyboard('{Alt>}h{/Alt}');
    expect(screen.queryByRole('complementary', { name: 'Éditeur' })).not.toBeInTheDocument();
  });
});
