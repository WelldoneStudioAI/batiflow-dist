#!/usr/bin/env python3
"""Génère le gabarit Excel du BSI et le fichier d'exemple « sale » servant aux tests.

Aucune dépendance : le .xlsx est écrit directement (zip + XML OOXML minimal).
    python3 Gabarit/generer-gabarit.py
"""
import zipfile, pathlib, html

RACINE = pathlib.Path(__file__).resolve().parent.parent

ENTETES = ["Titre", "Description", "Recommandation", "Occurrence",
           "Prix unitaire", "Gravité", "Lien photo", "Localisation", "Catégorie"]

GABARIT = [
    ["Fissure verticale en fondation",
     "Fissure verticale d'environ 1,2 m sur le mur de fondation nord, avec trace d'infiltration.",
     "Injection de polyuréthane par une firme spécialisée et vérification du drain français.",
     2, 850.00, "Majeure", "https://exemple.ca/photos/fissure-nord.jpg",
     "Sous-sol — mur nord", "Structure"],
    ["Bardeaux soulevés en pente sud",
     "Une dizaine de bardeaux soulevés et deux bardeaux manquants près du faîte.",
     "Remplacement ponctuel des bardeaux et inspection du solin de cheminée.",
     1, 1200.00, "Modérée", "toiture-pente-sud.jpg",
     "Toiture — pente sud", "Enveloppe"],
    ["Absence de garde-corps à l'escalier arrière",
     "Escalier de 5 marches sans garde-corps côté cour.",
     "Installation d'un garde-corps conforme au Code de construction.",
     1, 1750.00, "Critique", "", "Extérieur — cour arrière", "Sécurité"],
]

# Exemple volontairement irrégulier : sert de test de robustesse.
EXEMPLE = [
    ["Fissure verticale en fondation",
     "Fissure verticale d'environ 1,2 m, trace d'infiltration.",
     "Injection de polyuréthane.", "2", "1 234,56 $", "Majeur",
     "https://exemple.ca/photos/fissure-nord.jpg", "Sous-sol", "Structure"],
    ["", "Calfeutrage des fenêtres à reprendre au complet.",
     "Reprise du calfeutrage sur les 14 fenêtres.", "14 unités", "85,00",
     "modéré", "fenetre-salon.JPG", "Ensemble du bâtiment", "Enveloppe"],
    ["Panneau électrique saturé",
     "Aucun espace libre au panneau principal, deux disjoncteurs doubles bricolés.",
     "Ajout d'un panneau secondaire par un maître électricien.", "1", "à valider",
     "urgence", "", "Local technique", "Électricité"],
    ["", "", "", "", "", "", "", "", ""],
    ["Ventilateur de salle de bain inopérant",
     "Le ventilateur tourne mais n'évacue pas ; conduit probablement débranché.",
     "Vérification du conduit et remplacement de l'appareil au besoin.", "x2",
     "$325.00", "3", "photo", "Salle de bain étage", "Ventilation"],
]
# Hyperlien posé sur la cellule « photo » de la dernière ligne (colonne G).
HYPERLIENS_EXEMPLE = {"G6": "https://exemple.ca/photos/ventilateur.jpg"}


def colonne(index):
    lettres, index = "", index + 1
    while index:
        index, reste = divmod(index - 1, 26)
        lettres = chr(65 + reste) + lettres
    return lettres


def construire(chemin, lignes, hyperliens=None, nom_feuille="Constats"):
    hyperliens = hyperliens or {}
    table = [ENTETES] + lignes

    # Table des chaînes partagées.
    chaines, index_chaines = [], {}
    def cle_chaine(valeur):
        if valeur not in index_chaines:
            index_chaines[valeur] = len(chaines)
            chaines.append(valeur)
        return index_chaines[valeur]

    xml_lignes = []
    for numero, ligne in enumerate(table, start=1):
        cellules = []
        for index, valeur in enumerate(ligne):
            reference = f"{colonne(index)}{numero}"
            if valeur is None or valeur == "":
                continue
            if isinstance(valeur, (int, float)):
                cellules.append(f'<c r="{reference}"><v>{valeur}</v></c>')
            else:
                cellules.append(f'<c r="{reference}" t="s"><v>{cle_chaine(str(valeur))}</v></c>')
        xml_lignes.append(f'<row r="{numero}">{"".join(cellules)}</row>')

    bloc_liens, relations_feuille = "", []
    if hyperliens:
        morceaux = []
        for position, (reference, cible) in enumerate(hyperliens.items(), start=1):
            identifiant = f"rIdL{position}"
            morceaux.append(f'<hyperlink ref="{reference}" r:id="{identifiant}"/>')
            relations_feuille.append(
                f'<Relationship Id="{identifiant}" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" '
                f'Target="{html.escape(cible)}" TargetMode="External"/>')
        bloc_liens = f'<hyperlinks>{"".join(morceaux)}</hyperlinks>'

    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<cols>'
        '<col min="1" max="1" width="38" customWidth="1"/>'
        '<col min="2" max="3" width="46" customWidth="1"/>'
        '<col min="4" max="6" width="14" customWidth="1"/>'
        '<col min="7" max="9" width="26" customWidth="1"/>'
        '</cols>'
        f'<sheetData>{"".join(xml_lignes)}</sheetData>{bloc_liens}</worksheet>'
    )

    shared = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        f'count="{len(chaines)}" uniqueCount="{len(chaines)}">'
        + "".join(f"<si><t>{html.escape(c)}</t></si>" for c in chaines)
        + "</sst>"
    )

    workbook = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets><sheet name="{nom_feuille}" sheetId="1" r:id="rId1"/></sheets></workbook>'
    )

    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        '</Types>'
    )

    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/></Relationships>'
    )

    workbook_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        'Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" '
        'Target="sharedStrings.xml"/>'
        '<Relationship Id="rId3" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
        'Target="styles.xml"/></Relationships>'
    )

    styles = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<fonts count="1"><font><sz val="12"/><name val="Calibri"/></font></fonts>'
        '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
        '<borders count="1"><border/></borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
        '</styleSheet>'
    )

    chemin.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(chemin, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", rels)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/styles.xml", styles)
        archive.writestr("xl/sharedStrings.xml", shared)
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
        if relations_feuille:
            archive.writestr(
                "xl/worksheets/_rels/sheet1.xml.rels",
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                + "".join(relations_feuille) + "</Relationships>")
    print("écrit :", chemin.relative_to(RACINE))


def csv_exemple(chemin):
    import csv
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with open(chemin, "w", newline="", encoding="utf-8") as fichier:
        auteur = csv.writer(fichier, delimiter=";")
        auteur.writerow(ENTETES)
        for ligne in EXEMPLE:
            auteur.writerow(ligne)
    print("écrit :", chemin.relative_to(RACINE))


if __name__ == "__main__":
    construire(RACINE / "Gabarit" / "gabarit-constats-bsi.xlsx", GABARIT)
    construire(RACINE / "Tests" / "BSIConstatsImportTests" / "Fixtures" / "exemple-constats.xlsx",
               EXEMPLE, HYPERLIENS_EXEMPLE)
    csv_exemple(RACINE / "Gabarit" / "exemple-constats.csv")
    csv_exemple(RACINE / "Tests" / "BSIConstatsImportTests" / "Fixtures" / "exemple-constats.csv")
