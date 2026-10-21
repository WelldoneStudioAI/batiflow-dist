# Simulation web BatiFlow — matière de départ

Rassemblé le 21 octobre 2026, en lecture seule, pour la session qui construit la simulation (vue caméra → photo → annotation au doigt → dictée → constat). Rien n'a été modifié dans le site ni dans l'app.

Source du code cité : dépôt privé `WelldoneStudioAI/batiflow-app`, tronc `feat/aibq-constat-builder` au commit `e30c179e` (9 octobre 2026). Les numéros de ligne renvoient à ce commit.

## 1. Le site inspecteur.expert

- **Hébergement : Netlify.** Le domaine pointe vers le site Netlify `batiflow-vitrine` (`inspecteur.expert` → `75.2.60.5`, `www` → `batiflow-vitrine.netlify.app` ; en-têtes `server: Netlify`, `x-nf-request-id`). Le DNS est chez Cloudflare (zone `inspecteur.expert`), mais le site lui-même est servi par Netlify.
- **Pas de Webflow, pas de framework, pas de dépôt git.** C'est une page statique : un seul `index.html` (≈ 71 Ko, CSS et JS en ligne) et un dossier `assets/`.
- **Source sur le Mac de JP :** `~/Desktop/Welldone/4.iA/Obsidian/WelldoneStudio/06-Output/sites/2026-10-04_batiflow-site-demos/` (`index.html` + `assets/`). Une copie identique se trouve dans `~/Downloads/2026-10-04_batiflow-site-demos/`.
- **Ce qui est en ligne = cette source**, à une différence près : le formulaire `info-inspecteur` porte `data-netlify="true"` et `netlify-honeypot="bot-field"` dans la source. Netlify retire ces attributs à la publication (Netlify Forms).
- **Mise en ligne :** pas de `netlify.toml` ni de lien CLI dans le dossier. Le site est donc publié à la main (glisser-déposer du dossier dans Netlify). Pour ajouter la simulation, prévoir un dossier ou une page que JP déposera de la même façon.
- **Vidéos de la section « Le flow de travail »** : `assets/flow/videos/NN-*.mp4`. Leurs durées sont codées en dur dans la constante `FLOW` de `index.html`.
- **Autres sous-domaines** (sans lien avec la vitrine) : `vci.inspecteur.expert` (formulaire VCI sur Railway), `bsi.inspecteur.expert` (PWA BSI sur Cloudflare Pages).

## 2. L'app BatiFlow iOS

- **Projet Xcode :** `~/Developer/Batiflow.App/BatiFlow.xcodeproj`, généré par XcodeGen depuis `project.yml` (cible iOS + cible macOS, préfixe `com.welldone`). Attention : le dossier `~/Developer/Batiflow.App` est resté sur une vieille branche (`feat/pdf-v3-editorial`, 24 août). Le code à jour est sur le tronc `feat/aibq-constat-builder`, par exemple dans le worktree `~/Developer/Batiflow.App-main`.
- **Dépôt :** `github.com/WelldoneStudioAI/batiflow-app` (privé). Ce dépôt-ci (`batiflow-dist`) ne contient que l'appcast Mac.

Les fichiers SwiftUI des quatre écrans :

