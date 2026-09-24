import SwiftUI
import BSIConstatsImport

/// Comment un constat est classé à l'écran : le code de priorité du rapport s'il
/// existe, sinon la gravité écrite au chiffrier, sinon « À préciser ».
public struct Classement: Identifiable, Hashable {
    public let id: String
    public let libelle: String
    public let precision: String
    public let rang: Int
    public let couleur: Color

    public static let aPreciser = Classement(id: "?", libelle: "À préciser", precision: "",
                                             rang: 99, couleur: Color.secondary)

    public static func pour(_ constat: ConstatImporte) -> Classement {
        if let priorite = constat.priorite {
            return Classement(id: priorite.rawValue, libelle: priorite.libelle,
                              precision: priorite.precision, rang: priorite.rang,
                              couleur: couleur(priorite))
        }
        if let gravite = constat.gravite {
            return Classement(id: "g-\(gravite.rawValue)", libelle: gravite.libelle,
                              precision: "", rang: 10 - gravite.rawValue,
                              couleur: couleur(gravite))
        }
        return .aPreciser
    }

    /// Les sept classes d'un rapport BSI ont chacune leur teinte : elles ne sont pas
    /// les degrés d'une même échelle, une simple rampe rouge→vert les trahirait.
    static func couleur(_ priorite: Priorite) -> Color {
        switch priorite {
        case .urgent: return Color(red: 0.70, green: 0.20, blue: 0.16)
        case .courtTerme: return Color(red: 0.74, green: 0.38, blue: 0.09)
        case .moyenTerme: return Color(red: 0.53, green: 0.41, blue: 0.04)
        case .longTerme: return Color(red: 0.15, green: 0.47, blue: 0.40)
        case .longTermePlus: return Color(red: 0.23, green: 0.42, blue: 0.59)
        case .expertise: return Color(red: 0.41, green: 0.29, blue: 0.61)
        case .entretien: return Color(red: 0.40, green: 0.44, blue: 0.47)
        }
    }

    static func couleur(_ gravite: Gravite) -> Color {
        switch gravite {
        case .critique: return Color(red: 0.70, green: 0.20, blue: 0.16)
        case .majeure: return Color(red: 0.74, green: 0.38, blue: 0.09)
        case .moderee: return Color(red: 0.53, green: 0.41, blue: 0.04)
        case .mineure: return Color(red: 0.23, green: 0.42, blue: 0.59)
        case .observation: return Color(red: 0.40, green: 0.44, blue: 0.47)
        }
    }

    var symbole: String {
        switch rang {
        case 1: return "exclamationmark.octagon.fill"
        case 2: return "exclamationmark.triangle.fill"
        case 3: return "exclamationmark.circle.fill"
        case 6: return "person.crop.circle.badge.questionmark"
        case 99: return "questionmark.circle"
        default: return "circle.fill"
        }
    }
}

/// Étiquette de classement. `compact` pour la liste, complète pour la fiche.
public struct BadgeClassement: View {
    let classement: Classement
    var compact = false

    public init(classement: Classement, compact: Bool = false) {
        self.classement = classement
        self.compact = compact
    }

    public var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(classement.couleur)
                .frame(width: compact ? 6 : 7, height: compact ? 6 : 7)
            Text(classement.libelle)
                .font(compact ? .caption2.weight(.semibold) : .caption.weight(.semibold))
        }
        .foregroundStyle(classement.couleur)
        .padding(.horizontal, compact ? 6 : 8)
        .padding(.vertical, compact ? 2 : 4)
        .background(classement.couleur.opacity(0.14), in: Capsule())
        .accessibilityLabel(Text("Priorité : \(classement.libelle)"))
    }
}
