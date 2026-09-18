import SwiftUI
import AppKit
import UniformTypeIdentifiers
import BSIConstatsImport

/// Fenêtre « Importer un chiffrier » du BSI.
///
/// Usage minimal depuis l'app :
/// ```swift
/// FenetreImportConstats { constats in
///     bsi.ajouterConstats(constats.map(Constat.init(importe:)))
/// }
/// ```
public struct FenetreImportConstats: View {
    @State private var modele: ModeleFenetreImport
    @State private var cibleSurvolee = false
    private let fichierInitial: URL?

    public init(fichier: URL? = nil, onImport: @escaping ([ConstatImporte]) -> Void) {
        _modele = State(initialValue: ModeleFenetreImport(onImport: onImport))
        self.fichierInitial = fichier
    }

    public var body: some View {
        Group {
            switch modele.etape {
            case .accueil:
                accueil
            case .lecture:
                ProgressView("Lecture du chiffrier…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .erreur(let message):
                erreur(message)
            case .pret:
                contenu
            }
        }
        .frame(minWidth: 940, minHeight: 620)
        .task {
            // Ouverture directe quand la fenêtre est appelée avec un fichier
            // (glisser-déposer sur l'icône, double-clic, « Ouvrir avec »).
            if let fichierInitial, modele.etape == .accueil {
                modele.charger(url: fichierInitial)
            }
        }
        .onDrop(of: [.fileURL], isTargeted: $cibleSurvolee) { fournisseurs in
            recevoirDepot(fournisseurs)
        }
        .sheet(isPresented: $modele.afficheMappage) {
            if let mappage = modele.mappage, let preparation = modele.preparation {
                FeuilleMappage(
                    mappage: mappage,
                    apercu: Array(preparation.feuille.lignes
                        .dropFirst(preparation.ligneEntetes + 1).prefix(20))
                ) { nouveau in
                    modele.validerMappage(nouveau)
                }
            }
        }
        .sheet(isPresented: $modele.afficheRapport) {
            VueRapportImport(rapport: modele.rapport,
                             nomFichier: modele.preparation?.url.lastPathComponent ?? "")
        }
    }

    // MARK: - Étapes

    private var accueil: some View {
        VStack(spacing: 16) {
            Image(systemName: "tablecells.badge.ellipsis")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("Importer un chiffrier de constats")
                .font(.title3.weight(.semibold))
            Text("Glissez un fichier .xlsx ou .csv ici, ou choisissez-le.\nLes constats s'afficheront comme ceux saisis sur le terrain.")
                .font(.callout)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Choisir un chiffrier…") { choisirFichier() }
                .controlSize(.large)
                .keyboardShortcut("o")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(cibleSurvolee ? Color.accentColor.opacity(0.08) : Color.clear)
    }

    private func erreur(_ message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 38))
                .foregroundStyle(.orange)
            Text("Lecture impossible").font(.title3.weight(.semibold))
            Text(message)
                .font(.callout)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 420)
            HStack {
                Button("Choisir un autre fichier…") { choisirFichier() }
                Button("Recommencer") { modele.reinitialiser() }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var contenu: some View {
        NavigationSplitView {
            ListeConstatsView(modele: modele)
                .navigationSplitViewColumnWidth(min: 300, ideal: 360, max: 460)
                .searchable(text: $modele.recherche, placement: .sidebar,
                            prompt: "Rechercher un constat")
        } detail: {
            if let identifiant = modele.selection,
               let constat = modele.constats.first(where: { $0.id == identifiant }) {
                FicheConstatView(constat: constat,
                                 estExclu: modele.exclus.contains(constat.id)) {
                    modele.basculerExclusion(constat)
                }
            } else {
                ContentUnavailableView("Aucun constat sélectionné",
                                       systemImage: "doc.text.magnifyingglass",
                                       description: Text("Choisissez un constat dans la liste."))
            }
        }
        .toolbar { barreOutils }
        .safeAreaInset(edge: .bottom) { barreInferieure }
    }

    // MARK: - Barres

    @ToolbarContentBuilder
    private var barreOutils: some ToolbarContent {
        ToolbarItemGroup {
            Menu {
                Picker("Tri", selection: $modele.tri) {
                    ForEach(TriConstats.allCases) { tri in
                        Text(tri.libelle).tag(tri)
                    }
                }
                .pickerStyle(.inline)

                Divider()

                ForEach(Gravite.allCases.reversed(), id: \.self) { gravite in
                    Toggle(gravite.libelle, isOn: Binding(
                        get: { modele.filtreGravite.contains(gravite) },
                        set: { actif in
                            if actif { modele.filtreGravite.insert(gravite) }
                            else { modele.filtreGravite.remove(gravite) }
                        }
                    ))
                }
                if !modele.filtreGravite.isEmpty {
                    Divider()
                    Button("Effacer les filtres") { modele.filtreGravite = [] }
                }
            } label: {
                Label("Trier et filtrer", systemImage: "line.3.horizontal.decrease.circle")
            }

            Button {
                choisirDossierPhotos()
            } label: {
                Label("Dossier de photos", systemImage: "folder.badge.person.crop")
            }
            .help(modele.dossierPhotos?.path ?? "Indiquer où se trouvent les photos référencées")

            Button {
                modele.afficheMappage = true
            } label: {
                Label("Ajuster les colonnes", systemImage: "tablecells")
            }

            Button {
                modele.afficheRapport = true
            } label: {
                Label("Rapport", systemImage: modele.rapport.aDesAvertissements
                      ? "exclamationmark.triangle" : "checkmark.seal")
            }
            .symbolRenderingMode(modele.rapport.aDesAvertissements ? .multicolor : .monochrome)
        }
    }

    private var barreInferieure: some View {
        HStack(spacing: 14) {
            Text("\(modele.constatsRetenus.count) constat\(modele.constatsRetenus.count > 1 ? "s" : "")")
                .font(.callout.weight(.medium))

            ForEach(modele.repartitionGravite, id: \.gravite) { element in
                HStack(spacing: 4) {
                    Circle().fill(element.gravite.couleur).frame(width: 7, height: 7)
                    Text("\(element.compte)").font(.caption).monospacedDigit()
                }
                .help(element.gravite.libelle)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 0) {
                Text("Total estimé").font(.caption2).foregroundStyle(.secondary)
                Text(FormatageMontant.texte(modele.totalEstime))
                    .font(.callout.weight(.semibold))
                    .monospacedDigit()
            }

            Button("Importer dans le BSI") {
                modele.importerDansLeBSI()
            }
            .keyboardShortcut(.return, modifiers: .command)
            .buttonStyle(.borderedProminent)
            .disabled(modele.constatsRetenus.isEmpty)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.bar)
    }

    // MARK: - Fichiers

    private func choisirFichier() {
        let panneau = NSOpenPanel()
        panneau.allowedContentTypes = [
            UTType.spreadsheet,
            UTType.commaSeparatedText,
            UTType(filenameExtension: "xlsx") ?? .data
        ]
        panneau.allowsMultipleSelection = false
        panneau.message = "Choisissez le chiffrier de constats à importer."
        if panneau.runModal() == .OK, let url = panneau.url {
            modele.charger(url: url)
        }
    }

    private func choisirDossierPhotos() {
        let panneau = NSOpenPanel()
        panneau.canChooseDirectories = true
        panneau.canChooseFiles = false
        panneau.message = "Choisissez le dossier contenant les photos référencées dans le chiffrier."
        if panneau.runModal() == .OK {
            modele.dossierPhotos = panneau.url
        }
    }

    private func recevoirDepot(_ fournisseurs: [NSItemProvider]) -> Bool {
        guard let fournisseur = fournisseurs.first else { return false }
        _ = fournisseur.loadObject(ofClass: URL.self) { url, _ in
            guard let url else { return }
            Task { @MainActor in modele.charger(url: url) }
        }
        return true
    }
}
