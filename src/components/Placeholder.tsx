import styles from './Placeholder.module.css';

// Emplacement réservé, en attendant le contenu d'une partie suivante.
export function Placeholder({ children }: { children: string }) {
  return (
    <div className={styles.placeholder}>
      <p>{children}</p>
    </div>
  );
}
