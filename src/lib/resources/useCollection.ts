import { useCallback, useEffect, useState } from 'react';
import { getStore } from '../store/store';
import { notify } from './events';

// Une collection de ressources (logos, couleurs, images…), triée par « order ».
// Chaque modification passe par le stockage partagé, puis toutes les vues de la collection se relisent.
export type Entry<T> = T & { id: string; order: number };

const changes = new EventTarget();
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const failMessage = (error: unknown) =>
  (error as { code?: string })?.code === 'quota'
    ? 'Espace du navigateur plein : retire des images ou relie le stockage partagé.'
    : /code/.test(String((error as Error)?.message))
      ? 'Modification refusée : le code éditeur n’est plus valable.'
      : 'Modification impossible pour le moment.';

export function useCollection<T extends object>(col: string) {
  const [items, setItems] = useState<Entry<T>[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getStore()
        .list<T & { order?: number }>(col)
        .then((list) =>
          list
            .map(({ id, data }) => ({ ...data, id, order: data.order ?? 0 }) as Entry<T>)
            .sort((a, b) => a.order - b.order),
        )
        .catch(() => [] as Entry<T>[])
        .then((next) => {
          if (cancelled) return;
          setItems(next);
          setLoaded(true);
        });
    void load();
    const onChange = (event: Event) => {
      if ((event as CustomEvent).detail === col) void load();
    };
    changes.addEventListener('change', onChange);
    return () => {
      cancelled = true;
      changes.removeEventListener('change', onChange);
    };
  }, [col]);

  const write = useCallback(
    async (job: () => Promise<void>, message?: string) => {
      try {
        await job();
        if (message) notify(message);
        return true;
      } catch (error) {
        notify(failMessage(error));
        return false;
      } finally {
        changes.dispatchEvent(new CustomEvent('change', { detail: col }));
      }
    },
    [col],
  );

  const strip = (entry: Partial<Entry<T>>) => {
    const copy: Record<string, unknown> = { ...entry };
    delete copy.id;
    return copy;
  };

  return {
    items,
    loaded,
    /** Ajoute à la fin (ou à la place donnée). */
    add: (data: T, message?: string) =>
      write(async () => {
        const order = items.length ? Math.max(...items.map((i) => i.order)) + 1 : 0;
        await getStore().put(col, newId(), { ...data, order });
      }, message),
    update: (id: string, patch: Partial<T>, message?: string) =>
      write(async () => {
        const current = items.find((i) => i.id === id);
        if (!current) return;
        await getStore().put(col, id, strip({ ...current, ...patch }));
      }, message),
    remove: (id: string, message?: string) => write(() => getStore().del(col, id), message),
    /** Déplace un élément (glisser-déposer ou flèches) : les positions sont réécrites dans l'ordre. */
    move: (from: number, to: number) =>
      write(async () => {
        if (from === to || to < 0 || to >= items.length) return;
        const list = [...items];
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        await Promise.all(
          list.map((item, order) =>
            item.order === order ? undefined : getStore().put(col, item.id, strip({ ...item, order })),
          ),
        );
      }),
  };
}
