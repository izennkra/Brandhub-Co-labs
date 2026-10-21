# Relecture : `app-shell` (structure globale)

> Méthode : `/review` (skill `code-review-and-quality`), sur 5 axes. Branche `feature/app-shell`, 21/10/2026.
> Verdict : **approuvé** après corrections. Il reste **1 décision** à prendre (D1), non bloquante.

## Corrigé pendant la relecture

| # | Axe | Constat | Correction |
|---|---|---|---|
| R1 | Architecture | Trois listes séparées, indexées par l'adresse de la page (texte d'attente, description, sections de l'Éditeur). Un renommage oublié dans l'une d'elles aurait cassé la page sans erreur visible. | Un seul modèle par page dans `src/app/navigation.ts` (`ToolPageDef`, `ResourcePageDef`). `editorSections.ts` est supprimé. |
| R2 | Exactitude | Sur petit écran, avec le menu ouvert, la touche H repliait le panneau Éditeur caché derrière. | `src/app/ToolLayout.tsx` ignore le raccourci tant que la page est inactive. Test ajouté. |
| R3 | Tests | Erreurs introduites exprès (« mutations ») : 2 sur 6 passaient inaperçues (page mémorisée inconnue ; onglet de la section courante). | 2 tests ajoutés dans `tests/navigation.test.tsx`. Les 6 mutations sont maintenant détectées. |
| R4 | Tests | Le test de comparaison visuelle était trop tolérant : un arrondi supprimé passait inaperçu. | Tolérance resserrée (50 pixels, seuil de couleur 0,02). La même mutation est maintenant détectée (179 pixels différents). |

## À décider

**D1 — Raccourci clavier « H » (accessibilité, WCAG 2.1.4, niveau A).** Un raccourci d'une seule lettre, sans touche de modification, doit pouvoir être désactivé ou modifié : sinon, il gêne les personnes qui utilisent la commande vocale. Trois options :
- **(a) ⌥ H / Alt + H** à la place de H : le plus simple et conforme *(recommandé)* ;
- (b) H actif seulement quand le focus est dans la zone Tool ;
- (c) garder H et ajouter plus tard un réglage pour le désactiver.

## À savoir (sans action pour l'instant)

- **Mise en ligne (Vercel)** : il faudra une règle de réécriture pour que le rafraîchissement d'une adresse comme `/outils/motif` fonctionne. À faire avec `/ship`.
- **Captures de référence** : elles sont générées sur macOS (`*-darwin.png`). Si une intégration continue Linux est ajoutée, il faudra les régénérer là-bas.
- **Licence Central Icons** : à vérifier avant la mise en ligne.
- **Boutons Export et Télécharger** : volontairement inactifs (`aria-disabled`) jusqu'aux parties pattern-engine et resources.
- *Détail* : pas encore d'icône d'onglet (favicon).

## Les 5 axes

- **Exactitude** : les 10 critères de la spec sont remplis (voir ci-dessous). Les cas limites sont couverts : adresse inconnue, stockage indisponible ou corrompu, Échap, voile, focus.
- **Lisibilité** : fichiers courts (le plus long fait 69 lignes, hors registre d'icônes généré). Noms explicites, commentaires en français là où l'intention n'est pas évidente.
- **Architecture** :
  - un modèle de pages unique ;
  - des gabarits séparés (`AppLayout`, `ToolLayout`, `ResourceLayout`) ;
  - les valeurs de design uniquement dans `tokens.css` (garde-fou testé) ;
  - les icônes uniquement via `Icon.tsx` (garde-fou testé) ;
  - le moteur de patterns n'est pas touché.
- **Sécurité** :
  - aucune saisie utilisateur, aucun secret ;
  - la valeur lue dans `sessionStorage` est vérifiée par rapport aux pages connues ;
  - `npm audit` : 0 vulnérabilité ;
  - dépendances ajoutées : `react-router` et `@fontsource-variable/geist` (licence OFL).
- **Performance** : 220 ko de JS (69 ko compressés). La police est découpée par alphabet (seul le latin est chargé). Aucun calcul lourd.

## Critères de réussite de `SPEC-app-shell.md`

| # | Critère | Preuve |
|---|---|---|
| 1 | L'appli démarre sur Motif, sans erreur dans la console | `e2e/smoke.spec.ts` |
| 2 | La colonne de gauche est conforme au Figma, sans Feedback | `tests/navigation.test.tsx` + comparaison au Figma |
| 3 | Les 10 pages s'ouvrent par clic et par adresse, et restent affichées après rafraîchissement | `e2e/navigation.spec.ts` |
| 4 | Pages Tool : zone centrale + panneau Éditeur + Export inactif. Pages Ressource : titre + emplacement réservé | `tests/EditorPanel.test.tsx`, `tests/ResourceLayout.test.tsx` |
| 5 | Tableau d'harmonisation validé, tokens seuls, contrastes AA | `tests/no-hardcoded-values.test.ts`, `e2e/accessibility.spec.ts` |
| 6 | Icônes via `Icon.tsx` (Central), libellés sur les boutons sans texte | `tests/Icon.test.tsx`, `tests/no-icon-library.test.ts` |
| 7 | Clavier, focus visible, `aria-current` | `e2e/accessibility.spec.ts`, `e2e/navigation.spec.ts` |
| 8 | Repli sous 1280 px | `tests/MobileMenu.test.tsx`, `e2e/responsive.spec.ts` |
| 9 | Build, tests, tests navigateur et vérification du code au vert | Dernière vérification avant la pull request |
| 10 | Captures à 1440 px fidèles au Figma pour le cadre | `e2e/visual.spec.ts` (10 références) + comparaison côte à côte à l'échelle du Figma |
