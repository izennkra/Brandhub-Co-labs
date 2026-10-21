# Tâches : `pattern-engine`

> Plan : `tasks/plan.md` · Spec : `SPEC-pattern-engine.md`
> Chaque tâche se termine par : tous les contrôles au vert (vérification du code, tests, build, tests navigateur lancés 2 fois), puis un commit. Pas de commit si un contrôle échoue.

## Phase 1 : le moteur à l'identique

- [ ] **Tâche 1 : extraire le bloc moteur et prouver qu'il est identique**
  - Description : `scripts/extract-engine.mjs` copie les lignes du moteur (de « Palette et associations » jusqu'à la fin de `renderLayerTo`) dans `src/lib/pattern-engine/prototype-engine.js`, avec un en-tête « généré, ne pas modifier ». Le script liste aussi les noms que le bloc utilise sans les définir (analyse avec le compilateur TypeScript).
  - Acceptation :
    - [ ] Le test d'identité passe et échoue si on change un seul caractère du fichier généré
    - [ ] L'empreinte SHA-256 du bloc est notée dans `SPEC-pattern-engine.md`
    - [ ] La liste des noms à fournir est enregistrée (`src/lib/pattern-engine/required-globals.json`)
  - Vérification : `npm run engine:extract && npm test`
  - Fichiers : `scripts/extract-engine.mjs`, `src/lib/pattern-engine/prototype-engine.js`, `src/lib/pattern-engine/required-globals.json`, `tests/engine-identity.test.ts`, `package.json`
  - Taille : S

- [ ] **Tâche 2 : couche d'adaptation, le motif s'affiche dans Motif**
  - Description : ajouter `three@0.128.0`. `createEngine.ts` fournit les noms attendus (THREE, canvas, `#labels`, éléments cachés, `toast`, `syncers`, `requestAnimationFrame` contrôlé), exécute le bloc en mode non strict, lance l'initialisation du prototype et expose l'API. `EngineStage` affiche le canvas dans la zone centrale de Motif. Le moteur est chargé à la demande.
  - Acceptation :
    - [ ] `/outils/motif` affiche le motif d'ouverture du prototype, animé, sans erreur dans la console
    - [ ] Rotation (glisser), zoom (molette), double-clic et survol fonctionnent
    - [ ] Un test vérifie que chaque nom de `required-globals.json` est fourni
  - Vérification : `npm test && npm run test:e2e`, puis contrôle visuel
  - Fichiers : `package.json`, `src/lib/pattern-engine/createEngine.ts`, `src/components/engine/EngineStage.tsx` (+ css), `src/pages/tool/ToolPage.tsx`, `tests/engine-adapter.test.ts`
  - Taille : M

- [ ] **Tâche 3 : test « rendu identique au prototype » (Motif)**
  - Description : `e2e/engine-render.spec.ts` ouvre le prototype et l'appli avec la même graine de hasard et une horloge figée, à la même taille, puis compare les pixels du canvas. Cas testés : Quantique › Membrane, Quantique › Ligne, Aérée.
  - Acceptation :
    - [ ] Les 3 cas passent avec au plus 0,1 % de pixels différents
    - [ ] Le test échoue si on change volontairement un réglage d'un côté seulement
  - Vérification : `npm run test:e2e -- engine-render --repeat-each=3`
  - Fichiers : `e2e/engine-render.spec.ts`, éventuellement une petite aide de test dans `createEngine.ts`
  - Taille : M

### ✅ Point de contrôle A
- [ ] Tu vois le motif tourner dans l'appli (`/outils/motif`)
- [ ] Le rendu identique au prototype est prouvé par le test

## Phase 2 : les réglages du Motif

- [ ] **Tâche 4 : table des réglages reprise du prototype**
  - Description : `controls.ts` liste chaque réglage : clé dans `S`, libellé, bornes, pas, format, effet, section, niveau (essentiel ou avancé) et mode (Motif, Illustration ou les deux). Un test compare la table aux appels `slider/toggle/seg` du prototype.
  - Acceptation :
    - [ ] Les 68 curseurs, 13 interrupteurs et 2 sélecteurs sont présents, avec les bornes et les pas du prototype
    - [ ] Chaque clé existe dans `S`. Les réglages du Figma sont « essentiels »
  - Vérification : `npm test`
  - Fichiers : `src/lib/pattern-engine/controls.ts`, `tests/engine-controls.test.ts`
  - Taille : M

- [ ] **Tâche 5 : composants de contrôle (style Figma)**
  - Description : `Slider` (barre remplie, libellé à gauche, valeur à droite, `input type="range"` accessible), `Segmented` et `Toggle`, avec les tokens.
  - Acceptation :
    - [ ] Clavier : flèches, Début et Fin sur le curseur ; Espace sur l'interrupteur ; valeur annoncée
    - [ ] Rendu conforme aux contrôles du Figma, contrastes AA
  - Vérification : `npm test`, contrôle visuel face au Figma
  - Fichiers : `src/components/engine/Slider.tsx`, `Segmented.tsx`, `Toggle.tsx` (+ css), `tests/controls-components.test.tsx`
  - Taille : M

- [ ] **Tâche 6 : panneau Motif branché**
  - Description : les sections de l'Éditeur Motif affichent leurs réglages essentiels. L'interrupteur « Réglage avancé » (mémorisé) ajoute les autres, dont le tracé de ligne et l'infographie. Chaque changement passe par l'API (effet identique au prototype : régénérer, recolorer…).
  - Acceptation :
    - [ ] Bouger un réglage change `S` et le rendu (Membrane / Ligne, Renflements, Taille…)
    - [ ] « Réglage avancé » affiche ou masque les bons réglages
  - Vérification : `npm test && npm run test:e2e`
  - Fichiers : `src/components/EditorPanel/*`, `src/app/navigation.ts`, `src/lib/pattern-engine/createEngine.ts`, `tests/EditorPanel.test.tsx`
  - Taille : M

- [ ] **Tâche 7 : section Couleurs**
  - Description : d'abord une maquette de la section, reprenant les choix du prototype (fond, couleurs des pastilles, couleur de la ligne) dans le style du panneau, **montrée pour validation**. Ensuite le code.
  - Acceptation :
    - [ ] Maquette validée par toi
    - [ ] Les couleurs changent le rendu comme dans le prototype ; contrastes et clavier OK
  - Vérification : `npm test && npm run test:e2e`
  - Fichiers : `src/components/engine/ColorPicker.tsx` (+ css), `tests/ColorPicker.test.tsx`
  - Taille : M

### ✅ Point de contrôle B
- [ ] Tu règles le motif depuis le panneau Éditeur

## Phase 3 : l'Illustration

- [ ] **Tâche 8 : bascule Motif ↔ Illustration**
  - Description : passer d'une page à l'autre bascule le moteur de mode, en gardant les réglages de chaque mode (logique `setApp` du prototype reprise dans la couche). Le test de rendu identique est étendu à l'Illustration.
  - Acceptation :
    - [ ] `/outils/illustration` affiche les images de démo en pastilles, identiques au prototype
    - [ ] Aller et retour Motif ↔ Illustration : les réglages de chacun sont conservés
  - Vérification : `npm run test:e2e -- engine-render --repeat-each=3`
  - Fichiers : `src/lib/pattern-engine/createEngine.ts`, `src/pages/tool/ToolPage.tsx`, `e2e/engine-render.spec.ts`
  - Taille : M

- [ ] **Tâche 9 : images de l'Illustration**
  - Description : section « Images » (liste, glisser pour réordonner, croix pour retirer, image choisie encadrée) et bandeau de vignettes sous la scène, avec « + » pour ajouter. Les images ajoutées sont conservées dans le navigateur.
  - Acceptation :
    - [ ] Ajout, choix, retrait et ordre fonctionnent, à la souris et au clavier
    - [ ] Les images ajoutées restent après un rafraîchissement
  - Vérification : `npm test && npm run test:e2e`
  - Fichiers : `src/components/engine/ImageList.tsx`, `ImageStrip.tsx` (+ css), `tests/images.test.tsx`, `e2e/illustration.spec.ts`
  - Taille : M

- [ ] **Tâche 10 : panneau Illustration branché**
  - Description : sections Animation, Lumière et tons de l'image, Pastilles, Survol, Rotation et Couleurs, depuis la table des réglages (filtrée sur le mode Illustration).
  - Acceptation :
    - [ ] Chaque réglage agit sur l'Illustration comme dans le prototype
  - Vérification : `npm test && npm run test:e2e`
  - Fichiers : `src/app/navigation.ts`, `src/components/EditorPanel/*`, `tests/EditorPanel.test.tsx`
  - Taille : S

### ✅ Point de contrôle C
- [ ] Tu testes l'Illustration : images, réglages, aller-retour avec Motif

## Phase 4 : finitions

- [ ] **Tâche 11 : barre de scène, notifications et ⌥ H**
  - Description : barre d'icônes en haut à gauche de la scène (lecture/pause, nouvelle forme / rejouer avec la touche R), notifications du moteur dans une zone annoncée (`aria-live`), et raccourci ⌥ H / Alt + H à la place de H.
  - Acceptation :
    - [ ] Lecture/pause et nouvelle forme fonctionnent au clic et au clavier
    - [ ] ⌥ H replie l'Éditeur ; H seul ne fait rien
  - Vérification : `npm test && npm run test:e2e`
  - Fichiers : `src/components/engine/SceneToolbar.tsx` (+ css), `src/components/Toaster.tsx`, `src/app/ToolLayout.tsx`, tests associés
  - Taille : M

- [ ] **Tâche 12 : performance, accessibilité, références et relecture**
  - Description : vérifier que Three.js n'est pas chargé sur les pages Ressource et que la boucle s'arrête hors des pages Tool ; étendre les tests de contraste et de focus aux nouveaux contrôles ; mettre à jour les rendus de référence ; faire la relecture `/review` ; proposer la pull request.
  - Acceptation :
    - [ ] Les 10 critères de `SPEC-pattern-engine.md` sont remplis
    - [ ] La relecture ne laisse aucun problème important ouvert
  - Vérification : tous les contrôles, tests navigateur lancés 2 fois
  - Fichiers : `e2e/*.spec.ts`, captures de référence, `docs/review-pattern-engine.md`
  - Taille : M

### ✅ Point de contrôle final
- [ ] Les 10 critères de réussite sont remplis
- [ ] La branche est poussée et la pull request est proposée
