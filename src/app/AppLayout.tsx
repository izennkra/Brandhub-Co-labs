import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar/Sidebar';
import styles from './AppLayout.module.css';

// Cadre commun à toutes les pages : colonne de gauche + contenu de la page.
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
