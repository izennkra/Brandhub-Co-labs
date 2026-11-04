import type { Engine } from '../lib/pattern-engine/createEngine';
import { ATTRIBUTES, readSettings, type View } from './settings';

// <colabs-motif> : le motif Co-labs sur le site d'un client, avec le moteur tel quel (aucune
// modification), sans l'outil d'édition. Réglages par attributs en français (settings.ts).
// - Le moteur (≈ 270 Ko) ne se charge que quand le motif arrive à l'écran.
// - Hors de l'écran, onglet caché ou animations réduites demandées : le motif est en pause.
// - Un seul motif animé par page : le moteur n'en gère qu'un.
const STYLE = `
colabs-motif { display: block; position: relative; overflow: hidden; }
colabs-motif:not([style*="height"]) { aspect-ratio: 16 / 9; }
colabs-motif #scene { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
colabs-motif #scene.dragging { cursor: grabbing; }
`;

let enginePromise: Promise<Engine> | null = null;
function engine() {
  // Les modèles 3D (Illustration) ne servent pas au motif : on ne les charge pas.
  (window as Window & { __engineTestHooks?: { noModels?: boolean } }).__engineTestHooks ??= {
    noModels: true,
  };
  enginePromise ??= import('../lib/pattern-engine/createEngine').then(({ getEngine }) => getEngine());
  return enginePromise;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export class ColabsMotif extends HTMLElement {
  static observedAttributes = [...ATTRIBUTES];
  private engine: Engine | null = null;
  private visible = false;
  private applyTimer: ReturnType<typeof setTimeout> | undefined;
  private observers: { disconnect(): void }[] = [];

  connectedCallback() {
    if (!document.getElementById('colabs-motif-style')) {
      const style = document.createElement('style');
      style.id = 'colabs-motif-style';
      style.textContent = STYLE;
      document.head.append(style);
    }
    const seen = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible && !this.engine)
        this.start().catch((error: unknown) =>
          console.error('colabs-motif : le motif n’a pas pu démarrer', error),
        );
      this.updatePause();
    });
    seen.observe(this);
    const size = new ResizeObserver(() => this.engine?.core.resize());
    size.observe(this);
    this.observers = [seen, size];
    document.addEventListener('visibilitychange', this.updatePause);
  }

  disconnectedCallback() {
    this.observers.forEach((o) => o.disconnect());
    document.removeEventListener('visibilitychange', this.updatePause);
    this.engine?.detach(this);
    this.engine = null;
  }

  attributeChangedCallback() {
    if (!this.engine) return;
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => this.apply(), 120);
  }

  /** Orientation actuelle (après avoir tourné la forme à la souris), en degrés. */
  orientation() {
    const orbit = this.engine?.core.orbit as View | undefined;
    if (!orbit) return null;
    const round = (v: number) => Math.round(v * 10) / 10;
    return {
      rotation: round((orbit.theta * 180) / Math.PI),
      inclinaison: round(90 - (orbit.phi * 180) / Math.PI),
      distance: round(orbit.radius),
    };
  }

  /** Nouvelle forme au hasard : sa graine est écrite dans l'attribut « graine ». */
  nouvelleForme() {
    this.setAttribute('graine', String((Math.random() * 1e9) | 0));
  }

  private async start() {
    const loaded = await engine();
    if (!this.isConnected) return;
    this.engine = loaded;
    loaded.actions.setApp('motif');
    this.apply();
    loaded.attach(this);
    this.updatePause();
    this.dispatchEvent(new Event('pret'));
  }

  private apply() {
    if (!this.engine) return;
    this.engine.presets.applySnapshot(readSettings((name) => this.getAttribute(name)));
    this.updatePause();
  }

  private updatePause = () => {
    if (!this.engine) return;
    this.engine.core.S.paused = !this.visible || document.hidden || reducedMotion();
  };
}

if (!customElements.get('colabs-motif')) customElements.define('colabs-motif', ColabsMotif);
