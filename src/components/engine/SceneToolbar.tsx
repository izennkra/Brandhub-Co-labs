import { useEffect } from 'react';
import { Icon } from '../Icon';
import styles from './SceneToolbar.module.css';

// Barre de scène en haut à gauche (spec) : lecture / pause, nouvelle forme (Motif) ou rejouer
// (Illustration), aussi avec la touche R comme dans le prototype.
export function SceneToolbar({
  paused,
  illustration,
  onTogglePause,
  onNewShape,
}: {
  paused: boolean;
  illustration: boolean;
  onTogglePause: () => void;
  onNewShape: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]',
        )
      )
        return;
      if (document.querySelector('main[inert]')) return;
      event.preventDefault();
      onNewShape();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onNewShape]);

  const newLabel = illustration ? 'Rejouer' : 'Nouvelle forme';
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Commandes de la scène">
      <button
        type="button"
        className={styles.button}
        aria-label={paused ? 'Reprendre' : 'Mettre en pause'}
        title={paused ? 'Reprendre' : 'Pause'}
        onClick={onTogglePause}
      >
        <Icon name={paused ? 'play' : 'pause'} size="md" />
      </button>
      <button
        type="button"
        className={styles.button}
        aria-label={newLabel}
        title={`${newLabel} (R)`}
        onClick={onNewShape}
      >
        <Icon name={illustration ? 'replay' : 'shuffle'} size="md" />
      </button>
    </div>
  );
}
