import { useEffect, useRef, useState } from 'react';

// Outils partagés par la liste d'images du panneau et le bandeau sous la scène.
export type ImageItem = { name: string; thumb: string; inLoop: boolean; selected: boolean };

// Retrait en deux temps, comme dans le prototype (deleteImage, ligne 2845) : le premier clic
// demande confirmation pendant 3 secondes, le second retire l'image.
export function useArmedDelete(onDelete: (index: number) => void) {
  const [armed, setArmed] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    armed,
    request(index: number) {
      clearTimeout(timer.current);
      if (armed === index) {
        setArmed(null);
        onDelete(index);
        return;
      }
      setArmed(index);
      timer.current = setTimeout(() => setArmed(null), 3000);
    },
  };
}

// Glisser-déposer pour réordonner (souris) : renvoie les écouteurs d'un élément de la liste.
export function useReorder(onMove: (from: number, to: number) => void) {
  const from = useRef(-1);
  return (index: number) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      from.current = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (event: React.DragEvent) => {
      if (from.current >= 0) event.preventDefault();
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      const start = from.current;
      from.current = -1;
      if (start >= 0 && start !== index) onMove(start, index);
    },
  });
}
