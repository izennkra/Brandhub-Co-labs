import type { Engine } from '../lib/pattern-engine/createEngine';
import { ATTRIBUTES, isTransparent, readFormat, readSettings, type View } from './settings';

// <colabs-motif> : le motif Co-labs sur le site d'un client, avec le moteur tel quel (aucune
// modification), sans l'outil d'édition. Réglages par attributs en français (settings.ts) ;
// mode d'emploi pour le développeur : embed/LISEZMOI.md.
// - Le moteur (≈ 320 Ko compressé) ne se charge que quand le motif arrive à l'écran.
// - Hors de l'écran, onglet caché ou animations réduites demandées : le motif est en pause.
// - Taille : celle du bloc (CSS libre) ; sans hauteur, l'attribut « format » (16/9 par défaut).
// - Un seul motif animé par page : le moteur n'en gère qu'un.
// Le dessin du moteur remplit le bloc sans jamais en changer la taille (grilles, colonnes flexibles).
const STYLE = `
colabs-motif { display: block; position: relative; overflow: hidden; min-width: 0; }
colabs-motif #scene { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
colabs-motif #scene.dragging { cursor: grabbing; }
`;

let enginePromise: Promise<Engine> | null = null;
let transparent = false;

function engine() {
  // Les modèles 3D (Illustration) ne servent pas au motif : on ne les charge pas.
  (window as Window & { __engineTestHooks?: { noModels?: boolean } }).__engineTestHooks ??= {
    noModels: true,
  };
  enginePromise ??= import('../lib/pattern-engine/createEngine').then(({ getEngine }) =>
    getEngine().then((ready) => {
      // Fond transparent : le moteur repeint son fond à chaque image (setClearColor, opacité 1) ;
      // on rend ce fond invisible au passage, comme les exports PNG de l'outil. Moteur inchangé.
      const { renderer } = ready.core;
      const setClearColor = renderer.setClearColor.bind(renderer);
      renderer.setClearColor = (color, alpha) => setClearColor(color, transparent ? 0 : alpha);
      return ready;
    }),
  );
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
    this.applyFormat();
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

  attributeChangedCallback(name: string) {
    if (name === 'format') this.applyFormat();
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
    const read = (name: (typeof ATTRIBUTES)[number]) => this.getAttribute(name);
    transparent = isTransparent(read);
    this.engine.presets.applySnapshot(readSettings(read));
    this.updatePause();
  }

  // Format demandé ; sinon la hauteur donnée par le site (CSS) ; sinon 16/9. Le dessin étant posé
  // en absolu, un bloc sans hauteur CSS mesure 0 : c'est ainsi qu'on sait qu'il en faut une.
  private applyFormat() {
    const format = readFormat(this.getAttribute('format'));
    this.style.aspectRatio = format ?? '';
    if (!format && this.offsetHeight === 0) this.style.aspectRatio = '16 / 9';
  }

  private updatePause = () => {
    if (!this.engine) return;
    this.engine.core.S.paused = !this.visible || document.hidden || reducedMotion();
  };
}

if (!customElements.get('colabs-motif')) customElements.define('colabs-motif', ColabsMotif);
