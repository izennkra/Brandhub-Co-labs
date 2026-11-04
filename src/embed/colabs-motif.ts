import { ATTRIBUTES, isTransparent, LIVE_KEYS, readAxes, readSettings, type View } from './settings';
import { engine, EngineElement, setAxes, setTransparent } from './shared';

// <colabs-motif> : le motif Co-labs sur le site d'un client. Réglages par attributs en français
// (settings.ts) ; comportement commun aux balises (chargement, pause, taille, navigation) : shared.ts ;
// mode d'emploi pour le développeur : embed/LISEZMOI.md.
// Orientation, couleurs, rotation et survol changent en direct (l'orientation en douceur) ; seuls les
// réglages de la forme elle-même (forme, graine, élargissement, particules…) la redessinent.
export class ColabsMotif extends EngineElement {
  static observedAttributes = [...ATTRIBUTES];
  protected readonly tag = 'colabs-motif';
  private shapeKey = '';
  private viewKey = '';

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
    const read = (name: string) => this.getAttribute(name);
    setTransparent(isTransparent(read));
    setAxes(readAxes(read), !this.shapeKey); // au chargement : directement à la bonne orientation

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
}

if (!customElements.get('colabs-motif')) customElements.define('colabs-motif', ColabsMotif);
