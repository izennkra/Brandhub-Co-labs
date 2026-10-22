import { useState } from 'react';
import { useEditor } from '../../lib/resources/editor';
import styles from './ImageList.module.css';

// Mode édition depuis la section Images de l'Illustration (le même code que les pages Ressource) :
// il permet de supprimer définitivement une illustration et de mettre à jour celles de l'équipe.
export function EditorAccess() {
  const { unlocked, unlock, lock } = useEditor();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked)
    return (
      <div className={styles.access}>
        <p className={styles.note}>Mode édition : la croix supprime définitivement, pour tout le monde.</p>
        <button
          type="button"
          className={styles.saveButton}
          onClick={() => {
            setOpen(false);
            lock();
          }}
        >
          Verrouiller
        </button>
      </div>
    );

  if (!open)
    return (
      <button type="button" className={styles.link} onClick={() => setOpen(true)}>
        Supprimer définitivement ? Ouvrir le mode édition
      </button>
    );

  return (
    <form
      className={styles.access}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        const ok = await unlock(code);
        setBusy(false);
        setError(ok ? '' : 'Ce code ne fonctionne pas.');
        if (ok) setCode('');
      }}
    >
      <input
        type="password"
        className={styles.rename}
        aria-label="Code du mode édition"
        placeholder="Code"
        autoComplete="current-password"
        value={code}
        aria-invalid={Boolean(error)}
        onChange={(event) => setCode(event.target.value)}
      />
      {error && (
        <p className={styles.note} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.saveButton} disabled={busy}>
        {busy ? 'Vérification…' : 'Déverrouiller'}
      </button>
    </form>
  );
}
