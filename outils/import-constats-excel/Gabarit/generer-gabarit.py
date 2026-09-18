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


# ---------------------------------------------------------------------------------
# Jeu d'essai « rapport BSI » : reproduit la structure d'un vrai chiffrier de mandat
# (colonnes de provenance, code de priorité, quantité + unité, coût total qui ne
# correspond pas toujours à quantité × prix unitaire, deux colonnes de photos,
# lignes vides au milieu, ligne sans texte de constat). Contenu entièrement fictif.
# ---------------------------------------------------------------------------------

ENTETES_RAPPORT = ["#", "Page PDF", "Classe", "Règle appliquée", "Section", "Sous-section",
                   "Composante", "Bâtiment", "Nº", "Constat", "Localisation",
                   "Recommandation", "Budget (note)", "Code", "Qtes", "",
                   "Cout unitaire", "Coût ($)", "Forme de la ligne", "Photo 1", "Photo 2"]

TEXTE_LONG = (
    "La margelle existante est endommagée ou mal installée, ou encore sa capacité de "
    "drainage est réduite par l'accumulation de débris, ce qui favorise l'infiltration "
    "d'eau vers le mur de fondation et accélère la dégradation du crépi."
)

LIGNES_RAPPORT = [
    ["1", "24", "EXTÉRIEUR", "Nº = EXT", "Composantes structurales", "Fondation",
     "Mur de fondation", "Tous les bâtiments", "EXT", TEXTE_LONG,
     "façade avant", "Réparer ou remplacer la margelle.", "650$/margelle", "U",
     26, "u.", 650, 13000, "constat", "IMG_0001.jpeg", "IMG_0002.jpeg"],
    ["2", "25", "EXTÉRIEUR", "Nº = EXT", "Composantes structurales", "Fondation",
     "Mur de fondation", "100", "EXT", "Présence d'une fissure dans le mur de fondation.",
     "", "Réparation par un entrepreneur spécialisé.", "", "CT",
     2, "u.", 1250, 2500, "constat", "", ""],
    ["3", "55", "EXTÉRIEUR", "Nº = EXT", "Enveloppe du bâtiment", "Toiture",
     "Revêtement de toiture", "200", "EXT", "Les bardeaux d'asphalte sont en fin de vie utile.",
     "Mansardes - 3 façades", "Prévoir le remplacement du revêtement.",
     "Budget: 12$/pi2 (retrait, pose)", "MT", 1680, "pi2", 12, 20160, "constat", "", ""],
    ["4", "32", "EXTÉRIEUR", "Nº = EXT", "Composantes structurales", "Fondation",
     "Mur de fondation", "70-80", "EXT", "", "",
     "Prévoir la réparation des fissures par un entrepreneur spécialisé.", "", "CT",
     2, "u.", 1250, 2500, "constat", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["5", "61", "EXTÉRIEUR", "Nº = EXT", "Aménagement extérieur", "Stationnement",
     "Revêtement de surface", "Tous les bâtiments", "EXT",
     "Le pavage du stationnement présente des fissures et un affaissement localisé.",
     "stationnement arrière", "Réfection partielle du pavage.", "", "LT+",
     "", "", "", 4800, "constat", "", ""],
    ["6", "70", "EXTÉRIEUR", "Nº = EXT", "Services du bâtiment", "Ventilation",
     "Ventilateur de toit", "110", "EXT", "Le ventilateur de toit est bruyant au démarrage.",
     "toiture", "Entretien annuel à prévoir.", "", "CO",
     1, "u.", 900, 900, "constat", "", ""],
    ["7", "88", "EXTÉRIEUR", "Nº = EXT", "Composantes structurales", "Balcons",
     "Garde-corps", "100-110", "EXT",
     "L'ancrage des garde-corps ne peut être vérifié sans ouverture des finis.",
     "balcons arrière", "Faire valider l'ancrage par un ingénieur.", "", "EX",
     1, "u.", "", "", "sans-mot-constat", "", ""],
]

LISEZ_MOI = [
    ["Immeuble fictif — rapport BSI 2020 — constats extérieurs (jeu d'essai)"],
    ["Contenu : 7 constats, structure identique à un vrai chiffrier de mandat."],
    [""],
    ["PRIORITÉS (légende du rapport, p. 8)"],
    ["U — Urgent"],
    ["CT — Court terme (d'ici 1 an)"],
    ["MT — Moyen terme (d'ici 4 ans)"],
    ["LT — Long terme (d'ici 9 ans)"],
    ["LT+ — Long terme (10 ans et +)"],
    ["EX — Avis d'un expert recommandé"],
    ["CO — Entretien ou amélioration suggéré"],
]

PAR_COMPOSANTE = [
    ["Composantes structurales", "Mur de fondation", "3", "18000"],
    ["Enveloppe du bâtiment", "Revêtement de toiture", "1", "20160"],
    ["Aménagement extérieur", "Revêtement de surface", "1", "4800"],
    ["Services du bâtiment", "Ventilateur de toit", "1", "900"],
]

def colonne(index):
    lettres, index = "", index + 1
    while index:
        index, reste = divmod(index - 1, 26)
        lettres = chr(65 + reste) + lettres
    return lettres


def construire(chemin, lignes, hyperliens=None, nom_feuille="Constats", entetes=None):
    """Classeur à une feuille (gabarit et exemple simple)."""
    return construire_multi(chemin, [(nom_feuille, (entetes or ENTETES), lignes, hyperliens or {})])


def construire_multi(chemin, feuilles):
    """Classeur à plusieurs feuilles : (nom, entetes, lignes, hyperliens)."""
    parties_feuilles, parties_rels, xml_feuilles = [], [], []

    # Table des chaînes partagées, commune à tout le classeur.
    chaines, index_chaines = [], {}
    def cle_chaine(valeur):
        if valeur not in index_chaines:
            index_chaines[valeur] = len(chaines)
            chaines.append(valeur)
        return index_chaines[valeur]

    for numero_feuille, (nom_feuille, entetes, lignes, hyperliens) in enumerate(feuilles, start=1):
        table = [entetes] + lignes
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

        xml_feuilles.append((
            numero_feuille, nom_feuille,
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'<sheetData>{"".join(xml_lignes)}</sheetData>{bloc_liens}</worksheet>',
            relations_feuille))

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
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        + "".join(f'<sheet name="{html.escape(n)}" sheetId="{i}" r:id="rId{i}"/>'
                  for i, n, _, _ in xml_feuilles)
        + '</sheets></workbook>'
    )

    nb = len(xml_feuilles)
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + "".join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" '
                  'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                  for i in range(1, nb+1))
        + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
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
        + "".join(f'<Relationship Id="rId{i}" '
                  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
                  f'Target="worksheets/sheet{i}.xml"/>' for i in range(1, nb+1))
        + f'<Relationship Id="rId{nb+1}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" '
        'Target="sharedStrings.xml"/>'
        f'<Relationship Id="rId{nb+2}" '
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
        for i, _, sheet, relations_feuille in xml_feuilles:
            archive.writestr(f"xl/worksheets/sheet{i}.xml", sheet)
            if relations_feuille:
                archive.writestr(
                    f"xl/worksheets/_rels/sheet{i}.xml.rels",
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
    construire_multi(
        RACINE / "Tests" / "BSIConstatsImportTests" / "Fixtures" / "exemple-rapport-bsi.xlsx",
        [("Lisez-moi", ["Lisez-moi"], LISEZ_MOI, {}),
         ("Extérieur", ENTETES_RAPPORT, LIGNES_RAPPORT, {}),
         ("Par composante", ["Section", "Composante", "Constats", "Coût ($)"],
          PAR_COMPOSANTE, {})])
