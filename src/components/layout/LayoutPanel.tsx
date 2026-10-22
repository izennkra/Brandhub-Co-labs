import { useState, type ReactNode, type Ref } from 'react';
import { layoutStore, useLayout, type Layer, type PatternLayer } from '../../lib/layout/doc';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import { CONTROLS, isVisible } from '../../lib/pattern-engine/controls';
import { LAYOUT_FORMATS } from '../../lib/resources/formats';
import { formatName } from '../../lib/layout/doc';
import { EDITOR_PANEL_ID } from '../EditorPanel/EditorPanel';
import panel from '../EditorPanel/EditorPanel.module.css';
import { EngineControls } from '../EditorPanel/EngineControls';
import { PanelSection } from '../EditorPanel/PanelSection';
import { useEngine } from '../EditorPanel/useEngine';
import { ColorPicker } from '../engine/ColorPicker';
import swatches from '../engine/ColorPicker.module.css';
import { Toggle } from '../engine/Toggle';
import { Icon, type IconName } from '../Icon';
import { AddLayerButtons } from './AddLayerButtons';
import { LayoutExport } from './LayoutExport';
import styles from './LayoutPanel.module.css';

// Panneau du Layout editor (Figma « Tool / Layout editor Motif ») : Layout, Format, Calques, Fill,
// puis les réglages du motif choisi (Pastilles, Survol, Rotation, Couleurs) et le bloc Export.
const ENGINE_SECTIONS = ['Pastilles', 'Survol', 'Rotation', 'Couleurs'];
const ADVANCED_KEY = 'bhc.expert'; // même clé que l'Éditeur des autres outils

const ALIGN: { edge: Parameters<typeof layoutStore.align>[1]; label: string; icon: IconName }[] = [
  { edge: 'left', label: 'Aligner à gauche', icon: 'layout-align-left' },
  { edge: 'center', label: 'Centrer horizontalement', icon: 'align-horizontal-center' },
  { edge: 'right', label: 'Aligner à droite', icon: 'layout-align-right' },
  { edge: 'top', label: 'Aligner en haut', icon: 'layout-align-top' },
  { edge: 'middle', label: 'Centrer verticalement', icon: 'align-vertical-center' },
  { edge: 'bottom', label: 'Aligner en bas', icon: 'layout-align-bottom' },
];

const layerIcon = (layer: Layer): IconName =>
  layer.type === 'image' ? 'images1' : layer.app === 'image' ? 'circles-three' : 'circle-dashed';

/** Champ numérique du Figma : préfixe (X, Y, W, H, °), Entrée ou sortie du champ pour valider. */
function NumberField({
  prefix,
  label,
  value,
  onChange,
}: {
  prefix: ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const n = Number((draft ?? '').replace(',', '.'));
    if (draft !== null && draft.trim() !== '' && Number.isFinite(n)) onChange(n);
    setDraft(null);
  };
  return (
    <label className={styles.number}>
      <span aria-hidden="true">{prefix}</span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            onChange(value + (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1));
          }
        }}
      />
    </label>
  );
}

/** Le calque épouse de nouveau sa forme, à la même taille et à la même place. */
const refit = (engine: Engine | null, layer: PatternLayer) => {
  const shape = engine?.layout.measure(layer);
  if (shape) layoutStore.fit(layer.id, shape, 'keep');
};

