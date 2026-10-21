# Relecture : `pattern-engine` (moteur de motifs)

> 21/10/2026 · branche `feature/pattern-engine` · 16 commits depuis `main`, 67 fichiers.
> Spec : `SPEC-pattern-engine.md` · Plan : `tasks/plan.md`.

## Verdict

**Prêt pour la pull request.** Aucun problème bloquant. Un point de fiabilité des tests reste ouvert (rendu identique « Ligne »), et deux simplifications sont proposées pour plus tard.

## Critères de réussite de la spec

| # | Critère | État | Preuve |
|---|---|---|---|
| 1 | Motif à l'ouverture, animé ; rotation, zoom, double-clic, survol | ✅ | `e2e/engine.spec.ts`, rendu identique |
| 2 | Illustration : images de démo, liste et bandeau | ✅ | `e2e/illustration.spec.ts`, rendu identique |
| 3 | Bloc moteur identique, modifiable seulement par extraction | ✅ | `tests/engine-identity.test.ts` (SHA-256 inchangé depuis la tâche 1) |
| 4 | Rendu identique (3 cas Motif + Illustration) | ✅ ⚠️ | `e2e/engine-render.spec.ts` ; voir le point ouvert ci-dessous |
| 5 | Tous les réglages accessibles, Figma par défaut, le reste en avancé | ✅ | `tests/engine-controls.test.ts` (table comparée au prototype), `tests/EditorPanel.test.tsx` |
| 6 | Contrôles conformes au Figma, clavier, contrastes AA | ✅ | `e2e/accessibility.spec.ts`, `e2e/editor-panel.spec.ts` (textes sur une ligne, barres justes) |
| 7 | Images : ajout, choix, retrait, ordre, conservées | ✅ | `e2e/illustration.spec.ts` |
| 8 | Pages Ressource sans Three.js ; moteur en pause hors Tool | ✅ | `e2e/engine.spec.ts` (aucune requête du moteur), `tests/engine-adapter.test.ts` (pause) |
| 9 | ⌥ H replie l'Éditeur ; H seul ne fait rien | ✅ | `tests/SceneToolbar.test.tsx`, `e2e/editor-panel.spec.ts` |
| 10 | Build, tests, tests navigateur, vérification du code au vert | ✅ | porte de qualité de chaque commit |

## Les 5 axes

### 1. Exactitude
- Le moteur n'est jamais modifié : toutes les actions de l'interface du prototype (`setStructure`, `setApp`, images, couleurs, tons…) sont **recopiées** dans `createEngine.ts`, avec leur ligne d'origine en commentaire.
- Chaque test a été vérifié par au moins une erreur volontaire (mutation) qui le fait échouer.
- **Point ouvert** : le cas « Ligne » du rendu identique échoue parfois (0,13 à 0,2 %). Cause trouvée pendant la relecture : le moteur tire au hasard à chaque image (renflements) et en rangeant les images de démo, et l'ordre de ces tirages dépend de la vitesse de la machine. Le test remet maintenant le hasard à zéro des deux côtés juste avant chaque cas, ce qui stabilise les autres cas. En Ligne, **le prototype comparé à lui-même** varie jusqu'à 0,25 % : un seuil de 0,1 % y restera fragile. Seuil gardé (décision du porteur) ; on relance en cas d'échec.

### 2. Lisibilité
- Une seule table des réglages (`controls.ts`) : libellés courts, conditions d'affichage et niveau (essentiel, avancé, masqué) au même endroit.
- Commentaires en français, qui disent pourquoi.
- **À simplifier plus tard** : `EditorPanel.tsx` gère trois sections particulières (Couleurs, Images, « Rétablir les tons »). Un petit registre « section → contenu » le rendrait plus simple quand d'autres sections arriveront (Préréglages).

### 3. Architecture
- Le moteur est isolé dans `src/lib/pattern-engine/` : module généré (jamais modifié à la main), couche d'adaptation (`createEngine.ts`), table (`controls.ts`), chargement unique (`loadEngine.ts`).
- Le script d'extraction vérifie maintenant les noms exposés avec le compilateur TypeScript (il gère `let a = …, b = …`).
- **À surveiller** : `createEngine.ts` atteint 416 lignes. Si les préréglages et l'export y arrivent, séparer les actions par thème (Motif, Illustration, couleurs).

### 4. Sécurité
- Aucun `innerHTML`, `eval` ni `new Function` dans le code de l'appli (le test seul évalue les formats du prototype).
- Les images importées sont lues par le moteur du prototype (`image/*` seulement) et restent dans le navigateur.
- Le stockage du navigateur est toujours protégé par `try / catch`.

### 5. Performance
- Three.js et le moteur forment un paquet à part (776 ko, 255 ko compressés), chargé seulement sur les pages Tool. Le paquet principal fait 393 ko (122 ko compressés).
- Le panneau se redessine à chaque changement de réglage : sans effet perceptible pour une quarantaine de contrôles.
- Pendant les tests de rendu, l'onglet de prévisualisation ouvert fait tourner le moteur et occupe la carte graphique : le fermer, ou le mettre sur une page Ressource.

## Corrigé pendant la relecture
- La barre de scène était annoncée comme « barre d'outils » (rôle qui promet une navigation aux flèches) : passée en simple groupe de boutons.

## Suites proposées
1. Décider du seuil du cas « Ligne » (proposition : 0,3 %, juste au-dessus de la variation du prototype lui-même).
2. Registre des sections particulières du panneau.
3. Avant la mise en ligne (`/ship`) : licence Central Icons, règle de réécriture Vercel.
