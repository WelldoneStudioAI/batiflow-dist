import Foundation

/// Lecture d'un dossier produit par la web app « Constats du chiffrier »
/// (format `batiflow.bsi.dossier`). Le dossier est une archive `.zip` qui contient
/// `bsi.json`, les photos jointes, une copie CSV et le rapport de lecture.
///
/// ```swift
/// let dossier = try LecteurDossierBatiFlow.lire(
///     archive: url,
///     extrairePhotosVers: FileManager.default.temporaryDirectory
///         .appendingPathComponent(UUID().uuidString))
/// bsi.ajouterConstats(dossier.constats.map(Constat.init(importe:)))
/// ```
public enum LecteurDossierBatiFlow {

    public struct Resultat: Sendable {
        public let manifeste: ManifesteDossier
        public let constats: [ConstatImporte]
        /// Dossier où les photos ont été extraites, si une destination a été fournie.
        public let dossierPhotos: URL?
    }

    public enum Erreur: LocalizedError {
        case manifesteIntrouvable
        case formatInconnu(String)
        case versionTropRecente(Int)

        public var errorDescription: String? {
            switch self {
            case .manifesteIntrouvable:
                return "Ce dossier ne contient pas de fichier bsi.json."
            case .formatInconnu(let format):
                return "Format de dossier inattendu : « \(format) »."
            case .versionTropRecente(let version):
                return "Ce dossier est en version \(version) ; cette version de BatiFlow lit "
                     + "jusqu'à la version \(ManifesteDossier.versionPriseEnCharge). Mettez BatiFlow à jour."
            }
        }
    }

    public static func lire(archive url: URL, extrairePhotosVers destination: URL? = nil) throws -> Resultat {
        let donnees = try Data(contentsOf: url)
        let index = try MiniZip.index(donnees)

        guard let json = try MiniZip.extraire("bsi.json", de: donnees, index: index) else {
            throw Erreur.manifesteIntrouvable
        }
        let decodeur = JSONDecoder()
        let manifeste = try decodeur.decode(ManifesteDossier.self, from: json)

        guard manifeste.format == ManifesteDossier.formatAttendu else {
            throw Erreur.formatInconnu(manifeste.format)
        }
        guard manifeste.version <= ManifesteDossier.versionPriseEnCharge else {
            throw Erreur.versionTropRecente(manifeste.version)
        }

        // Les photos sont extraites une fois, sur disque : les fiches y pointent ensuite.
        var photosParChemin: [String: URL] = [:]
        if let destination {
            try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
            for constat in manifeste.constats {
                for photo in constat.photos where photo.statut == "incluse" {
                    guard let chemin = photo.fichier, photosParChemin[chemin] == nil,
                          let contenu = try MiniZip.extraire(chemin, de: donnees, index: index) else { continue }
                    let cible = destination.appendingPathComponent((chemin as NSString).lastPathComponent)
                    try contenu.write(to: cible)
                    photosParChemin[chemin] = cible
                }
            }
        }

        let constats = manifeste.constats.map { ligne -> ConstatImporte in
            let photos: [ReferencePhoto] = ligne.photos.compactMap { photo in
                switch photo.statut {
                case "incluse":
                    guard let chemin = photo.fichier else { return nil }
                    if let url = photosParChemin[chemin] { return .fichier(url) }
                    return .introuvable(photo.nomOrigine ?? chemin)
                case "distante":
                    guard let texte = photo.url, let url = URL(string: texte) else { return nil }
                    return .distante(url)
                default:
                    return .introuvable(photo.nomOrigine ?? "photo")
                }
            }

            return ConstatImporte(
                ligneSource: ligne.ligneSource,
                titre: ligne.titre,
                description: ligne.description,
                recommandation: ligne.recommandation,
                occurrence: ligne.quantite ?? 1,
                unite: ligne.unite,
                prixUnitaire: ligne.prixUnitaire.map { Decimal($0) },
                prixTotalChiffrier: ligne.coutRetenu.map { Decimal($0) },
                priorite: ligne.priorite.flatMap { Priorite(rawValue: $0.code) },
                gravite: ligne.graviteTexte.flatMap { Gravite.depuis($0) },
                graviteSource: ligne.cotationOrigine,
                localisations: ligne.localisations
                    ?? ligne.localisation.map { [$0] } ?? [],
                categorie: ligne.categorie,
                photos: photos,
                champsSupplementaires: ligne.autresColonnes ?? [:]
            )
        }

        return Resultat(manifeste: manifeste, constats: constats,
                        dossierPhotos: photosParChemin.isEmpty ? nil : destination)
    }
}

/// Le contenu de `bsi.json`. Les champs facultatifs le sont vraiment : un chiffrier
/// peut ne pas avoir de prix, de photos ou de priorité.
public struct ManifesteDossier: Decodable, Sendable {
    public static let formatAttendu = "batiflow.bsi.dossier"
    public static let versionPriseEnCharge = 1

    public struct Source: Decodable, Sendable {
        public let fichier: String
        public let feuille: String
        public let lignesLues: Int
        public let lignesIgnorees: Int
    }

    public struct Entete: Decodable, Sendable {
        public let nom: String
        public let nombreConstats: Int
        public let totalRetenu: Double
        public let devise: String
        public let photosIncluses: Int
    }

    public struct Priorite: Decodable, Sendable {
        public let code: String
        public let libelle: String?
        public let precision: String?
        public let rang: Int?
    }

    public struct Photo: Decodable, Sendable {
        /// `incluse`, `distante` ou `introuvable`.
        public let statut: String
        public let fichier: String?
        public let nomOrigine: String?
        public let url: String?
    }

    public struct Constat: Decodable, Sendable {
        public let id: String
        public let ligneSource: Int
        public let titre: String
        public let description: String?
        public let recommandation: String?
        public let priorite: Priorite?
        public let graviteTexte: String?
        public let cotationOrigine: String?
        public let quantite: Int?
        public let unite: String?
        public let prixUnitaire: Double?
        public let coutChiffrier: Double?
        public let coutCalcule: Double?
        public let coutRetenu: Double?
        public let ecartDeCout: Bool?
        public let categorie: String?
        public let localisation: String?
        /// Les lieux, un par un. `localisation` en est la version réunie.
        public let localisations: [String]?
        /// Texte affiché à droite du bandeau dans le rapport (« NC », « SU »…).
        public let statut: String?
        /// Vrai si l'utilisateur a retouché la ligne dans l'outil web avant l'export.
        public let modifieDansLOutil: Bool?
        public let photos: [Photo]
        public let autresColonnes: [String: String]?
    }

    public struct Avertissement: Decodable, Sendable {
        public let ligne: Int
        public let message: String
    }

    public let format: String
    public let version: Int
    public let genereLe: String
    public let genereAvec: String
    public let source: Source
    public let dossier: Entete
    public let constats: [Constat]
    public let lectureAutomatique: [String]?
    public let avertissements: [Avertissement]?
}
