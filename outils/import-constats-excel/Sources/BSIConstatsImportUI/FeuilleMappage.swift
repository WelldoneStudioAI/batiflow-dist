import SwiftUI
import BSIConstatsImport

/// Feuille d'ajustement : quelle colonne du chiffrier alimente quel champ du BSI.
public struct FeuilleMappage: View {
    let entetes: [String]
    let apercu: [[String]]
    @State private var brouillon: MappageColonnes
    let onValider: (MappageColonnes) -> Void
    @Environment(\.dismiss) private var fermer

    public init(mappage: MappageColonnes,
                apercu: [[String]],
                onValider: @escaping (MappageColonnes) -> Void) {
        self.entetes = mappage.entetes
        self.apercu = apercu
        self._brouillon = State(initialValue: mappage)
        self.onValider = onValider
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Colonnes du chiffrier").font(.headline)
                Text("Associez chaque champ du BSI à une colonne. Le choix est mémorisé pour les prochains chiffriers au même format.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(20)

            Divider()

            ScrollView {
                VStack(spacing: 10) {
                    ForEach(ChampConstat.allCases) { champ in
                        rangee(champ)
                    }
                    Toggle("Échelle de gravité inversée (1 = le plus grave)",
                           isOn: $brouillon.echelleGraviteInversee)
                        .padding(.top, 6)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if !brouillon.colonnesPhotosSupplementaires.isEmpty {
                        let noms = brouillon.colonnesPhotosSupplementaires
                            .map { $0 < entetes.count && !entetes[$0].isEmpty
                                   ? entetes[$0] : "colonne \($0 + 1)" }
                            .joined(separator: ", ")
                        Label("Photos supplémentaires lues : \(noms)", systemImage: "photo.on.rectangle")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if !brouillon.ajustements.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Label("Déduit des valeurs", systemImage: "wand.and.stars")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                            ForEach(brouillon.ajustements, id: \.self) { ajustement in
                                Text("• " + ajustement).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(20)
            }

            Divider()

            HStack {
                if !brouillon.estComplet {
                    Label("La colonne « Titre » est requise.", systemImage: "exclamationmark.triangle")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
                Spacer()
                Button("Annuler") { fermer() }
                    .keyboardShortcut(.cancelAction)
                Button("Appliquer") {
                    onValider(brouillon)
                    fermer()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(!brouillon.estComplet)
            }
            .padding(20)
        }
        .frame(width: 620, height: 560)
    }

    private func rangee(_ champ: ChampConstat) -> some View {
        HStack(spacing: 12) {
            HStack(spacing: 4) {
                Text(champ.libelle).font(.body)
                if champ.estRequis {
                    Text("requis").font(.caption2).foregroundStyle(.secondary)
                }
            }
            .frame(width: 150, alignment: .leading)

            Picker("", selection: liaison(champ)) {
                Text("— aucune —").tag(-1)
                ForEach(entetes.indices, id: \.self) { index in
                    Text(entetes[index].isEmpty ? "Colonne \(index + 1)" : entetes[index]).tag(index)
                }
            }
            .labelsHidden()

            Text(exemple(champ))
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(width: 170, alignment: .leading)
        }
    }

    private func liaison(_ champ: ChampConstat) -> Binding<Int> {
        Binding(
            get: { brouillon.colonnes[champ] ?? -1 },
            set: { nouveau in
                if nouveau < 0 {
                    brouillon.colonnes[champ] = nil
                } else {
                    brouillon.colonnes[champ] = nouveau
                }
            }
        )
    }

    /// Première valeur non vide de la colonne, pour vérifier d'un coup d'œil.
    private func exemple(_ champ: ChampConstat) -> String {
        guard let colonne = brouillon.colonnes[champ] else { return "" }
        for ligne in apercu where colonne < ligne.count {
            let valeur = ligne[colonne].trimmingCharacters(in: .whitespacesAndNewlines)
            if !valeur.isEmpty { return "ex. : \(valeur)" }
        }
        return ""
    }
}
