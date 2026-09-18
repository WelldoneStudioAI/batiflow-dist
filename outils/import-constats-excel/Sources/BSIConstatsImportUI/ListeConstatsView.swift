import SwiftUI
import BSIConstatsImport

/// Liste de gauche : une ligne par constat, comme le fil de l'outil terrain.
public struct ListeConstatsView: View {
    @Bindable var modele: ModeleFenetreImport

    public init(modele: ModeleFenetreImport) {
        self.modele = modele
    }

    public var body: some View {
        List(selection: $modele.selection) {
            ForEach(modele.constatsAffiches) { constat in
                LigneConstat(constat: constat, estExclu: modele.exclus.contains(constat.id))
                    .tag(constat.id)
                    .contextMenu {
                        Button(modele.exclus.contains(constat.id) ? "Inclure" : "Exclure de l'import") {
                            modele.basculerExclusion(constat)
                        }
                    }
            }
        }
        .listStyle(.inset)
        .overlay {
            if modele.constatsAffiches.isEmpty {
                ContentUnavailableView("Aucun constat",
                                       systemImage: "line.3.horizontal.decrease.circle",
                                       description: Text("Aucun constat ne correspond à la recherche ou au filtre."))
            }
        }
    }
}

struct LigneConstat: View {
    let constat: ConstatImporte
    let estExclu: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Rectangle()
                .fill(constat.gravite?.couleur ?? Color.secondary.opacity(0.4))
                .frame(width: 3)
                .clipShape(Capsule())

            VStack(alignment: .leading, spacing: 4) {
                Text(constat.titre)
                    .font(.body.weight(.medium))
                    .lineLimit(2)

                if let description = constat.description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                HStack(spacing: 8) {
                    BadgeGravite(gravite: constat.gravite, compact: true)
                    if constat.occurrence > 1 {
                        etiquetteCompacte("×\(constat.occurrence)", symbole: "number")
                    }
                    if constat.prixTotal != nil {
                        etiquetteCompacte(FormatageMontant.texte(constat.prixTotal),
                                          symbole: "dollarsign.circle")
                    }
                    if !constat.photos.isEmpty {
                        etiquetteCompacte("\(constat.photos.count)", symbole: "photo")
                    }
                    if let localisation = constat.localisation {
                        etiquetteCompacte(localisation, symbole: "mappin")
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
        .opacity(estExclu ? 0.4 : 1)
    }

    private func etiquetteCompacte(_ texte: String, symbole: String) -> some View {
        Label(texte, systemImage: symbole)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
    }
}
