/* Protections minimales des fonctions publiques : même origine, débit par adresse IP.
   Le compteur vit dans l'instance de la fonction (au mieux) — le vrai plafond de dépenses
   se règle dans la console Anthropic. */
const fenetres = new Map();

export function refuser(req, { max, fenetreMs }) {
  const origine = req.headers.get('origin');
  if (origine && new URL(origine).host !== new URL(req.url).host) return reponse({ erreur: 'origine' }, 403);
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'inconnu';
  const maintenant = Date.now();
  const f = (fenetres.get(ip) || []).filter(t => maintenant - t < fenetreMs);
  if (f.length >= max) return reponse({ erreur: 'trop' }, 429);
  f.push(maintenant); fenetres.set(ip, f);
  if (fenetres.size > 5000) fenetres.clear();
  return null;
}
export const reponse = (corps, statut = 200) => new Response(JSON.stringify(corps), {
  status: statut, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
