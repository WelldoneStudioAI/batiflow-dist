import XCTest
@testable import BSIConstatsImport

/// Jeu d'essai calqué sur un vrai chiffrier de mandat BSI : colonnes de provenance,
/// code de priorité (U, CT, MT, LT, LT+, EX, CO), quantité + unité sans en-tête,
/// coût total qui ne correspond pas toujours à quantité × prix unitaire, deux colonnes
/// de photos, lignes vides au milieu du tableau, ligne sans texte de constat.
final class RapportBSITests: XCTestCase {

    private func preparation() throws -> PreparationImport {
        guard let url = Bundle.module.url(forResource: "exemple-rapport-bsi.xlsx",
                                         withExtension: nil, subdirectory: "Fixtures") else {
            throw XCTSkip("Fixture absente — exécuter Gabarit/generer-gabarit.py")
        }
        return try ImportateurConstats.preparer(url: url)
    }

    private func importer() throws -> (constats: [ConstatImporte], rapport: RapportImport) {
        let preparation = try preparation()
        return try ImportateurConstats.construire(
            preparation: preparation,
            mappage: preparation.mappage,
            resolveurPhotos: ResolveurPhotos(dossierChiffrier: nil))
    }

    // MARK: - Choix de la feuille et des colonnes

    func testLaFeuilleDeConstatsEstChoisieParmiTrois() throws {
        let preparation = try preparation()
        XCTAssertEqual(preparation.feuilles.count, 3, "Lisez-moi, Extérieur, Par composante")
        XCTAssertEqual(preparation.feuille.nom, "Extérieur",
                       "ni la page d'explications ni le sommaire ne doivent être retenus")
        XCTAssertEqual(preparation.ligneEntetes, 0)
    }

    func testMappageDUnVraiChiffrier() throws {
        let mappage = try preparation().mappage
        XCTAssertTrue(mappage.estComplet)
        XCTAssertEqual(mappage.colonnes[.titre], 9, "colonne « Constat »")
        XCTAssertEqual(mappage.colonnes[.recommandation], 11)
        XCTAssertEqual(mappage.colonnes[.occurrence], 14, "colonne « Qtes »")
        XCTAssertEqual(mappage.colonnes[.unite], 15, "colonne sans en-tête, à droite de Qtes")
        XCTAssertEqual(mappage.colonnes[.prixUnitaire], 16, "colonne « Cout unitaire »")
        XCTAssertEqual(mappage.colonnes[.prixTotal], 17, "colonne « Coût ($) »")
        XCTAssertEqual(mappage.colonnes[.gravite], 13, "colonne « Code » de priorités")
        XCTAssertEqual(mappage.colonnes[.photo], 19, "colonne « Photo 1 »")
        XCTAssertEqual(mappage.colonnesPhotosSupplementaires, [20], "colonne « Photo 2 »")
        XCTAssertEqual(mappage.colonnes[.localisation], 10)
        XCTAssertEqual(mappage.colonnes[.categorie], 6, "« Composante » plutôt que « Section »")
    }

    func testUneNoteDeBudgetNEstPasPriseParUnChampNumeriqueNiPourDescription() throws {
        let mappage = try preparation().mappage
        let colonneNote = 12                                  // « Budget (note) »
        XCTAssertNotEqual(mappage.colonnes[.prixUnitaire], colonneNote)
        XCTAssertNotEqual(mappage.colonnes[.prixTotal], colonneNote,
                          "« 650$/margelle » n'est pas un montant")
        XCTAssertNotEqual(mappage.colonnes[.description], colonneNote,
                          "le mot « note » dans l'en-tête ne doit pas en faire une description")
        XCTAssertTrue(mappage.colonnesNonMappees.contains(colonneNote))
    }

    func testDecisionsAutomatiquesConsignees() throws {
        let mappage = try preparation().mappage
        XCTAssertEqual(mappage.ajustements.count, 2)
        XCTAssertTrue(mappage.ajustements.contains { $0.lowercased().contains("coût total") })
        XCTAssertTrue(mappage.ajustements.contains { $0.lowercased().contains("unité") })
    }

    // MARK: - Constats produits

    func testComptesEtTotal() throws {
        let (constats, rapport) = try importer()
        XCTAssertEqual(rapport.lignesLues, 8)
        XCTAssertEqual(constats.count, 7)
        XCTAssertEqual(rapport.lignesIgnorees, 1, "la ligne entièrement vide")

        let total = constats.compactMap(\.prixTotal).reduce(Decimal(0), +)
        XCTAssertEqual(total, Decimal(43_860),
                       "le total doit être celui du chiffrier, pas un produit recalculé")
    }

