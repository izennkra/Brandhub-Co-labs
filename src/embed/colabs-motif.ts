import { Euler, Quaternion } from 'three';
import type { Engine } from '../lib/pattern-engine/createEngine';
import {
  ATTRIBUTES,
  isTransparent,
  LIVE_KEYS,
  readAxes,
  readFormat,
  readSettings,
  type View,
} from './settings';

// <colabs-motif> : le motif Co-labs sur le site d'un client, avec le moteur tel quel (aucune
// modification), sans l'outil d'édition. Réglages par attributs en français (settings.ts) ;
// mode d'emploi pour le développeur : embed/LISEZMOI.md.
// - Le moteur (≈ 320 Ko compressé) ne se charge que quand le motif arrive à l'écran.
// - Hors de l'écran, onglet caché ou animations réduites demandées : le motif est en pause.
// - Taille : celle du bloc (CSS libre) ; sans hauteur, l'attribut « format » (16/9 par défaut).
// - Orientation, couleurs, rotation et survol changent en direct ; seuls les réglages de la forme
//   elle-même (forme, graine, élargissement, particules…) la redessinent. Les changements
//   d'orientation sont animés en douceur.
// - Pas de navigation à la souris (glisser, molette, double-clic) : l'orientation se règle par les
//   attributs. Le survol, lui, reste actif.
// - Un seul motif animé par page : le moteur n'en gère qu'un.
// Le dessin du moteur remplit le bloc sans jamais en changer la taille (grilles, colonnes flexibles).
const STYLE = `
colabs-motif { display: block; position: relative; overflow: hidden; min-width: 0; }
colabs-motif #scene { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: auto; cursor: default; }
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

      // Axes X, Y, Z : tourner la forme revient à tourner la caméra en sens inverse autour d'elle.
      // Le moteur replace sa caméra à chaque image (updateCamera, puis camera.lookAt) : on ajoute la
      // rotation juste après. La forme n'est pas redessinée, et le survol (calculé avec la caméra)
      // reste juste. Moteur inchangé.
      const { camera, orbit } = ready.core;
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

export class ColabsMotif extends HTMLElement {
  static observedAttributes = [...ATTRIBUTES];
  private engine: Engine | null = null;
  private visible = false;
  private shapeKey = '';
  private viewKey = '';
  private viewAnimation = 0;
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
    this.shapeKey = ''; // remis dans la page : tout est réappliqué
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
    const { core, presets } = this.engine;
    const read = (name: (typeof ATTRIBUTES)[number]) => this.getAttribute(name);
    transparent = isTransparent(read);
    axesTarget.setFromEuler(new Euler(...readAxes(read)));
    if (!this.shapeKey) axesShown.copy(axesTarget); // au chargement : directement à la bonne orientation

    // La forme n'est redessinée que si un réglage de la forme a changé ; le reste s'applique en direct.
    const settings = readSettings(read);
    const { _view, ...shape } = settings;
    const live: Record<string, unknown> = {};
    for (const key of LIVE_KEYS) {
      live[key] = shape[key];
      delete shape[key];
    }
    const shapeKey = JSON.stringify(shape);
    const viewKey = JSON.stringify(_view);
    if (shapeKey !== this.shapeKey) presets.applySnapshot(settings);
    else {
      const S = core.S;
      for (const [key, value] of Object.entries(live))
        if (value !== undefined) S[key] = key === 'dots' ? new Set(value as string[]) : value;
      core.refreshColors();
      if (viewKey !== this.viewKey) this.animateView(_view as View);
    }
    this.shapeKey = shapeKey;
    this.viewKey = viewKey;
    this.updatePause();
  }

  // Point de vue (rotation, inclinaison, distance) : la caméra rejoint le nouveau en ≈ 0,9 s, en
  // accélérant puis en ralentissant, par le plus court chemin autour de la forme.
  private animateView(to: View) {
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
