import { usePageTitle } from '../../app/usePageTitle';
import styles from './ResourcePage.module.css';

// Gabarit commun des pages Ressource (Figma « Ressource / … ») : titre, description,
// puis le contenu de la page, qui arrive avec la partie resources.
export function ResourcePage({ title, description }: { title: string; description: string }) {
  usePageTitle(title);
  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>
        <p className={styles.pending}>Le contenu de cette page arrive avec la partie resources.</p>
      </div>
    </section>
  );
}
