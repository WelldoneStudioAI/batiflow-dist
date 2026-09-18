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
}