/** Boucle d'une illustration : les images cochées passent dans l'ordre de la liste (propre au calque). */
function LoopList({ engine, layer }: { engine: Engine; layer: PatternLayer }) {
  const library = engine.layout.library();
  const thumbs = engine.actions.images();
  const known = new Set(library.map((image) => image.key));
  const chosen = layer.loop.filter((key) => known.has(key));
  const rows = [
    ...chosen.map((key) => library.findIndex((image) => image.key === key)),
    ...library.flatMap((image, index) => (chosen.includes(image.key) ? [] : [index])),
  ];
  const setLoop = (loop: string[]) => {
    layoutStore.updatePattern(layer.id, { loop });
    refit(engine, layer);
  };
  const move = (key: string, step: number) => {
    const next = [...chosen],
      i = next.indexOf(key),
      j = i + step;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLoop(next);
  };
  return (
    <>
      <ol className={styles.loop} aria-label="Illustrations de la boucle">
        {rows.map((index) => {
          const { key, name } = library[index];
          const position = chosen.indexOf(key);
          return (
            <li key={key} data-off={position < 0 || undefined}>
              <label className={styles.loopName}>
                <input
                  type="checkbox"
                  checked={position >= 0}
                  onChange={(event) =>
                    setLoop(event.target.checked ? [...chosen, key] : chosen.filter((k) => k !== key))
                  }
                />
                {thumbs[index]?.thumb && <img src={thumbs[index].thumb} alt="" />}
                <span>{position >= 0 ? `${position + 1}. ${name}` : name}</span>
              </label>
              {position >= 0 && (
                <span className={styles.loopActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Avancer ${name} dans la boucle`}
                    disabled={position === 0}
                    onClick={() => move(key, -1)}
                  >
                    <Icon name="arrow-up" size="xs" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Reculer ${name} dans la boucle`}
                    disabled={position === chosen.length - 1}
                    onClick={() => move(key, 1)}
                  >
                    <Icon name="arrow-down" size="xs" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {chosen.length < 2 && (
        <p className={styles.hint}>Coche au moins deux illustrations pour lancer la boucle.</p>
      )}
    </>
  );
}

/** Réglages propres à un calque de motif : copie de l'outil, animation, 3D, zoom, image ou boucle. */
function PatternOptions({
  engine,
  layer,
  mode3d,
}: {
  engine: Engine | null;
  layer: PatternLayer;
  mode3d: boolean;
}) {
  const loopOn = engine?.layout.loopOn(layer) ?? false;
  return (
    <>
      <p className={styles.hint}>
        Copie {layer.app === 'image' ? 'de l’illustration' : 'du motif'} de l’outil, sur fond transparent :
        tes réglages ici ne changent pas l’outil. Double-clic sur la forme pour le mode 3D.
      </p>
      <Toggle
        label="Animé"
        checked={layer.anim}
        onChange={(anim) => layoutStore.updatePattern(layer.id, { anim })}
      />
      <button
        type="button"
        className={styles.action}
        aria-pressed={mode3d}
        onClick={() => layoutStore.set3d(!mode3d)}
      >
        <Icon name="3d-box-top" size="sm" /> {mode3d ? 'Terminer le mode 3D' : 'Mode 3D'}
      </button>
      <button type="button" className={styles.action} onClick={() => refit(engine, layer)}>
        Ajuster le calque à la forme
      </button>
      <button
        type="button"
        className={styles.action}
        onClick={() => {
          layoutStore.recenter(layer.id);
          refit(engine, layer);
        }}
      >
        Recentrer la forme
      </button>
      {layer.app === 'image' && engine && (
        <>
          <Toggle
            label="Boucle entre les illustrations"
            checked={loopOn}
            onChange={(on) => engine.layout.setLoop(layer, on)}
          />
          {loopOn ? (
            <LoopList engine={engine} layer={layer} />
          ) : (
            engine.layout.library().length > 1 && (
              <label className={styles.select}>
                <span>Image</span>
                <select
                  value={layer.imgIndex}
                  onChange={(event) =>
                    layoutStore.updatePattern(layer.id, { imgIndex: Number(event.target.value) })
                  }
                >
                  {engine.layout.library().map((image, index) => (
                    <option key={image.key} value={index}>
                      {image.name}
                    </option>
                  ))}
                </select>
              </label>
            )
          )}
        </>
      )}
    </>
  );
}

export function LayoutPanel({
  onHide,
  toggleRef,
}: {
  onHide: () => void;
  toggleRef: Ref<HTMLButtonElement>;
}) {
  const engine = useEngine(true);
  const { doc, selected, layer, mode3d } = useLayout();
  const [advanced, setAdvanced] = useState(() => {
    try {
      return localStorage.getItem(ADVANCED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const pattern = layer?.type === 'pattern' ? layer : null;
  const live = pattern && engine?.layout.live === pattern ? pattern : null;
  const mode = pattern?.app === 'image' ? 'illustration' : 'motif';
  const controlsOf = (section: string) =>
    engine && live
      ? CONTROLS.filter(
          (c) =>
            c.section === section &&
            (c.mode === 'both' || c.mode === mode) &&
            (c.level === 'essential' || (advanced && c.level === 'advanced')) &&
            isVisible(c, engine.core.S),
        )
      : [];

  return (
    <aside id={EDITOR_PANEL_ID} className={panel.panel} aria-label="Éditeur">
      <button
        ref={toggleRef}
        type="button"
        className={panel.header}
        aria-expanded="true"
        aria-controls={EDITOR_PANEL_ID}
        title="Masquer l’éditeur (⌥ H)"
        onClick={onHide}
      >
        <Icon name="sidebar-simple-right-wide" size="md" />
        <span>Éditeur</span>
      </button>

      <div className={panel.sections}>
        <PanelSection title="Layout" defaultOpen>
          {layer ? (
            <>
              <div className={styles.grid}>
                <NumberField
                  prefix="X"
                  label="Position X"
                  value={layer.x}
                  onChange={(x) => layoutStore.updateLayer(layer.id, { x })}
                />
                <NumberField
                  prefix="Y"
                  label="Position Y"
                  value={layer.y}
                  onChange={(y) => layoutStore.updateLayer(layer.id, { y })}
                />
                <NumberField
                  prefix="W"
                  label="Largeur"
                  value={layer.w}
                  onChange={(w) => layoutStore.updateLayer(layer.id, { w })}
                />
                <NumberField
                  prefix="H"
                  label="Hauteur"
                  value={layer.h}
                  onChange={(h) => layoutStore.updateLayer(layer.id, { h })}
                />
                <NumberField
                  prefix="↻"
                  label="Rotation en degrés"
                  value={layer.r}
                  onChange={(r) => layoutStore.updateLayer(layer.id, { r: ((r % 360) + 360) % 360 })}
                />
              </div>
              <div className={styles.aligns} role="group" aria-label="Alignement dans le frame">
                {ALIGN.map(({ edge, label, icon }) => (
                  <button
                    key={edge}
                    type="button"
                    className={styles.iconButton}
                    aria-label={label}
                    title={label}
                    onClick={() => layoutStore.align(layer.id, edge)}
                  >
                    <Icon name={icon} size="sm" />
                  </button>
                ))}
              </div>
              {pattern && <PatternOptions engine={engine} layer={pattern} mode3d={mode3d} />}
            </>
          ) : (
            <>
              <label className={styles.text}>
                <span>Nom</span>
                <input
                  type="text"
                  value={doc.name}
                  onChange={(event) => layoutStore.setFrame({ name: event.target.value })}
                  onBlur={(event) => !event.target.value.trim() && layoutStore.setFrame({ name: 'Frame 1' })}
                />
              </label>
              <div className={styles.grid}>
                <NumberField
                  prefix="W"
                  label="Largeur du frame"
                  value={doc.w}
                  onChange={(w) => layoutStore.resize(w, doc.h)}
                />
                <NumberField
                  prefix="H"
                  label="Hauteur du frame"
                  value={doc.h}
                  onChange={(h) => layoutStore.resize(doc.w, h)}
                />
              </div>
            </>
          )}
          <Toggle
            label="Rogner au frame"
            checked={doc.clip}
            onChange={(clip) => layoutStore.setFrame({ clip })}
          />
        </PanelSection>

        <PanelSection title="Format" defaultOpen>
          <div className={styles.formats} role="group" aria-label="Format du frame">
            {LAYOUT_FORMATS.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.format}
                aria-pressed={formatName(doc) === name}
                onClick={() => layoutStore.setFormat(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Calques" defaultOpen>
          <ul className={styles.layers} aria-label="Calques">
            <li>
              <button
                type="button"
                className={styles.layerName}
                aria-pressed={selected === null}
                onClick={() => layoutStore.select(null)}
              >
                <Icon name="dot-grid3x3" size="xs" />
                <span>{doc.name}</span>
              </button>
            </li>
            {[...doc.layers].reverse().map((l, i, list) => (
              <li key={l.id} className={styles.child} data-hidden={l.hidden || undefined}>
                <button
                  type="button"
                  className={styles.layerName}
                  aria-pressed={selected === l.id}
                  onClick={() => layoutStore.select(l.id)}
                >
                  <Icon name={layerIcon(l)} size="xs" />
                  <span>{l.name}</span>
                </button>
                <span className={styles.layerActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Monter ${l.name}`}
                    disabled={i === 0}
                    onClick={() => layoutStore.moveLayer(l.id, 1)}
                  >
                    <Icon name="arrow-up" size="xs" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Descendre ${l.name}`}
                    disabled={i === list.length - 1}
                    onClick={() => layoutStore.moveLayer(l.id, -1)}
                  >
                    <Icon name="arrow-down" size="xs" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${l.hidden ? 'Afficher' : 'Masquer'} ${l.name}`}
                    aria-pressed={!l.hidden}
                    onClick={() => layoutStore.updateLayer(l.id, { hidden: !l.hidden })}
                  >
                    <Icon name={l.hidden ? 'eye-slash' : 'eye-open'} size="xs" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`Supprimer ${l.name}`}
                    onClick={() => layoutStore.removeLayer(l.id)}
                  >
                    <Icon name="trash-can" size="xs" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <AddLayerButtons engine={engine} />
        </PanelSection>

        <PanelSection title="Fill" defaultOpen>
          {engine ? (
            <div
              role="radiogroup"
              aria-label="Fond du frame"
              className={`${swatches.swatches} ${styles.wrap}`}
            >
              <label className={swatches.swatch} title="Aucun (transparent)">
                <input
                  type="radio"
                  name="layout-fill"
                  className={swatches.input}
                  aria-label="Aucun (transparent)"
                  checked={!doc.fill}
                  onChange={() => layoutStore.setFrame({ fill: null })}
                />
                <span className={`${swatches.chip} ${swatches.square} ${styles.none}`} />
              </label>
              {engine.layout.palette.map((swatch) => (
                <label key={swatch.id} className={swatches.swatch} title={swatch.name}>
                  <input
                    type="radio"
                    name="layout-fill"
                    className={swatches.input}
                    aria-label={swatch.name}
                    checked={doc.fill === swatch.id}
                    onChange={() => {
                      layoutStore.setFrame({ fill: swatch.id });
                      // les formes se fondent dans le fond du frame
                      engine.layout.setBackground(
                        doc.layers.filter((l): l is PatternLayer => l.type === 'pattern'),
                        swatch.id,
                      );
                    }}
                  />
                  <span
                    className={`${swatches.chip} ${swatches.square}`}
                    style={{ '--swatch': swatch.hex } as React.CSSProperties}
                  />
                </label>
              ))}
            </div>
          ) : (
            <p>Chargement…</p>
          )}
        </PanelSection>

        {live && (
          <Toggle
            label="Réglage avancé"
            checked={advanced}
            onChange={(on) => {
              setAdvanced(on);
              try {
                localStorage.setItem(ADVANCED_KEY, on ? '1' : '0');
              } catch {
                // le choix vaut pour cette visite
              }
            }}
          />
        )}
        {ENGINE_SECTIONS.map((section) => (
          <PanelSection
            key={`${section}-${live?.id ?? ''}`}
            title={section}
            defaultOpen={Boolean(live) && section === 'Couleurs'}
          >
            {!engine || !live ? (
              <p className={styles.hint}>Choisis un motif ou une illustration dans Calques pour le régler.</p>
            ) : (
              <>
                {section === 'Couleurs' && (
                  <ColorPicker
                    palette={engine.core.PALETTE}
                    background={String(engine.core.S.bg)}
                    dots={engine.core.S.dots as Set<string>}
                    onBackground={engine.actions.setBackground}
                    onToggleDot={engine.actions.toggleDot}
                    showBackground={false}
                  />
                )}
                <EngineControls engine={engine} controls={controlsOf(section)} />
              </>
            )}
          </PanelSection>
        ))}
      </div>

      <LayoutExport engine={engine} />
    </aside>
  );
}
