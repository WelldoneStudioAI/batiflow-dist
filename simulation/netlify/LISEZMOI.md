# Essai BatiFlow — déploiement Netlify

Site séparé de inspecteur.expert. La page (`public/index.html`) est la simulation de l'onglet caméra ;
la banque AIBQ et la clé Anthropic restent côté serveur, dans deux fonctions :

| Route | Rôle |
|---|---|
| `GET /api/banque?sub=…` / `?q=…` | Top 10 d'une sous-section, ou recherche (12 résultats au plus) |
| `POST /api/rediger` | Constat rédigé par Claude dans le style de la banque ; repli sur le thème le plus proche si l'IA ne répond pas en 8,5 s |

`donnees/banque.json` est produit au déploiement depuis le dépôt **privé** `batiflow-app` et n'est jamais commité
(ce dépôt est public).

## Déployer (Mac)

```bash
./deployer.sh ~/…/batiflow-app/BatiFlow/Resources/aibq_banque.json
```

La 1re fois : connexion Netlify dans le navigateur, création du site `essai-batiflow` (ou `NOM_SITE=… ./deployer.sh …`),
puis la clé `ANTHROPIC_API_KEY` est demandée sans s'afficher. Les fois suivantes : reconstruit et redéploie.

Réglages : variable `MODELE_IA` (défaut `claude-opus-5-5`). Débit : 20 rédactions par heure et par adresse IP,
240 recherches par 10 min. Fixer aussi un plafond de dépenses dans la console Anthropic.
