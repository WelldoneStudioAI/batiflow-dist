# Assemble simulation/index.html : la photo d'exemple est intégrée en base64.
import base64, pathlib
d = pathlib.Path(__file__).parent
src = (d / 'index.src.html').read_text()
b64 = base64.b64encode((d / 'photo-exemple.jpg').read_bytes()).decode()
(d.parent / 'index.html').write_text(src.replace('__COUR__', 'data:image/jpeg;base64,' + b64))
