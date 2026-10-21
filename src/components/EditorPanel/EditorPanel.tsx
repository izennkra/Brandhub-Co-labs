import type { Ref } from 'react';
import type { EditorSection } from '../../app/editorSections';
import { Icon } from '../Icon';
import styles from './EditorPanel.module.css';
import { PanelSection } from './PanelSection';

export const EDITOR_PANEL_ID = 'editor-panel';

// Panneau droit des pages Tool (Figma « Tool / … ») : en-tête repliable, sections, bouton Export.
export function EditorPanel({
  sections,
  pageKey,
  onHide,
  toggleRef,
}: {
  sections: EditorSection[];
  pageKey: string;
  onHide: () => void;
  toggleRef: Ref<HTMLButtonElement>;
}) {
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

      <div className={styles.sections}>
        {sections.map((section) => (
          <PanelSection key={`${pageKey}-${section.title}`} title={section.title} defaultOpen={section.open}>
            <p>Réglages à venir.</p>
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
