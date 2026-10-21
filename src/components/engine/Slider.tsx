import { useLayoutEffect, useRef, useState } from 'react';
import styles from './Slider.module.css';

// Curseur du panneau Éditeur (Figma : barre remplie, libellé à gauche, valeur à droite).
// Un vrai input range, transparent, couvre la ligne : souris, flèches, Début / Fin, valeur annoncée.
// Comme dans le prototype (ligne 2640), la barre couvre toujours le libellé, puis avance jusqu'au bord droit.
export function Slider({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  useLayoutEffect(() => {
    setLabelWidth(Math.ceil(labelRef.current?.offsetWidth ?? 0));
  }, [label]);

  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const text = format(value);

  return (
    <div
      className={styles.row}
      style={
        {
          '--progress': String(Number(progress.toFixed(4))),
          '--label-w': `${labelWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.fill} aria-hidden="true" />
      <span ref={labelRef} className={styles.label} aria-hidden="true">
        {label}
      </span>
      <span className={styles.value} aria-hidden="true">
        {text}
      </span>
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={text}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </div>
  );
}
