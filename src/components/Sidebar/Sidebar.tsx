import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { rememberPage, sectionOf } from '../../app/navigation';
import { CoLabsLogo } from '../CoLabsLogo';
import { ModeSwitch } from './ModeSwitch';
import { NavItem } from './NavItem';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { pathname } = useLocation();
  const section = sectionOf(pathname);

  useEffect(() => {
    rememberPage(section, pathname);
  }, [section, pathname]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <CoLabsLogo />
        <span className={styles.badge}>BETA</span>
      </div>
      <hr className={styles.divider} />
      <ModeSwitch current={section} pathname={pathname} />
      <nav aria-label="Navigation principale">
        <ul className={styles.list}>
          {section.pages.map((page) => (
            <li key={page.path}>
              <NavItem to={page.path} label={page.label} icon={page.icon} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
