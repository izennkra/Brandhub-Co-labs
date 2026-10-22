import { useState } from 'react';
import { useEditor } from '../../lib/resources/editor';
import styles from './resources.module.css';

// Panneau latéral des Ressources : le code déverrouille la modification du contenu.
export function ResourceEditorPanel({ tips }: { tips: string[] }) {
  const { unlocked, unlock, lock } = useEditor();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked)
    return (
      <div className={styles.panelBody}>
        <h2 className={styles.panelTitle}>Mode édition</h2>
        <p>Tu peux modifier cette page directement.</p>
        {tips.length > 0 && (
          <ul className={styles.tips}>
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
        <button type="button" className={styles.button} onClick={lock}>
          Verrouiller
        </button>
      </div>
    );

  return (
    <form
      className={styles.panelBody}
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
      <h2 className={styles.panelTitle}>Modifier les ressources</h2>
      <p>Seules les personnes qui ont le code peuvent changer le contenu.</p>
      <label className={styles.fieldLabel}>
        <span>Code</span>
        <input
          type="password"
          className={styles.field}
          autoComplete="current-password"
          value={code}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'editor-code-error' : undefined}
          onChange={(event) => setCode(event.target.value)}
        />
      </label>
      {error && (
        <p id="editor-code-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={styles.primary} disabled={busy}>
        {busy ? 'Vérification…' : 'Déverrouiller'}
      </button>
    </form>
  );
}
