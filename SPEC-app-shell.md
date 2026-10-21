# Spec : `app-shell` (structure globale)

> Statut : **validée le 21/10/2026**. Première partie de la carte (`CAPABILITY-MAP.md`).
> Design : Figma, page « Brand hub co labs » (`2337:6322`).

## Objectif

Poser la **coquille de l'application** : la vraie appli React qui remplace le fichier HTML unique, avec la navigation, la mise en page commune à tous les écrans, les couleurs et typos du Figma et le composant d'icônes.

À la fin de cette partie, on peut naviguer dans tous les écrans de l'outil. Ce qu'ils contiennent (moteur, ressources, layout editor) arrive dans les parties suivantes. En attendant, chaque écran affiche un emplacement clairement marqué.

**Pour qui :** l'équipe Co-labs et le client, qui consultent l'outil et s'en servent ; l'éditeur, qui le remplit (accès protégé dans `editor-access`).

## Ce que montre le Figma (8 écrans)

**Commun à tous les écrans**
- **Colonne de gauche** : logo co-labs + badge BETA, puis un sélecteur à deux onglets **Tool / Ressource**, puis la liste des pages de l'onglet choisi.
- **Zone centrale** : une grande carte aux coins arrondis.
- Colonne de droite :
  - sur les pages **Tool**, un panneau **« Éditeur »** repliable, fait de sections en accordéon (Préréglages partagés, Réseau, Volume, Pastilles, Survol, Rotation, Couleurs…), avec un bouton orange **Export** en bas ;
  - sur les pages **Ressource**, une icône de panneau en haut à droite et un bouton orange flottant en bas à droite, qui sert à **télécharger / exporter** le contenu de la page (validé ; le contenu exact du téléchargement est défini dans `resources`).

**Pages Tool** : Motif · Illustration · Layout editor

