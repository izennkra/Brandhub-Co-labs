import { useId } from 'react';
import styles from './ColorPicker.module.css';

type Swatch = { id: string; name: string; hex: string };

// Section Couleurs (maquette validée le 21/10/2026), reprise du prototype (syncColorsUI, ligne 3525) :
// Fond = une couleur de la palette (carrés), Pastilles = une ou plusieurs couleurs (ronds).
// Vraies cases radio / à cocher, masquées : flèches, Espace et nom de la couleur annoncé.
// La palette vient du moteur : ses couleurs ne sont pas des tokens de l'interface.
export function ColorPicker({
  palette,
  background,
  dots,
  onBackground,
  onToggleDot,
  showBackground = true,
}: {
  palette: readonly Swatch[];
  background: string;
  dots: ReadonlySet<string>;
  onBackground: (id: string) => void;
  onToggleDot: (id: string) => void;
  /** Layout editor : le fond se règle sur le frame, pas sur la forme. */
  showBackground?: boolean;
}) {
  const id = useId();
  return (
    <>
      {showBackground && (
        <div className={styles.row}>
          <span id={`${id}-bg`} className={styles.label}>
            Fond
          </span>
          <div role="radiogroup" aria-labelledby={`${id}-bg`} className={styles.swatches}>
            {palette.map((swatch) => (
              <label key={swatch.id} className={styles.swatch} title={swatch.name}>
                <input
                  type="radio"
                  name={`${id}-bg`}
                  className={styles.input}
                  aria-label={swatch.name}
                  checked={background === swatch.id}
                  onChange={() => onBackground(swatch.id)}
                />
                <span
                  className={`${styles.chip} ${styles.square}`}
                  style={{ '--swatch': swatch.hex } as React.CSSProperties}
                />
              </label>
            ))}
          </div>
        </div>
      )}
      <div className={styles.row}>
        <span id={`${id}-dots`} className={styles.label}>
          Pastilles
        </span>
        <div role="group" aria-labelledby={`${id}-dots`} className={styles.swatches}>
          {palette.map((swatch) => (
            <label key={swatch.id} className={styles.swatch} title={swatch.name}>
              <input
                type="checkbox"
                className={styles.input}
                aria-label={swatch.name}
                checked={dots.has(swatch.id)}
                onChange={() => onToggleDot(swatch.id)}
              />
              <span
                className={`${styles.chip} ${styles.round}`}
                style={{ '--swatch': swatch.hex } as React.CSSProperties}
              />
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
