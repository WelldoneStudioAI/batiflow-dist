import Foundation

/// Normalisation partagée par la détection de colonnes et la lecture des valeurs.
public enum NormalisationTexte {
    /// Minuscules, accents retirés, ponctuation remplacée par des espaces, espaces compactés.
    /// « Prix unitaire ($) » → « prix unitaire ».
    public static func cle(_ texte: String) -> String {
        let sansAccent = texte.folding(options: [.diacriticInsensitive, .caseInsensitive],
                                       locale: Locale(identifier: "fr_CA"))
        let morceaux = sansAccent.unicodeScalars.map { scalaire -> Character in
            if CharacterSet.alphanumerics.contains(scalaire) {
                return Character(scalaire)
            }
            return " "
        }
        return String(morceaux)
            .split(separator: " ", omittingEmptySubsequences: true)
            .joined(separator: " ")
            .lowercased()
    }

    /// Nettoie une valeur de cellule destinée à être affichée : espaces en trop retirés,
    /// retours de ligne Excel (`_x000D_`) rétablis, chaîne vide ramenée à `nil`.
    public static func valeurAffichable(_ texte: String?) -> String? {
        guard let texte else { return nil }
        let propre = texte
            .replacingOccurrences(of: "_x000D_", with: "")
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return propre.isEmpty ? nil : propre
    }

    /// Titre court tiré d'un texte long : première phrase si elle tient dans la limite,
    /// sinon coupure au dernier mot entier suivie d'une ellipse.
    public static func amorce(_ texte: String, limite: Int = 110) -> String {
        let propre = texte.trimmingCharacters(in: .whitespacesAndNewlines)
        let finPhrase = propre.firstIndex { $0 == "." || $0 == "!" || $0 == "?" || $0 == "\n" }
        if let finPhrase {
            let phrase = String(propre[propre.startIndex..<finPhrase])
                .trimmingCharacters(in: .whitespaces)
            if !phrase.isEmpty, phrase.count <= limite { return phrase }
        }
        guard propre.count > limite else { return propre }

        let tronque = String(propre.prefix(limite))
        if let dernierEspace = tronque.lastIndex(of: " "), tronque.distance(
            from: tronque.startIndex, to: dernierEspace) > limite / 2 {
            return String(tronque[tronque.startIndex..<dernierEspace]) + "…"
        }
        return tronque + "…"
    }
}
