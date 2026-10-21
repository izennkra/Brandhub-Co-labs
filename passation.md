# Passation : Brand Hub · Co-labs

> Document de reprise pour la prochaine IA (ou personne) qui travaille sur ce projet.
> Mis à jour le 22/10/2026 (soir). `data-store` fusionnée (PR n° 3). Branche en cours : `feature/export`. **Nouvel ordre décidé par le porteur : Export → Ressources → Layout editor** (Vercel et profil éditeur après).
> **Lire aussi, dans cet ordre** : `CLAUDE.md` (règles), `CAPABILITY-MAP.md` (carte), puis la section 5 ci-dessous (où on en est exactement).

---

## 1. Qui, quoi, pour qui

- **Porteur du projet** : Izenn, graphiste freelance. **Il n'est pas développeur.**
  - Toujours lui répondre **en français simple**, sans jargon, en expliquant ce qu'on fait et pourquoi.
  - Pour ses décisions, proposer des **choix cliquables** (question avec options, la recommandation en premier) plutôt qu'une question ouverte, et **toutes les questions en une seule fois**.
  - Il veut que **ça avance vite** : peu de messages intermédiaires, un compte rendu à la fin, sorties de commandes filtrées. La qualité reste exigée (tests, erreurs volontaires, contrôles), mais sans étapes inutiles (voir section 4).
- **Client final** : Co-labs. Le moteur de patterns a été **validé par le client**.
- **Dépôt** : `github.com/izennkra/Brandhub-Co-labs`, **privé**. Copie locale : `~/Documents/IZENN/Graphisme/Freelance/Claud code project/Brand hub co labs`.
- **Figma** : https://www.figma.com/design/m5slgzL3STP1gMgceYKHog/Izenn-X-Elias-Studio?node-id=2337-6322 (fileKey `m5slgzL3STP1gMgceYKHog`, page « Brand hub co labs »). Accès par le MCP Figma. Écrans utiles : `Tool / Motif` (2337:7302), `Tool / Illustrations iconographique` (2337:7471), bandeau d'images (2337:7548).

## 2. L'objectif

Transformer un **prototype HTML d'un seul fichier** (`reference/prototype.html`, 4 418 lignes) en une **vraie application React + TypeScript**, hébergée sur Vercel : un « hub de marque » pour Co-labs, avec deux grandes sections.

