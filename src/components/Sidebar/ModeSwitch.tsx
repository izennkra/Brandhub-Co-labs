import { Link } from 'react-router';
import { lastPage, SECTIONS, type Section } from '../../app/navigation';
import { Icon } from '../Icon';
import styles from './ModeSwitch.module.css';

// Sélecteur Tool / Ressource : chaque onglet ramène à la dernière page visitée de sa section
// (l'onglet actif garde la page affichée).
export function ModeSwitch({ current, pathname }: { current: Section; pathname: string }) {
  return (
    <nav aria-label="Sections">
      <ul className={styles.switch}>
        {SECTIONS.map((section) => {
          const active = section.id === current.id;
          return (
            <li key={section.id} className={styles.cell}>
              <Link
                to={active ? pathname : lastPage(section)}
                aria-current={active ? 'true' : undefined}
                className={active ? `${styles.tab} ${styles.active}` : styles.tab}
              >
                <Icon name={section.icon} size="sm" />
                <span>{section.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
