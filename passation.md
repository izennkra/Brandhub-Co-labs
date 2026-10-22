# Passation : Brand Hub · Co-labs

> Mise à jour le 22/10/2026. Branche en cours : `feature/layout-editor`.
> À lire aussi : `CLAUDE.md` (règles du projet).

## 1. Le projet en bref

- **Porteur** : Izenn, graphiste freelance, **pas développeur**. Lui parler en **français simple**, sans jargon. Questions de choix : options cliquables, la recommandation en premier, toutes les questions en une fois.
- **Client** : Co-labs.
- **But** : transformer le prototype HTML (`reference/prototype.html`) en vraie appli **React + TypeScript**, hébergée sur **Vercel**.
  - **Tool** : Motif, Illustration (moteur de patterns 3D) et Layout editor.
  - **Ressource** : le kit de marque (Logo, Typographie, Couleur, Iconographie, Imagerie, Patterns prédéfinis, Inspiration).
- **Dépôt** : `github.com/izennkra/Brandhub-Co-labs` (privé).
- **Figma** : fileKey `m5slgzL3STP1gMgceYKHog`, page « Brand hub co labs » (nœud `2337:6322`), lu avec le MCP Figma. Dessiné à l'échelle × 1,44 : les valeurs sont harmonisées dans `src/styles/tokens.css`.

## 2. Méthode de travail (rapide)

- **Les Agent Skills d'Addy Osmani (le développeur de Google) ont été supprimées du projet** le 22/10/2026, à la demande du porteur : trop longues. Il n'y a plus de `/spec`, `/plan`, `/build`, `/review`, `/ship`. **Ne pas les réinstaller ni les proposer.**
- On code directement ce qui est cadré. Pas de document de spec, de plan ni de relecture. Pas de question « on enchaîne ? ».
- **On garde** :
  - des tests pour chaque fonctionnalité, avec 1 ou 2 erreurs volontaires qui doivent les faire échouer ;
  - lint + tests + build avant chaque commit ;
  - un contrôle visuel dans le navigateur quand l'affichage change ;
  - la validation des maquettes et des vrais choix par le porteur.
- **Git** : une branche par partie, jamais de travail direct sur `main`. Commits en français, qui se terminent par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push, puis proposer une pull request. On ne fusionne que sur accord explicite du porteur.

## 3. Règles qui ne bougent pas

1. **Moteur de patterns : NE JAMAIS LE MODIFIER** (validé par le client). `reference/prototype.html` et `src/lib/pattern-engine/prototype-engine.js` (généré) ne se touchent pas.
   - Toute adaptation passe par `createEngine.ts`.
   - Pour exposer un nom du moteur : l'ajouter à `EXPORTS` ou `SETTERS` dans `scripts/extract-engine.mjs`, puis lancer `npm run engine:extract`. Le SHA du bloc doit rester `72457c2f…66715`.
2. **Le Figma fait foi** pour le design. Les valeurs ne viennent que de `src/styles/tokens.css` : un test interdit les couleurs en dur ailleurs.
3. **Icônes de l'interface** : uniquement `Icon.tsx` et `icons.registry.tsx`, set Central, ajoutées une par une (voir `CLAUDE.md`).
4. Les pages Ressource ne doivent **jamais charger le moteur ni Three.js**. Un test le vérifie : ne pas importer `createEngine.ts` ou `exporter.ts` depuis un composant de page.

## 4. Où on en est

| Partie | État |
|---|---|
| Structure de l'appli, navigation, design system | ✅ dans `main` (PR n° 1) |
| Moteur : Motif + Illustration | ✅ dans `main` (PR n° 2) |
| Stockage partagé + préréglages partagés | ✅ dans `main` (PR n° 3) |
| **Export** (Image, SVG, Vidéo, Figma) | ✅ dans `main` (PR n° 4) |
| **Ressources** (7 pages + mode édition) | ✅ dans `main` (PR n° 5) |
| **Layout editor** | 🟡 branche `feature/layout-editor`, poussée, **à faire tester, puis PR** |
| Vercel (mise en ligne), profil éditeur complet | après |

### Ressources : ce qui existe

- **Mode édition** : bouton en haut à droite des pages Ressource, puis le code.
  - En local, le code est lu dans `.env.local` (`VITE_EDITOR_CODE`, fichier non versionné, réglé par le porteur).
  - En ligne, ce sera la variable Vercel **`EDITOR_CODE`**, avec le même code. Le serveur refuse toute modification des collections `res-…` sans le bon code.
