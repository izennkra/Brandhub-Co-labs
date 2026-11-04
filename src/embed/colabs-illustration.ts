import {
  ILLUSTRATION_ATTRIBUTES,
  libraryDocuments,
  pickIllustrations,
  readDistance,
  readOverrides,
  readPlayback,
  readSizes,
  startIndex,
  type Illustration,
} from './illustrationSettings';
import { seedStore } from './memoryStore';
import { isTransparent, readAxes } from './settings';
import { engine, EngineElement, setAxes, setTransparent } from './shared';

// <colabs-illustration> : les illustrations Co-labs (une image rendue en particules) sur le site
// d'un client, l'une après l'autre, avec la transition du moteur. Comportement commun (chargement,
// pause, taille, navigation) : shared.ts ; mode d'emploi : embed-illustration/LISEZMOI.md.
//
// Branchement avec le site (ex. une liste de services avec une barre de temps) :
// - lecture automatique : chaque image reste « duree » secondes, puis la suivante arrive ;
// - événement « progression » (0 → 1) à chaque image affichée : pour remplir une barre de temps ;
// - événement « changement » : quelle illustration s'affiche (pour mettre le site à jour) ;
// - afficher(n | id), suivante(), precedente() : le site change d'image (clic), le temps repart à 0 ;
// - pause(), lecture() ; lecture="manuelle" : aucun passage automatique, le site décide de tout.

// Adresse du script : les illustrations sont cherchées à côté de lui par défaut.
const SCRIPT_URL = (document.currentScript as HTMLScriptElement | null)?.src || location.href;

type Detail = { index: number; id: string; nom: string; progression: number };

