# Illustrations Co-labs · intégration sur un site

Une balise HTML, `<colabs-illustration>`, affiche les illustrations Co-labs (une image rendue en particules), l’une
après l’autre, avec la transition du moteur Co-labs. Le site peut **brancher sa propre interface** : une barre de temps
qui avance, des titres sur lesquels on clique pour changer d’image, etc.
Aucune librairie à installer, aucun framework requis : un fichier JavaScript, un dossier d’images et une balise.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `colabs-illustration.js` | Le script à mettre sur le site (≈ 900 Ko, ≈ 320 Ko compressé par le serveur). |
| `illustrations/` | Les images et leurs réglages (`illustrations.json`). À mettre **à côté** du script. |
| `configurateur.html` | Outil pour régler les illustrations et **copier le code**. Ce n’est pas une page du site. |
| `exemples/1-minimal.html` | Lecture automatique, la plus simple. |
| `exemples/2-services-barre-de-temps.html` | **Branchement** : liste de services, barre de temps, clic (sans design final). |
| `exemples/3-fond-transparent-manuel.html` | Fond transparent, le site pilote avec ses propres boutons. |
| `LISEZMOI.md` | Ce mode d’emploi. |

## Démarrage rapide

```html
<!-- 1. Une seule fois par page -->
<script src="/chemin/vers/colabs-illustration.js" defer></script>

<!-- 2. À l’endroit de l’illustration -->
<colabs-illustration images="prisme adn oscilloscope" duree="6" format="4/5"></colabs-illustration>
```

Chaque illustration reste 6 secondes, puis la suivante arrive avec la transition du moteur, en boucle.

## Ouvrir le configurateur et les exemples

Les pages doivent être servies par un petit serveur local :

```bash
cd colabs-illustration
npx serve .
```

Puis ouvrir l’adresse affichée suivie de `/configurateur.html` ou `/exemples/2-services-barre-de-temps.html`.
(Sans Node : `python3 -m http.server 8080`.)

## Brancher le site : barre de temps et clics

Le script n’affiche **ni barre de temps ni boutons** : seulement l’illustration. Le site construit sa propre interface
(barre, titres, boutons…) et s’y branche avec **2 événements** et **quelques méthodes** :

```js
const illustration = document.querySelector('colabs-illustration');

// Une illustration s’affiche (seule à la fin du temps, ou après un clic) : mettre le menu à jour.
illustration.addEventListener('changement', (e) => {
  // e.detail = { index, id, nom, progression }
  activerService(e.detail.id);
});

// À chaque image : l’avancement de 0 à 1, pour remplir une barre de temps.
illustration.addEventListener('progression', (e) => {
  barre.style.transform = `scaleX(${e.detail.progression})`;
});

// Clic sur un service : son illustration tout de suite, le temps repart à 0.
bouton.addEventListener('click', () => illustration.afficher('adn'));
```

| Méthode / propriété | Rôle |
|---|---|
| `afficher(n)` ou `afficher('id')` | Affiche l’illustration n° `n` (à partir de 0) ou d’identifiant `id`. Le temps repart à 0. |
| `suivante()`, `precedente()` | Illustration suivante / précédente (en boucle). |
| `pause()`, `lecture()` | Arrête / relance le temps (l’image reste affichée). |
| `index` | Numéro de l’illustration affichée. |
| `progression` | Avancement de l’illustration affichée, de 0 à 1. |
| `illustrations` | Liste affichée : `[{ id, nom }, …]`. |
| événement `pret` | Le moteur est chargé et la première illustration affichée. |

**Lecture automatique** (par défaut) : la barre de temps arrive à 1, puis la suivante s’affiche seule.
**Lecture manuelle** (`lecture="manuelle"`) : aucun passage automatique, le site décide de tout (ex. son propre minuteur,
ou au défilement de la page).

Le temps s’arrête quand l’illustration n’est pas à l’écran ou que l’onglet est caché : la barre reprend où elle
en était.

## Les illustrations (`illustrations/illustrations.json`)

```json
{
  "illustrations": [
    { "id": "prisme", "nom": "Prisme", "fichier": "prisme.jpg", "tons": { … }, "reglages": { … } },
    { "id": "adn", "nom": "Double hélice d’ADN", "fichier": "adn.jpg", "tons": { … }, "reglages": { … } },
    { "id": "oscilloscope", "nom": "Oscilloscope", "fichier": "oscilloscope.jpg", "tons": { … }, "reglages": { … } }
  ]
}
```