- **Tool** : des outils de création. **Motif** (moteur de patterns 3D), **Illustration** (images transformées en nuages de pastilles) et **Layout editor** (mise en page de formats réseaux sociaux, l'ancien « Design libre »).
- **Ressource** : le kit de marque. Logo, Typographie, Couleur, Iconographie, Imagerie, Patterns prédéfinis, Inspiration.

Puis, plus tard :
- un **profil éditeur**, protégé par un mot de passe, pour remplir les ressources ;
- un **menu Réglages** unique qui remplit toutes les ressources depuis un seul endroit ;
- un **mini-outil de déclinaison automatique des logos** en couleurs ;
- l'**intégration du pattern sur le site du client**, avec ses effets de survol.

## 3. La problématique

1. **Le moteur de patterns ne doit JAMAIS être modifié** (règle n° 1 de `CLAUDE.md`, validé par le client). Il était **entremêlé avec l'interface** dans le prototype. Solution en place : il est extrait octet pour octet par un script, et **tout ce qui était « interface du prototype »** (boutons, transitions, images, préréglages…) est **recopié fidèlement** dans une couche d'adaptation, avec la ligne d'origine en commentaire. Un test prouve que le rendu est identique au prototype (comparaison au pixel).
2. **Le Figma fait foi pour le design**, mais il est dessiné **à l'échelle × 1,44**, avec des valeurs irrégulières et **sans variables**. Il a été **harmonisé** (base 14 px, grille de 4 px, contrastes WCAG AA) : tableau validé dans `docs/design-tokens.md`, toutes les valeurs dans `src/styles/tokens.css`.
3. Certaines pages **n'ont pas de maquette** (Imagerie, Patterns prédéfinis, profil éditeur, Réglages…). Règle : l'IA les conçoit dans le style du Figma, à partir des références du client, et **les fait valider avant de coder** (comme la section Couleurs, validée le 21/10/2026).
4. Le porteur n'est pas développeur : chaque étape doit être **expliquée, vérifiable et validée**.

## 4. Le process de travail (version accélérée, validée le 21/10/2026)

> **Depuis le 22/10/2026 : on va vite.** Le porteur demande de ne plus suivre le process à la lettre et d'enlever toutes les étapes inutiles : pas de `SPEC-*.md` ni de `tasks/plan.md` pour une partie déjà cadrée, pas de `/review` en document séparé, pas de question « on enchaîne ? ». **On garde** : tests + 1 ou 2 erreurs volontaires, porte de qualité avant chaque commit, contrôle visuel si l'affichage change, moteur intouché, validation des maquettes.

**Méthode** : les Agent Skills d'Addy Osmani ont été **supprimées du projet le 22/10/2026** (trop longues). On code directement, voir `CLAUDE.md` § Méthode. Pas de `SPEC-*.md`, de `tasks/` ni de `docs/review-*.md` pour les nouvelles parties.

**Git** : une branche par partie (`feature/…`), jamais de travail direct sur `main`. Messages en français. Chaque commit se termine par :
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

**La porte de qualité : jamais de commit si un contrôle échoue.**
- À **chaque** tâche : vérification du code, tests unitaires, build.
- Tests navigateur (`E2E`) et rendu identique (`RENDER`) **seulement si la tâche change l'affichage ou touche au moteur / à `createEngine.ts`**.
```bash
npx prettier --write src tests e2e scripts playwright.config.ts >/dev/null
LINT=$(npm run lint 2>&1); UNIT=$(npm test 2>&1); BUILD=$(npm run build 2>&1)
E2E=$(npx playwright test --project=chromium --repeat-each=2 2>&1)
RENDER=$(npx playwright test --project=rendu-identique --no-deps 2>&1)
# STOP si "✖|FAIL|failed|flaky|error TS|[warn]" dans LINT/UNIT/BUILD/E2E, ou "failed" dans RENDER
```
- Le cas **Ligne** du rendu identique échoue parfois (0,13 à 0,2 %) : seuil gardé à 0,1 % (décision du porteur), **on relance** (voir section 8).
- **Fermer l'onglet de prévisualisation** (ou le mettre sur une page Ressource) pendant les tests de rendu : il fait tourner le moteur et occupe la carte graphique.

## 5. Où on en est exactement

### Carte des parties (`CAPABILITY-MAP.md`)

| Partie | État |
|---|---|
| `app-shell` (structure, navigation, design system) | ✅ terminée, fusionnée (PR n° 1) |
| `pattern-engine` (Motif + Illustration) | ✅ **terminée, fusionnée dans `main` le 22/10/2026 (PR n° 2, commit `4fa7434`)**. Relecture : `docs/review-pattern-engine.md`. Plan archivé : `tasks/archive/pattern-engine-*.md` |
| `data-store` (stockage partagé) | ✅ **terminée, testée par le porteur, fusionnée le 22/10/2026 (PR n° 3, commit `583eb8c`)**. Étapes Vercel données au porteur (projet, Upstash, Blob, redéploiement) |
| `export` (bloc Export du Figma : Image, SVG, Vidéo, Figma) | 🟡 **codé et poussé** (branche `feature/export`) : le porteur teste, puis PR. Code : `exporter.ts` (recopié du prototype), `export-options.ts` (léger), `ExportPanel.tsx`. Tailles 1x à 6x de la scène (Figma) au lieu de HD/2K/4K/6K. Le Layout editor reste « Export » désactivé |
| `resources` (pages Ressource) | ensuite (voir décisions ci-dessous) |
| `layout-editor` | après les Ressources |
| `editor-access` (profil éditeur, mot de passe) | plus tard ; un simple « code » protège déjà la modification des Ressources |
| `resources` (pages Ressource) | à faire |
| `layout-editor` | à faire |
| Temps 2 : `brand-settings`, `logo-variants`, `pattern-embed` | à faire, après les Ressources |

### Partie en cours : `data-store`

- **Branche** : `feature/data-store`, poussée. Commits `2203103` (service + module) et `eb8f864` (préréglages).
- **Fait** :
  - `api/store.ts` : fonction Vercel `/api/store` (contrat ci-dessous), données dans Upstash Redis (une table `bhc:<collection>`), variables `KV_REST_API_URL`/`KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_*`). Sans ces variables, le ping répond « absent » et tout reste dans le navigateur. Logique testée avec une base en mémoire (`tests/store.test.ts`).
  - `src/lib/store/store.ts` : module de stockage de l'appli (`getStore()`), mêmes clés que le moteur. Pas encore utilisé : prêt pour les Ressources.
  - `src/lib/pattern-engine/presets.ts` : section Préréglages recopiée du prototype (fichier léger : **ne pas importer `createEngine.ts` depuis le panneau**, sinon Three.js se charge sur les pages Ressource). Affichée par `src/components/engine/PresetList.tsx`. Moteur : seuls `orbit` et `storeReady` ajoutés à `EXPORTS` (SHA du bloc inchangé).
  - Adaptations au fait que l'outil dépend de la page : la liste ne montre que les préréglages de l'outil affiché ; le préréglage étoilé s'applique quand son outil s'ouvre.
