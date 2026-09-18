# batiflow-dist
BatiFlow — distribution Mac (appcast Sparkle + binaires). Source privé ailleurs.

## Outils proposés

- [`outils/web-constats`](outils/web-constats/) — **web app autonome** : ouvre un
  chiffrier `.xlsx`/`.csv` de constats et les affiche comme sur le terrain (priorités
  BSI, coûts, photos). Lecture entièrement dans le navigateur, aucun lien avec
  BatiFlow, donc aucun risque de régression.
- [`outils/import-constats-excel`](outils/import-constats-excel/) — module Swift
  autonome pour le BSI : importe un chiffrier `.xlsx`/`.csv` de constats et les
  affiche comme s'ils avaient été saisis avec l'outil terrain iOS (titre,
  description, recommandation, occurrence, prix, gravité, photo). À déposer dans
  le projet privé ; voir son README pour l'intégration.
