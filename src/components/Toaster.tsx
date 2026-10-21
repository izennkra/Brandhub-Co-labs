import { useEffect, useState } from 'react';
import styles from './Toaster.module.css';

// Messages du moteur (toast du prototype), affichés 4 secondes et lus par les lecteurs d'écran.
// La zone annoncée existe toujours, même vide, pour que chaque nouveau message soit bien lu.
export function Toaster({ events }: { events: EventTarget | null }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!events) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onToast = (event: Event) => {
      setMessage(String((event as CustomEvent).detail ?? ''));
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(''), 4000);
    };
    events.addEventListener('toast', onToast);
    return () => {
      clearTimeout(timer);
      events.removeEventListener('toast', onToast);
    };
  }, [events]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message && <p className={styles.toast}>{message}</p>}
    </div>
  );
}