    func testCodesDePrioriteBSI() throws {
        let (constats, _) = try importer()
        var parCode: [String: Gravite] = [:]
        for constat in constats {
            if let code = constat.graviteSource, let gravite = constat.gravite {
                parCode[code] = gravite
            }
        }
        XCTAssertEqual(parCode["U"], .critique)
        XCTAssertEqual(parCode["CT"], .majeure)
        XCTAssertEqual(parCode["MT"], .moderee)
        XCTAssertEqual(parCode["LT+"], .mineure, "le « + » ne doit pas être perdu en cours de route")
        XCTAssertEqual(parCode["CO"], .observation)
        XCTAssertEqual(parCode["EX"], .majeure)
        XCTAssertNil(constats.first { $0.gravite == nil },
                     "toutes les lignes portent un code interprétable")
    }

    func testTexteLongScindeEnTitreEtDescription() throws {
        let (constats, _) = try importer()
        let premier = constats[0]
        XCTAssertTrue(premier.titre.hasPrefix("La margelle existante est endommagée"))
        XCTAssertLessThanOrEqual(premier.titre.count, 112)
        XCTAssertTrue(premier.titre.hasSuffix("…"), "coupure au mot entier avec ellipse")
        XCTAssertEqual(premier.description?.hasPrefix("La margelle existante"), true)
        XCTAssertGreaterThan(premier.description?.count ?? 0, premier.titre.count,
                             "le paragraphe complet reste dans la description")
    }

    func testQuantiteUniteEtTotalDuChiffrier() throws {
        let (constats, rapport) = try importer()
        let margelle = constats[0]
        XCTAssertEqual(margelle.occurrence, 26)
        XCTAssertEqual(margelle.unite, "u.")
        XCTAssertEqual(margelle.quantiteAffichable, "26 u.")
        XCTAssertEqual(margelle.prixUnitaire, Decimal(650))
        XCTAssertEqual(margelle.prixTotalCalcule, Decimal(16_900))
        XCTAssertEqual(margelle.prixTotalChiffrier, Decimal(13_000))
        XCTAssertEqual(margelle.prixTotal, Decimal(13_000), "le chiffrier fait foi")
        XCTAssertTrue(margelle.totalDivergent)
        XCTAssertTrue(rapport.avertissements.contains {
            $0.ligne == 2 && $0.message.contains("diffère")
        }, "l'écart doit être signalé, pas corrigé en silence")

        let toiture = constats[2]
        XCTAssertEqual(toiture.occurrence, 1_680)
        XCTAssertEqual(toiture.unite, "pi2")
        XCTAssertTrue(toiture.quantiteAffichable.hasSuffix("pi2"))
        XCTAssertTrue(toiture.quantiteAffichable.contains("680"),
                      "la quantité est formatée selon la locale (espace insécable)")
        XCTAssertFalse(toiture.totalDivergent)
    }

    func testLigneSansTexteDeConstatMaisAvecRecommandation() throws {
        let (constats, rapport) = try importer()
        guard let ligne5 = constats.first(where: { $0.ligneSource == 5 }) else {
            return XCTFail("la ligne 5 doit produire un constat, pas être écartée")
        }
        XCTAssertTrue(ligne5.titre.hasPrefix("Prévoir la réparation des fissures"))
        XCTAssertTrue(rapport.avertissements.contains {
            $0.ligne == 5 && $0.message.contains("titre absent")
        })
    }

    func testDeuxColonnesDePhotos() throws {
        let (constats, rapport) = try importer()
        XCTAssertEqual(constats[0].photos.count, 2, "« Photo 1 » et « Photo 2 »")
        XCTAssertEqual(constats[0].photos.map(\.libelle), ["IMG_0001.jpeg", "IMG_0002.jpeg"])
        XCTAssertEqual(rapport.avertissements.filter { $0.message.contains("photo introuvable") }.count, 2)
    }

    func testCoutSansQuantiteNiPrixUnitaire() throws {
        let (constats, _) = try importer()
        guard let pavage = constats.first(where: { $0.graviteSource == "LT+" }) else {
            return XCTFail("constat LT+ absent")
        }
        XCTAssertNil(pavage.prixUnitaire)
        XCTAssertEqual(pavage.prixTotal, Decimal(4_800), "un coût global sans détail reste lisible")
        XCTAssertFalse(pavage.totalDivergent)
    }

    func testColonnesDeProvenanceConservees() throws {
        let (constats, _) = try importer()
        let premier = constats[0]
        XCTAssertEqual(premier.champsSupplementaires["Page PDF"], "24")
        XCTAssertEqual(premier.champsSupplementaires["Section"], "Composantes structurales")
        XCTAssertEqual(premier.champsSupplementaires["Budget (note)"], "650$/margelle")
        XCTAssertNil(premier.champsSupplementaires[""], "une colonne sans en-tête n'est pas listée")
    }

    func testRapportExportable() throws {
        let (_, rapport) = try importer()
        let texte = rapport.texteExportable(nomFichier: "exemple-rapport-bsi.xlsx")
        XCTAssertTrue(texte.contains("Feuille : Extérieur"))
        XCTAssertTrue(texte.contains("Constats retenus : 7"))
        XCTAssertTrue(texte.contains("Lecture automatique :"))
    }
}
