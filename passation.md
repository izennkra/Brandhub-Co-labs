# Passation : Brand Hub · Co-labs

> Document de reprise pour la prochaine IA (ou personne) qui travaille sur ce projet.
> Rédigé le 21/10/2026. Mis à jour le 21/10/2026 après la tâche 4, branche `feature/pattern-engine`.
> **Lire aussi, dans cet ordre** : `CLAUDE.md` (règles), `CAPABILITY-MAP.md` (carte), `SPEC-pattern-engine.md` (spec en cours), `tasks/todo.md` (tâches en cours).

---

## 1. Qui, quoi, pour qui

- **Porteur du projet** : Izenn, graphiste freelance. **Il n'est pas développeur.**
  - Toujours lui répondre **en français simple**, sans jargon, en expliquant ce qu'on fait et pourquoi.
  - Il valide chaque étape importante. Pour ses décisions, lui proposer des choix cliquables (question avec options) plutôt qu'une question ouverte.
- **Client final** : Co-labs. Le moteur de patterns a été **validé par le client**.
- **Dépôt** : `github.com/izennkra/Brandhub-Co-labs`, **privé**. Copie locale : `~/Documents/IZENN/Graphisme/Freelance/Claud code project/Brand hub co labs`.
- **Figma** : https://www.figma.com/design/m5slgzL3STP1gMgceYKHog/Izenn-X-Elias-Studio?node-id=2337-6322 (fileKey `m5slgzL3STP1gMgceYKHog`, page « Brand hub co labs »). Accès par le MCP Figma.

## 2. L'objectif

Transformer un **prototype HTML d'un seul fichier** (`reference/prototype.html`, 4 418 lignes) en une **vraie application React + TypeScript** : un « hub de marque » pour Co-labs, avec deux grandes sections.

