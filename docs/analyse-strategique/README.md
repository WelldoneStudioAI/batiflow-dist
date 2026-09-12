# BatiFlow — Analyse juridique, stratégique et commerciale (v2.0)

Dossier de décision portant sur la création d'une offre post-inspection au Québec :
Plan d'investissement de la propriété et normalisation des soumissions d'entrepreneurs.

Version augmentée du document de travail du 11 septembre 2026 : le contenu d'origine
est conservé intégralement et enrichi de neuf parties, d'un registre des risques, d'un
modèle économique chiffré, de portes de décision et de huit annexes.

## Livrables

| Fichier | Description |
| --- | --- |
| `BatiFlow_Analyse_Juridique_Strategique_Commerciale_v2.pdf` | Document imprimable, 51 pages, A4. |
| `batiflow_web.html` | Édition web autonome (navigation latérale, thèmes clair et sombre). |

## Structure des sources

Le document est écrit en HTML sémantique puis composé en PDF par Chromium.

```
src/
  00_cover.html      Couverture (rendue sans marges ni en-têtes)
  01_preamble.html   Statut, portée et limites
  02_toc.html        Table des matières (pagination résolue automatiquement)
  03_exec.html       Sommaire exécutif
  part03.html        Décisions demandées + Partie I
  part04.html        Partie II  — faisabilité réglementaire
  part05.html        Partie III — marché et positionnement
  part06.html        Partie IV  — prix et modèle économique
  part07.html        Partie V   — mise en marché
  part08.html        Parties VI et VII — opérations, risques et gouvernance
  part09.html        Parties VIII et IX — déploiement et tableau de bord
  part10.html        Annexes A à H
  style.css          Feuille de style impression (A4)
  web.css            Feuille de style écran
  build.py           Composition du PDF
  make_web.py        Composition de l'édition web
  fetch_fonts.sh     Récupération locale des fontes
```

## Reconstruire

```bash
pip install playwright pypdf
cd src && ./fetch_fonts.sh
python3 build.py      # → BatiFlow_Analyse_Juridique_Strategique_Commerciale_v2.pdf
python3 make_web.py   # → batiflow_web.html
```

`build.py` effectue deux passes de rendu : la première mesure la position réelle de
chaque section dans le PDF, la seconde injecte les numéros de page dans la table des
matières. Le binaire Chromium est indiqué par `executable_path` dans `build.py`.

## Convention de lecture

Trois registres de données coexistent dans le document et sont signalés distinctement :
données sourcées (référence `[n]` en annexe G), hypothèses de travail (marqueur
« Hypothèse ») et positions recommandées (encadrés). Aucune projection financière ne
constitue une prévision.

> Ce document ne remplace ni un avis juridique formel ni une confirmation de couverture
> d'assurance.
