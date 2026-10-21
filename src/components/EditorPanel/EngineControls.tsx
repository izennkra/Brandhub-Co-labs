import type { Engine } from '../../lib/pattern-engine/createEngine';
import type { Control } from '../../lib/pattern-engine/controls';
import { Segmented } from '../engine/Segmented';
import { Slider } from '../engine/Slider';
import { Toggle } from '../engine/Toggle';
import { Icon } from '../Icon';
import styles from './EngineControls.module.css';

// Figma : pas de titre au-dessus de « Membrane / Ligne ».
const UNTITLED_CHOICES = new Set(['qStruct']);
// Sous-menus dépliés à l'arrivée, comme dans le prototype (subWrap, ligne 3061).
const OPEN_SUBS = new Set(['Infographie']);

// Suites de réglages consécutifs du même sous-menu (ou hors sous-menu).
function runs(controls: Control[]) {
  const list: { sub?: string; controls: Control[] }[] = [];
  for (const control of controls) {
    const last = list.at(-1);
    if (last && last.sub === control.sub) last.controls.push(control);
    else list.push({ sub: control.sub, controls: [control] });
  }
  return list;
}

// Réglages d'une section du panneau, dans l'ordre de la table ; les sous-menus sont repliables.
export function EngineControls({ engine, controls }: { engine: Engine; controls: Control[] }) {
  const S = engine.core.S;
  const change = (control: Control, value: number | boolean) =>
    engine.actions.change(control.key, value, control.effect);

  const field = (control: Control) => {
    if (control.kind === 'slider')
      return (
        <Slider
          key={control.key}
          label={control.label}
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(S[control.key])}
          format={control.format}
          onChange={(value) => change(control, value)}
        />
      );
    if (control.kind === 'toggle')
      return (
        <Toggle
          key={control.key}
          label={control.label}
          checked={Boolean(S[control.key])}
          onChange={(value) => change(control, value)}
        />
      );
    return (
      <div key={control.key} className={styles.choice}>
        {!UNTITLED_CHOICES.has(control.key) && (
          <span className={styles.choiceLabel} aria-hidden="true">
            {control.label}
          </span>
        )}
        <Segmented
          label={control.label}
          options={control.options}
          value={Number(S[control.key])}
          onChange={(value) => change(control, value)}
        />
      </div>
    );
  };

  return runs(controls).map((run) =>
    run.sub ? (
      <details key={run.sub} className={styles.sub} open={OPEN_SUBS.has(run.sub)}>
        <summary className={styles.subTitle}>
          <span>{run.sub}</span>
          <Icon name="chevron-down-small" size="xs" className={styles.chevron} />
        </summary>
        <div className={styles.subBody}>{run.controls.map(field)}</div>
      </details>
    ) : (
      run.controls.map(field)
    ),
  );
}