**Pages Ressource**
- Logo (maquettée)
- Typographie (référence d'une autre marque, à redessiner)
- Couleur (idem, à redessiner)
- Iconographie (maquettée : navigateur d'icônes)
- Imagerie (pas de maquette)
- Patterne prédéfinie (pas de maquette)
- Inspiration (maquettée : mosaïque d'images)

Le design de l'intérieur des pages Ressource et Tool n'est **pas** dans cette partie. Ici, on construit seulement le cadre autour.

## Hypothèses

1. **Ordinateur d'abord** (validé) : écrans à partir de 1280 px de large. Sur tablette et mobile, la colonne de gauche se replie derrière un bouton, comme dans le prototype, sans design dédié pour l'instant.
2. Les adresses des pages sont en français : `/outils/motif`, `/ressources/logo`… En ouvrant l'appli, on arrive sur `/outils/motif`.
3. **Feedback est supprimé** (validé), comme dans le Figma.
4. Le titre « COULEURS » de la page Logo dans le Figma est une coquille : la page s'appellera « Logo ».
5. Les libellés du menu reprennent ceux du Figma, corrigés pour l'orthographe (« Patterns prédéfinis »). « Illustrations iconographique » est renommé **« Illustration »** (demande du 21/10/2026).

## Tech stack

| Élément | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript | Erreurs détectées avant d'ouvrir l'appli |
| Interface | React 19 | Validé dans la carte |
| Outil de build | Vite | Simple et rapide ; le moteur 3D tourne entièrement dans le navigateur, sans besoin d'un serveur de rendu |
| Navigation | React Router | Une adresse par page, le rafraîchissement garde la page |
| Hébergement | Vercel (fonctions `api/` pour le stockage, plus tard) | Le prototype y est déjà relié (`/api/store`) |
| Tests | Vitest + Testing Library (unitaires), Playwright (parcours dans le navigateur) | Standards, rapides |
| Qualité | ESLint + Prettier | Code homogène |
| Icônes | VisualSystem Icon, **set Central**, Line, coins 2px Medium, trait de base 1,5 px (validé). Taille et épaisseur du trait adaptées selon l'endroit, via une échelle fixe (voir Harmonisation) | Imposé par `CLAUDE.md` ; réglages repris de l'écran Iconographie du Figma |

Aucune autre dépendance sans validation.

## Commandes

```
Installer :           npm install
Lancer en local :     npm run dev        → http://localhost:5173
Construire :          npm run build
Tests unitaires :     npm test
Tests navigateur :    npm run test:e2e
Vérifier le code :    npm run lint
```

## Structure du projet

```
src/
  main.tsx                 → point d'entrée
  app/
    router.tsx             → liste des pages et de leurs adresses
    AppLayout.tsx          → cadre commun : colonne gauche + zone centrale + panneau droit
  components/
    Icon.tsx               → LE composant d'icônes (set Central uniquement)
    Sidebar/               → logo, sélecteur Tool/Ressource, liste des pages
    EditorPanel/           → panneau droit « Éditeur » repliable + sections accordéon
    Placeholder.tsx        → emplacement « TODO : design à venir » / « arrive dans <partie> »
  pages/
    tool/                  → Motif, Illustrations, LayoutEditor (vides pour l'instant)
    resources/             → Logo, Typographie, Couleur, Iconographie, Imagerie, Patterns, Inspiration (vides)
  styles/
    tokens.css             → TOUTES les couleurs, typos, tailles, espacements, arrondis (un seul fichier)
    global.css
  lib/
    pattern-engine/        → réservé au moteur (partie suivante), vide ici
tests/                     → tests unitaires
e2e/                       → tests navigateur (Playwright)
reference/                 → prototype et références (ne pas modifier)
```

## Style de code

```tsx
// Un composant = un fichier, nom en PascalCase. Textes de l'interface en français.
// Aucune couleur écrite en dur : uniquement les variables de tokens.css.
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../Icon';
import styles from './NavItem.module.css';

type NavItemProps = { to: string; label: string; icon: IconName };

export function NavItem({ to, label, icon }: NavItemProps) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? styles.active : styles.item)}>
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </NavLink>
  );
}
```

```css
/* NavItem.module.css */
.item { color: var(--color-text-muted); border-radius: var(--radius-sm); }
.active { color: var(--color-text); background: var(--color-surface-active); }
```

- Styles : CSS Modules (`*.module.css`) + variables de `tokens.css`. Pas de librairie de composants externe.
- Noms des tokens : `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`.

## Harmonisation du design system

Les espacements et tailles de typo du Figma ne sont pas parfaitement réguliers. On ne les recopie pas au pixel près : on les **ramène à des échelles cohérentes**. Le Figma reste la référence pour l'intention visuelle (hiérarchie, ambiance, composants).

**Méthode**
1. Relever dans le Figma toutes les valeurs utilisées : espacements, tailles de texte, interlignages, graisses, arrondis, couleurs.
2. Les regrouper et les ramener aux échelles ci-dessous (chaque valeur va à l'échelon le plus proche).
3. Livrer un tableau **« valeur Figma → valeur retenue »** à valider **avant** d'écrire `tokens.css`.
4. Ensuite, n'utiliser que ces tokens : aucune valeur « à la main » dans le code.

**Échelles proposées (ajustées après le relevé)**

| Famille | Règle |
|---|---|
| Espacements | Grille de 4 px : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 |
| Tailles de texte | 6 à 8 tailles maximum, pas de taille en dessous de 12 px pour du texte à lire |
| Interlignage | Un interlignage associé à chaque taille (≈ 1,4 pour le courant, ≈ 1,1 pour les grands titres) |
| Graisses | 2 ou 3 graisses maximum |
| Arrondis | 3 ou 4 valeurs maximum (petit, moyen, grand, pilule) |
| Icônes | 3 ou 4 tailles liées à l'usage, chacune avec son épaisseur de trait, pour garder le même poids visuel partout. Ordre d'idée : 16 px dans les listes et contrôles denses, 20 px dans les boutons, 24 px seules, 32 px et plus pour l'affichage. Valeurs exactes dans le tableau à valider. On appelle `<Icon size="sm">`, jamais une taille en pixels |
| Couleurs | Palette du Figma, nommée par rôle (texte, texte secondaire, fond, surface, accent…) |

**Règles UX/UI à respecter**
- Contrastes WCAG AA : 4,5:1 pour le texte courant, 3:1 pour les grands textes et les icônes utiles. Certains textes gris clair du Figma (champs, libellés) devront peut-être être foncés : ce sera signalé dans le tableau.
- Zones cliquables d'au moins 24 × 24 px.
- Mêmes composants pour les mêmes usages : un seul style de bouton, de champ, de curseur, de section accordéon.
- Alignements sur la grille et marges régulières entre colonnes, sections et cartes.
- États visibles : survol, focus clavier, actif, désactivé.

## Stratégie de test

| Niveau | Outil | Ce qu'on vérifie |
|---|---|---|
| Unitaires | Vitest + Testing Library | `Icon` (nom inconnu → erreur, `aria-hidden` par défaut, `role="img"` avec un libellé) ; la page active est marquée dans la navigation ; le panneau Éditeur s'ouvre et se ferme |
| Navigateur | Playwright | Parcours : ouvrir l'appli, passer de Tool à Ressource, ouvrir chaque page par clic **et** par adresse directe, rafraîchir ; captures d'écran à 1440 px comparées aux écrans Figma |
| Garde-fous | Test automatique | Aucune couleur hexadécimale hors de `tokens.css` ; aucune librairie d'icônes autre que VisualSystem dans `package.json` |

Les tests passent avant chaque commit.

## Limites

**Toujours**
- Prendre les valeurs (couleurs, typos, tailles) dans le Figma, via le MCP Figma, et les centraliser dans `tokens.css`.
- Utiliser uniquement `Icon.tsx`, en ajoutant les icônes une par une depuis l'API VisualSystem.
- Garder les textes de l'interface en français, en reprenant ceux du Figma.
- Travailler sur une branche, faire un commit par étape qui fonctionne.

**Demander d'abord**
- Ajouter une dépendance qui n'est pas listée ci-dessus.
- Toute configuration Vercel ou mise en ligne.
- Tout élément d'interface absent du Figma.

**Jamais**
- Modifier `reference/prototype.html`, ni le code du moteur.
- Ajouter une autre librairie d'icônes ou dessiner une icône à la main.
- Committer un mot de passe ou une clé.
- Pousser directement sur `main`.

## Critères de réussite

1. `npm run dev` ouvre l'appli sur la page Motif, sans erreur dans la console.
2. La colonne de gauche correspond au Figma : logo + BETA, sélecteur Tool / Ressource, liste des pages avec icônes, page active surlignée. Pas d'entrée Feedback.
3. Les **10 pages** (3 Tool + 7 Ressource) s'ouvrent par clic et par adresse directe. Rafraîchir le navigateur garde la page.
4. Les pages Tool affichent la zone centrale et le panneau « Éditeur » repliable (avec le bouton Export, désactivé pour l'instant). Les pages Ressource affichent leur titre et un emplacement réservé.
5. Le tableau d'harmonisation « valeur Figma → valeur retenue » est validé. Toutes les couleurs, typos et espacements viennent ensuite de `tokens.css` (vérifié par test), et les contrastes respectent WCAG AA.
6. Toutes les icônes passent par `Icon.tsx` (set Central), avec `aria-label` sur les boutons sans texte.
7. Tout se fait au clavier (Tab, Entrée), avec un contour de focus visible, et `aria-current` est posé sur la page active.
8. En dessous de 1280 px de large, la colonne de gauche se replie derrière un bouton.
9. `npm run build`, `npm test`, `npm run test:e2e` et `npm run lint` passent.
10. Une capture de chaque écran à 1440 px est fidèle au Figma pour le cadre (gauche, centre, droite), aux harmonisations validées près.

## Décisions (21/10/2026)

- Feedback : supprimé.
- Bouton orange des pages Ressource : télécharger / exporter.
- Icônes : Central, Line, coins 2px Medium. Taille et trait adaptés selon l'endroit, avec une échelle cohérente.
- Ordinateur d'abord.

## Questions ouvertes (non bloquantes)

1. L'**icône de panneau** en haut à droite des pages Ressource : sans précision, elle ouvrira un panneau latéral vide, que `resources` remplira (par exemple avec les outils du mode éditeur).
2. La **licence** du set Central est à vérifier avant la mise en ligne.
