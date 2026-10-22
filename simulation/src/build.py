# Assemble la simulation : photo de démo, icônes (SF Symbols découpés dans les
# captures) et, en option, la banque AIBQ.
#   python3 build.py                       -> ../index.html, SANS la banque (dépôt public)
#   python3 build.py BANQUE.json SORTIE    -> SORTIE avec la banque (aperçu privé seulement)
import base64, json, pathlib, sys
d = pathlib.Path(__file__).parent
src = (d / 'index.src.html').read_text()
photo = 'data:image/jpeg;base64,' + base64.b64encode((d / 'photo-exemple.jpg').read_bytes()).decode()
icones = {k: {'w': v['w'], 'h': v['h'], 'uri': v['uri']} for k, v in json.loads((d / 'icones.json').read_text()).items()}
banque = 'null'
sortie = d.parent / 'index.html'
if len(sys.argv) > 2:
    def premier(l):
        if isinstance(l, list):
            for x in l:
                if x.get('when') == '*': return x['text']
            return l[0]['text'] if l else ''
        return l or ''
    b = []
    for t in json.loads(pathlib.Path(sys.argv[1]).read_text()):
        g = next((a.get('default') for a in t.get('axes', []) if a.get('id') == 'gravite'), 'correctif')
        b.append({'c': t['categoryName'], 's': t['subcategoryName'], 't': t['titre'], 'o': premier(t.get('observation')), 'r': premier(t.get('recommendation')), 'g': g})
    banque = json.dumps(b, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    sortie = pathlib.Path(sys.argv[2])
html = src.replace('__PHOTO__', photo).replace('__ICONES__', json.dumps(icones, separators=(',', ':'))).replace('__BANQUE__', banque)
sortie.write_text(html)
print(sortie, len(html.encode()) // 1024, 'Ko')
