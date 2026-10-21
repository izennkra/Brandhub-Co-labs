# Spec : `pattern-engine` (moteur de motifs)

> Statut : **validée le 21/10/2026**. Deuxième partie de `CAPABILITY-MAP.md` (dépend de `app-shell`, terminée).
> Décisions prises le 21/10/2026 : copie du moteur à l'identique · périmètre « moteur + réglages » · réglages essentiels + « Réglage avancé » · raccourci ⌥ H.

## Objectif

Faire tourner **le moteur de motifs validé par le client**, sans le modifier, dans les pages **Tool › Motif** et **Tool › Illustration** de la nouvelle appli :
- le motif s'affiche dans la zone centrale, comme dans le prototype : rotation, zoom, déconstruction au survol, tracé de ligne, infographie ;
- le panneau **Éditeur** (déjà en place) le pilote, avec les réglages du Figma et tous les autres derrière « Réglage avancé » ;
- l'Illustration affiche ses images (démo incluse) et permet d'en ajouter, d'en choisir, d'en retirer et de les réordonner.

**Hors de cette partie** :
- l'export (PNG, WebP, JPEG, SVG, vidéo, Figma) : étape suivante ;
- les préréglages partagés : avec la partie `data-store` ;
- le Layout editor : partie `layout-editor`.

## Ce que montre l'analyse du prototype

- Tout le code est dans **un seul bloc** de 3 570 lignes (`reference/prototype.html`, lignes 848 à 4416). Le moteur occupe les lignes **852 à 2617**, de « Palette » à « Rendu d'un calque ». Il est suivi de l'interface (curseurs, préréglages, export, Design libre).
- Le moteur dépend de **Three.js r128**. Il dessine dans un `<canvas id="scene">`, place ses étiquettes dans `#labels`, et appelle quelques fonctions de l'interface (`toast`, `syncers`…).
- Ses réglages vivent dans un objet `S` : 68 curseurs, 13 interrupteurs, 2 sélecteurs. Les fonctions qui changent de mode (`setVariant`, `setApp`, `applySettings`) sont dans la partie interface.
- La boucle d'animation tourne en permanence (`requestAnimationFrame`).

## Solution : « copie à l'identique + couche d'adaptation »

```
reference/prototype.html ──(script d'extraction)──► src/lib/pattern-engine/prototype-engine.js
                                                     (lignes 852-2617, octet pour octet, NE PAS MODIFIER)
                                                              │ exécuté par
                                                              ▼
                                       src/lib/pattern-engine/createEngine.ts  (couche d'adaptation)
                                       · fournit Three.js r128, le canvas, #labels, toast, syncers…
                                       · expose une API : réglages, régénérer, changer de mode, images
                                                              │
                                                              ▼
                     Pages Motif / Illustration (zone centrale) + panneau Éditeur (réglages)
```

1. **Extraction.** Le script `scripts/extract-engine.mjs` copie le bloc moteur du prototype dans `prototype-engine.js`, entre deux marqueurs. Il repère le bloc par ses commentaires de début et de fin, pas par des numéros de ligne. Le fichier porte la mention « généré, ne pas modifier ».
2. **Preuve d'identité.** Un test régénère le bloc depuis le prototype et vérifie qu'il est **identique octet pour octet** au fichier du projet. Une empreinte (SHA-256) est notée dans ce fichier.
   - Bloc actuel : lignes 852 à 2616 du prototype, SHA-256 `72457c2f2f502d888e2cbbab06f6ed6993bc69d66d3c7494d00f784662f66715`.
   - Noms reçus de la couche d'adaptation (8) : `THREE`, `toast`, `syncers`, `onLibraryChanged`, `recState`, et `DL`, `dlApplyView`, `libreTick` (Design libre, sans effet tant que l'outil n'est pas en mode libre).
