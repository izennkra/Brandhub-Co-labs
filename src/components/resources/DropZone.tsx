import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './resources.module.css';

// Zone d'ajout du mode édition : on y dépose des fichiers, ou on clique pour les choisir.
export function DropZone({
  accept,
  label,
  onFiles,
  multiple = true,
  children,
}: {
  accept: string;
  label: string;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  children?: ReactNode;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={id}
      className={styles.drop}
      data-over={over}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (event.dataTransfer.files.length) onFiles([...event.dataTransfer.files]);
      }}
    >
      <Icon name="plus-large" size="md" />
      <span>{label}</span>
      {children}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className={styles.visuallyHidden}
        onChange={(event) => {
          if (event.target.files?.length) onFiles([...event.target.files]);
          event.target.value = '';
        }}
      />
    </label>
  );
}
