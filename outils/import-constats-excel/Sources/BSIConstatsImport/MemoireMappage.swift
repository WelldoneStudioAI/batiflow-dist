import Foundation

/// Mémorise le mappage retenu pour un format de chiffrier donné, de sorte qu'un
/// fichier aux mêmes en-têtes n'ait plus jamais besoin d'être configuré.
public struct MemoireMappage {
    private let defaults: UserDefaults
    private let prefixe = "bsi.import.mappage."

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func enregistrer(_ mappage: MappageColonnes) {
        var contenu: [String: Int] = [:]
        for (champ, index) in mappage.colonnes {
            contenu[champ.rawValue] = index
        }
        defaults.set(contenu, forKey: prefixe + mappage.signature)
        defaults.set(mappage.echelleGraviteInversee,
                     forKey: prefixe + mappage.signature + ".inverse")
        defaults.set(mappage.colonnesPhotosSupplementaires,
                     forKey: prefixe + mappage.signature + ".photos")
    }

    public func appliquerSiConnu(_ mappage: MappageColonnes) -> MappageColonnes {
        guard let contenu = defaults.dictionary(forKey: prefixe + mappage.signature) as? [String: Int] else {
            return mappage
        }
        var resultat = mappage
        resultat.colonnes = [:]
        for (cle, index) in contenu {
            if let champ = ChampConstat(rawValue: cle), mappage.entetes.indices.contains(index) {
                resultat.colonnes[champ] = index
            }
        }
        resultat.echelleGraviteInversee = defaults.bool(forKey: prefixe + mappage.signature + ".inverse")
        if let photos = defaults.array(forKey: prefixe + mappage.signature + ".photos") as? [Int] {
            resultat.colonnesPhotosSupplementaires = photos.filter(mappage.entetes.indices.contains)
        }
        // Les décisions automatiques de la lecture en cours restent valables.
        resultat.ajustements = mappage.ajustements
        return resultat.colonnes.isEmpty ? mappage : resultat
    }
}