3. **Exécution sans changement de comportement.**
   - Le prototype s'exécute en mode strict (`"use strict"` en tête de son script). Le bloc est donc placé tel quel dans un **module JavaScript**, qui est lui aussi strict, à l'intérieur d'une fonction générée `runPrototypeEngine(env)`. Seules l'en-tête et la fin de cette fonction sont générées : elles reçoivent ce que le bloc attend et renvoient l'API. Le bloc entre les deux est identique au prototype.
   - Pas d'`eval` ni de `new Function` : aucune exception de sécurité à prévoir pour la mise en ligne. *(Corrigé le 21/10/2026 lors de la tâche 1 : la spec supposait à tort un mode non strict.)*
4. **Couche d'adaptation** (`createEngine.ts`), le seul code nouveau autour du moteur :
   - fournit tout ce que le bloc attend : `THREE` (paquet `three@0.128.0`, la même version r128), le canvas, `#labels`, les éléments que le bloc touche (`#panel`, `#openPanel`, cachés), `toast` (relié aux notifications de l'appli) et `syncers` (relié au panneau Éditeur) ;
   - la liste exacte des noms attendus est établie par une analyse automatique du bloc, et vérifiée par un test ;
   - fournit un `requestAnimationFrame` qui **met la boucle en pause** hors des pages Tool : le moteur ne consomme rien sur les pages Ressource ;
   - expose une API : lire et modifier les réglages, régénérer, nouvelle forme, Motif ↔ Illustration, gérer les images. Les transitions de l'interface du prototype (`setVariant`, `setApp`, `applySettings`…) sont reprises à l'identique dans cette couche, car elles font partie de l'interface et non du moteur.
5. **Un seul moteur, un seul canvas.** Il est créé à la première visite d'une page Tool, chargé à part (Three.js n'est pas téléchargé pour les pages Ressource), puis déplacé dans la zone centrale de la page affichée.

## Réglages (panneau Éditeur)

- **Une table déclarative** (`src/lib/pattern-engine/controls.ts`) décrit chaque réglage du prototype : clé dans `S`, libellé, minimum, maximum, pas, format, section, effet (régénérer, recolorer…) et niveau (essentiel ou avancé). Valeurs et effets sont repris du prototype.
- **Par défaut**, on voit les réglages du Figma :
  - Motif : Volume (Membrane / Ligne, Renflements), Pastilles (Taille), Réseau, Survol, Rotation, Couleurs ;
  - Illustration : Images, Animation, Lumière et tons de l'image, Pastilles, Survol, Rotation, Couleurs.
- **« Réglage avancé »** : l'interrupteur du Figma, en haut du panneau, affiche tous les autres réglages dans leur section. Il est mémorisé.
- **Composants**, dessinés comme dans le Figma avec les tokens :
  - **Curseur** : barre remplie, libellé à gauche, valeur à droite. C'est un vrai `input type="range"` : flèches du clavier, valeur annoncée.
  - **Sélecteur segmenté** (Membrane / Ligne).
  - **Interrupteur.**
  - **Choix de couleurs** (palette du moteur).
- **Images (Illustration)** : la liste du panneau (glisser pour réordonner, croix pour retirer, image choisie encadrée en orange) et le bandeau de vignettes sous la scène, avec « + » pour ajouter. Les images ajoutées sont gardées dans le navigateur, comme le prototype le fait sans serveur. Le partage entre personnes arrive avec `data-store`.
- **Raccourci** : ⌥ H / Alt + H replie l'Éditeur, à la place de H (accessibilité).

## Tech stack (ajouts)

| Ajout | Pourquoi |
|---|---|
| `three@0.128.0` (MIT) | La version exacte utilisée par le prototype (r128) : la même que celle avec laquelle le rendu a été validé |

Aucune autre dépendance.

## Commandes

Inchangées (`npm run dev`, `build`, `test`, `test:e2e`, `lint`), plus :
```
Régénérer le bloc moteur depuis le prototype :  npm run engine:extract
```

## Structure

```
scripts/extract-engine.mjs               → extraction du bloc moteur
src/lib/pattern-engine/
  prototype-engine.js                    → GÉNÉRÉ, copie exacte (ne jamais modifier à la main)
  createEngine.ts                        → couche d'adaptation + API
  controls.ts                            → table des réglages (repris du prototype)
src/components/engine/                   → zone de scène, curseur, segmenté, interrupteur, couleurs, images
tests/engine-identity.test.ts            → le bloc est identique au prototype
e2e/engine-render.spec.ts                → rendu identique au prototype (comparaison d'images)
```