- **Tool** : des outils de création. **Motif** (moteur de patterns 3D), **Illustration** (images transformées en nuages de pastilles) et **Layout editor** (mise en page de formats réseaux sociaux, l'ancien « Design libre »).
- **Ressource** : le kit de marque. Logo, Typographie, Couleur, Iconographie, Imagerie, Patterns prédéfinis, Inspiration.

Puis, plus tard :
- un **profil éditeur**, protégé par un mot de passe, pour remplir les ressources ;
- un **menu Réglages** unique qui remplit toutes les ressources depuis un seul endroit ;
- un **mini-outil de déclinaison automatique des logos** en couleurs ;
- l'**intégration du pattern sur le site du client**, avec ses effets de survol.

## 3. La problématique

1. **Le moteur de patterns ne doit JAMAIS être modifié** : c'est la règle n° 1 de `CLAUDE.md`. Il est validé par le client. Il faut pourtant le sortir d'un prototype où il est **entremêlé avec l'interface** (un seul bloc de code : moteur, 67 curseurs, export, Design libre), et prouver que son rendu reste **identique**.
2. **Le Figma fait foi pour le design**, mais il est dessiné **à l'échelle × 1,44**, avec des valeurs irrégulières et **sans variables**. Il a fallu **harmoniser** : base 14 px, grille de 4 px, contrastes WCAG AA. Le tableau est validé dans `docs/design-tokens.md`.
3. Certaines pages **n'ont pas de maquette** (Imagerie, Patterns prédéfinis, profil éditeur, Réglages, section Couleurs du panneau). Règle : l'IA les conçoit à partir des références du client, dans le style du Figma, et **les fait valider avant de coder**.
4. Le porteur n'est pas développeur : chaque étape doit être **expliquée, vérifiable et validée**.

## 4. Le process de travail (à suivre impérativement)

**Méthode** : les Agent Skills d'Addy Osmani, installés dans `.claude/skills/` (commandes dans `.claude/commands/`). Les commandes `/spec`, `/plan`, `/build`, `/review` et `/ship` sont des fichiers markdown du projet : si elles ne sont pas chargées automatiquement, lire `.claude/commands/<nom>.md` et la skill correspondante, puis les suivre.

1. **`/spec`** : poser les questions de cadrage (choix cliquables), écrire `SPEC-<partie>.md`, **s'arrêter** et attendre la validation.
2. **`/plan`** : écrire `tasks/plan.md` et `tasks/todo.md` (tâches de 5 fichiers maximum, critères d'acceptation, points de contrôle). L'ancien plan terminé va dans `tasks/archive/`. Attendre la validation.
3. **`/build`** : les tâches s’enchaînent **sans demander « on enchaîne ? »**, un commit par tâche. On s’arrête seulement aux **points de contrôle** et quand une **maquette** doit être validée (décision du 21/10/2026). Dans chaque tâche :
   - écrire d'abord les tests (rouge), puis le code (vert) ;
   - prouver que les tests attrapent vraiment les erreurs : introduire **1 ou 2 erreurs ciblées** exprès (« mutation »), vérifier que le test échoue, puis remettre le code ;
   - faire un contrôle visuel dans le navigateur (si la tâche change ce qui s’affiche) ;
   - commit + push.
4. **Points de contrôle** : le porteur teste lui-même (l'appli s'ouvre dans le panneau navigateur via `.claude/launch.json`, configuration `brandhub-dev`).
5. **`/review`** en fin de partie : 5 axes. Le compte rendu va dans `docs/review-<partie>.md`.
6. **Pull request** vers `main`, proposée au porteur. On ne fusionne **que** sur son accord explicite.

**Git** : une branche par partie (`spec/…` pour les documents, `feature/…` pour le code), jamais de travail direct sur `main`. Messages de commit en français. Chaque commit se termine par :
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

**La porte de qualité : jamais de commit si un contrôle échoue.** Vérification du code, tests unitaires et build à chaque tâche. Tests navigateur (`E2E`) et rendu identique (`RENDER`) **seulement si la tâche change l’affichage ou touche au moteur / à `createEngine.ts`**. Le cas Ligne du rendu identique échoue parfois (≈ 1 fois sur 4, déjà le cas avant) : seuil gardé à 0,1 % (décision du porteur), relancer en cas d’échec à 0,146 %. Commande complète :
```bash
npx prettier --write src tests e2e scripts playwright.config.ts >/dev/null
LINT=$(npm run lint 2>&1); UNIT=$(npm test 2>&1); BUILD=$(npm run build 2>&1)
E2E=$(npx playwright test --project=chromium --repeat-each=2 2>&1)
RENDER=$(npx playwright test --project=rendu-identique --no-deps 2>&1)
# STOP si "✖|FAIL|failed|flaky|error TS|[warn]" dans LINT/UNIT/BUILD/E2E, ou "failed" dans RENDER
```

## 5. Où on en est exactement

### Carte des parties (`CAPABILITY-MAP.md`, validée)

| Partie | État |
|---|---|
| `app-shell` (structure globale, navigation, design system) | ✅ **terminée, fusionnée dans `main`** (PR n° 1) |
| `pattern-engine` (moteur de motifs) | 🟡 **en cours : tâches 1 à 10 sur 12 faites** |
| `data-store` (stockage partagé) | à faire |
| `editor-access` (profil éditeur, mot de passe) | à faire |
| `resources` (pages Ressource) | à faire |
| `layout-editor` | à faire |
| Briques futures (temps 2) : `brand-settings`, `logo-variants`, `pattern-embed` | à faire, après les pages Ressource |

### Partie en cours : `pattern-engine`

- **Branche** : `feature/pattern-engine` (créée depuis `spec/pattern-engine`). Poussée, **pas encore de pull request**.
- **Spec** : `SPEC-pattern-engine.md`, validée. Décisions :
  - copie du moteur à l'identique ;
  - périmètre « moteur + réglages » : export et préréglages plus tard ;
  - réglages essentiels du Figma + « Réglage avancé » ;
  - barre de scène en haut à gauche (lecture/pause, nouvelle forme R) ;
  - section Couleurs : maquette à valider avant de coder ;
  - tracé de ligne et infographie dans « Réglage avancé » ;
  - raccourci **⌥ H / Alt + H**.
- **Plan** : `tasks/plan.md` et `tasks/todo.md`, 12 tâches en 4 phases.
  - ✅ **Tâche 1** : bloc moteur extrait octet pour octet, test d'identité.
  - ✅ **Tâche 2** : le moteur s'affiche et s'anime dans Tool › Motif.
  - ✅ **Tâche 3** : rendu identique au prototype, prouvé au pixel (< 0,1 %).
  - ✅ **Point de contrôle A** : validé par le porteur le 21/10/2026.
  - ✅ **Tâche 4** : table des réglages `src/lib/pattern-engine/controls.ts` (66 curseurs, 5 interrupteurs, 5 sélecteurs, hors export), vérifiée contre le prototype par `tests/engine-controls.test.ts`. Niveaux : `essential` (Figma), `advanced` (liste ADV_… du prototype + tracé de ligne et infographie), `hidden` (réglages des variantes Aérée et Dense, jamais affichés dans le prototype).
  - ✅ **Tâche 5** : composants `Slider`, `Toggle`, `Segmented` dans `src/components/engine/` (tokens ajoutés : `--size-toggle-knob`, `--size-slider-handle*`).
  - ✅ **Tâche 6** : panneau Motif branché (`EditorPanel` + `EngineControls` + `useEngine`), « Réglage avancé » mémorisé (`bhc.expert`), conditions d’affichage du prototype dans `controls.ts` (`when`), actions `change` / `setLineMode` dans `createEngine.ts` (`isLine`, `buildLine`, `lineLobes` exposés par le script). Couleurs et Préréglages affichent encore « Réglages à venir ». Libellés courts affichés : `SHORT_LABELS` / `SHORT_OPTIONS` dans `controls.ts` (une seule ligne partout, vérifié par `e2e/editor-panel.spec.ts`).
  - ✅ **Tâche 7** : section Couleurs (`ColorPicker`), actions `setBackground` / `toggleDot` dans `createEngine.ts` (`PALETTE` exposée), « Répartition » seulement avec plusieurs couleurs de pastilles.
  - ✅ **Point de contrôle B** : validé le 21/10/2026.
  - ✅ **Tâche 8** : bascule Motif ↔ Illustration (`actions.setApp`, repris de `setApp` du prototype ; la page Illustration a `engine: 'illustration'`). Rendu identique prouvé en Illustration. Le script vérifie maintenant les noms exposés avec le compilateur TypeScript (gère `let a=…, b=…`).
  - ✅ **Tâche 9** : images de l’Illustration. `ImageList` (panneau, poignée clavier ↑ ↓), `ImageStrip` (bandeau sous la scène, « + » pour importer), outils partagés dans `imageHooks.ts`. Actions `images`, `pickImage`, `moveImage`, `deleteImage`, `toggleLoop`, `addImages`, `loadTone`, `saveTone` dans `createEngine.ts` ; effets `toneChanged`, `dirtyImg`, `restartLoop` branchés. Icônes ajoutées : `dot-grid2x3`, `checkmark1-small`. L’ordre est enregistré 600 ms après le dernier changement (comme le prototype).
  - ✅ **Tâche 10** : panneau Illustration complet (bouton « Rétablir les tons » en avancé, `actions.resetTone`, placé avant « Trame » via `beforeSubs`).
  - ⏸️ **Point de contrôle C** : à faire tester au porteur. Ensuite tâche 11 (barre de scène, notifications, ⌥ H) et tâche 12 (relecture, PR).
- Le panneau Éditeur à droite affiche encore « Réglages à venir » : (sections Couleurs et Préréglages partagés seulement : tâche 7 et partie data-store).
- **Attention** : le raccourci est encore **H** dans `src/app/ToolLayout.tsx` (ligne 30). Le passage à ⌥ H est prévu à la **tâche 11**.

## 6. Fichiers importants

**Règles et cadrage**
- `CLAUDE.md` : règles du projet. **À lire en premier.** Moteur intouchable, Figma, harmonisation, icônes Central, pages sans maquette.
- `CAPABILITY-MAP.md` : les parties et l'ordre de construction.
- `SPEC-app-shell.md` (terminée), `SPEC-pattern-engine.md` (en cours).
- `tasks/plan.md`, `tasks/todo.md` (en cours) ; `tasks/archive/` (plans terminés).
- `docs/design-tokens.md` : tableau d'harmonisation Figma → valeurs retenues (validé).
- `docs/review-app-shell.md` : relecture de la structure globale.
- `reference/prototype.html` : **le prototype, ne jamais le modifier.**
- `reference/pages/` : dossiers de références du client pour les pages sans maquette. Le client peut aussi mettre ses références dans le Figma : un frame nommé `Section / Page`.

**Moteur de patterns**
- `scripts/extract-engine.mjs` (`npm run engine:extract`) :
  - copie les lignes 852 à 2616 du prototype dans le module généré, entre une en-tête et une fin générées ;
  - liste les noms attendus par le bloc (avec le compilateur TypeScript) ;
  - réglages en tête du script : `EXPORTS` (ce qu'on lit dans le moteur), `SETTERS` (ce qu'on réaffecte, ex. `rng`), `SHADOWED` (fonctions du navigateur remplacées, ex. `requestAnimationFrame`).
- `src/lib/pattern-engine/prototype-engine.js` : **GÉNÉRÉ, ne jamais modifier à la main**. SHA-256 du bloc : `72457c2f2f502d888e2cbbab06f6ed6993bc69d66d3c7494d00f784662f66715`.
- `src/lib/pattern-engine/required-globals.json` : les 9 noms que le bloc attend.
- `src/lib/pattern-engine/prototype-engine.d.ts` : types du module généré (écrits à la main).
- `src/lib/pattern-engine/createEngine.ts` : **la couche d'adaptation**. Elle contient :
  - `buildEnv` (ce que le moteur reçoit) ;
  - `createAnimationGate` (pause de la boucle hors des pages Tool) ;
  - les éléments de page attendus (`#scene`, `#labels`, `#panel`, `#openPanel`) ;
  - la famille de police « Geist » déclarée pour les textes du moteur ;
  - le démarrage dans l'ordre du prototype (`refreshColors`, `regenerate`, `resetView`, `loadLibrary`, `frame`) ;
  - les actions `setStructure` et `setShape`, recopiées de l'interface du prototype ;
  - les points d'accroche de test `window.__engineTestHooks`.
- `src/components/engine/EngineStage.tsx` : la scène dans la zone centrale (chargement à la demande).
- `src/types/three.d.ts` : types minimaux de Three.js r128, qui n'en fournit pas.

**Application**
- `src/app/navigation.ts` : **le modèle unique des pages**. Adresse, libellé, icône, texte d'attente, sections de l'Éditeur, description. À modifier ici, pas ailleurs.
- `src/app/routes.tsx`, `AppLayout.tsx` (menu repliable sous 1280 px), `ToolLayout.tsx` (panneau Éditeur), `ResourceLayout.tsx`.
- `src/styles/tokens.css` : **seul endroit autorisé pour les valeurs** (couleurs, typos, espacements). Un test interdit les couleurs en dur ailleurs.
- `src/components/Icon.tsx` + `icons.registry.tsx` : icônes **VisualSystem, set Central uniquement**. Variante `round-outlined-radius-2-stroke-1.5`, et trait 2 pour les petites tailles. Un test interdit toute librairie d'icônes.

**Tests**
- `tests/` : Vitest. Le moteur y est remplacé par une doublure (`tests/setup.ts`), car jsdom n'a pas de WebGL.
- `e2e/` : Playwright.
  - `engine-render.spec.ts` : rendu identique au prototype, dans le projet `rendu-identique` (lancé après les autres, rejoué 2 fois au maximum) ;
  - `visual.spec.ts` : 10 captures de référence, générées sur macOS ;
  - `accessibility.spec.ts` : contraste AA de tout texte, contour de focus.

## 7. Commandes utiles

```bash
npm run dev                # appli sur http://localhost:5173
npm test                   # tests unitaires (Vitest)
npm run test:e2e           # tests navigateur (Playwright)
npm run lint               # ESLint + Prettier
npm run build              # build de production
npm run engine:extract     # régénère le moteur depuis le prototype
npx playwright test visual --update-snapshots   # après un changement visuel VOULU
```

## 8. Ce qui a été essayé et a raté (et comment c'a été résolu)

| Problème | Cause | Solution retenue |
|---|---|---|
| La spec prévoyait d'exécuter le moteur avec `new Function` en mode non strict | Erreur d'analyse : le prototype commence par `"use strict"` | Module JS normal (strict), sans `eval`. Spec corrigée. |
| Rendu app ≠ prototype à 30 % | Le style de test (scène 800 × 600) était inséré avant que `<head>` existe | Insertion au `DOMContentLoaded` |
| Rendu app ≠ prototype à 0,3–1 % (forme identique, pastilles différentes) | Le démarrage de l'appli n'appelait pas `loadLibrary()`. Le prototype range ses 3 images de démo au premier lancement et tire un nombre au hasard par image | `loadLibrary()` ajouté au démarrage, dans l'ordre du prototype. **Leçon : reproduire la séquence de démarrage exacte du prototype.** |
| Lecture du canvas WebGL toujours noire | Le tampon WebGL est vidé après affichage | Lecture dans un `requestAnimationFrame`. Dans le test de rendu : `preserveDrawingBuffer` forcé (test seulement), puis `toDataURL` |
| Test de rendu instable quand plusieurs tests tournent en parallèle | Sous charge, même le prototype comparé à lui-même varie (0,1–0,2 %) | Projet Playwright séparé `rendu-identique`, lancé après les autres, sans parallélisme, avec `retries: 2` |
| Mode Ligne parfois différent | **Le prototype lui-même** n'est pas parfaitement reproductible en Ligne (jusqu'à 0,25 %) | Réessais. Un vrai écart échoue à chaque fois. |
| Variante « Aérée » introuvable pour le test | Retirée de l'interface dans le prototype (`gVar._d.remove()`) | Remplacée par Membrane « Simple » |
| Le test visuel ne voyait pas un arrondi supprimé | Tolérance trop large (1 % des pixels, seuil de couleur par défaut) | `maxDiffPixels: 50`, `threshold: 0.02` |
| Un commit est parti avec un test navigateur en échec (app-shell, tâche 7) | La commande de vérification ne bloquait pas | Porte de qualité ci-dessus. Test corrigé dans le commit suivant. |
| Test de la touche H instable | H pressé avant que la page ait branché le raccourci | Attendre la page prête (`networkidle`) |
| Sur petit écran, H agissait derrière le menu ouvert | Le raccourci ignorait l'état inert | Raccourci ignoré quand `main[inert]` |
| Erreur ESLint « Cannot access refs during render » | Un objet contenant une ref était passé en prop | Props séparées (`drawer`, `onClose`, `closeRef`) |
| Prettier reformatait les fichiers générés (le test d'identité aurait cassé) | — | Fichiers générés dans `.prettierignore` et ignorés par ESLint |
| `create-vite` propose oxlint par défaut | La spec prévoit ESLint | ESLint gardé |
| Set d'icônes Central | Licence **commerciale** (iconists) ; le trait n'est pas réglable | Le porteur possède ou achète la licence (**à vérifier avant mise en ligne**). Variante de trait 2 pour `xs`/`sm`, 1,5 pour `md`/`lg` |
| Messages tronqués (deux fois, le porteur a envoyé « Voici le lien : » sans lien) | — | Le lui faire remarquer gentiment et redemander |

## 9. Points ouverts et pièges à connaître

- **Ne jamais toucher** `reference/prototype.html` ni `src/lib/pattern-engine/prototype-engine.js`. Toute adaptation se fait dans `createEngine.ts`. Pour exposer une nouvelle variable du moteur : l'ajouter à `EXPORTS` ou `SETTERS` dans le script, puis lancer `npm run engine:extract`.
- Les **actions de l'interface du prototype** (`setVariant`, `setApp`, `applySettings`, boutons de forme…) ne font pas partie du moteur. Elles sont **recopiées fidèlement** dans `createEngine.ts`, avec la ligne d'origine en commentaire, et leur rendu est vérifié avec `engine-render.spec.ts`.
- Pour la **tâche 4** (`controls.ts`) : les réglages se trouvent dans `reference/prototype.html`, lignes 2618 à 3600 environ. Ce sont des appels `slider(…)`, `toggle(…)` et `seg(…)` : 67 curseurs, 6 interrupteurs et 7 sélecteurs, avec leurs effets (`regenSoon`, `refreshColors`…). Le test doit comparer la table à ces appels.
- **Mise en ligne (`/ship`)** :
  - règle de réécriture Vercel pour les adresses rafraîchies ;
  - vérifier la licence Central Icons ;
  - le prototype appelait `/api/store` (Vercel + Upstash Redis) : à reprendre dans `data-store`.
- **Pas d'intégration continue** sur GitHub. Les captures de référence sont propres à macOS (`*-darwin.png`).
- **Accessibilité** : WCAG AA, contrastes vérifiés automatiquement. Ne pas éclaircir le texte secondaire `#724F40`.

## 10. Prochaines étapes

1. Faire valider le **point de contrôle C**, puis tâches 11 et 12 (fin de la partie pattern-engine, pull request).
2. Continuer le plan `pattern-engine` :
   - tâches 5 à 7 : composants de contrôle, panneau Motif branché, section Couleurs (**maquette à faire valider avant de coder**) ; puis point de contrôle B ;
   - tâches 8 à 10 : bascule vers l'Illustration, images, panneau Illustration ; puis point de contrôle C ;
   - tâche 11 : barre de scène, notifications, **⌥ H** ;
   - tâche 12 : performance, accessibilité, `/review`, pull request.
3. Parties suivantes de la carte, chacune avec `/spec` → `/plan` → `/build` → `/review` → PR :
   - `data-store` : stockage partagé, préréglages, images. Le prototype avait déjà un `Store` : `claude db`, puis `/api/store`, sinon `localStorage` ;
   - `editor-access` ;
   - `resources` ;
   - `layout-editor`.
4. **Export** (PNG, WebP, JPEG, SVG, vidéo, Figma) : étape à planifier après `pattern-engine`.
5. **Temps 2** : `brand-settings` (un seul menu Réglages qui remplit les Ressources), `logo-variants` (déclinaisons de logos automatiques), `pattern-embed` (pattern intégrable sur le site du client, avec effets de survol).
