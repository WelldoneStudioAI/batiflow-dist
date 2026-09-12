#!/usr/bin/env bash
# Télécharge localement les fontes utilisées par le rendu PDF (Inter + Source Serif 4)
# et réécrit les URL de fonts.css vers des chemins relatifs.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts && cd fonts
: > css.txt
for spec in \
  "Inter:wght@400;500;600;700" \
  "Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400"
do
  curl -sS -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36" \
    "https://fonts.googleapis.com/css2?family=$spec&display=swap" >> css.txt
  echo >> css.txt
done
cp css.txt fonts.css
for u in $(grep -o "https://fonts.gstatic.com[^)]*" css.txt | sort -u); do
  n=$(basename "$u"); curl -sS -o "$n" "$u"
  sed -i "s|$u|fonts/$n|g" fonts.css
done
echo "Fontes installées dans $(pwd)"
