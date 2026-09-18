import Foundation

/// Avertissement rattaché à une ligne du chiffrier.
public struct AvertissementImport: Identifiable, Hashable, Sendable {
    public let id = UUID()
    public let ligne: Int          // numéro de ligne tel qu'affiché dans Excel (1-based)
    public let message: String

    public var texte: String { "Ligne \(ligne) — \(message)" }
}

/// Bilan d'une lecture de chiffrier.
public struct RapportImport: Sendable {
    public var nomFeuille: String = ""
    public var lignesLues: Int = 0
    public var constatsRetenus: Int = 0
    public var lignesIgnorees: Int = 0
    public var avertissements: [AvertissementImport] = []

    public var aDesAvertissements: Bool { !avertissements.isEmpty }

    /// Version texte, pour le suivi de mandat.
    public func texteExportable(nomFichier: String) -> String {
        var lignes = [
            "Import de constats — \(nomFichier)",
            "Feuille : \(nomFeuille)",
            "Lignes lues : \(lignesLues)",
            "Constats retenus : \(constatsRetenus)",
            "Lignes vides ignorées : \(lignesIgnorees)",
            "Avertissements : \(avertissements.count)"
        ]
        if !avertissements.isEmpty {
            lignes.append("")
            lignes.append(contentsOf: avertissements.map(\.texte))
        }
        return lignes.joined(separator: "\n")
    }
}

/// Résultat de la première passe : ce qu'il faut pour proposer le mappage.
public struct PreparationImport: Sendable {
    public let url: URL
    public let feuilles: [FeuilleBrute]
    public let indexFeuilleChoisie: Int
    public let ligneEntetes: Int
    public let mappage: MappageColonnes

    public var feuille: FeuilleBrute { feuilles[indexFeuilleChoisie] }
}

public enum ErreurImport: LocalizedError {
    case formatNonSupporte(String)
    case aucuneDonnee
    case colonneTitreIntrouvable

    public var errorDescription: String? {
        switch self {
        case .formatNonSupporte(let extension_):
            return "Format « .\(extension_) » non pris en charge. Utilisez un fichier .xlsx ou .csv."
        case .aucuneDonnee:
            return "Le fichier ne contient aucune ligne exploitable."
        case .colonneTitreIntrouvable:
            return "Aucune colonne « Titre » n'a pu être identifiée. Ajustez le mappage des colonnes."
        }
    }
}

public enum ImportateurConstats {

    // MARK: - Passe 1 : lecture et détection

    public static func preparer(url: URL) throws -> PreparationImport {
        let feuilles = try lireFeuilles(url: url)
        guard !feuilles.isEmpty else { throw ErreurImport.aucuneDonnee }

        // On retient la feuille dont l'en-tête est la mieux reconnue ; à égalité,
        // la plus garnie.
        var meilleurIndex = 0
        var meilleurScore = -1
        var meilleureLigne = 0
        for (index, feuille) in feuilles.enumerated() {
            let (ligne, score) = ligneEntetesProbable(feuille)
            let pondere = score * 1_000 + min(feuille.densite, 999)
            if pondere > meilleurScore {
                meilleurScore = pondere
                meilleurIndex = index
                meilleureLigne = ligne
            }
        }

        let feuille = feuilles[meilleurIndex]
        let entetes = meilleureLigne < feuille.lignes.count ? feuille.lignes[meilleureLigne] : []
        guard !entetes.isEmpty else { throw ErreurImport.aucuneDonnee }

        return PreparationImport(url: url,
                                 feuilles: feuilles,
                                 indexFeuilleChoisie: meilleurIndex,
                                 ligneEntetes: meilleureLigne,
                                 mappage: MappageColonnes.detecter(entetes: entetes))
    }

    static func lireFeuilles(url: URL) throws -> [FeuilleBrute] {
        switch url.pathExtension.lowercased() {
        case "xlsx", "xlsm":
            return try LecteurXLSX.lire(url: url)
        case "csv", "tsv", "txt":
            return [try LecteurCSV.lire(url: url)]
        case let autre:
            throw ErreurImport.formatNonSupporte(autre)
        }
    }

