import type { Engine } from '../../lib/pattern-engine/createEngine';
import { readFormat } from './attributes';
import type { View } from './engine';

// Base des balises d'intégration (<colabs-motif>, <colabs-illustration>) : tout ce qui ne dépend pas
// de ce qu'elles affichent.
// - Le moteur ne se charge que quand la balise arrive à l'écran ; hors de l'écran, onglet caché ou
//   animations réduites demandées : pause.
// - Taille : celle du bloc (CSS libre) ; sans hauteur, l'attribut « format » (16/9 par défaut).
// - Pas de navigation à la souris (glisser, molette, double-clic) ; le survol reste actif.
// - Les changements d'attributs sont regroupés (120 ms) avant d'être appliqués au moteur.

// Le dessin du moteur remplit le bloc sans jamais en changer la taille (grilles, colonnes flexibles).
const STYLE = `
colabs-motif, colabs-illustration { display: block; position: relative; overflow: hidden; min-width: 0; }
:is(colabs-motif, colabs-illustration) #scene { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: auto; cursor: default; }
`;
const NAVIGATION_EVENTS = ['pointerdown', 'wheel', 'dblclick', 'contextmenu'];
const APPLY_DELAY = 120; // ms
const VIEW_DURATION = 900; // ms

const stopNavigation = (event: Event) => event.stopPropagation();
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

function injectStyle() {
  if (document.getElementById('colabs-style')) return;
  const style = document.createElement('style');
  style.id = 'colabs-style';
  style.textContent = STYLE;
  document.head.append(style);
}

export abstract class EngineElement extends HTMLElement {
  protected engine: Engine | null = null;
  protected visible = false;
  private applyTimer: ReturnType<typeof setTimeout> | undefined;
  private viewAnimation = 0;
  private observers: { disconnect(): void }[] = [];

  /** Nom de la balise, pour les messages d'erreur. */
  protected abstract readonly tag: string;
  /** Démarrage, à l'arrivée à l'écran : charge le moteur, prépare ses données, puis appelle show(). */
  protected abstract start(): Promise<void>;
  /** Applique les attributs de la balise au moteur. */
  protected abstract apply(): void;
  /** La balise quitte la page : son état est remis à zéro (tout sera réappliqué à son retour). */
  protected abstract reset(): void;

  /** Lit un attribut de la balise. */
  protected read = (name: string) => this.getAttribute(name);

  connectedCallback() {
    injectStyle();
    this.applyFormat();
    const seen = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible && !this.engine)
        this.start().catch((error: unknown) =>
          console.error(`${this.tag} : le dessin n’a pas pu démarrer`, error),
        );
      this.updatePause();
    });
    seen.observe(this);
    // Appui (glisser, pincer), molette et double-clic n'atteignent pas le moteur ; la page défile normalement.
    for (const type of NAVIGATION_EVENTS) this.addEventListener(type, stopNavigation, { capture: true });
    const size = new ResizeObserver(() => this.engine?.core.resize());
    size.observe(this);
    this.observers = [seen, size];
    document.addEventListener('visibilitychange', this.updatePause);
  }

  disconnectedCallback() {
    this.observers.forEach((o) => o.disconnect());
    document.removeEventListener('visibilitychange', this.updatePause);
    cancelAnimationFrame(this.viewAnimation);
    this.engine?.detach(this);
    this.engine = null;
    this.reset();
  }

  attributeChangedCallback(name: string) {
    if (name === 'format') this.applyFormat();
    if (!this.engine) return;
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => this.apply(), APPLY_DELAY);
  }

  /** Le moteur est prêt : il se place dans la balise, puis l'événement « pret » est envoyé. */
  protected show(engine: Engine) {
    engine.attach(this);
    this.updatePause();
    this.dispatchEvent(new Event('pret'));
  }

  /** En pause ? (hors de l'écran, onglet caché, animations réduites demandées) */
  protected get paused() {
    return !this.visible || document.hidden || reducedMotion();
  }

  protected updatePause = () => {
    if (this.engine) this.engine.core.S.paused = this.paused;
  };

  // Point de vue (rotation, inclinaison, distance) : la caméra rejoint le nouveau en douceur, en
  // accélérant puis en ralentissant, par le plus court chemin autour du dessin.
  protected animateView(to: View) {
    const orbit = this.engine?.core.orbit;
    if (!orbit) return;
    cancelAnimationFrame(this.viewAnimation);
    const from = { theta: orbit.theta, phi: orbit.phi, radius: orbit.radius };
    const turn = 2 * Math.PI;
    const dTheta = ((((to.theta - from.theta) % turn) + turn + Math.PI) % turn) - Math.PI;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / VIEW_DURATION);
      const e = easeInOutCubic(p);
      orbit.theta = from.theta + dTheta * e;
      orbit.phi = from.phi + (to.phi - from.phi) * e;
      orbit.radius = from.radius + (to.radius - from.radius) * e;
      if (p < 1) this.viewAnimation = requestAnimationFrame(step);
    };
    this.viewAnimation = requestAnimationFrame(step);
  }

  // Format demandé ; sinon la hauteur donnée par le site (CSS) ; sinon 16/9. Le dessin étant posé
  // en absolu, un bloc sans hauteur CSS mesure 0 : c'est ainsi qu'on sait qu'il en faut une.
  private applyFormat() {
    const format = readFormat(this.getAttribute('format'));
    this.style.aspectRatio = format ?? '';
    if (!format && this.offsetHeight === 0) this.style.aspectRatio = '16 / 9';
  }
}
