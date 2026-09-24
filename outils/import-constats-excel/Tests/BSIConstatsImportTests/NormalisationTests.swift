import XCTest
@testable import BSIConstatsImport

final class NormalisationTests: XCTestCase {

    func testMontantsQuebecois() {
        XCTAssertEqual(ValueParsing.montant("1 234,56 $"), Decimal(string: "1234.56"))
        XCTAssertEqual(ValueParsing.montant("1\u{00A0}234,56 $"), Decimal(string: "1234.56"))
        XCTAssertEqual(ValueParsing.montant("$1,234.56"), Decimal(string: "1234.56"))
        XCTAssertEqual(ValueParsing.montant("85,00"), Decimal(85))
        XCTAssertEqual(ValueParsing.montant("1 500"), Decimal(1500))
        XCTAssertEqual(ValueParsing.montant("2 500,5 CAD"), Decimal(string: "2500.5"))
        XCTAssertEqual(ValueParsing.montant("(1 200,00)"), Decimal(-1200))
        XCTAssertNil(ValueParsing.montant("à valider"))
        XCTAssertNil(ValueParsing.montant(""))
    }

    func testOccurrences() {
        XCTAssertEqual(ValueParsing.occurrence("3"), 3)
        XCTAssertEqual(ValueParsing.occurrence("x3"), 3)
        XCTAssertEqual(ValueParsing.occurrence("14 unités"), 14)
        XCTAssertEqual(ValueParsing.occurrence("0"), 1, "une occurrence nulle n'a pas de sens")
        XCTAssertNil(ValueParsing.occurrence("plusieurs"))
    }

    func testGravites() {
        XCTAssertEqual(Gravite.depuis("Majeur"), .majeure)
        XCTAssertEqual(Gravite.depuis("modéré"), .moderee)
        XCTAssertEqual(Gravite.depuis("URGENCE"), .critique)
        XCTAssertEqual(Gravite.depuis("Faible"), .mineure)
        XCTAssertEqual(Gravite.depuis("Pour information"), .observation)
        XCTAssertEqual(Gravite.depuis("4"), .majeure)
        XCTAssertEqual(Gravite.depuis("1", echelleInversee: true), .critique)
        XCTAssertEqual(Gravite.depuis("5", echelleInversee: true), .observation)
        XCTAssertNil(Gravite.depuis("à discuter avec le client"))
        XCTAssertNil(Gravite.depuis(""))
    }

    func testCleNormalisee() {
        XCTAssertEqual(NormalisationTexte.cle("Prix unitaire ($)"), "prix unitaire")
        XCTAssertEqual(NormalisationTexte.cle("  GRAVITÉ  "), "gravite")
        XCTAssertEqual(NormalisationTexte.cle("Coût / unité"), "cout unite")
    }

    func testValeurAffichable() {
        XCTAssertEqual(NormalisationTexte.valeurAffichable("  texte  "), "texte")
        XCTAssertEqual(NormalisationTexte.valeurAffichable("ligne 1_x000D_\nligne 2"), "ligne 1\nligne 2")
        XCTAssertNil(NormalisationTexte.valeurAffichable("   "))
        XCTAssertNil(NormalisationTexte.valeurAffichable(nil))
    }
}

final class MappageTests: XCTestCase {

    func testDetectionEntetesFrancais() {
        let mappage = MappageColonnes.detecter(entetes: [
            "Titre", "Description", "Recommandation", "Occurrence",
            "Prix unitaire", "Gravité", "Lien photo", "Localisation", "Catégorie"
        ])
        XCTAssertTrue(mappage.estComplet)
        XCTAssertEqual(mappage.colonnes[.titre], 0)
        XCTAssertEqual(mappage.colonnes[.prixUnitaire], 4)
        XCTAssertEqual(mappage.colonnes[.gravite], 5)
        XCTAssertEqual(mappage.colonnes[.photo], 6)
        XCTAssertTrue(mappage.colonnesNonMappees.isEmpty)
    }

    func testDetectionEntetesApprochants() {
        let mappage = MappageColonnes.detecter(entetes: [
            "Constat", "Observations détaillées", "Correctif recommandé",
            "Qté", "Coût estimé ($)", "Niveau de gravité", "URL photo", "Zone"
        ])
        XCTAssertEqual(mappage.colonnes[.titre], 0)
        XCTAssertEqual(mappage.colonnes[.occurrence], 3)
        XCTAssertEqual(mappage.colonnes[.prixUnitaire], 4)
        XCTAssertEqual(mappage.colonnes[.gravite], 5)
        XCTAssertEqual(mappage.colonnes[.photo], 6)
        XCTAssertEqual(mappage.colonnes[.localisation], 7)
    }

    func testColonnesInconnuesConservees() {
        let mappage = MappageColonnes.detecter(entetes: ["Titre", "No de mandat", "Inspecteur"])
        XCTAssertTrue(mappage.estComplet)
        XCTAssertEqual(mappage.colonnesNonMappees, [1, 2])
    }

    func testSignatureStable() {
        let premier = MappageColonnes.detecter(entetes: ["Titre", "GRAVITÉ"])
        let second = MappageColonnes.detecter(entetes: ["  titre ", "gravite"])
        XCTAssertEqual(premier.signature, second.signature)
    }
}
