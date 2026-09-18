import SwiftUI
import AppKit
import BSIConstatsImport

/// Affiche la photo d'un constat : fichier local, image distante, ou cadre
/// « introuvable » explicite — jamais un vide silencieux.
public struct VuePhotoConstat: View {
    let reference: ReferencePhoto
    var hauteur: CGFloat = 220
    var coins: CGFloat = 10

    @State private var image: NSImage?
    @State private var enChargement = true

    public init(reference: ReferencePhoto, hauteur: CGFloat = 220, coins: CGFloat = 10) {
        self.reference = reference
        self.hauteur = hauteur
        self.coins = coins
    }

    public var body: some View {
        Group {
            switch reference {
            case .introuvable(let lien):
                cadreIndisponible(titre: "Photo introuvable", detail: lien)
            case .fichier, .distante:
                if let image {
                    Image(nsImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } else if enChargement {
                    ZStack { Color.secondary.opacity(0.08); ProgressView().controlSize(.small) }
                } else {
                    cadreIndisponible(titre: "Image illisible", detail: reference.libelle)
                }
            }
        }
        .frame(height: hauteur)
        .frame(maxWidth: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: coins, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: coins, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.08))
        )
        .task(id: reference) { await charger() }
        .contextMenu {
            if let url = reference.url {
                Button("Ouvrir la photo") { NSWorkspace.shared.open(url) }
                if url.isFileURL {
                    Button("Afficher dans le Finder") {
                        NSWorkspace.shared.activateFileViewerSelecting([url])
                    }
                }
                Button("Copier le lien") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(url.absoluteString, forType: .string)
                }
            }
        }
    }

    private func cadreIndisponible(titre: String, detail: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: "photo.badge.exclamationmark")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text(titre).font(.caption.weight(.semibold))
            Text(detail)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.secondary.opacity(0.07))
    }

    private func charger() async {
        guard let url = reference.url else {
            enChargement = false
            return
        }
        enChargement = true
        // On ne transfère que des `Data` entre les tâches : `NSImage` n'est pas Sendable.
        let donnees: Data? = await Task.detached(priority: .userInitiated) {
            try? Data(contentsOf: url)
        }.value
        image = donnees.flatMap(NSImage.init(data:))
        enChargement = false
    }
}
