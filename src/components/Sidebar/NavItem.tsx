import { NavLink } from 'react-router';
import { Icon, type IconName } from '../Icon';
import styles from './NavItem.module.css';

// « locked » : section Ressource verrouillée par l'éditeur (cadenas à droite, annoncé avec le nom).
type NavItemProps = { to: string; label: string; icon: IconName; locked?: boolean; onNavigate?: () => void };

export function NavItem({ to, label, icon, locked = false, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
    >
      <Icon name={icon} size="sm" />
      <span>{label}</span>
      {locked && (
        <>
          <Icon name="lock" size="sm" className={styles.lock} />
          <span className="visually-hidden">, verrouillée</span>
        </>
      )}
    </NavLink>
  );
}
