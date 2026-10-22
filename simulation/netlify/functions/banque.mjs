/* GET /api/banque?sub=… → Top 10 de la sous-section · GET /api/banque?q=… → recherche (12 au plus)
   Titres seulement : le texte d'un thème passe par /api/theme, un à la fois. */
import { chercher, topDix, pourListe } from '../lib/banque.mjs';
import { refuser, reponse } from '../lib/garde.mjs';

export default async req => {
  const non = refuser(req, { max: 240, fenetreMs: 10 * 60e3 }); if (non) return non;
  const p = new URL(req.url).searchParams;
  const q = (p.get('q') || '').slice(0, 80).trim();
  const liste = q ? chercher(q) : topDix((p.get('sub') || '').slice(0, 80));
  return reponse(liste.map(pourListe));
};
export const config = { path: '/api/banque' };
