import { useEffect, type Ref } from 'react';
import { useLocation } from 'react-router';
import { rememberPage, sectionOf } from '../../app/navigation';
import { CoLabsLogo } from '../CoLabsLogo';
import { Icon } from '../Icon';
import { ModeSwitch } from './ModeSwitch';
import { NavItem } from './NavItem';
import styles from './Sidebar.module.css';

export const SIDEBAR_ID = 'app-sidebar';

type SidebarProps = {
  // Sur petit écran, la colonne s'affiche en tiroir par-dessus la page.
  drawer?: boolean;
  onClose?: () => void;
  closeRef?: Ref<HTMLButtonElement>;
};

export function Sidebar({ drawer = false, onClose, closeRef }: SidebarProps) {
  const { pathname } = useLocation();
  const section = sectionOf(pathname);

  useEffect(() => {
    rememberPage(section, pathname);
  }, [section, pathname]);

  return (
    <aside
      id={SIDEBAR_ID}
      className={drawer ? `${styles.sidebar} ${styles.drawer}` : styles.sidebar}
      onKeyDown={drawer ? (event) => event.key === 'Escape' && onClose?.() : undefined}
    >
      <div className={styles.brand}>
        <CoLabsLogo />
        <span className={styles.badge}>BETA</span>
        {drawer && (
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Fermer le menu"
            onClick={onClose}
          >
            <Icon name="cross-medium" size="md" />
          </button>
        )}
      </div>
      <hr className={styles.divider} />
      <ModeSwitch current={section} pathname={pathname} />
      <nav aria-label="Navigation principale">
        <ul className={styles.list}>
          {section.pages.map((page) => (
            <li key={page.path}>
              <NavItem
                to={page.path}
                label={page.label}
                icon={page.icon}
                onNavigate={drawer ? onClose : undefined}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
