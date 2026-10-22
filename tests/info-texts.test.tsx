import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { InfoTexts } from '../src/components/EditorPanel/InfoTexts';
import type { Engine } from '../src/lib/pattern-engine/createEngine';
import { withTitles } from '../src/lib/pattern-engine/infoTitles';
import {
  readData,
  readStepRows,
  readSteps,
  writeData,
  writeStepRows,
  writeSteps,
} from '../src/lib/pattern-engine/infoTexts';
import type { EngineInfo } from '../src/lib/pattern-engine/prototype-engine.js';

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

describe('titres libres des étapes', () => {
  const item = (n: number) => ({
    on: true,
    n,
    x: n * 100,
    y: 50,
    text: '',
    topText: `Étape 0${n}`,
    top: { fs: 16, fw: 500, padX: 16, h: 36, w: 100 },
    bot: { kind: 'card' as const, w: 200, padX: 20, padY: 16, fs: 14, fw: 500, lh: 18 },
  });
  const info: EngineInfo = { kind: 'process', items: [item(1), item(2)], sc: 1, top: 0, bot: 0, col: {} };

  it('remplace « Étape 0N » par le titre choisi, badge à la largeur du titre', () => {
    const titled = withTitles(info, '\nCo-build', (_font, text) => text.length * 10)!;
    expect(titled.items.map((it) => it.topText)).toEqual(['Étape 01', 'Co-build']);
    expect(titled.items[1].top.w).toBe(80 + 32);
    expect(titled.items[0]).toBe(info.items[0]);
  });

  it('sans titre choisi, ou en mode Données, l’infographie du moteur reste telle quelle', () => {
    expect(withTitles(info, '\n  ')).toBe(info);
    expect(withTitles({ ...info, kind: 'data' }, 'X')).toEqual({ ...info, kind: 'data' });
  });

  it('titres et textes vont ensemble, une ligne par étape', () => {
    const rows = readStepRows({ procSteps: 2, procTexts: 'Un\nDeux', procTitles: 'Atelier' });
    expect(rows).toEqual([
      { title: 'Atelier', text: 'Un' },
      { title: '', text: 'Deux' },
    ]);
    expect(writeStepRows([rows[1]])).toEqual({ procSteps: 1, procTexts: 'Deux', procTitles: '' });
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
    const prefix = screen.getByRole('textbox', { name: 'Titre par défaut, numéroté' });
    await user.clear(prefix);
    await user.type(prefix, 'Phase');
    expect(screen.getByRole('textbox', { name: 'Titre de l’étape 1' })).toHaveAttribute(
      'placeholder',
      'Phase 01',
    );
    // un titre libre pour l'étape 2, gardé avec son texte
    await user.type(screen.getByRole('textbox', { name: 'Titre de l’étape 2' }), 'Build');
    expect(S.procTitles).toBe('\nBuild');
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
