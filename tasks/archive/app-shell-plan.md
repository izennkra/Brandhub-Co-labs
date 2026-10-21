# Plan de construction : `app-shell` (structure globale)

> Statut : **à valider**. Spec : `SPEC-app-shell.md` (validée). Liste détaillée des tâches : `tasks/todo.md`.

## En bref

On construit le cadre de l'application en 10 petites étapes, dans un ordre où chaque étape laisse l'appli en état de marche. La première étape vraiment risquée, l'harmonisation des valeurs du Figma, arrive tôt et passe par ta validation avant tout code d'interface.

## Décisions techniques

- **Application d'une seule page** (Vite + React + TypeScript). Toute l'appli tourne dans le navigateur ; le moteur 3D n'a pas besoin de serveur.
- **Deux gabarits de page** :
  - `ToolLayout` pour `/outils/*` : zone centrale + panneau Éditeur à droite ;
  - `ResourceLayout` pour `/ressources/*` : zone de contenu + icône de panneau + bouton de téléchargement.
  
  Les deux partagent la même colonne de gauche.
- **Adresses en français** : `/outils/motif`, `/outils/illustration`, `/outils/layout-editor`, `/ressources/logo`, `/ressources/typographie`, `/ressources/couleur`, `/ressources/iconographie`, `/ressources/imagerie`, `/ressources/patterns`, `/ressources/inspiration`. L'accueil redirige vers `/outils/motif`.
- **Passage Tool ↔ Ressource** : on revient sur la dernière page visitée dans chaque section (sinon sur la première).
- **Styles** : CSS Modules + `tokens.css`, qui est le seul endroit contenant des valeurs.
- **Icônes** : `Icon.tsx` avec un registre local d'icônes Central copiées une par une depuis l'API VisualSystem, et une échelle de tailles (`sm`, `md`, `lg`…) qui fixe aussi l'épaisseur du trait.
- **Feedback** supprimé. **Mobile** : repli simple de la colonne de gauche.

## Graphe des dépendances

```
1 Projet de base
├── 2 Relevé et harmonisation des valeurs Figma ──(validation)──┐
│                                                               ├── 3 tokens.css
│                                                               └── 4 Icon.tsx
│                                    3 + 4 ──→ 5 Navigation Tool
│                                               └── 6 Navigation Ressource
│                                                    ├── 7 Panneau Éditeur (pages Tool)
│                                                    └── 8 Habillage des pages Ressource
│                                                         └── 9 Petits écrans, clavier, accessibilité
│                                                              └── 10 Comparaison avec le Figma et relecture
```

## Index des tâches

| # | Tâche | Taille | Dépend de |
|---|---|---|---|
| 1 | Projet de base qui démarre, avec tests et vérifications | M | — |
| 2 | Relevé des valeurs du Figma + tableau d'harmonisation (pas de code) | S | 1 |
| ✅ | **Point de contrôle A : tu valides le tableau** | | |
| 3 | Fichier de tokens + polices + garde-fou « pas de couleur en dur » | S | 2 |
| 4 | Composant `Icon.tsx` + échelle de tailles + premières icônes | M | 2 |
| 5 | Navigation : colonne de gauche + 3 pages Tool | M | 3, 4 |
| 6 | Navigation : sélecteur Tool / Ressource + 7 pages Ressource | M | 5 |
| ✅ | **Point de contrôle B : tu testes la navigation** | | |
| 7 | Panneau « Éditeur » repliable avec sections accordéon (pages Tool) | M | 6 |
| 8 | Habillage des pages Ressource : icône de panneau + bouton de téléchargement | S | 6 |
| 9 | Petits écrans, navigation au clavier, focus et contrastes | S | 7, 8 |
| 10 | Comparaison avec le Figma à 1440 px, corrections et relecture (`/review`) | M | 9 |
| ✅ | **Point de contrôle final : tous les critères de la spec sont remplis** | | |

Les tâches 3 et 4, puis 7 et 8, sont indépendantes. Elles peuvent être faites dans n'importe quel ordre, mais elles se feront une par une pour garder des commits clairs.

## Risques

| Risque | Impact | Parade |
|---|---|---|
| Les valeurs du Figma sont irrégulières | Moyen | Tâche 2 : tableau d'harmonisation validé avant tout code d'interface |
| Le set Central n'est pas disponible dans l'API, ou sa licence pose problème | Moyen | Vérifié dès la tâche 4 ; si besoin, on s'arrête et on te demande (pas de changement de set sans accord) |
| Les polices du Figma ne sont pas libres d'utilisation sur le web | Moyen | Relevées en tâche 2 ; on te demande avant d'en ajouter une |
| Les gris clairs du Figma n'ont pas assez de contraste | Faible | Signalés dans le tableau de la tâche 2, corrigés seulement avec ton accord |
| Les écrans Ressource du Figma mélangent maquettes et captures d'autres marques | Faible | Ici on ne fait que le cadre ; l'intérieur des pages est traité dans `resources` |

## Hors de cette partie

Le moteur de patterns, le stockage, le mot de passe éditeur, le contenu des pages Ressource, le Layout editor et la mise en ligne sur Vercel.
