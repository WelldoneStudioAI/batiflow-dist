import XCTest
@testable import BSIConstatsImport

/// Le pont complet : un chiffrier lu par la web app, exporté en dossier
/// `batiflow.bsi.dossier`, puis relu ici comme BatiFlow le fera.
/// La fixture est produite par la web app elle-même (voir outils/web-constats).
final class DossierBatiFlowTests: XCTestCase {

    private func dossier() throws -> LecteurDossierBatiFlow.Resultat {
        guard let url = Bundle.module.url(forResource: "exemple-dossier-bsi.zip",
                                          withExtension: nil, subdirectory: "Fixtures") else {
            throw XCTSkip("Fixture absente — réexporter un dossier depuis la web app")
        }
        return try LecteurDossierBatiFlow.lire(archive: url)
    }

    func testManifeste() throws {
        let resultat = try dossier()
        XCTAssertEqual(resultat.manifeste.format, ManifesteDossier.formatAttendu)
        XCTAssertEqual(resultat.manifeste.version, 1)
        XCTAssertEqual(resultat.manifeste.dossier.nombreConstats, 7)
        XCTAssertEqual(resultat.manifeste.dossier.totalRetenu, 43_860, accuracy: 0.001)
        XCTAssertEqual(resultat.manifeste.dossier.devise, "CAD")
        XCTAssertEqual(resultat.manifeste.source.feuille, "Extérieur")
    }

    func testConstatsRelus() throws {
        let constats = try dossier().constats
        XCTAssertEqual(constats.count, 7)

        let margelle = constats[0]
        XCTAssertEqual(margelle.priorite, .urgent)
        XCTAssertNil(margelle.gravite, "un code de priorité n'est pas une gravité")
        XCTAssertEqual(margelle.graviteSource, "U")
        XCTAssertEqual(margelle.occurrence, 26)
        XCTAssertEqual(margelle.unite, "u.")
        XCTAssertEqual(margelle.prixUnitaire, Decimal(650))
        XCTAssertEqual(margelle.prixTotal, Decimal(13_000), "le coût retenu traverse le pont intact")
        XCTAssertEqual(margelle.categorie, "Mur de fondation")
        XCTAssertEqual(margelle.champsSupplementaires["Page PDF"], "24")
    }

    func testToutesLesPrioritesTraversentLePont() throws {
        let constats = try dossier().constats
        let codes = constats.compactMap(\.priorite)
        XCTAssertEqual(codes.count, 7, "chaque constat garde son code")
        XCTAssertTrue(codes.contains(.expertise), "EX reste une expertise")
        XCTAssertTrue(codes.contains(.longTermePlus), "le « + » de LT+ survit à l'aller-retour")
        XCTAssertTrue(codes.contains(.entretien))
        XCTAssertEqual(codes.min(), .urgent)
    }

    func testPhotosAbsentesSignaleesPasPerdues() throws {
        let constats = try dossier().constats
        XCTAssertEqual(constats[0].photos.count, 2)
        for photo in constats[0].photos {
            guard case .introuvable(let nom) = photo else {
                return XCTFail("ces photos n'étaient pas sur le poste d'export")
            }
            XCTAssertTrue(nom.hasPrefix("IMG_"), "le nom d'origine est conservé")
        }
    }

    func testExtractionDesPhotos() throws {
        // Le dossier d'exemple ne joint aucune photo : l'extraction ne doit rien créer
        // ni échouer pour autant.
        guard let url = Bundle.module.url(forResource: "exemple-dossier-bsi.zip",
                                          withExtension: nil, subdirectory: "Fixtures") else {
            throw XCTSkip("Fixture absente")
        }
        let destination = FileManager.default.temporaryDirectory
            .appendingPathComponent("photos-\(UUID().uuidString)")
        defer { try? FileManager.default.removeItem(at: destination) }

        let resultat = try LecteurDossierBatiFlow.lire(archive: url, extrairePhotosVers: destination)
        XCTAssertNil(resultat.dossierPhotos)
        XCTAssertEqual(resultat.manifeste.dossier.photosIncluses, 0)
    }
}
