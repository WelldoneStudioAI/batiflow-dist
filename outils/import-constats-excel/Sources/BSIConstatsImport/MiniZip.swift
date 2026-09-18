import Foundation
import Compression

/// Lecteur ZIP minimal, suffisant pour un `.xlsx` : répertoire central, entrées
/// « stored » (0) et « deflate » (8). Aucune dépendance externe, aucun processus
/// externe — donc compatible avec le bac à sable de l'app Mac.
enum MiniZip {

    enum Erreur: LocalizedError {
        case pasUneArchive
        case entreeIntrouvable(String)
        case compressionNonSupportee(UInt16)
        case donneesCorrompues(String)

        var errorDescription: String? {
            switch self {
            case .pasUneArchive:
                return "Le fichier n'est pas une archive lisible (.xlsx attendu)."
            case .entreeIntrouvable(let nom):
                return "Contenu manquant dans le classeur : \(nom)."
            case .compressionNonSupportee(let methode):
                return "Compression non prise en charge dans le classeur (méthode \(methode))."
            case .donneesCorrompues(let nom):
                return "Contenu illisible dans le classeur : \(nom)."
            }
        }
    }

    struct Entree {
        let nom: String
        let methode: UInt16
        let tailleCompressee: Int
        let tailleDecompressee: Int
        let offsetEntete: Int
    }

    /// Index des entrées de l'archive, par nom.
    static func index(_ donnees: Data) throws -> [String: Entree] {
        guard let eocd = positionEOCD(donnees) else { throw Erreur.pasUneArchive }

        var nombre = Int(lire16(donnees, eocd + 10))
        var offsetCD = Int(lire32(donnees, eocd + 16))

        // ZIP64 : les champs sont saturés, l'information est dans l'enregistrement ZIP64.
        if nombre == 0xFFFF || offsetCD == 0xFFFF_FFFF,
           let zip64 = positionEOCD64(donnees, avant: eocd) {
            nombre = Int(lire64(donnees, zip64 + 32))
            offsetCD = Int(lire64(donnees, zip64 + 48))
        }

        var entrees: [String: Entree] = [:]
        var curseur = offsetCD
        for _ in 0..<nombre {
            guard curseur + 46 <= donnees.count, lire32(donnees, curseur) == 0x0201_4B50 else {
                break
            }
            let methode = lire16(donnees, curseur + 10)
            let tailleCompressee = Int(lire32(donnees, curseur + 20))
            let tailleDecompressee = Int(lire32(donnees, curseur + 24))
            let longueurNom = Int(lire16(donnees, curseur + 28))
            let longueurExtra = Int(lire16(donnees, curseur + 30))
            let longueurCommentaire = Int(lire16(donnees, curseur + 32))
            let offsetEntete = Int(lire32(donnees, curseur + 42))

            let debutNom = curseur + 46
            guard debutNom + longueurNom <= donnees.count else { break }
            let nom = String(decoding: donnees[debutNom..<(debutNom + longueurNom)], as: UTF8.self)

            entrees[nom] = Entree(nom: nom,
                                  methode: methode,
                                  tailleCompressee: tailleCompressee,
                                  tailleDecompressee: tailleDecompressee,
                                  offsetEntete: offsetEntete)
            curseur = debutNom + longueurNom + longueurExtra + longueurCommentaire
        }

        guard !entrees.isEmpty else { throw Erreur.pasUneArchive }
        return entrees
    }

    /// Extrait une entrée. `nil` si absente (utile pour les parties facultatives).
    static func extraire(_ nom: String, de donnees: Data, index: [String: Entree]) throws -> Data? {
        guard let entree = index[nom] else { return nil }

        let offsetLocal = entree.offsetEntete
        guard offsetLocal + 30 <= donnees.count,
              lire32(donnees, offsetLocal) == 0x0403_4B50 else {
            throw Erreur.donneesCorrompues(nom)
        }
        let longueurNom = Int(lire16(donnees, offsetLocal + 26))
        let longueurExtra = Int(lire16(donnees, offsetLocal + 28))
        let debut = offsetLocal + 30 + longueurNom + longueurExtra
        let fin = debut + entree.tailleCompressee
        guard fin <= donnees.count else { throw Erreur.donneesCorrompues(nom) }

        let charge = donnees.subdata(in: (donnees.startIndex + debut)..<(donnees.startIndex + fin))
        switch entree.methode {
        case 0:
            return charge
        case 8:
            guard let clair = degonfler(charge, tailleAttendue: entree.tailleDecompressee) else {
                throw Erreur.donneesCorrompues(nom)
            }
            return clair
        default:
            throw Erreur.compressionNonSupportee(entree.methode)
        }
    }