- **Pas fait (volontairement)** : `/api/files` (Vercel Blob) → reporté à la partie `resources`, la seule qui en a besoin. Le sélecteur « Préréglage » posé sur la scène dans le prototype (`presetPill`) n'est pas repris (absent du Figma).
- **Décisions du porteur (22/10/2026)**, à reporter dans `SPEC-data-store.md` :
  1. **Stockage** : Vercel + **Upstash Redis** (données) + **Vercel Blob** (gros fichiers : logos, images).
  2. **Périmètre** : le **service de stockage partagé** + la section **« Préréglages partagés »** (enregistrer, appliquer, supprimer, préréglage ouvert au démarrage, comme le prototype) + un **module de stockage côté appli** prêt pour les Ressources.
  3. **Droits** : **tout le monde peut modifier pour l'instant**. Le mot de passe éditeur et la lecture seule arriveront avec `editor-access`.
  4. **Vercel pas encore relié** : tout coder et tester **en local avec une base simulée**. Donner ensuite au porteur les étapes à cliquer chez Vercel (créer le projet, ajouter Upstash et Blob depuis le Marketplace) avant la mise en ligne.
- **Ce qui a été trouvé en préparant** :
  - Le moteur du prototype contient déjà un `Store` (`prototype-engine.js`, lignes 1184-1218) qui essaie dans l'ordre : `window.claude.use('db')`, puis **`/api/store`**, sinon le **navigateur** (`localStorage`, clés `bhc.store.<collection>`). **Le contrat de `/api/store` est donc imposé par le moteur** (qu'on ne modifie pas) :
    - `GET /api/store?ping=1` → `{ ok: true }` (détection du service) ;
    - `GET /api/store?col=<c>` → `{ ok, items: [{ id, data }] }` ;
    - `GET /api/store?col=<c>&id=<id>` → `{ ok, item: { data } }` ;
    - `POST /api/store` avec `{ col, id, data }` → `{ ok }` (sinon `{ ok: false, error }`) ;
    - `DELETE /api/store?col=<c>&id=<id>`.
  - Collections utilisées par le moteur : `images` (infos d'une image : nom, tons, boucle, date), `imagesrc` (contenu de l'image), `presets` (préréglages).
  - La section **Préréglages** est dans l'interface du prototype (`reference/prototype.html`, lignes **2677 à 2775** : `snapshotSettings`, `applySettings`, `slugName`, `fmtDate`, `renderPresets`, `savePreset`, `initPresets`). Elle est à **recopier fidèlement** dans `createEngine.ts` (comme les autres actions) et à afficher dans la section « Préréglages partagés » du panneau (aujourd'hui « Réglages à venir »). Détails du prototype : nom ≤ 40 caractères (sinon « Préréglage N »), identifiant = nom simplifié (`slugName`), mise à jour si le nom existe déjà, étoile = préréglage ouvert au démarrage **sur cet appareil** (`localStorage` `bhc.presetDefault`), retrait en deux temps, ancienne liste `synapse.presets.v1` reprise, réglages non enregistrés : `paused`, `fog`, `pinches`.
