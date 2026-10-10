import Foundation

/// Lecteur `.xlsx` sans dépendance : décompresse le classeur (MiniZip) puis
/// lit les parties XML utiles avec `XMLParser`.
///
/// Pris en charge : chaînes partagées, chaînes en ligne, nombres, formules
/// (valeur mise en cache), hyperliens de cellule, feuilles multiples.
/// Non pris en charge : images incorporées comme objets flottants, formats de
/// date (une date revient sous forme de nombre de série Excel).
public enum LecteurXLSX {

    public static func lire(url: URL) throws -> [FeuilleBrute] {
        let donnees = try Data(contentsOf: url)
        let index = try MiniZip.index(donnees)

        let chainesPartagees = try lireChainesPartagees(donnees, index)
        let feuillesDeclarees = try lireDeclarationsFeuilles(donnees, index)

        var feuilles: [FeuilleBrute] = []
        for declaration in feuillesDeclarees {
            guard let xml = try MiniZip.extraire(declaration.chemin, de: donnees, index: index) else {
                continue
            }
            let liens = try lireRelationsFeuille(declaration.chemin, donnees, index)
            let analyseur = AnalyseurFeuille(chainesPartagees: chainesPartagees,
                                             relations: liens)
            let feuille = try analyseur.analyser(xml: xml, nom: declaration.nom)
            feuilles.append(feuille)
        }

        guard !feuilles.isEmpty else { throw MiniZip.Erreur.entreeIntrouvable("xl/worksheets/*.xml") }
        return feuilles
    }

    // MARK: - Parties du classeur

    private struct DeclarationFeuille {
        let nom: String
        let chemin: String
    }

    private static func lireChainesPartagees(_ donnees: Data,
                                             _ index: [String: MiniZip.Entree]) throws -> [String] {
        guard let xml = try MiniZip.extraire("xl/sharedStrings.xml", de: donnees, index: index) else {
            return []
        }
        let delegue = AnalyseurChainesPartagees()
        let analyseur = XMLParser(data: xml)
        analyseur.delegate = delegue
        analyseur.parse()
        return delegue.chaines
    }

    private static func lireDeclarationsFeuilles(_ donnees: Data,
                                                 _ index: [String: MiniZip.Entree]) throws -> [DeclarationFeuille] {
        let classeur = try MiniZip.extraireRequis("xl/workbook.xml", de: donnees, index: index)
        let delegueClasseur = AnalyseurClasseur()
        let analyseurClasseur = XMLParser(data: classeur)
        analyseurClasseur.delegate = delegueClasseur
        analyseurClasseur.parse()

        let relations = try lireRelations("xl/_rels/workbook.xml.rels", donnees, index)

        var declarations: [DeclarationFeuille] = []
        for feuille in delegueClasseur.feuilles {
            var cible = relations[feuille.relationId] ?? ""
            if cible.isEmpty {
                // Repli : classeur sans relations exploitables.
                cible = "worksheets/sheet\(declarations.count + 1).xml"
            }
            let chemin = cible.hasPrefix("/")
                ? String(cible.dropFirst())
                : "xl/" + cible.replacingOccurrences(of: "../", with: "")
            declarations.append(DeclarationFeuille(nom: feuille.nom, chemin: chemin))
        }
        return declarations
    }

    private static func lireRelationsFeuille(_ cheminFeuille: String,
                                             _ donnees: Data,
                                             _ index: [String: MiniZip.Entree]) throws -> [String: String] {
        let dossier = (cheminFeuille as NSString).deletingLastPathComponent
        let fichier = (cheminFeuille as NSString).lastPathComponent
        return try lireRelations("\(dossier)/_rels/\(fichier).rels", donnees, index)
    }

    private static func lireRelations(_ chemin: String,
                                      _ donnees: Data,
                                      _ index: [String: MiniZip.Entree]) throws -> [String: String] {
        guard let xml = try MiniZip.extraire(chemin, de: donnees, index: index) else { return [:] }
        let delegue = AnalyseurRelations()
        let analyseur = XMLParser(data: xml)
        analyseur.delegate = delegue
        analyseur.parse()
        return delegue.relations
    }

    // MARK: - Utilitaires

    /// « BC12 » → colonne 54 (0-based).
    static func indexColonne(depuisReference reference: String) -> Int {
        var index = 0
        for caractere in reference.uppercased() {
            guard let ascii = caractere.asciiValue, ascii >= 65, ascii <= 90 else { break }
            index = index * 26 + Int(ascii - 64)
        }
        return max(0, index - 1)
    }

    /// « BC12 » → ligne 11 (0-based).
    static func indexLigne(depuisReference reference: String) -> Int? {
        let chiffres = reference.drop { $0.isLetter }
        guard let ligne = Int(chiffres), ligne > 0 else { return nil }
        return ligne - 1
    }
}

// MARK: - Délégués XML

private final class AnalyseurChainesPartagees: NSObject, XMLParserDelegate {
    private(set) var chaines: [String] = []
    private var courante: String?
    private var capture = false

    func parser(_ parser: XMLParser, didStartElement element: String, namespaceURI: String?,
                qualifiedName: String?, attributes: [String: String] = [:]) {
        switch element {
        case "si": courante = ""
        case "t": capture = true
        default: break
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        if capture { courante? += string }
    }

    func parser(_ parser: XMLParser, didEndElement element: String, namespaceURI: String?,
                qualifiedName: String?) {
        switch element {
        case "t": capture = false
        case "si":
            chaines.append(courante ?? "")
            courante = nil
        default: break
        }
    }
}

private final class AnalyseurClasseur: NSObject, XMLParserDelegate {
    struct Feuille { let nom: String; let relationId: String }
    private(set) var feuilles: [Feuille] = []

