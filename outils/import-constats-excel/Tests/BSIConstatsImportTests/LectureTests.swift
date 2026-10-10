import XCTest
@testable import BSIConstatsImport

final class LectureCSVTests: XCTestCase {

    func testChampsEntreGuillemets() {
        let texte = "Titre;Description\n\"Fissure; importante\";\"Ligne 1\nLigne 2\"\n"
        let lignes = LecteurCSV.analyser(texte, separateur: ";")
        XCTAssertEqual(lignes.count, 2)
        XCTAssertEqual(lignes[1][0], "Fissure; importante")
        XCTAssertEqual(lignes[1][1], "Ligne 1\nLigne 2")
    }

    func testGuillemetEchappe() {
        let lignes = LecteurCSV.analyser("a;\"il a dit \"\"oui\"\"\"\n", separateur: ";")
        XCTAssertEqual(lignes[0][1], "il a dit \"oui\"")
    }

    func testDetectionSeparateur() {
        XCTAssertEqual(LecteurCSV.detecterSeparateur("a;b;c\n1;2;3"), ";")
        XCTAssertEqual(LecteurCSV.detecterSeparateur("a,b,c\n1,2,3"), ",")
        XCTAssertEqual(LecteurCSV.detecterSeparateur("a\tb\tc"), "\t")
    }
}

final class LectureXLSXTests: XCTestCase {

    private func fixture(_ nom: String) throws -> URL {
        guard let url = Bundle.module.url(forResource: nom, withExtension: nil,
                                          subdirectory: "Fixtures") else {
            throw XCTSkip("Fixture \(nom) absente — exécuter Gabarit/generer-gabarit.py")
        }
        return url
    }

    func testLectureFeuille() throws {
        let feuilles = try LecteurXLSX.lire(url: try fixture("exemple-constats.xlsx"))
        XCTAssertEqual(feuilles.count, 1)
        let feuille = feuilles[0]
        XCTAssertEqual(feuille.nom, "Constats")
        XCTAssertEqual(feuille.lignes.count, 6)
        XCTAssertEqual(feuille.lignes[0][0], "Titre")
        XCTAssertEqual(feuille.lignes[1][5], "Majeur")
        XCTAssertTrue(feuille.lignes[4].allSatisfy(\.isEmpty), "la ligne 5 est vide")
    }

    func testHyperlienPrimeSurTexte() throws {
        let feuille = try LecteurXLSX.lire(url: try fixture("exemple-constats.xlsx"))[0]
        let position = PositionCellule(ligne: 5, colonne: 6)
        XCTAssertEqual(feuille.hyperliens[position], "https://exemple.ca/photos/ventilateur.jpg")
        XCTAssertEqual(feuille.valeur(ligne: 5, colonne: 6), "photo")
        XCTAssertEqual(feuille.valeur(ligne: 5, colonne: 6, prefererHyperlien: true),
                       "https://exemple.ca/photos/ventilateur.jpg")
    }

    func testReferencesDeCellules() {
        XCTAssertEqual(LecteurXLSX.indexColonne(depuisReference: "A1"), 0)
        XCTAssertEqual(LecteurXLSX.indexColonne(depuisReference: "Z9"), 25)
        XCTAssertEqual(LecteurXLSX.indexColonne(depuisReference: "AA1"), 26)
        XCTAssertEqual(LecteurXLSX.indexColonne(depuisReference: "BC12"), 54)
        XCTAssertEqual(LecteurXLSX.indexLigne(depuisReference: "BC12"), 11)
        XCTAssertNil(LecteurXLSX.indexLigne(depuisReference: "BC"))
    }

