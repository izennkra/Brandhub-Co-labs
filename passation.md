# Passation : Brand Hub · Co-labs

> Mise à jour le 22/10/2026. Branche en cours : `feature/resources`.
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
| **Export** (Image, SVG, Vidéo, Figma) | 🟡 testé par le porteur, **PR n° 4 ouverte**, pas encore fusionnée |
| **Ressources** (7 pages + mode édition) | 🟡 branche `feature/resources` (partie de `feature/export`), poussée, **dernière série à faire tester, puis PR** |
| **Layout editor** | ⏳ **prochaine partie** |
| Vercel (mise en ligne), profil éditeur complet | après |

### Ressources : ce qui existe

- **Mode édition** : bouton en haut à droite des pages Ressource, puis le code.
  - En local, le code est lu dans `.env.local` (`VITE_EDITOR_CODE`, fichier non versionné, réglé par le porteur).
  - En ligne, ce sera la variable Vercel **`EDITOR_CODE`**, avec le même code. Le serveur refuse toute modification des collections `res-…` sans le bon code.
- **Couleur** :
  - Palette de couleur principale, puis palette de couleur secondaire (couleurs d'accent).
  - Cartes au style de la maquette du porteur : on saisit le HEX, et **RVB, CMJN et Pantone** sont calculés. Le Pantone est le plus proche dans la table libre `pantone-colors` ; c'est une approximation. CMJN et Pantone sont corrigeables à la main.
  - **Neutres** construits à partir de 2 couleurs opposées (11 paliers, 50 → 950).
  - **Nuances** de chaque couleur.
  - Dégradés.
- **Typographie** : Geist par défaut. Les styles sont listés et **un seul bouton télécharge la famille complète (.zip)** : 18 TTF, versions variables et WOFF2, rangés dans `public/fonts/geist/` avec la licence OFL.
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

## 5. Prochaines étapes

1. Faire tester au porteur la dernière série (cartes couleur, Typographie), puis ouvrir la **PR des Ressources**. La PR n° 4 (Export) peut être fusionnée avant, sur son accord.
2. **Layout editor**, décision du porteur : **simple**. C'est **une seule frame**, comme sur la maquette Figma (`Tool / Layout editor Motif`, nœud `2337:7799`), où l'on place son motif dans un format. Pas de plan de travail à plusieurs frames.
   - Le panneau du Figma : Layout (X, Y, W, H, rotation, alignements, rognage), Format, Calques, Fill, Pastilles, Survol, Rotation, Couleurs, puis le bloc Export.
   - Brancher le bloc Export sur la frame (il est aujourd'hui grisé sur cette page).
   - Enregistrer un layout doit l'ajouter à la page **Patterns prédéfinis** (`res-layouts` : nom, format, aperçu).
   - Point de départ : le « Design libre » du prototype (lignes 3603 et suivantes), à simplifier.
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
