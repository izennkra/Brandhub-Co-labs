import { Euler, Quaternion } from 'three';
import type { Engine } from '../lib/pattern-engine/createEngine';
import { getStore, openStore } from './memoryStore';
import { readFormat, type View } from './settings';

// Parties communes aux balises d'intégration (<colabs-motif>, <colabs-illustration>) : le moteur
// (tel quel, aucune modification), sa mise en place sur la page, et le comportement de la balise.
// - Le moteur ne se charge que quand la balise arrive à l'écran ; hors de l'écran, onglet caché ou
//   animations réduites demandées : pause.
// - Taille : celle du bloc (CSS libre) ; sans hauteur, l'attribut « format » (16/9 par défaut).
// - Pas de navigation à la souris (glisser, molette, double-clic) ; le survol reste actif.
// - Un seul moteur par page : une page affiche soit un motif, soit une illustration.

// Le dessin du moteur remplit le bloc sans jamais en changer la taille (grilles, colonnes flexibles).
const STYLE = `
colabs-motif, colabs-illustration { display: block; position: relative; overflow: hidden; min-width: 0; }
:is(colabs-motif, colabs-illustration) #scene { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: auto; cursor: default; }
`;

let enginePromise: Promise<Engine> | null = null;
let transparent = false;
// Rotation selon les axes X, Y, Z de l'écran : la rotation visée, celle affichée (qui la rejoint en
// douceur), et son inverse, appliquée à la caméra (voir plus bas).
const axesTarget = new Quaternion();
const axesShown = new Quaternion();
const axesInverse = new Quaternion();
const SMOOTH = 0.3; // constante de temps des animations d'orientation, en secondes (≈ 1 s pour finir)
let lastFrame = 0;

/** Fond transparent : la page se voit derrière le dessin. */
export const setTransparent = (on: boolean) => (transparent = on);

/** Orientation visée (radians, axes de l'écran) ; immediate : sans animation (au chargement). */
export function setAxes(axes: [number, number, number], immediate: boolean) {
  axesTarget.setFromEuler(new Euler(...axes));
  if (immediate) axesShown.copy(axesTarget);
}

/** Le moteur, chargé une seule fois. Les données du stockage doivent être déposées avant. */
export function engine() {
  // Les modèles 3D de l'Illustration ne sont pas livrés : on ne les charge pas.
  (window as Window & { __engineTestHooks?: { noModels?: boolean } }).__engineTestHooks ??= {
    noModels: true,
  };
  enginePromise ??= import('../lib/pattern-engine/createEngine').then(({ getEngine }) =>
    getEngine().then((ready) => {
      const { core } = ready;
      // Le moteur a son propre accès au stockage (core.Store) : il lit lui aussi le stockage en
      // mémoire du script (memoryStore.ts), puis la bibliothèque peut démarrer.
      const memory = getStore();
      Object.assign(core.Store, {
        list: memory.list,
        get: memory.get,
        put: memory.put,
        del: memory.del,
      });
      openStore();

      // Fond transparent : le moteur repeint son fond à chaque image (setClearColor, opacité 1) ;
      // on rend ce fond invisible au passage, comme les exports PNG de l'outil. Moteur inchangé.
      const { renderer } = core;
      const setClearColor = renderer.setClearColor.bind(renderer);
      renderer.setClearColor = (color, alpha) => setClearColor(color, transparent ? 0 : alpha);

      // Axes X, Y, Z : tourner le dessin revient à tourner la caméra en sens inverse autour de lui.
      // Le moteur replace sa caméra à chaque image (updateCamera, puis camera.lookAt) : on ajoute la
      // rotation juste après. Rien n'est redessiné, et le survol (calculé avec la caméra) reste
      // juste. Moteur inchangé.
      const { camera, orbit } = core;
      const lookAt = camera.lookAt.bind(camera) as unknown as (target: typeof orbit.target) => void;
      camera.lookAt = ((target: typeof orbit.target) => {
        lookAt(target);
        // l'orientation affichée rejoint la visée en douceur (même vitesse quel que soit l'écran)
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastFrame) / 1000);
        lastFrame = now;
        axesShown.slerp(axesTarget, 1 - Math.exp(-dt / SMOOTH));
        axesInverse.copy(axesShown).invert();
        if (Math.abs(axesInverse.w) > 0.999999) return;
        const distance = camera.position.distanceTo(orbit.target);
        camera.quaternion.multiply(axesInverse);
        camera.position.set(0, 0, distance).applyQuaternion(camera.quaternion).add(orbit.target);
      }) as unknown as typeof camera.lookAt;
      return ready;
    }),
  );
  return enginePromise;
}

