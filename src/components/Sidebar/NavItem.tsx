import { NavLink } from 'react-router';
import { Icon, type IconName } from '../Icon';
import styles from './NavItem.module.css';

type NavItemProps = { to: string; label: string; icon: IconName; onNavigate?: () => void };

export function NavItem({ to, label, icon, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
    >
      <Icon name={icon} size="sm" />
      <span>{label}</span>
    </NavLink>
  );
}
