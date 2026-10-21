# Plan de construction : `pattern-engine` (moteur de motifs)

> Statut : **à valider**. Spec : `SPEC-pattern-engine.md` (validée). Tâches détaillées : `tasks/todo.md`.
> Plan précédent (app-shell, terminé) : `tasks/archive/`.

## En bref

12 petites étapes, en 4 phases. On commence par **le plus risqué** : faire tourner le moteur copié à l'identique, puis **prouver que son rendu est le même** que dans le prototype. Si ça bloque, on le sait dès le début, avant d'avoir construit les réglages.

## Décisions techniques

- **Bloc moteur** : il est extrait du prototype par un script, repéré par ses commentaires de début (« Palette et associations ») et de fin (fin de `renderLayerTo`, juste avant « Interface »). Il n'est jamais modifié à la main.
- **Analyse des noms attendus par le bloc** : faite avec le compilateur TypeScript, déjà installé, pour éviter une nouvelle dépendance. Elle produit la liste de ce que la couche d'adaptation doit fournir.
- **Exécution** : le bloc est importé comme texte (`?raw`) et exécuté par `new Function` en mode non strict, comme dans le prototype. Three.js r128 vient du paquet `three@0.128.0`.
- **Pilotage de la boucle** : la couche fournit son propre `requestAnimationFrame`, qui ne programme l'image suivante que lorsque la scène est affichée.
- **Chargement à la demande** : `createEngine` est importé dynamiquement par les pages Tool. Three.js et le moteur forment un paquet séparé.
- **Un seul canvas**, créé une fois, puis déplacé dans la zone centrale de la page Motif ou Illustration affichée.
- **Réglages** : une table déclarative (`controls.ts`), vérifiée par un test contre les appels `slider(…)`, `toggle(…)` et `seg(…)` du prototype : mêmes clés, mêmes bornes, même pas.
- **Rendu identique** : Playwright ouvre le prototype et l'appli avec la même graine de hasard (`Math.random` remplacé) et une horloge figée (`page.clock`), même taille de scène, puis compare les pixels du canvas.

## Graphe des dépendances

```
1 Extraction + identité
└── 2 Couche d'adaptation + Motif affiché
    └── 3 Rendu identique prouvé (Motif)          ── point de contrôle A
        ├── 4 Table des réglages
        │   └── 5 Composants de contrôle
        │       └── 6 Panneau Motif branché
        │           └── 7 Section Couleurs (maquette validée puis codée)   ── point de contrôle B
        └── 8 Bascule Motif ↔ Illustration
            └── 9 Images (liste, bandeau, import)
                └── 10 Panneau Illustration branché                         ── point de contrôle C
                    └── 11 Barre de scène, notifications, ⌥ H
                        └── 12 Performance, accessibilité, relecture, PR      ── point final
```

## Index des tâches

| # | Tâche | Taille | Dépend de |
|---|---|---|---|
| 1 | Extraire le bloc moteur et prouver qu'il est identique | S | — |
| 2 | Couche d'adaptation : le motif s'affiche et s'anime dans Motif | M | 1 |
| 3 | Test « rendu identique au prototype » (Motif) | M | 2 |
| ✅ | **Point de contrôle A : tu vois le motif tourner ; rendu identique prouvé** | | |
| 4 | Table des réglages reprise du prototype (+ test de concordance) | M | 3 |
| 5 | Composants : curseur, sélecteur segmenté, interrupteur (style Figma) | M | 4 |
| 6 | Panneau Motif : réglages essentiels + « Réglage avancé » | M | 5 |
| 7 | Section Couleurs : maquette à valider, puis code | M | 6 |
| ✅ | **Point de contrôle B : tu règles le motif depuis le panneau** | | |
| 8 | Bascule Motif ↔ Illustration (+ rendu identique en Illustration) | M | 3 |
| 9 | Images : liste, bandeau de vignettes, ajout, retrait, ordre | M | 8 |
| 10 | Panneau Illustration : sections Animation, Lumière et tons… | S | 6, 9 |
| ✅ | **Point de contrôle C : tu testes l'Illustration** | | |
| 11 | Barre de scène (lecture/pause, nouvelle forme R), notifications, ⌥ H | M | 10 |
| 12 | Performance, accessibilité, rendus de référence, relecture, PR | M | 11 |
| ✅ | **Point final : les 10 critères de la spec sont remplis** | | |

## Risques

| Risque | Impact | Parade |
|---|---|---|
| Le bloc attend des noms définis plus loin dans le prototype (interface) | Élevé | Liste automatique des noms manquants (tâche 1). Un test vérifie que la couche les fournit tous (tâche 2) |
| Effets de bord du bloc sur la page : écoute du défilement de la fenêtre, éléments ajoutés au `body` | Moyen | Repérés en tâche 2. Neutralisés **dans la couche** (éléments fournis), jamais dans le bloc |
| Rendu légèrement différent (GPU, densité de pixels, version de Three.js) | Moyen | Même version r128, densité de pixels fixée dans le test, seuil de 0,1 %. Tout écart est montré avant d'être accepté |
| Exécution non stricte (`new Function`) refusée par la sécurité en ligne | Faible | Noté pour `/ship` (autorisation `unsafe-eval`) |
| Poids : Three.js ≈ 600 ko | Faible | Chargé seulement sur les pages Tool |
| La section Couleurs n'a pas de maquette | Faible | Maquette montrée et validée avant le code (tâche 7) |

## Hors de cette partie

L'export, les préréglages partagés (avec `data-store`), le Layout editor et la mise en ligne.
