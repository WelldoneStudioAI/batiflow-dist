#!/usr/bin/env python3
"""Monte un dossier BSI (`batiflow.bsi.dossier`) à partir d'un manifeste `bsi.json`.

Sert quand on a exporté le manifeste seul depuis la web app et que les photos sont
restées sur le poste : on recolle le tout en une archive que BatiFlow ouvre.

    python3 monter-dossier.py bsi.json                         # manifeste seul
    python3 monter-dossier.py bsi.json --photos ~/Photos/110   # avec les photos
    python3 monter-dossier.py bsi.json --nom "Extérieur" -o Exterieur-bsi.zip

Le manifeste n'est jamais réécrit sur le fond : seuls le nom du dossier (`--nom`) et
le décompte des photos réellement jointes sont mis à jour.
"""
import argparse
import json
import pathlib
import unicodedata
import zipfile

EXTENSIONS_IMAGE = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".gif",
                    ".tif", ".tiff", ".webp", ".bmp", ".pdf"}


def cle_fichier(nom: str) -> str:
    """Clé de rapprochement : sans accent, sans casse, sans ponctuation."""
    sans_accent = unicodedata.normalize("NFD", nom)
    sans_accent = "".join(c for c in sans_accent if unicodedata.category(c) != "Mn")
    return "".join(c for c in sans_accent.lower() if c.isalnum())


def indexer_photos(dossier: pathlib.Path) -> dict:
    """Toutes les images du dossier (et de ses sous-dossiers), par nom et par nom sans extension."""
    index = {}
    for chemin in dossier.rglob("*"):
        if not chemin.is_file() or chemin.suffix.lower() not in EXTENSIONS_IMAGE:
            continue
        index.setdefault(cle_fichier(chemin.name), chemin)
        index.setdefault(cle_fichier(chemin.stem), chemin)
    return index


def vers_csv(manifeste: dict) -> str:
    colonnes = [
        ("Ligne", lambda c: c.get("ligneSource", "")),
        ("Priorité", lambda c: (c.get("priorite") or {}).get("libelle", "") or c.get("graviteTexte", "") or ""),
        ("Code", lambda c: c.get("cotationOrigine") or ""),
        ("Titre", lambda c: c.get("titre") or ""),
        ("Description", lambda c: c.get("description") or ""),
        ("Recommandation", lambda c: c.get("recommandation") or ""),
        ("Quantité", lambda c: c.get("quantite", "")),
        ("Unité", lambda c: c.get("unite") or ""),
        ("Prix unitaire", lambda c: c.get("prixUnitaire") if c.get("prixUnitaire") is not None else ""),
        ("Coût retenu", lambda c: c.get("coutRetenu") if c.get("coutRetenu") is not None else ""),
        ("Coût du chiffrier", lambda c: c.get("coutChiffrier") if c.get("coutChiffrier") is not None else ""),
        ("Catégorie", lambda c: c.get("categorie") or ""),
        ("Localisation", lambda c: " ; ".join(c.get("localisations") or ([c["localisation"]] if c.get("localisation") else []))),
        ("Photos", lambda c: " | ".join(p.get("nomOrigine") or p.get("url") or "" for p in (c.get("photos") or []))),
    ]

    def echapper(valeur) -> str:
        texte = "" if valeur is None else str(valeur)
        return '"' + texte.replace('"', '""') + '"' if any(x in texte for x in ';"\n') else texte

    lignes = [";".join(nom for nom, _ in colonnes)]
    for constat in manifeste["constats"]:
        lignes.append(";".join(echapper(lire(constat)) for _, lire in colonnes))
    return "\n".join(lignes)


def vers_rapport(manifeste: dict) -> str:
    source = manifeste.get("source", {})
    lignes = [
        f"Dossier BSI — {manifeste['dossier']['nom']}",
        f"Source : {source.get('fichier', '—')} (feuille « {source.get('feuille', '—')} »)",
        f"Lignes lues : {source.get('lignesLues', '—')}",
        f"Constats : {len(manifeste['constats'])}",
        f"Lignes vides ignorées : {source.get('lignesIgnorees', '—')}",
        f"Photos jointes : {manifeste['dossier'].get('photosIncluses', 0)}",
        f"Total retenu : {manifeste['dossier'].get('totalRetenu', 0):,.2f} $".replace(",", " "),
    ]
    if manifeste.get("lectureAutomatique"):
        lignes += ["", "Lecture automatique :"] + ["- " + a for a in manifeste["lectureAutomatique"]]
    if manifeste.get("avertissements"):
        lignes += ["", f"Avertissements ({len(manifeste['avertissements'])}) :"]
        lignes += [f"Ligne {a['ligne']} — {a['message']}" for a in manifeste["avertissements"]]
    return "\n".join(lignes)


