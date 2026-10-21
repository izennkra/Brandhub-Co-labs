import { useLayoutEffect, useRef, useState } from 'react';
import styles from './Slider.module.css';

// Curseur du panneau Éditeur (Figma : barre remplie, libellé à gauche, valeur à droite).
// Un vrai input range, transparent, couvre la ligne : souris, flèches, Début / Fin, valeur annoncée.
// Comme dans le prototype (ligne 2640), la barre couvre toujours le libellé, puis avance jusqu'à la valeur.
// Les largeurs sont mesurées à chaque affichage (une section repliée mesure 0) : libellé, et valeur la
// plus large possible, pour que le repère ne touche jamais le texte de droite.
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
  const rowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState({ label: 0, value: 0 });
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const extremes = [min, max, (min + max) / 2].map(format);
    const measure = () => {
      const label = Math.ceil(labelRef.current?.offsetWidth ?? 0);
      const value = Math.ceil(widestText(extremes, valueRef.current));
      setWidths((old) => (old.label === label && old.value === value ? old : { label, value }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [label, min, max, format]);

  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const text = format(value);

  return (
    <div
      ref={rowRef}
      className={styles.row}
      style={
        {
          '--progress': String(Number(progress.toFixed(4))),
          '--label-w': `${widths.label}px`,
          '--value-w': `${widths.value}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.fill} aria-hidden="true" />
      <span ref={labelRef} className={styles.label} aria-hidden="true">
        {label}
      </span>
      <span ref={valueRef} className={styles.value} aria-hidden="true">
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

// Largeur du plus long des textes, dans la police de l'élément (0 sans canvas, ex. tests unitaires).
let measureContext: CanvasRenderingContext2D | null | undefined;
function widestText(texts: string[], element: HTMLElement | null) {
  if (!element) return 0;
  measureContext ??= document.createElement('canvas').getContext('2d');
  if (!measureContext) return element.offsetWidth;
  measureContext.font = getComputedStyle(element).font;
  return Math.max(element.offsetWidth, ...texts.map((text) => measureContext!.measureText(text).width));
}
