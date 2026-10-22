/* Partie 2 : Banque, feuille « Préparer le constat », rédaction IA, onglets Constats / Aperçu /
   Compte rendu, annotation, accueil. Références : AIBQRefonteBanqueView, AIBQConstatSheet (corpsRefonte),
   AIBQCarrouselView, AIBQRefonteApercuView, AIBQRefonteCompteRenduView, BFPhotoAnnotationView, BFHomeScreen. */

/* ---------- banque AIBQ : recherche et candidats ---------- */
const VIDES = new Set('les des une dans pour avec sur sous par aux est sont que qui pas plus vers mais cette ces ses son leur nous avons ont ete fait faire elle ils il on du de la le un et ou en au'.split(' '));
const mots = s => sansAccent(s || '').split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !VIDES.has(w));
const INDEX = (BANQUE || []).map(t => ({ t, ti: [...new Set(mots(t.t))], ob: new Set(mots(t.o + ' ' + t.s)) }));
function candidats(texte, n = 6) {
  const q = [...new Set(mots(texte))]; if (!q.length) return [];
  return INDEX.map(e => {
    let s = 0;
    for (const w of q) { if (e.ti.includes(w)) s += 3; else if (w.length >= 5 && e.ti.some(x => x.startsWith(w.slice(0, 5)))) s += 2; if (e.ob.has(w)) s += 1; }
    return { e: e.t, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
}
function chercherBanque(q) {
  const ws = mots(q); if (!ws.length) return [];
  return INDEX.filter(e => ws.every(w => e.ti.some(x => x.startsWith(w)) || [...e.ob].some(x => x.startsWith(w)))).map(e => e.t).slice(0, 12);
}
const topDix = () => (BANQUE || []).filter(t => t.s === cam.sub).sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, 10);
/* site public (API) : la banque reste sur le serveur, la page ne reçoit que des résultats ; null = en cours */
const cacheBanque = new Map(); let minuterieBanque = 0;
function itemsBanque() {
  const q = banque.q.trim();
  if (!API) return q ? chercherBanque(q) : topDix();
  const cle = q ? 'q=' + sansAccent(q) : 's=' + cam.sub;
  if (cacheBanque.has(cle)) return banque.vus = cacheBanque.get(cle);
  clearTimeout(minuterieBanque);
  minuterieBanque = setTimeout(() => fetch(`${API}/banque?` + new URLSearchParams(q ? { q } : { sub: cam.sub }))
    .then(r => r.ok ? r.json() : []).catch(() => [])
    .then(l => { cacheBanque.set(cle, Array.isArray(l) ? l : []); if (banque) rendreBanque(); }), q ? 250 : 0);
  return banque.vus || null;
}

/* ---------- la Banque de la refonte (vue 03) : glisser ← sur le viseur ---------- */
let banque = null;
function ouvrirBanque() {
  if ($('#banque')) return;
  vibrer(10);
  banque = { q: '', ecoute: false, micro: null };
  const voile = h('div', { id: 'voile-banque', onclick: fermerBanque });
  const p = h('div', { id: 'banque' });
  ecran.append(voile, p);
  let x0 = null;
  p.addEventListener('pointerdown', e => { x0 = pt(e); });
  p.addEventListener('pointerup', e => { if (!x0) return; const q = pt(e); if (q[0] - x0[0] > 70 && Math.abs(q[1] - x0[1]) < 60) fermerBanque(); x0 = null; });
  banque.micro = new Micro({ surTexte: t => { banque.q = t; rendreBanque(); }, surEchec: () => { banque.ecoute = false; rendreBanque(); } });
  banque.ecoute = banque.micro.demarrer();
  rendreBanque();
}
function fermerBanque() { if (!banque) return; banque.micro?.arreter(true); banque = null; $('#banque')?.remove(); $('#voile-banque')?.remove(); }
function rendreBanque() {
  const p = $('#banque'); if (!p || !banque) return;
  const enRecherche = !!banque.q.trim();
  const items = itemsBanque();
  const liste = h('div', { class: 'liste' });
  if (!items) liste.append(h('div', { class: 'vide' }, 'Recherche dans la banque…'));
  else if (!items.length) liste.append(h('div', { class: 'vide' }, enRecherche ? `Rien pour « ${banque.q.trim()} ». Essaie un autre mot.` : 'Aucun constat récurrent ici. Cherche dans toute la banque ci-dessous.'));
  (items || []).forEach((t, k) => liste.append(h('button', { class: 'item', onclick: () => choisirTheme(t) },
    h('span', { class: 'rg' }, String(k + 1).padStart(2, '0')),
    h('span', { class: 't' }, h('b', {}, t.t), enRecherche ? h('small', {}, `${t.c} › ${t.s}`) : null),
    ic('pluscercle', 22, 22))));
  const champ = h('input', { placeholder: 'Rechercher un constat…', value: banque.q, 'aria-label': 'Rechercher un constat', oninput: e => { banque.q = e.target.value; const pos = e.target.selectionStart; rendreBanque(); const n = $('#banque input'); n.focus(); n.setSelectionRange(pos, pos); } });
  const ecoute = banque.ecoute ? h('div', { class: 'ecoute' }, h('div', { class: 'barres' }, ...Array.from({ length: 11 }, (_, k) => h('i', { style: `height:${6 + Math.abs(Math.sin(k * 1.3)) * 16}px;animation-delay:${k * .07}s` }))),
    h('b', {}, 'Recherche vocale active'), h('small', {}, banque.q ? `« ${banque.q} »` : 'Dites le constat recherché')) : null;
  p.textContent = '';
  p.append(
    h('button', { class: 'ret', onclick: fermerBanque }, ic('left'), 'Retour à la caméra'),
    h('div', { class: 'tete' }, h('h3', {}, enRecherche ? 'Résultats' : 'Banque de constats'), enRecherche ? null : h('span', { class: 'top10' }, ic('etoile', 14, 14), 'Top 10')),
    h('div', { class: 'st' }, enRecherche ? 'Toute la banque · toutes les sections' : 'Vos constats les plus utilisés'),
    liste, ...(ecoute ? [ecoute] : []),
    h('div', { class: 'recherche' }, ic('loupe', 17, 17), champ,
      banque.q ? h('button', { class: 'eff', 'aria-label': 'Effacer la recherche', onclick: () => { banque.q = ''; rendreBanque(); } }, ic('xmark', 14, 14)) : null,
      h('button', { class: 'micro', 'aria-label': banque.ecoute ? 'Arrêter la recherche vocale' : 'Rechercher à la voix', onclick: () => { if (banque.ecoute) { banque.micro.arreter(); banque.ecoute = false; } else { banque.ecoute = banque.micro.demarrer() && !banque.micro.ko; } rendreBanque(); } }, ic(banque.ecoute ? 'stopf' : 'micro', 18, 18))));
}
function choisirTheme(t) {
  fermerBanque();
  const cat = catParLabel(t.c); if (cat) { cam.cat = cat[0]; if (cat[2].includes(t.s)) cam.sub = t.s; } majTitre();
  ouvrirFeuille({ mode: 'banque', photos: [], cat: cam.cat, sub: t.s, titre: t.t, constat: t.o, reco: t.r, gravite: t.g || 'correctif', confirmee: true, lieu: cam.lieu?.caption || '', theme: t });
}

/* ---------- rédaction IA (AssistantService.extraireConstatAIBQ → ici l'IA du visiteur) ---------- */
let sample = null;
try { window.claude?.use?.('sample').then(s => { sample = s; }).catch(() => {}); } catch (e) {}
function consigne(texte, cands, sousCat) {
  return `Tu es l'assistant de rédaction de BatiFlow (inspection préachat au Québec, banque AIBQ).
À partir de la parole de l'inspecteur, rédige UN constat dans le style exact de la banque : copie la longueur, le ton et la structure des constats candidats ci-dessous.
Règles : n'invente rien qui n'est pas dit ; "constat" commence par « Nous avons constaté » ; "recommandation" à l'infinitif comme dans la banque (ex. « Faire corriger… par un entrepreneur qualifié. ») ; "titre" court, sans point final ; "localisation" seulement si elle est dite, sinon "".
"gravite" : un code parmi ${Object.keys(GRAV).join(', ')}. "section" : une parmi ${CATS.map(c => c[1]).join(', ')}. "sous_section" : celle du candidat le plus proche, sinon ${sousCat}.
Constats candidats de la banque :
${cands.map((c, i) => `${i + 1}. [${c.e.c} / ${c.e.s}] ${c.e.t} (gravité ${c.e.g || 'correctif'})\n   Observation : ${c.e.o}\n   Recommandation : ${c.e.r}`).join('\n') || '(aucun)'}

Parole de l'inspecteur : « ${texte} »

Réponds uniquement avec l'objet JSON {"section","sous_section","gravite","titre","constat","recommandation","localisation"}.`;
}
async function redigerDistant(texte, { cat, sub, theme }) {
  try {
    const r = await fetch(`${API}/rediger`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texte, sub, theme: theme?.t || '' }), signal: AbortSignal.timeout(20000) });
    const j = r.ok ? await r.json() : null;
    if (!j?.titre || !j?.constat) return null;
    const c = catParLabel(j.section);
    return { src: j.src, cat: c ? c[0] : cat, sub: j.sous_section || sub, gravite: GRAV[j.gravite] ? j.gravite : 'correctif', titre: j.titre.trim().replace(/\.$/, ''), constat: j.constat.trim(), reco: (j.recommandation || '').trim(), lieu: (j.localisation || '').trim() };
  } catch (e) { return null; }
}
async function rediger(texte, { cat, sub, theme } = {}) {
  if (API && !sample) return redigerDistant(texte, { cat, sub, theme });
  const cands = candidats(texte + ' ' + (theme ? theme.t : ''));
  if (theme) cands.unshift({ e: theme, s: 99 });
  if (sample) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 45000);
    try {
      const r = await sample.json(consigne(texte, cands.slice(0, 6), sub), { modelTier: 'quick', signal: ctl.signal });
      const s = k => typeof r?.[k] === 'string' ? r[k].trim() : '';
      if (s('titre') && s('constat')) {
        const c = catParLabel(s('section'));
        return { src: 'ia', cat: c ? c[0] : cat, sub: s('sous_section') || sub, gravite: GRAV[s('gravite')] ? s('gravite') : 'correctif', titre: s('titre').replace(/\.$/, ''), constat: s('constat'), reco: s('recommandation'), lieu: s('localisation') };
      }
    } catch (e) {} finally { clearTimeout(to); }
  }
  await new Promise(ok => setTimeout(ok, 900));
  const c = cands[0];
  if (c && c.s >= 5) { const k = catParLabel(c.e.c); return { src: 'banque', cat: k ? k[0] : cat, sub: c.e.s, gravite: c.e.g || 'correctif', titre: c.e.t, constat: c.e.o, reco: c.e.r, lieu: '' }; }
  return null;
}
async function redigerEnFond(c) {
  const r = await rediger(c.dictee, { cat: c.cat, sub: c.sub });
  if (!r || !dossier.constats.includes(c)) return;
  Object.assign(c, { cat: r.cat, sub: r.sub, titre: r.titre, constat: r.constat, reco: r.reco, gravite: r.gravite, statut: 'valider', iaSrc: r.src, lieu: c.lieu || r.lieu });
  majChrome(); if ($('#calque')) rendreOnglet();
}