- **Couleur** :
  - Palette de couleur principale, puis palette de couleur secondaire (couleurs d'accent).
  - Cartes au style de la maquette du porteur : on saisit le HEX, et **RVB, CMJN et Pantone** sont calculés. Le Pantone est le plus proche dans la table libre `pantone-colors` ; c'est une approximation. CMJN et Pantone sont corrigeables à la main.
  - **Nuances** de chaque couleur principale et secondaire, calculées seules (11 paliers). La couleur se range au palier de sa luminosité (point sur la case), copie par case ou en CSS. **Plus de dégradés** (retirés le 22/10/2026, à la demande du porteur).
  - **Neutres** construits à partir de 2 couleurs opposées (11 paliers, 50 → 950), sur une seule bande.
- **Typographie** : Geist par défaut. Les styles sont listés et **un seul bouton télécharge la famille complète (.zip)** : 18 TTF, versions variables et WOFF2, rangés dans `public/fonts/geist/` avec la licence OFL. (Une refonte a été essayée le 22/10/2026 puis annulée à la demande du porteur.)
- **Iconographie** :
  - toute la bibliothèque **Central** (2 100 icônes), lue depuis le service visual.systems ;
  - recherche en anglais avec synonymes, style, arrondi, épaisseur, taille, couleur ;
  - copie en SVG, JSX ou lien, et lien d'intégration pour les développeurs.
- **Logo** :
  - sections « Logo principal » et « Symbole », d'autres s'ajoutent au besoin ;
  - **un seul SVG par section**, décliné automatiquement dans chaque couleur de la marque ;
  - export **SVG, PNG ou PDF** (vectoriel), et .zip par section.
- **Imagerie** (mosaïque + thèmes), **Inspiration** (mosaïque).
- **Patterns prédéfinis** : mosaïque filtrée par format. Elle est vide : elle sera remplie par les layouts du Layout editor (collection `res-layouts`).
- **Fichiers** : `/api/files` envoie vers Vercel Blob. Sans Blob, les images sont réduites et gardées dans les données.

### Layout editor : ce qui existe

- **Page d'essai** : chaque visite part d'un frame vide, **rien n'est enregistré** (décision du porteur, 22/10/2026). On teste, on exporte.
- **Un seul frame**, nommé « Visuel » par défaut (Figma `Tool / Layout editor Motif`, nœud `2337:7799`) : formats 1:1, 4:5, 9:16, 16:9, 4:3, A4, Bannière, ou taille libre ; fond (Fill) ; rognage.
- **Plan de travail** : molette pour se déplacer, ⌘ / Ctrl + molette (ou pincement) pour zoomer, boutons − / + / ajuster en bas à gauche, glisser le fond ou Espace + glisser pour se déplacer.
- **Calques** : Motif, Illustration (copies de l'outil, modifiables sans toucher l'outil) et Image. Déplacer, redimensionner (Maj : proportions), pivoter (rond au-dessus, Maj : par 15°), X / Y / W / H / rotation, alignements, ordre, masquer, supprimer.
- **Le calque épouse sa forme** : le moteur dessine la forme en petit (rotation automatique et boucle comprises), on relève ses bords, et le calque prend sa proportion. À l'ajout, il est posé **à bord perdu** dans le frame. Après chaque rotation 3D, il se réajuste (même taille, même place). Calcul dans `fitToShape` (`src/lib/layout/doc.ts`), mesure dans `layout.measure` (`src/lib/pattern-engine/layout.ts`).
- **Fond transparent** : les formes n'ont jamais de fond ; le fond se règle sur le frame (Fill), et les formes s'y fondent (leur couleur de fond suit celle du frame).
- **Jamais flou** : l'aperçu est calculé à la taille affichée, et un motif agrandi grandit d'un bloc (traits compris) grâce à sa largeur de référence (`ref`).
- **Mode 3D** (double-clic ou bouton) : glisser tourne la forme, la poignée ✥ la déplace, coins ou molette l'agrandissent, le rond la fait pivoter ; « Ajuster le calque à la forme », « Recentrer la forme ».
- **Couleurs** de la forme choisie : pastilles, plus Pastilles, Survol, Rotation.
- **Rotation 360° en boucle** par calque (motif ou illustration) : un tour exact en N secondes (2 à 60) ; le calque est mesuré sur tout le tour ; en vidéo, une durée égale à un tour boucle parfaitement.
- Le moteur garde la distance de caméra entre 5 et 180 (`RADIUS`) : le recul de la mesure et du recadrage en tient compte.
- **Boucle d'illustrations** propre au calque : cases à cocher et ordre libre ; la bibliothèque de l'outil Illustration ne change pas.
- **Export** du frame : image (×1 à ×3, PNG, WebP, JPEG) ou vidéo. Les motifs sont dessinés **par morceaux de 2048 px au plus** (`limits.tile`) : un calque à bord perdu en 3x saturait la carte graphique, qui « décrochait » (export puis aperçu tout blancs). Même chose pour l'aperçu très zoomé : seule la partie visible est dessinée. Si la carte graphique décroche quand même, un message demande de recharger la page.
- Côté moteur : `renderLayerTo`, `settingsGet`, `settingsSet` exposés via `EXPORTS` (SHA inchangé) ; tout le reste dans `src/lib/pattern-engine/layout.ts` et `src/lib/layout/doc.ts`.

## 5. Prochaines étapes

1. Faire tester le **Layout editor** au porteur, puis ouvrir sa PR.
2. **Patterns prédéfinis** : la page reste vide, puisque le Layout editor n'enregistre plus rien. À décider avec le porteur : permettre d'y déposer des images en mode édition (comme Inspiration) ?
3. **Mise en ligne Vercel** : créer le projet, relier Upstash Redis et Vercel Blob depuis le Marketplace, ajouter `EDITOR_CODE`, puis redéployer.
4. Avant la mise en ligne : vérifier la **licence Central Icons** (commerciale). On montre maintenant toute la bibliothèque sur la page Iconographie.

## 6. Commandes

```bash
npm run dev            # appli sur http://localhost:5173
npm test               # tests unitaires (Vitest)
npm run lint           # vérification du code
npm run build          # build de production
npx playwright test --project=chromium               # tests navigateur
npx playwright test --project=rendu-identique --no-deps   # rendu identique au prototype
npx playwright test visual --update-snapshots        # après un changement visuel voulu (regarder l'image d'abord)
```

## 7. Pièges connus

- Le cas **« Ligne »** du test de rendu identique échoue parfois, car le moteur tire au hasard : **relancer**. Le seuil reste 0,1 % (décision du porteur).
- Fermer l'aperçu du navigateur pendant le test de rendu : il occupe la carte graphique.
- Un autre serveur de développement tourne parfois sur le port 5173 : les tests le réutilisent.
- La capture de la page Iconographie masque la grille, car le contenu vient du service visual.systems.
- Les captures de référence sont propres à macOS.
- Il n'y a pas d'intégration continue sur GitHub : les seuls contrôles sont ceux lancés en local.
