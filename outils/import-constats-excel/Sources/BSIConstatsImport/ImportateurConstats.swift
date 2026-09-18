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
    /// Décisions prises automatiquement en regardant les valeurs (colonne de coût total
    /// reconnue, gravité déduite d'une colonne de codes, unité devinée…).
    public var ajustements: [String] = []

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
        if !ajustements.isEmpty {
            lignes.append("")
            lignes.append("Lecture automatique :")
            lignes.append(contentsOf: ajustements.map { "- " + $0 })
        }
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

        // Les passes de validation par les valeurs ont besoin des lignes de données.
        let donnees = Array(feuille.lignes.dropFirst(meilleureLigne + 1))
        return PreparationImport(url: url,
                                 feuilles: feuilles,
                                 indexFeuilleChoisie: meilleurIndex,
                                 ligneEntetes: meilleureLigne,
                                 mappage: MappageColonnes.detecter(entetes: entetes,
                                                                   donnees: donnees))
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
        rapport.ajustements = mappage.ajustements
        var constats: [ConstatImporte] = []

        let premiereLigne = preparation.ligneEntetes + 1
        guard premiereLigne < feuille.lignes.count else { throw ErreurImport.aucuneDonnee }

        for index in premiereLigne..<feuille.lignes.count {
            rapport.lignesLues += 1
            let numeroExcel = index + 1

            func cellule(_ champ: ChampConstat) -> String? {
                guard let colonne = mappage.colonnes[champ] else { return nil }
                return NormalisationTexte.valeurAffichable(feuille.valeur(ligne: index, colonne: colonne))
            }

            // Les liens de photos peuvent venir de plusieurs colonnes (« Photo 1 »,
            // « Photo 2 ») et le lien réel prime sur le texte affiché dans la cellule.
            let liensPhotos = mappage.toutesLesColonnesPhotos.compactMap { colonne in
                NormalisationTexte.valeurAffichable(
                    feuille.valeur(ligne: index, colonne: colonne, prefererHyperlien: true))
            }

            let champsLus = ChampConstat.allCases.compactMap(cellule)
            guard !champsLus.isEmpty || !liensPhotos.isEmpty else {
                rapport.lignesIgnorees += 1
                continue
            }

            // Titre et description. Un chiffrier n'a souvent qu'une seule colonne de texte :
            // le paragraphe complet devient la description et son amorce devient le titre,
            // comme sur le terrain où le titre est une étiquette courte.
            var titre = cellule(.titre)
            var description = cellule(.description)
            if let texte = titre, description == nil, texte.count > 110 {
                description = texte
                titre = NormalisationTexte.amorce(texte)
            }
            if titre == nil {
                if let source = description ?? cellule(.recommandation) {
                    titre = NormalisationTexte.amorce(source)
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "titre absent, déduit du texte de la ligne"))
                } else {
                    titre = "Constat sans titre (ligne \(numeroExcel))"
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "aucun texte de constat sur cette ligne"))
                }
            }

            var occurrence = 1
            if let brut = cellule(.occurrence) {
                if let valeur = ValueParsing.occurrence(brut) {
                    occurrence = valeur
                } else {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "quantité illisible « \(brut) », ramenée à 1"))
                }
            }

            var prixUnitaire: Decimal?
            if let brut = cellule(.prixUnitaire) {
                prixUnitaire = ValueParsing.montant(brut)
                if prixUnitaire == nil {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "prix unitaire illisible « \(brut) »"))
                }
            }

            var prixTotalChiffrier: Decimal?
            if let brut = cellule(.prixTotal) {
                prixTotalChiffrier = ValueParsing.montant(brut)
                if prixTotalChiffrier == nil {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "coût total illisible « \(brut) »"))
                }
            }
            if let total = prixTotalChiffrier, let unitaire = prixUnitaire,
               total != unitaire * Decimal(occurrence) {
                rapport.avertissements.append(.init(
                    ligne: numeroExcel,
                    message: "le coût du chiffrier (\(total)) diffère de \(occurrence) × \(unitaire) ; "
                           + "c'est celui du chiffrier qui est retenu"))
            }

            // Le code de priorité fait foi ; l'échelle de gravité ne sert qu'à défaut.
            var priorite: Priorite?
            var gravite: Gravite?
            let graviteSource = cellule(.gravite)
            if let brut = graviteSource {
                priorite = Priorite.depuis(brut)
                if priorite == nil {
                    gravite = Gravite.depuis(brut, echelleInversee: mappage.echelleGraviteInversee)
                }
                if priorite == nil && gravite == nil {
                    rapport.avertissements.append(
                        .init(ligne: numeroExcel, message: "priorité non reconnue « \(brut) »"))
                }
            }

            var photos: [ReferencePhoto] = []
            for lien in liensPhotos {
                let resolues = resolveurPhotos.resoudre(lien)
                for photo in resolues {
                    if case .introuvable(let brut) = photo {
                        rapport.avertissements.append(
                            .init(ligne: numeroExcel, message: "photo introuvable « \(brut) »"))
                    }
                }
                photos.append(contentsOf: resolues)
            }

            var supplementaires: [String: String] = [:]
            for colonne in mappage.colonnesNonMappees {
                let entete = colonne < mappage.entetes.count ? mappage.entetes[colonne] : ""
                guard !entete.trimmingCharacters(in: .whitespaces).isEmpty else { continue }
                if let valeur = NormalisationTexte.valeurAffichable(
                    feuille.valeur(ligne: index, colonne: colonne)) {
                    supplementaires[entete] = valeur
                }
            }

            constats.append(ConstatImporte(
                ligneSource: numeroExcel,
                titre: titre ?? "Constat sans titre",
                description: description,
                recommandation: cellule(.recommandation),
                occurrence: occurrence,
                unite: cellule(.unite),
                prixUnitaire: prixUnitaire,
                prixTotalChiffrier: prixTotalChiffrier,
                priorite: priorite,
                gravite: gravite,
                graviteSource: graviteSource,
                localisations: (cellule(.localisation) ?? "")
                    .split(whereSeparator: { $0 == ";" || $0 == "\n" })
                    .map { $0.trimmingCharacters(in: .whitespaces) }
                    .filter { !$0.isEmpty },
                categorie: cellule(.categorie),
                photos: photos,
                champsSupplementaires: supplementaires
            ))
        }

        rapport.constatsRetenus = constats.count
        return (constats, rapport)
    }

}
