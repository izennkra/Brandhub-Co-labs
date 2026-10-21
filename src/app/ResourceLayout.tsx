import { useState } from 'react';
import { Outlet } from 'react-router';
import { Icon } from '../components/Icon';
import { SIDE_PANEL_ID, SidePanel } from '../components/SidePanel/SidePanel';
import styles from './ResourceLayout.module.css';

// Gabarit des pages Ressource (Figma « Ressource / … ») : contenu de la page, panneau latéral
// optionnel, et colonne de droite avec le bouton de panneau et le bouton Télécharger.
export function ResourceLayout() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Outlet />
      {panelOpen && <SidePanel />}
      <div className={styles.aside}>
        <button
          type="button"
          className={styles.panelToggle}
          aria-label="Panneau latéral"
          aria-expanded={panelOpen}
          aria-controls={SIDE_PANEL_ID}
          onClick={() => setPanelOpen((open) => !open)}
        >
          <Icon name="sidebar-simple-right-wide" size="md" />
        </button>
        <button
          type="button"
          className={styles.download}
          aria-label="Télécharger"
          aria-disabled="true"
          title="Le téléchargement arrive avec la partie resources"
        >
          <Icon name="arrow-inbox" size="md" />
        </button>
      </div>
    </div>
  );
}
