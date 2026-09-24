# Spec — Importateur de constats Excel dans le BSI

## 1. Intention

Permettre à un utilisateur du BSI d'ouvrir un chiffrier (`.xlsx` ou `.csv`) contenant
des constats rédigés hors application (Excel, Google Sheets, export d'un rapport
d'inspection) et de les **voir et manipuler exactement comme s'ils avaient été
saisis avec l'outil terrain iOS** : même vocabulaire, même hiérarchie visuelle,
même badge de gravité, même bloc photo.

Le chiffrier n'est jamais la source de vérité : il est *lu*, *normalisé*,
*présenté pour validation*, puis *versé* dans le BSI. Le fichier d'origine n'est
pas modifié.

## 2. Parcours utilisateur

1. **BSI → Constats → Importer un chiffrier…** (ou glisser-déposer un fichier sur
   la liste des constats).
2. L'outil lit le fichier, choisit la feuille, détecte la ligne d'en-têtes, propose
   un **mappage des colonnes** puis le valide sur les valeurs.
3. La feuille de mappage s'ouvre **seulement si** une colonne obligatoire n'a pas
   été reconnue, ou si l'utilisateur clique « Ajuster les colonnes ».
4. **Fenêtre des constats** : liste à gauche, fiche détaillée à droite, façon outil
   terrain. Recherche, filtre par gravité, tri, totaux en pied de fenêtre.
5. **Importer dans le BSI** verse les constats retenus (tous par défaut ; une ligne
   douteuse peut être décochée).

## 3. Colonnes reconnues

La détection normalise l'en-tête (minuscules, accents retirés, ponctuation retirée)
puis, dans l'ordre : égalité stricte, en-tête *commençant par* un synonyme, synonyme
présent comme mot entier.

| Champ BSI        | Requis | En-têtes reconnus (extraits)                                                              |
|------------------|--------|-------------------------------------------------------------------------------------------|
| `titre`          | ✅     | titre, constat, constats, sommaire, objet, élément, title, finding, summary                 |
| `description`    | —      | description, observation(s), constatation, détail(s), commentaire(s), problématique         |
| `recommandation` | —      | recommandation, correctif, action corrective, travaux, intervention, solution               |
| `occurrence`     | —      | occurrence, quantité(s), qte, **qtes**, nombre, nb, nbre, count, quantity                   |
| `unite`          | —      | unité(s), u, mesure, um — *et la colonne sans en-tête à droite de la quantité*               |
| `prixUnitaire`   | —      | prix unitaire, coût unitaire, prix, coût, montant, estimation, budget, price, cost           |
| `prixTotal`      | —      | coût total, prix total, total, montant total — *et toute colonne de prix résiduelle*         |
| `priorite`       | —      | priorité, **code**, horizon, gravité, sévérité, criticité, niveau, urgence, risque, cote    |
| `photo`          | —      | photo(s), image(s), lien photo, url photo, pièce jointe, annexe, média, visuel               |
| `localisation`   | —      | localisation, local, emplacement, zone, pièce, étage, secteur, lieu, location                |
| `categorie`      | —      | catégorie, **composante(s)**, système, lot, discipline, famille, corps de métier             |

Seul `titre` est obligatoire. Les colonnes non mappées ne sont pas perdues : leur
valeur apparaît dans « Autres colonnes du chiffrier » sur la fiche.

**Colonnes de photos multiples** : après la colonne principale, toute autre colonne
nommée `Photo 2`, `Image 3`… est lue aussi. Un constat peut donc porter plusieurs photos.

**Synonymes génériques.** `note`, `code`, `total`, `lien`, `url`, `type`, `niveau`,
`u`, `mesure`, `cote`, `horizon`, `fichier`, `média`, `lot`, `détail` ne comptent que
sur une égalité stricte ou un début d'en-tête, jamais comme simple mot présent :
sans cette règle, `Budget (note)` devenait une description.

Le mappage retenu est mémorisé par signature d'en-têtes (`UserDefaults`), donc un
chiffrier au même format ne redemande jamais rien.

## 4. Validation par les valeurs

Un en-tête ne suffit pas à décider. Après les passes sur les noms, l'outil regarde
le contenu des colonnes et consigne chaque décision dans le rapport :

1. **Colonne de prix non numérique écartée.** Une colonne « budget » dont les valeurs
   sont `650$/margelle` ou `Budget: 12$/pi2 (retrait, pose)` n'est pas un montant :
   elle est rendue aux colonnes libres. Critère : moins de 50 % de *montants purs*
   (chiffres, séparateurs, devise, espaces — aucune lettre).
2. **Coût total reconnu.** Si un prix unitaire est déjà identifié, la colonne de prix
   restante, numérique et dont le nom ne dit pas « unitaire », devient le **coût total
   du chiffrier**.
3. **Priorité validée puis déduite.** Si la colonne trouvée par son nom n'est pas
   interprétable (moins de 50 % des valeurs), elle est écartée ; l'outil cherche alors
   la colonne dont les valeurs *sont* des priorités (seuil 70 %). C'est ainsi qu'une
   colonne `Code` contenant `U / CT / MT / LT / LT+ / EX / CO` est trouvée sans que
   son nom ne parle de priorité.
4. **Unité devinée.** La colonne immédiatement à droite de la quantité, aux valeurs
   courtes contenant des lettres (`u.`, `pi2`, `m²`), devient l'unité même si son
   en-tête est vide — cas très fréquent.

## 5. Normalisation des valeurs

### Gravité — échelle à 5 niveaux (chiffriers sans code de priorité)

| Niveau BSI    | Entrées reconnues                                                                 |
|---------------|------------------------------------------------------------------------------------|
| `critique`    | critique, urgent, urgence, sécurité, danger, immédiat, critical, 5, A               |
| `majeure`     | majeur, élevé, haute, high, important, prioritaire, grave, 4, B                      |
| `moderee`     | modéré, moyen, medium, à surveiller, 3, C                                           |
| `mineure`     | mineur, faible, bas, low, minor, léger, 2, D                                        |
| `observation` | observation, informatif, note, pour information, aucune, conforme, 1, E              |

### Priorité — codes des rapports BSI

Le code de priorité **fait foi** : c'est lui qui classe le constat, tel quel. Ce n'est
pas une échelle de gravité, et aucun code n'est traduit en degré de gravité — `EX` dit
qu'une expertise est requise, `CO` qu'un entretien est suggéré ; ni l'un ni l'autre ne
se range entre « mineur » et « critique ».

| Code  | Classe affichée | Précision (légende du rapport, p. 8) |
|-------|-----------------|---------------------------------------|
| `U`   | Urgent          | Urgent                                |
| `CT`  | Court terme     | D'ici 1 an                            |
| `MT`  | Moyen terme     | D'ici 4 ans                           |
| `LT`  | Long terme      | D'ici 9 ans                           |
| `LT+` | Long terme +    | 10 ans et plus                        |
| `EX`  | Expertise       | Avis d'un expert recommandé           |
| `CO`  | Entretien       | Entretien ou amélioration suggéré     |

Chaque classe a sa propre teinte : ce sont sept catégories, pas les degrés d'une même
échelle, et une rampe rouge → vert les trahirait. Le tri « par priorité » suit l'ordre
du tableau ; le code d'origine reste affiché sous l'étiquette.

Le `+` de `LT+` est lu avant toute normalisation, sinon il disparaîtrait avec la
ponctuation et `LT+` se confondrait avec `LT`.

L'échelle de gravité à cinq niveaux ci-dessus ne sert qu'aux chiffriers **sans** code
de priorité. Les échelles numériques y sont ambiguës : par défaut **5 = critique**, et
« échelle inversée » dans la feuille de mappage bascule le sens ; le choix est mémorisé.

### Montants

Accepte `1 234,56 $`, `1,234.56`, `1234.56`, `1 234,56 CAD`, `$1,234`, `(1 200,00)`
(négatif comptable), espaces insécables et fines incluses. Le séparateur décimal est
déduit de la position du dernier `,` ou `.`. Valeur illisible ⇒ `nil` + avertissement.

### Quantité, unité et coût retenu

- Quantité : premier entier trouvé (`3`, `x3`, `1680`, `14 unités`). Absent ou `0` ⇒ `1`.
- Le coût affiché est **celui du chiffrier** quand la colonne existe, jamais un
  produit recalculé. Dans un vrai rapport, `Coût ($)` n'est pas toujours égal à
  quantité × prix unitaire (rabais de volume, forfait, montant négocié).
- Quand les deux existent et diffèrent, le constat est importé avec le montant du
  chiffrier, la fiche affiche l'écart, et le rapport le consigne. Rien n'est corrigé
  en silence.

### Titre et description

- Les deux colonnes présentes : chacune dans son champ.
- Une seule colonne de texte de plus de 110 caractères (cas courant : le rapport n'a
  qu'une colonne « Constat » contenant un paragraphe) : le paragraphe devient la
  **description** et son amorce devient le **titre** — première phrase si elle tient,
  sinon coupure au mot entier suivie d'une ellipse.
- Titre absent mais recommandation présente : le titre est déduit de celle-ci, avec
  avertissement. Une ligne pareille n'est **jamais** écartée : elle a coûté une visite.
- Une ligne n'est ignorée que si **tous** les champs mappés sont vides et qu'aucune
  photo n'est référencée.

### Photos

Quatre formes acceptées, dans cet ordre :
1. `https://…` ou `http://…` → image distante (chargée en différé).
2. `file://…` ou chemin absolu → fichier local.
3. Chemin relatif ou simple nom de fichier → cherché dans le **dossier de photos**
   choisi par l'utilisateur, sinon dans le dossier du chiffrier, sinon dans ses
   sous-dossiers `photos/`, `Photos/`, `images/`. Recherche insensible à la casse et
   à l'extension (`IMG_0001` trouve `img_0001.JPEG`).
4. **Hyperlien Excel** posé sur la cellule (texte affiché « photo », lien réel
   derrière) — la cible du lien prime sur le texte.

Plusieurs liens dans une même cellule : séparés par `;`, `|`, retour de ligne, ou
virgule *si* chaque segment ressemble à un lien. Photo introuvable ⇒ le lien brut est
conservé, l'avertissement le signale, et la fiche affiche un cadre explicite.

## 6. Rapport d'import

- lignes lues, constats retenus, lignes vides ignorées ;
- **lecture automatique** : les décisions prises en regardant les valeurs ;
- **avertissements par ligne** : `Ligne 14 — prix unitaire illisible « à valider »`,
  `Ligne 2 — le coût du chiffrier (13000) diffère de 26 × 650`.

Consultable depuis la barre d'outils, copiable pour le suivi de mandat.

## 7. Ce que l'outil ne fait pas (volontairement)

- Pas d'écriture dans le chiffrier ni de synchronisation bidirectionnelle.
- Pas de fusion ni de dédoublonnage automatique avec les constats déjà au BSI : les
  constats importés arrivent marqués `source = .chiffrier`, la fusion reste humaine.
- Pas de lecture des images *incorporées* dans les cellules (objets flottants Excel) —
  seulement les liens et les fichiers.
- Les dates reviennent en nombre de série Excel (aucun champ date n'est utilisé).
