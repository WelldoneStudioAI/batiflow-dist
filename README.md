# batiflow-dist
BatiFlow — distribution Mac (appcast Sparkle + binaires). Source privé ailleurs.

## Outils proposés

- [`outils/web-constats`](outils/web-constats/) — **pont Excel → BatiFlow** : on
  téléverse un chiffrier `.xlsx`/`.csv` de constats, on le contrôle à l'écran
  (priorités BSI, coûts, photos), et on exporte un **dossier BSI** prêt à ouvrir dans
  BatiFlow. Lecture entièrement dans le navigateur ; côté app, un lecteur Swift ajouté
  au projet suffit — le BSI existant n'est pas touché.
- [`outils/import-constats-excel`](outils/import-constats-excel/) — module Swift
  autonome pour le BSI : importe un chiffrier `.xlsx`/`.csv` de constats et les
  affiche comme s'ils avaient été saisis avec l'outil terrain iOS (titre,
  description, recommandation, occurrence, prix, gravité, photo). À déposer dans
  le projet privé ; voir son README pour l'intégration.
