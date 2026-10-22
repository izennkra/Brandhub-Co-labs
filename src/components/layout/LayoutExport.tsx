import { useEffect, useId, useState } from 'react';
import { formatName, layoutStore, useLayout } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { EXPORT_FMTS } from '../../lib/pattern-engine/export-options';
import { slug } from '../../lib/resources/download';
import { restoreEditor, unlockEditor, useEditor } from '../../lib/resources/editor';
import { imageSize, saveResourceFile } from '../../lib/resources/files';
import { useCollection } from '../../lib/resources/useCollection';
import type { GalleryImage } from '../resources/Gallery';
import { Choice, Switch } from '../EditorPanel/ExportPanel';
import styles from '../EditorPanel/ExportPanel.module.css';
import { Icon } from '../Icon';
import own from './LayoutPanel.module.css';

// Bloc Export du Layout editor (Figma « Tool / Layout editor Motif ») branché sur le frame :
// image (×1 à ×3, PNG, WebP, JPEG) ou vidéo des motifs animés, comme le dock du Design libre
// (ligne 4366). Puis « Enregistrer dans Patterns prédéfinis » (collection res-layouts).
const TABS = ['Image', 'Vidéo'] as const;
const SCALES = ['1x', '2x', '3x'];

export function LayoutExport({ engine }: { engine: Engine | null }) {
  const { doc } = useLayout();
  const { unlocked } = useEditor();
  const layouts = useCollection<GalleryImage>('res-layouts');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [scale, setScale] = useState(0);
  const [fmt, setFmt] = useState(0);
  const [transparent, setTransparent] = useState(false);
  const [seconds, setSeconds] = useState(8);
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyId = useId();
  // code déjà saisi dans cet onglet (page Ressource) : pas besoin de le redemander
  useEffect(restoreEditor, []);

  const toast = (detail: string) => engine?.events.dispatchEvent(new CustomEvent('toast', { detail }));
  const busy = !engine || engine.layout.busy || saving;
  const factor = [1, 2, 3][scale];

  const save = async () => {
    if (!engine) return;
    if (!unlocked) return setAsking(true);
    setSaving(true);
    try {
      engine.layout.syncLive();
      const blob = await engine.layout.preview(layoutStore.doc);
      if (!blob) return;
      const url = await saveResourceFile(new File([blob], `${slug(doc.name)}.png`, { type: 'image/png' }));
      const { width, height } = await imageSize(url);
      await layouts.add({ name: doc.name, url, width, height, tag: formatName(doc) });
      toast(`« ${doc.name} » est enregistré dans Patterns prédéfinis.`);
    } catch {
      toast('L’enregistrement n’a pas abouti.');
    } finally {
      setSaving(false);
    }
  };

  const unlock = async () => {
    const ok = await unlockEditor(code);
    setCodeError(!ok);
    if (ok) {
      setAsking(false);
      setCode('');
      void save();
    }
  };

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
          {engine?.layout.busy && !saving
            ? 'Export en cours…'
            : tab === 0
              ? 'Exporter'
              : 'Enregistrer la vidéo'}
        </button>

        <button
          type="button"
          className={styles.secondary}
          disabled={busy || !doc.layers.length}
          onClick={() => void save()}
        >
          <Icon name="bookmark-plus" size="sm" />{' '}
          {saving ? 'Enregistrement…' : 'Enregistrer dans Patterns prédéfinis'}
        </button>
        {asking && (
          <form
            className={own.unlock}
            onSubmit={(event) => {
              event.preventDefault();
              void unlock();
            }}
          >
            <label className={own.fieldLabel}>
              <span>Code éditeur, pour ajouter aux Ressources</span>
              <input
                type="password"
                className={own.input}
                value={code}
                autoComplete="off"
                aria-invalid={codeError}
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            {codeError && <p role="alert">Ce code ne fonctionne pas.</p>}
            <button type="submit" className={styles.secondary} disabled={!code}>
              Déverrouiller et enregistrer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
