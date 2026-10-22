/* POST /api/rediger { texte, sub, theme } → un constat rédigé dans le style de la banque AIBQ.
   Même consigne que la simulation (src/app2.js : consigne). La clé ANTHROPIC_API_KEY reste ici,
   côté serveur. Si l'IA ne répond pas à temps, on renvoie le thème le plus proche de la banque. */
import Anthropic from '@anthropic-ai/sdk';
import { candidats, parTitre, SECTIONS, GRAVITES } from '../lib/banque.mjs';
import { refuser, reponse } from '../lib/garde.mjs';

const client = new Anthropic({ timeout: 8500, maxRetries: 0 });   // Netlify coupe une fonction à 10 s
const MODELE = process.env.MODELE_IA || 'claude-opus-5-5';

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['section', 'sous_section', 'gravite', 'titre', 'constat', 'recommandation', 'localisation'],
  properties: {
    section: { type: 'string', enum: SECTIONS }, sous_section: { type: 'string' },
    gravite: { type: 'string', enum: GRAVITES }, titre: { type: 'string' },
    constat: { type: 'string' }, recommandation: { type: 'string' }, localisation: { type: 'string' },
  },
};

const consigne = (texte, cands, sousCat) => `Tu es l'assistant de rédaction de BatiFlow (inspection préachat au Québec, banque AIBQ).
À partir de la parole de l'inspecteur, rédige UN constat dans le style exact de la banque : copie la longueur, le ton et la structure des constats candidats ci-dessous.
Règles : n'invente rien qui n'est pas dit ; "constat" commence par « Nous avons constaté » ; "recommandation" à l'infinitif comme dans la banque (ex. « Faire corriger… par un entrepreneur qualifié. ») ; "titre" court, sans point final ; "localisation" seulement si elle est dite, sinon "".
"gravite" : un code parmi ${GRAVITES.join(', ')}. "section" : une parmi ${SECTIONS.join(', ')}. "sous_section" : celle du candidat le plus proche, sinon ${sousCat}.
Constats candidats de la banque :
${cands.map((c, i) => `${i + 1}. [${c.e.c} / ${c.e.s}] ${c.e.t} (gravité ${c.e.g || 'correctif'})\n   Observation : ${c.e.o}\n   Recommandation : ${c.e.r}`).join('\n') || '(aucun)'}

Parole de l'inspecteur : « ${texte} »`;

const titresProches = cands => cands.slice(0, 3).map(c => c.e.t);
const depuisBanque = e => ({ src: 'banque', section: e.c, sous_section: e.s, gravite: e.g || 'correctif', titre: e.t, constat: e.o, recommandation: e.r, localisation: '' });

export default async req => {
  if (req.method !== 'POST') return reponse({ erreur: 'méthode' }, 405);
  const non = refuser(req, { max: 20, fenetreMs: 60 * 60e3 }); if (non) return non;
  let corps; try { corps = await req.json(); } catch { return reponse({ erreur: 'json' }, 400); }
  const texte = String(corps?.texte || '').slice(0, 600).trim();
  const sub = String(corps?.sub || '').slice(0, 80);
  const theme = corps?.theme ? parTitre(String(corps.theme)) : null;
  if (!texte && !theme) return reponse({ erreur: 'vide' }, 400);

  const cands = candidats(texte + ' ' + (theme ? theme.t : ''));
  if (theme) cands.unshift({ e: theme, s: 99 });
  try {
    const r = await client.beta.messages.create({
      model: MODELE,
      max_tokens: 2000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content: consigne(texte, cands.slice(0, 6), sub) }],
    });
    if (r.stop_reason !== 'refusal' && r.stop_reason !== 'max_tokens') {
      const bloc = r.content.find(b => b.type === 'text');
      const j = bloc ? JSON.parse(bloc.text) : null;
      if (j?.titre?.trim() && j?.constat?.trim()) return reponse({ src: 'ia', ...j, proches: titresProches(cands) });
    }
  } catch (e) {
    console.error('rediger', e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e?.message);
  }
  const proche = cands[0];
  return proche && proche.s >= 5 ? reponse({ ...depuisBanque(proche.e), proches: titresProches(cands) }) : reponse({ src: 'aucun' });
};
export const config = { path: '/api/rediger' };