/* ---------- feuille « Préparer le constat » (calque pleine largeur, entrée par le bas) ---------- */
let feuilleEtat = null, feuilleMicro = null;
function ouvrirFeuille(etat) {
  fermerCalque(true); finGuide();
  feuilleEtat = Object.assign({ titre: '', constat: '', reco: '', gravite: null, confirmee: false, lieu: '', dictee: '', duree: 0, redaction: null, notes: '' }, etat);
  rendreFeuille();
}
function fermerFeuille() { feuilleMicro?.arreter(true); feuilleMicro = null; feuilleEtat = null; $('#feuille')?.remove(); majChrome(); }
function rendreFeuille() {
  const f = feuilleEtat; if (!f) return;
  const ancien = $('#feuille'), defil = ancien ? $('#fi-defile', ancien).scrollTop : 0; ancien?.remove();
  const banqueMode = f.mode === 'banque', modif = f.mode === 'modifier';
  const el = h('div', { id: 'feuille', style: ancien ? 'animation:none' : '' });
  const enAttente = f.mode === 'dictee' && !f.titre && f.redaction !== 'fini';
  /* en-tête */
  el.append(h('div', { id: 'fi-haut' },
    h('button', { id: 'fi-ret', onclick: () => fermerFeuille() }, ic('left'), 'Caméra'),
    h('button', { id: 'fi-dots', 'aria-label': 'Options', onclick: e => menu(e.currentTarget, [
      { texte: feuilleMicro ? 'Arrêter la dictée' : 'Dicter dans ce constat', icone: 'micro', action: () => feuilleMicro ? feuilleArreterDictee() : feuilleDicter() },
      { texte: 'Note inspecteur — liée à ce constat', icone: 'notet', action: () => toast('Note inspecteur — liée à ce constat') },
      { texte: 'Dupliquer — autre localisation', icone: 'pellicule', action: () => toast('Dupliqué — prends la photo de l’autre localisation') },
      ...(f.theme ? [{ texte: 'Constat libre — sans lier à la banque', icone: 'crayonc', action: () => { f.theme = null; toast('Constat libre'); } }] : []),
      { texte: 'Note de chantier — jamais au rapport', icone: 'cadenas', action: () => toast('Note de chantier — jamais au rapport') }]) }, ic('dots'))));
  const corps = h('div', { id: 'fi-corps' });
  /* titre et pastilles */
  const tete = h('div', { class: 'fi-tete' }, h('h3', {}, modif ? 'Modifier le constat' : 'Préparer le constat'));
  if (banqueMode) tete.append(h('span', { class: 'puce-banque' }, 'Issu de la banque'));
  else if (!modif) {
    tete.append(h('span', { class: 'pastille-valider' }, ic('clock'), 'À valider'));
    if (f.redaction) tete.append(h('span', { class: 'puce-ia' }, ic('spark'), f.redaction === 'encours' ? 'Rédaction…' : f.redSrc === 'banque' ? 'Issu de la banque' : 'Rédaction IA'));
  }
  corps.append(tete);
  /* section · sous-section */
  const cat = CATS.find(c => c[0] === f.cat) || CATS[0];
  const caseSec = h('button', { class: 'case' }, h('div', {}, h('small', {}, 'Section'), h('b', {}, catLabel(f.cat))), ic('chevd'));
  caseSec.onclick = () => menu(caseSec, CATS.map(c => ({ texte: c[1], coche: c[0] === f.cat, action: () => { f.cat = c[0]; if (!c[2].includes(f.sub)) f.sub = c[2][0]; rendreFeuille(); } })), { droite: false });
  const caseSous = h('button', { class: 'case' }, h('div', {}, h('small', {}, 'Sous-section'), h('b', {}, f.sub)), ic('chevd'));
  caseSous.onclick = () => menu(caseSous, cat[2].map(s => ({ texte: s, coche: s === f.sub, action: () => { f.sub = s; rendreFeuille(); } })));
  corps.append(h('div', { class: 'deux' }, caseSec, caseSous));
  /* preuve terrain conservée */
  if (f.mode === 'dictee' && f.dictee) {
    const wf = h('span', { class: 'wf' });
    for (let k = 0; k < 22; k++) wf.append(h('i', { class: k < 11 ? 'o' : '', style: `height:${5 + Math.abs(Math.sin(k * 2.1)) * 18}px` }));
    corps.append(h('div', { class: 'carte-p' }, h('h4', {}, 'Preuve terrain conservée'),
      h('div', { class: 'lect' }, h('span', { class: 'play' }, ic('play')), wf, h('span', { class: 'du' }, fmt2(f.duree))),
      h('div', { class: 'lab' }, 'Dictée originale'), h('div', { class: 'cit' }, `« ${f.dictee} »`)));
  }
  if (f.mode === 'dictee') corps.append(h('div', { class: 'prop' }, h('h4', {}, f.redSrc === 'brouillon' ? 'Proposition IA' : 'Proposition IA · style de la banque'), h('p', {}, 'Longueur, ton et structure harmonisés')));
  /* champs */
  const bloc = h('div', { class: 'bloc' + (f.redaction === 'encours' ? ' attente' : '') });
  const g = f.gravite;
  const sel = h('select', { 'aria-label': 'Gravité', onchange: e => { f.gravite = e.target.value; f.confirmee = true; rendreFeuille(); } }, h('option', { value: '' }, 'À choisir'), ...Object.entries(GRAV).map(([k, [n]]) => h('option', { value: k, selected: k === g }, n)));
  bloc.append(h('div', { class: 'ligne' }, h('span', {}, !g ? h('i', { class: 'manque' }) : null, 'Gravité'),
    h('div', { class: 'grav' }, h('i', { style: `background:${g ? GRAV[g][1] : '#BDBEC2'}` }), h('span', {}, g ? (f.confirmee ? GRAV[g][0] : `${GRAV[g][0]} · proposée`) : 'À choisir'), ic('chevd2')), sel));
  if (g && !f.confirmee) bloc.append(h('div', { class: 'confirmer-r' }, h('button', { onclick: () => { f.confirmee = true; rendreFeuille(); } }, `Confirmer « ${GRAV[g][0]} »`)));
  const champ = (lib, cle, invite, manque) => {
    const t = h('textarea', { rows: 1, placeholder: invite, 'aria-label': lib, oninput: e => { f[cle] = e.target.value; grandir(e.target); if (cle === 'titre') majBoutonsFeuille(); } });
    t.value = f[cle] || '';
    return h('div', { class: 'ligne' }, h('span', {}, manque && !f[cle] ? h('i', { class: 'manque' }) : null, lib), h('div', {}, t));
  };
  bloc.append(h('div', { class: 'filet' }), champ('Titre', 'titre', 'Titre du constat', true), h('div', { class: 'filet' }), champ('Description', 'constat', 'Ce qui a été constaté', true), h('div', { class: 'filet' }), champ('Recommandation', 'reco', 'Ce qu’il faut faire'));
  corps.append(bloc);
  corps.append(h('div', { class: 'carte-lieu' }, champ('Localisation', 'lieu', 'Saisir ou dicter')));
  if (banqueMode) corps.append(h('button', { class: 'reprise', onclick: () => feuilleDicter() }, h('span', { class: 'm' }, ic('micro', 18, 18)), h('span', {}, h('b', {}, f.dictee ? `« ${f.dictee} »` : 'Reprise de la dictée initiale · modifiable'), h('small', {}, 'Si absente : saisir ou dicter'))));
  /* photos */
  const ph = h('div', { class: 'photos-r' });
  f.photos.forEach(p => ph.append(h('img', { src: p.url, alt: '', onclick: () => ouvrirAnnotation(p, () => rendreFeuille()) })));
  ph.append(h('button', { class: 'ajout', onclick: () => { $('#feuille').style.display = 'none'; lotOuvrir('feuille'); } }, ic('plus'), 'Ajouter'));
  corps.append(h('div', { class: 'photos-t' }, 'Photos'), ph);
  corps.append(h('div', { class: 'notes-i' }, h('b', {}, 'Notes internes · facultatif'), h('small', {}, 'Sur le Mac, jamais au rapport.')));
  el.append(h('div', { id: 'fi-defile' }, corps));
  /* boutons */
  const btns = h('div', { id: 'fi-btns' });
  if (banqueMode) btns.append(h('button', { class: 'p ink', id: 'fi-p', onclick: () => enregistrerFeuille('rapport') }, 'Créer le constat'), h('button', { class: 's lien', onclick: fermerFeuille }, 'Retour à la caméra'));
  else if (modif) btns.append(h('button', { class: 'p', id: 'fi-p', onclick: () => enregistrerFeuille(null) }, 'Enregistrer'), h('button', { class: 's', onclick: fermerFeuille }, 'Annuler'));
  else btns.append(h('button', { class: 'p', id: 'fi-p', onclick: () => enregistrerFeuille('rapport') }, 'Approuver le constat'), h('button', { class: 's', id: 'fi-s', onclick: () => enregistrerFeuille('valider') }, 'Enregistrer à valider'));
  el.append(btns);
  ecran.append(el);
  $$('#feuille textarea').forEach(grandir);
  $$('#feuille .case b').forEach(b => tenir(b)); $$('#feuille .ligne > span').forEach(s => tenir(s)); tenir($('#feuille .fi-tete h3'), .8);
  $('#fi-defile').scrollTop = defil;
  majBoutonsFeuille();
  if (feuilleMicro) montrerBulleFeuille();
}
const grandir = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
function majBoutonsFeuille() { const p = $('#fi-p'); if (p && feuilleEtat) p.disabled = !feuilleEtat.titre.trim() || feuilleEtat.redaction === 'encours'; const s = $('#fi-s'); if (s) s.disabled = feuilleEtat?.redaction === 'encours'; }
function montrerBulleFeuille() {
  $('#bulle-fi')?.remove();
  const b = bulleMicro({ invite: 'Dis ce que tu vois, et où.', surArreter: feuilleArreterDictee });
  b.id = 'bulle-fi'; $('#feuille').append(b); feuilleMicro.bulle = b;
  if (feuilleMicro.ko) b.clavier('Micro non disponible ici — écris, ou touche le micro du clavier');
  else if (feuilleMicro.texte) b.ecrire(feuilleMicro.texte);
}
function feuilleDicter() {
  if (!feuilleEtat || feuilleMicro) return;
  feuilleMicro = new Micro({ surTexte: t => feuilleMicro?.bulle?.ecrire(t), surEchec: () => feuilleMicro?.bulle?.clavier('Micro non disponible ici — écris, ou touche le micro du clavier') });
  feuilleMicro.debut = performance.now();
  feuilleMicro.demarrer();
  montrerBulleFeuille();
}
async function feuilleArreterDictee() {
  const m = feuilleMicro; if (!m || !feuilleEtat) return;
  const texte = (m.bulle ? m.bulle.valeur() : '') || m.arreter(false);
  m.arreter(false); feuilleMicro = null; $('#bulle-fi')?.remove();
  if (!texte) { rendreFeuille(); return; }
  const f = feuilleEtat;
  f.dictee = texte; f.duree = Math.max(1, Math.round((performance.now() - m.debut) / 1000));
  if (f.mode === 'banque') { rendreFeuille(); return; }
  f.redaction = 'encours'; rendreFeuille();
  const r = await rediger(texte, { cat: f.cat, sub: f.sub });
  if (feuilleEtat !== f) return;
  f.redaction = 'fini'; f.redSrc = r ? r.src : 'brouillon';
  if (r) Object.assign(f, { cat: r.cat, sub: r.sub, titre: f.titre || r.titre, constat: f.constat || r.constat, reco: f.reco || r.reco, gravite: r.gravite, confirmee: false, lieu: f.lieu || r.lieu });
  else Object.assign(f, { titre: f.titre || texte.split(/[.!?]/)[0].slice(0, 60), constat: f.constat || 'Nous avons constaté ' + texte.replace(/^./, x => x.toLowerCase()).replace(/[.\s]*$/, '.'), gravite: 'correctif' });
  rendreFeuille();
}
function enregistrerFeuille(statut) {
  const f = feuilleEtat; if (!f) return;
  feuilleMicro?.arreter(true); feuilleMicro = null;
  if (f.mode === 'modifier') {
    const c = dossier.constats.find(x => x.id === f.constatId);
    if (c) Object.assign(c, { cat: f.cat, sub: f.sub, titre: f.titre, constat: f.constat, reco: f.reco, gravite: f.gravite, lieu: f.lieu, photos: f.photos });
    fermerFeuille(); ouvrirOnglet('chat', f.constatId); return;
  }
  const c = { id: nouvelId(), cat: f.cat, sub: f.sub, titre: f.titre.trim(), constat: f.constat, reco: f.reco, gravite: f.gravite || 'correctif', lieu: f.lieu, photos: f.photos, dictee: f.dictee, duree: f.duree, createdAt: Date.now(), statut, notes: [], inclus: true };
  dossier.constats.push(c); dernierId = c.id;
  cam.cat = c.cat; cam.sub = c.sub; majTitre();
  fermerFeuille(); vibrer([8, 30, 8]); majChrome();
}