    /// Comme `extraire`, mais lève si l'entrée est absente.
    static func extraireRequis(_ nom: String, de donnees: Data,
                               index: [String: Entree]) throws -> Data {
        guard let contenu = try extraire(nom, de: donnees, index: index) else {
            throw Erreur.entreeIntrouvable(nom)
        }
        return contenu
    }

    // MARK: - Deflate

    /// Décompression DEFLATE brut (sans en-tête zlib), via le framework Compression.
    private static func degonfler(_ donnees: Data, tailleAttendue: Int) -> Data? {
        guard !donnees.isEmpty else { return Data() }
        // `tailleAttendue` vaut 0 quand le classeur utilise un descripteur différé :
        // on se rabat alors sur une borne large, uniquement comme garde-fou anti-bombe zip.
        let plafond = max(tailleAttendue, donnees.count * 64, 4 * 1024 * 1024)

        let flux = UnsafeMutablePointer<compression_stream>.allocate(capacity: 1)
        defer { flux.deallocate() }
        guard compression_stream_init(flux, COMPRESSION_STREAM_DECODE,
                                      COMPRESSION_ZLIB) == COMPRESSION_STATUS_OK else {
            return nil
        }
        defer { compression_stream_destroy(flux) }

        let tailleTampon = 256 * 1024
        let tampon = UnsafeMutablePointer<UInt8>.allocate(capacity: tailleTampon)
        defer { tampon.deallocate() }

        var sortie = Data(capacity: max(tailleAttendue, donnees.count * 3))
        var echec = false

        donnees.withUnsafeBytes { source in
            guard let base = source.bindMemory(to: UInt8.self).baseAddress else {
                echec = true
                return
            }
            flux.pointee.src_ptr = base
            flux.pointee.src_size = donnees.count

            var statut = COMPRESSION_STATUS_OK
            repeat {
                flux.pointee.dst_ptr = tampon
                flux.pointee.dst_size = tailleTampon
                statut = compression_stream_process(flux, Int32(COMPRESSION_STREAM_FINALIZE.rawValue))
                let produit = tailleTampon - flux.pointee.dst_size
                if produit > 0 {
                    sortie.append(tampon, count: produit)
                }
                if statut == COMPRESSION_STATUS_ERROR || sortie.count > plafond {
                    echec = true
                    return
                }
            } while statut != COMPRESSION_STATUS_END
        }

        return echec ? nil : sortie
    }

    // MARK: - Repérage des enregistrements

    private static func positionEOCD(_ donnees: Data) -> Int? {
        let minimum = 22
        guard donnees.count >= minimum else { return nil }
        let debut = max(0, donnees.count - 65_557)
        var index = donnees.count - minimum
        while index >= debut {
            if lire32(donnees, index) == 0x0605_4B50 { return index }
            index -= 1
        }
        return nil
    }

    private static func positionEOCD64(_ donnees: Data, avant eocd: Int) -> Int? {
        let locator = eocd - 20
        guard locator >= 0, lire32(donnees, locator) == 0x0706_4B50 else { return nil }
        let offset = Int(lire64(donnees, locator + 8))
        guard offset >= 0, offset + 56 <= donnees.count,
              lire32(donnees, offset) == 0x0606_4B50 else { return nil }
        return offset
    }

    // MARK: - Lecture petit-boutiste

    private static func lire16(_ donnees: Data, _ offset: Int) -> UInt16 {
        guard offset + 2 <= donnees.count else { return 0 }
        let base = donnees.startIndex + offset
        return UInt16(donnees[base]) | UInt16(donnees[base + 1]) << 8
    }

    private static func lire32(_ donnees: Data, _ offset: Int) -> UInt32 {
        guard offset + 4 <= donnees.count else { return 0 }
        let base = donnees.startIndex + offset
        return (0..<4).reduce(UInt32(0)) { accumule, decalage in
            accumule | UInt32(donnees[base + decalage]) << (8 * UInt32(decalage))
        }
    }

    private static func lire64(_ donnees: Data, _ offset: Int) -> UInt64 {
        guard offset + 8 <= donnees.count else { return 0 }
        let base = donnees.startIndex + offset
        return (0..<8).reduce(UInt64(0)) { accumule, decalage in
            accumule | UInt64(donnees[base + decalage]) << (8 * UInt64(decalage))
        }
    }
}
