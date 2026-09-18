# Constats du chiffrier — web app

Outil autonome : ouvre un chiffrier Excel de constats et les affiche comme sur le
terrain. **Aucun lien avec BatiFlow** — donc aucun risque de régression sur l'app Mac.

- **Page publiée** : https://claude.ai/artifact/NmdnVkxDZvCsHxXhwBmJBP (privée ;
  visible par vous, et par les personnes à qui vous la partagez depuis la page).
- **Source** : `app.html`, un seul fichier, sans dépendance ni compilation.

## À quoi elle sert

C'est le **pont entre un chiffrier Excel et BatiFlow** : vous téléversez le chiffrier,
vous vérifiez à l'écran, et vous exportez un **dossier BatiFlow** prêt à ouvrir dans
l'app — manifeste, photos jointes, copie CSV et rapport de lecture.

```
chiffrier .xlsx  →  [ web app : lecture, contrôle, correction ]  →  dossier-bsi.zip  →  BatiFlow
```

## Ce qu'elle fait

1. Vous déposez un `.xlsx`, `.xlsm` ou `.csv` (ou vous ouvrez l'exemple qui s'affiche
   au démarrage).
2. L'outil choisit la feuille de constats, reconnaît les colonnes, valide ses choix
   sur les valeurs, et affiche : liste à gauche, fiche à droite — photo, titre,
   étiquette de priorité, description, recommandation, quantité × prix = coût.
3. Recherche plein texte, filtre **par catégorie ou par priorité**, tri, exclusion
   ligne à ligne.
4. **La fiche est l'aperçu du rendu BatiFlow, éditable en un clic** : bandeau
   priorité + bâtiment + statut, titre, description, localisation, encart de
   recommandation, bande de photos, puis quantité × prix = coût. La localisation est
   une liste : on en ajoute, on en retire, on les corrige. Chaque champ se
   corrige sur place ; les photos s'ajoutent par glisser-déposer et se retirent d'un
   clic. Tout ce qui est corrigé part dans le dossier exporté.
5. **Dossier de photos…** : vous désignez le dossier, les photos du chiffrier sont
   retrouvées par leur nom (casse et extension indifférentes) et s'affichent.
6. **Exporter vers BatiFlow** : le dossier `.zip` est enregistré sur votre poste —
   `bsi.json` (le manifeste que BatiFlow lit), `photos/`, `constats.csv`, `rapport.txt`.
   Le manifeste seul ou le CSV seul sont aussi disponibles, et les trois formats
   restent copiables dans le presse-papiers.

## Remonter un dossier à partir du manifeste seul

`monter-dossier.py` reconstruit l'archive quand on n'a exporté que `bsi.json` et que
les photos sont restées sur le poste :

```bash
python3 monter-dossier.py bsi.json --photos ~/Photos/110 --nom "Extérieur"
```

Il rapproche chaque photo par son nom (casse et extension indifférentes), met à jour
le décompte, écrit le CSV, le rapport et le LISEZMOI, et signale les fichiers
introuvables. Le manifeste n'est pas réécrit sur le fond.

## Le dossier exporté

Format `batiflow.bsi.dossier` v1 — décrit champ par champ dans
[`FORMAT-DOSSIER.md`](FORMAT-DOSSIER.md). Côté BatiFlow, le lecteur Swift est écrit :
`LecteurDossierBatiFlow.lire(archive:extrairePhotosVers:)` rend le manifeste et les
constats prêts à insérer. C'est un ajout au projet, pas une modification du BSI
existant.

## Confidentialité

Le chiffrier est lu **dans le navigateur**. Aucun fichier, aucune photo, aucun montant
ne quitte le poste : pas de téléversement, pas de serveur, pas d'appel réseau. Seul le
mappage des colonnes est mémorisé localement (`localStorage`), pour ne pas le
redemander à chaque chiffrier du même format.

## Classement

Le **code de priorité fait foi**, tel qu'écrit dans le rapport :

| Code | Classe | Précision |
|------|--------|-----------|
| `U` | Urgent | Urgent |
| `CT` | Court terme | D'ici 1 an |
| `MT` | Moyen terme | D'ici 4 ans |
| `LT` | Long terme | D'ici 9 ans |
| `LT+` | Long terme + | 10 ans et plus |
| `EX` | Expertise | Avis d'un expert recommandé |
| `CO` | Entretien | Entretien ou amélioration suggéré |

Sept classes, sept teintes : ce ne sont pas les degrés d'une même échelle. Aucun code
n'est traduit en « gravité ». L'échelle à cinq niveaux (Critique → Observation) ne sert
qu'aux chiffriers qui écrivent la gravité en toutes lettres et n'ont pas de code.

## Règles de lecture

Identiques à celles du module Swift — voir
[`../import-constats-excel/SPEC.md`](../import-constats-excel/SPEC.md) : colonnes
reconnues et synonymes, validation par les valeurs, coût du chiffrier qui fait foi,
découpage d'un paragraphe en titre + description, résolution des photos.

## Compatibilité

Lecture des `.xlsx` par `DecompressionStream` : Safari 16.4+, Chrome, Edge, Firefox
récents — donc Mac et iPad à jour. Sur un navigateur plus ancien, l'outil le dit et
un export `.csv` fonctionne partout.

## Modifier l'outil

`app.html` contient tout : styles, balisage, lecture du classeur, interface. Le fichier
est publié tel quel ; la plateforme l'enveloppe dans un squelette HTML (d'où l'absence
de balises `<html>` et `<body>`). Un navigateur l'ouvre aussi directement par
double-clic.