/* ---------- calque des onglets (AIBQDrawerLayer : plein écran en refonte) ---------- */
let onglet = null, filtre = { sec: null, sous: null }, focusId = null, indexFiche = 0, retournee = false, apercu = { filtre: 'tous', q: '', ouvert: null, tout: false }, crSegment = 'dossier', crOuvertes = new Set([1]);
function ouvrirOnglet(o, id) {
  fermerRaccourcis(); fermerTiroir(); fermerBanque(); finGuide();
  if (o === 'viseur') return fermerCalque();
  vibrer(4); onglet = o; if (id) focusId = id; retournee = false;
  if (!$('#calque')) ecran.append(h('div', { id: 'calque' }));
  const nav = $('#onglets'); nav.classList.replace('sombre', 'claire');
  $$('#onglets .tab').forEach(t => t.classList.toggle('on', t.dataset.onglet === o));
  rendreOnglet();
}
function fermerCalque(sansAnim) {
  onglet = null; $('#calque')?.remove();
  const nav = $('#onglets'); nav.classList.replace('claire', 'sombre');
  $$('#onglets .tab').forEach(t => t.classList.toggle('on', t.dataset.onglet === 'viseur'));
  majChrome();
}
$$('#onglets .tab').forEach(t => t.addEventListener('click', () => { if (cam.dictee || cam.lot) return; ouvrirOnglet(t.dataset.onglet); }));
function rendreOnglet() {
  const c = $('#calque'); if (!c) return;
  c.textContent = '';
  const contenu = h('div', { class: 'contenu' });
  c.append(contenu);
  if (onglet === 'chat') rendreConstats(contenu);
  else if (onglet === 'apercu') rendreApercu(contenu);
  else rendreCompteRendu(contenu);
}
function enteteOnglet(titre) {
  return h('div', { class: 'ent-ong' },
    h('button', { class: 'rd', 'aria-label': 'Raccourcis du dossier', onclick: () => { fermerCalque(); setTimeout(ouvrirTiroir, 300); } }, ic('menu', 16, 9)),
    h('div', { class: 'tt' }, h('b', {}, titre), h('small', {}, dossier.adresse)),
    h('button', { class: 'rd', 'aria-label': 'Accueil', onclick: ouvrirAccueil }, ic('maison', 18, 18)));
}

