# Essai BatiFlow — déploiement Netlify

Adresse publique visée : **essai.batiflow.app** (voir `../vitrine/LISEZMOI.md` pour le domaine et la section du site).

Site séparé de la vitrine batiflow.app. La page (`public/index.html`) est la simulation de l'onglet caméra ;
la banque AIBQ et la clé Anthropic restent côté serveur, dans deux fonctions :

| Route | Rôle |
|---|---|
| `GET /api/banque?sub=…` / `?q=…` | Top 10 d'une sous-section, ou recherche (12 résultats au plus) — **titres seulement** |
| `GET /api/theme?t=…` | Le texte d'**un** thème choisi (30 par heure et par adresse IP) |
| `POST /api/rediger` | Constat rédigé par Claude dans le style de la banque ; repli sur le thème le plus proche si l'IA ne répond pas en 8,5 s |

`donnees/banque.json` est produit au déploiement depuis le dépôt **privé** `batiflow-app` et n'est jamais commité
(ce dépôt est public).

## Déployer (Mac)

```bash
./deployer.sh ~/…/batiflow-app/BatiFlow/Resources/aibq_banque.json
```

La 1re fois : connexion Netlify dans le navigateur, création du site `essai-batiflow` (ou `NOM_SITE=… ./deployer.sh …`),
puis la clé Anthropic est demandée sans s'afficher et posée en secret sous `ESSAI_ANTHROPIC_KEY`. Les fois suivantes : reconstruit et redéploie.

Réglages : variable `MODELE_IA` (défaut `claude-opus-5-5`). Débit : 20 rédactions et 30 thèmes par heure et par adresse IP,
240 recherches par 10 min. Ces plafonds vivent en mémoire de chaque fonction : ils freinent, ils ne garantissent rien. Fixer aussi un plafond de dépenses dans la console Anthropic.

**Jamais la passerelle IA de Netlify.** Sur un forfait à crédits, Netlify injecte `ANTHROPIC_API_KEY` et se paie en crédits ;
crédits à zéro = tous les sites de l'équipe en pause. La fonction lit donc `ESSAI_ANTHROPIC_KEY` et vise `api.anthropic.com` ;
sans cette variable, l'essai répond avec la banque (`"src":"banque"`), sans IA.
