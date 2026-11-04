# Motif Co-labs · intégration sur un site

Une balise HTML, `<colabs-motif>`, affiche le motif Co-labs animé et interactif (effet au survol de la souris).
L’orientation se règle par les attributs (pas de navigation à la souris sur le motif) ; ses changements s’animent
en douceur.
Aucune librairie à installer, aucun framework requis : un fichier JavaScript et une balise.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `colabs-motif.js` | Le script à mettre sur le site (≈ 895 Ko, ≈ 320 Ko compressé par le serveur). Contient tout : moteur, three.js, police. |
| `configurateur.html` | Outil pour régler le motif et **copier le code** prêt à coller. Ce n’est pas une page du site. |
| `exemples/1-minimal.html` | L’intégration la plus simple. |
| `exemples/2-fond-transparent.html` | Motif posé sur une section colorée (fond transparent, taille libre). |
| `exemples/3-formats.html` | Changer de format (16/9, 1/1, 4/5…). |
| `LISEZMOI.md` | Ce mode d’emploi. |

## Démarrage rapide

```html
<!-- 1. Une seule fois par page, dans <head> ou en fin de <body> -->
<script src="/chemin/vers/colabs-motif.js" defer></script>

<!-- 2. À l’endroit du motif -->
<colabs-motif forme="A"></colabs-motif>
```

Sans autre réglage : forme A, fond « Lin », format 16/9 sur toute la largeur disponible.

## Ouvrir le configurateur et les exemples

Les pages doivent être servies par un petit serveur local (le navigateur bloque souvent les scripts ouverts
par double-clic) :

```bash
cd colabs-motif
npx serve .
```

Puis ouvrir l’adresse affichée, suivie de `/configurateur.html` ou `/exemples/1-minimal.html`.
(Sans Node : `python3 -m http.server 8080`, puis `http://localhost:8080/configurateur.html`.)

Dans le configurateur :

1. **Forme A / Forme B** : les deux formes des maquettes. « Nouvelle forme » en tire une autre ; sa `graine` passe
   dans le code et redonne toujours exactement la même forme.
2. **Orientation** : axes X, Y, Z de la forme et point de vue de la caméra, avec les curseurs (la forme tourne en
   douceur jusqu’à la nouvelle position).
3. **Fond et format** : fond transparent, couleur de la page pour l’aperçu, format.
4. **Masquer les réglages** (en haut à droite) : voir le motif seul, comme sur le site.
5. **Copier le code** : seuls les réglages modifiés sont écrits ; le reste garde les valeurs par défaut.

## Taille et format

Le motif prend **la taille de son bloc**. Trois façons de la fixer :

```html
<!-- a. Un format : la largeur suit la page, la hauteur suit la proportion -->
<colabs-motif format="4/5"></colabs-motif>

<!-- b. Une hauteur en CSS (taille libre) -->
<colabs-motif style="height: 70vh"></colabs-motif>

<!-- c. Largeur et hauteur en CSS, dans une classe du site -->
<colabs-motif class="hero-motif"></colabs-motif>
```

Formats acceptés : `16/9`, `21/9`, `4/3`, `1/1`, `4/5`, `9/16`… (aussi `16:9` ou `16x9`). Sans format ni hauteur : 16/9.
Le motif suit les changements de taille (fenêtre, mise en page responsive) tout seul.

## Fond transparent

```html
<colabs-motif fond="transparent"></colabs-motif>
```

Le fond de la page (couleur, dégradé, image) se voit derrière le motif. Penser à choisir des `couleurs` de points
lisibles sur ce fond (ex. `couleurs="lin ciel"` sur un fond foncé).

## Tous les attributs

