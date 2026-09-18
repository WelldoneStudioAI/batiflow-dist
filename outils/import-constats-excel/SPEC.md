# Spec — Importateur de constats Excel dans le BSI

## 1. Intention

Permettre à un utilisateur du BSI d'ouvrir un chiffrier (`.xlsx` ou `.csv`) contenant
des constats rédigés hors application (Excel, Google Sheets, export d'un autre
logiciel) et de les **voir et manipuler exactement comme s'ils avaient été saisis
avec l'outil terrain iOS** : même vocabulaire, même hiérarchie visuelle, même
badge de gravité, même bloc photo.

Le chiffrier n'est jamais la source de vérité : il est *lu*, *normalisé*,
*présenté pour validation*, puis *versé* dans le BSI. Le fichier d'origine n'est
pas modifié.

## 2. Parcours utilisateur

1. **BSI → Constats → Importer un chiffrier…** (ou glisser-déposer un fichier sur
   la liste des constats).
2. L'outil lit le fichier, détecte la feuille et la ligne d'en-têtes, et propose
   automatiquement un **mappage des colonnes**.
3. Une feuille de mappage s'ouvre **seulement si** une colonne obligatoire n'a pas
   été reconnue, ou si l'utilisateur clique « Ajuster les colonnes ». Sinon on
   passe directement à l'étape 4.
4. **Fenêtre des constats** : liste à gauche, fiche détaillée à droite, façon outil
   terrain. Recherche, filtre par gravité, tri, totaux en pied de fenêtre.
5. **Importer dans le BSI** verse les constats sélectionnés (tous par défaut).
   Les lignes en avertissement peuvent être décochées.

## 3. Colonnes attendues et synonymes reconnus

La détection normalise l'en-tête (minuscules, accents retirés, ponctuation retirée)
puis cherche une correspondance exacte, sinon une correspondance par préfixe.

| Champ BSI        | Requis | En-têtes reconnus (FR / EN)                                                                 |
|------------------|--------|---------------------------------------------------------------------------------------------|
| `titre`          | ✅     | titre, constat, sommaire, objet, element, élément, title, finding, summary                    |
| `description`    | —      | description, observation, constatation, detail, details, note, notes, description du constat  |
| `recommandation` | —      | recommandation, recommendation, correctif, action, action corrective, travaux, intervention   |
| `occurrence`     | —      | occurrence, occurrences, quantite, quantité, qte, qté, nombre, nb, count, quantity            |
| `prixUnitaire`   | —      | prix, cout, coût, prix unitaire, cout unitaire, montant, estimation, budget, price, cost      |
| `gravite`        | —      | gravite, gravité, severite, sévérité, criticite, criticité, priorite, priorité, niveau, severity |
| `photo`          | —      | photo, photos, image, lien photo, url photo, piece jointe, pièce jointe, annexe, media        |
| `localisation`   | —      | localisation, local, emplacement, zone, piece, pièce, etage, étage, secteur, location         |
| `categorie`      | —      | categorie, catégorie, systeme, système, lot, discipline, composant, category                  |

Seul `titre` est obligatoire. Une ligne sans titre **et** sans description est
considérée comme vide et ignorée silencieusement.

Le mappage retenu est mémorisé par signature d'en-têtes (`UserDefaults`), donc un
chiffrier au même format ne redemande jamais rien.

## 4. Normalisation des valeurs

### Gravité
Échelle interne à 5 niveaux, alignée sur l'outil terrain :

| Niveau BSI    | Entrées reconnues                                                                 |
|---------------|------------------------------------------------------------------------------------|
| `critique`    | critique, urgent, urgence, securite, sécurité, danger, immediat, immédiat, critical, 5, A |
| `majeure`     | majeur, majeure, eleve, élevé, elevee, haute, high, important, prioritaire, 4, B      |
| `moderee`     | modere, modéré, moderee, moyen, moyenne, medium, a surveiller, à surveiller, 3, C     |
| `mineure`     | mineur, mineure, faible, bas, basse, low, 2, D                                       |
| `observation` | observation, informatif, information, note, pour information, aucune, na, n/a, 1, E   |

Une valeur non reconnue ⇒ `nil` + avertissement sur la ligne (le constat est quand
même importé, gravité à préciser dans le BSI).

Note : les échelles numériques sont ambiguës. Par défaut **5 = critique**
(croissante). Si le chiffrier utilise 1 = le plus grave, l'utilisateur bascule
l'interrupteur « échelle inversée » dans la feuille de mappage ; le choix est
mémorisé avec le mappage.

### Prix
Accepte `1 234,56 $`, `1,234.56`, `1234.56`, `1 234,56 CAD`, `$1,234`,
espaces insécables et fines incluses. Détection du séparateur décimal par la
position du dernier `,` ou `.`. Valeur négative ou illisible ⇒ `nil` + avertissement.

### Occurrence
Premier entier trouvé (`3`, `x3`, `3 unités`, `3 u.`). Absent ou `0` ⇒ `1`.

### Photo
Quatre formes acceptées, dans cet ordre :
1. `https://…` ou `http://…` → image distante (chargée en différé, mise en cache).
2. `file://…` ou chemin absolu → fichier local.
3. Chemin relatif ou simple nom de fichier → cherché dans le **dossier de photos**
   choisi par l'utilisateur, sinon dans le dossier du chiffrier, sinon dans un
   sous-dossier `photos/` de celui-ci. Recherche insensible à la casse et à
   l'extension (`P1010321` trouve `p1010321.JPG`).
4. **Hyperlien Excel** posé sur la cellule (texte affiché « photo », lien réel
   derrière) — la cible du lien est utilisée, pas le texte.

Plusieurs liens dans une même cellule sont acceptés, séparés par `;`, `|`, retour
de ligne ou virgule *si* les segments ressemblent à des URL/chemins.
Photo introuvable ⇒ le constat garde le lien brut, l'avertissement le signale, et
la fiche affiche un cadre « photo introuvable » plutôt qu'un vide.

## 5. Rapport d'import

À la fin de la lecture, l'outil produit un `RapportImport` :

- lignes lues, constats retenus, lignes vides ignorées ;
- avertissements par ligne (`ligne 14 — prix illisible « à valider »`) ;
- erreurs bloquantes (fichier illisible, aucune colonne titre).

Le rapport est consultable depuis la fenêtre (icône ⚠︎ dans la barre d'outils) et
exportable en texte pour le suivi de mandat.

## 6. Ce que l'outil ne fait pas (volontairement)

- Pas d'écriture dans le chiffrier ni de synchronisation bidirectionnelle.
- Pas de fusion/dédoublonnage automatique avec les constats déjà au BSI : les
  constats importés arrivent marqués `source = .chiffrier`, la fusion reste un
  geste humain.
- Pas de lecture des images *incorporées* dans les cellules Excel (objets
  flottants) — seulement les liens et les fichiers. À ajouter en v2 si le besoin
  se confirme.
