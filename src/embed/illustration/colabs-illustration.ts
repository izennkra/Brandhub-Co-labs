import type { Engine } from '../../lib/pattern-engine/createEngine';
import { isTransparent, readAxes } from '../core/attributes';
import { engine, setAxes, setSetting, setTransparent } from '../core/engine';
import { EngineElement } from '../core/EngineElement';
import { seedStore } from '../core/memoryStore';
import { loadIllustrations } from './manifest';
import {
  ILLUSTRATION_ATTRIBUTES,
  libraryDocuments,
  readDistance,
  readOverrides,
  readPlayback,
  readSizes,
  settingsOf,
  startIndex,
  type Illustration,
  type Playback,
} from './settings';

// <colabs-illustration> : les illustrations Co-labs (une image rendue en particules) sur le site
// d'un client, l'une après l'autre, avec la transition du moteur. Mode d'emploi :
// embed/illustration/LISEZMOI.md. La balise n'affiche que l'illustration ; le site s'y branche :
// - lecture automatique : chaque image reste « duree » secondes, puis la suivante arrive ;
// - événement « progression » (0 → 1) à chaque image affichée : pour remplir une barre de temps ;
// - événement « changement » : quelle illustration s'affiche (pour mettre le site à jour) ;
// - afficher(n | id), suivante(), precedente() : le site change d'image (clic), le temps repart à 0 ;
// - pause(), lecture() ; lecture="manuelle" : aucun passage automatique, le site décide de tout.

/** Contenu des événements « changement » et « progression ». */
export type IllustrationDetail = { index: number; id: string; nom: string; progression: number };

const LIBRARY_POLL = 50; // ms

/** La bibliothèque a fini de lire les illustrations (stockage en mémoire). */
async function libraryLoaded({ library }: Engine) {
  while (!library.loaded) await new Promise((resolve) => setTimeout(resolve, LIBRARY_POLL));
}

export class ColabsIllustration extends EngineElement {
  static observedAttributes = [...ILLUSTRATION_ATTRIBUTES];
  protected readonly tag = 'colabs-illustration';
  private list: Illustration[] = [];
  private current = 0;
  private started = false;
  // Réglages imposés par la balise au dernier apply() (pour rendre les leurs aux illustrations).
  private imposed: string[] = [];
  // Temps : lu dans les attributs à chaque apply(), avancé à chaque image par tick().
  private playback: Playback = readPlayback(() => null);
  private elapsed = 0;
  private playing = true;
  private lastTick = 0;
  private lastSent = -1;
  private loop = 0;

  // ---------- Pour le site ----------

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
    return Math.min(1, this.elapsed / this.playback.duree);
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

  // ---------- Cycle de vie (EngineElement) ----------

  protected async start() {
    // 1. Les illustrations et leurs images, déposées dans le stockage en mémoire.
    const { list, sources } = await loadIllustrations(this.read('source'), this.read('images'));
    seedStore(libraryDocuments(list, sources, readSizes(list, this.read('tailles'))));

    // 2. Le moteur, en mode Illustration ; la bibliothèque lit les illustrations.
    const loaded = await engine();
    if (!this.isConnected) return;
    this.engine = loaded;
    this.list = list;
    loaded.actions.setApp('image');
    await libraryLoaded(loaded);

    // 3. Première illustration, réglages de la balise, puis le temps démarre.
    this.showImage(startIndex(list, this.read('depart')));
    this.started = true;
    this.show(loaded);
    this.lastTick = performance.now();
    this.loop = requestAnimationFrame(this.tick);
  }

  protected reset() {
    cancelAnimationFrame(this.loop);
    this.started = false;
  }

  /** Attributs de la balise : lecture, fond, couleurs, survol, axes, taille, cadrage. */
  protected apply() {
    if (!this.engine) return;
    const { core, library } = this.engine;
    const S = core.S;
    this.playback = readPlayback(this.read);
    setTransparent(isTransparent(this.read));
    setAxes(readAxes(this.read), !this.started);

    // Réglages imposés ; un réglage retiré de la balise rend tout de suite le sien à l'illustration.
    const overrides = readOverrides(this.read);
    const own = settingsOf(this.list, this.list[this.current]) ?? {};
    for (const key of this.imposed) if (!(key in overrides) && key in own) setSetting(S, key, own[key]);
    for (const [key, value] of Object.entries(overrides)) setSetting(S, key, value);
    this.imposed = Object.keys(overrides);

    // La balise décide du passage d'une image à l'autre : jamais la boucle du moteur.
    S.imgLoop = false;
    if (this.playback.transition !== undefined) S.imgTrans = this.playback.transition;

    // Taille de l'illustration affichée : redessinée à cette taille, qu'elle garde pendant les transitions.
    const size = this.tailles[this.list[this.current]?.id ?? ''];
    if (size !== undefined && size !== library.sizeOf()) library.setSize(size);

    // Même cadrage pour toutes les illustrations : de face, à la même distance (pas de saut de taille).
    Object.assign(core.orbit, { theta: 0, phi: Math.PI / 2, radius: readDistance(this.read) });
    core.refreshColors();
    if (this.read('reglages')) core.imgDirty = true; // réglages de la trame : image recalculée
    this.updatePause();
  }

  // ---------- Images et temps ----------

  // L'illustration reprend ses propres réglages (bibliothèque), puis ceux imposés par la balise ;
  // le moteur fait la transition.
  private showImage(index: number) {
    if (!this.engine) return;
    this.current = index;
    this.engine.library.pick(index);
    this.apply();
    this.dispatchEvent(new CustomEvent<IllustrationDetail>('changement', { detail: this.detail() }));
    this.emitProgress(true);
  }

  private detail(): IllustrationDetail {
    const { id = '', nom = '' } = this.list[this.current] ?? {};
    return { index: this.current, id, nom, progression: this.progression };
  }

  private emitProgress(force = false) {
    const detail = this.detail();
    if (!force && detail.progression === this.lastSent) return;
    this.lastSent = detail.progression;
    this.dispatchEvent(new CustomEvent<IllustrationDetail>('progression', { detail }));
  }

  // Le temps n'avance qu'en lecture automatique, sans pause, à l'écran. À la fin : la suivante
  // (ou on s'arrête sur la dernière, sans boucle).
  private tick = (now: number) => {
    const dt = Math.min(0.25, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const { duree, auto, boucle } = this.playback;
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