- **Pistes techniques proposées (non encore validées dans une spec)** :
  - `api/store.ts` : fonction Vercel ; la logique dans un module testable qui reçoit une base (Upstash en ligne, base en mémoire dans les tests) ; contrôle des noms de collections et des tailles.
  - `api/files.ts` : envoi et suppression de fichiers dans Vercel Blob (pour les Ressources).
  - `src/lib/store/` : module de stockage de l'appli, **même contrat et mêmes clés `localStorage`** que le `Store` du moteur, pour que les deux voient les mêmes données.
  - **Attention** : en local (`npm run dev`), il n'y a pas de `/api/store`, donc le moteur reste en mode navigateur. **Ne pas brancher de faux `/api/store` sur le serveur de dev** : le test de rendu identique attend les images dans `localStorage` (`bhc.store.images`).

### Ce que fait l'appli aujourd'hui (pattern-engine terminé)

- **Motif** et **Illustration** affichent le moteur, avec un rendu identique au prototype (comparaison au pixel, ≤ 0,1 %).
- **Panneau Éditeur** : réglages du Figma par défaut, tous les autres derrière « Réglage avancé » (mémorisé, clé `bhc.expert`). Libellés courts, toujours sur une ligne. Sections Motif : Circulation (avancé), Réseau, Volume, Pastilles, Survol, Rotation, Couleurs (fond, pastilles, répartition). Sections Illustration : Images, Animation, Lumière et tons (avec « Rétablir les tons » en avancé), Pastilles, Survol, Rotation, Couleurs.
- **Images** : liste du panneau + bandeau sous la scène ; ajout, choix, retrait en deux temps, ordre (souris et clavier), conservées dans le navigateur.
- **Barre de scène** : pause, nouvelle forme / rejouer (touche R). **Messages du moteur** affichés. **⌥ H / Alt + H** replie l'Éditeur.
- **Reste « Réglages à venir »** : la section « Préréglages partagés » (c'est la partie `data-store`).

## 6. Fichiers importants

**Règles et cadrage**
- `CLAUDE.md` : règles du projet. **À lire en premier.**
- `CAPABILITY-MAP.md` : les parties et l'ordre de construction.
- `SPEC-app-shell.md`, `SPEC-pattern-engine.md` (terminées) ; `SPEC-data-store.md` (**à écrire**).
- `tasks/archive/` : plans terminés (`app-shell-*`, `pattern-engine-*`). `tasks/plan.md` et `tasks/todo.md` : **à créer** pour `data-store`.
- `docs/design-tokens.md` (harmonisation validée), `docs/review-app-shell.md`, `docs/review-pattern-engine.md`.
- `reference/prototype.html` : **le prototype, ne jamais le modifier.**
- `reference/pages/` : références du client pour les pages sans maquette (ou dans le Figma, frame `Section / Page`).

**Moteur de patterns** (`src/lib/pattern-engine/`)
- `scripts/extract-engine.mjs` (`npm run engine:extract`) : copie le bloc moteur du prototype dans le module généré. En tête du script : `EXPORTS` (ce qu'on lit), `SETTERS` (ce qu'on réaffecte), `SHADOWED`. Il vérifie avec le compilateur TypeScript que chaque nom existe dans le bloc.
- `prototype-engine.js` : **GÉNÉRÉ, ne jamais modifier à la main**. SHA-256 du bloc : `72457c2f2f502d888e2cbbab06f6ed6993bc69d66d3c7494d00f784662f66715`.
- `prototype-engine.d.ts` : types du module généré (écrits à la main).
- `createEngine.ts` : **la couche d'adaptation** (416 lignes). Démarrage dans l'ordre du prototype, et toutes les actions recopiées de l'interface du prototype : `change` (applique un réglage et son effet), `setStructure`, `setShape`, `setLineMode`, `setApp` (Motif ↔ Illustration), `setBackground`, `toggleDot`, `togglePause`, `newShape`, images (`images`, `pickImage`, `moveImage`, `deleteImage`, `toggleLoop`, `addImages`, `loadTone`, `saveTone`, `resetTone`). Points d'accroche de test `window.__engineTestHooks`.
- `controls.ts` : **la table des réglages** (clé, libellé du prototype, bornes, pas, format, section, sous-menu, effet, niveau `essential` / `advanced` / `hidden`, mode, condition d'affichage `when`). Libellés courts affichés : `SHORT_LABELS`, `SHORT_OPTIONS`.
- `loadEngine.ts` : charge le moteur **une seule fois** pour toute l'appli (Three.js n'est jamais chargé sur les pages Ressource).

**Composants**
- `src/components/engine/` : `EngineStage` (scène), `Slider`, `Toggle`, `Segmented`, `ColorPicker`, `ImageList`, `ImageStrip`, `imageHooks.ts`, `SceneToolbar`.
- `src/components/EditorPanel/` : `EditorPanel` (sections, « Réglage avancé »), `EngineControls` (réglages d'une section, sous-menus repliables), `useEngine` (moteur + nouveau rendu à chaque changement).
- `src/components/Toaster.tsx` : messages du moteur (`role="status"`).
- `src/app/navigation.ts` : **le modèle unique des pages** (adresse, libellé, icône, sections de l'Éditeur, `engine: 'motif' | 'illustration'`).
- `src/styles/tokens.css` : **seul endroit autorisé pour les valeurs**. Un test interdit les couleurs en dur ailleurs.
- `src/components/Icon.tsx` + `icons.registry.tsx` : icônes **VisualSystem, set Central uniquement** (ajout une par une via l'API `https://visual.systems/api/modules/icon/search?set=central&q=…`, variantes trait 1,5 et 2 téléchargées sur `…/api/modules/icon/central/<nom>.svg?variant=…`).

**Tests**
- `tests/` (Vitest) : le moteur y est remplacé par une doublure (`tests/setup.ts`) car jsdom n'a pas de WebGL. `engine-controls.test.ts` relit le prototype et compare chaque réglage de la table.
- `e2e/` (Playwright) : `engine-render.spec.ts` (rendu identique, projet `rendu-identique`), `editor-panel.spec.ts` (clavier, textes sur une ligne, aller-retour), `illustration.spec.ts` (images), `engine.spec.ts`, `visual.spec.ts` (captures de référence, macOS), `accessibility.spec.ts` (contrastes AA, focus).

## 7. Commandes utiles

```bash
npm run dev                # appli sur http://localhost:5173 (dans Claude : preview_start « brandhub-dev »)
npm test                   # tests unitaires (Vitest)
npm run test:e2e           # tests navigateur (Playwright)
npm run lint               # ESLint + Prettier
npm run build              # build de production
npm run engine:extract     # régénère le moteur depuis le prototype
npx playwright test visual --update-snapshots   # après un changement visuel VOULU (regarder l'image d'abord)
```

## 8. Ce qui a été essayé et a raté (et comment ça a été résolu)

| Problème | Cause | Solution retenue |
|---|---|---|
| Exécuter le moteur avec `new Function` non strict | Le prototype est en `"use strict"` | Module JS strict, sans `eval` |
| Rendu app ≠ prototype à 0,3–1 % | Le démarrage n'appelait pas `loadLibrary()` | Reproduire **exactement** la séquence de démarrage du prototype |
| Canvas WebGL lu tout noir | Tampon vidé après affichage | Lecture dans un `requestAnimationFrame` ; `preserveDrawingBuffer` forcé dans le test seulement |
| Rendu identique instable (surtout « Ligne », 0,13 à 0,2 %) | Le moteur **tire au hasard à chaque image** (`newLobe`) et en rangeant les images de démo (`newId`) : l'ordre des tirages dépend de la vitesse de la machine. En Ligne, le prototype comparé à lui-même varie jusqu'à 0,25 % | Projet Playwright séparé avec 2 nouveaux essais ; le hasard est remis à zéro des deux côtés avant chaque cas. **Seuil gardé à 0,1 %** (décision du porteur) ; proposition encore ouverte : 0,3 % pour Ligne seulement |
| Le comptage des réglages de la spec était faux (68 / 13 / 2) | Comptage approximatif | Vrai décompte : 67 curseurs, 6 interrupteurs, 7 sélecteurs (export compris) |
| Barre des curseurs fausse dans les sections fermées au chargement | Largeur du libellé mesurée quand la section était repliée (0) | Remesure à chaque affichage (`ResizeObserver`) + place réservée pour la valeur la plus large |
| Libellés sur 2 lignes, coupés | Panneau plus étroit que celui du prototype | Libellés courts validés par le porteur + test navigateur « aucun texte coupé » |
| `npm run engine:extract` refusait des noms existants | Le script ne reconnaissait pas `let a = …, b = …` | Vérification par le compilateur TypeScript |
| Une commande chaînée avec `&&` n'avait rien modifié | La première étape avait échoué en silence | Toujours vérifier que la modification est bien faite (`grep`) avant de tester |
| Un fichier réécrit n'avait pas été enregistré | L'outil d'écriture exige de relire le fichier juste avant | Relire, réécrire, vérifier le commit (`git show --stat`) |
| Tests unitaires bloqués quand plusieurs composants chargent le moteur | Chargements simultanés du module simulé | Un seul chargement partagé : `loadEngine.ts` |
| Page blanche dans l'onglet de prévisualisation après un renommage de fichier | Le serveur partagé gardait l'ancien nom en mémoire | `touch` des fichiers qui l'importent, puis recharger |
| L'ordre des images n'était pas retrouvé après rafraîchissement (test) | Le moteur enregistre l'ordre **600 ms** après le dernier changement | Le test attend 1 s avant de recharger |
| Erreur volontaire « non détectée » sur le retrait d'image | L'image est enregistrée en deux morceaux ; en effacer un suffit | Mutation refaite sur les deux effacements |
| Avertissement ESLint « fast refresh » | Fonctions partagées exportées depuis un fichier de composant | Fichier à part `imageHooks.ts` |
| Messages du porteur tronqués (« Voici le lien : » sans lien) | — | Le lui faire remarquer gentiment et redemander |

## 9. Points ouverts et pièges à connaître

- **Ne jamais toucher** `reference/prototype.html` ni `prototype-engine.js`. Toute adaptation se fait dans `createEngine.ts` ; pour exposer un nom du moteur : `EXPORTS` ou `SETTERS` dans le script, puis `npm run engine:extract`.
- Les actions de l'interface du prototype sont **recopiées fidèlement**, ligne d'origine en commentaire.
- **Seuil du rendu « Ligne »** : à trancher avec le porteur (proposition 0,3 %).
- **Mise en ligne (`/ship`)** : règle de réécriture Vercel pour les adresses rafraîchies ; **licence Central Icons** (commerciale) à vérifier ; brancher Upstash et Blob chez Vercel (partie `data-store`).
- **Pas d'intégration continue** sur GitHub : les seuls contrôles sont ceux lancés en local avant chaque commit. Captures de référence propres à macOS.
- Un autre serveur de dev peut tourner sur le port 5173 (autre session) : les tests Playwright le réutilisent (`reuseExistingServer`).
- **Accessibilité** : WCAG AA vérifié automatiquement. Ne pas éclaircir le texte secondaire `#724F40`.
- À simplifier plus tard (relecture) : les sections particulières d'`EditorPanel.tsx` (Couleurs, Images, Rétablir les tons) ; découper `createEngine.ts` par thème s'il grossit encore.

## 10. Prochaines étapes

**Décisions du porteur (22/10/2026, nuit)** :
- **Ordre** : Export → Ressources → Layout editor. Vercel et profil éditeur ensuite.
- **Export** : le bloc orange du Figma (Image / SVG / Vidéo / Figma, 1x à 6x, PNG / WebP / JPEG, arrière-plan transparent), recopié du prototype (lignes 3211-3440 et 4300-4400), pour Motif, Illustration puis les frames du Layout editor.
- **Ressources, contenu** : vide pour l'instant. Couleurs à zéro, logos vides, typographie en Geist. Il faut concevoir une **interface de remplissage rapide et fluide** (à proposer et faire valider).
- **Ressources, droits** : seules les personnes qui ont **le code** peuvent modifier le contenu.
- **Architecture des pages** (Figma + références) : Logo (groupes de cartes + Télécharger), Typographie (famille, fichiers, échelle), Couleur (marque, neutres, dégradés, copie du code), Iconographie (filtres + grille Central), Inspiration (mosaïque 4 colonnes). **Imagerie** : au choix de l'IA (mosaïque avec filtres). **Patterns prédéfinis** : une grille comme Inspiration, remplie de **layouts de patterns** faits dans le Layout editor, **filtrables par format**.


1. `export` (test du porteur + PR), puis `resources` (avec `/api/files` et Vercel Blob), puis `layout-editor`.
2. **Vercel** (étapes déjà données au porteur) et `editor-access`.
3. **Export** (PNG, WebP, JPEG, SVG, vidéo, Figma) : à planifier (les réglages d'export du prototype ne sont pas dans `controls.ts`).
4. **Temps 2** : `brand-settings`, `logo-variants`, `pattern-embed`.
