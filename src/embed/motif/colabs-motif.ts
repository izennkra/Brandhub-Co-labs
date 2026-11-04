import { isTransparent, readAxes } from '../core/attributes';
import { engine, setAxes, setSetting, setTransparent, type View } from '../core/engine';
import { EngineElement } from '../core/EngineElement';
import { LIVE_KEYS, MOTIF_ATTRIBUTES, readMotifSettings } from './settings';

// <colabs-motif> : le motif Co-labs sur le site d'un client. Mode d'emploi : embed/motif/LISEZMOI.md.
// Orientation, couleurs, rotation et survol changent en direct (l'orientation en douceur) ; seuls les
// réglages de la forme elle-même (forme, graine, élargissement, particules…) la redessinent.
export class ColabsMotif extends EngineElement {
  static observedAttributes = [...MOTIF_ATTRIBUTES];
  protected readonly tag = 'colabs-motif';
  // Derniers réglages appliqués : la forme n'est redessinée que si les siens changent.
  private shapeKey = '';
  private viewKey = '';

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

  /** Nouvelle forme au hasard : sa graine est écrite dans l'attribut « graine ». */
  nouvelleForme() {
    this.setAttribute('graine', String((Math.random() * 1e9) | 0));
  }

  protected async start() {
    const loaded = await engine();
    if (!this.isConnected) return;
    this.engine = loaded;
    loaded.actions.setApp('motif');
    this.apply();
    this.show(loaded);
  }

  protected reset() {
    this.shapeKey = '';
  }

  protected apply() {
    if (!this.engine) return;
    const { core, presets } = this.engine;
    const firstApply = !this.shapeKey;
    setTransparent(isTransparent(this.read));
    setAxes(readAxes(this.read), firstApply); // au chargement : directement à la bonne orientation

    // La forme n'est redessinée que si un réglage de la forme a changé ; le reste s'applique en direct.
    const settings = readMotifSettings(this.read);
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
      for (const [key, value] of Object.entries(live))
        if (value !== undefined) setSetting(core.S, key, value);
      core.refreshColors();
      if (viewKey !== this.viewKey) this.animateView(_view as View);
    }
    this.shapeKey = shapeKey;
    this.viewKey = viewKey;
    this.updatePause();
  }
}

if (!customElements.get('colabs-motif')) customElements.define('colabs-motif', ColabsMotif);
