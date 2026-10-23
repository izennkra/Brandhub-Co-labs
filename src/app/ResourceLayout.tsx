import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Icon } from '../components/Icon';
import { ResourceEditorPanel } from '../components/resources/EditorPanel';
import { SIDE_PANEL_ID, SidePanel } from '../components/SidePanel/SidePanel';
import { Toaster } from '../components/Toaster';
import { restoreEditor, useEditor } from '../lib/resources/editor';
import { notify, resourceEvents } from '../lib/resources/events';
import { useSectionLocks } from '../lib/resources/sectionLocks';
import { RESOURCE_PAGES } from './navigation';
import styles from './ResourceLayout.module.css';

const EXPORT_LABEL = 'Exporter toutes les ressources';

// Gabarit des pages Ressource (Figma « Ressource / … ») : contenu de la page, puis à droite, comme dans
// les pages Tool, soit la bande (bouton de panneau et export), soit le panneau ouvert à sa place
// (en-tête qui le replie, code et mode édition, export en bas). L'export réunit toutes les sections.
export function ResourceLayout() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { pathname } = useLocation();
  const page = RESOURCE_PAGES.find((p) => p.path === pathname);
  const { unlocked } = useEditor();
  const locks = useSectionLocks();
  const openButton = useRef<HTMLButtonElement>(null);
  const hideButton = useRef<HTMLButtonElement>(null);
  const toggledByUser = useRef(false);

  useEffect(restoreEditor, []);

  // Le focus suit le bouton qui reste visible, pour ne pas perdre la personne au clavier.
  useEffect(() => {
    if (!toggledByUser.current) return;
    toggledByUser.current = false;
    (panelOpen ? hideButton : openButton).current?.focus();
  }, [panelOpen]);

  const togglePanel = () => {
    toggledByUser.current = true;
    setPanelOpen((open) => !open);
  };

  // Sans le code, les sections verrouillées restent hors de l'export (verrous pas encore lus : on attend).
  const exportDisabled = busy || (!unlocked && !locks.loaded);
  const exportAll = async () => {
    if (exportDisabled) return;
    setBusy(true);
    try {
      const { exportResources } = await import('../lib/resources/exportAll');
      const done = await exportResources((path) => unlocked || !locks.isLocked(path));
      if (!done) notify('Rien à exporter pour l’instant.');
    } catch {
      notify('L’export a échoué.');
    }
    setBusy(false);
  };

  return (
    <div className={styles.layout}>
      <Outlet />
      {panelOpen ? (
        <SidePanel>
          <button
            ref={hideButton}
            type="button"
            className={styles.panelHeader}
            aria-expanded="true"
            aria-controls={SIDE_PANEL_ID}
            title="Masquer le panneau"
            onClick={togglePanel}
          >
            <Icon name="sidebar-simple-right-wide" size="md" />
            <span>Éditeur</span>
          </button>
          <div className={styles.panelBody}>
            <ResourceEditorPanel tips={page?.editTips ?? []} />
          </div>
          <button
            type="button"
            className={styles.exportButton}
            aria-disabled={exportDisabled}
            onClick={() => void exportAll()}
          >
            <span>{busy ? 'Export en cours…' : EXPORT_LABEL}</span>
            <Icon name="arrow-inbox" size="sm" />
          </button>
        </SidePanel>
      ) : (
        <div className={styles.aside}>
          <button
            ref={openButton}
            type="button"
            className={styles.panelToggle}
            aria-label="Modifier les ressources"
            title="Modifier les ressources"
            aria-expanded="false"
            aria-controls={SIDE_PANEL_ID}
            onClick={togglePanel}
          >
            <Icon name="sidebar-simple-right-wide" size="md" />
          </button>
          <button
            type="button"
            className={styles.download}
            aria-label={`${EXPORT_LABEL} (.zip)`}
            title={`${EXPORT_LABEL} (.zip)`}
            aria-disabled={exportDisabled}
            onClick={() => void exportAll()}
          >
            <Icon name="arrow-inbox" size="md" />
          </button>
        </div>
      )}
      <Toaster events={resourceEvents} />
    </div>
  );
}