/* ---------- Constats : le carrousel (AIBQCarrouselView) ---------- */
const ordreCat = k => CATS.findIndex(c => c[0] === k);
function fichesFiltrees() {
  return dossier.constats.filter(c => c.statut !== 'corbeille')
    .filter(c => !filtre.sec || c.cat === filtre.sec).filter(c => !filtre.sous || c.sub === filtre.sous)
    .sort((a, b) => ordreCat(a.cat) - ordreCat(b.cat) || ((CATS.find(x => x[0] === a.cat)?.[2].indexOf(a.sub)) - (CATS.find(x => x[0] === b.cat)?.[2].indexOf(b.sub))) || a.createdAt - b.createdAt);
}
const STATUTS = { rapport: ['Au rapport', 'check', ''], valider: ['À valider', 'clock', 'valider'], rediger: ['À rédiger', 'pencil', 'rediger'] };
function badgeDe(g) {
  if (!g) return h('span', { class: 'badge gris' }, h('i'), 'GRAVITÉ ?');
  const plein = g === 'urgent' || g === 'securite', orange = plein || g === 'correctif' || g === 'expertise';
  return h('span', { class: 'badge' + (plein ? ' plein' : orange ? '' : ' gris') }, h('i'), g === 'correctif' ? 'À CORRIGER' : GRAV[g][0].toUpperCase());
}
function statutDe(c) { const [t, i, k] = STATUTS[c.statut] || STATUTS.rediger; return h('div', { class: 'statut ' + k }, h('i', {}, ic(i, 10, 10)), t); }
function rendreConstats(cont) {
  const L = fichesFiltrees(), n = L.length;
  if (focusId) { const k = L.findIndex(c => c.id === focusId); if (k >= 0) indexFiche = k; focusId = null; }
  else if (indexFiche >= n) indexFiche = 0;
  if (!n) indexFiche = 0;
  const actif = L[indexFiche];
  cont.style.paddingTop = '29px';
  const plus = h('button', { class: 'plus', 'aria-label': 'Options de la section' }, ic('cdots', 18, 4.2));
  plus.onclick = () => menu(plus, [{ texte: 'Bilan de la section', icone: 'coches', action: bilanSection }]);
  cont.append(h('div', { class: 'ent-ref' },
    h('button', { class: 'ret', 'aria-label': 'Retour à la caméra', onclick: () => fermerCalque() }, ic('cback')),
    h('div', { class: 'tt' }, h('b', {}, dossier.adresse), h('small', {}, dossier.ville)), plus));
  const scene = h('div', { id: 'scene' });
  cont.append(scene);
  if (!n) {
    scene.append(h('div', { class: 'vide-fil', style: 'position:absolute;inset:0' }, ic('tstack', 28, 29), h('b', {}, 'Aucun constat dans cette section'), h('small', {}, 'Prends une photo ou dicte : la fiche apparaîtra ici.')));
  }
  /* pagination */
  const pts = h('div', { class: 'pts' });
  const debut = Math.max(0, Math.min(indexFiche - 3, n - 7));
  for (let k = debut; k < Math.min(n, debut + 7); k++) pts.append(h('i', { class: (k === indexFiche ? 'on' : '') + (n > 7 && (k === debut && k > 0 || k === debut + 6 && k < n - 1) ? ' mini' : '') }));
  const pager = h('div', { id: 'pager' }, h('div', { class: 'l' },
    h('button', { 'aria-label': 'Constat précédent', disabled: n < 2, onclick: () => tourner(-1) }, ic('cl')), pts,
    h('button', { 'aria-label': 'Constat suivant', disabled: n < 2, onclick: () => tourner(1) }, ic('cr'))), h('small', {}, 'Glissez pour changer de constat'));
  cont.append(pager);
  /* pilules Section / Sous-section */
  const secLab = filtre.sec ? catLabel(filtre.sec) : actif ? catLabel(actif.cat) : 'Toutes';
  const sousLab = filtre.sous || (actif ? actif.sub : 'Toutes');
  const bSec = h('button', { class: 'sombre' }, h('div', {}, h('b', {}, filtre.sec ? 'Section · filtre' : 'Section'), h('small', {}, secLab)), ic('chevd3'));
  const bSous = h('button', { class: 'claire' }, h('div', {}, h('b', {}, filtre.sous ? 'Sous-section · filtre' : 'Sous-section'), h('small', {}, sousLab)), ic('chevd3', null, null));
  bSous.querySelector('.ic').style.background = 'var(--ink)';
  bSec.onclick = () => {
    const cats = CATS.filter(c => dossier.constats.some(x => x.cat === c[0] && x.statut !== 'corbeille'));
    menu(bSec, [{ texte: 'Toutes les sections', coche: !filtre.sec, action: () => { filtre = { sec: null, sous: null }; rendreOnglet(); } }, '-',
      ...cats.map(c => ({ texte: `${c[1]}  ·  ${dossier.constats.filter(x => x.cat === c[0] && x.statut !== 'corbeille').length}`, coche: filtre.sec === c[0], action: () => { filtre = { sec: c[0], sous: null }; cam.cat = c[0]; cam.sub = c[2][0]; majTitre(); indexFiche = 0; rendreOnglet(); } }))], { haut: true, droite: false });
  };
  bSous.onclick = () => {
    const k = filtre.sec || actif?.cat; if (!k) return;
    const subs = (CATS.find(c => c[0] === k) || CATS[0])[2];
    menu(bSous, [{ texte: 'Toutes les sous-sections', coche: !filtre.sous, action: () => { filtre.sous = null; rendreOnglet(); } }, '-',
      ...subs.map(s => ({ texte: s, coche: filtre.sous === s, action: () => { filtre = { sec: k, sous: s }; cam.cat = k; cam.sub = s; majTitre(); indexFiche = 0; rendreOnglet(); } }))], { haut: true });
  };
  cont.append(h('div', { class: 'rail' }, bSec, bSous));
  if (n) requestAnimationFrame(() => placerFiches(L, true));
  /* balayage */
  let d = null;
  scene.addEventListener('pointerdown', e => { if (retournee || n < 2 || e.target.closest('button, img, .menu-btn')) return; d = { p: pt(e), dx: 0, suit: null }; scene.setPointerCapture(e.pointerId); });
  scene.addEventListener('pointermove', e => {
    if (!d) return; const p = pt(e); d.dx = p[0] - d.p[0]; const dy = p[1] - d.p[1];
    if (d.suit == null && Math.hypot(d.dx, dy) > 12) d.suit = Math.abs(d.dx) > Math.abs(dy);
    if (d.suit) placerFiches(L, false, d.dx);
  });
  scene.addEventListener('pointerup', () => { if (!d) return; const dx = d.dx, suit = d.suit; d = null; if (suit && Math.abs(dx) > 45) tourner(dx < 0 ? 1 : -1); else placerFiches(L, true); });
}
const CARTE_W = 271.4;
function placerFiches(L, anim, drag = 0) {
  const scene = $('#scene'); if (!scene) return;
  const n = L.length, W = CARTE_W, H = Math.min(scene.clientHeight, 548), left = (374 - W) / 2;
  const voulu = new Map();
  voulu.set(L[indexFiche].id, 0);
  if (n >= 2) voulu.set(L[(indexFiche + 1) % n].id, 1);
  if (n >= 3) voulu.set(L[(indexFiche - 1 + n) % n].id, -1);
  $$('.fiche', scene).forEach(el => { if (!voulu.has(el.dataset.id)) { el.style.opacity = 0; el.style.pointerEvents = 'none'; setTimeout(() => el.remove(), 420); el.dataset.id = '_'; } });
  for (const [id, o] of voulu) {
    let el = $(`.fiche[data-id="${id}"]`, scene);
    const c = L.find(x => x.id === id);
    if (!el) { el = ficheDOM(c, L.indexOf(c), n); el.style.transition = 'none'; el.style.left = left + 'px'; el.style.width = W + 'px'; el.style.height = H + 'px'; el.style.transform = transformFiche(o === 0 ? (drag < 0 ? 1 : -1) * 1.6 : o * 1.6, 0); el.style.opacity = 0; scene.append(el); void el.offsetWidth; }
    el.style.transition = anim ? '' : 'none';
    el.style.transformOrigin = o > 0 ? 'left center' : o < 0 ? 'right center' : 'center';
    el.style.transform = transformFiche(o, drag / W);
    el.style.opacity = o === 0 ? 1 : .65; el.style.zIndex = o === 0 ? 3 : 1;
    el.style.pointerEvents = o === 0 ? '' : 'none';
    el.style.left = left + 'px'; el.style.width = W + 'px'; el.style.height = H + 'px';
  }
}
function transformFiche(o, g) { return o === 0 ? `translateX(${g * CARTE_W}px)` : `translateX(${(o * 0.89 + g) * CARTE_W}px) rotateY(${o * -41.6}deg) scale(.827)`; }
function tourner(sens) {
  const L = fichesFiltrees(); if (L.length < 2) return;
  indexFiche = (indexFiche + sens + L.length) % L.length; retournee = false; vibrer(3);
  rendreOnglet();
}
function ficheDOM(c, i, n) {
  const el = h('div', { class: 'fiche', 'data-id': c.id });
  const faces = h('div', { class: 'faces' });
  /* recto */
  const menuBtn = h('button', { class: 'menu-btn', 'aria-label': 'Options du constat' }, ic('cdots2', 17, 4.2));
  menuBtn.onclick = () => menu(menuBtn, [
    { texte: 'Modifier le constat', icone: 'pencil', action: () => ouvrirFeuille({ mode: 'modifier', constatId: c.id, photos: c.photos.slice(), cat: c.cat, sub: c.sub, titre: c.titre, constat: c.constat, reco: c.reco, gravite: c.gravite, confirmee: true, lieu: c.lieu }) },
    { texte: 'Voir la fiche complète', icone: 'tdoc', action: () => retourner(el) }, '-',
    { texte: 'Mettre le constat à la corbeille', icone: 'poubelle', rouge: true, action: () => { c.statut = 'corbeille'; vibrer([20, 40, 20]); majChrome(); rendreOnglet(); } }]);
  const photos = h('div', { class: 'photos' });
  c.photos.slice(0, 2).forEach(p => {
    const img = h('img', { src: p.url, alt: '' });
    let t = null;
    img.addEventListener('pointerdown', () => { t = setTimeout(() => { t = 'long'; menu(img, [{ texte: 'Envoyer dans les Non classées', icone: 'plateau', action: () => { c.photos = c.photos.filter(x => x !== p); dossier.photosNonClassees.push(p); toast('Photo envoyée dans les Non classées'); rendreOnglet(); } }, { texte: 'Mettre la photo à la corbeille', icone: 'poubelle', rouge: true, action: () => { c.photos = c.photos.filter(x => x !== p); toast('Photo à la corbeille — récupérable depuis le Mac'); rendreOnglet(); } }], { droite: false }); }, 500); });
    img.addEventListener('pointerup', () => { if (t && t !== 'long') { clearTimeout(t); ouvrirAnnotation(p, () => ouvrirOnglet('chat', c.id)); } t = null; });
    img.addEventListener('contextmenu', e => e.preventDefault());
    photos.append(img);
  });
  photos.append(h('button', { class: 'ajout', onclick: () => { fermerCalque(); lotOuvrir('constat:' + c.id); } }, ic('plus'), h('span', {}, 'Ajouter', h('br'), 'une photo')));
  const recto = h('div', { class: 'face recto' },
    h('div', { class: 'ent' }, h('b', {}, c.sub), h('span', {}, `${i + 1} / ${n}`)),
    h('div', { class: 'rang-badge' }, badgeDe(c.gravite), menuBtn),
    h('h4', { class: c.titre ? '' : 'vide' }, c.titre || 'Sans titre'),
    h('p', { class: 'txt' + ((c.constat || c.reco) ? '' : ' vide') }, [c.constat, c.reco].filter(Boolean).join(' ') || 'Pas encore rédigé.'),
    photos,
    h('div', { class: 'pied' }, statutDe(c), h('button', { class: 'btn-flip', onclick: () => retourner(el) }, ic('flip'), 'Flip')));
  /* verso : la fiche complète */
  const champV = (lib, cle, vide) => {
    const b = h('button', { class: 'cv' }, h('div', { class: 'h' }, h('b', {}, lib), h('span', { class: 'mod' }, ic('crayonc', 12, 12), 'Modifier')), h('p', { class: c[cle] ? '' : 'vide' }, c[cle] || vide));
    b.onclick = () => {
      const zone = h('textarea', { rows: 3 }); zone.value = c[cle] || '';
      const ed = h('div', { class: 'cv' }, h('div', { class: 'h' }, h('b', {}, lib)), zone, h('div', { class: 'okann' },
        h('button', { class: 'ok', onclick: () => { if (cle === 'titre' && !zone.value.trim()) return; c[cle] = zone.value.trim(); vibrer(6); rendreOnglet(); retournerApres(c.id); } }, 'OK'),
        h('button', { class: 'an', onclick: () => ed.replaceWith(b) }, 'Annuler')));
      b.replaceWith(ed); zone.focus();
    };
    return b;
  };
  const gb = h('button', { class: 'cv' }, h('div', { class: 'h' }, h('b', {}, 'Gravité'), h('span', { class: 'mod' }, ic('crayonc', 12, 12), 'Modifier')),
    h('div', { class: 'grav' }, h('i', { style: `background:${c.gravite ? GRAV[c.gravite][1] : '#BDBEC2'}` }), c.gravite ? GRAV[c.gravite][0] : 'À choisir'));
  gb.onclick = () => menu(gb, Object.entries(GRAV).map(([k, [nm]]) => ({ texte: nm, coche: k === c.gravite, action: () => { c.gravite = k; rendreOnglet(); retournerApres(c.id); } })), { droite: false });
  const wf = h('span', { class: 'wf' }); for (let k = 0; k < 26; k++) wf.append(h('i', { style: `height:${4 + Math.abs(Math.sin(k * 2.1)) * 14}px` }));
  const noteChamp = h('textarea', { rows: 1, placeholder: 'Ajouter une note…', style: 'font:400 14px/1.3 var(--sf);border:0;border-radius:10px;padding:8px 10px;background:#fff;box-shadow:inset 0 0 0 1px var(--filet);resize:none' });
  noteChamp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && noteChamp.value.trim()) { e.preventDefault(); c.notes.push(noteChamp.value.trim()); rendreOnglet(); retournerApres(c.id); } });
  const verso = h('div', { class: 'face verso' },
    h('div', { class: 'ent' }, h('b', {}, c.sub), h('span', {}, `${i + 1} / ${n}`)),
    h('div', { class: 'defil' }, h('h4', {}, 'Fiche complète'),
      champV('Titre', 'titre', 'Pas encore rédigé.'), h('div', { class: 'filet' }), gb, h('div', { class: 'filet' }),
      champV('Description', 'constat', 'Pas encore rédigé.'), h('div', { class: 'filet' }), champV('Recommandation', 'reco', 'Pas encore rédigé.'), h('div', { class: 'filet' }),
      champV('Localisation', 'lieu', 'Lieu à préciser'), h('div', { class: 'filet' }),
      h('div', { class: 'cv' }, h('div', { class: 'h' }, h('b', {}, c.photos.length ? `Photos · ${c.photos.length}` : 'Photos')),
        h('div', { class: 'photos-v' }, ...c.photos.map(p => h('img', { src: p.url, alt: '', onclick: () => ouvrirAnnotation(p, () => ouvrirOnglet('chat', c.id)) })), h('button', { class: 'ajout', onclick: () => { fermerCalque(); lotOuvrir('constat:' + c.id); } }, ic('plus'), h('span', {}, 'Ajouter', h('br'), 'une photo')))),
      h('div', { class: 'interne' }, h('div', { class: 't' }, ic('cadenas', 13, 13), 'Interne · jamais au rapport'),
        h('b', {}, 'Heure initiale'), h('div', { class: 'hr' }, new Date(c.createdAt).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', ' ·')),
        h('b', {}, 'Audio source'), c.dictee ? h('div', { class: 'lect' }, h('span', { class: 'p' }, ic('play', 11, 12)), wf) : h('small', { style: 'font-size:13px;color:var(--gris)' }, 'Aucun audio — constat saisi sans dictée'),
        h('b', {}, 'Notes internes'), ...c.notes.map(x => h('div', { style: 'font-size:14px' }, x)), noteChamp)),
    h('div', { class: 'pied', style: 'padding-top:10px' }, statutDe(c), h('button', { class: 'btn-flip', onclick: () => retourner(el) }, ic('flip'), 'Recto')));
  faces.append(recto, verso); el.append(faces);
  return el;
}
/* Flip : rotation 0,45 s, puis la fiche s'élargit à 0,94 × la scène (0,26 s) */
function retourner(el) {
  const scene = $('#scene'); if (!scene) return;
  retournee = !el.classList.contains('retournee');
  const W = 0.94 * 348, H = scene.clientHeight;
  $$('.fiche', scene).forEach(x => { if (x !== el) x.style.opacity = retournee ? 0 : .65; });
  $('#pager').style.opacity = retournee ? 0 : 1;
  if (retournee) { el.classList.add('retournee'); setTimeout(() => { el.style.left = (374 - W) / 2 + 'px'; el.style.width = W + 'px'; el.style.height = H + 'px'; }, 450); }
  else { el.style.left = (374 - CARTE_W) / 2 + 'px'; el.style.width = CARTE_W + 'px'; el.style.height = Math.min(H, 548) + 'px'; setTimeout(() => el.classList.remove('retournee'), 260); }
}
function retournerApres(id) { requestAnimationFrame(() => { const el = $(`.fiche[data-id="${id}"]`); if (el) { el.style.transition = 'none'; el.querySelector('.faces').style.transition = 'none'; retourner(el); requestAnimationFrame(() => { el.style.transition = ''; el.querySelector('.faces').style.transition = ''; }); } }); }
function bilanSection() {
  const L = fichesFiltrees(), k = filtre.sec || L[indexFiche]?.cat || cam.cat, cat = CATS.find(c => c[0] === k);
  const lignes = cat[2].map(s => {
    const cs = dossier.constats.filter(c => c.cat === k && c.sub === s && c.statut !== 'corbeille');
    const pr = cs.filter(c => c.statut === 'rapport').length, rd = cs.filter(c => c.statut === 'rediger').length, av = cs.filter(c => c.statut === 'valider').length;
    return h('div', { class: 'r' }, h('div', { class: 'd' }, h('span', { style: 'font-size:13px' }, s)),
      cs.length ? h('small', {}, [pr && `${pr} prêts`, av && `${av} à compléter`, rd && `${rd} à rédiger`].filter(Boolean).join(' · ')) : h('small', { style: 'font-size:11px' }, 'jamais ouverte'));
  });
  const i = CATS.indexOf(cat), suiv = CATS[(i + 1) % CATS.length];
  feuilleSys(`Bilan · ${cat[1]}`, h('div', { style: 'display:flex;flex-direction:column;gap:14px' }, h('div', { class: 'groupe' }, ...lignes),
    h('div', { style: 'display:flex;gap:8px' },
      h('button', { style: 'flex:1;padding:12px;border-radius:12px;box-shadow:inset 0 0 0 1px #C6C6C8;font-size:13.5px;font-weight:600', onclick: fermerFeuilleSys }, 'Continuer'),
      h('button', { style: 'flex:1.6;padding:12px;border-radius:12px;background:var(--ink);color:#fff;font-size:13.5px;font-weight:600', onclick: () => { fermerFeuilleSys(); cam.cat = suiv[0]; cam.sub = suiv[2][0]; majTitre(); toast(`${cat[1]} validée`); } }, `Valider · passer à ${suiv[1]}`))));
}

