import styles from './Segmented.module.css';

// Sélecteur segmenté du panneau Éditeur (Figma : Membrane / Ligne).
// Groupe de boutons, le choix actif est annoncé par aria-pressed (comme dans le prototype).
export function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.segment}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
