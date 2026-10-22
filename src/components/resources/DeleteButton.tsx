import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import styles from './resources.module.css';

// Suppression en deux temps (comme les images et les préréglages) : le premier clic demande
// confirmation pendant 3 secondes, le second supprime.
export function DeleteButton({ name, onDelete }: { name: string; onDelete: () => void }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={styles.delete}
      data-armed={armed}
      aria-label={armed ? `Confirmer la suppression de ${name}` : `Supprimer ${name}`}
      onClick={() => {
        clearTimeout(timer.current);
        if (armed) {
          setArmed(false);
          onDelete();
          return;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3000);
      }}
    >
      {armed ? 'Supprimer ?' : <Icon name="cross-medium" size="xs" />}
    </button>
  );
}