/* ---------- Aperçu (AIBQRefonteApercuView) ---------- */
function sousTitreSection(cs) {
  if (!cs.length) return 'À inspecter';
  const av = cs.filter(c => c.statut === 'valider').length, rd = cs.filter(c => c.statut === 'rediger').length, n = cs.length;
  const t = n === 1 ? '1 constat' : `${n} constats`;
  if (av) return `${t} · ${av} à valider`; if (rd) return `${t} · ${rd} à rédiger`;
  return n === 1 ? `${t} · prêt` : `${t} · prêts`;
}
function rendreApercu(cont) {
  cont.append(enteteOnglet('Aperçu'));
  const d = h('div', { class: 'defil-ong' }); cont.append(d);
  const actifs = dossier.constats.filter(c => c.statut !== 'corbeille');
  const parCat = CATS.map(c => ({ c, cs: actifs.filter(x => x.cat === c[0]) }));
  const nAv = actifs.filter(c => c.statut === 'valider').length, faites = parCat.filter(x => x.cs.length).length, aInsp = CATS.length - faites;
  const micro = new Micro({ surTexte: t => { apercu.q = t; const i = $('.rech-ap input'); if (i) i.value = t; majResultats(); } });
  const champ = h('input', { placeholder: 'Rechercher un constat…', value: apercu.q, oninput: e => { apercu.q = e.target.value; majResultats(); } });
  d.append(h('div', { class: 'rech-ap' }, ic('loupe', 17, 17), champ, h('button', { class: 'kb', 'aria-label': 'Écrire la recherche', onclick: () => champ.focus() }, ic('clavier', 19, 19)),
    h('button', { class: 'micro', 'aria-label': 'Rechercher à la voix', onclick: e => { if (micro.actif) { micro.arreter(); poserIcone(e.currentTarget.firstChild, 'micro', 18, 18); } else if (micro.demarrer() && !micro.ko) poserIcone(e.currentTarget.firstChild, 'stopf', 16, 16); else champ.focus(); } }, ic('micro', 18, 18))));
  const zone = h('div', { style: 'display:flex;flex-direction:column;gap:14px' }); d.append(zone);
  function majResultats() {
    zone.textContent = '';
    if (apercu.q.trim()) {
      const ws = mots(apercu.q), R = actifs.filter(c => ws.every(w => mots(c.titre).some(x => x.startsWith(w))));
      zone.append(h('small', { style: 'font-size:13px;color:var(--gris)' }, !R.length ? 'Aucun constat ne correspond.' : R.length === 1 ? '1 constat' : `${R.length} constats`));
      zone.append(h('div', { class: 'volet', style: 'margin:0' }, ...R.map(c => h('button', { onclick: () => ouvrirConstatModif(c) }, h('span', {}, c.titre, h('small', { style: 'display:block;font-size:13px;color:var(--gris);font-weight:400' }, catLabel(c.cat))), c.statut === 'valider' ? h('span', { class: 'pastille-av', style: 'margin:0' }, 'À valider') : null, ic('chevr2', 7, 12)))));
      return;
    }
    const f = apercu.filtre;
    zone.append(h('div', { class: 'filtres' },
      h('button', { class: f === 'tous' ? 'on' : '', onclick: () => { apercu.filtre = 'tous'; majResultats(); } }, 'Tous'),
      h('button', { class: (nAv ? 'or' : '') + (f === 'valider' ? ' on' : ''), onclick: () => { apercu.filtre = f === 'valider' ? 'tous' : 'valider'; majResultats(); } }, `À valider · ${nAv}`),
      h('button', { class: f === 'inspecter' ? 'on' : '', onclick: () => { apercu.filtre = f === 'inspecter' ? 'tous' : 'inspecter'; majResultats(); } }, `À inspecter · ${aInsp}`)));
    zone.append(h('div', { class: 'prog' }, h('div', { class: 'l' }, h('div', { class: 'n' }, String(faites), h('span', {}, '/'), String(CATS.length)),
      h('div', { class: 'd' }, h('b', {}, 'sections inspectées'), h('small', {}, aInsp === 0 ? 'Toutes les sections sont inspectées' : aInsp === 1 ? '1 section à inspecter' : `${aInsp} sections à inspecter`))),
      h('div', { class: 'barre8' }, h('i', { style: `width:${faites / CATS.length * 100}%` }))));
    let liste = parCat.map((x, k) => ({ ...x, rang: k + 1 }));
    if (f === 'valider') liste = liste.filter(x => x.cs.some(c => c.statut === 'valider'));
    if (f === 'inspecter') liste = liste.filter(x => !x.cs.length);
    if (!liste.length) { zone.append(h('div', { style: 'font-size:15px;color:var(--gris);text-align:center;padding:24px 0' }, f === 'valider' ? 'Aucun constat à valider.' : 'Toutes les sections sont inspectées.')); return; }
    const montre = f === 'tous' && !apercu.tout ? liste.slice(0, 9) : liste;
    const tl = h('div', { class: 'tl' });
    montre.forEach(({ c, cs, rang }) => {
      const insp = cs.length > 0, av = cs.filter(x => x.statut === 'valider');
      const it = h('button', { class: 'it', onclick: () => { if (insp) { apercu.ouvert = apercu.ouvert === c[0] ? null : c[0]; majResultats(); } else { cam.cat = c[0]; cam.sub = c[2][0]; majTitre(); fermerCalque(); } } },
        h('span', { class: 'pt' + (insp ? ' fait' : '') }, insp ? ic('check', 13, 13) : String(rang)),
        h('span', { class: 'c' }, h('b', { class: insp ? 'ink' : '' }, c[1]), h('small', {}, sousTitreSection(cs)), av.length ? h('span', { class: 'pastille-av' }, 'À valider') : null,
          apercu.ouvert === c[0] ? h('div', { class: 'volet', onclick: e => e.stopPropagation() },
            ...av.map(x => h('button', { onclick: () => ouvrirConstatModif(x) }, h('span', {}, x.titre || 'Constat sans titre'), h('span', { class: 'pastille-av', style: 'margin:0' }, 'À valider'), ic('chevr2', 7, 12))),
            h('button', { class: 'voir', onclick: () => { cam.cat = c[0]; majTitre(); ouvrirOnglet('chat'); } }, h('span', {}, cs.length === 1 ? 'Voir le constat' : `Voir les ${cs.length} constats`), ic('chevr2', 7, 12))) : null),
        h('span', { class: 'fin' }, insp ? ic(apercu.ouvert === c[0] ? 'chevdn' : 'chevr2', apercu.ouvert === c[0] ? 13 : 8, apercu.ouvert === c[0] ? 8 : 13) : ic('plus', 15, 15)));
      tl.append(it);
    });
    zone.append(tl);
    if (f === 'tous' && liste.length > 9 && !apercu.tout) zone.append(h('button', { class: 'lien-gris', style: 'height:34px;border-radius:17px;box-shadow:inset 0 0 0 1px var(--filet)', onclick: () => { apercu.tout = true; majResultats(); } }, `${liste.length - 9} autres sections (${liste.length} au total)`, ic('chevdn', 12, 8)));
  }
  majResultats();
}
function ouvrirConstatModif(c) { ouvrirFeuille({ mode: 'modifier', constatId: c.id, photos: c.photos.slice(), cat: c.cat, sub: c.sub, titre: c.titre, constat: c.constat, reco: c.reco, gravite: c.gravite, confirmee: true, lieu: c.lieu }); }

