# Carte des parties : Brand Hub · Co Labs

> Statut : **validée le 21/10/2026**. Les specs de chaque partie sont écrites dans l'ordre de construction ci-dessous.
> Prototype de référence : `reference/prototype.html` · Règles : `CLAUDE.md`

## Ce qui existe aujourd'hui (prototype)

Un seul fichier HTML d'environ 4 400 lignes (JavaScript + Three.js), qui contient :

| Zone | Ce qu'elle fait |
|---|---|
| Menu de gauche (rail) | Outils (actif), Ressource et Feedback (« bientôt »), icône « Mode éditeur » sans effet |
| Onglet **Motif** | Le moteur de patterns 3D : variantes Aérée / Quantique, Membrane / Ligne, données et process, couleurs de la charte |
| Onglet **Illustrations** | Transforme des images importées en nuages de points animés |
| Onglet **Design libre** | Mini-Figma : frames aux formats réseaux sociaux, calques, formes, images, motifs, export image et vidéo |
| Préréglages | Réglages enregistrés et partagés (stockage Vercel + Upstash Redis, sinon le navigateur) |
| Export | PNG, WebP, JPEG, SVG, vidéo, envoi vers Figma |

La palette (Brun, Orange, Taupe, Grège, Lin, Sauge, Ciel) est **écrite en dur** dans le code du moteur.

## Hypothèses (à corriger si besoin)

1. On passe à une vraie application **React + TypeScript**, hébergée sur **Vercel** (validé).
2. Le « moteur de patterns » à ne pas toucher, c'est le code de génération et de rendu 3D des onglets **Motif** et **Illustrations**. Les panneaux de réglages autour (curseurs, boutons) font partie de l'interface : on peut les redessiner selon le Figma, tant qu'ils pilotent exactement les mêmes paramètres.
3. On garde le stockage partagé existant (Vercel + Upstash Redis). Pour les fichiers lourds (logos, images d'inspiration), il faudra un stockage de fichiers (piste : Vercel Blob), **à valider avant d'ajouter quoi que ce soit**.
4. Le **profil éditeur** se débloque avec un **mot de passe simple** (validé). Sans mot de passe, on voit tout en lecture seule.
5. **Feedback** reste un emplacement `TODO: design à venir` tant qu'aucune référence n'est fournie.

## Les parties (modules)

| Id | Ce que ça couvre | Dépend de |
|---|---|---|
| `app-shell` | Structure globale : application React, menu de gauche, navigation Outils / Ressources / Feedback, tokens de design tirés du Figma (un seul fichier), composant `Icon.tsx` | — |
| `pattern-engine` | Le moteur (Motif + Illustrations) intégré **tel quel** dans un emballage isolé, `src/lib/pattern-engine/`, avec un rendu identique au prototype | `app-shell` |
| `data-store` | Le stockage partagé : préréglages, images, ressources, fichiers | `app-shell` |
| `editor-access` | Le profil éditeur : mot de passe, mode lecture seule pour les autres, boutons d'édition visibles seulement en mode éditeur | `app-shell`, `data-store` |
| `resources` | La partie Ressources, page par page : Logos, Couleurs, Typographies, Icônes, Patterns, Inspiration. En mode éditeur : import des logos, des images d'inspiration, etc. | `data-store`, `editor-access` |
| `layout-editor` | L'ancien « Design libre », **entièrement repensé** : frames, calques, insertion de motifs, d'illustrations et de ressources (logos…), export | `pattern-engine`, `resources` |

### Briques futures (temps 2, une fois les pages Ressources construites)

| Id | Ce que ça couvre | Dépend de |
|---|---|---|
| `brand-settings` | Un menu Réglages unique pour remplir toute la partie Ressources depuis un seul endroit. Exemple : les couleurs saisies une fois alimentent la page Couleurs **et** les couleurs du moteur | `resources` |
| `logo-variants` | Mini-outil : on dépose chaque logo une seule fois et il génère automatiquement toutes les déclinaisons de couleurs | `brand-settings` |

## Ordre de construction

```
app-shell → pattern-engine, data-store → editor-access → resources → layout-editor
                                                        ↓ (temps 2)
                                         brand-settings → logo-variants
```

Pourquoi les Ressources avant le Layout editor ? Le Layout editor doit pouvoir insérer les logos et les images des Ressources. Si on les construit d'abord, il n'y a rien à refaire ensuite.

Chaque partie aura sa propre spec (`SPEC-app-shell.md`, `SPEC-resources.md`, etc.), écrite dans cet ordre, puis validée avant de coder.

## Questions ouvertes

1. **Lien Figma** de la nouvelle maquette : nécessaire pour écrire la spec `app-shell` (structure, navigation, tokens).
2. Le Figma couvre-t-il les pages **Ressources** et le **Layout editor**, ou certaines pages viendront plus tard ?
3. Hypothèse 2 : confirmes-tu que les panneaux de réglages du moteur peuvent être redessinés, du moment que le rendu reste identique ?
4. Dans les Ressources, la liste Logos / Couleurs / Typographies / Icônes / Patterns / Inspiration est-elle complète ?
