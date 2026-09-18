import SwiftUI
import BSIConstatsImport

/// Fiche d'un constat, mise en page comme dans l'outil terrain iOS :
/// photo, titre + gravité, description, recommandation, puis le bloc chiffré.
public struct FicheConstatView: View {
    let constat: ConstatImporte
    var estExclu: Bool
    var basculerExclusion: () -> Void

    public init(constat: ConstatImporte,
                estExclu: Bool = false,
                basculerExclusion: @escaping () -> Void = {}) {
        self.constat = constat
        self.estExclu = estExclu
        self.basculerExclusion = basculerExclusion
    }

    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if !constat.photos.isEmpty {
                    photos
                }
                entete
                if let description = constat.description {
                    section("Description", texte: description, symbole: "text.alignleft")
                }
                if let recommandation = constat.recommandation {
                    section("Recommandation", texte: recommandation, symbole: "checkmark.seal")
                }
                blocChiffre
                if !constat.champsSupplementaires.isEmpty {
                    champsSupplementaires
                }
                piedDePage
            }
            .padding(22)
            .frame(maxWidth: 720, alignment: .leading)
        }
        .background(Color(nsColor: .textBackgroundColor))
        .opacity(estExclu ? 0.5 : 1)
    }

    // MARK: - Blocs

    private var photos: some View {
        VStack(spacing: 8) {
            ForEach(Array(constat.photos.enumerated()), id: \.offset) { _, photo in
                VuePhotoConstat(reference: photo)
            }
        }
    }

    private var entete: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(constat.titre)
                    .font(.title2.weight(.semibold))
                    .textSelection(.enabled)
                Spacer(minLength: 8)
                BadgeGravite(gravite: constat.gravite)
            }
            HStack(spacing: 10) {
                if let categorie = constat.categorie {
                    etiquette(categorie, symbole: "square.grid.2x2")
                }
                if let localisation = constat.localisation {
                    etiquette(localisation, symbole: "mappin.and.ellipse")
                }
            }
        }
    }

    private func section(_ titre: String, texte: String, symbole: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(titre, systemImage: symbole)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(texte)
                .font(.body)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var blocChiffre: some View {
        HStack(spacing: 0) {
            colonneChiffre("Occurrence", valeur: "\(constat.occurrence)")
            Divider().frame(height: 34)
            colonneChiffre("Prix unitaire", valeur: FormatageMontant.texte(constat.prixUnitaire))
            Divider().frame(height: 34)
            colonneChiffre("Total", valeur: FormatageMontant.texte(constat.prixTotal), accent: true)
        }
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .background(Color.secondary.opacity(0.08),
                    in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func colonneChiffre(_ titre: String, valeur: String, accent: Bool = false) -> some View {
        VStack(spacing: 3) {
            Text(titre)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(valeur)
                .font(.system(.body, design: .rounded).weight(accent ? .bold : .medium))
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity)
    }

    private var champsSupplementaires: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Autres colonnes du chiffrier", systemImage: "tablecells")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            ForEach(constat.champsSupplementaires.sorted(by: { $0.key < $1.key }), id: \.key) { cle, valeur in
                HStack(alignment: .top, spacing: 8) {
                    Text(cle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 150, alignment: .leading)
                    Text(valeur).font(.caption).textSelection(.enabled)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.05),
                    in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }

    private var piedDePage: some View {
        HStack {
            Text("Ligne \(constat.ligneSource) du chiffrier")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Spacer()
            Toggle(isOn: Binding(get: { !estExclu }, set: { _ in basculerExclusion() })) {
                Text("Inclure dans l'import")
            }
            .toggleStyle(.checkbox)
            .font(.caption)
        }
    }

    private func etiquette(_ texte: String, symbole: String) -> some View {
        Label(texte, systemImage: symbole)
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.secondary.opacity(0.10), in: Capsule())
    }
}

/// Formatage monétaire québécois partagé par la liste et la fiche.
public enum FormatageMontant {
    private static let formateur: NumberFormatter = {
        let formateur = NumberFormatter()
        formateur.numberStyle = .currency
        formateur.locale = Locale(identifier: "fr_CA")
        formateur.maximumFractionDigits = 2
        return formateur
    }()

    public static func texte(_ montant: Decimal?) -> String {
        guard let montant else { return "—" }
        return formateur.string(from: montant as NSDecimalNumber) ?? "—"
    }
}
