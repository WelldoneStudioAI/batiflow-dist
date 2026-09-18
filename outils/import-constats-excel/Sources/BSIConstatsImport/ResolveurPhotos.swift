import Foundation

/// Transforme le contenu d'une cellule « photo » en références utilisables :
/// URL distante, fichier local retrouvé sur le disque, ou lien non résolu.
public struct ResolveurPhotos: Sendable {

    /// Dossier du chiffrier (utilisé pour les chemins relatifs).
    public let dossierChiffrier: URL?
    /// Dossier de photos choisi par l'utilisateur, le cas échéant.
    public let dossierPhotos: URL?

    private let indexFichiers: [String: URL]

    public init(dossierChiffrier: URL?, dossierPhotos: URL? = nil) {
        self.dossierChiffrier = dossierChiffrier
        self.dossierPhotos = dossierPhotos

        var dossiers: [URL] = []
        if let dossierPhotos { dossiers.append(dossierPhotos) }
        if let dossierChiffrier {
            dossiers.append(dossierChiffrier)
            dossiers.append(dossierChiffrier.appendingPathComponent("photos"))
            dossiers.append(dossierChiffrier.appendingPathComponent("Photos"))
            dossiers.append(dossierChiffrier.appendingPathComponent("images"))
        }
        self.indexFichiers = Self.indexer(dossiers)
    }

    /// Découpe la cellule puis résout chaque segment.
    public func resoudre(_ brut: String) -> [ReferencePhoto] {
        segments(brut).map(resoudreSegment)
    }

    // MARK: - Découpage

    func segments(_ brut: String) -> [String] {
        let separateurs = CharacterSet(charactersIn: "\n\r;|")
        var morceaux = brut.components(separatedBy: separateurs)
            .map { ValueParsing.degarni($0) }
            .filter { !$0.isEmpty }

        // La virgule n'est un séparateur que si chaque morceau ressemble à un lien :
        // « salle 3, mur nord.jpg » ne doit pas être coupé en deux.
        if morceaux.count == 1, morceaux[0].contains(",") {
            let candidats = morceaux[0].components(separatedBy: ",")
                .map { ValueParsing.degarni($0) }
                .filter { !$0.isEmpty }
            if candidats.count > 1, candidats.allSatisfy(ressembleAUnLien) {
                morceaux = candidats
            }
        }
        return morceaux
    }

    private func ressembleAUnLien(_ texte: String) -> Bool {
        if texte.lowercased().hasPrefix("http") { return true }
        let extension_ = (texte as NSString).pathExtension.lowercased()
        return Self.extensionsImage.contains(extension_)
    }

    // MARK: - Résolution

    private func resoudreSegment(_ segment: String) -> ReferencePhoto {
        let texte = ValueParsing.degarni(segment)
        let minuscule = texte.lowercased()

        if minuscule.hasPrefix("http://") || minuscule.hasPrefix("https://") {
            if let url = URL(string: texte) ?? URL(string: texte.addingPercentEncoding(
                withAllowedCharacters: .urlQueryAllowed) ?? texte) {
                return .distante(url)
            }
            return .introuvable(texte)
        }

        if minuscule.hasPrefix("file://") {
            if let url = URL(string: texte), FileManager.default.fileExists(atPath: url.path) {
                return .fichier(url)
            }
            return .introuvable(texte)
        }

        // Chemin absolu (POSIX ou style Windows converti par Excel).
        if texte.hasPrefix("/") || texte.hasPrefix("~") {
            let chemin = (texte as NSString).expandingTildeInPath
            if FileManager.default.fileExists(atPath: chemin) {
                return .fichier(URL(fileURLWithPath: chemin))
            }
        }

        // Chemin relatif au chiffrier.
        if let dossierChiffrier {
            let candidat = dossierChiffrier.appendingPathComponent(texte)
            if FileManager.default.fileExists(atPath: candidat.path) {
                return .fichier(candidat)
            }
        }

        // Recherche par nom, insensible à la casse et à l'extension.
        let nom = (texte as NSString).lastPathComponent
        let cle = Self.cleFichier(nom)
        if let trouve = indexFichiers[cle] {
            return .fichier(trouve)
        }
        let cleSansExtension = Self.cleFichier((nom as NSString).deletingPathExtension)
        if let trouve = indexFichiers[cleSansExtension] {
            return .fichier(trouve)
        }

        return .introuvable(texte)
    }

    // MARK: - Index du disque

    static let extensionsImage: Set<String> = [
        "jpg", "jpeg", "png", "heic", "heif", "gif", "tif", "tiff", "webp", "bmp", "pdf"
    ]

    private static func cleFichier(_ nom: String) -> String {
        NormalisationTexte.cle(nom).replacingOccurrences(of: " ", with: "")
    }

    /// Indexe les images des dossiers candidats (2 niveaux, 5000 fichiers au plus).
    private static func indexer(_ dossiers: [URL]) -> [String: URL] {
        var index: [String: URL] = [:]
        var restant = 5_000
        let gestionnaire = FileManager.default

        for dossier in dossiers {
            var estDossier: ObjCBool = false
            guard gestionnaire.fileExists(atPath: dossier.path, isDirectory: &estDossier),
                  estDossier.boolValue else { continue }

            guard let enumerateur = gestionnaire.enumerator(
                at: dossier,
                includingPropertiesForKeys: [.isRegularFileKey],
                options: [.skipsHiddenFiles, .skipsPackageDescendants]
            ) else { continue }

            for cas in enumerateur {
                guard restant > 0 else { break }
                guard let url = cas as? URL else { continue }
                if enumerateur.level > 2 {
                    enumerateur.skipDescendants()
                    continue
                }
                let extension_ = url.pathExtension.lowercased()
                guard extensionsImage.contains(extension_) else { continue }
                restant -= 1

                let nomComplet = cleFichier(url.lastPathComponent)
                let nomSeul = cleFichier(url.deletingPathExtension().lastPathComponent)
                // Le premier dossier de la liste (celui choisi par l'utilisateur) gagne.
                if index[nomComplet] == nil { index[nomComplet] = url }
                if index[nomSeul] == nil { index[nomSeul] = url }
            }
        }
        return index
    }
}