    func parser(_ parser: XMLParser, didStartElement element: String, namespaceURI: String?,
                qualifiedName: String?, attributes: [String: String] = [:]) {
        guard element == "sheet" else { return }
        // L'état « très masqué » sert souvent de feuille technique : on l'ignore.
        if let etat = attributes["state"], etat != "visible" { return }
        let nom = attributes["name"] ?? "Feuille \(feuilles.count + 1)"
        let relation = attributes["r:id"] ?? attributes["id"] ?? ""
        feuilles.append(Feuille(nom: nom, relationId: relation))
    }
}

private final class AnalyseurRelations: NSObject, XMLParserDelegate {
    private(set) var relations: [String: String] = [:]

    func parser(_ parser: XMLParser, didStartElement element: String, namespaceURI: String?,
                qualifiedName: String?, attributes: [String: String] = [:]) {
        guard element == "Relationship",
              let identifiant = attributes["Id"],
              let cible = attributes["Target"] else { return }
        relations[identifiant] = cible
    }
}

private final class AnalyseurFeuille: NSObject, XMLParserDelegate {
    private let chainesPartagees: [String]
    private let relations: [String: String]

    private var cellules: [PositionCellule: String] = [:]
    private var hyperliens: [PositionCellule: String] = [:]
    private var derniereLigne = -1
    private var derniereColonne = -1

    private var ligneCourante = -1
    private var colonneCourante = -1
    private var typeCourant = ""
    private var valeurCourante = ""
    private var capture = false
    private var dansFormule = false

    init(chainesPartagees: [String], relations: [String: String]) {
        self.chainesPartagees = chainesPartagees
        self.relations = relations
    }

    func analyser(xml: Data, nom: String) throws -> FeuilleBrute {
        let analyseur = XMLParser(data: xml)
        analyseur.delegate = self
        guard analyseur.parse() else {
            throw MiniZip.Erreur.donneesCorrompues(nom)
        }

        var lignes = Array(repeating: Array(repeating: "", count: derniereColonne + 1),
                           count: derniereLigne + 1)
        for (position, valeur) in cellules {
            lignes[position.ligne][position.colonne] = valeur
        }
        return FeuilleBrute(nom: nom, lignes: lignes, hyperliens: hyperliens)
    }

    func parser(_ parser: XMLParser, didStartElement element: String, namespaceURI: String?,
                qualifiedName: String?, attributes: [String: String] = [:]) {
        switch element {
        case "row":
            if let reference = attributes["r"], let ligne = Int(reference) {
                ligneCourante = ligne - 1
            } else {
                ligneCourante += 1
            }
            colonneCourante = -1
            derniereLigne = max(derniereLigne, ligneCourante)

        case "c":
            if let reference = attributes["r"] {
                colonneCourante = LecteurXLSX.indexColonne(depuisReference: reference)
                if let ligne = LecteurXLSX.indexLigne(depuisReference: reference) {
                    ligneCourante = ligne
                    derniereLigne = max(derniereLigne, ligne)
                }
            } else {
                colonneCourante += 1
            }
            typeCourant = attributes["t"] ?? "n"
            valeurCourante = ""
            derniereColonne = max(derniereColonne, colonneCourante)

        case "f":
            dansFormule = true

        case "v", "t":
            capture = !dansFormule

        case "hyperlink":
            guard let reference = attributes["ref"] else { return }
            let premiereCellule = reference.split(separator: ":").first.map(String.init) ?? reference
            guard let ligne = LecteurXLSX.indexLigne(depuisReference: premiereCellule) else { return }
            let colonne = LecteurXLSX.indexColonne(depuisReference: premiereCellule)
            let cible = attributes["r:id"].flatMap { relations[$0] }
                ?? attributes["location"]
                ?? attributes["display"]
            if let cible, !cible.isEmpty {
                hyperliens[PositionCellule(ligne: ligne, colonne: colonne)] = cible
            }

        default:
            break
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        if capture { valeurCourante += string }
    }

    func parser(_ parser: XMLParser, didEndElement element: String, namespaceURI: String?,
                qualifiedName: String?) {
        switch element {
        case "f":
            dansFormule = false
        case "v", "t":
            capture = false
        case "c":
            enregistrerCellule()
        default:
            break
        }
    }

    private func enregistrerCellule() {
        guard ligneCourante >= 0, colonneCourante >= 0 else { return }
        let brut = valeurCourante
        guard !brut.isEmpty else { return }

        let valeur: String
        switch typeCourant {
        case "s":
            guard let index = Int(brut), chainesPartagees.indices.contains(index) else { return }
            valeur = chainesPartagees[index]
        case "b":
            valeur = brut == "1" ? "vrai" : "faux"
        case "e":
            valeur = ""          // cellule en erreur (#N/A…) : traitée comme vide
        default:
            valeur = brut        // nombre, « str », « inlineStr »
        }

        let propre = valeur.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !propre.isEmpty else { return }
        cellules[PositionCellule(ligne: ligneCourante, colonne: colonneCourante)] = propre
    }
}