/* ---------- Compte rendu (AIBQRefonteCompteRenduView + AIBQApercuView segments) ---------- */
function rendreCompteRendu(cont) {
  cont.append(enteteOnglet('Compte rendu'));
  const actifs = dossier.constats.filter(c => c.statut !== 'corbeille');
  const pr = actifs.filter(c => c.statut === 'rapport').length, ac = actifs.filter(c => c.statut === 'valider').length, ar = actifs.filter(c => c.statut === 'rediger').length;
  const d = h('div', { class: 'defil-ong', style: 'gap:10px' }); cont.append(d);
  if (crSegment !== 'dossier') d.append(h('div', { style: 'display:flex;gap:6px' }, ...[[pr, 'prêt', '#5B8443', '#E9F2E1'], [ac, 'à compléter', '#9A6B00', '#FFE566'], [ar, 'à rédiger', '#3F72AA', '#E4EEFA']].map(([n, t, c, f]) => h('span', { style: `font-size:10px;font-weight:600;padding:4px 9px;border-radius:99px;color:${c};background:${f}` }, `${n} ${t}${n > 1 && t === 'prêt' ? 's' : ''}`))));
  const segs = [['dossier', 'Dossier', 'liste'], ['composantes', 'Composantes', 'immeuble'], ['constats', 'Constats', 'coches'], ['audio', 'Audio', 'onde'], ['annexes', 'Annexes', 'trombone']];
  d.append(h('div', { class: 'segments' }, ...segs.map(([k, t, i]) => h('button', { class: crSegment === k ? 'on' : '', onclick: () => { crSegment = k; rendreOnglet(); } }, ic(i, 15, 15), t))));
  const corps = h('div', { style: 'display:flex;flex-direction:column;gap:14px;padding:0 2px' }); d.append(corps);
  if (crSegment === 'dossier') {
    const etapes = [
      ['Vérifier les constats', ac ? (ac === 1 ? '1 constat à valider' : `${ac} constats à valider`) : 'Tous les constats sont validés', actifs.length > 0 && !ac && !ar],
      ['Compléter les composantes', '5 fiches · 20 champs à compléter', false],
      ['Vérifier les pièces jointes', 'Déclaration du vendeur absente', false],
      ['Prévisualiser le rapport', 'Le bureau exporte le PDF au Mac ; il arrive par iCloud', false],
      ['Clôturer le dossier', 'Envoyer le dossier au bureau', false]];
    const cour = etapes.findIndex(e => !e[2]) + 1;
    if (ac) corps.append(h('button', { class: 'rappel', onclick: reviser }, ic('excl', 15, 15), ac === 1 ? '1 constat à valider' : `${ac} constats à valider`));
    corps.append(h('div', { class: 'carte-cr' }, h('h4', {}, 'Préparer la clôture'), h('small', {}, `Étape ${cour} sur 5 · 20 champs à compléter`),
      h('div', { class: 'bl' }, h('div', { class: 'barre8' }, h('i', { style: `width:${(cour - 1) / 5 * 100}%` }), h('b', { style: `left:${(cour - 1) / 5 * 100}%` })), h('span', {}, `${(cour - 1) * 20} %`))));
    const tl = h('div', { class: 'tl' });
    etapes.forEach(([t, s, fait], k) => {
      const n = k + 1, ouv = crOuvertes.has(n);
      const extra = [];
      if (ouv && n === 2) extra.push(h('div', { class: 'volet' }, ...['Entrée d’eau', 'Évacuation', 'Panneau électrique', 'Chauffe-eau', 'Thermopompe'].map(x => h('button', { onclick: e => { e.stopPropagation(); toast(`Pas de fiche pour « ${x} »`); } }, h('span', {}, x, h('small', { style: 'display:block;font-size:12.5px;color:var(--gris);font-weight:400' }, 'Mécanique')), h('b', { style: 'font-size:14px' }, '0 / 4'), ic('chevr2', 7, 12)))));
      if (ouv && n === 3) extra.push(h('button', { class: 'btn-sec', onclick: e => { e.stopPropagation(); feuilleSys('Déclaration du vendeur', h('p', { class: 'vide' }, 'Dépose la déclaration du vendeur (ici ou au Mac) : ses points à valider apparaîtront ici.')); } }, 'Ouvrir la déclaration du vendeur'));
      if (ouv && n === 4) extra.push(h('button', { class: 'btn-sec', style: 'opacity:.45', onclick: e => { e.stopPropagation(); toast('Aucun PDF encore : le bureau l’exporte au Mac (Rapport → Exporter)'); } }, 'Visualiser le PDF'));
      if (ouv && n === 5) extra.push(h('button', { class: 'btn-sec', onclick: e => { e.stopPropagation(); cloturer(); } }, 'Clôturer le dossier'));
      tl.append(h('div', { class: 'it', onclick: () => { ouv ? crOuvertes.delete(n) : crOuvertes.add(n); rendreOnglet(); } },
        h('span', { class: 'pt' + (fait ? ' fait' : n === cour ? ' cour' : '') }, fait ? ic('check', 12, 12) : String(n)),
        h('span', { class: 'c' }, h('b', { class: 'ink' }, t), ouv || n === 1 ? h('small', {}, s) : null, ...extra),
        n === 1 && ac ? h('button', { class: 'btn-rev', onclick: e => { e.stopPropagation(); reviser(); } }, 'Réviser') : h('span', { class: 'fin' }, ic(ouv ? 'chevu' : 'chevdn', 13, 8))));
    });
    corps.append(tl);
    const libs = ['Réviser les constats', 'Continuer les composantes', 'Vérifier les pièces jointes', 'Prévisualiser le rapport', 'Clôturer le dossier'];
    corps.append(h('button', { class: 'btn-noir', onclick: () => { if (cour === 1) reviser(); else if (cour === 5) cloturer(); else { crOuvertes.add(cour); rendreOnglet(); } } }, libs[cour - 1], ic('fdroite', 17, 17)));
    corps.append(h('button', { class: 'lien-gris', onclick: () => toast('Toutes les tâches de clôture : relecture par sous-catégorie') }, 'Toutes les tâches de clôture', ic('chevdn', 12, 8)));
  } else if (crSegment === 'constats') {
    corps.append(h('div', { style: 'display:flex;gap:8px' }, ...[[pr, 'prêts à utiliser', '#5B8443', '#E9F2E1'], [ac, 'à compléter sur place', '#9A6B00', '#FFF6C2'], [ar, 'à rédiger au bureau', '#3F72AA', '#E4EEFA']].map(([n, t, c, f]) => h('div', { style: `flex:1;padding:10px;border-radius:12px;background:${f};color:${c}` }, h('div', { style: 'font-size:21px;font-weight:600' }, String(n)), h('div', { style: 'font-size:10px' }, t)))));
    if (!actifs.length) corps.append(h('p', { style: 'color:var(--gris);font-size:14px;text-align:center' }, 'Rien n’a encore été relevé dans ce dossier.'));
    CATS.forEach(([k, l]) => {
      const cs = actifs.filter(c => c.cat === k); if (!cs.length) return;
      corps.append(h('div', { style: 'font-size:9.5px;font-weight:700;letter-spacing:1px;color:var(--gris)' }, l.toUpperCase()));
      cs.forEach((c, j) => corps.append(h('div', { style: `background:#fff;border-radius:10px;box-shadow:inset 3px 0 0 ${c.gravite ? GRAV[c.gravite][1] : '#BDBEC2'}, inset 0 0 0 1px var(--filet);padding:10px 12px 10px 14px;display:flex;flex-direction:column;gap:4px` },
        h('small', { style: 'font-size:10px;color:var(--gris)' }, `${ordreCat(k) + 1}.${j + 1} · ${c.sub}`), h('b', { style: 'font-size:14px' }, c.titre || 'Sans titre'), h('span', { style: 'font-size:12px;color:var(--gris)' }, c.constat), c.reco ? h('span', { style: 'font-size:12px' }, '→ ' + c.reco) : null,
        c.photos.length ? h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:4px' }, ...c.photos.slice(0, 2).map(p => h('img', { src: p.url, style: 'width:100%;height:96px;object-fit:cover;border-radius:6px' }))) : null,
        h('small', { style: `font-size:11px;color:${c.lieu ? 'var(--gris)' : '#DC2626'}` }, c.lieu || 'sans localisation'))));
    });
  } else if (crSegment === 'audio') {
    const A = actifs.filter(c => c.dictee);
    corps.append(h('div', { style: 'font-size:9px;font-weight:700;letter-spacing:1.1px;color:var(--gris)' }, 'AUDIOS CONSERVÉS'));
    if (!A.length) corps.append(h('p', { style: 'color:var(--gris);font-size:14px;text-align:center' }, 'Aucun audio conservé.'));
    A.forEach(c => corps.append(h('div', { style: 'display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;box-shadow:inset 0 0 0 1px var(--filet)' }, h('span', { style: 'width:30px;height:30px;border-radius:50%;background:var(--orange);color:#fff;display:grid;place-items:center' }, ic('play', 10, 11)), h('span', { style: 'flex:1;font-size:11.5px' }, c.titre || c.dictee), h('small', { style: 'font-size:11px;color:var(--gris)' }, fmt2(c.duree || 0)))));
  } else if (crSegment === 'composantes') {
    corps.append(h('div', { style: 'display:flex;justify-content:space-between;font-size:9px;font-weight:700;letter-spacing:1.1px;color:var(--gris)' }, h('span', {}, 'FICHES DU BÂTIMENT'), h('span', {}, '0 / 5')));
    corps.append(h('div', { class: 'volet', style: 'margin:0' }, ...['Entrée d’eau', 'Évacuation', 'Panneau électrique', 'Chauffe-eau', 'Thermopompe'].map(x => h('button', {}, h('span', { style: 'font-size:12px' }, x), h('small', { style: 'font-size:10px;color:var(--gris)' }, '0/4')))));
  } else {
    corps.append(h('div', { style: 'padding:14px;border-radius:12px;box-shadow:inset 0 0 0 1px var(--filet);display:flex;align-items:center;gap:10px' }, ic('tdoc', 18, 22), h('div', { style: 'flex:1' }, h('b', { style: 'display:block;font-size:14px' }, 'Déclaration du vendeur'), h('small', { style: 'font-size:12px;color:var(--gris)' }, 'aucun document déposé')), h('button', { style: 'font-size:14px;font-weight:600;color:var(--orange)' }, 'Déposer')));
    corps.append(h('p', { style: 'color:var(--gris);font-size:13.5px' }, 'Dépose la déclaration du vendeur (ici ou au Mac) : ses points à valider apparaîtront ici.'));
  }
}
function reviser() { apercu.filtre = 'valider'; ouvrirOnglet('apercu'); }
function cloturer() { const d = new Date(); toast(`Inspection clôturée à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} — le bureau prend le relais`); }

