import Foundation

/// Les champs du BSI qu'une colonne de chiffrier peut alimenter.
public enum ChampConstat: String, CaseIterable, Identifiable, Sendable {
    case titre, description, recommandation, occurrence, unite, prixUnitaire, prixTotal
    case gravite, photo, localisation, categorie

    public var id: String { rawValue }

    public var libelle: String {
        switch self {
        case .titre: return "Titre"
        case .description: return "Description"
        case .recommandation: return "Recommandation"
        case .occurrence: return "Occurrence / quantité"
        case .unite: return "Unité"
        case .prixUnitaire: return "Prix unitaire"
        case .prixTotal: return "Coût total (du chiffrier)"
        case .gravite: return "Gravité"
        case .photo: return "Photo"
        case .localisation: return "Localisation"
        case .categorie: return "Catégorie"
        }
    }

    public var estRequis: Bool { self == .titre }

    /// En-têtes reconnus, déjà normalisés (voir `NormalisationTexte.cle`).
    var synonymes: [String] {
        switch self {
        case .titre:
            return ["titre", "constat", "constats", "sommaire", "objet", "element", "intitule",
                    "nom du constat", "title", "finding", "summary", "item"]
        case .description:
            return ["description", "description du constat", "observation", "observations",
                    "constatation", "constatations", "detail", "details", "note", "notes",
                    "commentaire", "commentaires", "problematique"]
        case .recommandation:
            return ["recommandation", "recommandations", "recommendation", "correctif",
                    "correctifs", "action", "actions", "action corrective", "travaux",
                    "travaux recommandes", "intervention", "solution", "mesure corrective"]
        case .occurrence:
            return ["occurrence", "occurrences", "quantite", "quantites", "qte", "qtes",
                    "nombre", "nb", "nbre", "count", "quantity", "qty"]
        case .unite:
            return ["unite", "unites", "u", "mesure", "unite de mesure", "um"]
        case .prixUnitaire:
            return ["prix unitaire", "cout unitaire", "prix", "cout", "montant", "estimation",
                    "estime", "budget", "price", "cost", "unit cost", "valeur", "cout estime"]
        case .prixTotal:
            return ["cout total", "prix total", "total", "montant total", "sous total",
                    "total estime", "cout global"]
        case .gravite:
            return ["gravite", "severite", "criticite", "priorite", "priorites", "niveau",
                    "niveau de gravite", "urgence", "severity", "priority", "risque",
                    "cote", "code", "horizon"]
        case .photo:
            return ["photo", "photos", "image", "images", "lien photo", "url photo",
                    "lien", "url", "piece jointe", "pieces jointes", "annexe", "media",
                    "fichier", "visuel"]
        case .localisation:
            return ["localisation", "local", "emplacement", "zone", "piece", "etage",
                    "secteur", "lieu", "location", "room", "aire"]
        case .categorie:
            return ["categorie", "composante", "composantes", "systeme", "lot", "discipline",
                    "composant", "famille", "category", "type", "corps de metier"]
        }
    }

    /// Synonymes trop génériques pour la passe « mot entier » : « Budget (note) » ne doit
    /// pas devenir une description, ni « Code produit » une gravité.
    static let synonymesFaibles: Set<String> = [
        "note", "notes", "detail", "details", "lien", "url", "fichier", "media",
        "type", "lot", "u", "code", "cote", "niveau", "total", "mesure", "horizon"
    ]
}

/// Association colonne du chiffrier → champ du BSI.
public struct MappageColonnes: Equatable, Sendable {
    /// Index de colonne (0-based) pour chaque champ reconnu.
    public var colonnes: [ChampConstat: Int]
    /// Colonnes de photos au-delà de la première (« Photo 1 », « Photo 2 »…).
    public var colonnesPhotosSupplementaires: [Int]
    /// En-têtes du chiffrier, dans l'ordre.
    public let entetes: [String]
    /// `true` si, dans ce chiffrier, 1 est le niveau le plus grave.
    public var echelleGraviteInversee: Bool
    /// Décisions prises en regardant les valeurs, à afficher dans le rapport.
    public var ajustements: [String]

