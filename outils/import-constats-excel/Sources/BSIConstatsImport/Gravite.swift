import Foundation

/// Échelle de gravité du BSI, alignée sur celle de l'outil terrain iOS.
public enum Gravite: Int, CaseIterable, Comparable, Hashable, Sendable {
    case observation = 1
    case mineure = 2
    case moderee = 3
    case majeure = 4
    case critique = 5

    public static func < (lhs: Gravite, rhs: Gravite) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    public var libelle: String {
        switch self {
        case .observation: return "Observation"
        case .mineure: return "Mineure"
        case .moderee: return "Modérée"
        case .majeure: return "Majeure"
        case .critique: return "Critique"
        }
    }

    /// Correspondances textuelles reconnues (déjà normalisées : minuscules, sans accent).
    /// Les codes d'une seule lettre correspondent aux cotations A→E parfois utilisées.
    var synonymes: Set<String> {
        switch self {
        case .critique:
            return ["critique", "urgent", "urgente", "urgence", "securite", "danger",
                    "immediat", "immediate", "critical", "tres eleve", "tres grave", "a", "p1"]
        case .majeure:
            return ["majeur", "majeure", "eleve", "elevee", "haute", "haut", "high",
                    "important", "importante", "prioritaire", "grave", "b", "p2"]
        case .moderee:
            return ["modere", "moderee", "moyen", "moyenne", "medium", "moderate",
                    "a surveiller", "surveiller", "c", "p3"]
        case .mineure:
            return ["mineur", "mineure", "faible", "bas", "basse", "low", "minor",
                    "leger", "legere", "d", "p4"]
        case .observation:
            return ["observation", "informatif", "information", "info", "note",
                    "pour information", "aucune", "aucun", "na", "n a", "rien",
                    "conforme", "e", "p5"]
        }
    }

    /// Interprète une valeur de chiffrier. L'ordre d'examen est fixe (du plus grave
    /// au moins grave), donc le résultat est reproductible.
    /// - Parameter echelleInversee: `true` si, dans le chiffrier, 1 est le plus grave.
    public static func depuis(_ brut: String, echelleInversee: Bool = false) -> Gravite? {
        let cle = NormalisationTexte.cle(brut)
        guard !cle.isEmpty else { return nil }
        let ordre = Gravite.allCases.reversed()

        // 1. Égalité stricte.
        for gravite in ordre where gravite.synonymes.contains(cle) {
            return gravite
        }

        // 2. Valeur numérique : « 4 », « 4/5 », « niveau 3 ».
        if let valeur = ValueParsing.premierEntier(dans: cle), (1...5).contains(valeur) {
            return echelleInversee ? Gravite(rawValue: 6 - valeur) : Gravite(rawValue: valeur)
        }

        // 3. Préfixe, sur les synonymes assez longs pour ne pas être ambigus
        //    (« majeur - structure », « urgent (securite) »).
        for gravite in ordre {
            let candidats = gravite.synonymes.filter { $0.count >= 4 }
            if candidats.contains(where: { cle.hasPrefix($0) || $0.hasPrefix(cle) }) {
                return gravite
            }
        }
        return nil
    }
}
