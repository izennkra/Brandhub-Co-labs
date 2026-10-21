# Brandhub Co-labs — Règles de travail

App web de hub de marque (logos, couleurs, typos, icônes, patterns) avec un moteur de génération de patterns.

- Stack : React + TypeScript, hébergé sur Vercel (choix validé, détails dans la spec `app-shell`)
- Figma : `[lien à fournir]`
- Prototype HTML (outil complet + moteur) : `reference/prototype.html`
- Carte des parties et ordre de construction : `CAPABILITY-MAP.md`

## Communication
- Je ne suis pas développeur : explique simplement ce que tu fais, en français, sans jargon inutile.
- Avant une étape importante, dis en une phrase ce que tu vas faire et pourquoi.

## Git et GitHub
- Travaille sur une branche par fonctionnalité (ex. `feature/page-accueil`), jamais directement sur `main`.
- Fais un commit clair après chaque étape qui fonctionne (message qui dit ce qui a changé).
- À la fin de chaque tâche, push la branche sur GitHub et propose-moi d'ouvrir une pull request.

## Méthode (Agent Skills d'Addy Osmani)
Les skills sont dans `.claude/skills/`, les commandes dans `.claude/commands/`.
- **Spec avant de coder** : commence par `/spec` (skill `spec-driven-development`), puis `/plan` pour découper en petites étapes.
- **Construire** : `/build` pour avancer étape par étape.
- **Tests** : `/test` (skill `test-driven-development`) — chaque fonctionnalité est vérifiée par des tests.
- **Review** : `/review` (skill `code-review-and-quality`) avant de proposer la pull request.
- Avant une mise en ligne : `/ship`.

## Règles clés du projet

1. **Moteur de patterns : NE PAS TOUCHER.** Validé par le client. Ni modification, ni refactor, ni optimisation. L'intégrer tel quel (wrapper isolé dans `src/lib/pattern-engine/`), avec un rendu identique au prototype. En cas de blocage, s'arrêter et demander.
2. **Le reste de l'outil est challengeable** (UX, fonctionnalités, architecture). Proposer les améliorations, mais ne rien implémenter sans validation.
3. **Le Figma fait foi pour le design.** Utiliser le MCP Figma pour récupérer le design. Centraliser les tokens dans un seul fichier.
4. **Pages absentes du Figma :** c'est à Claude de les concevoir, à partir des références et dans le style du Figma (tokens, composants). Les références sont de préférence dans le Figma, page « Références », un frame par page nommé `Section / Page` (ex. `Ressources / Typographie`) ; sinon dans `reference/pages/<page>/`. Proposer le design et le faire valider avant de coder. S'il n'y a aucune référence pour une page, la demander ; en attendant, mettre un placeholder `TODO: design à venir`.
5. **En cas de doute, demander** plutôt que supposer. Faire valider un plan avant toute tâche non triviale.

## Icônes — VisualSystem Icon

Guide : https://visual.systems/modules/icon/llms.txt · Source : https://visual.systems/api/modules/icon/example.tsx

- Lire le guide et la source avant d'implémenter, puis adapter aux conventions du projet.
- Un seul composant `Icon.tsx`. Une seule famille et une seule variante, choisies une fois et notées ci-dessous.
- Ajouter les icônes une par une via l'API de recherche. Pas de librairie complète, pas de chargement au runtime.
- Utiliser `currentColor`. Mettre un `aria-label` sur les boutons icône seule et `aria-hidden` sur les icônes décoratives. Le contrôle parent gère le hover, le focus et l'état disabled.

| Composant | Famille | Variante | Trait |
|---|---|---|---|
| `[ ]` | `[ ]` | `[ ]` | `[ ]` |

## Autres modules VisualSystem (seulement si besoin, sur proposition)

Index : https://visual.systems/modules/llms.txt. Lire le guide d'un module seulement au moment de l'utiliser.

- **QR** : partage d'un kit de marque.
- **Typeshift** : animation de titres et de valeurs.
- **Blur** : bords de galeries scrollables.
- **Glass** : panneaux flottants.

Aucun de ces modules ne doit s'appliquer au rendu du moteur de patterns.
