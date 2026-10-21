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

Relevé en cours dans le code : il arrive dans un commit suivant, sur cette même branche. En attendant, voici les palettes communes (valeurs exactes) :

-  (, ligne 153) : ready #5B8443 / readyBG #E9F2E1 ; draft #3F72AA / draftBG #E4EEFA ; review (à valider) #9A6B00 / reviewBG #FFE566 ; urgent #A44A4A / urgentBG #FBE5E5 ; neutralBG #F1F1F1 ; sub #8A8F98 ; ink #1A1B1E ; bankStripe #4CAF50 ; dictedBG #F2F2F4 ; dictedLine #D9DADF ; hairline = noir 8 % ; jauneFranc #FFD60A ; fait #8A8F98 ; encreBouton #1A1B1E (clair) / #F2F2F7 (sombre).
-  () : Severity attention #FFD93D, correctif #FFA552, securite #E63946, urgent #7B1818, limitation #9CA3AF ; Dark bg #07080A, surface #101216, texte blanc (55 % pour le secondaire) ; Light bg #F4F4F2, texte #0A0A0C ; amber #F7B500. Police maison : Inter (Inter-Light à Inter-ExtraBold) et JetBrains Mono pour les compteurs. Les écrans iPhone cités utilisent surtout la police système (SF Pro) via .
-  () : gravités bfNoneFound #25BC6C, bfInformation #8C8C8C, bfLimitation #996633, bfExpertise #9F5BD5, bfAttention #F5A81E, bfCorrectif #3E94EA, bfSecurite #E2301F, bfUrgent #EC4A41.

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

## Les captures ()

Captures iPhone en 1206 × 2622 px (iPhone 17 Pro, @3x), sauf mention contraire.

-  : le vrai écran caméra () rendu par le banc de captures le 21/10, dossier de démo Maison B. Deux vues : façade () et défaut (). La pastille « dernier constat » montre un constat d'un autre dossier de démo (« Cerne d'eau au plafond… »).
-  :
  -  : l'écran « Annoter la photo » (banc, 21/10).
  -  : une **composition** de marketing, pas un écran de l'app. Elle montre trois tracés au doigt (rond, rectangle, trait courbe) et la forme que l'app pose pour chacun (cercle, rectangle, flèche).
-  : la bulle  (« ● J'écoute… », la transcription qui s'écrit, « ■ Arrêter », « ⌨ Clavier »).
  -  : recadrages en 1206 × 900.
  -  : la bulle posée sur la caméra.
  - Captures de la série du **4 octobre** : l'habillage de la caméra a changé depuis (fond noir et pastille, voir ), la bulle est la même.
-  :
  -  : la fiche après dictée et rédaction IA.
  -  : la fiche quand le constat vient de la banque.
  -  : le verso de la fiche, éditable.
  -  : la carte qui glisse dans le fil (1206 × 2460).
  -  : l'ancienne feuille « Constat » du 4/10, pour mémoire.

Toutes les données visibles sont celles des dossiers de démonstration (Maison A, B et C, Condo 1204). Les adresses sont fictives.
