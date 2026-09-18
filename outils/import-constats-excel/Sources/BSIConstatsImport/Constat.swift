import Foundation

/// Un constat tel que lu dans un chiffrier, normalisé pour être affiché
/// comme un constat de l'outil terrain iOS.
public struct ConstatImporte: Identifiable, Hashable, Sendable {
    public let id: UUID
    /// Numéro de ligne dans le chiffrier (1-based, en-tête comprise) — sert au rapport.
    public let ligneSource: Int

    public var titre: String
    public var description: String?
    public var recommandation: String?
    public var occurrence: Int
    /// Unité de la quantité telle qu'écrite au chiffrier (« u. », « pi2 », « pi lin »).
    public var unite: String?
    public var prixUnitaire: Decimal?
    /// Coût total lu directement dans le chiffrier, quand la colonne existe. Il fait foi :
    /// dans un vrai rapport, il n'est pas toujours égal à quantité × prix unitaire.
    public var prixTotalChiffrier: Decimal?
    /// Code de priorité du rapport, quand le chiffrier en porte un. C'est le classement
    /// qui fait foi.
    public var priorite: Priorite?
    /// Gravité écrite en toutes lettres, pour un chiffrier sans code de priorité.
    public var gravite: Gravite?
    /// Valeur brute de la colonne (« CT », « Majeur », « 4 »), conservée pour que
    /// l'inspecteur reconnaisse sa propre cotation sur la fiche.
    public var graviteSource: String?
    /// Lieux touchés par le constat. Un constat peut en porter plusieurs.
    public var localisations: [String]
    /// Les lieux réunis en une ligne, pour un affichage compact.
    public var localisation: String? {
        localisations.isEmpty ? nil : localisations.joined(separator: " ; ")
    }
    public var categorie: String?
    public var photos: [ReferencePhoto]

    /// Colonnes présentes dans le chiffrier mais non mappées, conservées telles quelles.
    public var champsSupplementaires: [String: String]

    public init(
        id: UUID = UUID(),
        ligneSource: Int,
        titre: String,
        description: String? = nil,
        recommandation: String? = nil,
        occurrence: Int = 1,
        unite: String? = nil,
        prixUnitaire: Decimal? = nil,
        prixTotalChiffrier: Decimal? = nil,
        priorite: Priorite? = nil,
        gravite: Gravite? = nil,
        graviteSource: String? = nil,
        localisations: [String] = [],
        categorie: String? = nil,
        photos: [ReferencePhoto] = [],
        champsSupplementaires: [String: String] = [:]
    ) {
        self.id = id
        self.ligneSource = ligneSource
        self.titre = titre
        self.description = description
        self.recommandation = recommandation
        self.occurrence = max(1, occurrence)
        self.unite = unite
        self.prixUnitaire = prixUnitaire
        self.prixTotalChiffrier = prixTotalChiffrier
        self.priorite = priorite
        self.gravite = gravite
        self.graviteSource = graviteSource
        self.localisations = localisations
        self.categorie = categorie
        self.photos = photos
        self.champsSupplementaires = champsSupplementaires
    }

    /// Étiquette de classement affichée sur la fiche : le code de priorité s'il existe,
    /// sinon la gravité, sinon « À préciser ».
    public var libelleClassement: String {
        priorite?.libelle ?? gravite?.libelle ?? "À préciser"
    }

    /// Rang de tri : les codes de priorité d'abord, puis l'échelle de gravité.
    public var rangClassement: Int {
        if let priorite { return priorite.rang }
        if let gravite { return 10 - gravite.rawValue }
        return 99
    }

    /// Prix unitaire × occurrence, tel que l'outil le recalcule.
    public var prixTotalCalcule: Decimal? {
        guard let prixUnitaire else { return nil }
        return prixUnitaire * Decimal(occurrence)
    }

    /// Coût retenu : celui du chiffrier s'il existe, sinon le produit recalculé.
    public var prixTotal: Decimal? {
        prixTotalChiffrier ?? prixTotalCalcule
    }

    /// Vrai quand le chiffrier annonce un total différent de quantité × prix unitaire.
    public var totalDivergent: Bool {
        guard let chiffrier = prixTotalChiffrier, let calcule = prixTotalCalcule else { return false }
        return chiffrier != calcule
    }

    /// Quantité telle qu'affichée sur la fiche : « 1 680 pi2 », « 26 u. », « 2 ».
    public var quantiteAffichable: String {
        let nombre = occurrence.formatted(.number.locale(Locale(identifier: "fr_CA")))
        guard let unite, !unite.isEmpty else { return nombre }
        return "\(nombre) \(unite)"
    }
}

/// Où pointe la photo d'un constat, une fois le lien du chiffrier résolu.
public enum ReferencePhoto: Hashable, Sendable {
    /// Fichier présent sur le disque, trouvé et lisible.
    case fichier(URL)
    /// Image distante (http/https).
    case distante(URL)
    /// Lien présent dans le chiffrier mais non résolu — on garde le texte brut.
    case introuvable(String)

    public var url: URL? {
        switch self {
        case .fichier(let url), .distante(let url): return url
        case .introuvable: return nil
        }
    }

    /// Texte affichable sous la vignette.
    public var libelle: String {
        switch self {
        case .fichier(let url): return url.lastPathComponent
        case .distante(let url): return url.host ?? url.absoluteString
        case .introuvable(let brut): return brut
        }
    }
}