const stopNavigation = (event: Event) => event.stopPropagation();
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Base des balises : mise en place, chargement à l'arrivée à l'écran, pause, taille, navigation
 * bloquée, animation du point de vue. Chaque balise décrit son démarrage (start) et ses réglages (apply).
 */
export abstract class EngineElement extends HTMLElement {
  protected engine: Engine | null = null;
  protected visible = false;
  private applyTimer: ReturnType<typeof setTimeout> | undefined;
  private viewAnimation = 0;
  private observers: { disconnect(): void }[] = [];

  /** Nom de la balise, pour les messages d'erreur. */
  protected abstract readonly tag: string;
  /** Démarrage : le moteur est chargé (prépare ses données, choisit le mode, applique les réglages). */
  protected abstract start(): Promise<void>;
  /** Réglages (attributs) appliqués au moteur. */
  protected abstract apply(): void;
  /** Remis dans la page : tout est réappliqué. */
  protected abstract reset(): void;

  connectedCallback() {
    if (!document.getElementById('colabs-style')) {
      const style = document.createElement('style');
      style.id = 'colabs-style';
      style.textContent = STYLE;
      document.head.append(style);
    }
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
    // Pas de navigation à la souris ni au doigt : appui (glisser, pincer), molette et double-clic
    // n'atteignent pas le moteur. Le survol (simple passage) reste ; la page défile normalement.
    for (const type of ['pointerdown', 'wheel', 'dblclick', 'contextmenu'])
      this.addEventListener(type, stopNavigation, { capture: true });
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
    this.applyTimer = setTimeout(() => this.apply(), 120);
  }

  /** Point de vue actuel (rotation, inclinaison, distance), en degrés. */
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

  /** Le moteur est chargé : il se place dans la balise, puis l'événement « pret » est envoyé. */
  protected show(engine: Engine) {
    engine.attach(this);
    this.updatePause();
    this.dispatchEvent(new Event('pret'));
  }

  // Point de vue (rotation, inclinaison, distance) : la caméra rejoint le nouveau en ≈ 0,9 s, en
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
      const p = Math.min(1, (now - start) / 900);
      const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      orbit.theta = from.theta + dTheta * e;
      orbit.phi = from.phi + (to.phi - from.phi) * e;
      orbit.radius = from.radius + (to.radius - from.radius) * e;
      if (p < 1) this.viewAnimation = requestAnimationFrame(step);
    };
    this.viewAnimation = requestAnimationFrame(step);
  }

  /** En pause ? (hors de l'écran, onglet caché, animations réduites demandées) */
  protected get paused() {
    return !this.visible || document.hidden || reducedMotion();
  }

  protected updatePause = () => {
    if (this.engine) this.engine.core.S.paused = this.paused;
  };

  // Format demandé ; sinon la hauteur donnée par le site (CSS) ; sinon 16/9. Le dessin étant posé
  // en absolu, un bloc sans hauteur CSS mesure 0 : c'est ainsi qu'on sait qu'il en faut une.
  private applyFormat() {
    const format = readFormat(this.getAttribute('format'));
    this.style.aspectRatio = format ?? '';
    if (!format && this.offsetHeight === 0) this.style.aspectRatio = '16 / 9';
  }
}
