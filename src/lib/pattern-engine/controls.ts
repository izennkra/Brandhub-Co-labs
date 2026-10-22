// Table des réglages du moteur de patterns, reprise de l'interface du prototype
// (reference/prototype.html, lignes 2787 à 3168 : appels slider, toggle, seg et sélecteurs faits main).
// Libellés, bornes, pas, formats et effets sont ceux du prototype : tests/engine-controls.test.ts le vérifie.
// L'ordre est celui de l'affichage dans le panneau du prototype. Les réglages de l'export viendront plus tard.
import type { EngineSettings } from './prototype-engine.js';

// essential : affiché par défaut (réglages du Figma) ; advanced : derrière « Réglage avancé » ;
// hidden : jamais affiché, comme dans le prototype (il ne sert qu'aux variantes Aérée et Dense, retirées).
export type ControlLevel = 'essential' | 'advanced' | 'hidden';
export type ControlMode = 'motif' | 'illustration' | 'both';

// Ce que l'interface du prototype faisait après avoir changé S. Sans effet : le moteur relit S à chaque image.
export type ControlEffect =
  | 'regenSoon' // nouvelle forme 250 ms plus tard
  | 'toneChanged' // tons de l'image choisie enregistrés, image redessinée
  | 'dirtyImg' // image redessinée
  | 'buildLine' // ligne reconstruite (en mode Ligne)
  | 'restartLoop' // boucle d'images relancée (ligne 2789)
  | 'setStructure' // Membrane / Ligne (ligne 2953)
  | 'setShape' // forme du fil (ligne 2922)
  | 'setLineMode'; // mode de la ligne (ligne 2968)

type ControlBase = {
  key: string; // clé dans l'objet S du moteur
  label: string;
  section: string; // titre de la section du panneau Éditeur
  sub?: string; // sous-menu dépliant dans la section
  level: ControlLevel;
  mode: ControlMode;
  effect?: ControlEffect;
  when?: (settings: EngineSettings) => boolean; // affiché seulement si… (prototype)
};

export type SliderControl = ControlBase & {
  kind: 'slider';
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};
export type ToggleControl = ControlBase & { kind: 'toggle' };
export type ChoiceControl = ControlBase & { kind: 'choice'; options: { label: string; value: number }[] };
export type Control = SliderControl | ToggleControl | ChoiceControl;

const fx = (digits: number) => (v: number) => v.toFixed(digits);
const unit = (digits: number, suffix: string) => (v: number) => v.toFixed(digits) + suffix;

type Common = Pick<ControlBase, 'section' | 'mode'> & Partial<Pick<ControlBase, 'sub' | 'level'>>;
function slider(
  common: Common,
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  format: (value: number) => string,
  extra: Partial<Pick<ControlBase, 'level' | 'effect' | 'sub'>> = {},
): SliderControl {
  return { kind: 'slider', key, label, min, max, step, format, level: 'essential', ...common, ...extra };
}
function toggle(
  common: Common,
  key: string,
  label: string,
  extra: Partial<Pick<ControlBase, 'level' | 'effect'>> = {},
): ToggleControl {
  return { kind: 'toggle', key, label, level: 'essential', ...common, ...extra };
}
function choice(
  common: Common,
  key: string,
  label: string,
  options: (string | [string, number])[],
  extra: Partial<Pick<ControlBase, 'level' | 'effect'>> = {},
): ChoiceControl {
  const list = options.map((o, i) =>
    typeof o === 'string' ? { label: o, value: i } : { label: o[0], value: o[1] },
  );
  return { kind: 'choice', key, label, options: list, level: 'essential', ...common, ...extra };
}
const ADV = { level: 'advanced' } as const;
const HIDDEN = { level: 'hidden' } as const;

// ---------- Illustration ----------
const anim: Common = { section: 'Animation', mode: 'illustration' };
const tone: Common = { section: 'Lumière et tons de l’image', mode: 'illustration' };
const toneFx = { effect: 'toneChanged' } as const;
const grid: Common = { ...tone, sub: 'Trame', level: 'advanced' };