    /// Ligne d'en-têtes la plus plausible dans les 25 premières lignes,
    /// et nombre de champs du BSI qu'elle permet de reconnaître.
    static func ligneEntetesProbable(_ feuille: FeuilleBrute) -> (ligne: Int, score: Int) {
        var meilleure = 0
        var meilleurScore = 0
        for index in feuille.lignes.indices.prefix(25) {
            let ligne = feuille.lignes[index]
            guard ligne.contains(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty }) else {
                continue
            }
            let mappage = MappageColonnes.detecter(entetes: ligne)
            let score = mappage.colonnes.count
            if score > meilleurScore {
                meilleurScore = score
                meilleure = index
            }
        }
        return (meilleure, meilleurScore)
    }

    // MARK: - Passe 2 : construction des constats

    public static func construire(preparation: PreparationImport,
                                  mappage: MappageColonnes,
                                  resolveurPhotos: ResolveurPhotos) throws
        -> (constats: [ConstatImporte], rapport: RapportImport) {

        guard mappage.colonnes[.titre] != nil else {
            throw ErreurImport.colonneTitreIntrouvable
        }

        let feuille = preparation.feuille
        var rapport = RapportImport()
        rapport.nomFeuille = feuille.nom
        var constats: [ConstatImporte] = []

        let premiereLigne = preparation.ligneEntetes + 1
        guard premiereLigne < feuille.lignes.count else { throw ErreurImport.aucuneDonnee }

        for index in premiereLigne..<feuille.lignes.count {
            rapport.lignesLues += 1
            let numeroExcel = index + 1

            func cellule(_ champ: ChampConstat, hyperlien: Bool = false) -> String? {
                guard let colonne = mappage.colonnes[champ] else { return nil }
                let brut = feuille.valeur(ligne: index, colonne: colonne, prefererHyperlien: hyperlien)
                return NormalisationTexte.valeurAffichable(brut)
            }

            let titre = cellule(.titre)
            let description = cellule(.description)
            guard titre != nil || description != nil else {
                rapport.lignesIgnorees += 1
                continue
            }

            // Une ligne sans titre mais avec description reste importable :
            // on promeut la première phrase de la description en titre.
            var titreFinal = titre ?? ""
            if titreFinal.isEmpty, let description {
                titreFinal = premierePhrase(description)
                rapport.avertissements.append(
                    .init(ligne: numeroExcel, message: "titre absent, déduit de la description"))
            }

            var occurrence = 1
            if let brut = cellule(.occurrence) {
                if let valeur = ValueParsing.occurrence(brut) {
                    occurrence = valeur
                } else {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "occurrence illisible « \(brut) », ramenée à 1"))
                }
            }

            var prix: Decimal?
            if let brut = cellule(.prixUnitaire) {
                prix = ValueParsing.montant(brut)
                if prix == nil {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "prix illisible « \(brut) »"))
                }
            }

            var gravite: Gravite?
            if let brut = cellule(.gravite) {
                gravite = Gravite.depuis(brut, echelleInversee: mappage.echelleGraviteInversee)
                if gravite == nil {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "gravité non reconnue « \(brut) »"))
                }
            }

            var photos: [ReferencePhoto] = []
            if let brut = cellule(.photo, hyperlien: true) {
                photos = resolveurPhotos.resoudre(brut)
                for photo in photos {
                    if case .introuvable(let lien) = photo {
                        rapport.avertissements.append(
                            .init(ligne: numeroExcel, message: "photo introuvable « \(lien) »"))
                    }
                }
            }

            var supplementaires: [String: String] = [:]
            for colonne in mappage.colonnesNonMappees {
                let entete = colonne < mappage.entetes.count ? mappage.entetes[colonne] : "Colonne \(colonne + 1)"
                if let valeur = NormalisationTexte.valeurAffichable(
                    feuille.valeur(ligne: index, colonne: colonne)),
                   !entete.trimmingCharacters(in: .whitespaces).isEmpty {
                    supplementaires[entete] = valeur
                }
            }

            constats.append(ConstatImporte(
                ligneSource: numeroExcel,
                titre: titreFinal,
                description: description,
                recommandation: cellule(.recommandation),
                occurrence: occurrence,
                prixUnitaire: prix,
                gravite: gravite,
                localisation: cellule(.localisation),
                categorie: cellule(.categorie),
                photos: photos,
                champsSupplementaires: supplementaires
            ))
        }

        rapport.constatsRetenus = constats.count
        return (constats, rapport)
    }

    private static func premierePhrase(_ texte: String) -> String {
        let coupure = texte.firstIndex(where: { $0 == "." || $0 == "\n" })
        let extrait = coupure.map { String(texte[texte.startIndex..<$0]) } ?? texte
        return String(extrait.prefix(120))
    }
}
