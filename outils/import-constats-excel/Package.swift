// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BSIConstatsImport",
    defaultLocalization: "fr",
    platforms: [.macOS(.v14)],
    products: [
        // Lecture et normalisation — aucune dépendance à SwiftUI, testable seul.
        .library(name: "BSIConstatsImport", targets: ["BSIConstatsImport"]),
        // Fenêtre et vues façon outil terrain iOS.
        .library(name: "BSIConstatsImportUI", targets: ["BSIConstatsImportUI"])
    ],
    targets: [
        .target(name: "BSIConstatsImport"),
        .target(name: "BSIConstatsImportUI", dependencies: ["BSIConstatsImport"]),
        .testTarget(
            name: "BSIConstatsImportTests",
            dependencies: ["BSIConstatsImport"],
            resources: [.copy("Fixtures")]
        )
    ]
)