    public init(entetes: [String],
                colonnes: [ChampConstat: Int] = [:],
                colonnesPhotosSupplementaires: [Int] = [],
                echelleGraviteInversee: Bool = false,
                ajustements: [String] = []) {
        self.entetes = entetes
        self.colonnes = colonnes
        self.colonnesPhotosSupplementaires = colonnesPhotosSupplementaires
        self.echelleGraviteInversee = echelleGraviteInversee
        self.ajustements = ajustements
    }

    public var estComplet: Bool {
        ChampConstat.allCases.filter(\.estRequis).allSatisfy { colonnes[$0] != nil }
    }

    /// Toutes les colonnes de photos, la principale d'abord.
    public var toutesLesColonnesPhotos: [Int] {
        (colonnes[.photo].map { [$0] } ?? []) + colonnesPhotosSupplementaires
    }

    /// Colonnes du chiffrier qui n'alimentent aucun champ du BSI.
    public var colonnesNonMappees: [Int] {
        let utilisees = Set(colonnes.values).union(colonnesPhotosSupplementaires)
        return entetes.indices.filter { !utilisees.contains($0) }
    }

    /// Signature stable des en-têtes : sert à mémoriser le mappage d'un format récurrent.
    public var signature: String {
        entetes.map(NormalisationTexte.cle).joined(separator: "|")
    }

    // MARK: - Détection

    /// Détection automatique. `donnees` (les lignes sous l'en-tête) est facultatif mais
    /// fortement recommandé : les passes 4 à 6 valident les colonnes par leurs valeurs,
    /// ce qu'un en-tête seul ne permet pas.
    public static func detecter(entetes: [String], donnees: [[String]] = []) -> MappageColonnes {
        var mappage = MappageColonnes(entetes: entetes)
        let cles = entetes.map(NormalisationTexte.cle)
        var prises = Set<Int>()

        func attribuer(_ champ: ChampConstat, _ index: Int) {
            mappage.colonnes[champ] = index
            prises.insert(index)
        }

        // Passe 1 — égalité stricte.
        for champ in ChampConstat.allCases where mappage.colonnes[champ] == nil {
            if let index = cles.indices.first(where: {
                !prises.contains($0) && champ.synonymes.contains(cles[$0])
            }) {
                attribuer(champ, index)
            }
        }

        // Passe 2 — l'en-tête commence par un synonyme (« prix unitaire avant taxes »).
        for champ in ChampConstat.allCases where mappage.colonnes[champ] == nil {
            if let index = cles.indices.first(where: { index in
                !prises.contains(index) && champ.synonymes.contains {
                    cles[index].hasPrefix($0 + " ")
                }
            }) {
                attribuer(champ, index)
            }
        }

        // Passe 3 — le synonyme apparaît comme mot entier, hors synonymes génériques.
        for champ in ChampConstat.allCases where mappage.colonnes[champ] == nil {
            if let index = cles.indices.first(where: { index in
                let mots = Set(cles[index].split(separator: " ").map(String.init))
                return !prises.contains(index) && champ.synonymes.contains {
                    !ChampConstat.synonymesFaibles.contains($0) && mots.contains($0)
                }
            }) {
                attribuer(champ, index)
            }
        }

        // Passe 4 — colonnes de photos supplémentaires (« Photo 1 », « Photo 2 »).
        if mappage.colonnes[.photo] != nil {
            let prefixesPhoto = ["photo", "photos", "image", "images"]
            for index in cles.indices where !prises.contains(index) {
                let cle = cles[index]
                if prefixesPhoto.contains(where: { cle == $0 || cle.hasPrefix($0 + " ") }) {
                    mappage.colonnesPhotosSupplementaires.append(index)
                    prises.insert(index)
                }
            }
        }

        guard !donnees.isEmpty else { return mappage }
        mappage.affiner(donnees: donnees, cles: cles, prises: &prises)
        return mappage
    }

