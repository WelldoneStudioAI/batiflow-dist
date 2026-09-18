import SwiftUI
import AppKit
import BSIConstatsImport

/// Détail de ce que la lecture a produit : compte, lignes ignorées, avertissements.
public struct VueRapportImport: View {
    let rapport: RapportImport
    let nomFichier: String
    @Environment(\.dismiss) private var fermer

    public init(rapport: RapportImport, nomFichier: String) {
        self.rapport = rapport
        self.nomFichier = nomFichier
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Rapport d'import").font(.headline)
                Text(nomFichier).font(.caption).foregroundStyle(.secondary)
            }
            .padding(20)

            Divider()

            HStack(spacing: 24) {
                statistique("Lignes lues", "\(rapport.lignesLues)")
                statistique("Constats", "\(rapport.constatsRetenus)")
                statistique("Ignorées", "\(rapport.lignesIgnorees)")
                statistique("Avertissements", "\(rapport.avertissements.count)",
                            couleur: rapport.aDesAvertissements ? .orange : nil)
            }
            .padding(20)

            Divider()

            if rapport.avertissements.isEmpty {
                ContentUnavailableView("Aucun avertissement",
                                       systemImage: "checkmark.seal",
                                       description: Text("Toutes les lignes ont été lues sans ambiguïté."))
                    .frame(maxHeight: .infinity)
            } else {
                List(rapport.avertissements) { avertissement in
                    Label(avertissement.texte, systemImage: "exclamationmark.triangle")
                        .font(.callout)
                }
                .listStyle(.inset)
            }

            Divider()

            HStack {
                Button("Copier le rapport") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(
                        rapport.texteExportable(nomFichier: nomFichier), forType: .string)
                }
                Spacer()
                Button("Fermer") { fermer() }
                    .keyboardShortcut(.defaultAction)
            }
            .padding(20)
        }
        .frame(width: 560, height: 480)
    }

    private func statistique(_ titre: String, _ valeur: String, couleur: Color? = nil) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(valeur)
                .font(.title3.weight(.semibold))
                .monospacedDigit()
                .foregroundStyle(couleur ?? .primary)
            Text(titre).font(.caption).foregroundStyle(.secondary)
        }
    }
}
