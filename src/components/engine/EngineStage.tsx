import { useEffect, useRef, useState } from 'react';
import type { Engine } from '../../lib/pattern-engine/createEngine';
import styles from './EngineStage.module.css';

type Status = 'loading' | 'ready' | 'error';

// Zone centrale des pages Tool : y place la scène du moteur (chargé à la demande, une seule fois).
export function EngineStage() {
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
  }, []);

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
