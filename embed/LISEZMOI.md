# Co-labs · intégration sur un site

Deux scripts pour afficher les visuels Co-labs, animés et interactifs, sur un site. Chacun est un dossier
autonome : un fichier JavaScript, un configurateur, des exemples et son mode d’emploi.

| Dossier | Ce qu’il affiche | Balise |
|---|---|---|
| `colabs-motif/` | Le motif (ruban de particules), forme A ou B, orientation, couleurs, survol. | `<colabs-motif>` |
| `colabs-illustration/` | Les illustrations (Prisme, ADN, Oscilloscope…), l’une après l’autre, branchables sur une barre de temps et des clics. | `<colabs-illustration>` |

## Quoi envoyer au développeur

1. Le dossier du script voulu (ou les deux), **en entier**.
2. Le code réglé dans son configurateur (bouton « Copier le code »), à coller dans le message.

Tout le reste est expliqué dans le `LISEZMOI.md` de chaque dossier.

## Ouvrir un configurateur

Dans un terminal, dans le dossier voulu :

```bash
npx serve .
```

Puis ouvrir l’adresse affichée suivie de `/configurateur.html`.

## À savoir

- **Un seul moteur par page** : une page affiche soit un motif, soit une illustration.
- Les scripts n’affichent que le visuel : pas de boutons, pas de barre de temps. Le site construit son interface et
  s’y branche (voir les exemples).
- Rien n’est enregistré chez le visiteur.