    /// Passes 5 à 7 : elles regardent les valeurs, pas seulement les en-têtes.
    mutating func affiner(donnees: [[String]], cles: [String], prises: inout Set<Int>) {
        func valeurs(_ index: Int) -> [String] {
            donnees.compactMap { ligne -> String? in
                guard index < ligne.count else { return nil }
                let valeur = ligne[index].trimmingCharacters(in: .whitespacesAndNewlines)
                return valeur.isEmpty ? nil : valeur
            }
        }
        func proportion(_ index: Int, _ test: (String) -> Bool) -> Double {
            let liste = valeurs(index)
            guard !liste.isEmpty else { return 0 }
            return Double(liste.filter(test).count) / Double(liste.count)
        }
        func libelle(_ index: Int) -> String {
            let entete = index < entetes.count ? entetes[index] : ""
            return entete.isEmpty ? "colonne \(index + 1)" : entete
        }

        // 5 — une colonne de prix dont les valeurs ne sont pas des montants purs est écartée
        //     (« 650$/margelle » est une note de budget, pas un montant).
        for champ in [ChampConstat.prixUnitaire, .prixTotal] {
            guard let index = colonnes[champ] else { continue }
            if proportion(index, ValueParsing.estMontantPur) < 0.5 {
                ajustements.append("« \(libelle(index)) » écartée du champ \(champ.libelle) : valeurs non numériques")
                colonnes[champ] = nil
                prises.remove(index)
            }
        }

        // 6 — coût total : colonne de prix restante, numérique, dont le nom ne dit pas « unitaire ».
        if colonnes[.prixUnitaire] != nil, colonnes[.prixTotal] == nil {
            let motsPrix: Set<String> = ["prix", "cout", "montant", "budget", "cost", "price", "valeur"]
            if let index = cles.indices.first(where: { index in
                guard !prises.contains(index) else { return false }
                let cle = cles[index]
                guard !cle.contains("unitaire"), !cle.contains("unit") else { return false }
                let mots = Set(cle.split(separator: " ").map(String.init))
                return !mots.isDisjoint(with: motsPrix)
                    && proportion(index, ValueParsing.estMontantPur) >= 0.7
            }) {
                colonnes[.prixTotal] = index
                prises.insert(index)
                ajustements.append("« \(libelle(index)) » lue comme coût total du chiffrier")
            }
        }

        // 7 — gravité : une colonne trouvée par son nom mais dont les valeurs ne veulent rien
        //     dire est écartée, puis on cherche la colonne réellement interprétable. C'est
        //     ainsi qu'une colonne « Code » de priorités BSI (U, CT, MT, LT…) est trouvée.
        let estGravite: (String) -> Bool = { Gravite.depuis($0) != nil }
        if let index = colonnes[.gravite], proportion(index, estGravite) < 0.5 {
            ajustements.append("« \(libelle(index)) » écartée du champ Gravité : valeurs non interprétables")
            colonnes[.gravite] = nil
            prises.remove(index)
        }
        if colonnes[.gravite] == nil {
            var meilleur: Int?
            var meilleureProportion = 0.7
            for index in entetes.indices where !prises.contains(index) {
                let part = proportion(index, estGravite)
                if part > meilleureProportion {
                    meilleur = index
                    meilleureProportion = part
                }
            }
            if let meilleur {
                colonnes[.gravite] = meilleur
                prises.insert(meilleur)
                ajustements.append("gravité déduite des valeurs de « \(libelle(meilleur)) »")
            }
        }

        // 8 — unité : colonne juste à droite de la quantité, valeurs courtes contenant des
        //     lettres (« u. », « pi2 », « m² »). Beaucoup de chiffriers laissent son en-tête vide.
        if let quantite = colonnes[.occurrence], colonnes[.unite] == nil {
            let index = quantite + 1
            if index < entetes.count, !prises.contains(index) {
                let liste = valeurs(index)
                let courtes = liste.allSatisfy { $0.count <= 6 }
                if !liste.isEmpty, courtes,
                   proportion(index, { $0.contains(where: \.isLetter) }) >= 0.8 {
                    colonnes[.unite] = index
                    prises.insert(index)
                    ajustements.append("unité déduite de « \(libelle(index)) »")
                }
            }
        }
    }
}
