import Foundation

/// Lecteur CSV/TSV tolérant : détecte le séparateur, gère les guillemets,
/// les retours de ligne à l'intérieur d'un champ, et le BOM UTF-8.
public enum LecteurCSV {

    public static func lire(url: URL) throws -> FeuilleBrute {
        let donnees = try Data(contentsOf: url)
        let texte = decoder(donnees)
        let separateur = detecterSeparateur(texte)
        let lignes = analyser(texte, separateur: separateur)
        return FeuilleBrute(nom: url.deletingPathExtension().lastPathComponent, lignes: lignes)
    }

    /// UTF-8 d'abord (avec ou sans BOM), puis Latin-1 — les exports Excel FR
    /// sont encore souvent en Windows-1252.
    static func decoder(_ donnees: Data) -> String {
        var charge = donnees
        if charge.starts(with: [0xEF, 0xBB, 0xBF]) {
            charge = charge.dropFirst(3)
        }
        if let utf8 = String(data: charge, encoding: .utf8) { return utf8 }
        if let windows = String(data: charge, encoding: .windowsCP1252) { return windows }
        return String(decoding: charge, as: UTF8.self)
    }

    static func detecterSeparateur(_ texte: String) -> Character {
        let echantillon = texte.prefix(4096)
        var meilleur: Character = ","
        var meilleurCompte = 0
        for candidat: Character in [";", ",", "\t", "|"] {
            let compte = echantillon.reduce(0) { $0 + ($1 == candidat ? 1 : 0) }
            if compte > meilleurCompte {
                meilleur = candidat
                meilleurCompte = compte
            }
        }
        return meilleur
    }

    static func analyser(_ texte: String, separateur: Character) -> [[String]] {
        var lignes: [[String]] = []
        var ligne: [String] = []
        var champ = ""
        var entreGuillemets = false
        var iterateur = texte.makeIterator()
        var precedent: Character?

        func terminerChamp() {
            ligne.append(champ)
            champ = ""
        }
        func terminerLigne() {
            terminerChamp()
            lignes.append(ligne)
            ligne = []
        }

        var suivant = iterateur.next()
        while let caractere = suivant {
            suivant = iterateur.next()
            if entreGuillemets {
                if caractere == "\"" {
                    if suivant == "\"" {          // guillemet échappé
                        champ.append("\"")
                        suivant = iterateur.next()
                    } else {
                        entreGuillemets = false
                    }
                } else {
                    champ.append(caractere)
                }
            } else {
                switch caractere {
                case "\"" where champ.isEmpty:
                    entreGuillemets = true
                case separateur:
                    terminerChamp()
                case "\n":
                    terminerLigne()
                case "\r":
                    if suivant != "\n" { terminerLigne() }
                default:
                    champ.append(caractere)
                }
            }
            precedent = caractere
        }
        if !champ.isEmpty || !ligne.isEmpty || precedent == separateur {
            terminerLigne()
        }

        // On retire les lignes entièrement vides en fin de fichier.
        while let derniere = lignes.last,
              derniere.allSatisfy({ $0.trimmingCharacters(in: .whitespaces).isEmpty }) {
            lignes.removeLast()
        }
        return lignes
    }
}
