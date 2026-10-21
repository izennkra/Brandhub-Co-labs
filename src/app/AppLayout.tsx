import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import { Icon } from '../components/Icon';
import { Sidebar, SIDEBAR_ID } from '../components/Sidebar/Sidebar';
import styles from './AppLayout.module.css';
import { NARROW_SCREEN, useMediaQuery } from './useMediaQuery';

// Cadre commun à toutes les pages : colonne de gauche + contenu de la page.
// Sous 1280 px, la colonne se replie derrière un bouton « menu » et s'ouvre en tiroir.
export function AppLayout() {
  const narrow = useMediaQuery(NARROW_SCREEN);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const toggledByUser = useRef(false);

  const setMenu = useCallback((open: boolean) => {
    toggledByUser.current = true;
    setMenuOpen(open);
  }, []);
  const closeMenu = useCallback(() => setMenu(false), [setMenu]);

  // Le focus entre dans le tiroir à l'ouverture et revient sur le bouton à la fermeture.
  useEffect(() => {
    if (!toggledByUser.current) return;
    toggledByUser.current = false;
    (menuOpen ? closeButton : menuButton).current?.focus();
  }, [menuOpen]);

  const drawerOpen = narrow && menuOpen;

  return (
    <div className={styles.layout}>
      {narrow && (
        <button
          ref={menuButton}
          type="button"
          className={styles.menuButton}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          aria-controls={SIDEBAR_ID}
          inert={drawerOpen}
          onClick={() => setMenu(true)}
        >
          <Icon name="bars-two" size="md" />
        </button>
      )}
      {!narrow && <Sidebar />}
      {drawerOpen && (
        <>
          <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
          <Sidebar drawer onClose={closeMenu} closeRef={closeButton} />
        </>
      )}
      <main className={styles.main} inert={drawerOpen}>
        <Outlet />
      </main>
    </div>
  );
}
