import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ImageList } from '../src/components/engine/ImageList';
import { ImageStrip } from '../src/components/engine/ImageStrip';

const IMAGES = [
  { name: 'Cadenas', thumb: 'data:image/png;base64,', inLoop: true, selected: true },
  { name: 'Tomate', thumb: 'data:image/png;base64,', inLoop: false, selected: false },
  { name: 'Fleurs', thumb: 'data:image/png;base64,', inLoop: true, selected: false },
];

function handlers() {
  const calls: string[] = [];
  return {
    calls,
    onPick: (i: number) => calls.push(`choix:${i}`),
    onMove: (from: number, to: number) => calls.push(`ordre:${from}>${to}`),
    onDelete: (i: number) => calls.push(`retrait:${i}`),
    onToggleLoop: (i: number) => calls.push(`boucle:${i}`),
    onAdd: (files: File[]) => calls.push(`ajout:${files.map((f) => f.name).join(',')}`),
  };
}

describe('ImageList (panneau)', () => {
  it('liste les images, l’image choisie est signalée, un clic la choisit', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<ImageList images={IMAGES} {...h} />);
    const items = within(screen.getByRole('list', { name: 'Images' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Cadenas' })).toHaveAttribute('aria-current', 'true');
    await user.click(screen.getByRole('button', { name: 'Tomate' }));
    expect(h.calls).toEqual(['choix:1']);
  });

  it('retrait en deux temps : un premier clic demande confirmation', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<ImageList images={IMAGES} {...h} />);
    await user.click(screen.getByRole('button', { name: 'Supprimer Tomate' }));
    expect(h.calls).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Confirmer la suppression de Tomate' }));
    expect(h.calls).toEqual(['retrait:1']);
  });

  it('se réordonne au clavier avec la poignée (flèches haut et bas)', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<ImageList images={IMAGES} {...h} />);
    screen.getByRole('button', { name: 'Déplacer Tomate' }).focus();
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowDown}');
    expect(h.calls).toEqual(['ordre:1>0', 'ordre:1>2']);
  });

  it('se réordonne à la souris en glissant une ligne', () => {
    const h = handlers();
    render(<ImageList images={IMAGES} {...h} />);
    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[2], { dataTransfer: { setData: () => {}, effectAllowed: '' } });
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);
    expect(h.calls).toEqual(['ordre:2>0']);
  });
});

describe('ImageStrip (bandeau sous la scène)', () => {
  it('vignettes à choisir, bouton d’ajout de fichiers', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<ImageStrip images={IMAGES} loop={false} {...h} />);
    await user.click(screen.getByRole('button', { name: 'Afficher Fleurs' }));
    const input = screen.getByLabelText('Importer des images');
    await user.upload(input, new File(['x'], 'chat.png', { type: 'image/png' }));
    expect(h.calls).toEqual(['choix:2', 'ajout:chat.png']);
    expect(screen.queryByRole('button', { name: /dans la boucle/ })).not.toBeInTheDocument();
  });

  it('en boucle, chaque vignette se coche pour l’inclure ou non', async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<ImageStrip images={IMAGES} loop {...h} />);
    expect(screen.getByRole('button', { name: 'Inclure Tomate dans la boucle' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Inclure Tomate dans la boucle' }));
    expect(h.calls).toEqual(['boucle:1']);
  });
});
