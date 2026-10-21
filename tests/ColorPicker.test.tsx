import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ColorPicker } from '../src/components/engine/ColorPicker';

const PALETTE = [
  { id: 'brun', name: 'Brun', hex: '#431604' },
  { id: 'orange', name: 'Orange', hex: '#EC5F14' },
  { id: 'lin', name: 'Lin', hex: '#F1E2DA' },
];

function setup(background = 'brun', dots = ['orange']) {
  const calls: string[] = [];
  render(
    <ColorPicker
      palette={PALETTE}
      background={background}
      dots={new Set(dots)}
      onBackground={(id) => calls.push(`fond:${id}`)}
      onToggleDot={(id) => calls.push(`pastille:${id}`)}
    />,
  );
  return calls;
}

describe('ColorPicker', () => {
  it('Fond : un seul choix parmi la palette, annoncé avec le nom de la couleur', () => {
    setup();
    const group = screen.getByRole('radiogroup', { name: 'Fond' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual([
      'Brun',
      'Orange',
      'Lin',
    ]);
    expect(screen.getByRole('radio', { name: 'Brun' })).toBeChecked();
  });

  it('Pastilles : plusieurs choix, chaque couleur se coche ou se décoche', async () => {
    const user = userEvent.setup();
    const calls = setup('brun', ['orange', 'lin']);
    expect(screen.getByRole('group', { name: 'Pastilles' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Orange' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Brun' })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Brun' }));
    await user.click(screen.getByRole('radio', { name: 'Lin' }));
    expect(calls).toEqual(['pastille:brun', 'fond:lin']);
  });

  it('au clavier : Espace coche une pastille', async () => {
    const user = userEvent.setup();
    const calls = setup();
    screen.getByRole('checkbox', { name: 'Lin' }).focus();
    await user.keyboard(' ');
    expect(calls).toEqual(['pastille:lin']);
  });
});