/** Une image en adresse « data: » : le moteur la lit sans souci de domaine (CORS). */
async function asDataUrl(url: URL) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`image introuvable : ${url}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export class ColabsIllustration extends EngineElement {
  static observedAttributes = [...ILLUSTRATION_ATTRIBUTES];
  protected readonly tag = 'colabs-illustration';
  private list: Illustration[] = [];
  private current = 0;
  private elapsed = 0;
  private playing = true;
  private lastTick = 0;
  private lastSent = -1;
  private loop = 0;
  private started = false;
  private imposed: string[] = [];

  /** Illustrations affichées, dans l'ordre : identifiant et nom. */
  get illustrations() {
    return this.list.map(({ id, nom }) => ({ id, nom }));
  }

  /** Numéro de l'illustration affichée (à partir de 0). */
  get index() {
    return this.current;
  }

  /** Taille de chaque illustration (1 = taille d'origine) : { id: taille }. */
  get tailles() {
    return readSizes(this.list, this.getAttribute('tailles'));
  }

  /** Avancement de l'illustration affichée, de 0 à 1 (lecture automatique). */
  get progression() {
    return Math.min(1, this.elapsed / readPlayback(this.read).duree);
  }

  /** Affiche une illustration (numéro à partir de 0, ou identifiant) ; le temps repart à 0. */
  afficher(cible: number | string) {
    const index = typeof cible === 'number' ? cible : this.list.findIndex((i) => i.id === cible);
    if (!this.list[index]) return;
    this.elapsed = 0;
    this.lastSent = -1;
    if (index !== this.current || !this.started) this.showImage(index);
    else this.emitProgress(true);
  }

  /** Illustration suivante (la première après la dernière). */
  suivante() {
    this.afficher((this.current + 1) % Math.max(1, this.list.length));
  }

  /** Illustration précédente (la dernière avant la première). */
  precedente() {
    this.afficher((this.current - 1 + this.list.length) % Math.max(1, this.list.length));
  }

  /** Arrête le temps (l'image reste, la barre de temps s'arrête). */
  pause() {
    this.playing = false;
  }

  /** Relance le temps. */
  lecture() {
    this.playing = true;
  }

  private read = (name: string) => this.getAttribute(name);

  protected async start() {
    // 1. Le fichier des illustrations et leurs images, déposés dans le stockage en mémoire.
    const source = new URL(
      this.getAttribute('source') ?? 'illustrations/illustrations.json',
      this.hasAttribute('source') ? location.href : SCRIPT_URL,
    );
    const manifest = (await (await fetch(source)).json()) as { illustrations: Illustration[] };
    const list = pickIllustrations(manifest.illustrations ?? [], this.getAttribute('images'));
    if (!list.length) throw new Error('aucune illustration à afficher (attribut images, illustrations.json)');
    const sources = await Promise.all(list.map((i) => asDataUrl(new URL(i.fichier, source))));
    seedStore(libraryDocuments(list, sources, readSizes(list, this.getAttribute('tailles'))));

    // 2. Le moteur, en mode Illustration ; la bibliothèque lit les illustrations.
    const loaded = await engine();
    if (!this.isConnected) return;
    this.engine = loaded;
    this.list = list;
    loaded.actions.setApp('image');
    while (!loaded.library.loaded) await new Promise((r) => setTimeout(r, 50));

    // 3. Première illustration, réglages de la balise, puis le temps démarre.
    this.current = startIndex(list, this.getAttribute('depart'));
    this.showImage(this.current);
    this.started = true;
    this.show(loaded);
    this.lastTick = performance.now();
    this.loop = requestAnimationFrame(this.tick);
  }

  protected reset() {
    cancelAnimationFrame(this.loop);
    this.started = false;
  }

  /** Réglages de la balise : fond, couleurs, survol, axes, réglages avancés, transition. */
  protected apply() {
    if (!this.engine) return;
    const { core } = this.engine;
    setTransparent(isTransparent(this.read));
    setAxes(readAxes(this.read), !this.started);
    const S = core.S;
    const set = (key: string, value: unknown) =>
      (S[key] = key === 'dots' ? new Set(value as string[]) : value);
    // réglage retiré de la balise : l'illustration retrouve tout de suite le sien
    const overrides = readOverrides(this.read);
    const own = this.ownSettings();
    for (const key of this.imposed) if (!(key in overrides) && key in own) set(key, own[key]);
    this.imposed = Object.keys(overrides);
    for (const [key, value] of Object.entries(overrides)) set(key, value);
    // la balise décide du passage d'une image à l'autre : jamais la boucle du moteur
    S.imgLoop = false;
    const { transition } = readPlayback(this.read);
    if (transition !== undefined) S.imgTrans = transition;
    // taille de l'illustration affichée (réglée dans le configurateur) : redessinée à cette taille
    const size = this.tailles[this.list[this.current]?.id ?? ''];
    if (size !== undefined && size !== this.engine.library.sizeOf()) this.engine.library.setSize(size);
    // même cadrage pour toutes les illustrations : de face, à la même distance (pas de saut de taille)
    Object.assign(core.orbit, { theta: 0, phi: Math.PI / 2, radius: readDistance(this.read) });
    core.refreshColors();
    if (this.getAttribute('reglages')) core.imgDirty = true; // réglages de la trame : image recalculée
    this.updatePause();
  }

  // L'illustration reprend ses propres réglages (bibliothèque), puis ceux imposés par la balise ;
  // le moteur fait la transition.
  private showImage(index: number) {
    if (!this.engine) return;
    this.current = index;
    this.engine.library.pick(index);
    this.apply();
    const detail = this.detail();
    this.dispatchEvent(new CustomEvent<Detail>('changement', { detail }));
    this.emitProgress(true);
  }

  // Réglages propres à l'illustration affichée (illustrations.json), sinon ceux de la première.
  private ownSettings(): Record<string, unknown> {
    return this.list[this.current]?.reglages ?? this.list.find((i) => i.reglages)?.reglages ?? {};
  }

  private detail(): Detail {
    const { id = '', nom = '' } = this.list[this.current] ?? {};
    return { index: this.current, id, nom, progression: this.progression };
  }

  private emitProgress(force = false) {
    const detail = this.detail();
    if (!force && detail.progression === this.lastSent) return;
    this.lastSent = detail.progression;
    this.dispatchEvent(new CustomEvent<Detail>('progression', { detail }));
  }

  // Le temps n'avance qu'en lecture automatique, sans pause, à l'écran. À la fin : la suivante
  // (ou on s'arrête sur la dernière, sans boucle).
  private tick = (now: number) => {
    const dt = Math.min(0.25, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const { duree, auto, boucle } = readPlayback(this.read);
    if (auto && this.playing && !this.paused) {
      this.elapsed = Math.min(duree, this.elapsed + dt);
      this.emitProgress();
      if (this.elapsed >= duree) {
        const last = this.current === this.list.length - 1;
        if (!last || boucle) this.suivante();
        else this.playing = false;
      }
    }
    this.loop = requestAnimationFrame(this.tick);
  };
}

if (!customElements.get('colabs-illustration'))
  customElements.define('colabs-illustration', ColabsIllustration);
