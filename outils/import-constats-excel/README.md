# Import de constats depuis un chiffrier — module pour le BSI

Outil proposé pour BatiFlow Mac : **ouvrir un chiffrier Excel de constats et les
voir comme s'ils avaient été saisis avec l'outil terrain iOS**, puis les verser
dans le BSI.

> Le code source de BatiFlow est privé et n'est pas dans ce dépôt. Le module est
> donc livré ici comme **paquet Swift autonome, prêt à être déposé dans le projet**,
> avec sa spec, son gabarit Excel et ses tests. Il n'a pas pu être compilé dans
> l'environnement de travail (aucune chaîne Swift disponible) : la première
> compilation se fera dans Xcode, côté projet privé.

---

## Ce que ça donne

```
BSI ▸ Constats ▸ Importer un chiffrier…       (ou glisser-déposer un .xlsx)
        │
        ├─ lecture du fichier, détection de la feuille et des colonnes
        ├─ feuille de mappage (seulement si une colonne manque)
        └─ fenêtre « Constats du chiffrier »
              ┌──────────────────────┬────────────────────────────────┐
              │ ● Fissure fondation  │  [ photo ]                     │
              │   Majeure ×2 2 469 $ │  Fissure verticale en fondation│
              │ ● Bardeaux soulevés  │  ● Majeure  Structure  Sous-sol│
              │   Modérée 1 200 $    │  Description …                 │
              │ ● Garde-corps absent │  Recommandation …              │
              │   Critique 1 750 $   │  Occurrence 2 │ 1 234,56 $ │ … │
              └──────────────────────┴────────────────────────────────┘
              4 constats  ●2 ●1 ●1        Total estimé 5 419,12 $
                                          [ Importer dans le BSI ]
```

La fiche de droite reprend la mise en page de l'outil terrain : photo d'abord,
titre + pastille de gravité, description, recommandation, puis le bloc chiffré
(occurrence × prix unitaire = total). Même échelle de gravité, mêmes couleurs.

## Contenu livré

```
outils/import-constats-excel/
├── SPEC.md                                 spec fonctionnelle (colonnes, normalisation, limites)
├── Package.swift                            paquet Swift, macOS 14+, zéro dépendance externe
├── Sources/
│   ├── BSIConstatsImport/                   lecture et normalisation (sans SwiftUI, testable seul)
│   │   ├── Constat.swift                    ConstatImporte, ReferencePhoto
│   │   ├── Gravite.swift                    échelle 5 niveaux + interprétation du texte
│   │   ├── ValueParsing.swift               « 1 234,56 $ », « x3 », « 14 unités »
│   │   ├── NormalisationTexte.swift         clés sans accent, nettoyage des cellules
│   │   ├── MappageColonnes.swift            détection automatique des en-têtes FR/EN
│   │   ├── MemoireMappage.swift             mémorise le mappage par format de chiffrier
│   │   ├── MiniZip.swift                    lecteur ZIP minimal (Compression, sans processus externe)
│   │   ├── LecteurXLSX.swift                feuilles, chaînes partagées, hyperliens
│   │   ├── LecteurCSV.swift                 CSV/TSV tolérant (guillemets, BOM, CP1252)
│   │   ├── FeuilleBrute.swift               contenu brut d'une feuille
│   │   ├── ResolveurPhotos.swift            URL, chemin, nom de fichier, hyperlien
│   │   └── ImportateurConstats.swift        orchestration + rapport d'import
│   └── BSIConstatsImportUI/                 fenêtre et vues
│       ├── FenetreImportConstats.swift      la fenêtre complète (point d'entrée)
│       ├── ModeleFenetreImport.swift        état, filtres, tri, totaux
│       ├── ListeConstatsView.swift          liste de gauche
│       ├── FicheConstatView.swift           fiche façon outil terrain
│       ├── BadgeGravite.swift               pastilles et couleurs
│       ├── VuePhotoConstat.swift            photo locale / distante / introuvable
│       ├── FeuilleMappage.swift             ajustement des colonnes
│       └── VueRapportImport.swift           rapport et avertissements
├── Tests/BSIConstatsImportTests/            tests unitaires + de bout en bout
└── Gabarit/
    ├── gabarit-constats-bsi.xlsx            gabarit à remettre aux collaborateurs
    ├── exemple-constats.csv                 exemple volontairement irrégulier
    └── generer-gabarit.py                   régénère gabarit, exemple et fixtures
```

## Intégration dans BatiFlow (4 étapes)

**1. Ajouter le paquet.** Copier `outils/import-constats-excel` dans le dépôt privé
(par exemple sous `Modules/`), puis dans Xcode : *File ▸ Add Package Dependencies ▸
Add Local…* et lier les deux produits `BSIConstatsImport` et `BSIConstatsImportUI`
à la cible Mac.