| Écran | Fichier principal | Fichiers associés |
|---|---|---|
| Caméra (viseur) | `BatiFlow/Views/iPhone/Capture/BFCameraScreen.swift` (`struct BFCameraScreen`, ≈ 15 700 lignes) | `Capture/BFBoutonsCamera.swift`, `Capture/BFModeBar.swift`, `Capture/BFLocationPill.swift`, `Capture/BFCameraSession.swift`, `AIBQChat/AIBQRefonteCamera.swift` (pastille du dernier constat), `Views/iPhone/BFFloatingNavBar.swift` (barre Caméra · Constats · Aperçu · Compte rendu) |
| Annotation de la photo (« Annoter la photo ») | `BatiFlow/Views/iPhone/Capture/BFPhotoAnnotationView.swift` | `BatiFlow/Domain/PhotoAnnotation.swift` (modèle des formes) |
| Dictée | `BatiFlow/Views/iPhone/AIBQChat/AIBQMicroDirect.swift` (bulle « ● J'écoute… », « ■ Arrêter », « ⌨ Clavier ») | `AIBQChat/AIBQMicroBouton.swift` (bouton micro), `Capture/BFVoiceRecorder.swift` (enregistrement + transcription) |
| Fiche constat | `BatiFlow/Views/iPhone/AIBQChat/AIBQConstatSheet.swift` (« Préparer le constat ») | `AIBQChat/AIBQCarrouselView.swift` (fiches qui glissent, « Au rapport », « Flip »), `Capture/BFConstatSheet.swift` (ancienne feuille) |

## 3. Apparence (couleurs, polices, tailles)

Valeurs relevées dans le code du commit `e30c179e`.

- **Chemins :** sauf mention contraire, ils partent de `BatiFlow/`.
- **Écran caméra :** il est sombre par défaut. `@AppStorage("bf.darkMode")` vaut `true` (BFCameraScreen.swift:34) et la vue applique `.preferredColorScheme(darkMode ? .dark : .light)` (:739). Les couleurs système sont donc données dans leur version sombre.
- **Polices :** deux familles sont utilisées.
  - La police système est SF Pro.
  - Inter est embarquée dans l'app (`Resources/Fonts/Inter-*.ttf`, déclarée par `UIAppFonts` dans iOS-Info.plist:55-62). Elle sert à l'écran d'annotation.

### Palette commune

| Élément | Valeur exacte | Source |
|---|---|---|
| **Orange de la refonte** (déclencheur, Approuver, Flip, badge, points) | `#F15A24` | AIBQRefonteCamera.swift:29,43 · BFCameraScreen.swift:13588 · AIBQConstatSheet.swift:2639 (`rOrange`) · AIBQCarrouselView.swift:73 |
| Anneau de maintien du déclencheur | `#E0543E` | BFCameraScreen.swift:13603 |
| Gris du texte de la feuille | `rGris #5B5E64` | AIBQConstatSheet.swift:2640 ; AIBQCarrouselView.swift:79 |
| Filet | `rFilet #E6E6E8` | AIBQConstatSheet.swift:2641 |
| Fond de champ ou de puce | `rChamp #F4F4F5` | AIBQConstatSheet.swift:2642 |
| Encre du carrousel | `#111214` | AIBQCarrouselView.swift:78 |
| Fond « champ » du carrousel | `#EEEEF0` | AIBQCarrouselView.swift:80 |
| AIBQChatPalette.ready / readyBG | `#5B8443` / `#E9F2E1` | AIBQChat/AIBQChatFeature.swift:154-155 |
| .draft / draftBG | `#3F72AA` / `#E4EEFA` | :156-157 |
| .review / reviewBG | `#9A6B00` / `#FFE566` | :161-162 |
| .urgent / urgentBG | `#A44A4A` / `#FBE5E5` | :163-164 |
| .neutralBG | `#F1F1F1` | :165 |
| .sub | `#8A8F98` | :166 |
| .ink | `#1A1B1E` | :167 |
| .encreBouton | clair `#1A1B1E`, sombre `#F2F2F7` | :171-173 |
| .surEncreBouton | clair blanc, sombre `#1A1B1E` | :175-177 |
| .bankStripe | `#4CAF50` | :178 |
| .dictedBG / .dictedLine | `#F2F2F4` / `#D9DADF` | :181-182 |
| .hairline | noir à 8 % d'opacité | :183 |
| .jauneFranc | `#FFD60A` | :186 |
| .fait | `#8A8F98` | :189 |
| **Gravité dans la feuille et le carrousel** (`AIBQSymbol.colorHex` → `swiftColor`) | correctif « Défaut à corriger » `#3B82F6` · expertise `#A855F7` · urgent `#DC2626` · securite « Danger » `#EF4444` · attention `#F59E0B` · suivi `#8B5CF6` · limitation `#475569` · information `#A1A1AA` · aucune `#10B981` | Domain/AIBQSymbol.swift:96-108, 113-122 ; libellés :37-48 |
| BFTokens.Severity (code pin et capture, autre famille) | attention `#FFD93D` · correctif `#FFA552` · securite `#E63946` · urgent `#7B1818` · limitation `#9CA3AF` | DesignSystem/BFTokens.swift:20-24 |
| Color.bf* (ancienne famille) | bfAttention `#F5A81E` · bfCorrectif `#3E94EA` · bfSecurite `#E2301F` · bfUrgent `#EC4A41` · bfNoneFound `#25BC6C` · bfExpertise `#9F5BD5` · bfAccent rgb(0.20, 0.60, 1.00) | DesignSystem/BatiFlowStyle.swift:7-19 |
| Format du chrono d'enregistrement | `"%d:%02d"` (affiche « 0:18 », pas « 00:18 ») | Views/iPhone/Capture/BFVoiceRecorder.swift:637-638 |

### 3.1 Caméra / viseur

Le contenu est assemblé par `unitCaptureChrome` (BFCameraScreen.swift:10845). La refonte n'est active que si `aibqRefonte && aibqMandatAIBQ`.

| Élément | Valeur exacte | Source |
|---|---|---|
| Fond | `Color(.systemBackground)`, soit `#000000` en sombre | BFCameraScreen.swift:10856 |
| Pile en portrait | VStack, spacing 12 | :10868 |
| Titre d'en-tête « Structure · Fondations » | `.headline.weight(.semibold)`, `.primary` (blanc), lineLimit 1, minScale 0.7, padding horizontal 96. Texte : `"\(catégorie) · \(sous-catégorie)"` | :11206-11209, :11185 |
| Padding de l'en-tête | horizontal 16, haut 6, bas 4 | :11229-11231 |
| Boutons ronds de l'en-tête (☰ `line.3.horizontal` à gauche, `house.fill` à droite) | icône 16 semibold ; rond 40×40 ; fond `Color(.systemGray6)` (sombre `#1C1C1E`) ; trait noir 6 % de 0,5 pt ; ombre noire 10 %, rayon 5, y 1 | :11234-11244 |
| Maison bleue | Le bouton maison n'a pas `.buttonStyle(.plain)`, contrairement à ☰ (:11218 vs :11226). `.foregroundStyle(.primary)` y prend donc la teinte d'accent. Le dépôt n'a pas d'actif AccentColor, la teinte serait donc le bleu système (`#0A84FF` en sombre). **Ceci est une déduction, pas une valeur écrite dans le code.** | :11226 |
| Viseur | Ratio 3:4 en portrait ; `clipShape` RoundedRectangle rayon **22**, continuous ; padding horizontal 12 ; fond `Color.black` | :11281, :11285, :10872, :11251 |
| Barre d'outils (pilule) | Fond `unitPillFill` = rgb(0.15, 0.15, 0.17), soit `#26262B` ; RoundedRectangle rayon **44**, continuous ; hauteur **88** ; pleine largeur avec padding horizontal 12 ; padding interne horizontal 18 ; espacement 20 | :10828, :13575, :13572, :13574-13576, :13571, :13465 |
| Ordre des boutons | ⚡ `bolt.fill` · ✏️ `pencil` · déclencheur · 🏠 `house.fill` (ou `tree.fill`) · couches `square.stack.3d.up.fill` | :13481-13486, :13512-13514, :13541 ; commentaire :13482 |
| Rond générique (⚡, couches) | icône 18 semibold, blanche ; rond **46** (`rond = 46` en rangée) ; fond blanc à 12 % | :13643-13650, :13463 |
| ⚡ actif | fond `Color.yellow` à 25 % (panneau ouvert) ; `#FAC775` à 55 % (mode archive) | :13487-13488 |
| Couches appuyé | fond `Color.yellow` à 30 %, échelle 1.12 | :13543-13545 |
| Crayon ✏️ | icône 18 semibold, blanche ; rond 46 ; fond blanc à 12 %. En cours : fond `#FAC775`, encre `#1A1B1E` | BFCameraScreen.swift:1587-1595 |
| Maison blanche 🏠 | icône 17 semibold, encre `#1A1B1E` ; rond 46 ; fond `Color.white` ; appuyé `#D6D7DB`, échelle 1.12 ; cascade active : fond `#3A3A3F`, icône `hand.draw` blanche, contour blanc 2 pt | :1614-1625 |
| **Déclencheur** | 68×68 ; anneau `strokeBorder` blanc de 4 pt ; cœur `#F15A24` avec padding 7 ; échelle 0.88 à l'appui (`.snappy` 0,18 s) | :13582-13610, :13626-13627 |
| Déclencheur en lot (« + ») | `plus` 26 bold, blanc | :13593-13595 |
| Aide « Appui long : note vocale » | `.system(size: 13)`, couleur `#3D3F44` | Views/iPhone/AIBQChat/AIBQRefonteCamera.swift:77 ; texte BFCameraScreen.swift:9409 |
| Pilule du dernier constat | VStack spacing 8 ; padding horizontal 12 | AIBQRefonteCamera.swift:76, :105 |
| · conteneur | HStack spacing 10 ; padding horizontal 16 ; hauteur **46** ; fond blanc ; RoundedRectangle rayon **14**, continuous ; trait `#E6E6E8` ; encre `#111214` | :79, :95-98 |
| · icône | `doc.text` 17 | :80 |
| · titre | 14.5 regular, 1 ligne (« Aucun constat encore » si vide) | :86 |
| · photo | `photo` 15 + « 1 photo » 14.5 `.monospacedDigit()` | :89-90 |
| · chevron | `chevron.right` 13 semibold | :91 |
| · texte pendant une dictée | « Dictée + photos → nouveau constat », 14.5, `#8D8E93` | :82-83 |
| Barre d'onglets du bas | iOS 18+ : `TabView` native d'Apple, `.tint(Color.primary)`, hauteur 56 | Views/iPhone/BFFloatingNavBar.swift:204-222 |
| · onglets du fil (ordre) | `[.viseur, .chat, .apercu, .compteRendu]` | :139 |
| · libellés | « Caméra » · « Constats » (refonte, sinon « Chat ») · « Aperçu » · « Compte rendu » | :143-155 |
| · icônes | `camera.fill` · `rectangle.stack` (refonte, sinon `message`) · `square.grid.2x2` · `doc.text.magnifyingglass` | :160-168 |

**Appui long et enregistrement (préachat)**

| Élément | Valeur exacte | Source |
|---|---|---|
| Durée de maintien avant l'armement | 0,3 s (0,42 s hors préachat) ; remplissage linéaire | BFCameraScreen.swift:8042-8044 |
| Anneau de progression | `trim`, trait `#E0543E` de 4 pt, bout arrondi, padding 2, rotation −90° | :13600-13607 |
| Bulle « Maintiens pour dicter » | JetBrains Mono 9 medium, tracking 0.8, blanc ; capsule noire à 62 % ; padding 10/5 ; décalage y −34 | :13613-13621 |
| Bandeau d'enregistrement (en haut) | `AIBQRefonteBandeauDictee` : padding horizontal 14, haut 60 | AIBQRefonteCamera.swift:59-60 ; monté BFCameraScreen.swift:666-667, 9384 |
| · point rouge | rond `#FF3B30` de 10×10 | AIBQRefonteCamera.swift:22 |
| · titre | « Note vocale en cours », 14.5 semibold, blanc | :23 ; BFCameraScreen.swift:9394 |
| · chrono | 14.5 medium, `.monospacedDigit()`, blanc | AIBQRefonteCamera.swift:25 |
| · onde | 5 capsules `#F15A24`, largeur 2.5, hauteur `5 + abs(sin(k·1.9))·13`, spacing 2 | :27-31 |
| · bouton « Arrêter » | `stop.circle.fill` 18 + texte 14.5 semibold, blanc ; hauteur 36 ; padding horizontal 12 ; capsule `#F15A24` | :35-43 |
| · capsule du bandeau | noire à 72 % ; hauteur min 46 ; padding gauche 14, droite 5, vertical 5 | :49-51 |
| · aide sous le bandeau | 12.5 medium, blanc ; capsule noire à 45 % ; padding 10/4 | :52-55 |
| Rond Stop dans la pilule (remplace couches) | `stop.fill`, fond `Color.red` à 85 % (rouge système) | BFCameraScreen.swift:13522-13527 |

`BFModeBar` et `BFLocationPill` ne servent que dans l'ancien `modeBars` (BFCameraScreen.swift:6167-6205). Ils ne font pas partie de ce viseur.

### 3.2 Annotation de la photo (« Annoter la photo »)

Le titre est passé par l'appelant (BFCameraScreen.swift:711). Toutes les références de cette section sont dans `Views/iPhone/Capture/BFPhotoAnnotationView.swift`.

| Élément | Valeur exacte | Ligne |
|---|---|---|
| Fond | `Color.black` | :125, :195 |
| Pastille de titre | Inter SemiBold 13, blanc ; capsule noire à 42 % ; padding 14/7 | :264-268 |
| Barre du haut | padding horizontal 16, haut 52 | :277-278 |
| Boutons ronds (‹ `chevron.left`, ↶ `arrow.uturn.backward`) | 16 semibold, blanc ; 40×40 ; rond noir à 42 % | :364-370 |
| Champs dictés | VStack spacing 8 ; padding horizontal 14, bas 10 | :527, :535-536 |
| · libellés | « Annotation » + « légende de la photo au rapport » ; « Note inspecteur » + « sur le Mac, hors rapport » | :529, :532 |
| · rond du micro | 38×38 ; repos : blanc à 14 % + `mic.fill` ; actif : `#FF453A` + `stop.fill` ; icône 15 bold, blanche | :545-550 |
| · titre | Inter SemiBold 13.5, blanc | :553 |
| · sous-titre | « · … », Inter Regular 11.5, blanc à 55 % (actif : « touche pour terminer ») | :554-555 |
| · texte | Inter Regular 13.5 ; blanc à 92 %, ou à 45 % pour l'invite « Touche pour dicter » ; actif sans texte : « Je t'écoute… » ; 3 lignes max | :542, :557-560 |
| · carte | HStack spacing 12 ; padding 10 ; fond blanc à 8 % (actif 16 %) ; RoundedRectangle rayon **16**, continuous ; trait blanc à 14 % de 1 pt (actif : `#FF453A` de 1,5 pt) | :544, :565-569 |
| Barre d'outils | HStack spacing 6 ; padding 10/11 ; fond rgb(0.15, 0.15, 0.17), soit `#26262B` ; RoundedRectangle rayon **24**, continuous ; padding horizontal 14, bas 30 | :282, :336-339 |
| · outil | icône 19 semibold + libellé Inter Medium 9 ; VStack spacing 3 ; padding vertical 7 | :288-294 |
| · outils et icônes | Flèche `arrow.up.right` · Cercle `circle` · Rectangle `rectangle` · Trait `pencil` · Texte `textformat` | :40-53 |
| · outil choisi | blanc + fond blanc à 16 %, rayon 12 ; non choisi : blanc à 72 % | :292, :297-298 |
| Pastille de couleur | rond 28×28 rempli de la couleur courante ; contour blanc 2,5 ; padding gauche 4 | :314-320 |
| Bouton « OK » | Inter Bold 13 ; encre `#0A0A0C` ; capsule blanche ; padding 15/9 | :326-332 |
| Couleur du trait par défaut | `#FF453A` | :23, :104 |
| Palette (cyclée au toucher) | `#FF453A`, `#FF9F0A`, `#FFD60A`, `#32D74B`, `#0A84FF`, `#FFFFFF`, `#0A0A0C` | :68, :310-311 |
| Épaisseur à l'écran | `max(3, largeur × 0.012)` ; trait libre : bouts et jointures arrondis | :683, :692 |
| Épaisseur à l'export | `max(4, largeur × 0.012)` | :745 |
| Rectangle | rayon 3 | :702 |
| Pointe de flèche | `max(14, largeur × 0.05)` (export 18), angle ±π/7, triangle plein | :713-717, :769 |
| Texte | `.system` heavy, `max(16, largeur × 0.05)` ; étiquette 20 heavy, ombre noire à 50 % de rayon 2 | :720, :170-172 |
| Cadre de sélection | blanc à 90 %, 1,5 pt, tirets [6, 4], rayon 8 ; poignées : ronds blancs de 18, contour noir à 55 % de 1,5 | :145-153 |

**Comment un tracé à main levée devient une forme propre** (`Domain/BFFormeAjustee.swift`, appelé dans BFPhotoAnnotationView.swift:463-471) :

- Pendant le geste, l'encre est affichée en trait libre (:488).
- Au relâchement, `BFFormeAjustee.reconnaitre(trace, aspect:)` choisit la forme (BFFormeAjustee.swift:68-83) :
  - **Flèche** si : moins de 3 points ; ou le rapport petit côté / grand côté de la boîte est inférieur à 0.2 ; ou l'écart entre départ et arrivée dépasse 35 % du chemin parcouru.
  - **Rectangle** si l'écart moyen aux 4 coins de la boîte est au plus 9 % de la diagonale.
  - **Cercle** sinon.
- `ajuster` calcule la forme finale (:31-58) :
  - Flèche : du premier au dernier point.
  - Rectangle : la boîte englobante.
  - Cercle : diamètre = (largeur + hauteur) / 2, centré sur la moyenne des points du tracé. Si le rapport des côtés dépasse `rapportCercle = 1.6` (:28), il reste une ellipse.
- Un toucher sans vrai trait est ignoré si le déplacement est d'au plus 0.01 (:97-100).
- La forme posée reste sélectionnée, avec des poignées qu'on attrape dans un rayon de 28 pt (BFPhotoAnnotationView.swift:479, :517).

### 3.3 Dictée

| Élément | Valeur exacte | Source |
|---|---|---|
| **Bulle de dictée en direct** `AIBQMicroDirect` | Clair : rouge `#D93A32`, encre `ink #1A1B1E`, texte discret `sub #8A8F98`, fond `neutralBG #F1F1F1`. Sombre : rouge `#FF5A4F`, encre blanche, discret blanc à 50 %, fond noir à 34 % | Views/iPhone/AIBQChat/AIBQMicroDirect.swift:37-40 |
| · en-tête | point de 8×8 qui bat entre 30 % et 100 % d'opacité (`easeInOut` 0,7 s en boucle) + « J'écoute… » 12 semibold, rouge | :45-49, :87 |
| · transcription | `.system(size: 16, weight: .medium)` ; encre (ou discret pour l'invite « Dis la pièce ou la façade… ») | :29, :52-54 |
| · « Arrêter » | `stop.fill` + 14 semibold ; hauteur 38 ; padding horizontal 16 ; capsule `ink` avec texte blanc (sombre : capsule blanche, texte noir) | :59-64 |
| · « Clavier » | `keyboard` + 14 medium ; hauteur 38 ; contour de capsule `hairline` de 1,2 (sombre : blanc à 35 %) | :68-75 |
| · cadre | padding 12 ; RoundedRectangle rayon **12**, continuous ; contour rouge de 1,5 pt | :82-85 |
| Taille optique ou axe de variation | aucun dans le code (pas d'`opsz` ni d'`opticalSize`) : la transcription est en `.system(size: 16, weight: .medium)` | — |
| **Micro `AIBQMicroBouton`, teintes par défaut** | `teinte = ink #1A1B1E` ; `teinteActive = urgent #A44A4A` ; taille 38 | AIBQMicroBouton.swift:34-37 |
| Gestes du micro | maintenir = parler tant qu'on appuie ; toucher = longue dictée. Seuil `seuilMaintien = 0.6` s | AIBQMicroBouton.swift:46-63 ; AIBQ/Engine/AIBQMicroGeste.swift:34 |
| · style `.rond` | `mic.fill` / `stop.fill`, taille `15 × taille/38` semibold, blanc ; fond `teinte` / `teinteActive` ; échelle 1.08 pendant l'enregistrement | :72-79 |
| · style `.pilule` | icône 11 bold + 12 medium monospacedDigit. Repos : texte `review #9A6B00` sur `dictedBG`, contour `dictedLine` 0,7. Enregistrement : blanc sur `teinteActive`, affiche le chrono | :80-92 |
| · style `.flottant` | rond 64 ; icône 26 semibold `surEncreBouton` sur `encreBouton` ; ombre noire à 18 %, rayon 10, y 4 ; enregistrement : contour `dictedLine` de 3 + capsule `#F2F2F7` avec `waveform` 13 (`.variableColor.iterative`) et chrono 14 medium monospacedDigit | :93-119 |
| · style `.barre` | rond 50, icône 21 ; enregistrement : capsule blanche avec `waveform` 12 + chrono 13 | :120-146 |
| · style `.champ` | icône 11 bold ; padding 9/7. Repos : `review` sur blanc. Enregistrement : blanc sur `dictedLine` | :147-161 |
| Dictée lancée depuis la caméra | bandeau rouge et orange décrit en 3.1 (la transcription n'est pas affichée dans le viseur) | AIBQRefonteCamera.swift:12-62 |

### 3.4 Feuille « Préparer le constat » (`corpsRefonte`) et carrousel

Les références de la feuille sont dans `Views/iPhone/AIBQChat/AIBQConstatSheet.swift`.

| Élément | Valeur exacte | Ligne |
|---|---|---|
| Fond | `Color.white` ; contenu VStack spacing 14 ; padding horizontal 18, haut 4, bas 16 | :2669, :2650, :2663 |
| Barre du haut | « ← Caméra » : `arrow.left` 17 medium + 16 regular, `ink` ; hauteur 48 ; padding horizontal 12 ; « … » `ellipsis` 18 semibold dans 44×44 | :2674-2703, :2726-2729 |
| Titre « Préparer le constat » | 26 bold, `ink #1A1B1E` | :2737-2738 |
| Badge « À valider » | `Label` + `clock` ; 13.5 semibold `#F15A24` ; hauteur 28 ; padding horizontal 10 ; capsule contour `#F15A24` de 1,3 pt | :2759-2762 |
| Puce « Rédaction IA » | `sparkles` ; 13 medium, `ink` ; hauteur 28 ; fond `#F4F4F5` en capsule | :2764-2767 |
| Section / Sous-section (deux cases côte à côte, spacing 10) | libellé 12.5 `#5B5E64` ; valeur 15.5 semibold `ink` ; `chevron.down` 13 semibold ; padding 12/8 ; fond blanc, RoundedRectangle rayon **12**, trait `#E6E6E8` | :2778-2791, :2824 |
| Carte « Preuve terrain conservée » | titre 15 bold `ink` ; padding 14 ; fond blanc, rayon **14**, trait `#E6E6E8` | :2848, :2867-2870 |
| · lecture ▶ | rond 44×44 `#F15A24` (erreur `#BDBEC2`), `play.fill` 17 bold blanc | :3246-3250 |
| · onde | 22 capsules ; les 11 premières `#F15A24`, les autres `#BDBEC2` ; largeur 2.5 ; hauteur `5 + abs(sin(k·2.1))·18` ; spacing 2.5 | :2852-2856 |
| · durée | 14, monospacedDigit, `ink` (format `%d:%02d`) | :2858 |
| · « Dictée originale » | 14, `#5B5E64` | :2862 |
| · citation | 14, `ink`, 3 lignes, entourée de « … » | :2863-2864, :588 |
| Proposition IA | « Proposition IA · style de la banque » 16 bold `ink` ; « Longueur, ton et structure harmonisés » 13.5 `#5B5E64` | :2876-2878 |
| Bloc des champs | fond blanc, rayon **14**, trait `#E6E6E8` ; filets internes de 1 pt `#E6E6E8` | :2953-2957 |
| · ligne | libellé 13.5 `#5B5E64`, largeur 104 ; point orange de 6×6 si le champ manque ; padding 14/11 | :2884-2894 |
| · Gravité | rond de 10×10 = `swiftColor` (Défaut à corriger = `#3B82F6`) + nom 15.5 `ink` + `chevron.down` 13 `#5B5E64` | :2906-2912 |
| · « Confirmer « … » » | 14 semibold blanc ; hauteur 32 ; capsule `ink` | :2932-2934 |
| · Titre / Description | `TextField` 15.5 `ink`, 1 à 6 lignes ; invites « Titre du constat », « Ce qui a été constaté » | :2919-2922, :2942-2946 |
| Bouton « Approuver le constat » | 17 semibold blanc ; hauteur **52** ; fond `#F15A24` (à 40 % si désactivé) ; RoundedRectangle rayon **16**, continuous | :3174, :3182-3184 |
| Bouton « Enregistrer à valider » | 16 semibold `ink` ; hauteur **48** ; fond `#F4F4F5` ; rayon **16** | :3196-3198 |
| Zone des boutons | VStack spacing 8 ; padding horizontal 18, haut 8, bas 10 ; fond blanc | :3178, :3211-3212 |

**Carte du carrousel**

Les références sont dans `Views/iPhone/AIBQChat/AIBQCarrouselView.swift` sauf mention contraire.

| Élément | Valeur exacte | Ligne |
|---|---|---|
| Carte | fond blanc ; RoundedRectangle rayon **24**, continuous ; trait `#E2E2E5` de 1 ; ombre noire à 16 %, rayon 17, y 12 ; padding horizontal 15, haut 16, bas 14 | :255-261 |
| Taille | largeur = 78 % de l'écran ; hauteur max 548 | :77 ; AIBQ/Engine/AIBQCarrousel.swift:29 |
| Cartes voisines | décalage 0.89 ; rotation Y 16° × 2.6 à l'affichage ; échelle 0.91 ; opacité 0.65 ; profondeur −110 ; perspective 1100 | AIBQCarrousel.swift:23-38 ; vue :75, :164-170 |
| Balayage | 0,42 s, courbe (0.22, 0.75, 0.20, 1.0) ; seuil 45 | AIBQCarrousel.swift:25-27, :40 |
| Retournement | 0,45 s, courbe (0.25, 0.70, 0.25, 1.0) | AIBQCarrousel.swift:43-44 |
| En-tête | sous-section 14 semibold `#222222` ; compteur « i / n » 14 medium monospacedDigit | :266-268 ; AIBQCarrousel.swift:118-119 |
| Badge « À CORRIGER » | point de 8×8 + 12 semibold, tracking 0.4 ; texte et contour `#F15A24` de 1,5 en capsule ; padding 11/5 | :675, :681-688 |
| · urgent / danger | capsule pleine `#F15A24`, texte blanc | :677 |
| · autres gravités | contour `#B7B9BE`, texte `#5B5E64` | :678 |
| Titre | 21 bold `#111214` ; 3 lignes max ; padding haut 12, bas 8 | :301-304 |
| Texte | 14 `#5B5E64` ; interligne 2 ; 4 lignes max | :305-306 |
| Photos | jusqu'à 2 ; hauteur 132 ; fond `#DDDDDD` ; rayon 12 ; spacing 7 | :328-341 |
| « Ajouter une photo » | 74×132 ; `plus` 22 light + 12 ; pointillés `#C9C9CD` 1,5 [5, 4] ; rayon 12 | :346-354 |
| « Au rapport » | capsule hauteur 42, fond `#EEEEF0`, encre `#111214` ; rond de 20 rempli d'encre avec `checkmark` 10 bold blanc ; texte 14 medium | :653, :658-665 |
| · état « À valider » | fond `#FFF1EB`, encre `#D9481A` | :654 |
| · état « À rédiger » | fond `#E4EEFA`, encre `#3F72AA` | :655 |
| « Flip » | `arrow.triangle.2.circlepath` 16 semibold + 15 semibold `#F15A24` ; hauteur 42 ; contour de capsule `#F15A24` de 1,5 | :629-636 |
| Pied (statut + Flip) | HStack spacing 7 ; padding haut 12 | :627, :310 |
| Points de pagination | actif `#F15A24`, autres `#D4D4D7` ; 8×8 (5×5 aux bords au-delà de 7) ; spacing 8 ; chevrons ‹ › 20 semibold dans 44×44 ; spacing 22 | :695-714 |
| « Glissez pour changer de constat » | 13, `#5B5E64` | :720 |

## 5. Ce que fait l'app une fois la dictée terminée

En bref : oui, le texte est réécrit par une IA, **Claude d'Anthropic**, appelé directement depuis l'iPhone.

1. **Transcription, sur l'appareil.** `BFVoiceRecorder.swift` utilise `SFSpeechRecognizer` d'Apple en français canadien (`fr_CA`, repli `fr_FR`), avec résultats partiels (`shouldReportPartialResults = true`, `taskHint = .dictation`) : les mots s'écrivent pendant qu'on parle. L'audio est gardé comme « preuve terrain » (lecteur ▶ et durée dans la fiche). Pas d'arrêt automatique sur le silence : l'inspecteur appuie sur « Arrêter ».
2. **Recherche dans la banque, sans IA.** `AIBQSuggestionEngine.candidats(query:context:themes:)` (`BatiFlow/AIBQ/Engine/AIBQSuggestionEngine.swift`) cherche dans la banque AIBQ (536 thèmes) les constats proches de la phrase dite, par mots, préfixes, catégorie et fréquence d'usage. Appelé depuis `BFCameraScreen.aibqCandidats(pour:)` (ligne ≈ 15 286).
3. **Rédaction par l'IA, environ 0,9 s après la fin de la dictée.** `AIBQConstatSheet.planifierLaRedaction()` (ligne ≈ 236), puis `redigerIA()` (ligne ≈ 619), appelle `AssistantService.shared.extraireConstatAIBQ(ctx)` (`BatiFlow/Services/AssistantService.swift`, ligne ≈ 551).
   - Le service est l'API Messages d'Anthropic (`https://api.anthropic.com/v1/messages`). Le modèle est **`claude-sonnet-5`** pour la cible « préachat terrain » (`BFReglementsIA.Cible.modele`).
   - Paramètres de l'appel : texte seul, sans photo ; réflexion `adaptive`, effort `low` ; `max_tokens` 8000 ; réponse en JSON imposée par un schéma (`output_config.format = json_schema`).
   - Ce que l'IA reçoit : la parole, la taxonomie AIBQ, le règlement de rédaction (modifiable par JP), les lieux connus du dossier, et les constats candidats de la banque **en entier**. Elle copie ainsi leur style : c'est le bloc « Proposition IA · style de la banque ».
   - Ce qu'elle rend : titre, constat (observation), recommandation, catégorie et sous-catégorie, localisation (seulement si elle est dite), et une gravité AIBQ **proposée** avec les mots qui la justifient. L'inspecteur la confirme d'un tap.
   - Un contrôle sans IA vérifie ensuite la rédaction contre le guide AIBQ (`AssistantService.selonLeGuide`). En cas d'écart, il y a **une seule** reprise ; s'il reste un écart, le texte est marqué « à revoir ».
4. **Garde-fous.**
   - Un champ écrit à la main n'est jamais réécrit.
   - Si un thème de la banque est retenu d'emblée, la fiche s'ouvre sur le texte de la banque (badge « Issu de la banque »). Dans ce cas, l'IA n'est pas relancée à l'ouverture (`onAppear`, ligne ≈ 173).
   - La rédaction ne part pas pendant l'enregistrement.
   - Sans clé API, rien ne part et l'écran affiche : « Aucune clé API sur cet iPhone — Profil › Assistant pour la coller ». La clé est collée par l'inspecteur dans l'app, il n'y a pas de serveur BatiFlow intermédiaire.
   - Le bouton « Réécrire avec l'IA » relance le même appel à la main.
5. **Le résultat à l'écran.**
   - La fiche « Préparer le constat » montre : « Preuve terrain conservée » (audio + « Dictée originale »), puis « Proposition IA · style de la banque » avec Gravité, Titre et Description remplis, l'étiquette « Rédaction IA » et le badge « À valider ».
   - « Approuver le constat » range le constat dans le dossier ; « Enregistrer à valider » le garde en attente.
   - Le constat apparaît ensuite dans le fil, en fiche de carrousel.

**Pour la simulation web.** Un navigateur public ne peut pas appeler Claude avec la clé de JP. Pour rendre ce comportement, deux options : un résultat préparé à l'avance (la phrase de démo « Pente de sol négative vers le bâtiment » et sa proposition, visibles dans les captures `4-fiche-constat/`), ou un petit relais côté serveur qui garde la clé. Pour la dictée en direct, l'équivalent web de `SFSpeechRecognizer` est la Web Speech API (`webkitSpeechRecognition`, `lang = "fr-CA"`), absente de Firefox.

## Les captures (`captures/`)

Captures iPhone en 1206 × 2622 px (iPhone 17 Pro, @3x), sauf mention contraire.

- `1-camera/` : le vrai écran caméra (`BFCameraScreen`) rendu par le banc de captures le 21/10, dossier de démo Maison B. Deux vues : façade (`camera-viseur-facade.png`) et défaut (`camera-viseur-defaut.png`). La pastille « dernier constat » montre un constat d'un autre dossier de démo (« Cerne d'eau au plafond… »).
- `2-annotation/` :
  - `annoter-la-photo.png` : l'écran « Annoter la photo » (banc, 21/10).
  - `formes-reconnues-composition.png` : une **composition** de marketing, pas un écran de l'app. Elle montre trois tracés au doigt (rond, rectangle, trait courbe) et la forme que l'app pose pour chacun (cercle, rectangle, flèche).
- `3-dictee/` : la bulle `AIBQMicroDirect` (« ● J'écoute… », la transcription qui s'écrit, « ■ Arrêter », « ⌨ Clavier »).
  - `bulle-jecoute-*.jpg` : recadrages en 1206 × 900.
  - `dictee-sur-camera-*.jpg` : la bulle posée sur la caméra.
  - Captures de la série du **4 octobre** : l'habillage de la caméra a changé depuis (fond noir et pastille, voir `1-camera`), la bulle est la même.
- `4-fiche-constat/` :
  - `preparer-le-constat-dictee.png` : la fiche après dictée et rédaction IA.
  - `preparer-le-constat-banque.png` : la fiche quand le constat vient de la banque.
  - `modifier-le-constat.png` : le verso de la fiche, éditable.
  - `carrousel-fiche-constat.png` : la carte qui glisse dans le fil (1206 × 2460).
  - `ancienne-feuille-constat-t2-11.jpg` : l'ancienne feuille « Constat » du 4/10, pour mémoire.

Toutes les données visibles sont celles des dossiers de démonstration (Maison A, B et C, Condo 1204). Les adresses sont fictives.
