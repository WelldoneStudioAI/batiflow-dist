import Foundation

/// Les champs du BSI qu'une colonne de chiffrier peut alimenter.
public enum ChampConstat: String, CaseIterable, Identifiable, Sendable {
    case titre, description, recommandation, occurrence, prixUnitaire, gravite
    case photo, localisation, categorie

    public var id: String { rawValue }

    public var libelle: String {
        switch self {
        case .titre: return "Titre"
        case .description: return "Description"
        case .recommandation: return "Recommandation"
        case .occurrence: return "Occurrence"
        case .prixUnitaire: return "Prix"
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
            return ["titre", "constat", "sommaire", "objet", "element", "intitule",
                    "nom du constat", "title", "finding", "summary", "item"]
        case .description:
            return ["description", "description du constat", "observation", "observations",
                    "constatation", "constatations", "detail", "details", "note", "notes",
                    "commentaire", "commentaires", "problematique"]
        case .recommandation:
            return ["recommandation", "recommandations", "recommendation", "correctif",
                    "correctifs", "action", "actions", "action corrective", "travaux",
                    "travaux recommandes", "intervention", "solution", "mesure"]
        case .occurrence:
            return ["occurrence", "occurrences", "quantite", "qte", "nombre", "nb",
                    "count", "quantity", "unites", "qty"]
        case .prixUnitaire:
            return ["prix", "prix unitaire", "cout", "cout unitaire", "montant", "estimation",
                    "estime", "budget", "price", "cost", "unit cost", "valeur", "cout estime"]
        case .gravite:
            return ["gravite", "severite", "criticite", "priorite", "niveau", "niveau de gravite",
                    "urgence", "severity", "priority", "risque", "cote"]
        case .photo:
            return ["photo", "photos", "image", "images", "lien photo", "url photo",
                    "lien", "url", "piece jointe", "pieces jointes", "annexe", "media",
                    "fichier", "visuel"]
        case .localisation:
            return ["localisation", "local", "emplacement", "zone", "piece", "etage",
                    "secteur", "lieu", "location", "room", "aire"]
        case .categorie:
            return ["categorie", "systeme", "lot", "discipline", "composant", "famille",
                    "category", "type", "corps de metier"]
        }
    }
}

/// Association colonne du chiffrier → champ du BSI.
public struct MappageColonnes: Equatable, Sendable {
    /// Index de colonne (0-based) pour chaque champ reconnu.
    public var colonnes: [ChampConstat: Int]
    /// En-têtes du chiffrier, dans l'ordre.
    public let entetes: [String]
    /// `true` si, dans ce chiffrier, 1 est le niveau le plus grave.
    public var echelleGraviteInversee: Bool

    public init(entetes: [String],
                colonnes: [ChampConstat: Int] = [:],
                echelleGraviteInversee: Bool = false) {
        self.entetes = entetes
        self.colonnes = colonnes
        self.echelleGraviteInversee = echelleGraviteInversee
    }

    public var estComplet: Bool {
        ChampConstat.allCases.filter(\.estRequis).allSatisfy { colonnes[$0] != nil }
    }

    /// Colonnes du chiffrier qui n'alimentent aucun champ du BSI.
    public var colonnesNonMappees: [Int] {
        let utilisees = Set(colonnes.values)
        return entetes.indices.filter { !utilisees.contains($0) }
    }

    /// Signature stable des en-têtes : sert à mémoriser le mappage d'un format récurrent.
    public var signature: String {
        entetes.map(NormalisationTexte.cle).joined(separator: "|")
    }

    /// Détection automatique : correspondance exacte d'abord, puis préfixe, puis inclusion.
    public static func detecter(entetes: [String]) -> MappageColonnes {
        var mappage = MappageColonnes(entetes: entetes)
        let cles = entetes.map(NormalisationTexte.cle)
        var prises = Set<Int>()

        func attribuer(_ champ: ChampConstat, _ index: Int) {
            mappage.colonnes[champ] = index
            prises.insert(index)
        }

        // Passe 1 — égalité stricte.
        for champ in ChampConstat.allCases {
            guard mappage.colonnes[champ] == nil else { continue }
            if let index = cles.indices.first(where: {
                !prises.contains($0) && champ.synonymes.contains(cles[$0])
            }) {
                attribuer(champ, index)
            }
        }

        // Passe 2 — l'en-tête commence par un synonyme (« prix unitaire avant taxes »).
        for champ in ChampConstat.allCases {
            guard mappage.colonnes[champ] == nil else { continue }
            if let index = cles.indices.first(where: { index in
                !prises.contains(index) && champ.synonymes.contains {
                    cles[index].hasPrefix($0 + " ")
                }
            }) {
                attribuer(champ, index)
            }
        }

        // Passe 3 — le synonyme apparaît comme mot entier dans l'en-tête.
        for champ in ChampConstat.allCases {
            guard mappage.colonnes[champ] == nil else { continue }
            if let index = cles.indices.first(where: { index in
                let mots = Set(cles[index].split(separator: " ").map(String.init))
                return !prises.contains(index) && champ.synonymes.contains { mots.contains($0) }
            }) {
                attribuer(champ, index)
            }
        }

        return mappage
    }
}
