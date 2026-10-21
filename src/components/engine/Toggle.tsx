import styles from './Toggle.module.css';

// Interrupteur du panneau Éditeur (Figma : ligne avec libellé, petite piste à droite).
// Case à cocher native avec le rôle « switch » : Espace la bascule, l'état est annoncé.
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true" />
    </label>
  );
}
