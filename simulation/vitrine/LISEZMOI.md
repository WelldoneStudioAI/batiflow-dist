# Intégrer l'essai à la vitrine batiflow.app

Le site vitrine (`batiflow-vitrine`, publié à la main) ne fait pas tourner de fonctions serveur.
L'essai reste donc un site Netlify **séparé** (`simulation/netlify/`, banque + IA côté serveur),
servi sous **essai.batiflow.app**, et la vitrine l'affiche dans une nouvelle section.

1. **Déployer l'essai** : `simulation/netlify/deployer.sh` (voir son LISEZMOI).
2. **Domaine** :
   - Cloudflare, zone `batiflow.app` : CNAME `essai` → `essai-batiflow.netlify.app`, **proxy désactivé** (nuage gris).
   - Netlify, site `essai-batiflow` → Domain management → Add domain alias / custom domain `essai.batiflow.app`
     (le certificat HTTPS se pose seul en quelques minutes).
3. **Section** : coller `section-essai.html` dans l'`index.html` de la vitrine (la vitrine est servie sous batiflow.app ; inspecteur.expert y redirige par `_redirects` ; source sur le Mac :
   `~/Desktop/Welldone/4.iA/Obsidian/WelldoneStudio/06-Output/sites/2026-10-04_batiflow-site-demos/`),
   ajouter un lien « Essayer » vers `#essai` dans le menu, puis republier la vitrine comme d'habitude.

`section-essai.html` est produit par `node fabriquer.mjs [adresse]` à partir de `modele-section.html`
(l'adresse et le code QR y sont inscrits ; rien à charger depuis un CDN).

- **Sur ordinateur** : l'essai tourne dans un iPhone (`?integre`), chargé seulement quand la section approche.
- **Sur téléphone** : un bouton « Lancer l'essai » ouvre l'essai en plein écran (caméra et dictée réelles).