def vers_lisezmoi(manifeste: dict, manquantes: list) -> str:
    entete = manifeste["dossier"]
    total = f"{entete.get('totalRetenu', 0):,.2f} $".replace(",", " ")
    lignes = [
        f"# Dossier BSI — {entete['nom']}",
        "",
        f"Format `{manifeste['format']}`, version {manifeste['version']}.",
        f"Produit à partir de `{manifeste.get('source', {}).get('fichier', '—')}`.",
        "",
        "## Contenu",
        "",
        "| Fichier | Rôle |",
        "|---------|------|",
        "| `bsi.json` | Le manifeste : c'est ce que BatiFlow lit. |",
        f"| `photos/` | Les {entete.get('photosIncluses', 0)} photo(s) jointes, référencées par `constats[].photos[].fichier`. |",
        "| `constats.csv` | Les mêmes constats en tableau. |",
        "| `rapport.txt` | Le rapport de lecture. |",
        "",
        "## Chiffres",
        "",
        f"- {entete.get('nombreConstats', len(manifeste['constats']))} constats, {total} au total.",
    ]
    if manquantes:
        lignes += [
            "",
            "## Photos manquantes",
            "",
            "Ces fichiers sont référencés par le manifeste mais n'ont pas été trouvés sur le poste :",
            "",
        ] + [f"- `{nom}`" for nom in manquantes]
    return "\n".join(lignes) + "\n"


def monter(manifeste_chemin, photos_dossier, sortie, nom_dossier):
    manifeste = json.loads(pathlib.Path(manifeste_chemin).read_text(encoding="utf-8"))
    if manifeste.get("format") != "batiflow.bsi.dossier":
        raise SystemExit(f"Format inattendu : {manifeste.get('format')!r}")

    if nom_dossier:
        manifeste["dossier"]["nom"] = nom_dossier
    manifeste["dossier"]["nom"] = manifeste["dossier"]["nom"].strip()

    index = indexer_photos(pathlib.Path(photos_dossier)) if photos_dossier else {}
    jointes, manquantes = {}, []

    for constat in manifeste["constats"]:
        for photo in constat.get("photos") or []:
            nom = photo.get("nomOrigine") or (photo.get("fichier") or "").split("/")[-1]
            if not nom or photo.get("statut") == "distante":
                continue
            trouve = index.get(cle_fichier(nom)) or index.get(cle_fichier(pathlib.Path(nom).stem))
            if trouve:
                chemin = "photos/" + trouve.name
                jointes[chemin] = trouve
                photo["statut"] = "incluse"
                photo["fichier"] = chemin
                photo["nomOrigine"] = trouve.name
            else:
                photo["statut"] = "introuvable"
                photo.pop("fichier", None)
                photo["nomOrigine"] = nom
                manquantes.append(nom)

    manifeste["dossier"]["photosIncluses"] = len(jointes)

    sortie = pathlib.Path(sortie)
    with zipfile.ZipFile(sortie, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("bsi.json", json.dumps(manifeste, ensure_ascii=False, indent=2))
        for chemin_interne, source in sorted(jointes.items()):
            archive.write(source, chemin_interne)
        archive.writestr("constats.csv", vers_csv(manifeste))
        archive.writestr("rapport.txt", vers_rapport(manifeste))
        archive.writestr("LISEZMOI.md", vers_lisezmoi(manifeste, sorted(set(manquantes))))

    print(f"Dossier monté : {sortie} ({sortie.stat().st_size / 1024:.0f} Ko)")
    print(f"  {len(manifeste['constats'])} constats, "
          f"{manifeste['dossier'].get('totalRetenu', 0):,.2f} $".replace(",", " "))
    print(f"  {len(jointes)} photo(s) jointes, {len(set(manquantes))} introuvable(s)")


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description=__doc__,
                                        formatter_class=argparse.RawDescriptionHelpFormatter)
    analyseur.add_argument("manifeste", help="le fichier bsi.json exporté depuis la web app")
    analyseur.add_argument("--photos", help="dossier où chercher les photos référencées")
    analyseur.add_argument("--nom", help="nom du dossier BSI (par défaut : celui du manifeste)")
    analyseur.add_argument("-o", "--sortie", help="archive à écrire (par défaut : <nom>-bsi.zip)")
    arguments = analyseur.parse_args()

    nom = arguments.nom or json.loads(
        pathlib.Path(arguments.manifeste).read_text(encoding="utf-8"))["dossier"]["nom"]
    defaut = "".join(c if c.isalnum() or c in " -_" else "-" for c in nom).strip().replace(" ", "-")
    monter(arguments.manifeste, arguments.photos,
           arguments.sortie or f"{defaut}-bsi.zip", arguments.nom)
