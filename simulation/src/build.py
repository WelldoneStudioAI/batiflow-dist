# Assemble la simulation BatiFlow (une seule page HTML).
#   python3 build.py                       -> ../index.html, SANS la banque AIBQ (dépôt public)
#   python3 build.py BANQUE.json SORTIE    -> SORTIE avec la banque (aperçu privé seulement)
import base64, json, pathlib, sys
d = pathlib.Path(__file__).parent
lire = lambda n: (d / n).read_text()
photo = 'data:image/jpeg;base64,' + base64.b64encode((d / 'photo-exemple.jpg').read_bytes()).decode()
icones = {k: {'w': v['w'], 'h': v['h'], 'uri': v['uri']} for k, v in json.loads(lire('icones.json')).items()}
banque, sortie = 'null', d.parent / 'index.html'
if len(sys.argv) > 2:
    def premier(l):
        if isinstance(l, list):
            for x in l:
                if x.get('when') == '*': return x['text']
            return l[0]['text'] if l else ''
        return l or ''
    def occ(t):
        o = t.get('occurrences', 0)
        return o if isinstance(o, (int, float)) else (len(o) if isinstance(o, (list, dict)) else 0)
    b = [{'c': t['categoryName'], 's': t['subcategoryName'], 't': t['titre'], 'o': premier(t.get('observation')), 'r': premier(t.get('recommendation')),
          'g': next((a.get('default') for a in t.get('axes', []) if a.get('id') == 'gravite'), 'correctif'), 'n': occ(t)}
         for t in json.loads(pathlib.Path(sys.argv[1]).read_text())]
    banque = json.dumps(b, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    sortie = pathlib.Path(sys.argv[2])
html = ('<title>Essai BatiFlow</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">\n'
        '<style>\n' + lire('style.css') + '</style>\n' + lire('corps.html').replace('__PHOTO__', photo) +
        '<script>\n(() => {\nconst ICONES = ' + json.dumps(icones, separators=(',', ':')) + ';\nconst BANQUE = ' + banque + ';\n' +
        lire('app1.js') + '\n' + lire('app2.js') + '\n})();\n</script>\n')
sortie.write_text(html)
print(sortie, len(html.encode()) // 1024, 'Ko')
