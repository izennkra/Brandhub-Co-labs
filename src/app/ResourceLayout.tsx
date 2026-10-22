import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../components/Icon';
import { ResourceEditorPanel } from '../components/resources/EditorPanel';
import { SIDE_PANEL_ID, SidePanel } from '../components/SidePanel/SidePanel';
import { Toaster } from '../components/Toaster';
import { DownloadAllContext, type DownloadAll } from '../lib/resources/downloadAll';
import { restoreEditor } from '../lib/resources/editor';
import { notify, resourceEvents } from '../lib/resources/events';
import { RESOURCE_PAGES } from './navigation';
import styles from './ResourceLayout.module.css';

// Gabarit des pages Ressource (Figma « Ressource / … ») : contenu de la page, panneau latéral
// (code et mode édition), et colonne de droite avec le bouton de panneau et « Tout télécharger ».
export function ResourceLayout() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [downloadAll, setDownloadAll] = useState<DownloadAll>(null);
  const [busy, setBusy] = useState(false);
  const { pathname } = useLocation();
  const page = RESOURCE_PAGES.find((p) => p.path === pathname);

  useEffect(restoreEditor, []);

  return (
    <DownloadAllContext.Provider value={setDownloadAll}>
      <div className={styles.layout}>
        <Outlet />
        {panelOpen && (
          <SidePanel>
            <ResourceEditorPanel tips={page?.editTips ?? []} />
          </SidePanel>
        )}
        <div className={styles.aside}>
          <button
            type="button"
            className={styles.panelToggle}
            aria-label="Modifier les ressources"
            title="Modifier les ressources"
            aria-expanded={panelOpen}
            aria-controls={SIDE_PANEL_ID}
            onClick={() => setPanelOpen((open) => !open)}
          >
            <Icon name="sidebar-simple-right-wide" size="md" />
          </button>
          <button
            type="button"
            className={styles.download}
            aria-label={downloadAll?.label ?? 'Rien à télécharger sur cette page'}
            title={downloadAll?.label ?? 'Rien à télécharger sur cette page'}
            aria-disabled={!downloadAll || busy}
            onClick={async () => {
              if (!downloadAll || busy) return;
              setBusy(true);
              try {
                await downloadAll.run();
              } catch {
                notify('Le téléchargement a échoué.');
              }
              setBusy(false);
            }}
          >
            <Icon name="arrow-inbox" size="md" />
          </button>
        </div>
        <Toaster events={resourceEvents} />
      </div>
    </DownloadAllContext.Provider>
  );
}
