# Brandhub Co-labs — Règles de travail

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
