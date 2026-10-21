# Harmonisation du design system : tableau à valider

> Statut : **à valider (point de contrôle A)**. Tâche 2 de `tasks/todo.md`.
> Source : Figma « Brand hub co labs », écrans Tool / Motif, Tool / Illustrations, Tool / Layout editor, Ressource / Logo et Ressource / Inspiration. Relevé fait avec le MCP Figma le 21/10/2026.
> Ce tableau ne contient aucun code. Une fois validé, il devient `src/styles/tokens.css` (tâche 3).

## 0. Le constat principal : le Figma est dessiné « en grand »

Les valeurs du Figma ne tombent pas juste :
- texte d'interface en 20,16 px ;
- badge en 15,443 px ;
- marges de 7,66 px ;
- arrondis de 3,064 px.

C'est le signe que la maquette a été agrandie. Le rapport le plus cohérent est **× 1,44** : 20,16 px = 14 px × 1,44.

**Proposition :** prendre comme base un **texte d'interface de 14 px**. Chaque valeur du Figma est divisée par 1,44, puis ramenée à l'échelon le plus proche des échelles ci-dessous.

> Option B, si tu préfères une interface plus dense comme le prototype actuel : base 13 px (Figma ÷ 1,55). Je recommande 14 px pour la lisibilité.

## 1. Typographie

**Police : Geist** (seule police du Figma).
- Licence SIL Open Font License : libre, y compris pour un usage commercial sur le web.
- Chargement proposé : le paquet `@fontsource-variable/geist`, qui héberge la police avec l'appli, sans appel à Google. **C'est une nouvelle dépendance : à valider.**

| Usage | Figma | ÷ 1,44 | **Retenu** | Interligne | Graisse | Approche |
|---|---|---|---|---|---|---|
| Titre de page Ressource (« INSPIRATION ») | 52,84 px, Medium, majuscules | 36,7 | **36 px** | 1,1 | 500 | −0,02 em |
| Titre de section (« Logo », « Logo symbole ») | 30 px, Medium | 20,8 | **20 px** | 1,2 | 500 | −0,01 em |
| Texte d'interface : menu, panneau, boutons, champs | 20,16 px, Regular | 14 | **14 px** | 1,4 (20 px) | 400 | −0,01 em |
| Texte courant : descriptions, libellés de cartes | 20 px, Regular | 13,9 | **14 px** | 1,5 (21 px) | 400 | 0 |
| Champs du Layout editor, « Télécharger » | 20,16 px, **Light** | 14 | **14 px** | 1,4 | **400** | −0,01 em |
| Petits libellés : BETA, « 9:16 », « 1080x1920 » | 15,4 px | 10,7 | **12 px** | 1,3 | 400 (500 pour BETA) | 0 |

**Échelle complète (6 tailles) :** 12 · 14 · 16 · 20 · 28 · 36 px. Pour l'instant, on utilise 12, 14, 20 et 36. Les tailles 16 et 28 sont réservées aux pages Ressource à venir.

**Ce qui change par rapport au Figma :**
- **Light → Regular.** La graisse Light à 14 px se lit mal. On garde 2 graisses : 400 et 500.
- **Approche (espacement des lettres).** Le Figma resserre plus le petit texte (−2 %) que les titres (−1 %), ce qui est l'inverse de la règle typographique : un petit texte doit respirer. On inverse donc : 0 à −0,01 em pour le texte, −0,02 em pour les grands titres.
- **Pas de texte sous 12 px.**

## 2. Couleurs

### Couleurs de l'interface (relevées et nommées par rôle)

