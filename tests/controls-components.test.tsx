import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Segmented } from '../src/components/engine/Segmented';
import { Slider } from '../src/components/engine/Slider';
import { Toggle } from '../src/components/engine/Toggle';

function SliderHarness({ initial = 2 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <Slider
      label="Renflements"
      min={1}
      max={12}
      step={1}
      value={value}
      format={(v) => v.toFixed(0) + ' u'}
      onChange={setValue}
    />
  );
}

describe('Slider', () => {
  it('est un vrai curseur accessible : nom, bornes, pas, valeur annoncée', () => {
    render(<SliderHarness />);
    const slider = screen.getByRole('slider', { name: 'Renflements' });
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '12');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveValue('2');
    expect(slider).toHaveAttribute('aria-valuetext', '2 u');
    expect(screen.getByText('2 u')).toBeVisible();
  });

  // Flèches, Début et Fin : comportement natif du curseur, testé dans un vrai navigateur (e2e/editor-panel.spec.ts).

  it('renvoie un nombre et remplit la barre selon la valeur', () => {
    render(<SliderHarness />);
    const slider = screen.getByRole('slider', { name: 'Renflements' });
    fireEvent.change(slider, { target: { value: '12' } });
    expect(screen.getByText('12 u')).toBeVisible();
    const row = slider.parentElement as HTMLElement;
    expect(row.style.getPropertyValue('--progress')).toBe('1');
  });

  it('jauge vide au minimum, à mi-course au milieu, pleine au maximum', () => {
    render(<SliderHarness initial={1} />);
    const slider = screen.getByRole('slider', { name: 'Renflements' });
    const row = slider.parentElement as HTMLElement;
    expect(row.style.getPropertyValue('--progress')).toBe('0');
    fireEvent.change(slider, { target: { value: '6.5' } });
    expect(row.style.getPropertyValue('--progress')).toBe('0.5');
    fireEvent.change(slider, { target: { value: '12' } });
    expect(row.style.getPropertyValue('--progress')).toBe('1');
  });
});

describe('Toggle', () => {
  it('est un interrupteur nommé qui bascule à la touche Espace', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [on, setOn] = useState(false);
      return <Toggle label="Inverser les tons" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const toggle = screen.getByRole('switch', { name: 'Inverser les tons' });
    expect(toggle).not.toBeChecked();
    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
  });
});

describe('Segmented', () => {
  it('groupe nommé, choix actif annoncé, valeur du prototype renvoyée', async () => {
    const user = userEvent.setup();
    const picked: number[] = [];
    function Harness() {
      const [value, setValue] = useState(1);
      return (
        <Segmented
          label="Structure"
          options={[
            { label: 'Membrane', value: 1 },
            { label: 'Ligne', value: 2 },
          ]}
          value={value}
          onChange={(v) => {
            picked.push(v);
            setValue(v);
          }}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Structure' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Membrane' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Ligne' }));
    expect(picked).toEqual([2]);
    expect(screen.getByRole('button', { name: 'Ligne' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Membrane' })).toHaveAttribute('aria-pressed', 'false');
  });
});