const ILLUSTRATION: Control[] = [
  toggle(anim, 'imgLoop', 'Boucle entre les images', { effect: 'restartLoop' }),
  slider(anim, 'imgTrans', 'Transition', 0.5, 8, 0.1, unit(1, ' s')),
  slider(anim, 'imgSmooth', 'Douceur', 0, 1, 0.01, (v) =>
    v < 0.05 ? 'vive' : v > 0.95 ? 'max' : v.toFixed(2),
  ),
  slider(anim, 'imgHold', 'Affichage', 0.5, 10, 0.1, unit(1, ' s')),
  slider(anim, 'imgScatter', 'Dispersion', 0, 2.5, 0.01, fx(2), ADV),
  slider(anim, 'noiseAmp', 'Bruit organique', 0, 4, 0.05, (v) => (v < 0.01 ? 'arrêt' : v.toFixed(2))),
  slider(anim, 'noiseSpeed', 'Vitesse', 0, 3, 0.05, unit(2, '×'), ADV),
  slider(anim, 'noiseDis', 'Désordre', 0, 100, 1, unit(0, ' %'), ADV),
  slider(anim, 'noiseSize', 'Variation de taille', 0, 40, 1, unit(0, ' %'), ADV),

  slider(tone, 'imgBright', 'Luminosité', -100, 100, 1, fx(0), toneFx),
  slider(tone, 'imgContr', 'Contraste', -100, 100, 1, fx(0), toneFx),
  slider(tone, 'imgGamma', 'Gamma', 0.3, 3, 0.01, fx(2), { ...toneFx, ...ADV }),
  slider(tone, 'imgLow', 'Seuil clairs', 0, 60, 1, unit(0, '%'), toneFx),
  slider(tone, 'imgHigh', 'Saturation des noirs', 40, 100, 1, unit(0, '%'), toneFx),
  slider(tone, 'imgBlur', 'Adoucir', 0, 4, 0.1, fx(1), { ...toneFx, ...ADV }),
  toggle(tone, 'imgInvert', 'Inverser les tons', toneFx),
  slider(tone, 'imgRelief', 'Relief des tons', 0, 3, 0.01, (v) => (v < 0.01 ? 'à plat' : v.toFixed(2)), ADV),
  slider(grid, 'imgCols', 'Finesse', 40, 260, 1, unit(0, ' col.'), { effect: 'dirtyImg' }),
  slider(grid, 'imgAngle', 'Angle', 0, 90, 1, unit(0, '°'), { effect: 'dirtyImg' }),
  slider(grid, 'imgMin', 'Taille min.', 0, 60, 1, unit(0, '%'), { effect: 'dirtyImg' }),
  slider(grid, 'imgMax', 'Taille max.', 40, 160, 1, unit(0, '%'), { effect: 'dirtyImg' }),
];

// ---------- Motif ----------
const circ: Common = { section: 'Circulation', mode: 'motif', level: 'advanced' };
const net: Common = { section: 'Réseau', mode: 'motif' };
const vol: Common = { section: 'Volume', mode: 'motif' };
const info: Common = { ...vol, sub: 'Infographie' };
const trace: Common = { ...vol, sub: 'Forme de la ligne' };
const particles: Common = { ...vol, sub: 'Particules', level: 'advanced' };
const depth: Common = { ...vol, sub: 'Profondeur et relief', level: 'advanced' };
const motion: Common = { ...vol, sub: 'Mouvement des particules', level: 'advanced' };
const dens: Common = { section: 'Densité', mode: 'motif', level: 'hidden' };
const line = { effect: 'buildLine' } as const;

