import { Fragment, type ReactNode } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { displayLabel, displayOptions, type Control } from '../../lib/pattern-engine/controls';
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
export function EngineControls({
  engine,
  controls,
  beforeSubs,
  subStart,
}: {
  engine: Engine;
  controls: Control[];
  beforeSubs?: ReactNode; // placé juste avant le premier sous-menu (ex. « Rétablir les tons »)
  // contenu placé en tête d'un sous-menu (ex. les textes de l'« Infographie ») ; le sous-menu
  // apparaît pour lui seul quand aucun de ses réglages n'est affiché (réglages essentiels)
  subStart?: Record<string, ReactNode>;
}) {
  const S = engine.core.S;
  const change = (control: Control, value: number | boolean) =>
    engine.actions.change(control.key, value, control.effect);

  const field = (control: Control) => {
    if (control.kind === 'slider')
      return (
        <Slider
          key={control.key}
          label={displayLabel(control)}
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
          label={displayLabel(control)}
          checked={Boolean(S[control.key])}
          onChange={(value) => change(control, value)}
        />
      );
    return (
      <div key={control.key} className={styles.choice}>
        {!UNTITLED_CHOICES.has(control.key) && (
          <span className={styles.choiceLabel} aria-hidden="true">
            {displayLabel(control)}
          </span>
        )}
        <Segmented
          label={displayLabel(control)}
          options={displayOptions(control)}
          value={Number(S[control.key])}
          onChange={(value) => change(control, value)}
        />
      </div>
    );
  };

  const list = runs(controls);
  for (const sub of Object.keys(subStart ?? {}))
    if (!list.some((run) => run.sub === sub)) list.push({ sub, controls: [] });
  const firstSub = list.findIndex((run) => run.sub);
  return list
    .map((run, i) =>
      run.sub ? (
        <Fragment key={run.sub}>
          {i === firstSub && beforeSubs}
          <details className={styles.sub} open={OPEN_SUBS.has(run.sub)}>
            <summary className={styles.subTitle}>
              <span>{run.sub}</span>
              <Icon name="chevron-down-small" size="xs" className={styles.chevron} />
            </summary>
            <div className={styles.subBody}>
              {subStart?.[run.sub]}
              {run.controls.map(field)}
            </div>
          </details>
        </Fragment>
      ) : (
        run.controls.map(field)
      ),
    )
    .concat(firstSub < 0 && beforeSubs ? [<Fragment key="before-subs">{beforeSubs}</Fragment>] : []);
}