| Rôle | Figma | **Retenu** | Commentaire |
|---|---|---|---|
| Fond de l'application | `#EBE2D9` | **`#EBE2D9`** | Inchangé |
| Surface : zone de contenu Ressource, canevas, sélecteur | `#F8F7F2` | **`#F8F7F2`** | Inchangé |
| Surface blanche : cartes de logo, frames | `#FFFFFF` | **`#FFFFFF`** | Inchangé |
| Carte de ressource, piste d'interrupteur | `#EBE5E0` | **`#EBE5E0`** | Inchangé |
| Fond de contrôle : champ, élément actif du menu, curseur | taupe `#C2B1A2` à 40 % | **taupe 40 %** | Inchangé |
| Fond de groupe : sélecteur segmenté, ligne d'interrupteur, champs X/Y | `#DBD0C7` et `#DBCEC3` | **`#DBD0C7`** | Les 2 teintes quasi identiques sont **fusionnées** |
| Segment actif | `#CBBDB2` | **`#CBBDB2`** | Inchangé |
| **Texte principal** | `#431604` et `#320C1C` | **`#431604`** | `#320C1C` (titres Ressource) est un brun violacé quasi identique, sans doute issu d'un copier-coller : **fusionné** |
| **Texte secondaire** : menu inactif, libellés, « Éditeur », valeurs X/Y, placeholders | brun à 50 %, 48 %, 40 % et 20 %, `#C0B4A9` | **`#724F40`** (brun 72 %) | Les 5 variantes sont **fusionnées et foncées** pour la lisibilité (voir § 3) |
| Texte désactivé | — | **brun 40 %** | Pour les éléments inactifs uniquement (exemptés par la norme) |
| Texte sur fond foncé | `#F8F7F2` | **`#F8F7F2`** | Inchangé |
| Accent : bouton Export, contour de l'élément choisi | `#EC5F14` | **`#EC5F14`** | Toujours avec du texte brun : jamais de texte orange sur fond clair |
| Sélection (calque choisi) | orange 30 % / 20 % | **orange 30 % / orange 15 %** | Ligne choisie / ses enfants |
| Bouton foncé (« + », « Exporter ») | `#431604` | **`#431604`** | Inchangé |
| Séparateurs | brun 10 % (1,4 px) et taupe `#C2B1A2` (2 px) | **brun 12 %, 1 px** | Un seul style de séparateur |
| Remplissage de curseur | brun 10 % | **brun 10 %** | Inchangé |
| Bandeau d'images (Illustrations) | blanc 28 % | **blanc 28 %** | Inchangé |
| **Contour de focus clavier** | *(absent du Figma)* | **brun `#431604`, 2 px, décalé de 2 px** | Ajout obligatoire pour l'accessibilité |

**Hors de ce fichier :** la palette des motifs (Brun, Orange, Taupe, Grège, Lin, Sauge, Ciel) et les fonds de scène (brun, taupe) appartiennent au **moteur de patterns**, qu'on ne touche pas. Elle restera dans le moteur, pas dans les tokens de l'interface.

## 3. Contrastes (norme WCAG AA)

Ratio minimum : 4,5:1 pour le texte courant, 3:1 pour les grands textes et les éléments graphiques utiles.

| Texte / fond | Figma | Ratio | Après harmonisation |
|---|---|---|---|
| Texte principal sur fond appli | `#431604` / `#EBE2D9` | 12,1 ✅ | Inchangé |
| Texte principal sur élément actif | `#431604` / taupe 40 % | 10,1 ✅ | Inchangé |
| Texte brun sur bouton orange Export | `#431604` / `#EC5F14` | 4,6 ✅ (juste) | Inchangé |
| Texte clair sur bouton « Exporter » | `#F8F7F2` / `#431604` | 14,5 ✅ | Inchangé |
| Menu inactif | brun 50 % | **3,0 ❌** | `#724F40` → **5,6 ✅** |
| « Éditeur », « Réglage avancé » | brun 40 % | **2,3 ❌** | `#724F40` → **4,8 à 5,6 ✅** |
| Libellés des curseurs (« Taille », « Contraste »…) | brun 48 % | **2,6 ❌** | `#724F40` → **5,0 ✅** |
| Placeholder (« Nom du préréglage ») | brun 20 % | **1,5 ❌** | `#724F40` → **5,0 ✅** |
| Badge BETA | `#EBE2D9` sur brun 20 % | **1,5 ❌** | Texte `#F8F7F2` sur `#724F40` → **6,7 ✅** |
| Étiquettes du Layout editor (« Frame 1 », « 9:16 », « 1080x1920 ») | `#C0B4A9` ou `#F8F7F2` sur beige | **1,4 à 1,9 ❌** | Texte `#724F40` → **≥ 4,8 ✅** |
| Titres des pages Ressource | `#320C1C` / `#F8F7F2` | 16,3 ✅ | `#431604` → 14,5 ✅ |

**À savoir :**
- Les champs sont dessinés par un simple fond légèrement plus foncé que la page (ratio 1,2). C'est courant et acceptable, parce que chaque champ a un libellé. En échange, l'**état focus** sera très visible (contour brun).
- L'orange sur fond clair (2,6) ne sert jamais pour du texte, seulement pour les fonds de bouton et les contours de sélection.

## 4. Espacements (grille de 4 px)

**Échelle :** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 px.

