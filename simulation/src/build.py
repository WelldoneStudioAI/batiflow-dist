# Assemble la simulation BatiFlow (une seule page HTML).
#   python3 build.py                          -> ../index.html, SANS la banque AIBQ (aperçu claude.ai, dépôt public)
#   python3 build.py BANQUE.json SORTIE       -> SORTIE avec la banque intégrée (aperçu privé seulement)
#   python3 build.py --netlify [BANQUE.json]  -> ../netlify/public/index.html (page complète, banque et IA
#                                                appelées sur /api) ; avec BANQUE.json, écrit aussi
#                                                ../netlify/donnees/banque.json pour les fonctions (jamais commité)
import base64, json, pathlib, sys
d = pathlib.Path(__file__).parent
lire = lambda n: (d / n).read_text()

def compacte(src):
    def premier(l):
        if isinstance(l, list):
            for x in l:
                if x.get('when') == '*': return x['text']
            return l[0]['text'] if l else ''
        return l or ''
    def occ(t):
        o = t.get('occurrences', 0)
        return o if isinstance(o, (int, float)) else (len(o) if isinstance(o, (list, dict)) else 0)
    return [{'c': t['categoryName'], 's': t['subcategoryName'], 't': t['titre'], 'o': premier(t.get('observation')), 'r': premier(t.get('recommendation')),
             'g': next((a.get('default') for a in t.get('axes', []) if a.get('id') == 'gravite'), 'correctif'), 'n': occ(t)}
            for t in json.loads(pathlib.Path(src).read_text())]

photo = 'data:image/jpeg;base64,' + base64.b64encode((d / 'photo-exemple.jpg').read_bytes()).decode()
icones = {k: {'w': v['w'], 'h': v['h'], 'uri': v['uri']} for k, v in json.loads(lire('icones.json')).items()}
banque, api, sortie, page = 'null', 'null', d.parent / 'index.html', False
args = sys.argv[1:]
if args[:1] == ['--netlify']:
    api, sortie, page = "'/api'", d.parent / 'netlify' / 'public' / 'index.html', True
    if len(args) > 1:
        donnees = d.parent / 'netlify' / 'donnees' / 'banque.json'
        donnees.parent.mkdir(exist_ok=True)
        donnees.write_text(json.dumps(compacte(args[1]), ensure_ascii=False, separators=(',', ':')))
        print(donnees, donnees.stat().st_size // 1024, 'Ko')
elif len(args) > 1:
    banque = json.dumps(compacte(args[0]), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    sortie = pathlib.Path(args[1])

tete = ('<title>Essai BatiFlow</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">\n'
        '<style>\n' + lire('style.css') + '</style>\n')
corps = (lire('corps.html').replace('__PHOTO__', photo) +
         '<script>\n(() => {\nconst ICONES = ' + json.dumps(icones, separators=(',', ':')) + ';\nconst BANQUE = ' + banque + ';\nconst API = ' + api + ';\n' +
         lire('app1.js') + '\n' + lire('app2.js') + '\n' + lire('vendor/qrcode.js') + '\n' + lire('parcours.js') + '\n})();\n</script>\n')
if page:
    html = ('<!doctype html>\n<html lang="fr-CA">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
            '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%23F15A24%27/%3E%3Ccircle cx=%2716%27 cy=%2716%27 r=%277%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27/%3E%3C/svg%3E">\n'
            '<meta name="theme-color" content="#000000">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="description" content="Essayez BatiFlow sur votre téléphone : photo, annotation, dictée et constat AIBQ rédigé par l’IA, sans rien installer.">\n'
            '<meta property="og:title" content="Essai BatiFlow">\n'
            '<meta property="og:description" content="Photo, dictée, constat AIBQ rédigé par l’IA — essayez l’app d’inspection directement dans votre navigateur.">\n'
            '<style>[hidden]{display:none!important}</style>\n' + tete + '</head>\n<body>\n' + corps + '</body>\n</html>\n')
else:
    html = tete + corps
sortie.write_text(html)
print(sortie, len(html.encode()) // 1024, 'Ko')
