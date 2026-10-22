/* GET /api/theme?t=<titre> → le texte d'UN thème choisi dans la banque (observation, recommandation).
   Plafond séparé et bas : on lit un constat à la fois, on ne recopie pas la banque. */
import { parTitre, pourPage } from '../lib/banque.mjs';
import { refuser, reponse } from '../lib/garde.mjs';

export default async req => {
  const non = refuser(req, { max: 30, fenetreMs: 60 * 60e3 }); if (non) return non;
  const titre = (new URL(req.url).searchParams.get('t') || '').slice(0, 200);
  const t = titre ? parTitre(titre) : null;
  return t ? reponse(pourPage(t)) : reponse({ erreur: 'introuvable' }, 404);
};
export const config = { path: '/api/theme' };
