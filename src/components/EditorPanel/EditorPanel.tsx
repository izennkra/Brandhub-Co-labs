import { useState, type Ref } from 'react';
import type { EditorSection, ToolPageDef } from '../../app/navigation';
import { CONTROLS, isVisible, type Control } from '../../lib/pattern-engine/controls';
import { Toggle } from '../engine/Toggle';
import { Icon } from '../Icon';
import styles from './EditorPanel.module.css';
import { EngineControls } from './EngineControls';
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

// Sections dont le contenu arrive plus tard : Couleurs (maquette à valider, tâche 7),
// Préréglages partagés (partie data-store).
const PENDING_SECTIONS = new Set(['Couleurs', 'Préréglages partagés']);

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
  const modeControls = CONTROLS.filter((c) => c.mode === engineMode || (engineMode && c.mode === 'both'));
  const shown = (control: Control) =>
    (control.level === 'essential' || (advanced && control.level === 'advanced')) &&
    (!engine || isVisible(control, engine.core.S));

  const visibleSections = sections.flatMap((section) => {
    const controls = PENDING_SECTIONS.has(section.title)
      ? []
      : modeControls.filter((c) => c.section === section.title);
    const visible = controls.filter(shown);
    // Section entièrement masquée dans l'état actuel (ex. Réseau en mode Ligne) : comme le prototype.
    if (controls.length > 0 && visible.length === 0) return [];
    return [{ section, controls: visible }];
  });

  return (
    <aside id={EDITOR_PANEL_ID} className={styles.panel} aria-label="Éditeur">
      <button
        ref={toggleRef}
        type="button"
        className={styles.header}
        aria-expanded="true"
        aria-controls={EDITOR_PANEL_ID}
        title="Masquer l’éditeur (H)"
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
        {visibleSections.map(({ section, controls }) => (
          <PanelSection key={`${pageKey}-${section.title}`} title={section.title} defaultOpen={section.open}>
            {controls.length === 0 ? (
              <p>Réglages à venir.</p>
            ) : engine ? (
              <EngineControls engine={engine} controls={controls} />
            ) : (
              <p>Chargement des réglages…</p>
            )}
          </PanelSection>
        ))}
      </div>

      <button
        type="button"
        className={styles.export}
        aria-disabled="true"
        title="L’export arrive avec le moteur de motifs"
      >
        <span>Export</span>
        <Icon name="chevron-down-small" size="xs" className={styles.exportChevron} />
      </button>
    </aside>
  );
}
