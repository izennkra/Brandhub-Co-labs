import { useId, useState } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { EXPORT_FMTS, EXPORT_SCALES, EXPORT_TABS } from '../../lib/pattern-engine/export-options';
import { Icon } from '../Icon';
import styles from './ExportPanel.module.css';

// Choix segmenté du bloc Export (Figma : groupe clair, choix actif sur fond taupe).
export function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          className={styles.segment}
          aria-pressed={index === value}
          onClick={() => onChange(index)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switchInput}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true" />
    </label>
  );
}

// Bloc Export du panneau (Figma « Tool / Layout editor ») : replié en bouton orange, il s'ouvre vers le haut.
// Les options et leurs effets sont ceux du dock d'export du prototype (renderDock, ligne 3258).
export function ExportPanel({ engine }: { engine: Engine | null }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  if (!engine) {
    return (
      <button
        type="button"
        className={styles.toggle}
        aria-disabled="true"
        title="L’export arrive avec le Layout editor"
      >
        <span>Export</span>
        <Icon name="chevron-down-small" size="xs" className={styles.chevronUp} />
      </button>
    );
  }

  const S = engine.core.S;
  const set = (key: string, value: number | boolean) => engine.actions.change(key, value);
  const tab = Number(S.expTab) | 0;
  const fmt = Number(S.expFmt) | 0;
  const image = S.app === 'image';
  const loopOn = image && Boolean(S.imgLoop) && engine.core.loopList().length > 1;
  const busy = engine.exporter.busy;
  const label = ['Exporter', 'Exporter le SVG', 'Enregistrer la vidéo', 'Copier pour Figma'][tab];

  return (
    <div className={styles.box} data-open={open}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span>Export</span>
        <Icon name="chevron-down-small" size="xs" className={open ? undefined : styles.chevronUp} />
      </button>

      <div id={bodyId} className={styles.body} hidden={!open}>
        <Choice label="Type d’export" options={EXPORT_TABS} value={tab} onChange={(i) => set('expTab', i)} />

        {tab === 0 && (
          <>
            <Choice
              label="Taille"
              options={EXPORT_SCALES.map((k) => `${k}x`)}
              value={Number(S.expSize) | 0}
              onChange={(i) => set('expSize', i)}
            />
            <Choice
              label="Format"
              options={EXPORT_FMTS.map(([name]) => name)}
              value={fmt}
              onChange={(i) => set('expFmt', i)}
            />
            {/* Le JPEG n'a pas de transparence : l'option disparaît, comme dans le prototype. */}
            {fmt !== 2 && (
              <Switch
                label="Arrière-plan transparent"
                checked={!S.expBg}
                onChange={(on) => set('expBg', !on)}
              />
            )}
          </>
        )}

        {tab === 1 && (
          <p className={styles.note}>
            Vectoriel : chaque pastille devient une forme, modifiable dans Illustrator ou Figma.
          </p>
        )}

        {tab === 2 && (
          <>
            {!image && (
              <Switch
                label="Construction de A à Z"
                checked={Boolean(S.videoBuild)}
                onChange={(on) => set('videoBuild', on)}
              />
            )}
            {loopOn || (!image && S.videoBuild) ? (
              <p className={styles.note}>
                {loopOn ? 'Une boucle complète de tes images.' : 'Du premier trait à la forme terminée.'}
              </p>
            ) : (
              <label className={styles.row}>
                <span>Durée</span>
                <span className={styles.duration}>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    step={1}
                    className={styles.number}
                    aria-label="Durée de la vidéo en secondes"
                    defaultValue={Number(S.videoDur)}
                    onBlur={(event) => {
                      const seconds = Math.max(2, Math.min(60, parseFloat(event.target.value) || 8));
                      event.target.value = String(seconds);
                      set('videoDur', seconds);
                    }}
                  />
                  s
                </span>
              </label>
            )}
          </>
        )}

        {tab === 3 && (
          <>
            <Choice
              label="Motif collé dans Figma"
              options={['Vectoriel', 'Image']}
              value={Number(S.figmaMode) | 0}
              onChange={(i) => set('figmaMode', i)}
            />
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              title="Avec le plugin : boutons et cartes en auto layout"
              onClick={() => void engine.exporter.copyForPlugin()}
            >
              Copier pour le plugin
            </button>
          </>
        )}

        <button
          type="button"
          className={styles.go}
          disabled={busy}
          onClick={() => void engine.exporter.exportCurrent()}
        >
          {busy ? 'Export en cours…' : label}
        </button>
      </div>
    </div>
  );
}