## Stratégie de test

| Niveau | Ce qu'on vérifie |
|---|---|
| Identité du code | Le bloc du projet est identique octet pour octet à celui du prototype. Chaque nom attendu par le bloc est fourni par la couche d'adaptation |
| Rendu identique | Le prototype et l'appli sont affichés côte à côte dans le navigateur de test, avec le **même hasard** (graine fixée), une **horloge figée**, les mêmes réglages et la même taille de scène. Les images du canvas doivent correspondre (≤ 0,1 % de pixels différents). Testé en Motif (Membrane, Ligne, Aérée) et en Illustration |
| Réglages | Chaque entrée de `controls.ts` existe dans `S` avec les bornes du prototype. Bouger un curseur change `S` et le rendu. « Réglage avancé » affiche ou masque les bons réglages |
| Comportement | Rotation, zoom et survol dans la scène. Changement Motif ↔ Illustration (réglages de chaque mode conservés). Images : ajout, choix, retrait, ordre |
| Performance | Three.js n'est pas chargé sur une page Ressource. La boucle s'arrête quand on quitte les pages Tool |
| Accessibilité | Contraste AA et focus visible (tests existants étendus aux nouveaux contrôles), curseurs utilisables au clavier, notifications annoncées |

## Limites

**Toujours**
- Ne modifier le bloc moteur que par `npm run engine:extract`, à partir du prototype.
- Comparer le rendu au prototype après tout changement de la couche d'adaptation.
- Reprendre les valeurs (bornes, défauts, effets) du prototype ; reprendre l'apparence du Figma et des tokens.

**Demander d'abord**
- Toute modification de `reference/prototype.html`, y compris si le client fournit une nouvelle version du moteur.
- Toute différence de rendu, même minime, avant de l'accepter.
- L'emplacement des commandes de scène absentes du Figma (voir questions).

**Jamais**
- Modifier, reformater, « optimiser » ou découper le code du moteur.
- Charger Three.js depuis un autre endroit que le paquet `three@0.128.0`.

## Critères de réussite

1. **Motif** affiche le motif du prototype à l'ouverture (Quantique › Membrane › Nœud), animé, dans la zone centrale. Rotation, zoom, double-clic et survol fonctionnent.
2. **Illustration** affiche les images de démo en nuage de pastilles, avec la liste d'images et le bandeau de vignettes.
3. **Code identique** : le test d'identité passe, et le bloc ne peut changer que par extraction.
4. **Rendu identique** : la comparaison avec le prototype passe dans les 4 cas testés.
5. **Tous les réglages** du prototype sont accessibles : ceux du Figma par défaut, les autres via « Réglage avancé ». Chacun agit sur le moteur.
6. Les contrôles suivent le Figma et les tokens, fonctionnent au clavier et respectent les contrastes AA.
7. Ajout, choix, retrait et réordonnancement des images fonctionnent. Les images ajoutées restent après un rafraîchissement.
8. Les pages Ressource ne chargent pas Three.js, et le moteur est en pause hors des pages Tool.
9. ⌥ H / Alt + H replie et réaffiche l'Éditeur. H seul ne fait plus rien.
10. Build, tests, tests navigateur et vérification du code au vert.

## Décisions sur les questions ouvertes (21/10/2026)

1. **Commandes de scène** : petite barre d'icônes en haut à gauche de la scène, avec lecture/pause et nouvelle forme (touche R). L'envoi vers le Layout editor et les préréglages viendront avec leurs parties.
2. **Section Couleurs** : reprise des choix du prototype (fond, couleurs des pastilles, couleur de la ligne) dans le style du panneau. Le rendu est montré pour validation avant d'être codé.
3. **Tracé de ligne et infographie** : ils fonctionnent tels quels, et leurs réglages vont dans « Réglage avancé ».
