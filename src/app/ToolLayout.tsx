import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { EDITOR_PANEL_ID, EditorPanel } from '../components/EditorPanel/EditorPanel';
import { Icon } from '../components/Icon';
import { LayoutPanel } from '../components/layout/LayoutPanel';
import { TOOL_PAGES } from './navigation';
import styles from './ToolLayout.module.css';

// Gabarit des pages Tool : zone centrale + panneau Éditeur repliable (bouton ou ⌥ H / Alt + H).
export function ToolLayout() {
  const { pathname } = useLocation();
  const page = TOOL_PAGES.find((tool) => tool.path === pathname);
  const [panelOpen, setPanelOpen] = useState(true);
  const panelToggle = useRef<HTMLButtonElement>(null);
  const reopenButton = useRef<HTMLButtonElement>(null);
  const toggledByUser = useRef(false);

  const togglePanel = useCallback(() => {
    toggledByUser.current = true;
    setPanelOpen((open) => !open);
  }, []);

  // Le focus suit le bouton qui reste visible, pour ne pas perdre la personne au clavier.
  useEffect(() => {
    if (!toggledByUser.current) return;
    toggledByUser.current = false;
    (panelOpen ? panelToggle : reopenButton).current?.focus();
  }, [panelOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // ⌥ H / Alt + H (la touche H seule reste libre pour écrire) ; event.code car ⌥ H donne « ˙ » sur Mac.
      if (event.code !== 'KeyH' || !event.altKey || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      // Menu ouvert sur petit écran : la page est inactive, le raccourci aussi.
      if (document.querySelector('main[inert]')) return;
      event.preventDefault();
      togglePanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePanel]);

  return (
    <div className={styles.layout}>
      <div className={styles.stage}>
        <Outlet />
        {!panelOpen && (
          <button
            ref={reopenButton}
            type="button"
            className={styles.reopen}
            aria-label="Afficher l’éditeur"
            aria-expanded="false"
            aria-controls={EDITOR_PANEL_ID}
            title="Afficher l’éditeur (⌥ H)"
            onClick={togglePanel}
          >
            <Icon name="sidebar-simple-right-wide" size="md" />
          </button>
        )}
      </div>
      {panelOpen && page?.layout && <LayoutPanel onHide={togglePanel} toggleRef={panelToggle} />}
      {panelOpen && !page?.layout && (
        <EditorPanel
          sections={page?.editorSections ?? []}
          engineMode={page?.engine}
          pageKey={pathname}
          onHide={togglePanel}
          toggleRef={panelToggle}
        />
      )}
    </div>
  );
}
