#!/usr/bin/env python3
import pathlib, re

D = pathlib.Path(__file__).parent
CSS = (D / "web.css").read_text()

FILES = ["01_preamble.html","03_exec.html","part03.html","part04.html","part05.html",
         "part06.html","part07.html","part08.html","part09.html","part10.html"]

# (id, numéro affiché, libellé, groupe)
NAV = [
 ("preambule","—","Portée et limites","Ouverture"),
 ("synthese","—","Sommaire exécutif","Ouverture"),
 ("decisions","—","Décisions demandées","Ouverture"),
 ("p1","I","Cadre et thèse économique","Corps de l’analyse"),
 ("p2","II","Faisabilité réglementaire","Corps de l’analyse"),
 ("p3","III","Marché et positionnement","Corps de l’analyse"),
 ("p4","IV","Prix et modèle économique","Corps de l’analyse"),
 ("p5","V","Mise en marché","Corps de l’analyse"),
 ("p6","VI","Modèle opérationnel","Corps de l’analyse"),
 ("p7","VII","Risques et gouvernance","Corps de l’analyse"),
 ("p8","VIII","Plan de déploiement","Corps de l’analyse"),
 ("p9","IX","Tableau de bord","Corps de l’analyse"),
 ("ax1","A–E","Fiches, lexique, questions","Annexes"),
 ("ax2","F–H","Glossaire, sources, checklist","Annexes"),
]

body = "\n".join((D / f).read_text() for f in FILES)

# identifiants de section, dans l'ordre
ids = iter([n[0] for n in NAV])
def tag(m):
    try: return '<section id="%s"%s' % (next(ids), m.group(1))
    except StopIteration: return m.group(0)
body = re.sub(r'<section( class="part")?', tag, body)

# la pagination imprimée n'a pas de sens ici
body = body.replace(' class="part"', '')
# tableaux défilables
body = re.sub(r'(<table\b.*?</table>)', r'<div class="tw">\1</div>', body, flags=re.S)
# la matrice et le gantt ont déjà leur conteneur via .tw
body = body.replace('<div class="tw"><table class="matrix">',
                    '<div class="tw" style="border:none"><table class="matrix">')

rail = []
grp = None
for i, (sid, num, lab, g) in enumerate(NAV):
    if g != grp:
        rail.append(f'<div class="r-grp">{g}</div>'); grp = g
    rail.append(f'<a href="#{sid}"><span class="rn">{num}</span><span>{lab}</span></a>')
rail = "\n".join(rail)

cover = (D / "00_cover.html").read_text()

html = f"""<title>Dossier post-inspection BatiFlow</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>{CSS}</style>

<div class="topbar">
  <div class="wm">BATI<span>FLOW</span></div>
  <div class="tb-t">Analyse juridique, stratégique et commerciale — offre post-inspection</div>
  <div class="tb-v">v2.0 · Confidentiel</div>
</div>

{cover}

<div class="shell">
  <nav class="rail" aria-label="Sections du document">{rail}</nav>
  <main class="doc">{body}</main>
</div>

<footer class="doc-foot"><div>
  <span>BatiFlow — dossier de décision, version 2.0 du 12 septembre 2026.</span>
  <span>Document de travail confidentiel. Ne constitue pas un avis juridique ni une confirmation de couverture d’assurance.</span>
</div></footer>

<script>
(function () {{
  var links = Array.prototype.slice.call(document.querySelectorAll('.rail a'));
  var map = {{}};
  links.forEach(function (a) {{
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) map[el.id] = a;
  }});
  var seen = {{}};
  var io = new IntersectionObserver(function (entries) {{
    entries.forEach(function (e) {{ seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; }});
    var best = null, top = -1;
    Object.keys(seen).forEach(function (k) {{ if (seen[k] > top) {{ top = seen[k]; best = k; }} }});
    links.forEach(function (a) {{ a.classList.remove('on'); }});
    if (best && map[best] && top > 0) map[best].classList.add('on');
  }}, {{ rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.02, 0.2, 0.6] }});
  Object.keys(map).forEach(function (id) {{ io.observe(document.getElementById(id)); }});
}})();
</script>
"""
out = D / "batiflow_web.html"
out.write_text(html)
print("OK", out, len(html) // 1024, "Ko")
