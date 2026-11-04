# Brand Hub · Co-labs

Hub de marque de Co-labs : un **outil** de génération de visuels (motifs, illustrations, mises en page) et des
**ressources** de marque (logos, typographie, couleurs, icônes, images, QR code). Il fournit aussi deux **scripts
d’intégration** pour afficher le motif et les illustrations sur un site.

- Application : React 19 + TypeScript, Vite, React Router. Hébergée sur Vercel (fonctions `api/`).
- Rendu 3D : moteur de patterns Co-labs (three.js r128), intégré tel quel.
- Interface en français.

## Démarrer

Node 22 ou plus récent.

```bash
npm install
npm run dev          # http://localhost:5173
```

Sans configuration, l’appli fonctionne en local : les données sont gardées dans le navigateur et le code éditeur
par défaut est `colabs` (modifiable avec `VITE_EDITOR_CODE` dans `.env.local`).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement. |
| `npm run build` | Vérification des types et construction de l’appli (`dist/`). |
| `npm run preview` | Aperçu de la construction. |
| `npm test` | Tests unitaires (Vitest). `npm run test:watch` en continu. |
| `npm run test:e2e` | Tests dans un vrai navigateur (Playwright). |
| `npm run lint` | ESLint et Prettier (vérification). `npm run format` corrige la mise en forme. |
| `npm run build:embed` | Construit les deux scripts d’intégration (`dist-embed/`). |
| `npm run engine:extract` | Régénère le moteur depuis `reference/prototype.html` (voir plus bas). |

Avant chaque commit : `npm run lint`, `npm test` et `npm run build`.

## Organisation du dépôt

```
api/                    Fonctions Vercel : stockage partagé (store.ts) et fichiers (files.ts)
docs/design-tokens.md   Référence des couleurs, typographies, espacements (source de src/styles/tokens.css)
e2e/                    Tests Playwright (parcours, rendu du moteur, accessibilité, captures de référence)
embed/                  Fichiers livrés avec les scripts d’intégration (configurateurs, exemples, modes d’emploi)
public/                 Fichiers servis tels quels (icônes de l’appli, polices Geist téléchargeables)
reference/prototype.html  Prototype d’origine : source officielle du moteur de patterns
scripts/extract-engine.mjs  Extraction du moteur depuis le prototype
src/
  app/                  Gabarits (AppLayout, ToolLayout, ResourceLayout), routes et navigation
  components/           Composants d’interface (barre latérale, panneaux, contrôles, icônes…)
  embed/                Scripts d’intégration sur un site (voir plus bas)
  lib/
    pattern-engine/     Couche d’adaptation du moteur (le moteur lui-même : prototype-engine.js)
    resources/          Logique des pages Ressources (couleurs, logos, polices, export…)
    layout/             Document du Layout editor
    store/              Accès au stockage (service partagé ou navigateur)
  pages/                Pages Outils (tool/) et Ressources (resources/)
  styles/               Jetons de design (tokens.css) et styles globaux
tests/                  Tests unitaires
vite.config.ts          Appli et tests ; vite.embed.config.ts : scripts d’intégration
```

Pages : `src/app/navigation.ts` décrit toutes les pages (adresse, libellé, icône, sections de l’éditeur) ;
`src/app/routes.tsx` les relie à leur contenu.

## Moteur de patterns

Le moteur est le cœur visuel de l’outil. **Il ne doit pas être modifié** (rendu validé par le client).

- `src/lib/pattern-engine/prototype-engine.js` est **généré** par `npm run engine:extract`, octet pour octet,
  à partir de `reference/prototype.html`. Ne pas l’éditer à la main.
- Tout le reste de `src/lib/pattern-engine/` est la **couche d’adaptation** : elle démarre le moteur
  (`createEngine.ts`), expose ses réglages à l’interface (`controls.ts`), gère préréglages, bibliothèque
  d’illustrations, modèles 3D, export, mise en page.
- `e2e/engine-render.spec.ts` vérifie que l’appli rend exactement comme le prototype.

## Design

- **Jetons uniques** : toutes les couleurs, typographies, tailles, espacements et arrondis sont dans
  `src/styles/tokens.css` (référence : `docs/design-tokens.md`). Aucune valeur en dur ailleurs ; un test le vérifie
  (`tests/no-hardcoded-values.test.ts`).
- Styles : CSS Modules (`*.module.css`). Accessibilité : contrastes AA, focus visibles, zones cliquables suffisantes.
- **Icônes** : uniquement la famille Central (VisualSystem), via `src/components/Icon.tsx`
  (`<Icon name="…" size="xs|sm|md|lg" />`). Chaque icône est copiée dans `src/components/icons.registry.tsx`
  (variantes trait 1,5 et 2) ; aucune autre librairie d’icônes. Licence commerciale Central Icons (iconists).

## Stockage et mise en ligne

L’appli est déployée sur Vercel ; la branche `main` est mise en ligne à chaque fusion.

| Variable (Vercel) | Rôle |
|---|---|
| `EDITOR_CODE` | Code éditeur : autorise les modifications partagées (ressources, préréglages). |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | Stockage partagé (Upstash Redis). |
| `BLOB_READ_WRITE_TOKEN` (ou `BLOB_STORE_ID`) | Fichiers déposés (logos, images, polices) dans Vercel Blob. |
| `VITE_EDITOR_CODE` (local) | Code éditeur en développement, sans service. |

Sans service configuré, l’appli bascule seule sur le stockage du navigateur (`src/lib/store/store.ts`). Aucune
valeur de ces variables n’est dans le dépôt.

## Scripts d’intégration sur un site

Deux balises HTML autonomes, construites par `npm run build:embed` dans `dist-embed/` (le dossier à transmettre) :

- `<colabs-motif>` : le motif, formes A et B, orientation, couleurs, survol.
- `<colabs-illustration>` : les illustrations l’une après l’autre, branchables sur une barre de temps et des clics.

Code : `src/embed/` (`core/` commun, `motif/`, `illustration/`). Fichiers livrés : `embed/` (configurateur, exemples
et mode d’emploi de chaque script). Le moteur y est utilisé tel quel ; le stockage y est en mémoire.

## Tests

- Unitaires (`tests/`, Vitest + Testing Library) : logique, composants, garde-fous (jetons, icônes).
- Navigateur (`e2e/`, Playwright) : parcours, rendu du moteur, accessibilité, captures de référence
  (`e2e/visual.spec.ts-snapshots/`). Première fois : `npx playwright install chromium`.
