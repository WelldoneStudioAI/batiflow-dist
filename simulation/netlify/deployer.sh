#!/usr/bin/env bash
# Déploie l'Essai BatiFlow sur un site Netlify SÉPARÉ (jamais la vitrine batiflow.app).
#   ./deployer.sh /chemin/vers/batiflow-app/BatiFlow/Resources/aibq_banque.json
# 1re fois : ouvre la connexion Netlify, crée le site « essai-batiflow » (ou NOM_SITE=…),
# puis demande la clé Anthropic (ESSAI_ANTHROPIC_KEY) sans l'afficher. Ensuite : reconstruit et redéploie.
set -euo pipefail
cd "$(dirname "$0")"
BANQUE="${1:-}"
[ -f "$BANQUE" ] || { echo "Usage : ./deployer.sh /chemin/vers/aibq_banque.json (dépôt privé batiflow-app)"; exit 1; }
NL="npx --yes netlify-cli@27.14.1"

echo "▸ Construction de la page et de la banque serveur"
python3 ../src/build.py --netlify "$BANQUE"
npm install --no-audit --no-fund --silent

if [ ! -f .netlify/state.json ]; then
  $NL login
  echo "▸ Création du site Netlify ${NOM_SITE:-essai-batiflow}"
  $NL sites:create --name "${NOM_SITE:-essai-batiflow}"
fi

# Clé à nous (ESSAI_ANTHROPIC_KEY), jamais la passerelle IA de Netlify (voir functions/rediger.mjs).
if ! $NL env:list --json 2>/dev/null | grep -q '"ESSAI_ANTHROPIC_KEY"'; then
  read -rsp "▸ Colle la clé Anthropic (ESSAI_ANTHROPIC_KEY, rien ne s'affiche) puis Entrée : " CLE; echo
  $NL env:set ESSAI_ANTHROPIC_KEY "$CLE" --secret >/dev/null; unset CLE
fi

echo "▸ Déploiement en production"
$NL deploy --prod --dir public --functions functions