/* ---------- accueil « Aujourd'hui » (BFHomeScreen, vue .aujourdhui) ---------- */
$('#btn-accueil').addEventListener('click', ouvrirAccueil);
function ouvrirAccueil() {
  fermerCalque(); fermerTiroir();
  $('#accueil')?.remove();
  const j = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  const n = dossier.constats.filter(c => c.statut !== 'corbeille').length, p = photosDuDossier();
  const a = h('div', { id: 'accueil', style: 'position:absolute;inset:0;z-index:110;background:#F5F5F4;color:#0A0A0C;color-scheme:light;overflow-y:auto;font-family:var(--inter);animation:fondu .28s' },
    h('div', { style: 'position:absolute;left:0;right:0;top:0;height:300px;background:linear-gradient(rgba(255,255,255,.6),rgba(255,255,255,0));pointer-events:none' }),
    h('div', { style: 'position:relative;padding:76px 20px 140px;display:flex;flex-direction:column;gap:24px' },
      h('div', { style: 'display:flex;align-items:flex-start;justify-content:space-between' },
        h('div', {}, h('div', { style: 'font:600 36px var(--inter);letter-spacing:-.8px' }, 'Aujourd’hui'), h('div', { style: 'font:500 10px var(--mono);letter-spacing:.6px;color:rgba(10,10,12,.55);margin-top:4px' }, `${j} · 1 VISITE`)),
        h('span', { style: 'width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);display:grid;place-items:center' }, ic('menu', 16, 9))),
      h('div', { style: 'border-radius:28px;padding:20px;background:linear-gradient(#3A3A40,#1A1A1D);color:#fff;box-shadow:0 12px 24px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:10px' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;font:500 10px var(--mono);letter-spacing:.6px' }, h('span', { style: 'display:flex;align-items:center;gap:6px;padding:4px 9px;border-radius:99px;background:rgba(255,255,255,.12)' }, h('i', { style: 'width:6px;height:6px;border-radius:50%;background:#10B981' }), 'PROCHAINE'), 'EN COURS'),
        h('div', { style: 'font:500 10px var(--mono);color:rgba(255,255,255,.6);letter-spacing:.6px' }, 'PRÉACHAT · COTTAGE'),
        h('div', { style: 'font:700 26px/1.15 var(--inter)' }, dossier.adresse), h('div', { style: 'font:400 13px var(--inter);color:rgba(255,255,255,.7)' }, dossier.ville),
        h('button', { style: 'margin-top:6px;height:52px;border-radius:26px;background:#fff;color:#0A0A0C;font:600 15px var(--inter)', onclick: () => $('#accueil').remove() }, 'Démarrer l’inspection')),
      h('div', { style: 'display:flex;align-items:baseline;gap:8px' }, h('span', { style: 'font:500 26px var(--inter)' }, 'À faire'), h('span', { style: 'font:500 14px var(--inter);color:rgba(10,10,12,.55)' }, '1')),
      h('div', { style: 'border-radius:18px;padding:14px 16px;background:rgba(255,255,255,.7);display:flex;align-items:center;gap:12px' },
        h('div', { style: 'flex:1' }, h('div', { style: 'display:flex;align-items:center;gap:6px;font:500 10px var(--mono);color:rgba(10,10,12,.55)' }, h('i', { style: 'width:6px;height:6px;border-radius:50%;background:#E63946' }), 'RAPPORT · DÛ DEMAIN'), h('div', { style: 'font:600 15px var(--inter);margin-top:3px' }, dossier.adresse)),
        h('button', { style: 'height:34px;padding:0 14px;border-radius:17px;background:#0A0A0C;color:#fff;font:600 13px var(--inter)', onclick: () => { $('#accueil').remove(); ouvrirOnglet('compteRendu'); } }, 'Rédiger')),
      h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between' }, h('span', { style: 'font:500 26px var(--inter)' }, 'Reprendre'), h('span', { style: 'font:500 14px var(--inter);color:rgba(10,10,12,.55)' }, 'Dossiers ›')),
      h('button', { style: 'border-radius:18px;padding:14px 16px;background:rgba(255,255,255,.7);display:flex;align-items:center;gap:12px;text-align:left', onclick: () => $('#accueil').remove() },
        h('div', { style: 'flex:1' }, h('div', { style: 'font:500 11px var(--mono);color:rgba(10,10,12,.55)' }, '● PRÉACHAT · COTTAGE'), h('div', { style: 'font:700 16px var(--inter);margin-top:2px' }, dossier.adresse), h('div', { style: 'font:400 13px var(--inter);color:rgba(10,10,12,.55)' }, `aujourd’hui · ${p === 1 ? '1 photo' : p + ' photos'} · ${n === 1 ? '1 constat' : n + ' constats'}`)), ic('chevr2', 8, 13))),
    h('div', { style: 'position:absolute;left:20px;right:20px;bottom:30px;display:flex;align-items:center;gap:10px' },
      h('div', { style: 'flex:1;display:flex;padding:6px;border-radius:99px;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.08)' },
        ...[['Aujourd’hui', 'soleil', true], ['Dossiers', 'galerie'], ['Leads', 'presse']].map(([t, i, on]) => h('span', { style: `flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 0;border-radius:99px;font:500 10.5px var(--inter);${on ? 'background:#EDEDEC' : ''}` }, ic(i, 18, 18), t))),
      h('span', { style: 'width:66px;height:66px;border-radius:50%;background:#0A0A0C;color:#fff;display:grid;place-items:center' }, ic('plus26', 24, 24))));
  ecran.append(a);
}

/* ---------- Annoter la photo (BFPhotoAnnotationView + BFFormeAjustee) ---------- */
const PALETTE = ['#FF453A', '#FF9F0A', '#FFD60A', '#32D74B', '#0A84FF', '#FFFFFF', '#0A0A0C'];
let A = null;
function ouvrirAnnotation(photo, surFin) {
  $('#an')?.remove();
  const el = h('div', { id: 'an' });
  el.innerHTML = `<div id="an-zone"><div id="an-zoom"><canvas id="cv"></canvas></div></div>
    <button class="rn" style="left:16px" id="an-retour" aria-label="Retour"></button><div id="an-titre">Annoter la photo</div>
    <button class="rn" style="left:346px" id="an-annuler" aria-label="Annuler le dernier tracé"></button>
    <button class="champ" style="top:603.3px" data-champ="legende"><span class="mic"><i class="carre"></i></span><span class="b"><span class="l"><b>Annotation</b><span></span></span><span class="v"></span></span></button>
    <button class="champ" style="top:669.3px" data-champ="note"><span class="mic"><i class="carre"></i></span><span class="b"><span class="l"><b>Note inspecteur</b><span></span></span><span class="v"></span></span></button>
    <div id="outils"><button class="outil on" data-t="fleche" style="left:10.3px"><span>Flèche</span></button><button class="outil" data-t="cercle" style="left:63.6px"><span>Cercle</span></button>
    <button class="outil" data-t="rect" style="left:116.9px"><span>Rectangle</span></button><button class="outil" data-t="trait" style="left:170.2px"><span>Trait</span></button>
    <button class="outil" data-t="texte" style="left:223.5px"><span>Texte</span></button><button id="couleur" aria-label="Couleur"></button><button id="btn-ok">OK</button></div>`;
  ecran.append(el);
  $('#an-retour').append(ic('anback')); $('#an-annuler').append(ic('anundo'));
  $$('#an .champ .mic').forEach(m => m.prepend(ic('mic')));
  [['fleche', 'tarrow'], ['cercle', 'tcircle'], ['rect', 'trect'], ['trait', 'tpencil'], ['texte', 'taa']].forEach(([t, i]) => { const b = $(`#outils [data-t="${t}"]`), x = ic(i); x.style.top = (766.6 - 750.7 - ICONES[i].h / 2) + 'px'; b.prepend(x); });
  const cv = $('#cv'), ctx = cv.getContext('2d'), zone = $('#an-zone'), zoomEl = $('#an-zoom');
  const W0 = photo.c.width, H0 = photo.c.height, s = Math.min(402 / W0, 778 / H0);
  A = { photo, surFin, outil: 'fleche', couleur: PALETTE[0], traits: [], courant: null, trace: [], sel: null, rect: { w: W0 * s, h: H0 * s, x: (402 - W0 * s) / 2, y: (778 - H0 * s) / 2 }, z: { k: 1, x: 0, y: 0 }, doigts: new Map(), champ: null, micro: null };
  const R = A.rect, dpr = Math.min(3, (devicePixelRatio || 1) * echelleCourante());
  cv.width = Math.round(R.w * dpr); cv.height = Math.round(R.h * dpr); cv.style.width = R.w + 'px'; cv.style.height = R.h + 'px';
  const zoomer = () => { zoomEl.style.transform = `translate(${R.x + A.z.x}px, ${R.y + A.z.y}px) scale(${A.z.k})`; };
  const lw = () => Math.max(3, R.w * 0.012);
  const boite = t => { if (t.tool === 'texte') return { x: t.p[0][0] - .07, y: t.p[0][1] - .035, w: .14, h: .07 }; const xs = t.p.map(q => q[0]), ys = t.p.map(q => q[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
  function tracer(c, t, W, H, ep, tete, police) {
    c.save(); c.strokeStyle = c.fillStyle = t.c; c.lineWidth = ep;
    const P = n => [n[0] * W, n[1] * H];
    if (t.tool === 'trait') { if (t.p.length > 1) { c.lineCap = c.lineJoin = 'round'; c.beginPath(); t.p.forEach((n, i) => { const [x, y] = P(n); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); } }
    else if (t.tool === 'cercle' || t.tool === 'rect') {
      const [ax, ay] = P(t.p[0]), [bx, by] = P(t.p[1]), x = Math.min(ax, bx), y = Math.min(ay, by), w = Math.abs(ax - bx), hh = Math.abs(ay - by);
      c.beginPath();
      if (t.tool === 'cercle') c.ellipse(x + w / 2, y + hh / 2, Math.max(w / 2, .5), Math.max(hh / 2, .5), 0, 0, Math.PI * 2);
      else { c.lineJoin = 'round'; const r = Math.min(3 * ep / lw(), w / 2, hh / 2); c.roundRect ? c.roundRect(x, y, w, hh, r) : c.rect(x, y, w, hh); }
      c.stroke();
    } else if (t.tool === 'fleche') {
      const [tx, ty] = P(t.p[0]), [px, py] = P(t.p[1]); c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(px, py); c.stroke();
      const a = Math.atan2(py - ty, px - tx); c.beginPath(); c.moveTo(px, py);
      c.lineTo(px - tete * Math.cos(a - Math.PI / 7), py - tete * Math.sin(a - Math.PI / 7)); c.lineTo(px - tete * Math.cos(a + Math.PI / 7), py - tete * Math.sin(a + Math.PI / 7)); c.closePath(); c.fill();
    } else if (t.tool === 'texte') {
      const [x, y] = P(t.p[0]); c.font = `800 ${police}px ${getComputedStyle(document.body).fontFamily}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 2 * police / 20; c.fillText(t.texte, x, y);
    }
    c.restore();
  }
  function dessiner() {
    const k = cv.width / R.w; ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, R.w, R.h); ctx.drawImage(photo.c, 0, 0, R.w, R.h);
    const tete = Math.max(14, R.w * .05);
    for (const t of A.traits) tracer(ctx, t, R.w, R.h, lw(), tete, 20);
    if (A.courant) tracer(ctx, A.courant, R.w, R.h, lw(), tete, 20);
    if (A.sel != null && A.traits[A.sel]) {
      const b = boite(A.traits[A.sel]), x = (b.x - .02) * R.w, y = (b.y - .02) * R.h, w = (b.w + .04) * R.w, hh = (b.h + .04) * R.h;
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, hh, 8) : ctx.rect(x, y, w, hh); ctx.stroke(); ctx.restore();
      if (!['trait', 'texte'].includes(A.traits[A.sel].tool)) for (const q of A.traits[A.sel].p.slice(0, 2)) { ctx.beginPath(); ctx.arc(q[0] * R.w, q[1] * R.h, 9, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
  }
  const borne = v => Math.min(Math.max(v, 0), 1);
  function reconnaitre(tr, a) {
    const p = tr.map(q => [q[0] * a, q[1]]); if (p.length < 3) return 'fleche';
    const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = x1 - x0, hh = y1 - y0, dg = Math.hypot(w, hh);
    if (!(dg > 0) || Math.min(w, hh) / Math.max(w, hh) < 0.2) return 'fleche';
    let ch = 0; for (let i = 1; i < p.length; i++) ch += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]) / Math.max(ch, 1e-4) > 0.35) return 'fleche';
    const e = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([cx, cy]) => Math.min(...p.map(([x, y]) => Math.hypot(x - cx, y - cy)))).reduce((s2, v) => s2 + v, 0) / 4;
    return e / dg <= 0.09 ? 'rect' : 'cercle';
  }
  function ajuster(f, tr, a) {
    if (f === 'fleche') return [tr[0], tr[tr.length - 1]];
    const xs = tr.map(q => q[0]), ys = tr.map(q => q[1]), b = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    if (f === 'rect') return [[b.x, b.y], [b.x + b.w, b.y + b.h]];
    const L = b.w * a, H = b.h, pe = Math.min(L, H), gr = Math.max(L, H);
    if (!(pe > 0) || gr / pe > 1.6) return [[b.x, b.y], [b.x + b.w, b.y + b.h]];
    const dm = (L + H) / 2, dx = dm / 2 / a, dy = dm / 2, cx = xs.reduce((s2, v) => s2 + v, 0) / tr.length, cy = ys.reduce((s2, v) => s2 + v, 0) / tr.length;
    return [[borne(cx - dx), borne(cy - dy)], [borne(cx + dx), borne(cy + dy)]];
  }
  const norm = e => { const r = cv.getBoundingClientRect(); return [borne((e.clientX - r.left) / r.width), borne((e.clientY - r.top) / r.height)]; };
  const enZone = e => { const r = zone.getBoundingClientRect(), k = r.width / 402; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };
  let pince = null, poignee = null, deplace = null, pointA = null;
  zone.addEventListener('pointerdown', e => {
    zone.setPointerCapture(e.pointerId); A.doigts.set(e.pointerId, enZone(e));
    if (A.doigts.size === 2) { A.courant = null; A.trace = []; poignee = deplace = null; dessiner(); const [a, b] = [...A.doigts.values()], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; pince = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: A.z.k, lx: (m[0] - R.x - A.z.x) / A.z.k, ly: (m[1] - R.y - A.z.y) / A.z.k }; return; }
    if (A.doigts.size > 2) return;
    const n = norm(e), r = cv.getBoundingClientRect(), k = echelleCourante(); pointA = n;
    if (A.sel != null && A.traits[A.sel]) {
      const t = A.traits[A.sel];
      if (!['trait', 'texte'].includes(t.tool)) { const j = t.p.slice(0, 2).findIndex(q => Math.hypot((q[0] - n[0]) * r.width, (q[1] - n[1]) * r.height) / k <= 28); if (j >= 0) { poignee = j; return; } }
      const b = boite(t); if (n[0] >= b.x - .02 && n[0] <= b.x + b.w + .02 && n[1] >= b.y - .02 && n[1] <= b.y + b.h + .02) { deplace = { o: n, p: t.p.map(q => q.slice()) }; return; }
    }
    A.sel = null; if (A.outil === 'texte') { dessiner(); return; }
    A.trace = [n]; A.courant = { tool: 'trait', c: A.couleur, p: [n] }; dessiner();
  });
  zone.addEventListener('pointermove', e => {
    if (!A.doigts.has(e.pointerId)) return; A.doigts.set(e.pointerId, enZone(e));
    if (pince && A.doigts.size === 2) { const [a, b] = [...A.doigts.values()], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; A.z.k = Math.max(1, Math.min(4, pince.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pince.d)); A.z.x = m[0] - R.x - pince.lx * A.z.k; A.z.y = m[1] - R.y - pince.ly * A.z.k; zoomer(); return; }
    const n = norm(e);
    if (poignee != null) { A.traits[A.sel].p[poignee] = n; dessiner(); return; }
    if (deplace) { const dx = n[0] - deplace.o[0], dy = n[1] - deplace.o[1]; A.traits[A.sel].p = deplace.p.map(q => [q[0] + dx, q[1] + dy]); dessiner(); return; }
    if (!A.courant) return; A.trace.push(n); A.courant.p.push(n); dessiner();
  });
  const fin = e => {
    if (!A.doigts.has(e.pointerId)) return; A.doigts.delete(e.pointerId);
    if (pince) { if (!A.doigts.size) { pince = null; if (A.z.k < 1.02) { A.z = { k: 1, x: 0, y: 0 }; zoomer(); } } return; }
    if (poignee != null || deplace) { poignee = deplace = null; return; }
    if (A.outil === 'texte') { if (pointA) etiquette(pointA); return; }
    if (!A.courant) return;
    let c = A.courant;
    if (A.outil !== 'trait') { const a = R.w / Math.max(R.h, 1), f = reconnaitre(A.trace, a); c = { tool: f, c: c.c, p: ajuster(f, A.trace, a) }; }
    const p = c.p, trait = p.length >= 2 && Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]) > 0.01;
    if (c.tool === 'trait' ? p.length > 1 : trait) { A.traits.push(c); if (c.tool !== 'trait') { A.sel = A.traits.length - 1; vibrer(6); } }
    A.courant = null; A.trace = []; dessiner();
  };
  ['pointerup', 'pointercancel'].forEach(t => zone.addEventListener(t, fin));
  $('#outils').addEventListener('click', e => { const b = e.target.closest('.outil'); if (!b) return; vibrer(3); A.outil = b.dataset.t; $$('#an .outil').forEach(o => o.classList.toggle('on', o === b)); });
  const pastille = $('#couleur'); pastille.style.background = A.couleur;
  pastille.onclick = () => { A.couleur = PALETTE[(PALETTE.indexOf(A.couleur) + 1) % PALETTE.length]; pastille.style.background = A.couleur; vibrer(4); };
  $('#an-annuler').onclick = () => { if (A.courant) A.courant = null; else A.traits.pop(); A.sel = null; dessiner(); vibrer(4); };
  const quitter = () => { A.micro?.arreter(true); el.remove(); const f = A.surFin; A = null; f && f(); };
  $('#an-retour').onclick = quitter;
  function etiquette(n) {
    const voile = h('div', { id: 'voile-et' }), inp = h('input', { placeholder: 'Texte…', autocomplete: 'off' });
    const fermer = () => { voile.remove(); sheet.remove(); };
    const sheet = h('div', { id: 'etiquette' }, h('h5', {}, 'Étiquette'), inp, h('div', { class: 'r' }, h('button', { onclick: fermer }, 'Annuler'), h('button', { style: 'font-weight:600', onclick: () => { const s2 = inp.value.trim(); if (s2) { A.traits.push({ tool: 'texte', c: A.couleur, p: [n], texte: s2 }); dessiner(); } fermer(); } }, 'Ajouter')));
    voile.onclick = fermer; el.append(voile, sheet); inp.focus();
  }
  $('#btn-ok').onclick = () => {
    const c = document.createElement('canvas'); c.width = W0; c.height = H0; const x = c.getContext('2d'); x.drawImage(photo.c, 0, 0);
    for (const t of A.traits) tracer(x, t, W0, H0, Math.max(4, W0 * 0.012), Math.max(18, W0 * 0.05), Math.max(16, W0 * 0.05));
    if (A.traits.length) { photo.url = c.toDataURL('image/jpeg', .86); }
    vibrer([8, 30, 8]); quitter();
  };
  function majChamps() {
    $$('#an .champ').forEach(b => {
      const k = b.dataset.champ, v = photo[k], act = A.champ === k;
      b.classList.toggle('actif', act);
      b.querySelector('.l span').textContent = '· ' + (act ? 'touche pour terminer' : k === 'legende' ? 'légende de la photo au rapport' : 'sur le Mac, hors rapport');
      const el2 = b.querySelector('.v'); if (!el2) return; const aff = act && !v ? 'Je t’écoute…' : v;
      el2.textContent = aff || 'Touche pour dicter'; el2.classList.toggle('vide', !aff);
    });
  }
  $$('#an .champ').forEach(b => b.onclick = () => {
    const k = b.dataset.champ; if (b.querySelector('input')) return;
    if (A.champ === k) { A.micro?.arreter(); A.champ = null; majChamps(); return; }
    const saisir = () => { const v = b.querySelector('.v'); if (!v) return; const i = h('input', { placeholder: 'Touche pour dicter' }); i.value = photo[k]; v.replaceWith(i); i.focus(); i.onblur = () => { photo[k] = i.value.trim(); i.replaceWith(h('span', { class: 'v' })); majChamps(); }; i.onkeydown = ev => { if (ev.key === 'Enter') i.blur(); }; };
    A.champ = k; majChamps();
    A.micro = new Micro({ surTexte: t => { photo[k] = t; majChamps(); }, surEchec: () => { A.champ = null; majChamps(); saisir(); } });
    if (!A.micro.demarrer()) { A.champ = null; majChamps(); saisir(); }
  });
  zoomer(); dessiner(); majChamps();
}

/* ---------- démarrage ---------- */
majTitre(); majChrome();
guide('Touchez : photo · Maintenez : note vocale');
