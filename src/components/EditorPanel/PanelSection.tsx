import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './PanelSection.module.css';

// Section dépliable du panneau Éditeur (motif « accordéon » accessible).
export function PanelSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        <button
          type="button"
          id={`${id}-toggle`}
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{title}</span>
          <Icon name="chevron-down-small" size="xs" className={open ? undefined : styles.closed} />
        </button>
      </h2>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-toggle`}
        className={styles.content}
        hidden={!open}
      >
        {children}
      </div>
    </section>
  );
}
