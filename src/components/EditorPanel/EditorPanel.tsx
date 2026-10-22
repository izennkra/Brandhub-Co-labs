import { useState, type Ref } from 'react';
import type { EditorSection, ToolPageDef } from '../../app/navigation';
import { CONTROLS, isVisible, type Control } from '../../lib/pattern-engine/controls';
import { fmtDate } from '../../lib/pattern-engine/presets';
import { SIZE_MAX, SIZE_MIN } from '../../lib/pattern-engine/sizing';
import { useEditor } from '../../lib/resources/editor';
import { ColorPicker } from '../engine/ColorPicker';
import { EditorAccess } from '../engine/EditorAccess';
import { ImageList } from '../engine/ImageList';
import { PresetList } from '../engine/PresetList';
import { Toggle } from '../engine/Toggle';
import { Icon } from '../Icon';
import styles from './EditorPanel.module.css';
import { EngineControls } from './EngineControls';
import { ExportPanel } from './ExportPanel';
import { hasInfoTexts } from '../../lib/pattern-engine/infoTexts';
import { InfoTexts } from './InfoTexts';
import { PanelSection } from './PanelSection';
import { useEngine } from './useEngine';

export const EDITOR_PANEL_ID = 'editor-panel';

// « Réglage avancé » est mémorisé dans le navigateur (même clé que le prototype).
const ADVANCED_KEY = 'bhc.expert';
function readAdvanced() {
  try {
    return localStorage.getItem(ADVANCED_KEY) === '1';
  } catch {
    return false;
  }
}
function storeAdvanced(on: boolean) {
  try {
    localStorage.setItem(ADVANCED_KEY, on ? '1' : '0');
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite seulement.
  }
}

// Section « Préréglages partagés » : enregistrer, appliquer, supprimer (stockage partagé).
const PRESETS_SECTION = 'Préréglages partagés';
// Section Couleurs : choix du fond et des pastilles, puis « Répartition » (table des réglages).
const COLORS_SECTION = 'Couleurs';
// Section Images de l'Illustration : liste des images (choisir, retirer, réordonner).
const IMAGES_SECTION = 'Images';
// Section des tons : bouton « Rétablir les tons » en réglage avancé, comme dans le prototype.
const TONE_SECTION = 'Lumière et tons de l’image';
// Section Volume du Motif : les textes de l'infographie s'y placent (sous-menu « Infographie »).
const VOLUME_SECTION = 'Volume';

// Panneau droit des pages Tool (Figma « Tool / … ») : en-tête repliable, sections, bouton Export.
export function EditorPanel({
  sections,
  engineMode,
  pageKey,
  onHide,
  toggleRef,
}: {
  sections: EditorSection[];
  engineMode?: ToolPageDef['engine'];
  pageKey: string;
  onHide: () => void;
  toggleRef: Ref<HTMLButtonElement>;
}) {
  const [advanced, setAdvanced] = useState(readAdvanced);
  const engine = useEngine(engineMode !== undefined);
  useEditor(); // mode édition ouvert ou fermé : les textes et les droits changent
  const modeControls = CONTROLS.filter((c) => c.mode === engineMode || (engineMode && c.mode === 'both'));
  const shown = (control: Control) =>
    (control.level === 'essential' || (advanced && control.level === 'advanced')) &&
    (!engine || isVisible(control, engine.core.S));

  const visibleSections = sections.flatMap((section) => {
    const controls = modeControls.filter((c) => c.section === section.title);
    const visible = controls.filter(shown);
    const colors = engineMode !== undefined && section.title === COLORS_SECTION;
    const images = engineMode === 'illustration' && section.title === IMAGES_SECTION;
    const presets = engineMode !== undefined && section.title === PRESETS_SECTION;
    // Section entièrement masquée dans l'état actuel (ex. Réseau en mode Ligne) : comme le prototype.
    if (!colors && controls.length > 0 && visible.length === 0) return [];
    return [{ section, controls: visible, colors, images, presets }];
  });

  return (
    <aside id={EDITOR_PANEL_ID} className={styles.panel} aria-label="Éditeur">
      <button
        ref={toggleRef}
        type="button"
        className={styles.header}
        aria-expanded="true"
        aria-controls={EDITOR_PANEL_ID}
        title="Masquer l’éditeur (⌥ H)"
        onClick={onHide}
      >
        <Icon name="sidebar-simple-right-wide" size="md" />
        <span>Éditeur</span>
      </button>

      {engineMode && (
        <Toggle
          label="Réglage avancé"
          checked={advanced}
          onChange={(on) => {
            setAdvanced(on);
            storeAdvanced(on);
          }}
        />
      )}

      <div className={styles.sections}>
        {visibleSections.map(({ section, controls, colors, images, presets }) => (
          <PanelSection key={`${pageKey}-${section.title}`} title={section.title} defaultOpen={section.open}>
            {!colors && !images && !presets && controls.length === 0 ? (
              <p>Réglages à venir.</p>
            ) : !engine ? (
              <p>Chargement des réglages…</p>
            ) : (
              <>
                {presets && (
                  <PresetList
                    presets={engine.presets.list().map((p) => ({
                      id: p.id,
                      name: p.name,
                      detail: fmtDate(p),
                      locked: !engine.presets.canRemove(p.id),
                    }))}
                    defaultId={engine.presets.defaultId}
                    note={engine.presets.note()}
                    onSave={engine.presets.save}
                    onApply={engine.presets.apply}
                    onToggleDefault={engine.presets.toggleDefault}
                    onDelete={(id) => void engine.presets.remove(id)}
                  />
                )}
                {images && !engine.library.loaded && <p>Chargement des illustrations…</p>}
                {images && engine.library.loaded && (
                  <ImageList
                    images={engine.actions.images()}
                    onPick={engine.actions.pickImage}
                    onMove={engine.actions.moveImage}
                    onDelete={(index) => void engine.actions.deleteImage(index)}
                    onRename={engine.actions.renameImage}
                    forAll={engine.library.canEdit()}
                    size={{
                      value: engine.library.sizeOf(),
                      min: SIZE_MIN,
                      max: SIZE_MAX,
                      onChange: engine.library.setSize,
                    }}
                    model={
                      engine.library.modelView() && {
                        flat: engine.library.modelView()!.flat,
                        onFlat: engine.library.setFlat,
                      }
                    }
                    save={{
                      label: engine.library.saveLabel(),
                      note: engine.library.note(),
                      onSave: engine.actions.saveIllustration,
                    }}
                  />
                )}
                {images && engine.library.loaded && engine.library.shared && <EditorAccess />}
                {colors && (
                  <ColorPicker
                    palette={engine.core.PALETTE}
                    background={String(engine.core.S.bg)}
                    dots={engine.core.S.dots as Set<string>}
                    onBackground={engine.actions.setBackground}
                    onToggleDot={engine.actions.toggleDot}
                  />
                )}
                <EngineControls
                  engine={engine}
                  controls={controls}
                  subStart={
                    engineMode === 'motif' && section.title === VOLUME_SECTION && hasInfoTexts(engine.core.S)
                      ? { Infographie: <InfoTexts engine={engine} /> }
                      : undefined
                  }
                  beforeSubs={
                    advanced &&
                    engineMode === 'illustration' &&
                    section.title === TONE_SECTION && (
                      <button type="button" className={styles.action} onClick={engine.actions.resetTone}>
                        Rétablir les tons
                      </button>
                    )
                  }
                />
              </>
            )}
          </PanelSection>
        ))}
      </div>

      <ExportPanel engine={engine} />
    </aside>
  );
}