| Attribut | Valeurs | Par défaut | Rôle |
|---|---|---|---|
| `forme` | `A`, `B` | `A` | Forme des maquettes, avec son orientation. |
| `graine` | nombre entier | — | Forme précise (copiée du configurateur). Remplace celle de `forme`. |
| `forme-du-fil` | `noeud`, `ample`, `simple` | selon la forme | Famille de forme, avec `graine`. |
| `axe-x` | degrés, −360 à 360 | `0` | Bascule la forme vers l’avant ou l’arrière (axe horizontal de l’écran). |
| `axe-y` | degrés, −360 à 360 | `0` | Tourne la forme à gauche ou à droite (axe vertical de l’écran). |
| `axe-z` | degrés, −360 à 360 | `0` | Fait pivoter la forme dans le plan de l’écran. |
| `rotation` | degrés, −360 à 360 | selon la forme | Point de vue : la caméra tourne autour de la forme. |
| `inclinaison` | degrés, −89 à 89 | selon la forme | Point de vue : 0 = de face, 90 = vue du dessus. |
| `distance` | 5 à 180 | selon la forme | Point de vue : plus petit = plus proche. |
| `rotation-auto` | `oui`, `non` | `oui` | Rotation lente et continue. |
| `vitesse-rotation` | −4 à 4 | `0.6` | Le signe donne le sens. |
| `elargir` | `oui`, `non` | `oui` | `non` : ruban d’épaisseur régulière. |
| `renflements` | 1 à 12 | moteur | Nombre de parties larges. |
| `gonflement` | 0.4 à 2 | moteur | Largeur des parties larges. |
| `finesse-cols` | 0.02 à 0.6 | moteur | Finesse entre les parties larges. |
| `epaisseur` | 0.3 à 6 | moteur | Épaisseur générale. |
| `fond` | `transparent`, `brun`, `orange`, `taupe`, `grege`, `lin`, `sauge`, `ciel` | `lin` | Fond du motif. |
| `couleurs` | liste de la palette, ex. `"brun ciel lin"` | `brun ciel lin` | Couleurs des points. |
| `format` | `16/9`, `1/1`, `4/5`… | `16/9` si aucune hauteur | Proportion du bloc. |
| `survol` | `oui`, `non` | `oui` | Déconstruction au passage de la souris (`non` : aucun effet). |
| `survol-zone` | `curseur`, `forme` | `curseur` | Autour du curseur, ou toute la forme d’un coup. |
| `survol-taille` | 40 à 500 (px) | `150` | Taille de la zone autour du curseur. |
| `survol-force` | 0.1 à 3 | `1` | Force de la déconstruction. |
| `survol-ouverture` | 0.05 à 2 (s) | `0.35` | Durée d’ouverture quand la souris arrive. |
| `survol-reconstruction` | 0.1 à 4 (s) | `1.2` | Durée de reconstruction quand la souris part. |
| `particules` | 2000 à 120000 | moteur (≈ 97 000) | Densité des points. |
| `reglages` | JSON | — | Tout autre réglage avancé du moteur, ex. `reglages='{"swirl":0.4}'`. |

Les valeurs hors bornes sont ramenées dans les bornes ; une valeur illisible est ignorée.
**Tous les attributs peuvent changer après le chargement** (ex. en JavaScript) : le motif se met à jour.
Orientation (`axe-*`, `rotation`, `inclinaison`, `distance`), couleurs, `fond`, `rotation-auto`, `vitesse-rotation`,
`survol` et `survol-*` changent **en direct**, sans redessiner la forme ; l’orientation tourne en douceur (≈ 1 s). Les autres réglages (`forme`, `graine`, élargissement,
`particules`, `reglages`…) redessinent la forme depuis le début.

## JavaScript (facultatif)

```js
const motif = document.querySelector('colabs-motif');
motif.addEventListener('pret', () => console.log('motif affiché'));
motif.setAttribute('format', '1/1'); // changer un réglage
motif.orientation(); // { rotation, inclinaison, distance } en degrés
motif.nouvelleForme(); // tire une nouvelle forme (écrit l’attribut graine)
```

## Performances

- Le moteur ne se télécharge et ne démarre **que lorsque le motif arrive à l’écran**.
- Il se **met en pause** hors de l’écran, quand l’onglet est caché, et pour les personnes qui ont demandé moins
  d’animations dans leur système (`prefers-reduced-motion`).
- La netteté est plafonnée sur les écrans très haute définition.
- Sur un appareil modeste, baisser `particules` (ex. `40000`) allège le calcul.

## Limites

- **Un seul motif animé par page** : le moteur n’en gère qu’un à la fois. Pour plusieurs motifs, utiliser une
  `<iframe>` par motif (chacune avec sa propre page).
- Le motif dessine sa forme progressivement au démarrage (quelques secondes), comme dans l’outil.
- Les parties larges glissent le long du ruban pendant l’animation : leur place change d’un instant à l’autre.
- Pas de navigation sur le motif (glisser, molette, pincement, double-clic) : la page défile normalement par-dessus,
  au doigt comme à la molette.
- Le survol suit la souris ; sur un écran tactile, il n’y a pas d’effet de survol.
- Navigateurs : versions récentes de Chrome, Edge, Safari et Firefox (WebGL requis).
