import type { ReactNode } from 'react';
import styles from './SidePanel.module.css';

export const SIDE_PANEL_ID = 'resource-side-panel';

// Panneau latéral des pages Ressource : code éditeur et mode édition.
export function SidePanel({ children }: { children: ReactNode }) {
  return (
    <aside id={SIDE_PANEL_ID} className={styles.panel} aria-label="Panneau latéral">
      {children}
    </aside>
  );
}
