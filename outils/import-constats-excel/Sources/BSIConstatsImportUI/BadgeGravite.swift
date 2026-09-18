import SwiftUI
import BSIConstatsImport

public extension Gravite {
    /// Mêmes couleurs que les pastilles de l'outil terrain iOS.
    var couleur: Color {
        switch self {
        case .critique: return Color(red: 0.84, green: 0.16, blue: 0.16)
        case .majeure: return Color(red: 0.90, green: 0.45, blue: 0.09)
        case .moderee: return Color(red: 0.92, green: 0.70, blue: 0.10)
        case .mineure: return Color(red: 0.24, green: 0.55, blue: 0.85)
        case .observation: return Color(red: 0.45, green: 0.50, blue: 0.56)
        }
    }

    var symbole: String {
        switch self {
        case .critique: return "exclamationmark.octagon.fill"
        case .majeure: return "exclamationmark.triangle.fill"
        case .moderee: return "exclamationmark.circle.fill"
        case .mineure: return "info.circle.fill"
        case .observation: return "eye.fill"
        }
    }
}

/// Pastille de gravité. `compact` pour la liste, complet pour la fiche.
public struct BadgeGravite: View {
    let gravite: Gravite?
    var compact = false

    public init(gravite: Gravite?, compact: Bool = false) {
        self.gravite = gravite
        self.compact = compact
    }

    public var body: some View {
        let couleur = gravite?.couleur ?? Color.secondary
        HStack(spacing: 4) {
            Image(systemName: gravite?.symbole ?? "questionmark.circle")
                .font(.system(size: compact ? 10 : 12, weight: .semibold))
            if !compact {
                Text(gravite?.libelle ?? "À préciser")
                    .font(.caption.weight(.semibold))
            }
        }
        .foregroundStyle(couleur)
        .padding(.horizontal, compact ? 5 : 8)
        .padding(.vertical, compact ? 2 : 4)
        .background(couleur.opacity(0.14), in: Capsule())
        .accessibilityLabel(Text("Gravité : \(gravite?.libelle ?? "à préciser")"))
    }
}
