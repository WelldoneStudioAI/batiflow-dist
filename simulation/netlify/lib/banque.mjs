/* Banque AIBQ côté serveur : la page publique ne reçoit jamais la banque entière,
   seulement les résultats d'une recherche (12 au plus) ou un Top 10.
   Mêmes règles que la simulation (src/app2.js : candidats, chercherBanque, topDix). */
import BANQUE from '../donnees/banque.json' with { type: 'json' };

const sansAccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VIDES = new Set('les des une dans pour avec sur sous par aux est sont que qui pas plus vers mais cette ces ses son leur nous avons ont ete fait faire elle ils il on du de la le un et ou en au'.split(' '));
const mots = s => sansAccent(s || '').split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !VIDES.has(w));
const INDEX = BANQUE.map(t => ({ t, ti: [...new Set(mots(t.t))], ob: new Set(mots(t.o + ' ' + t.s)) }));

export const SECTIONS = [...new Set(BANQUE.map(t => t.c))];
export const GRAVITES = ['correctif', 'expertise', 'urgent', 'securite', 'attention', 'suivi', 'limitation', 'information', 'aucune'];

export function candidats(texte, n = 6) {
  const q = [...new Set(mots(texte))]; if (!q.length) return [];
  return INDEX.map(e => {
    let s = 0;
    for (const w of q) { if (e.ti.includes(w)) s += 3; else if (w.length >= 5 && e.ti.some(x => x.startsWith(w.slice(0, 5)))) s += 2; if (e.ob.has(w)) s += 1; }
    return { e: e.t, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
}
export function chercher(q) {
  const ws = mots(q); if (!ws.length) return [];
  return INDEX.filter(e => ws.every(w => e.ti.some(x => x.startsWith(w)) || [...e.ob].some(x => x.startsWith(w)))).map(e => e.t).slice(0, 12);
}
export const topDix = sub => BANQUE.filter(t => t.s === sub).sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, 10);
export const parTitre = titre => BANQUE.find(t => t.t === titre) || null;
/* listes (Top 10, recherche) : le titre seulement, jamais le texte — sinon la banque se copie en une heure */
export const pourListe = ({ c, s, t, g }) => ({ c, s, t, g });
/* un seul thème choisi, avec son texte (route /api/theme, plafond séparé et bas) */
export const pourPage = ({ c, s, t, o, r, g }) => ({ c, s, t, o, r, g });
