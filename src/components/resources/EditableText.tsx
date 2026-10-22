import { useState } from 'react';
import styles from './resources.module.css';

// Texte modifiable en mode édition (nom d'un logo, d'une couleur…) : enregistré en quittant le champ
// ou avec Entrée ; Échap annule. Hors mode édition, simple texte.
export function EditableText({
  value,
  label,
  editing,
  onSave,
  className,
  placeholder,
  multiline = false,
}: {
  value: string;
  label: string;
  editing: boolean;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (!editing) return <span className={className}>{value}</span>;
  const commit = () => {
    if (draft !== null && draft.trim() !== value) onSave(draft.trim());
    setDraft(null);
  };
  const props = {
    className: `${styles.field} ${className ?? ''}`,
    'aria-label': label,
    placeholder,
    value: draft ?? value,
    onChange: (event: { target: { value: string } }) => setDraft(event.target.value),
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !(multiline && event.shiftKey)) {
        event.preventDefault();
        (event.target as HTMLElement).blur();
      }
      if (event.key === 'Escape') {
        setDraft(null);
        (event.target as HTMLElement).blur();
      }
    },
  };
  return multiline ? <textarea rows={2} {...props} /> : <input type="text" {...props} />;
}
