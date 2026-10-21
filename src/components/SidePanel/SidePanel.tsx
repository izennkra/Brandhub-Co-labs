import styles from './SidePanel.module.css';

export const SIDE_PANEL_ID = 'resource-side-panel';

// Panneau latéral des pages Ressource. Vide pour l'instant : la partie resources le remplira
// (par exemple avec les outils du mode éditeur).
export function SidePanel() {
  return (
    <aside id={SIDE_PANEL_ID} className={styles.panel} aria-label="Panneau latéral">
      <p className={styles.pending}>Contenu à venir avec la partie resources.</p>
    </aside>
  );
}
