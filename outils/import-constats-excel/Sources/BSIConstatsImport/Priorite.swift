import Foundation

/// Code de priorité d'un rapport BSI (légende du rapport d'inspection, p. 8).
///
/// Ce n'est **pas** une échelle de gravité : `EX` dit qu'une expertise est requise
/// et `CO` qu'un entretien est suggéré — ni l'un ni l'autre ne se range sur un axe
/// « mineur → critique ». Le code est donc conservé tel quel et sert de classement
/// principal ; l'échelle `Gravite` ne sert qu'aux chiffriers qui n'ont pas de code.
public enum Priorite: String, CaseIterable, Comparable, Hashable, Sendable {
    case urgent = "U"
    case courtTerme = "CT"
    case moyenTerme = "MT"
    case longTerme = "LT"
    case longTermePlus = "LT+"
    case expertise = "EX"
    case entretien = "CO"

    /// Ordre d'affichage et de tri, du plus pressant au moins pressant.
    public var rang: Int {
        switch self {
        case .urgent: return 1
        case .courtTerme: return 2
        case .moyenTerme: return 3
        case .longTerme: return 4
        case .longTermePlus: return 5
        case .expertise: return 6
        case .entretien: return 7
        }
    }

    public static func < (lhs: Priorite, rhs: Priorite) -> Bool { lhs.rang < rhs.rang }

    public var libelle: String {
        switch self {
        case .urgent: return "Urgent"
        case .courtTerme: return "Court terme"
        case .moyenTerme: return "Moyen terme"
        case .longTerme: return "Long terme"
        case .longTermePlus: return "Long terme +"
        case .expertise: return "Expertise"
        case .entretien: return "Entretien"
        }
    }

    /// Précision affichée sous l'étiquette, reprise de la légende du rapport.
    public var precision: String {
        switch self {
        case .urgent: return "Urgent"
        case .courtTerme: return "D'ici 1 an"
        case .moyenTerme: return "D'ici 4 ans"
        case .longTerme: return "D'ici 9 ans"
        case .longTermePlus: return "10 ans et plus"
        case .expertise: return "Avis d'un expert recommandé"
        case .entretien: return "Entretien ou amélioration suggéré"
        }
    }

    /// Lit le code avant toute normalisation : le « + » de `LT+` ne survivrait pas
    /// au nettoyage des clés, et `LT+` se confondrait alors avec `LT`.
    public static func depuis(_ brut: String) -> Priorite? {
        let code = brut.uppercased().filter { $0.isLetter || $0 == "+" }
        return Priorite(rawValue: code)
    }
}
