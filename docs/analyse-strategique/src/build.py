#!/usr/bin/env python3
import pathlib, re, sys, unicodedata
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

D = pathlib.Path(__file__).parent
CSS = (D / "style.css").read_text()
FONTS = (D / "fonts" / "fonts.css").read_text()

ORDER = ["01_preamble.html","02_toc.html","03_exec.html",
         "part03.html","part04.html","part05.html","part06.html",
         "part07.html","part08.html","part09.html","part10.html"]

TITLE = "BatiFlow — Analyse juridique, stratégique et commerciale"

def doc(body, extra_css="", cover=False):
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>{TITLE}</title><style>{FONTS}</style><style>{CSS}</style><style>{extra_css}</style>
</head><body{' class="cover-doc"' if cover else ''}>{body}</body></html>"""

HEADER = """<div style="font-family:Inter,Arial,sans-serif;font-size:6.4pt;letter-spacing:.16em;
 text-transform:uppercase;color:#9AA4AF;width:100%;padding:0 18mm;margin-top:9mm;
 display:flex;justify-content:space-between;border-bottom:.4pt solid #E3E7EB;padding-bottom:2.5mm;">
 <span style="color:#0E2439;font-weight:600;">BatiFlow</span>
 <span>Analyse juridique, stratégique et commerciale — v2.0</span></div>"""

FOOTER = """<div style="font-family:Inter,Arial,sans-serif;font-size:6.4pt;letter-spacing:.14em;
 text-transform:uppercase;color:#9AA4AF;width:100%;padding:0 18mm;margin-bottom:7mm;
 display:flex;justify-content:space-between;align-items:baseline;">
 <span>Confidentiel — diffusion restreinte</span>
 <span style="font-size:8pt;letter-spacing:0;color:#0E2439;font-weight:600;">
 <span class="pageNumber"></span><span style="color:#B9C1C9;font-weight:400;"> / <span class="totalPages"></span></span></span></div>"""

COVER_CSS = "@page{margin:0;} .cover-doc .cover{height:297mm;}"

def render(page, html_path, out, header=True):
    page.goto(html_path.as_uri(), wait_until="networkidle")
    page.emulate_media(media="print")
    page.evaluate("document.fonts.ready")
    opts = dict(path=str(out), format="A4", print_background=True,
                display_header_footer=header,
                margin={"top":"20mm","bottom":"16mm","left":"18mm","right":"18mm"})
    if header:
        opts["header_template"] = HEADER
        opts["footer_template"] = FOOTER
    else:
        opts["header_template"] = "<span></span>"
        opts["footer_template"] = "<span></span>"
        opts["margin"] = {"top":"0","bottom":"0","left":"0","right":"0"}
    page.pdf(**opts)

def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[\u2018\u2019\u02bc\u0060\u00b4]", "'", s)
    s = re.sub(r"[\u2013\u2014\u2212]", "-", s)
    return re.sub(r"\s+", " ", s)

def main():
    body = "\n".join((D / f).read_text() for f in ORDER)
    (D / "_body.html").write_text(doc(body))
    (D / "_cover.html").write_text(doc((D / "00_cover.html").read_text(), COVER_CSS, cover=True))

    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox","--font-render-hinting=none"])
        pg = br.new_page()
        render(pg, D / "_cover.html", D / "_cover.pdf", header=False)
        render(pg, D / "_body.html", D / "_body.pdf")

        # --- passe 2 : numéros de page de la table des matières ---
        r = PdfReader(str(D / "_body.pdf"))
        pages = [norm(p.extract_text() or "") for p in r.pages]
        toc_pages = {i for i, t in enumerate(pages) if "Table des matières" in t}
        finds = re.findall(r'data-find="([^"]+)"', body)
        mapping = {}
        for f in finds:
            nf = norm(f)
            hit = next((i + 1 for i, t in enumerate(pages)
                        if i not in toc_pages and nf in t), None)
            mapping[f] = str(hit) if hit else "·"
            if not hit:
                print(f"  ! introuvable : {f}", file=sys.stderr)

        def sub(m):
            return m.group(0).replace('>·<', '>%s<' % mapping.get(m.group(1), '·'))
        body2 = re.sub(r'<span class="t-s" data-find="([^"]+)">·</span>', sub, body)
        (D / "_body.html").write_text(doc(body2))
        render(pg, D / "_body.html", D / "_body.pdf")
        br.close()

    w = PdfWriter()
    for f in ("_cover.pdf", "_body.pdf"):
        for p in PdfReader(str(D / f)).pages:
            w.add_page(p)
    w.add_metadata({"/Title": TITLE,
                    "/Subject": "Création d'une offre post-inspection — Québec",
                    "/Author": "BatiFlow",
                    "/Keywords": "inspection, estimation, soumissions, Québec, faisabilité"})
    out = D / "BatiFlow_Analyse_Juridique_Strategique_Commerciale_v2.pdf"
    with open(out, "wb") as fh:
        w.write(fh)
    print(f"OK — {out}  ({len(PdfReader(str(out)).pages)} pages, {out.stat().st_size//1024} Ko)")

main()