**2. Déclarer la fenêtre** dans l'`App` :

```swift
import BSIConstatsImportUI

@main
struct BatiFlowApp: App {
    @Environment(\.openWindow) private var ouvrirFenetre

    var body: some Scene {
        // … les scènes existantes …

        Window("Constats du chiffrier", id: "import-constats") {
            FenetreImportConstats { constats in
                ConstatsImportBridge.verser(constats)   // voir étape 4
            }
        }
        .defaultSize(width: 1100, height: 720)
    }
}
```

**3. Ajouter la commande de menu** là où vivent les actions du BSI :

```swift
Button("Importer un chiffrier de constats…") {
    ouvrirFenetre(id: "import-constats")
}
.keyboardShortcut("i", modifiers: [.command, .shift])
```

**4. Écrire l'adaptateur** vers le modèle de constat du BSI — seul point à
brancher sur le code privé :

```swift
import BSIConstatsImport

enum ConstatsImportBridge {
    static func verser(_ importes: [ConstatImporte]) {
        let constats = importes.map { importe in
            Constat(                             // le modèle interne du BSI
                titre: importe.titre,
                description: importe.description ?? "",
                recommandation: importe.recommandation ?? "",
                occurrence: importe.occurrence,
                prixUnitaire: importe.prixUnitaire,
                gravite: importe.gravite.map(Constat.Gravite.init(niveau:)),
                localisation: importe.localisation,
                photos: importe.photos.compactMap(\.url),
                source: .chiffrier                // pour distinguer du relevé terrain
            )
        }
        BSIStore.shared.ajouterConstats(constats)
    }
}
```

Recommandation : marquer les constats importés (`source = .chiffrier`) afin qu'ils
restent distinguables de ceux saisis sur le terrain, et laisser la fusion à
l'humain plutôt que de dédoublonner automatiquement.

### Bac à sable et droits d'accès

- Le module n'exécute **aucun processus externe** (le ZIP est lu en interne via le
  framework `Compression`) : rien à ajouter côté durcissement.
- Il faut l'accès aux fichiers choisis par l'utilisateur :
  `com.apple.security.files.user-selected.read-only`.
- Le dossier de photos étant choisi via `NSOpenPanel`, conserver un **signet
  security-scoped** si l'on veut que le choix survive au redémarrage
  (`com.apple.security.files.bookmarks.app-scope`).
- Le chargement d'images distantes exige `com.apple.security.network.client`.

## Formats acceptés

- **`.xlsx` / `.xlsm`** : feuilles multiples, chaînes partagées, chaînes en ligne,
  valeurs de formules, **hyperliens de cellule** (un lien « photo » derrière le mot
  « voir » est correctement suivi).
- **`.csv` / `.tsv`** : séparateur détecté (`;`, `,`, tabulation, `|`), guillemets,
  retours de ligne dans les champs, UTF-8 avec ou sans BOM, repli Windows-1252.

Colonnes reconnues, synonymes, normalisation des gravités et des montants :
voir [SPEC.md](SPEC.md). Seule la colonne **Titre** est obligatoire.

## Gabarit à remettre aux collaborateurs

`Gabarit/gabarit-constats-bsi.xlsx` contient les neuf en-têtes attendus et trois
constats d'exemple. Un chiffrier bâti sur ce gabarit s'importe sans aucune
configuration. Pour le régénérer (ou régénérer les fixtures de test) :

```bash
python3 Gabarit/generer-gabarit.py
```

## Tests

```bash
cd outils/import-constats-excel && swift test
```

Couvert : montants québécois et anglo-saxons, occurrences textuelles, échelle de
gravité (y compris inversée), détection des en-têtes approchants, CSV avec
guillemets et retours de ligne, lecture XLSX (références de cellules, feuille,
hyperliens), résolution de photos par nom insensible à la casse, et un import de
bout en bout sur un chiffrier volontairement irrégulier (titre manquant, prix
« à valider », ligne vide, gravité numérique, photo en hyperlien) qui doit
produire 4 constats, 1 ligne ignorée et 3 avertissements.

## Limites connues

- Les images **incorporées** dans les cellules (objets flottants Excel) ne sont pas
  extraites — seulement les liens et les fichiers. Extensible en v2 via
  `xl/media/` + `drawing1.xml`.
- Les dates reviennent sous forme de nombre de série Excel (aucun champ date n'est
  utilisé par l'outil aujourd'hui).
- Pas de synchronisation bidirectionnelle : le chiffrier n'est jamais réécrit.
- ZIP chiffrés ou classeurs protégés par mot de passe : non pris en charge.
