import Foundation

/// Coordonnées d'une cellule dans une feuille lue (0-based).
public struct PositionCellule: Hashable, Sendable {
    public let ligne: Int
    public let colonne: Int
    public init(ligne: Int, colonne: Int) {
        self.ligne = ligne
        self.colonne = colonne
    }
}

/// Contenu brut d'une feuille : du texte, rien d'interprété.
public struct FeuilleBrute: Sendable {
    public let nom: String
    public let lignes: [[String]]
    /// Cibles des hyperliens Excel, par cellule. Un lien « photo » posé sur une
    /// cellule dont le texte affiché est « voir » se retrouve ici.
    public let hyperliens: [PositionCellule: String]

    public init(nom: String, lignes: [[String]], hyperliens: [PositionCellule: String] = [:]) {
        self.nom = nom
        self.lignes = lignes
        self.hyperliens = hyperliens
    }

    /// Valeur d'une cellule, hyperlien compris : si la cellule porte un lien,
    /// c'est la cible du lien qui prime sur le texte affiché.
    public func valeur(ligne: Int, colonne: Int, prefererHyperlien: Bool = false) -> String {
        let texte = (ligne < lignes.count && colonne < lignes[ligne].count)
            ? lignes[ligne][colonne] : ""
        if prefererHyperlien,
           let cible = hyperliens[PositionCellule(ligne: ligne, colonne: colonne)],
           !cible.isEmpty {
            return cible
        }
        return texte
    }

    /// Nombre de cellules non vides — sert à choisir la feuille la plus garnie.
    public var densite: Int {
        lignes.reduce(0) { total, ligne in
            total + ligne.reduce(0) { $0 + ($1.trimmingCharacters(in: .whitespaces).isEmpty ? 0 : 1) }
        }
    }
}