const MOTIF: Control[] = [
  slider(circ, 'flow', 'Vitesse des pastilles', 0, 5, 0.05, unit(2, '×')),
  slider(circ, 'grow', 'Vitesse de croissance', 0.1, 5, 0.05, unit(2, '×')),
  slider(circ, 'births', 'Apparitions par seconde', 0.1, 10, 0.1, fx(1), HIDDEN),

  choice(net, 'shapeMode', 'Forme du fil', ['Nœud', 'Ample', 'Simple', 'Hasard'], { effect: 'setShape' }),
  slider(net, 'synapses', 'Synapses sur le fil', 1, 16, 1, fx(0), HIDDEN),
  slider(net, 'neurons', 'Neurones', 3, 160, 1, fx(0), { ...HIDDEN, effect: 'regenSoon' }),
  slider(net, 'maxLinks', 'Connexions simultanées', 4, 220, 1, fx(0), HIDDEN), // 220 : MAXL du moteur
  slider(
    net,
    'life',
    'Durée de vie',
    3,
    60,
    1,
    (v) => (v >= 60 ? 'permanente' : v.toFixed(0) + ' s'),
    HIDDEN,
  ),

  choice(
    vol,
    'qStruct',
    'Structure',
    [
      ['Membrane', 1],
      ['Ligne', 2],
    ],
    { effect: 'setStructure' },
  ),
  // Ligne
  choice(vol, 'lineMode', 'Mode de la ligne', ['Aléatoire', 'Données', 'Process'], { effect: 'setLineMode' }),
  slider(vol, 'lobeContrast', 'Contraste des tailles', 0, 1, 0.01, (v) =>
    v < 0.02 ? 'égales' : v.toFixed(2),
  ),
  // Membrane et Ligne. Taille de la forme visible d'office (refonte validée le 22/10/2026) :
  // Épaisseur = hauteur, Gonflement des renflements, Finesse des cols.
  slider(vol, 'lobes', 'Renflements', 1, 12, 1, fx(0)),
  slider(vol, 'lobeLen', 'Étirement des renflements', 2.5, 10, 0.1, fx(1), ADV),
  slider(vol, 'tubeR', 'Épaisseur de la forme', 0.3, 6, 0.05, fx(2)),
  slider(vol, 'junction', 'Épaisseur des renflements', 0.4, 2, 0.01, fx(2)),
  slider(vol, 'thin', 'Finesse des cols', 0.02, 0.6, 0.01, fx(2)),
  slider(vol, 'pinchSpeed', 'Vitesse des renflements', 0, 4, 0.05, unit(2, '×'), ADV),
  // Ligne : longueur (largeur) et bouts, puis l'infographie
  slider(trace, 'lineLen', 'Longueur de la ligne', 12, 400, 1, fx(0), line),
  slider(trace, 'lineWave', 'Ondulation de la ligne', 0, 1, 0.01, fx(2), { ...line, ...ADV }),
  slider(trace, 'lineFade', 'Fondu des extrémités', 0, 1, 0.01, (v) => (v < 0.01 ? 'net' : v.toFixed(2))),
  toggle(info, 'lineLabels', 'Afficher l’infographie'),
  slider(info, 'dataContrast', 'Contraste des tailles', 0.3, 3, 0.01, (v) =>
    Math.abs(v - 1) < 0.01 ? 'proportionnel' : v.toFixed(2),
  ),
  slider(info, 'procMin', 'Taille de la première étape', 0.03, 0.9, 0.01, (v) => Math.round(v * 100) + ' %'),
  // trois rythmes nommés plutôt qu'un curseur aux valeurs en mots (refonte du 22/10/2026) ;
  // « à la fin » = 1,3, la valeur de départ du moteur
  choice(info, 'procCurve', 'Progression', [
    ['au début', 0.75],
    ['partout', 1],
    ['à la fin', 1.3],
  ]),
  slider(info, 'infoScale', 'Taille de l’infographie', 0.6, 2, 0.01, fx(2)),
  slider(info, 'infoGap', 'Écart de la légende', 0.5, 2.5, 0.01, fx(2)),
  slider(particles, 'qCount', 'Particules', 2000, 120000, 1000, (v) => Math.round(v / 1000) + ' 000'),
  slider(particles, 'fill', 'Remplissage (surface → plein)', 0, 1, 0.01, fx(2)),
  slider(particles, 'neckDensity', 'Particules dans les cols', 0, 1, 0.01, fx(2)),
  slider(depth, 'relief', 'Effet de relief', 0, 4, 0.01, fx(2)),
  slider(depth, 'fov', 'Perspective (focale)', 15, 100, 1, unit(0, '°')),
  slider(depth, 'depthThin', 'Raréfaction en profondeur', 0, 1, 0.01, fx(2)),
  slider(motion, 'swirl', 'Tourbillon autour de l’axe', -2, 2, 0.01, fx(2)),
  slider(motion, 'twinkle', 'Scintillement', 0, 1, 0.01, fx(2)),
  slider(motion, 'jitter', 'Vibration', 0, 1, 0.01, fx(2)),

  slider(dens, 'density', 'Pastilles par unité', 0.4, 7, 0.1, fx(1)),
  slider(dens, 'strands', 'Brins par connexion', 1, 14, 1, fx(0)),
  slider(dens, 'bundle', 'Ouverture des faisceaux', 0, 3, 0.05, fx(2)),
];

