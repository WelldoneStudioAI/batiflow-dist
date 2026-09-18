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
    public var prixUnitaire: Decimal?
    public var gravite: Gravite?
    public var localisation: String?
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
        prixUnitaire: Decimal? = nil,
        gravite: Gravite? = nil,
        localisation: String? = nil,
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
        self.prixUnitaire = prixUnitaire
        self.gravite = gravite
        self.localisation = localisation
        self.categorie = categorie
        self.photos = photos
        self.champsSupplementaires = champsSupplementaires
    }

    /// Prix unitaire × occurrence. `nil` si aucun prix n'a pu être lu.
    public var prixTotal: Decimal? {
        guard let prixUnitaire else { return nil }
        return prixUnitaire * Decimal(occurrence)
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
