# Format `batiflow.bsi.dossier` — version 1

Ce que la web app produit et ce que BatiFlow lit. Un dossier est une archive `.zip` :

```
<nom-du-chiffrier>-bsi.zip
├── bsi.json          ← le manifeste : la seule pièce que BatiFlow doit lire
├── photos/           ← les photos retrouvées sur le poste, telles quelles
│   ├── IMG_0001.jpeg
│   └── IMG_0002.jpeg
├── constats.csv      ← les mêmes constats en tableau (Excel, Numbers)
├── rapport.txt       ← lignes lues, décisions automatiques, avertissements
└── LISEZMOI.md       ← ce que contient le dossier, en clair
```

Les entrées sont **stockées sans compression** : n'importe quel lecteur ZIP les ouvre,
`MiniZip` inclus.

## `bsi.json`

```jsonc
{
  "format": "batiflow.bsi.dossier",
  "version": 1,
  "genereLe": "2026-09-18T13:37:32.000Z",
  "genereAvec": "Constats du chiffrier (web)",

  "source": {                       // d'où viennent les constats
    "fichier": "PDC-2020_constats-exterieurs.xlsx",
    "feuille": "Extérieur",
    "lignesLues": 139,
    "lignesIgnorees": 9
  },

  "dossier": {
    "nom": "PDC-2020_constats-exterieurs",
    "nombreConstats": 130,
    "totalRetenu": 2886715,
    "devise": "CAD",
    "photosIncluses": 7
  },

  "priorites": [                    // la légende, pour l'affichage
    { "code": "U",  "libelle": "Urgent",      "precision": "Urgent",       "rang": 1 },
    { "code": "CT", "libelle": "Court terme", "precision": "D'ici 1 an",   "rang": 2 }
    // … MT, LT, LT+, EX, CO
  ],

  "constats": [
    {
      "id": "c2-0",
      "ligneSource": 2,                       // ligne dans le chiffrier d'origine
      "titre": "La margelle existante est endommagée…",
      "description": "…",                     // null si absente
      "recommandation": "…",                  // null si absente

      "priorite": { "code": "U", "libelle": "Urgent", "precision": "Urgent", "rang": 1 },
      "graviteTexte": null,                   // « Majeur », « Modéré »… si le chiffrier
                                              // n'a pas de code de priorité
      "cotationOrigine": "U",                 // la cellule telle qu'écrite

      "quantite": 26,
      "unite": "u.",                          // « u. », « pi2 », « pi lin »… ou null
      "prixUnitaire": 650,
      "coutChiffrier": 13000,                 // la colonne « Coût ($) » du rapport
      "coutCalcule": 16900,                   // quantité × prix unitaire
      "coutRetenu": 13000,                    // ce qui fait foi
      "ecartDeCout": true,                    // les deux montants diffèrent

      "categorie": "Mur de fondation",
      "localisation": "façade avant",
      "statut": "NC",                         // le texte du coin droit du bandeau
      "modifieDansLOutil": true,              // la ligne a été retouchée avant l'export

      "photos": [
        { "statut": "incluse",     "fichier": "photos/IMG_0001.jpeg", "nomOrigine": "IMG_0001.jpeg" },
        { "statut": "distante",    "url": "https://…/photo.jpg" },
        { "statut": "introuvable", "nomOrigine": "IMG_0009.jpeg" }
      ],

      "autresColonnes": {                     // tout ce que le chiffrier portait en plus
        "Page PDF": "24",
        "Section": "Composantes structurales",
        "Bâtiment": "100-110"
      }
    }
  ],

  "lectureAutomatique": [ "« Coût ($) » lue comme coût total du chiffrier" ],
  "avertissements": [ { "ligne": 2, "message": "le coût du chiffrier (13 000,00 $) diffère de…" } ]
}
```

## Règles que BatiFlow peut tenir pour acquises

- **`coutRetenu` fait foi.** C'est le montant du chiffrier quand la colonne existe,
  sinon quantité × prix unitaire. Les deux autres montants restent présents pour
  l'audit ; `ecartDeCout` dit s'ils divergent.
- **`priorite.code` est le classement.** Ce n'est pas un degré de gravité : `EX` est une
  expertise à commander, `CO` un entretien suggéré. Ne pas les ranger sur une échelle
  mineur → critique.
- **`graviteTexte` et `priorite` s'excluent.** Un chiffrier a l'un ou l'autre.
- **Tout champ peut être `null`** sauf `id`, `ligneSource`, `titre` et `photos`.
- **Les montants sont des nombres**, en dollars canadiens, sans séparateur ni symbole.
- **`photos[].fichier`** est un chemin relatif à la racine de l'archive.
- **`autresColonnes`** est libre : ce sont les colonnes du chiffrier qu'aucun champ
  du BSI ne réclamait. À afficher telles quelles, jamais à interpréter.

## Lire le dossier dans BatiFlow

Le lecteur Swift est écrit et versionné :
[`../import-constats-excel/Sources/BSIConstatsImport/DossierBatiFlow.swift`](../import-constats-excel/Sources/BSIConstatsImport/DossierBatiFlow.swift).

```swift
let resultat = try LecteurDossierBatiFlow.lire(
    archive: url,
    extrairePhotosVers: dossierDuMandat.appendingPathComponent("photos"))

print(resultat.manifeste.dossier.nombreConstats)   // 130
bsi.ajouterConstats(resultat.constats.map(Constat.init(importe:)))
```

C'est un ajout : aucune ligne du BSI existant n'est touchée.

## Faire évoluer le format

`version` s'incrémente dès qu'un champ change de sens ou disparaît. Un champ ajouté ne
casse rien : les lecteurs ignorent ce qu'ils ne connaissent pas. Le lecteur Swift refuse
une version plus récente que celle qu'il connaît, avec un message qui invite à mettre
BatiFlow à jour — plutôt que d'importer à moitié.
