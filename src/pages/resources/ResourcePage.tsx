import type { ReactNode } from 'react';
import { usePageTitle } from '../../app/usePageTitle';
import styles from './ResourcePage.module.css';

// Gabarit commun des pages Ressource (Figma « Ressource / … ») : titre, description, puis le contenu.
export function ResourcePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  usePageTitle(title);
  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </header>
        {children}
      </div>
    </section>
  );
}
