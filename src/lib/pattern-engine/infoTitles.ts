// Titres libres des étapes (mode Process) : le moteur écrit « Étape 01, 02… » ; ici chaque étape peut
// porter son propre titre (procTitles, une ligne par étape ; vide = titre du moteur). La scène, les
// exports PNG et SVG et la copie Figma reçoivent l'infographie avec ces titres. Moteur inchangé.
import type { EngineInfo, PrototypeEngine } from './prototype-engine.js';

// Police de l'infographie, celle du moteur (INFO_FONT, ligne 1001) : les badges sont mesurés avec.
export const INFO_FONT = 'Geist, "Helvetica Neue", Helvetica, Arial, sans-serif';

export const readTitles = (titles: unknown) => String(titles ?? '').split('\n');

let measureCtx: CanvasRenderingContext2D | null | undefined;
const measureText = (font: string, text: string) => {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * 9; // sans canvas (tests) : largeur approchée
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
};

/** L'infographie avec les titres choisis ; telle quelle sans titre choisi. */
export function withTitles(info: EngineInfo | null, titles: unknown, measure = measureText) {
  if (!info || info.kind !== 'process') return info;
  const list = readTitles(titles);
  if (!list.some((title) => title.trim())) return info;
  return {
    ...info,
    items: info.items.map((item, k) => {
      const title = list[k]?.trim();
      if (!title) return item;
      const { fw, fs, padX } = item.top;
      // badge à la largeur du titre, comme le moteur le fait pour « Étape 01 »
      const w = measure(`${fw} ${fs}px ${INFO_FONT}`, title) + 2 * padX;
      return { ...item, topText: title, top: { ...item.top, w } };
    }),
  };
}

/**
 * À l'écran : après chaque image du moteur, l'infographie (#labels) est réécrite avec les titres
 * choisis ; sans titre choisi, on rend la main au moteur.
 */
export function createTitlePainter(core: PrototypeEngine, labels: HTMLElement) {
  let ours: Element | null = null;
  let last = '';
  return () => {
    const info = core.lastInfo;
    const titled = withTitles(info, core.S.procTitles);
    const engineOwns = !ours || labels.firstElementChild !== ours;
    if (!info || titled === info) {
      // plus de titre choisi : on remet une fois l'infographie du moteur, puis il reprend la main
      if (info && ours && !engineOwns) labels.innerHTML = markup(core, info);
      ours = null;
      last = '';
      return;
    }
    const next = markup(core, titled!);
    if (next === last && !engineOwns) return;
    labels.innerHTML = next;
    ours = labels.firstElementChild;
    last = next;
  };
}

// Même enveloppe que updateLabels du moteur (ligne 1101).
const markup = (core: PrototypeEngine, info: EngineInfo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${core.VW}" height="${core.VH}" viewBox="0 0 ${core.VW} ${core.VH}" style="font-family:${INFO_FONT.replace(/"/g, "'")}">${core.infoSVG(info)}</svg>`;
