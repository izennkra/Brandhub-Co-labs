import { NavLink } from 'react-router';
import { Icon, type IconName } from '../Icon';
import styles from './NavItem.module.css';

// « locked » : section Ressource verrouillée par l'éditeur (cadenas à droite, annoncé avec le nom).
// « disabled » : pour un visiteur, la section verrouillée n'est pas un lien (on ne peut pas l'ouvrir).
type NavItemProps = {
  to: string;
  label: string;
  icon: IconName;
  locked?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
};

export function NavItem({ to, label, icon, locked = false, disabled = false, onNavigate }: NavItemProps) {
  const content = (
    <>
      <Icon name={icon} size="sm" />
      <span>{label}</span>
      {locked && (
        <>
          <Icon name="lock" size="sm" className={styles.lock} />
          <span className="visually-hidden">, verrouillée</span>
        </>
      )}
    </>
  );

  if (disabled)
    return (
      <span className={`${styles.item} ${styles.disabled}`} aria-disabled="true">
        {content}
      </span>
    );

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
    >
      {content}
    </NavLink>
  );
}