// ---------- Communs aux deux modes ----------
const dot: Common = { section: 'Pastilles', mode: 'both' };
const hov: Common = { section: 'Survol', mode: 'both' };
const rot: Common = { section: 'Rotation', mode: 'both' };
const col: Common = { section: 'Couleurs', mode: 'both' };

const BOTH: Control[] = [
  slider(dot, 'dotSize', 'Taille', 0.2, 3.5, 0.05, fx(2)),
  slider(dot, 'aspect', 'Allongement', 1, 4, 0.05, fx(2), ADV),
  slider(dot, 'fusion', 'Fusion entre pastilles', 0, 1.5, 0.01, fx(2), ADV),
  slider(dot, 'contrast', 'Variation des tailles', 0, 1, 0.01, fx(2), ADV),
  slider(dot, 'maxPx', 'Taille max à l’écran', 2, 120, 1, unit(0, ' px'), ADV),
  slider(dot, 'nodeSize', 'Taille des neurones', 0, 3, 0.05, fx(2), HIDDEN),
  slider(dot, 'linePx', 'Épaisseur du fil', 0.2, 4, 0.05, unit(2, ' px'), HIDDEN),

  toggle(hov, 'hoverOn', 'Déconstruire au survol de la souris'),
  choice(hov, 'hoverMode', 'Zone touchée', ['Autour du curseur', 'Toute la forme']),
  slider(hov, 'hoverRadius', 'Taille de la zone', 40, 500, 5, unit(0, ' px')),
  slider(hov, 'hoverForce', 'Force de la déconstruction', 0.1, 3, 0.05, fx(2), ADV),
  slider(hov, 'hoverIn', 'Vitesse d’ouverture', 0.05, 2, 0.05, unit(2, ' s'), ADV),
  slider(hov, 'hoverOut', 'Vitesse de reconstruction', 0.1, 4, 0.05, unit(2, ' s'), ADV),

  toggle(rot, 'autoRotate', 'Rotation automatique'),
  slider(rot, 'rotSpeed', 'Vitesse et sens', -4, 4, 0.05, (v) =>
    Math.abs(v) < 0.001 ? 'arrêt' : (v > 0 ? '' : '−') + Math.abs(v).toFixed(2) + '×',
  ),
  slider(rot, 'sway', 'Balancement vertical', 0, 1.5, 0.01, fx(2), ADV),

  choice(col, 'colorMode', 'Répartition', ['Zones', 'Brins', 'Hasard']),
];

