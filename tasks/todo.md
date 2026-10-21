# Tâches : `app-shell`

> Plan : `tasks/plan.md` · Spec : `SPEC-app-shell.md`
> Chaque tâche se termine par : tests verts, build OK, commit clair sur la branche de la partie.

## Phase 1 : fondations

- [x] **Tâche 1 : projet de base qui démarre**
  - Description : créer l'application Vite + React + TypeScript avec les commandes de la spec (`dev`, `build`, `test`, `test:e2e`, `lint`) et une page d'accueil minimale.
  - Acceptation :
    - [x] `npm run dev` affiche la page dans le navigateur, sans erreur dans la console
    - [x] `npm test` exécute un premier test unitaire qui passe
    - [x] `npm run test:e2e` exécute un premier parcours Playwright qui passe
  - Vérification : `npm run build && npm test && npm run test:e2e && npm run lint`
  - Dépend de : aucune
  - Fichiers : `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `src/main.tsx`, `e2e/smoke.spec.ts`
  - Taille : M

- [x] **Tâche 2 : relevé et harmonisation des valeurs du Figma**
  - Description : avec le MCP Figma, relever espacements, tailles de texte, interlignages, graisses, polices, arrondis, couleurs et tailles d'icônes des 8 écrans. Les ramener aux échelles de la spec et vérifier les contrastes. **Aucun code d'interface.**
  - Acceptation :
    - [x] `docs/design-tokens.md` contient le tableau « valeur Figma → valeur retenue » pour chaque famille
    - [x] Chaque couleur de texte a son ratio de contraste ; ceux sous WCAG AA sont signalés avec une proposition
    - [x] Les polices sont identifiées, avec leur source et leur licence d'usage web
  - Vérification : relecture par toi
  - Dépend de : 1
  - Fichiers : `docs/design-tokens.md`
  - Taille : S

### ✅ Point de contrôle A
- [x] Tu as validé le tableau d'harmonisation (ou demandé des ajustements)

- [x] **Tâche 3 : fichier de tokens, polices et garde-fou**
  - Description : traduire le tableau validé en variables dans `src/styles/tokens.css`, charger les polices, poser les styles de base. Ajouter un test qui échoue si une couleur en dur apparaît ailleurs.
  - Acceptation :
    - [x] Toutes les valeurs du tableau existent dans `tokens.css`, nommées par rôle
    - [x] Le test « pas de couleur hexadécimale hors de `tokens.css` » passe et échoue si on en ajoute une
  - Vérification : `npm test && npm run build`
  - Dépend de : 2
  - Fichiers : `src/styles/tokens.css`, `src/styles/global.css`, `index.html`, `tests/no-hardcoded-values.test.ts`
  - Taille : S

- [x] **Tâche 4 : composant `Icon.tsx` et premières icônes**
  - Description : relever dans le catalogue VisualSystem l'ID exact de la variante Central Line, coins 2px Medium. Créer `Icon.tsx` d'après l'exemple officiel, avec une échelle de tailles (`sm`, `md`, `lg`…) qui fixe aussi le trait. Ajouter une par une les icônes de la navigation et du cadre.
  - Acceptation :
    - [x] L'ID de variante et l'échelle sont notés dans `CLAUDE.md`
    - [x] Un nom d'icône inconnu provoque une erreur ; une icône seule est `aria-hidden` ; avec un libellé, elle a `role="img"`
    - [x] Le test « aucune librairie d'icônes dans `package.json` » passe
  - Vérification : `npm test`, puis contrôle visuel des icônes à côté de l'écran Figma
  - Dépend de : 2
  - Fichiers : `src/components/Icon.tsx`, `src/components/icons.registry.tsx`, `tests/Icon.test.tsx`, `CLAUDE.md`
  - Taille : M

## Phase 2 : navigation

- [ ] **Tâche 5 : colonne de gauche et pages Tool**
  - Description : `AppLayout` + `Sidebar` (logo co-labs, badge BETA, liste des pages) et les 3 pages Tool (Motif, Illustrations iconographique, Layout editor) avec un emplacement réservé. L'accueil redirige vers Motif.
  - Acceptation :
    - [ ] Les 3 pages s'ouvrent par clic et par adresse directe, et le rafraîchissement garde la page
    - [ ] La page active est surlignée et porte `aria-current="page"`
  - Vérification : `npm test && npm run test:e2e`
  - Dépend de : 3, 4
  - Fichiers : `src/app/router.tsx`, `src/app/AppLayout.tsx`, `src/components/Sidebar/*`, `src/pages/tool/*`, `e2e/navigation.spec.ts`
  - Taille : M

- [ ] **Tâche 6 : sélecteur Tool / Ressource et pages Ressource**
  - Description : sélecteur à deux onglets dans la colonne de gauche ; les 7 pages Ressource (Logo, Typographie, Couleur, Iconographie, Imagerie, Patterne prédéfinie, Inspiration) avec leur titre et un emplacement réservé. On revient sur la dernière page visitée dans chaque section.
  - Acceptation :
    - [ ] Le sélecteur bascule la liste des pages, et l'onglet actif suit l'adresse
    - [ ] Les 7 pages s'ouvrent par clic et par adresse directe ; le rafraîchissement garde la page
    - [ ] Pas d'entrée Feedback
  - Vérification : `npm test && npm run test:e2e`
  - Dépend de : 5
  - Fichiers : `src/components/Sidebar/ModeSwitch.tsx`, `src/pages/resources/*`, `src/app/router.tsx`, `e2e/navigation.spec.ts`
  - Taille : M

### ✅ Point de contrôle B
- [ ] Tous les tests passent, le build est OK
- [ ] Tu as testé la navigation sur ton ordinateur (`npm run dev`) et validé le rendu

## Phase 3 : panneaux et finitions

- [ ] **Tâche 7 : panneau « Éditeur » des pages Tool**
  - Description : panneau droit repliable (bouton « Éditeur », raccourci H comme le prototype), composant de section en accordéon réutilisable et bouton Export (désactivé pour l'instant).
  - Acceptation :
    - [ ] Le panneau s'ouvre et se ferme au clic et au clavier ; la zone centrale s'élargit quand il est fermé
    - [ ] Les sections s'ouvrent et se ferment, avec `aria-expanded` à jour
  - Vérification : `npm test && npm run test:e2e`
  - Dépend de : 6
  - Fichiers : `src/components/EditorPanel/*`, `src/app/ToolLayout.tsx`, `tests/EditorPanel.test.tsx`
  - Taille : M

- [ ] **Tâche 8 : habillage des pages Ressource**
  - Description : `ResourceLayout` avec l'icône de panneau en haut à droite (ouvre un panneau latéral vide pour l'instant) et le bouton orange flottant « Télécharger » (désactivé pour l'instant, avec une infobulle).
  - Acceptation :
    - [ ] Les deux boutons ont un libellé accessible et un focus visible
    - [ ] Le panneau latéral s'ouvre et se ferme
  - Vérification : `npm test && npm run test:e2e`
  - Dépend de : 6
  - Fichiers : `src/app/ResourceLayout.tsx`, `src/components/SidePanel/*`, `tests/ResourceLayout.test.tsx`
  - Taille : S

- [ ] **Tâche 9 : petits écrans, clavier et accessibilité**
  - Description : sous 1280 px, la colonne de gauche se replie derrière un bouton. Vérifier le parcours complet au clavier, les états de focus, de survol et de désactivation, et les contrastes.
  - Acceptation :
    - [ ] Sous 1280 px, la colonne se replie et se rouvre ; le contenu reste utilisable
    - [ ] Tout le parcours se fait au clavier, avec un focus visible partout
  - Vérification : `npm run test:e2e` (scénarios en 1440 px et en 1024 px)
  - Dépend de : 7, 8
  - Fichiers : `src/components/Sidebar/*`, `src/styles/global.css`, `e2e/responsive.spec.ts`
  - Taille : S

- [ ] **Tâche 10 : comparaison avec le Figma et relecture**
  - Description : capturer les 10 pages à 1440 px avec Playwright, les comparer aux écrans Figma pour le cadre, corriger les écarts, puis faire une relecture complète (`/review`).
  - Acceptation :
    - [ ] Les captures de référence sont enregistrées et le test de comparaison passe
    - [ ] La relecture ne laisse aucun problème important ouvert
  - Vérification : `npm run build && npm test && npm run test:e2e && npm run lint`
  - Dépend de : 9
  - Fichiers : `e2e/visual.spec.ts`, captures de référence, petites corrections de styles
  - Taille : M

### ✅ Point de contrôle final
- [ ] Les 10 critères de réussite de `SPEC-app-shell.md` sont remplis
- [ ] La branche est poussée sur GitHub et la pull request est proposée
