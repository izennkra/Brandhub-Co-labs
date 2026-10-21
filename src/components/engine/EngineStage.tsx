import { useEffect, useRef, useState } from 'react';
import type { ToolPageDef } from '../../app/navigation';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import styles from './EngineStage.module.css';

type Status = 'loading' | 'ready' | 'error';

// Zone centrale des pages Tool : y place la scène du moteur (chargé à la demande, une seule fois)
// et met le moteur dans le mode de la page (Motif ou Illustration).
export function EngineStage({ mode }: { mode: NonNullable<ToolPageDef['engine']> }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let engine: Engine | null = null;

    import('../../lib/pattern-engine/createEngine')
      .then(({ getEngine }) => getEngine())
      .then((ready) => {
        if (cancelled) return;
        engine = ready;
        ready.actions.setApp(mode === 'illustration' ? 'image' : 'motif');
        ready.attach(element);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      engine?.detach(element);
    };
  }, [mode]);

  return (
    <div ref={host} className={styles.stage} aria-busy={status === 'loading'}>
      {status === 'loading' && <p className={styles.message}>Chargement du moteur…</p>}
      {status === 'error' && (
        <p className={styles.message} role="alert">
          Le moteur n’a pas pu démarrer. Recharge la page ; si le problème continue, préviens l’équipe.
        </p>
      )}
    </div>
  );
}