- `id` : identifiant utilisé par `images`, `depart` et `afficher()`.
- `fichier` : l’image, chemin relatif à `illustrations.json`.
- `tons` et `reglages` : réglages de l’illustration, repris de l’outil Co-labs (trame, couleurs, survol…).
  Le cadrage enregistré dans l’outil n’est pas repris : toutes les illustrations ont le même cadrage (attribut
  `distance`), pour qu’il n’y ait aucun saut de taille d’une illustration à l’autre.

**Ajouter ou remplacer une illustration** : déposer l’image (JPG, PNG ou WEBP, objet sur fond blanc ou transparent,
≈ 800 px) dans `illustrations/`, puis ajouter une ligne :

```json
{ "id": "microscope", "nom": "Microscope", "fichier": "microscope.jpg" }
```

Sans `tons` ni `reglages`, elle prend les tons par défaut et les réglages de la première illustration du fichier.
Pour remplacer une illustration, garder son `id` et changer `fichier`.

Le fichier peut aussi être ailleurs : `<colabs-illustration source="/assets/mes-illustrations.json">`.

## Tous les attributs

| Attribut | Valeurs | Par défaut | Rôle |
|---|---|---|---|
| `images` | identifiants, ex. `"prisme adn"` | toutes, dans l’ordre du fichier | Illustrations affichées, et leur ordre. |
| `depart` | identifiant ou numéro | la première | Illustration du début. |
| `duree` | 1 à 120 (s) | `6` | Temps de chaque illustration (lecture automatique). |
| `transition` | 0.2 à 10 (s) | moteur (2.4) | Durée de la transition entre deux illustrations. |
| `distance` | 5 à 180 | `74` | Taille des illustrations (distance de la caméra), la même pour toutes. |
| `lecture` | `auto`, `manuelle` | `auto` | Passage automatique ou piloté par le site. |
| `boucle` | `oui`, `non` | `oui` | Après la dernière : la première, ou on s’arrête. |
| `source` | adresse | `illustrations/illustrations.json` à côté du script | Fichier des illustrations. |
| `fond` | `transparent`, `brun`, `orange`, `taupe`, `grege`, `lin`, `sauge`, `ciel` | celui de chaque illustration | Fond. |
| `couleurs` | ex. `"brun lin"` | celles de chaque illustration | Couleurs des points. |
| `format` | `4/5`, `1/1`, `16/9`… | `16/9` si aucune hauteur | Proportion du bloc (ou taille libre en CSS). |
| `axe-x`, `axe-y`, `axe-z` | degrés | `0` | Incline l’illustration (en douceur). |
| `survol` | `oui`, `non` | celui de chaque illustration | Déconstruction au passage de la souris. |
| `survol-zone` | `curseur`, `forme` | — | Autour du curseur, ou toute l’illustration. |
| `survol-taille` | 40 à 500 (px) | — | Taille de la zone autour du curseur. |
| `survol-force` | 0.1 à 3 | — | Force de la déconstruction. |
| `survol-ouverture` | 0.05 à 2 (s) | — | Durée d’ouverture. |
| `survol-reconstruction` | 0.1 à 4 (s) | — | Durée de reconstruction. |
| `reglages` | JSON | — | Tout autre réglage avancé du moteur, imposé à toutes les illustrations. |

Fond, couleurs, survol, axes, distance, durée, transition et lecture changent **en direct**. `images`, `source` et `depart`
sont lus au chargement.

## Taille, fond transparent, performances

- **Taille** : celle du bloc. `format="4/5"`, ou une hauteur/largeur en CSS. Le dessin suit les changements de taille.
- **Fond transparent** : `fond="transparent"`, le fond du site se voit derrière (choisir des `couleurs` lisibles).
- Le moteur ne se charge **que lorsque l’illustration arrive à l’écran**, et se met en pause hors de l’écran, onglet
  caché, ou si le visiteur a demandé moins d’animations.
- Pas de navigation à la souris sur l’illustration : la page défile normalement. Le survol suit la souris.
- Rien n’est enregistré chez le visiteur. Au démarrage, le moteur vérifie une seule fois s’il existe un service
  `/api/store` : sur le site, cette adresse répond « 404 », c’est normal et sans effet.

## Limites

- **Un seul moteur par page** : une page affiche soit une illustration (`<colabs-illustration>`), soit un motif
  (`<colabs-motif>`), pas les deux. Pour plusieurs, une `<iframe>` par moteur.
- Les illustrations sont des images à plat (pas de modèle 3D).
- Les images doivent être sur le même site que la page, ou autorisées par le serveur qui les sert (CORS).
- Navigateurs récents (WebGL requis).