// Conditions d'affichage du prototype : syncStruct (ligne 3064) et syncHov (ligne 3150).
const isLine = (s: EngineSettings) => s.qStruct === 2;
const VISIBLE_WHEN: Record<string, (s: EngineSettings) => boolean> = {
  shapeMode: (s) => !isLine(s),
  lineMode: isLine,
  lobeContrast: (s) => isLine(s) && s.lineMode === 0,
  // en Données et en Process, un renflement par valeur ou par étape : ces réglages n'y font rien
  lobes: (s) => !(isLine(s) && Number(s.lineMode) >= 1),
  lobeLen: (s) => !(isLine(s) && Number(s.lineMode) >= 1),
  pinchSpeed: (s) => !(isLine(s) && Number(s.lineMode) >= 1),
  dataContrast: (s) => isLine(s) && s.lineMode === 1,
  procMin: (s) => isLine(s) && s.lineMode === 2,
  procCurve: (s) => isLine(s) && s.lineMode === 2,
  lineLabels: (s) => isLine(s) && Number(s.lineMode) >= 1,
  infoScale: (s) => isLine(s) && Number(s.lineMode) >= 1,
  infoGap: (s) => isLine(s) && Number(s.lineMode) >= 1,
  lineLen: isLine,
  lineWave: isLine,
  lineFade: isLine,
  hoverRadius: (s) => s.hoverMode === 0,
  colorMode: (s) => (s.dots as Set<string>).size > 1, // syncColorsUI, ligne 3538
};

export const CONTROLS: Control[] = [...ILLUSTRATION, ...MOTIF, ...BOTH].map((control) =>
  VISIBLE_WHEN[control.key] ? { ...control, when: VISIBLE_WHEN[control.key] } : control,
);

// Libellés affichés dans le panneau : courts, toujours sur une seule ligne (demande du 21/10/2026).
// Le libellé du prototype reste dans `label` ; le sous-menu ou la section donne le contexte.
const SHORT_LABELS: Record<string, string> = {
  imgLoop: 'Boucle d’images',
  noiseSize: 'Taille variable',
  imgHigh: 'Saturation noirs',
  flow: 'Vitesse du flux',
  grow: 'Croissance',
  births: 'Apparitions',
  synapses: 'Synapses',
  maxLinks: 'Connexions',
  lobeContrast: 'Contraste',
  dataContrast: 'Contraste',
  procMin: 'Taille de départ',
  infoScale: 'Échelle',
  procCurve: 'Les étapes grandissent surtout',
  infoGap: 'Écart légende',
  lineLen: 'Longueur',
  lineWave: 'Ondulation (profondeur)',
  lineFade: 'Fondu des bouts',
  lobeLen: 'Étirement',
  junction: 'Gonflement',
  pinchSpeed: 'Pulsation',
  qCount: 'Quantité',
  tubeR: 'Épaisseur',
  fill: 'Remplissage',
  neckDensity: 'Densité des cols',
  relief: 'Relief',
  fov: 'Perspective',
  depthThin: 'Raréfaction',
  swirl: 'Tourbillon',
  density: 'Densité',
  strands: 'Brins',
  bundle: 'Ouverture',
  fusion: 'Fusion',
  contrast: 'Variation',
  maxPx: 'Taille max.',
  nodeSize: 'Neurones',
  linePx: 'Fil',
  hoverOn: 'Effet au survol',
  hoverRadius: 'Rayon',
  hoverForce: 'Force',
  hoverIn: 'Ouverture',
  hoverOut: 'Reconstruction',
  sway: 'Balancement',
};
const SHORT_OPTIONS: Record<string, string[]> = {
  hoverMode: ['Curseur', 'Forme entière'],
};

/** Libellé affiché (et annoncé) dans le panneau. */
export const displayLabel = (control: Control) => SHORT_LABELS[control.key] ?? control.label;
/** Choix affichés d'un sélecteur, avec les mêmes valeurs que le prototype. */
export const displayOptions = (control: ChoiceControl) =>
  control.options.map((option, i) => ({ ...option, label: SHORT_OPTIONS[control.key]?.[i] ?? option.label }));

/** Le réglage est-il affiché, d'après l'état du moteur (comme dans le prototype) ? */
export const isVisible = (control: Control, settings: EngineSettings) => control.when?.(settings) ?? true;
