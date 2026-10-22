/* POST /api/rediger { texte, sub, theme } → un constat rédigé dans le style de la banque AIBQ.
   Même consigne que la simulation (src/app2.js : consigne). La clé ESSAI_ANTHROPIC_KEY reste ici,
   côté serveur. Si l'IA ne répond pas à temps, on renvoie le thème le plus proche de la banque.
   Jamais la passerelle IA de Netlify : elle injecte ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL et se paie
   en crédits Netlify (crédits à zéro = TOUS les sites de l'équipe en pause). On lit donc une variable
   à nous et on vise api.anthropic.com en dur ; sans clé, c'est le repli de la banque, sans IA. */
import Anthropic from '@anthropic-ai/sdk';
import { candidats, parTitre, SECTIONS, GRAVITES } from '../lib/banque.mjs';
import { refuser, reponse } from '../lib/garde.mjs';

const CLE = process.env.ESSAI_ANTHROPIC_KEY;
const client = CLE ? new Anthropic({ apiKey: CLE, baseURL: 'https://api.anthropic.com', timeout: 9000, maxRetries: 0 }) : null;   // Netlify coupe une fonction à 10 s
const MODELE = process.env.MODELE_IA || 'claude-opus-5-5';

const SCHEMA = {   // l'ordre des champs est celui de l'écriture : l'en-tête d'abord, puis le texte
  type: 'object', additionalProperties: false,
  required: ['gravite', 'section', 'sous_section', 'titre', 'constat', 'recommandation', 'localisation'],
  properties: {
    gravite: { type: 'string', enum: GRAVITES }, section: { type: 'string', enum: SECTIONS }, sous_section: { type: 'string' },
    titre: { type: 'string' }, constat: { type: 'string' }, recommandation: { type: 'string' }, localisation: { type: 'string' },
  },
};

const consigne = (texte, cands, sousCat) => `Tu es l'assistant de rédaction de BatiFlow (inspection préachat au Québec, banque AIBQ).
À partir de la parole de l'inspecteur, rédige UN constat dans le style exact de la banque : copie la longueur, le ton et la structure des constats candidats ci-dessous.
Règles : n'invente rien qui n'est pas dit ; "constat" commence par « Nous avons constaté » ; "recommandation" à l'infinitif comme dans la banque (ex. « Faire corriger… par un entrepreneur qualifié. ») ; "titre" court, sans point final ; "localisation" seulement si elle est dite, sinon "".
"gravite" : un code parmi ${GRAVITES.join(', ')}. "section" : une parmi ${SECTIONS.join(', ')}. "sous_section" : celle du candidat le plus proche, sinon ${sousCat}.
Constats candidats de la banque :
${cands.map((c, i) => `${i + 1}. [${c.e.c} / ${c.e.s}] ${c.e.t} (gravité ${c.e.g || 'correctif'})\n   Observation : ${c.e.o}\n   Recommandation : ${c.e.r}`).join('\n') || '(aucun)'}

Parole de l'inspecteur : « ${texte} »`;

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
  const proches = cands.slice(0, 3).map(c => c.e.t);
  const repli = () => { const p = cands[0]; return p && p.s >= 5 ? { ...depuisBanque(p.e), proches } : { src: 'aucun' }; };

  /* Réponse en flux (une ligne JSON par événement) : {d} = morceau du JSON rédigé, {reprise} = tout
     effacer (l'IA de repli reprend du début), {fin} = le constat final ou le repli de la banque. */
  const enc = new TextEncoder();
  const flux = new ReadableStream({
    async start(ctl) {
      const envoyer = o => ctl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      let ecrit = '';
      if (client) try {
        const stream = client.beta.messages.stream({
          model: MODELE,
          max_tokens: 2000,
          output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          messages: [{ role: 'user', content: consigne(texte, cands.slice(0, 6), sub) }],
        });
        for await (const ev of stream) {
          if (ev.type === 'content_block_start' && ev.content_block.type === 'fallback') { ecrit = ''; envoyer({ reprise: true }); }
          else if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { ecrit += ev.delta.text; envoyer({ d: ev.delta.text }); }
        }
        const r = await stream.finalMessage();
        if (r.stop_reason !== 'refusal' && r.stop_reason !== 'max_tokens') {
          const j = JSON.parse(ecrit);
          if (j?.titre?.trim() && j?.constat?.trim()) { envoyer({ fin: { src: 'ia', ...j, proches } }); ctl.close(); return; }
        }
      } catch (e) {
        console.error('rediger', e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e?.message);
      }
      envoyer({ fin: repli() }); ctl.close();
    },
  });
  return new Response(flux, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } });
};
export const config = { path: '/api/rediger' };