    func testImportComplet() throws {
        let url = try fixture("exemple-constats.xlsx")
        let preparation = try ImportateurConstats.preparer(url: url)
        XCTAssertEqual(preparation.ligneEntetes, 0)
        XCTAssertTrue(preparation.mappage.estComplet)

        let resolveur = ResolveurPhotos(dossierChiffrier: url.deletingLastPathComponent())
        let (constats, rapport) = try ImportateurConstats.construire(
            preparation: preparation, mappage: preparation.mappage, resolveurPhotos: resolveur)

        XCTAssertEqual(rapport.lignesLues, 5)
        XCTAssertEqual(rapport.constatsRetenus, 4)
        XCTAssertEqual(rapport.lignesIgnorees, 1)
        XCTAssertEqual(constats.count, 4)

        // Ligne 2 : tout est lisible.
        XCTAssertEqual(constats[0].titre, "Fissure verticale en fondation")
        XCTAssertEqual(constats[0].gravite, .majeure)
        XCTAssertEqual(constats[0].occurrence, 2)
        XCTAssertEqual(constats[0].prixUnitaire, Decimal(string: "1234.56"))
        XCTAssertEqual(constats[0].prixTotal, Decimal(string: "2469.12"))
        if case .distante = constats[0].photos.first { } else {
            XCTFail("la photo devait être reconnue comme distante")
        }

        // Ligne 3 : titre déduit de la description, photo locale introuvable.
        XCTAssertEqual(constats[1].occurrence, 14)
        XCTAssertTrue(constats[1].titre.hasPrefix("Calfeutrage"))
        XCTAssertEqual(constats[1].gravite, .moderee)
        if case .introuvable = constats[1].photos.first { } else {
            XCTFail("la photo locale absente devait être signalée")
        }

        // Ligne 4 : prix illisible mais constat conservé.
        XCTAssertEqual(constats[2].gravite, .critique)
        XCTAssertNil(constats[2].prixUnitaire)

        // Ligne 6 : occurrence « x2 », gravité numérique, photo par hyperlien.
        XCTAssertEqual(constats[3].occurrence, 2)
        XCTAssertEqual(constats[3].gravite, .moderee)
        XCTAssertEqual(constats[3].prixUnitaire, Decimal(325))
        XCTAssertEqual(constats[3].photos.first?.url?.absoluteString,
                       "https://exemple.ca/photos/ventilateur.jpg")

        XCTAssertEqual(rapport.avertissements.count, 3,
                       "titre déduit, photo introuvable, prix illisible")
    }

    func testImportCSVEquivalent() throws {
        let url = try fixture("exemple-constats.csv")
        let preparation = try ImportateurConstats.preparer(url: url)
        let (constats, rapport) = try ImportateurConstats.construire(
            preparation: preparation,
            mappage: preparation.mappage,
            resolveurPhotos: ResolveurPhotos(dossierChiffrier: nil))
        XCTAssertEqual(constats.count, 4)
        XCTAssertEqual(rapport.lignesIgnorees, 1)
        XCTAssertEqual(constats[0].prixUnitaire, Decimal(string: "1234.56"))
    }
}

final class ResolveurPhotosTests: XCTestCase {

    func testDecoupageDesSegments() {
        let resolveur = ResolveurPhotos(dossierChiffrier: nil)
        XCTAssertEqual(resolveur.segments("a.jpg; b.jpg"), ["a.jpg", "b.jpg"])
        XCTAssertEqual(resolveur.segments("a.jpg\nb.jpg"), ["a.jpg", "b.jpg"])
        XCTAssertEqual(resolveur.segments("a.jpg,b.jpg"), ["a.jpg", "b.jpg"])
        XCTAssertEqual(resolveur.segments("salle 3, mur nord.jpg"), ["salle 3, mur nord.jpg"],
                       "une virgule dans un libellé ne doit pas couper la référence")
    }

    func testFichierTrouveParNomInsensibleALaCasse() throws {
        let dossier = FileManager.default.temporaryDirectory
            .appendingPathComponent("photos-test-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: dossier, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: dossier) }

        let fichier = dossier.appendingPathComponent("P1010321.JPG")
        try Data([0xFF, 0xD8, 0xFF]).write(to: fichier)

        let resolveur = ResolveurPhotos(dossierChiffrier: nil, dossierPhotos: dossier)
        guard case .fichier(let trouve) = resolveur.resoudre("p1010321").first else {
            return XCTFail("le fichier devait être retrouvé sans extension ni casse exacte")
        }
        XCTAssertEqual(trouve.lastPathComponent, "P1010321.JPG")
    }
}
