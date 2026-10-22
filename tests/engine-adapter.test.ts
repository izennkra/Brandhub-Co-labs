import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildEnv,
  createAnimationGate,
  engineEvents,
  visitToast,
} from '../src/lib/pattern-engine/createEngine';

const REQUIRED: string[] = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'src', 'lib', 'pattern-engine', 'required-globals.json'),
    'utf8',
  ),
);

describe('couche d’adaptation du moteur', () => {
  it('fournit chaque nom attendu par le bloc moteur', () => {
    const env = buildEnv(createAnimationGate(() => 0));
    const missing = REQUIRED.filter((name) => !(name in env));
    expect(missing).toEqual([]);
  });

  it('fournit Three.js r128, la version du prototype', () => {
    const env = buildEnv(createAnimationGate(() => 0));
    expect(env.THREE.REVISION).toBe('128');
  });

  it('retient la boucle d’animation tant que la scène est masquée', () => {
    const schedule = vi.fn(() => 1);
    const gate = createAnimationGate(schedule);
    const step = vi.fn();

    gate.requestAnimationFrame(step);
    expect(schedule).not.toHaveBeenCalled();

    gate.setActive(true);
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledWith(step);

    gate.requestAnimationFrame(step);
    expect(schedule).toHaveBeenCalledTimes(2);

    gate.setActive(false);
    gate.requestAnimationFrame(step);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('relaie les messages du moteur à l’interface', () => {
    const env = buildEnv(createAnimationGate(() => 0));
    const listener = vi.fn();
    engineEvents.addEventListener('toast', listener);
    env.toast('Ligne tracée.');
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toBe('Ligne tracée.');
    engineEvents.removeEventListener('toast', listener);
  });
});

describe('messages du moteur', () => {
  it('une image ajoutée est annoncée comme temporaire, pas comme enregistrée', () => {
    expect(visitToast('Image ajoutée et enregistrée.')).toMatch(/^Image ajoutée pour cette visite/);
    expect(visitToast('3 images ajoutées et enregistrées.')).toBe(
      '3 images ajoutées pour cette visite : enregistre celles à garder pour tous.',
    );
    expect(visitToast('Image illisible : a.png')).toBe('Image illisible : a.png');
  });
});
