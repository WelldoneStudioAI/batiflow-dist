import Foundation

/// Lecture tolérante des valeurs numériques telles qu'on les trouve dans un chiffrier
/// québécois : « 1 234,56 $ », « $1,234.56 », « 3 unités », espaces insécables inclus.
public enum ValueParsing {

    private static let espaces = CharacterSet(charactersIn: " \u{00A0}\u{202F}\u{2009}\u{2007}")

    /// Convertit une cellule en montant. Retourne `nil` si rien d'exploitable.
    public static func montant(_ brut: String) -> Decimal? {
        var texte = brut.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !texte.isEmpty else { return nil }

        // Parenthèses comptables : (1 234,56) = négatif.
        var negatif = texte.hasPrefix("-")
        if texte.hasPrefix("("), texte.hasSuffix(")") {
            negatif = true
            texte = String(texte.dropFirst().dropLast())
        }

        // On ne garde que chiffres, séparateurs et signe.
        let filtre = texte.unicodeScalars.filter { scalaire in
            CharacterSet.decimalDigits.contains(scalaire) || scalaire == "," || scalaire == "."
        }
        var chiffres = String(String.UnicodeScalarView(filtre))
        guard chiffres.contains(where: { $0.isNumber }) else { return nil }

        // Le dernier séparateur suivi d'au plus 2 chiffres est le séparateur décimal ;
        // tous les autres sont des séparateurs de milliers.
        if let indexDernier = chiffres.lastIndex(where: { $0 == "," || $0 == "." }) {
            let decimales = chiffres.distance(from: chiffres.index(after: indexDernier),
                                              to: chiffres.endIndex)
            if decimales <= 2 && decimales > 0 {
                let partieEntiere = chiffres[chiffres.startIndex..<indexDernier]
                    .filter { $0.isNumber }
                let partieDecimale = chiffres[chiffres.index(after: indexDernier)...]
                chiffres = partieEntiere + "." + partieDecimale
            } else {
                chiffres = chiffres.filter { $0.isNumber }
            }
        }

        guard let valeur = Decimal(string: chiffres, locale: Locale(identifier: "en_US_POSIX")) else {
            return nil
        }
        return negatif ? -valeur : valeur
    }

    /// Premier entier trouvé dans la chaîne (« x3 » → 3, « 3 unités » → 3).
    public static func premierEntier(dans brut: String) -> Int? {
        var courant = ""
        for caractere in brut {
            if caractere.isNumber {
                courant.append(caractere)
            } else if !courant.isEmpty {
                break
            }
        }
        return Int(courant)
    }

    /// Occurrence d'un constat : au moins 1, jamais 0.
    public static func occurrence(_ brut: String) -> Int? {
        guard let valeur = premierEntier(dans: brut) else { return nil }
        return max(1, valeur)
    }

    /// Vrai si la cellule ne contient qu'un montant : chiffres, séparateurs, devise,
    /// espaces. « 13000 » et « 1 234,56 $ » oui ; « 650$/margelle » non (des lettres),
    /// « à valider » non. Sert à distinguer une colonne de montants d'une note de budget.
    public static func estMontantPur(_ brut: String) -> Bool {
        let texte = brut.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !texte.isEmpty, texte.contains(where: \.isNumber) else { return false }
        let permis = CharacterSet(charactersIn: "0123456789 ,.$-()")
            .union(espaces)
            .union(CharacterSet(charactersIn: "\u{20AC}\u{00A2}"))   // € ¢
        return texte.unicodeScalars.allSatisfy { permis.contains($0) }
    }

    /// Retire les espaces (y compris insécables) en tête et en queue.
    public static func degarni(_ brut: String) -> String {
        brut.trimmingCharacters(in: espaces.union(.whitespacesAndNewlines))
    }
}
