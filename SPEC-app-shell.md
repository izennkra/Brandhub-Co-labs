# Spec : `app-shell` (structure globale)

> Statut : **à valider**. Première partie de la carte (`CAPABILITY-MAP.md`). Aucune autre partie n'en dépend avant validation.
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
  - sur les pages **Ressource**, une icône de panneau en haut à droite et un bouton orange flottant en bas à droite.

**Pages Tool** : Motif · Illustrations iconographique · Layout editor

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

1. **Bureau d'abord** (écrans d'ordinateur à partir de 1280 px de large). Sur tablette et mobile, la colonne de gauche se replie derrière un bouton, comme dans le prototype, sans design dédié pour l'instant.
2. Les adresses des pages sont en français : `/outils/motif`, `/ressources/logo`… En ouvrant l'appli, on arrive sur `/outils/motif`.
3. **Feedback** n'apparaît plus dans le Figma : on ne l'affiche pas (voir questions).
4. Le titre « COULEURS » de la page Logo dans le Figma est une coquille : la page s'appellera « Logo ».

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
| Icônes | VisualSystem Icon, **set Central**, Line, coins 2px Medium, trait 1,5 px (à confirmer) | Imposé par `CLAUDE.md` ; réglages repris de l'écran Iconographie du Figma |

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
- Noms des tokens : `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, valeurs relevées dans le Figma.

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
2. La colonne de gauche correspond au Figma : logo + BETA, sélecteur Tool / Ressource, liste des pages avec icônes, page active surlignée.
3. Les **10 pages** (3 Tool + 7 Ressource) s'ouvrent par clic et par adresse directe. Rafraîchir le navigateur garde la page.
4. Les pages Tool affichent la zone centrale et le panneau « Éditeur » repliable (avec le bouton Export, désactivé pour l'instant). Les pages Ressource affichent leur titre et un emplacement réservé.
5. Toutes les couleurs, typos et espacements viennent de `tokens.css` (vérifié par test).
6. Toutes les icônes passent par `Icon.tsx` (set Central), avec `aria-label` sur les boutons sans texte.
7. Tout se fait au clavier (Tab, Entrée), avec un contour de focus visible, et `aria-current` est posé sur la page active.
8. En dessous de 1280 px de large, la colonne de gauche se replie derrière un bouton.
9. `npm run build`, `npm test`, `npm run test:e2e` et `npm run lint` passent.
10. Une capture de chaque écran à 1440 px est fidèle au Figma pour le cadre (gauche, centre, droite).

## Questions ouvertes

1. **Feedback** n'est plus dans le Figma : on le supprime, ou on le garde comme page à venir ?
2. Pages Ressource : à quoi sert le **bouton orange en bas à droite** (exporter, partager, importer) ? Et l'**icône de panneau** en haut à droite ?
3. **Icônes** : je propose le set **Central**, style Line, coins 2px Medium, trait 1,5 px, comme dans ton écran Iconographie. C'est bien ce set ? (À vérifier aussi : la licence du set Central.)
4. **Mobile** : bureau d'abord, avec une simple version repliée sur petit écran. Ça te va pour le moment ?
5. Le libellé exact du menu : « Illustrations iconographique » ou « Illustrations » ?
