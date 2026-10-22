import { useId, useState } from 'react';
import { layoutStore, useLayout } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { EXPORT_FMTS } from '../../lib/pattern-engine/export-options';
import { Choice, Switch } from '../EditorPanel/ExportPanel';
import styles from '../EditorPanel/ExportPanel.module.css';
import { Icon } from '../Icon';

// Bloc Export du Layout editor (Figma « Tool / Layout editor Motif ») branché sur le frame :
// image (×1 à ×3, PNG, WebP, JPEG) ou vidéo des motifs animés, comme le dock du Design libre
// (ligne 4366). Rien n'est enregistré : la page sert à essayer et à exporter.
const TABS = ['Image', 'Vidéo'] as const;
const SCALES = ['1x', '2x', '3x'];

export function LayoutExport({ engine }: { engine: Engine | null }) {
  const { doc } = useLayout();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [scale, setScale] = useState(0);
  const [fmt, setFmt] = useState(0);
  const [transparent, setTransparent] = useState(false);
  const [seconds, setSeconds] = useState(8);
  const bodyId = useId();
  const busy = !engine || engine.layout.busy;
  const factor = [1, 2, 3][scale];

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
        <Choice label="Type d’export" options={TABS} value={tab} onChange={setTab} />
        {tab === 0 ? (
          <>
            <Choice label="Taille" options={SCALES} value={scale} onChange={setScale} />
            <Choice
              label="Format"
              options={EXPORT_FMTS.map(([name]) => name)}
              value={fmt}
              onChange={setFmt}
            />
            {fmt !== 2 && (
              <Switch label="Arrière-plan transparent" checked={transparent} onChange={setTransparent} />
            )}
            <p className={styles.note}>
              {doc.w * factor} × {doc.h * factor} px
            </p>
          </>
        ) : (
          <>
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
                  defaultValue={seconds}
                  onBlur={(event) => {
                    const value = Math.max(2, Math.min(60, parseFloat(event.target.value) || 8));
                    event.target.value = String(value);
                    setSeconds(value);
                  }}
                />
                s
              </span>
            </label>
            <p className={styles.note}>Les motifs animés du frame, 1920 px de côté au plus.</p>
          </>
        )}

        <button
          type="button"
          className={styles.go}
          disabled={busy}
          onClick={() =>
            engine &&
            void (tab === 0
              ? engine.layout.exportImage(layoutStore.doc, scale, fmt, transparent)
              : engine.layout.exportVideo(layoutStore.doc, seconds))
          }
        >
          {engine?.layout.busy ? 'Export en cours…' : tab === 0 ? 'Exporter' : 'Enregistrer la vidéo'}
        </button>
      </div>
    </div>
  );
}
