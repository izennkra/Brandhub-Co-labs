import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { InfoTexts } from '../src/components/EditorPanel/InfoTexts';
import type { Engine } from '../src/lib/pattern-engine/createEngine';
import { readData, readSteps, writeData, writeSteps } from '../src/lib/pattern-engine/infoTexts';

// Moteur réduit : ses réglages, et setInfo qui les écrit puis fait réafficher le panneau.
function Panel({ S }: { S: Record<string, unknown> }) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const engine = {
    core: { S },
    actions: {
      setInfo: (patch: Record<string, unknown>) => {
        Object.assign(S, patch);
        refresh();
      },
    },
  } as unknown as Engine;
  return <InfoTexts engine={engine} />;
}

describe('textes de l’infographie : lecture et écriture des réglages', () => {
  it('étapes : au moins deux, une par ligne', () => {
    expect(readSteps('Un\nDeux\nTrois', 2)).toEqual(['Un', 'Deux']);
    expect(readSteps('Seul', 3)).toEqual(['Seul', '', '']);
    expect(writeSteps(['A', 'B\nsuite'])).toEqual({ procSteps: 2, procTexts: 'A\nB suite' });
  });

  it('données : une valeur et un texte par donnée', () => {
    expect(readData('12, 80,5', 'Vingt\nQuatre-vingts')).toEqual([
      { value: '12', text: 'Vingt' },
      { value: '80.5', text: 'Quatre-vingts' },
    ]);
    expect(writeData([{ value: '', text: 'Vide' }])).toEqual({ lineData: '0', lineTexts: 'Vide' });
  });
});

describe('textes de l’infographie : panneau', () => {
  it('Process : modifier le texte d’une étape, en ajouter, renommer les étapes', async () => {
    const S: Record<string, unknown> = {
      qStruct: 2,
      lineMode: 2,
      procSteps: 2,
      procTexts: 'Ancien texte\nDeuxième',
      procLabel: 'Étape',
    };
    render(<Panel S={S} />);
    const user = userEvent.setup();
    const first = screen.getByRole('textbox', { name: 'Texte de l’étape 1' });
    await user.clear(first);
    await user.type(first, 'Atelier');
    expect(S.procTexts).toBe('Atelier\nDeuxième');
    // deux étapes au minimum : pas de suppression
    expect(screen.getByRole('button', { name: 'Supprimer l’étape 1' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '+ Ajouter une étape' }));
    expect(S.procSteps).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Supprimer l’étape 2' }));
    expect(S.procTexts).toBe('Atelier\nLorem ipsum dolor sit amet.');
    await user.clear(screen.getByRole('textbox', { name: 'Nom des étapes' }));
    await user.type(screen.getByRole('textbox', { name: 'Nom des étapes' }), 'Phase');
    expect(screen.getByText('Phase 01')).toBeInTheDocument();
  });

  it('Données : valeur décimale et texte de chaque donnée', async () => {
    const S: Record<string, unknown> = {
      qStruct: 2,
      lineMode: 1,
      lineData: '12, 80',
      lineTexts: 'A\nB',
      lineUnit: '%',
    };
    render(<Panel S={S} />);
    const user = userEvent.setup();
    const value = screen.getByRole('textbox', { name: 'Valeur de la donnée 1' });
    await user.clear(value);
    await user.type(value, '12.5');
    expect(value).toHaveValue('12.5');
    expect(S.lineData).toBe('12.5, 80');
    await user.type(screen.getByRole('textbox', { name: 'Texte de la donnée 2' }), ' bis');
    expect(S.lineTexts).toBe('A\nB bis');
  });

  it('rien à éditer hors du mode Ligne en Données ou Process', () => {
    const { container } = render(<Panel S={{ qStruct: 2, lineMode: 0 }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