| Usage | Figma | ÷ 1,44 | **Retenu** |
|---|---|---|---|
| Marge autour de l'appli et entre les colonnes | 14 | 9,7 | **8** |
| Marge intérieure de la colonne de gauche (côtés / haut) | 22 / 32 | 15,3 / 22,2 | **16 / 24** |
| Écart entre logo, séparateur, sélecteur et menu | 41 | 28,5 | **32** |
| Écart entre les entrées du menu | 22 | 15,3 | **16** |
| Écart entre icône et libellé | 8 | 5,6 | **8** |
| Marge intérieure du panneau Éditeur | 12 | 8,3 | **8** |
| Écart entre deux sections du panneau | 28 et 32 | 19 et 22 | **24** (une seule valeur) |
| Écart entre contrôles d'une section | 12 | 8,3 | **8** |
| Marge intérieure horizontale d'un contrôle | 24 (parfois 16 ou 11) | 16,7 | **12** (gauche) / **8** (droite, côté icône) |
| Marge intérieure du bouton Export | 18 / 16 | 12,5 / 11 | **12** |
| Marge intérieure du sélecteur Tool/Ressource | 6 | 4,2 | **4** |
| **Pages Ressource** : marge du haut | 96 | 66,7 | **64** |
| Écart titre ↔ description | 31 | 21,5 | **24** |
| Écart en-tête ↔ contenu | 93 | 64,6 | **64** |
| Écart titre de section ↔ cartes | 51 | 35,4 | **32** |
| Écart entre cartes (grille) | 39,3 | 27,3 | **24** |
| Marge intérieure d'une carte / écart interne | 18 / 22 | 12,5 / 15,3 | **12 / 16** |
| Largeur max. du contenu Ressource | 1904 (centré) | 1322 | **1320 px**, centré, marges latérales d'au moins 48 |

## 5. Tailles des éléments

| Élément | Figma | ÷ 1,44 | **Retenu** |
|---|---|---|---|
| Colonne de gauche | 373 | 259 | **256 px** |
| Panneau Éditeur | 388 | 269 | **272 px** |
| Colonne droite des pages Ressource | 79 | 55 | **56 px** |
| **Hauteur des contrôles** : champ, curseur, entrée de menu, segment, ligne d'interrupteur | 44, 47, 54 (3 hauteurs différentes) | 30 à 37,5 | **36 px pour tous** |
| Contrôles compacts (champs X / Y / W / H du Layout editor) | 34 | 23,6 | **28 px** |
| Bouton icône seul (« + », télécharger) | 37 à 55 | 26 à 38 | **36 px** |
| Interrupteur (piste) | 42 × 21 | 29 × 15 | **32 × 18 px** |

Toutes les zones cliquables font au moins 24 × 24 px. La plupart font 36 px.

## 6. Arrondis

| Usage | Figma | ÷ 1,44 | **Retenu** |
|---|---|---|---|
| Pastille d'interrupteur | 2 | 1,4 | **2** (xs) |
| Contrôles, champs, badges, éléments de menu | 3, 4 et 6 | 2 à 4,2 | **4** (sm) |
| Groupes de contrôles, bouton Export, cartes Ressource, cadres du Layout editor | 7, 8, 10 et 13 | 4,9 à 9 | **8** (md) |
| Grandes zones centrales (scène, contenu Ressource, canevas) | 24 | 16,7 | **16** (lg) |

On passe de 9 arrondis différents à **4 valeurs**.

## 7. Icônes

Set **Central**, style Line, coins 2px Medium (validé). La taille et l'épaisseur affichée du trait dépendent de l'usage :

| Taille | Usage | Figma | **Retenu** | Trait affiché |
|---|---|---|---|---|
| `xs` | Chevrons d'accordéon, croix de suppression, « + » | 15 | **12 px** | 1,25 px |
| `sm` | Menu, onglets Tool/Ressource, champs, « Télécharger » | 16, 25, 26 | **16 px** | 1,5 px |
| `md` | Boutons icône seule : panneau Éditeur, téléchargement | 32 | **20 px** | 1,5 px |
| `lg` | Ajout d'image dans le bandeau, actions mises en avant | 28 | **24 px** | 1,5 px |

Dans le code, on écrit toujours `<Icon size="sm">`, jamais une taille en pixels.

## 8. Points à arbitrer

1. **Base de 14 px** (Figma ÷ 1,44) : oui, ou option B à 13 px ?
2. **Fusions de couleurs** : `#320C1C` → `#431604`, `#DBCEC3` → `#DBD0C7`, les 5 gris de texte → un seul secondaire `#724F40`, et un seul style de séparateur. D'accord ?
3. **Textes secondaires foncés** (brun 72 % au lieu de 40 à 50 %) pour respecter la lisibilité. L'interface sera un peu plus contrastée que la maquette. D'accord ?
4. **Une seule hauteur de contrôle** (36 px) au lieu de trois dans le Figma. D'accord ?
5. **Light → Regular** pour les champs du Layout editor. D'accord ?
6. **Police Geist via `@fontsource-variable/geist`** (nouvelle dépendance, gratuite). D'accord ?
