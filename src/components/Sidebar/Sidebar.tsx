import { TOOL_PAGES } from '../../app/navigation';
import { CoLabsLogo } from '../CoLabsLogo';
import { NavItem } from './NavItem';
import styles from './Sidebar.module.css';

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <CoLabsLogo />
        <span className={styles.badge}>BETA</span>
      </div>
      <hr className={styles.divider} />
      <nav aria-label="Navigation principale">
        <ul className={styles.list}>
          {TOOL_PAGES.map((page) => (
            <li key={page.path}>
              <NavItem to={page.path} label={page.label} icon={page.icon} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
