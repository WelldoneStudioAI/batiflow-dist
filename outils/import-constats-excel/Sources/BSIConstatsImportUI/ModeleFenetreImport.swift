import Foundation
import Observation
import SwiftUI
import BSIConstatsImport

/// Tri disponible dans la fenêtre.
public enum TriConstats: String, CaseIterable, Identifiable {
    case ordreChiffrier, priorite, prix, titre
    public var id: String { rawValue }
    public var libelle: String {
        switch self {
        case .ordreChiffrier: return "Ordre du chiffrier"
        case .priorite: return "Priorité"
        case .prix: return "Coût total"
        case .titre: return "Titre"
        }
    }
}

public enum EtapeImport: Equatable {
    case accueil
    case lecture
    case pret
    case erreur(String)
}

@MainActor
@Observable
public final class ModeleFenetreImport {

    public var etape: EtapeImport = .accueil
    public private(set) var preparation: PreparationImport?
    public var mappage: MappageColonnes?
    public private(set) var constats: [ConstatImporte] = []
    public private(set) var rapport = RapportImport()

    public var recherche: String = ""
    public var filtreClassement: Set<String> = []
    public var tri: TriConstats = .ordreChiffrier
    public var selection: ConstatImporte.ID?
    public var exclus: Set<ConstatImporte.ID> = []

    public var dossierPhotos: URL? { didSet { recalculer() } }
    public var afficheMappage = false
    public var afficheRapport = false

    private let memoire = MemoireMappage()
    private let onImport: ([ConstatImporte]) -> Void

    public init(onImport: @escaping ([ConstatImporte]) -> Void) {
        self.onImport = onImport
    }

    // MARK: - Chargement

    public func charger(url: URL) {
        etape = .lecture
        do {
            let acces = url.startAccessingSecurityScopedResource()
            defer { if acces { url.stopAccessingSecurityScopedResource() } }

            let preparation = try ImportateurConstats.preparer(url: url)
            self.preparation = preparation
            self.mappage = memoire.appliquerSiConnu(preparation.mappage)
            recalculer()

            if let mappage, !mappage.estComplet {
                afficheMappage = true
            }
            etape = .pret
        } catch {
            etape = .erreur(error.localizedDescription)
        }
    }

    public func recalculer() {
        guard let preparation, let mappage else { return }
        let resolveur = ResolveurPhotos(
            dossierChiffrier: preparation.url.deletingLastPathComponent(),
            dossierPhotos: dossierPhotos
        )
        do {
            let resultat = try ImportateurConstats.construire(preparation: preparation,
                                                             mappage: mappage,
                                                             resolveurPhotos: resolveur)
            constats = resultat.constats
            rapport = resultat.rapport
            exclus = []
            selection = constats.first?.id
            etape = .pret
        } catch {
            etape = .erreur(error.localizedDescription)
        }
    }

    public func validerMappage(_ nouveau: MappageColonnes) {
        mappage = nouveau
        memoire.enregistrer(nouveau)
        recalculer()
    }

    // MARK: - Présentation

    public var constatsAffiches: [ConstatImporte] {
        var liste = constats

        let terme = NormalisationTexte.cle(recherche)
        if !terme.isEmpty {
            liste = liste.filter { constat in
                let corpus = [constat.titre, constat.description ?? "", constat.recommandation ?? "",
                              constat.localisation ?? "", constat.categorie ?? ""].joined(separator: " ")
                return NormalisationTexte.cle(corpus).contains(terme)
            }
        }

        if !filtreClassement.isEmpty {
            liste = liste.filter { filtreClassement.contains(Classement.pour($0).id) }
        }

        switch tri {
        case .ordreChiffrier:
            break
        case .priorite:
            liste.sort { gauche, droite in
                if gauche.rangClassement != droite.rangClassement {
                    return gauche.rangClassement < droite.rangClassement
                }
                return gauche.ligneSource < droite.ligneSource
            }
        case .prix:
            liste.sort { ($0.prixTotal ?? 0) > ($1.prixTotal ?? 0) }
        case .titre:
            liste.sort { $0.titre.localizedStandardCompare($1.titre) == .orderedAscending }
        }
        return liste
    }

    public var constatsRetenus: [ConstatImporte] {
        constats.filter { !exclus.contains($0.id) }
    }

    public var totalEstime: Decimal {
        constatsRetenus.compactMap(\.prixTotal).reduce(0, +)
    }

    /// Les classes réellement présentes dans ce chiffrier, dans l'ordre de priorité.
    public var repartition: [(classement: Classement, compte: Int)] {
        var comptes: [Classement: Int] = [:]
        for constat in constatsRetenus {
            comptes[Classement.pour(constat), default: 0] += 1
        }
        return comptes.map { ($0.key, $0.value) }.sorted { $0.0.rang < $1.0.rang }
    }

    public func basculerExclusion(_ constat: ConstatImporte) {
        if exclus.contains(constat.id) {
            exclus.remove(constat.id)
        } else {
            exclus.insert(constat.id)
        }
    }

    // MARK: - Sortie

    public func importerDansLeBSI() {
        onImport(constatsRetenus)
    }

    public func reinitialiser() {
        preparation = nil
        mappage = nil
        constats = []
        rapport = RapportImport()
        recherche = ""
        filtreClassement = []
        exclus = []
        selection = nil
        etape = .accueil
    }
}
