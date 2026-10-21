import { useEffect, useState } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';

// Le moteur partagé (chargé à la demande, comme la scène), et un nouveau rendu à chaque
// changement de réglage : les valeurs sont lues dans engine.core.S au moment du rendu.
export function useEngine(enabled: boolean): Engine | null {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const refresh = () => setVersion((version) => version + 1);
    let events: EventTarget | null = null;

    import('../../lib/pattern-engine/createEngine')
      .then(async ({ getEngine, engineEvents }) => {
        const ready = await getEngine();
        if (cancelled) return;
        events = engineEvents;
        events.addEventListener('settings', refresh);
        setEngine(ready);
      })
      .catch((error: unknown) => console.error(error));

    return () => {
      cancelled = true;
      events?.removeEventListener('settings', refresh);
    };
  }, [enabled]);

  return enabled ? engine : null;
}
