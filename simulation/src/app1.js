'use strict';
/* BatiFlow iPhone, préachat AIBQ (refonte). Partie 1 : socle, données, caméra, gestes.
   Références : BFCameraScreen.swift (CS), AIBQRefonteCamera.swift, BFCascadeLieux.swift,
   BFGlisserRelatif.swift, AIBQRaccourcisDossier.swift, BFFormeAjustee.swift. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ecran = $('#ecran');
const h = (tag, attrs = {}, ...enfants) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
  }
  for (const e of enfants.flat()) if (e != null && e !== false) el.append(e.nodeType ? e : document.createTextNode(e));
  return el;
};

/* ---------- icônes : SF Symbols découpés dans les captures, sinon tracés de remplacement ---------- */
const TRACES = {
  xmark: ['M6.5 6.5l11 11M17.5 6.5l-11 11', 2.6], check: ['M5 12.5l4.5 4.5L19 7.5', 2.8], chevu: ['M6 15l6-6 6 6', 2.4], chevdn: ['M6 9l6 6 6-6', 2.4],
  chevr2: ['M9 5.5l6.5 6.5L9 18.5', 2.4], loupe: ['M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13zM15.5 15.5L20.5 20.5', 2.2],
  clavier: ['M3.5 6h17a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8', 1.7],
  pluscercle: ['M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0-18zM12 8v8M8 12h8', 1.3], fdroite: ['M4.5 12h14M13 6l6 6-6 6', 2.2],
  poubelle: ['M4 6.5h16M9 6.5V4.5h6v2M6.5 6.5l1 13.5h9l1-13.5M10 10v7M14 10v7', 1.8], crayonc: ['M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M10 14l1-4 8-8 3 3-8 8z', 1.8],
  plateau: ['M3.5 13h4.5l1.5 3h5l1.5-3h4.5M3.5 13l2-8h13l2 8v6.5h-17zM12 3.5v7M9.5 8L12 10.5 14.5 8', 1.7],
  pellicule: ['M7 7h13v11H7zM4 4h13M4 4v11M10 14l2.5-3 2 2 1.5-1.5 2.5 2.5', 1.7], main: ['M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13.5a1.4 1.4 0 0 1 2.4-1.4L8 14', 1.7],
  notet: ['M6 3h12v18H6zM9 8h6M9 12h6M9 16h4', 1.8], textephoto: ['M5 3.5h14v9H5zM7 10.5l3-3 2.5 2.5 1.5-1.5 2 2M6 16.5h12M6 20h8', 1.8],
  cube: ['M12 2.5l8 4.5v10l-8 4.5-8-4.5V7zM4 7l8 4.5L20 7M12 11.5v10', 1.8], fiche: ['M3 5h18v14H3zM8.5 11a2 2 0 1 0 0-.01M5.5 16a3 3 0 0 1 6 0M14 9.5h4.5M14 13h4.5', 1.8],
  cle: ['M14.5 3.5a4.5 4.5 0 0 0-4.2 6.1L3.8 16.1a2 2 0 0 0 2.8 2.8l6.5-6.5a4.5 4.5 0 0 0 6.1-4.2l-2.6 2.6-2.4-.6-.6-2.4z', 1.8],
  galerie: ['M8 7h12v12H8zM5 5v11M5 5h11M11 16l2.5-3 2 2 1.5-1.5 2 2.5', 1.8], presse: ['M8 4h8v3H8zM6 5.5H5v15h14v-15h-1M8.5 11h7M8.5 15h5', 1.8],
  maison: ['M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5', 1.9], liste: ['M4 6h.01M8 6h12M7 12h.01M11 12h9M7 18h.01M11 18h9', 2.2],
  immeuble: ['M4 21V8l6-3v16M10 21V3l10 4v14M3 21h18M13 9h4M13 13h4M13 17h4', 1.7], coches: ['M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6.5h9M11 12.5h9M11 18.5h9', 1.8],
  onde: ['M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2', 2], trombone: ['M17 8.5l-6.5 6.5a2 2 0 0 1-2.8-2.8l7-7a3.5 3.5 0 0 1 5 5l-7.2 7.2a5 5 0 0 1-7.1-7.1L12 4', 1.8],
  fourchette: ['M7 3v7a2 2 0 0 0 4 0V3M9 3v18M17 3c-2 0-3 2.5-3 6s1 4 3 4v8', 2], douche: ['M5 21V7a3 3 0 0 1 6 0M8 4.5h7a3 3 0 0 1 3 3v.5M14 11v1M17 11v1M20 11v1M15.5 15v1M18.5 15v1', 2],
  lit: ['M3 19V7M3 14h18v5M21 14v-2a3 3 0 0 0-3-3h-7v5M6.5 11.5h.01', 2], sofa: ['M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 18v-6a1.5 1.5 0 0 1 3 0v2h12v-2a1.5 1.5 0 0 1 3 0v6zM5 18v2M19 18v2', 1.9],
  table: ['M3 9h18M5 9v10M19 9v10M8 9v6h8V9', 2], laveuse: ['M5 3h14v18H5zM12 9.5a4 4 0 1 1 0 8a4 4 0 0 1 0-8zM8 6h.01M11 6h.01', 1.8],
  ecranpc: ['M3 4h18v12H3zM9 20h6M12 16v4', 1.9], porte: ['M5 21h14M7 21V3h8v18M12.5 12h.01', 1.9], auto: ['M4 16v-4l2-5h12l2 5v4zM4 16v3h3v-3M17 16v3h3v-3M7.5 13h.01M16.5 13h.01', 1.9],
  epingle: ['M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 8a2 2 0 1 0 .01 0', 1.9], haut: ['M12 20V5M6 11l6-6 6 6', 2.2], bas: ['M12 4v15M6 13l6 6 6-6', 2.2],
  gauche: ['M20 12H5M11 6l-6 6 6 6', 2.2], droite: ['M4 12h15M13 6l6 6-6 6', 2.2], parking: ['M4 4h16v16H4zM10 16V8h3a2.5 2.5 0 0 1 0 5h-3', 1.9],
  piscine: ['M3 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M8 14V5.5a2 2 0 0 1 4 0M16 14V5.5a2 2 0 0 1 4 0M8 9h8', 1.8], soleil: ['M3 18h18M6 18a6 6 0 0 1 12 0M12 7V4M5.5 11L3.5 9M18.5 11l2-2', 1.9],
  cabanon: ['M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5', 1.9], portrait: ['M7 3h10v18H7z', 1.9], vide: ['M4 4h16v16H4zM12 12h8M12 12v8', 1.9], escalier: ['M3 20h5v-5h5v-5h5V5h3', 2],
  plus26: ['M12 4v16M4 12h16', 3.2], micro: ['M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM6 11a6 6 0 0 0 12 0M12 17v4', 2.2],
};
const PLEINS = {
  stopf: '<rect x="6" y="6" width="12" height="12" rx="2"/>', pause: '<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>',
  etoile: '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/>',
  cadenas: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#000" stroke-width="2"/>',
  arbre: '<path d="M12 2l-6 8h3l-4 6h5.5v6h3v-6H19l-4-6h3z"/>', excl: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20zM11 6.5h2v8h-2zM12 15.8a1.3 1.3 0 1 1 0 2.6a1.3 1.3 0 0 1 0-2.6z"/>',
  ronde: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20zM9 9h6v6H9z"/>', fleche: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20zM11 17V9.5l-3 3-1.4-1.4L12 5.7l5.4 5.4-1.4 1.4-3-3V17z"/>',
};
const masques = {};
function masque(nom) {
  if (masques[nom]) return masques[nom];
  let uri;
  if (ICONES[nom]) uri = ICONES[nom].uri;
  else if (TRACES[nom]) uri = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${TRACES[nom][0]}" fill="none" stroke="#000" stroke-width="${TRACES[nom][1]}" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  else if (PLEINS[nom]) uri = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000">${PLEINS[nom]}</svg>`);
  return (masques[nom] = `url("${uri}")`);
}
function ic(nom, w, hh) {
  const d = ICONES[nom];
  const W = w ?? (d ? d.w : 18), H = hh ?? (d ? d.h : W);
  const el = h('i', { class: 'ic', 'data-icone': nom });
  el.style.setProperty('--m', masque(nom)); el.style.width = W + 'px'; el.style.height = H + 'px';
  return el;
}
function poserIcone(el, nom, w, hh) {
  const d = ICONES[nom];
  el.classList.add('ic'); el.style.setProperty('--m', masque(nom));
  el.style.width = (w ?? (d ? d.w : 18)) + 'px'; el.style.height = (hh ?? (d ? d.h : w ?? 18)) + 'px';
}
$$('[data-i]').forEach(el => {
  poserIcone(el, el.dataset.i, el.dataset.w ? +el.dataset.w : undefined, el.dataset.h ? +el.dataset.h : undefined);
  if (el.dataset.c) {
    const [cx, cy] = el.dataset.c.split(',').map(Number), d = ICONES[el.dataset.i];
    el.style.left = (cx - parseFloat(el.parentElement.style.left) - d.w / 2) + 'px'; el.style.top = (cy - 798 - d.h / 2) + 'px';
  }
});
$('#shutter .plus i').style.cssText += ';width:26px;height:26px';

/* ---------- mise à l'échelle de la toile ---------- */
/* Dans l'aperçu claude.ai (page encadrée), les boutons ✕ et … du visualiseur flottent sur les 64 px du haut : la toile commence dessous. */
/* « ?integre » : la page est encadrée par le site inspecteur.expert — l'iPhone seul, sans marge ni panneau. */
const INTEGRE = new URLSearchParams(location.search).has('integre');
const HAUT = !INTEGRE && window.self !== window.top ? 64 : 0;
/* ordinateur (souris, écran large) : l'app entière dans un cadre d'iPhone, à côté du code QR */
const surBureau = () => INTEGRE || (innerWidth >= 820 && matchMedia('(hover: hover) and (pointer: fine)').matches);
function echelle() {
  const r = document.documentElement.style, bureau = surBureau();
  document.body.classList.toggle('bureau', bureau); document.body.classList.toggle('integre', INTEGRE);
  r.setProperty('--haut', HAUT + 'px');
  r.setProperty('--s', INTEGRE ? Math.min(1, (innerHeight - 8) / 902, (innerWidth - 8) / 432) : bureau ? Math.min(1, (innerHeight - HAUT - 48) / 902) : Math.min(innerWidth / 402, (innerHeight - HAUT) / 812));
}
addEventListener('resize', echelle); echelle();
const echelleCourante = () => $('#cadre').getBoundingClientRect().width / 402;
/* coordonnées d'un pointeur dans la toile (pt, repère des captures) */
function pt(e) { const r = ecran.getBoundingClientRect(), s = r.width / 402; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; }
/* .lineLimit(1).minimumScaleFactor(f) */
function tenir(el, f = 0.7) {
  el.style.fontSize = ''; const t = parseFloat(getComputedStyle(el).fontSize);
  const dispo = el.clientWidth, w = el.scrollWidth;
  if (dispo && w > dispo + .5) el.style.fontSize = Math.max(t * f, t * dispo / w) + 'px';
}
const vibrer = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmt2 = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const sansAccent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let uid = 0; const nouvelId = () => 'c' + (++uid) + Date.now().toString(36);

/* ---------- données ---------- */
/* BFCategories.list (CS:10796-10810), dans l'ordre de la caméra */
const CATS = [
  ['structure', 'Structure', ['Fondations', 'Dalles de béton', 'Murs porteurs', 'Poutres et colonnes', 'Structure du toit', 'Plafonds et planchers', 'Vide sanitaire', 'Murs mitoyens']],
  ['exterieur', 'Extérieur', ['Revêtements extérieurs', 'Portes permanentes', 'Portes et fenêtres', 'Terrasses, balcons et porches', 'Marches et balustrades ext.', 'Aménagements et terrassements', 'Évacuation des eaux', 'Avant-toits, fascias', 'Linteaux et allèges', 'Stationnement et trottoirs', 'Solins et scellants', 'Entrée et portes de garages', 'Puits de lumières (margelles)']],
  ['toiture', 'Toiture', ['Revêtements de toit', 'Gouttières et descentes', 'Cheminée', 'Solins de toit', 'Émergences de toit', 'Drains de toit', 'Lanterneaux', 'Vide sous toit']],
  ['plomberie', 'Plomberie', ['Appareils et robinets', "Conduits d'évacuation", 'Conduits de distribution', 'Valve principale', 'Système de chauffe-eau', 'Puisards et fosses', 'Dispositif antirefoulement', 'Drain de plancher', 'Pompe à déchets solides']],
  ['electricite', 'Électricité', ['Panneau de distribution', 'Alimentation principale', 'Câbles et circuits', 'Interrupteurs et prises', 'Mise à la terre', 'Coffret de branchement']],
  ['chauffage', 'Chauffage', ['Générateur de chaleur', 'Réservoir combustible', "Conduit d'évacuation", 'Distribution de la chaleur', 'Contrôle de la température', 'Cheminée (chauffage)']],
  ['climatisation', 'Climatisation', ['Système de climatisation', 'Contrôle de la température', 'Système de distribution']],
  ['isolation_vent', 'Isolation / Ventil.', ['Isolation des combles', 'Isolation des fondations', 'Ventilation de la toiture', "Échangeur d'air (VRC/VRE)", 'Hotte de cuisinière', 'Sortie de sécheuse', 'Ventilateurs de plafond', 'Ventilation vide sanitaire']],
  ['interieur', 'Intérieur', ['Revêtement des murs', 'Revêtement des planchers', 'Revêtement des plafonds', 'Escaliers, marches et balustrades', 'Armoires et comptoirs', 'Murs mitoyens du garage', 'Portes et fenêtres int.']],
  ['securite', 'Sécurité', ['Détecteurs / Avertisseurs', 'Murs de séparation incendie', "Sorties d'évacuation", 'Système de gicleurs']],
  ['general', 'Général', ['Énoncés généraux', 'Environnements', 'Génératrices', 'Autre']],
];
const catLabel = k => (CATS.find(c => c[0] === k) || CATS[0])[1];
const catParLabel = l => CATS.find(c => sansAccent(c[1]) === sansAccent(l || '') || sansAccent(c[1]).startsWith(sansAccent((l || '').split(' ')[0]))) || null;
/* AIBQSymbol : libellés et couleurs (Domain/AIBQSymbol.swift) */
const GRAV = { correctif: ['Défaut à corriger', '#3B82F6'], expertise: ['Expertise recommandée', '#A855F7'], urgent: ['À corriger immédiatement', '#DC2626'], securite: ['Danger', '#EF4444'], attention: ['Avertissement', '#F59E0B'], suivi: ['À surveiller', '#8B5CF6'], limitation: ['Limitation', '#475569'], information: ['Information', '#A1A1AA'], aucune: ['Aucune déficience', '#10B981'] };
/* BFCascadeLieux : colonnes par étage, « Autre… » en haut, le plus probable en bas */
const ETAGES = [['ss', 'Sous-sol', 'du sous-sol'], ['rdc', 'Rez-de-chaussée', ''], ['e1', '1er étage', 'du 1er étage']];
const PIECES = {
  ss: ['Autre…', 'Vide sanitaire', 'Garage', 'Bureau', 'Chambre 2', 'Chambre 1', 'Salle de bain', 'Buanderie', 'Salle mécanique', 'Salle familiale'],
  rdc: ['Autre…', 'Buanderie', 'Bureau', 'Chambre 1', 'Chambre principale', 'Salle de bain', 'Salle familiale', 'Salle à manger', 'Cuisine', 'Salon', 'Entrée'],
  e1: ['Autre…', 'Buanderie', 'Bureau', 'Walk-in', 'Salle de bain', 'Salle de bain principale', 'Chambre 3', 'Chambre 2', 'Chambre 1', 'Chambre principale'],
};
const EXTERIEUR = ['Autre…', 'Piscine', 'Cabanon', 'Garage', 'Stationnement', 'Toiture', 'Façade droite', 'Façade gauche', 'Façade arrière', 'Façade avant'];
const GRILLE_INT = ['Salon', 'Cuisine', 'Salle à manger', 'Salle familiale', 'Salle de bain', 'Salle de bain principale', 'Chambre principale', 'Chambre 1', 'Chambre 2', 'Chambre 3', 'Salle mécanique', 'Buanderie', 'Entrée', 'Bureau', 'Walk-in', 'Garage', 'Vide sanitaire'];
const GRILLE_EXT = ['Façade avant', 'Façade arrière', 'Façade gauche', 'Façade droite', 'Toiture', 'Stationnement', 'Garage', 'Cabanon', 'Piscine', 'Terrasse'];
function picto(n) { /* AIBQLieux.picto */
  n = sansAccent(n);
  if (n.includes('cuisine')) return 'fourchette'; if (n.includes('salle de bain')) return 'douche';
  if (n.includes('chambre') || n.includes('walk-in')) return 'lit'; if (n.includes('salon') || n.includes('familiale')) return 'sofa';
  if (n.includes('salle a manger')) return 'table'; if (n.includes('mecanique')) return 'cle'; if (n.includes('buanderie')) return 'laveuse';
  if (n.includes('bureau')) return 'ecranpc'; if (n.includes('entree')) return 'porte'; if (n.includes('garage')) return 'auto';
  if (n.includes('vide sanitaire')) return 'vide'; if (n.includes('facade avant')) return 'haut'; if (n.includes('facade arriere')) return 'bas';
  if (n.includes('facade gauche')) return 'gauche'; if (n.includes('facade droite')) return 'droite'; if (n.includes('toiture')) return 'maison';
  if (n.includes('stationnement')) return 'parking'; if (n.includes('cabanon')) return 'cabanon'; if (n.includes('piscine')) return 'piscine';
  if (n.includes('terrasse')) return 'soleil'; return 'epingle';
}
function legende(nom, bord, etage) { if (bord === 'exterieur') return nom; const e = ETAGES.find(x => x[0] === etage); return e && e[2] ? `${nom} ${e[2]}` : nom; }

/* ---------- état ---------- */
const dossier = { adresse: '48, chemin des Bouleaux', ville: 'Sutton (QC)', constats: [], notes: [], photosNonClassees: [] };
const cam = { cat: 'structure', sub: 'Fondations', bord: 'interieur', lieu: null, etage: 'rdc', lot: null, lotPour: null, carnet: null, panneau: false, dictee: null, maintien: false };
let dernierId = null;
const photosDuDossier = () => dossier.constats.reduce((n, c) => n + c.photos.length, 0) + dossier.notes.reduce((n, x) => n + x.photos.length, 0);

/* ---------- toasts, menus, feuilles système ---------- */
let toastT = null;
function toast(texte) {
  $('#toast')?.remove(); clearTimeout(toastT);
  ecran.append(h('div', { id: 'toast' }, texte));
  toastT = setTimeout(() => $('#toast')?.remove(), 2600);
}
function menu(ancre, items, { haut = false, droite = true } = {}) {
  fermerMenu();
  const r = ancre.getBoundingClientRect(), E = ecran.getBoundingClientRect(), s = E.width / 402;
  const m = h('div', { class: 'menu-ios' });
  for (const it of items) {
    if (it === '-') { m.append(h('div', { class: 'sep' })); continue; }
    m.append(h('button', { class: (it.rouge ? 'rouge ' : '') + (it.coche ? 'coche' : ''), onclick: () => { fermerMenu(); it.action && it.action(); } }, h('span', {}, it.texte), it.icone ? ic(it.icone, 18, 18) : null));
  }
  ecran.append(h('div', { id: 'voile-menu', onpointerdown: e => { e.preventDefault(); fermerMenu(); } }), m);
  const x = (droite ? (r.right - E.left) / s - m.offsetWidth : (r.left - E.left) / s);
  const y = haut ? (r.top - E.top) / s - m.offsetHeight - 6 : (r.bottom - E.top) / s + 6;
  m.style.left = Math.max(8, Math.min(402 - 8 - m.offsetWidth, x)) + 'px';
  m.style.top = Math.max(70, Math.min(860 - m.offsetHeight, y)) + 'px';
}
function fermerMenu() { $('#voile-menu')?.remove(); $('.menu-ios')?.remove(); }
function feuilleSys(titre, corps, { gauche = null, ok = 'OK' } = {}) {
  fermerFeuilleSys();
  const f = h('div', { class: 'feuille-sys' }, h('div', { class: 'poignee' }),
    h('div', { class: 'nav' }, h('button', { onclick: fermerFeuilleSys }, gauche || ''), h('b', {}, titre), h('button', { class: 'ok', onclick: fermerFeuilleSys }, ok)),
    h('div', { class: 'corps' }, corps));
  ecran.append(h('div', { id: 'voile-sys', onclick: fermerFeuilleSys }), f);
  let y0 = null;
  f.querySelector('.poignee').parentElement.addEventListener('pointerdown', e => { if (e.target.closest('.corps')) return; y0 = e.clientY; });
  f.addEventListener('pointerup', e => { if (y0 != null && e.clientY - y0 > 80) fermerFeuilleSys(); y0 = null; });
  return f;
}
function fermerFeuilleSys() { $('#voile-sys')?.remove(); $('.feuille-sys')?.remove(); }

/* ---------- moteur de dictée (SFSpeechRecognizer fr_CA → Web Speech fr-CA) ---------- */
const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
class Micro {
  constructor({ surTexte, surEchec } = {}) { this.surTexte = surTexte; this.surEchec = surEchec; this.acquis = ''; this.courant = ''; this.r = null; this.actif = false; this.ko = !Reco; }
  get texte() { return (this.acquis + ' ' + this.courant).trim(); }
  demarrer() {
    if (!Reco) { this.ko = true; return false; }
    this.actif = true; this.acquis = ''; this.courant = '';
    const lancer = () => {
      try {
        const r = new Reco(); this.r = r;
        r.lang = 'fr-CA'; r.continuous = true; r.interimResults = true;
        r.onresult = ev => { if (r !== this.r) return; let f = '', p = ''; for (const x of ev.results) { if (x.isFinal) f += x[0].transcript; else p += x[0].transcript; } this.courant = (f + ' ' + p).trim(); this.surTexte && this.surTexte(this.texte); };
        r.onerror = ev => { if (r !== this.r) return; if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network'].includes(ev.error)) { this.ko = true; this.actif = false; this.r = null; this.surEchec && this.surEchec(); } };
        r.onend = () => { if (r !== this.r) return; this.acquis = this.texte; this.courant = ''; if (this.actif && !this.ko) lancer(); else this.r = null; };
        r.start();
      } catch (e) { this.ko = true; this.actif = false; this.surEchec && this.surEchec(); }
    };
    lancer(); return true;
  }
  arreter(annuler) { this.actif = false; const r = this.r; this.r = null; if (r) try { annuler ? r.abort() : r.stop(); } catch (e) {} return this.texte; }
}
/* bulle AIBQMicroDirect : la transcription, « ■ Arrêter », « ⌨ Clavier » */
function bulleMicro({ sombre = false, invite = 'Dis la pièce ou la façade…', surArreter, surClavier } = {}) {
  const tx = h('div', { class: 'tx invite' }, invite);
  const zone = h('textarea', { placeholder: invite, hidden: true, 'aria-label': 'Texte dicté' });
  const hd = h('span', {}, 'J’écoute…');
  const b = h('div', { class: 'bulle' + (sombre ? ' sombre' : '') },
    h('div', { class: 'hd' }, h('i'), hd), tx, zone,
    h('div', { class: 'act' },
      h('button', { class: 'arreter', onclick: () => surArreter && surArreter() }, ic('stopf', 12, 12), 'Arrêter'),
      h('button', { class: 'clavier', onclick: () => { b.clavier(); surClavier && surClavier(); } }, ic('clavier', 17, 17), 'Clavier')));
  b.ecrire = t => { tx.textContent = t || invite; tx.classList.toggle('invite', !t); };
  b.clavier = (raison) => { zone.hidden = false; tx.hidden = true; if (!zone.value) zone.value = tx.classList.contains('invite') ? '' : tx.textContent; if (raison) hd.textContent = raison; zone.focus(); };
  b.valeur = () => zone.hidden ? (tx.classList.contains('invite') ? '' : tx.textContent) : zone.value.trim();
  b.titre = t => { hd.textContent = t; };
  return b;
}

/* ---------- viseur : la caméra du téléphone, sinon l'image de démo de l'app ---------- */
const video = $('#vf-video');
let direct = false;
(async () => {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    video.srcObject = flux; await video.play();
    direct = video.videoWidth > 0; $('#vf').classList.toggle('live', direct);
    if (direct) { /* crans d'objectif : 0.5x · 1x · 2x · 3x, le choisi en entier, les autres sans leur « x » */
      const z = $('#zoom-pills'); z.hidden = false;
      ['0.5x', '1x', '2x', '3x'].forEach((l, i) => z.append(h('button', { class: i === 1 ? 'on' : '', onclick: e => { $$('#zoom-pills button').forEach(b => { b.classList.remove('on'); b.textContent = b.dataset.l.slice(0, -1); }); e.currentTarget.classList.add('on'); e.currentTarget.textContent = l; }, 'data-l': l }, i === 1 ? l : l.slice(0, -1))));
    }
  } catch (e) { direct = false; }
})();
/* grille des tiers : blanc à 4 %, zone y 160 → h − 300 (CS:1015-1045) */
(() => {
  const g = $('#grille'); g.textContent = ''; const H = 466.3, W = 349.7, y0 = 160, y1 = H - 300;
  [y0 + (y1 - y0) / 3, y0 + 2 * (y1 - y0) / 3].forEach(y => g.append(h('i', { style: `left:0;right:0;top:${y}px;height:1px` })));
  [W / 3, 2 * W / 3].forEach(x => g.append(h('i', { style: `top:0;bottom:0;left:${x}px;width:1px` })));
})();

function flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function versCanvas(src, w, hh, cadrer) {
  let sx = 0, sy = 0, sw = w, sh = hh;
  if (cadrer) { const r = 3 / 4; if (sw / sh > r) { sw = sh * r; sx = (w - sw) / 2; } else { sh = sw / r; sy = (hh - sh) / 2; } }
  const k = Math.min(1, 1600 / Math.max(sw, sh));
  const c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
const charger = url => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
const nouvellePhoto = c => ({ id: nouvelId(), c, url: c.toDataURL('image/jpeg', .86), legende: '', note: '', lieu: cam.lieu?.caption || '' });
let imageDemo = null;
async function prendrePhoto() {
  flash(); vibrer(8);
  if (direct) return nouvellePhoto(versCanvas(video, video.videoWidth, video.videoHeight, true));
  imageDemo = imageDemo || await charger($('#vf-img').src);
  return nouvellePhoto(versCanvas(imageDemo, imageDemo.naturalWidth, imageDemo.naturalHeight));
}

/* ---------- le lot (capture unifiée) ---------- */
function lotOuvrir(pour = null) { cam.lot = []; cam.lotPour = pour; cam.panneau = false; majChrome(); }
function lotFermer() { cam.lot = null; cam.lotPour = null; cam.carnet = null; $('#vignettes').textContent = ''; majChrome(); }
function lotAjouter(p) {
  cam.lot.push(p);
  const v = $('#vignettes'); v.append(h('i', { style: `background-image:url(${p.url})` }));
  while (v.children.length > 4) v.firstChild.remove();
  majChrome(); parcoursPhoto();
}
async function photoAuLot() { if (!cam.lot) lotOuvrir(); const p = await prendrePhoto(); lotAjouter(p); }
$('#file-photo').onchange = async e => {
  const fs = [...(e.target.files || [])]; e.target.value = '';
  for (const f of fs.slice(0, 10)) {
    const u = URL.createObjectURL(f);
    try { const i = await charger(u); if (!cam.lot) lotOuvrir(); lotAjouter(nouvellePhoto(versCanvas(i, i.naturalWidth, i.naturalHeight))); } catch (err) {} finally { URL.revokeObjectURL(u); }
  }
};
/* ✓ du lot : la feuille « Préparer le constat » s'ouvre, son micro démarre 0,32 s plus tard */
function lotTerminer() {
  if (cam.lotPour === 'note') return noteTerminer();
  const photos = cam.lot || [], pour = cam.lotPour;
  if (!photos.length) { lotFermer(); return; }
  if (pour && pour.startsWith('constat:')) { /* « Ajouter une photo » d'une fiche */
    const c = dossier.constats.find(x => x.id === pour.slice(8)); lotFermer();
    if (c) { c.photos.push(...photos); dernierId = c.id; ouvrirOnglet('chat', c.id); }
    return;
  }
  if (pour === 'feuille' && feuilleEtat) { lotFermer(); feuilleEtat.photos.push(...photos); rendreFeuille(); return; }
  lotFermer();
  ouvrirFeuille({ mode: 'dictee', photos, cat: cam.cat, sub: cam.sub, lieu: photos[0].lieu || cam.lieu?.caption || '' });
  setTimeout(() => feuilleDicter(), 320);
}

/* ---------- chrome : rendu selon l'état ---------- */
function majTitre() { const el = $('#cam-titre'); el.textContent = `${catLabel(cam.cat)} · ${cam.sub}`; ajusterTitre(el, 178, 17); }
function ajusterTitre(el, largeur, taille) { el.style.fontSize = taille + 'px'; const w = el.scrollWidth; if (w > largeur) el.style.fontSize = Math.max(taille * .7, taille * largeur / w) + 'px'; }
function poserIc(btn, nom, w, hh) { const i = btn.querySelector('.ic'); poserIcone(i, nom, w, hh); }
function majChrome() {
  const dictCaps = cam.dictee && cam.dictee.origine === 'fil', note = cam.lotPour === 'note', lot = !!cam.lot;
  const g = $('#btn-gauche');
  g.className = 'r46' + (lot ? ' ambre55' : cam.panneau ? ' jaune25' : '');
  if (lot) poserIc(g, 'pellicule', 20, 20); else poserIc(g, 'bolt');
  g.setAttribute('aria-label', lot ? 'Pellicule — ajouter au lot' : 'Raccourcis');
  const c = $('#btn-crayon'); c.className = 'r46' + (note ? ' plein-ambre' : ''); c.disabled = note;
  $('#shutter .plus').hidden = !lot;
  const d = $('#btn-droite');
  if (dictCaps) { d.className = 'r46 rouge'; poserIc(d, 'stopf', 18, 18); d.setAttribute('aria-label', 'Stop — terminer la dictée'); }
  else if (lot) { d.className = 'r46 ambre85'; poserIc(d, 'check', 20, 20); d.setAttribute('aria-label', note ? 'Terminer la note interne' : 'J’ai fini mes photos — documenter le constat'); }
  else { d.className = 'r46' + (cascCat ? ' jaune30 grand' : ''); poserIc(d, 'layers'); d.setAttribute('aria-label', 'Sections. Maintenir pour choisir la section et la sous-section.'); }
  const lr = $('#lieux-rond'); poserIc(lr, cascLieux ? 'main' : cam.bord === 'exterieur' ? 'arbre' : 'house2', cascLieux ? 19 : cam.bord === 'exterieur' ? 17 : undefined, cascLieux ? 19 : cam.bord === 'exterieur' ? 17 : undefined);
  const enDictee = !!cam.dictee;
  $('#aide-cam').textContent = enDictee ? 'Appui court : photo · Arrêter : créer le constat' : 'Appui long : note vocale';
  majDernier();
  const pa = $('#lieu-pastille');
  pa.hidden = !cam.lieu || !!$('#lieux-panneau') || !!cam.dictee;
  if (cam.lieu) { pa.textContent = ''; pa.append(ic(cam.lieu.bord === 'exterieur' ? 'arbre' : 'house2', 12, 12), cam.lieu.caption); }
  $('#zoom-pills').style.bottom = (cam.lot && cam.lot.length ? 72 : 10) + 'px';
}
function majDernier() {
  const t = $('#dernier-t'), d = dossier.constats.find(x => x.id === dernierId) || dossier.constats.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
  const enDictee = !!cam.dictee;
  t.classList.toggle('dict', enDictee);
  t.textContent = enDictee ? 'Dictée + photos → nouveau constat' : d ? (d.titre || 'Constat sans titre') : 'Aucun constat encore';
  const voir = !enDictee && !!d;
  $('#dernier-ph').hidden = $('#dernier-n').hidden = $('#dernier-ch').hidden = !voir;
  if (d) $('#dernier-n').textContent = d.photos.length === 1 ? '1 photo' : `${d.photos.length} photos`;
  $('#dernier').disabled = !voir;
}
$('#dernier').onclick = () => ouvrirOnglet('chat');

/* ---------- le guide : une seule capsule, au premier lancement ---------- */
let guideVu = false;
function guide(texte, top = 548) {
  $('#guide')?.remove();
  if (!texte) return;
  ecran.append(h('div', { class: 'guide', id: 'guide', style: `top:${top}px` }, texte));
}
function finGuide() { if (!guideVu) { guideVu = true; guide(null); } }
['#btn-gauche', '#btn-crayon', '#lieux-rond', '#btn-droite', '#btn-tiroir', '#btn-accueil', '#dernier', '#onglets'].forEach(s => $(s).addEventListener('pointerdown', finGuide));

/* ---------- déclencheur : toucher = photo · maintenir 0,3 s = note vocale ---------- */
const sh = $('#shutter');
let presse = false, arme = false, minuterie = null;
sh.addEventListener('contextmenu', e => e.preventDefault());
sh.addEventListener('pointerdown', e => {
  e.preventDefault(); finGuide(); fermerRaccourcis();
  presse = true; arme = false; sh.classList.add('press');
  if (cam.dictee || cam.lotPour === 'note') return; /* micro déjà ouvert : l'appui long est refusé */
  sh.classList.add('arme'); $('#tip').hidden = false;
  preparerMicro();
  minuterie = setTimeout(() => { arme = true; sh.classList.remove('arme'); $('#tip').hidden = true; maintienDebut(); }, 300);
});
async function relacher() {
  if (!presse) return;
  presse = false; sh.classList.remove('press', 'arme'); $('#tip').hidden = true; clearTimeout(minuterie);
  if (arme) { arme = false; maintienLacher(); return; }
  if (!cam.dictee && microPrep) { microPrep.arreter(true); microPrep = null; }
  await photoAuLot();
}
['pointerup', 'pointercancel'].forEach(t => sh.addEventListener(t, relacher));

/* ---------- note vocale (dictée du fil) ---------- */
let microPrep = null, chronoT = null, debutDictee = 0;
function preparerMicro() { microPrep = new Micro({ surTexte: t => cam.dictee?.bulle?.ecrire(t), surEchec: () => cam.dictee && cam.dictee.secours() }); microPrep.demarrer(); }
function bandeau({ titre, aide, arreter }) {
  $('#bandeau')?.remove();
  const onde = h('span', { class: 'onde' });
  for (let k = 0; k < 5; k++) onde.append(h('i', { style: `height:${5 + Math.abs(Math.sin(k * 1.9)) * 13}px` }));
  const b = h('div', { id: 'bandeau' },
    h('div', { class: 'cap' }, h('i', { class: 'pt' }), h('span', { class: 'ti' }, titre), h('span', { class: 'tp', id: 'chrono' }, '0:00'), onde, h('span', { class: 'sp' }),
      arreter ? h('button', { class: 'stop', 'aria-label': 'Arrêter la note vocale et créer le constat', onclick: arreter }, ic('ronde', 18, 18), 'Arrêter') : null),
    h('div', { class: 'aide', id: 'bandeau-aide' }, aide));
  ecran.append(b);
  debutDictee = performance.now(); clearInterval(chronoT);
  chronoT = setInterval(() => { const c = $('#chrono'); if (c) c.textContent = fmt(Math.floor((performance.now() - debutDictee) / 1000)); }, 250);
}
function fermerBandeau() { $('#bandeau')?.remove(); clearInterval(chronoT); $('#bulle-cam')?.remove(); }
function bulleCamera(invite) {
  $('#bulle-cam')?.remove();
  const b = bulleMicro({ invite, surArreter: () => cam.dictee?.arreter() });
  b.id = 'bulle-cam'; ecran.append(b); return b;
}
function maintienDebut() {
  vibrer(12);
  if (cam.lot && !cam.lot.length) lotFermer();
  const micro = microPrep || new Micro(); microPrep = null;
  cam.dictee = { origine: 'fil', micro, bulle: null, arreter: capsuleStop,
    secours: () => { cam.dictee.bulle = cam.dictee.bulle || bulleCamera('Dis ce que tu vois, et où.'); cam.dictee.bulle.clavier('Micro non disponible ici — écris, ou touche le micro du clavier'); } };
  if (!micro.actif && !micro.ko) micro.demarrer();
  bandeau({ titre: 'Note vocale en cours', aide: 'Lâche : le micro reste ouvert', arreter: null });
  parcoursDictee();
  if (micro.ko) cam.dictee.secours();
  majChrome();
}
function maintienLacher() {
  if (!cam.dictee) return;
  bandeau({ titre: 'Note vocale en cours', aide: 'Appui court : photo · Arrêter : créer le constat', arreter: capsuleStop });
  majChrome();
}
/* Stop / Arrêter : la dictée et les photos deviennent le constat, l'onglet Constats s'ouvre (CS:9251, 14626-14655) */
function capsuleStop() {
  const d = cam.dictee; if (!d) return;
  const texte = (d.bulle ? d.bulle.valeur() : '') || d.micro.arreter(false);
  if (!texte && parcoursActif()) { toast('Dis ou écris ce que tu vois d’abord'); d.bulle?.clavier('Écris ce que tu vois, ou touche un exemple'); return; }
  d.micro.arreter(false);
  const photos = cam.lot ? cam.lot.slice() : [];
  const duree = Math.max(1, Math.round((performance.now() - debutDictee) / 1000));
  cam.dictee = null; fermerBandeau(); vibrer(6);
  if (cam.lot) lotFermer();
  if (!texte && !photos.length) { majChrome(); return; }
  const c = { id: nouvelId(), cat: cam.cat, sub: cam.sub, titre: '', constat: '', reco: '', gravite: null, lieu: photos[0]?.lieu || cam.lieu?.caption || '', photos, dictee: texte, duree, createdAt: Date.now(), statut: 'rediger', notes: [], inclus: true };
  dossier.constats.push(c); dernierId = c.id; majChrome();
  if (texte && parcoursConstat(c)) return;
  ouvrirOnglet('chat', c.id);
  if (texte) redigerEnFond(c);
}
$('#btn-droite').addEventListener('click', () => { if (cam.dictee && cam.dictee.origine === 'fil') capsuleStop(); else if (cam.lot) lotTerminer(); });

/* ---------- ✏️ note interne et carnets (CS:8810-8847) ---------- */
function noteOuvrir(carnet = null) {
  if (cam.dictee || cam.lot) return;
  fermerRaccourcis(); vibrer(6);
  lotOuvrir('note'); cam.carnet = carnet;
  const micro = new Micro();
  cam.dictee = { origine: 'note', micro, bulle: null, arreter: noteTerminer,
    secours: () => { cam.dictee.bulle = cam.dictee.bulle || bulleCamera('Ce que tu veux retenir…'); cam.dictee.bulle.clavier('Micro non disponible ici — écris, ou touche le micro du clavier'); } };
  micro.surEchec = () => cam.dictee && cam.dictee.secours();
  micro.demarrer();
  bandeau({ titre: carnet ? `${carnet} en cours` : 'Note interne en cours', aide: 'Stop pour terminer', arreter: null });
  if (micro.ko) cam.dictee.secours();
  majChrome();
}
function noteTerminer() {
  const d = cam.dictee, carnet = cam.carnet, photos = cam.lot ? cam.lot.slice() : [];
  const texte = d ? ((d.bulle ? d.bulle.valeur() : '') || d.micro.arreter(false)) : '';
  if (d) d.micro.arreter(false);
  cam.dictee = null; fermerBandeau(); lotFermer();
  if (!texte && !photos.length) return;
  dossier.notes.push({ id: nouvelId(), texte, photos, carnet, cat: cam.cat, sub: cam.sub, createdAt: Date.now() });
  toast(carnet ? `Note ajoutée · ${carnet}` : 'Note interne ajoutée');
}
$('#btn-crayon').addEventListener('click', () => noteOuvrir());

/* ---------- ⚡ « RACCOURCIS » (panneauCarnets, CS:12117-12173) / menu Pellicule pendant un lot ---------- */
function fermerRaccourcis() { if (!cam.panneau) return; cam.panneau = false; $('#raccourcis')?.remove(); majChrome(); }
$('#btn-gauche').addEventListener('click', e => {
  if (cam.lot) {
    const n = dossier.photosNonClassees.length;
    return menu(e.currentTarget, [{ texte: 'Choisir dans la pellicule', icone: 'pellicule', action: () => $('#file-photo').click() },
      ...(n ? [{ texte: `Choisir dans les Non classées · ${n}`, icone: 'plateau' }] : [])], { haut: true, droite: false });
  }
  if (cam.panneau) return fermerRaccourcis();
  cam.panneau = true; vibrer(4);
  const tuile = (nom, icone) => h('button', { class: 'tuile', onclick: () => { fermerRaccourcis(); noteOuvrir(nom); } }, ic(icone, 17, 17), h('span', {}, nom));
  ecran.append(h('div', { id: 'raccourcis' },
    h('div', { class: 'hd' }, h('span', {}, 'RACCOURCIS'), h('button', { 'aria-label': 'Fermer les raccourcis', onclick: fermerRaccourcis }, ic('xmark', 11, 11))),
    h('div', { class: 'tuiles' }, tuile('Description du bâtiment', 'textephoto'), tuile('Composantes du bâtiment', 'cube'))));
  majChrome();
});
$('#pil').addEventListener('click', fermerRaccourcis);

/* ---------- glisser relatif (BFGlisserRelatif : 1 rangée par 16 pt) ---------- */
const PAS = 16;

/* ---------- cascade des CATÉGORIES : appui long sur Couches (CS:1654-1741, 2310-2486) ---------- */
let cascCat = null;
const btnCouches = $('#btn-droite');
let tCouches = null;
btnCouches.addEventListener('pointerdown', e => {
  if (cam.dictee || cam.lot) return;
  e.preventDefault(); btnCouches.setPointerCapture(e.pointerId);
  const p0 = pt(e); btnCouches.classList.add('jaune30', 'grand');
  tCouches = { p0, minut: setTimeout(() => { tCouches.pret = true; ouvrirCascCat(p0); }, 250) };
});
btnCouches.addEventListener('pointermove', e => {
  if (!tCouches) return; const p = pt(e);
  if (!tCouches.pret) { if (Math.hypot(p[0] - tCouches.p0[0], p[1] - tCouches.p0[1]) > 12) { clearTimeout(tCouches.minut); tCouches = null; majChrome(); } return; }
  suivreCascCat(p);
});
btnCouches.addEventListener('pointerup', () => {
  if (!tCouches) return; clearTimeout(tCouches.minut);
  if (tCouches.pret) terminerCascCat(); else { fermerRaccourcis(); majChrome(); }
  tCouches = null;
});
btnCouches.addEventListener('pointercancel', () => { if (tCouches) { clearTimeout(tCouches.minut); if (cascCat) fermerCascCat(); tCouches = null; majChrome(); } });
function ouvrirCascCat(p0) {
  fermerRaccourcis(); vibrer(10);
  cascCat = { i: CATS.length - 1, sous: -1, dans: false, o: p0.slice(), lat: 0 };
  const col = h('div', { class: 'casc cats', id: 'casc-cats' });
  CATS.forEach(([k, l, s]) => col.append(h('div', { class: 'row' }, h('b', {}, l), h('small', {}, `${s.length} ›`))));
  const H = 8 + CATS.length * 34;
  col.style.cssText = `left:217px;width:150px;top:${613.3 - H}px;height:${H}px`;
  ecran.append(h('div', { class: 'voile-casc', id: 'voile-cats' }), col);
  rendreCascCat(); majChrome();
}
function rendreCascCat() {
  const col = $('#casc-cats'); if (!col) return;
  $$('.row', col).forEach((r, k) => r.classList.toggle('on', k === cascCat.i));
  $('#casc-sous')?.remove();
  if (cascCat.dans || cascCat.i >= 0) {
    const subs = CATS[cascCat.i][2], H = 8 + subs.length * 34, colTop = parseFloat(col.style.top);
    const top = Math.max(70, Math.min(colTop + 4 + cascCat.i * 34 - 4, 613.3 - H));
    const sc = h('div', { class: 'casc cats sous', id: 'casc-sous', style: `left:15px;width:196px;top:${top}px;height:${H}px` });
    subs.forEach((s, k) => sc.append(h('div', { class: 'row' + (cascCat.dans && k === cascCat.sous ? ' on' : '') }, h('b', {}, s))));
    if (!cascCat.dans) sc.style.opacity = '.0';
    ecran.append(sc);
  }
}
function suivreCascCat(p) {
  const c = cascCat, dy = p[1] - c.o[1];
  /* le trait latéral se mesure depuis le dernier mouvement vertical (BFGlisserRelatif.suivre) */
  if (c.der && Math.abs(p[1] - c.der[1]) > 1.5 * Math.abs(p[0] - c.der[0])) c.lx = p[0];
  c.der = p; const dx = p[0] - (c.lx ?? c.o[0]);
  if (!c.dans) {
    if (dx < -36) { c.dans = true; c.sous = 0; c.o = p.slice(); c.lx = p[0]; vibrer(3); rendreCascCat(); return; }
    const i = Math.max(0, Math.min(CATS.length - 1, (c.i0 ?? CATS.length - 1) + Math.round(dy / PAS)));
    if (i !== c.i) { c.i = i; vibrer(3); rendreCascCat(); }
  } else {
    if (dx > 28) { c.dans = false; c.i0 = c.i; c.o = p.slice(); c.lx = p[0]; vibrer(3); rendreCascCat(); return; }
    const n = CATS[c.i][2].length, s2 = Math.max(0, Math.min(n - 1, Math.round(dy / PAS)));
    if (s2 !== c.sous) { c.sous = s2; vibrer(3); rendreCascCat(); }
  }
}
function terminerCascCat() {
  const c = cascCat; if (!c) return;
  const k = CATS[c.i][0];
  if (c.dans) { cam.cat = k; cam.sub = CATS[c.i][2][c.sous]; vibrer([8, 30, 8]); }
  else if (k !== cam.cat) { cam.cat = k; if (!CATS[c.i][2].includes(cam.sub)) cam.sub = CATS[c.i][2][0]; vibrer([8, 30, 8]); }
  fermerCascCat(); majTitre();
}
function fermerCascCat() { cascCat = null; $('#casc-cats')?.remove(); $('#casc-sous')?.remove(); $('#voile-cats')?.remove(); majChrome(); }

/* ---------- 🏠/🌳 : toucher = bascule · maintenir 0,18 s = cascade des lieux (CS:1614-1954) ---------- */
let cascLieux = null, tLieux = null;
const rond = $('#lieux-rond');
const etagesDispo = ['ss', 'rdc', 'e1'];
rond.addEventListener('pointerdown', e => {
  if (cam.dictee && cam.dictee.origine !== 'fil') return;
  e.preventDefault(); rond.setPointerCapture(e.pointerId); fermerRaccourcis();
  const p0 = pt(e); rond.classList.add('presse', 'grand');
  tLieux = { p0, t0: performance.now(), minut: setTimeout(() => { tLieux.pret = true; ouvrirCascLieux(p0); }, 180) };
});
rond.addEventListener('pointermove', e => {
  if (!tLieux) return; const p = pt(e);
  if (!tLieux.pret) { if (Math.hypot(p[0] - tLieux.p0[0], p[1] - tLieux.p0[1]) > 12) { clearTimeout(tLieux.minut); tLieux = null; rond.classList.remove('presse', 'grand'); } return; }
  suivreCascLieux(p);
});
rond.addEventListener('pointerup', () => {
  if (!tLieux) return; clearTimeout(tLieux.minut); rond.classList.remove('presse');
  if (tLieux.pret) terminerCascLieux();
  else { rond.classList.remove('grand'); cam.bord = cam.bord === 'exterieur' ? 'interieur' : 'exterieur'; vibrer(4); majChrome(); }
  tLieux = null;
});
rond.addEventListener('pointercancel', () => { if (tLieux) { clearTimeout(tLieux.minut); fermerCascLieux(); tLieux = null; } });
function listeLieux() { return cam.bord === 'exterieur' ? EXTERIEUR : PIECES[cascLieux.etage]; }
function ouvrirCascLieux(p0) {
  vibrer(10);
  cascLieux = { etage: cam.lieu?.etage && cam.bord === 'interieur' ? cam.lieu.etage : 'rdc', i: 0, o: p0.slice(), lat: 0 };
  cascLieux.i = listeLieux().length - 1;
  rond.classList.add('actif'); rendreCascLieux(); majChrome();
}
function rendreCascLieux() {
  $('#casc-lieux')?.remove();
  const L = listeLieux(), int = cam.bord === 'interieur', H = 8 + (int ? 44 : 0) + L.length * 40;
  const col = h('div', { class: 'casc lieux', id: 'casc-lieux', style: `left:190px;width:204px;top:${613.3 - H}px;height:${H}px` });
  if (int) {
    const k = etagesDispo.indexOf(cascLieux.etage);
    col.append(h('div', { class: 'etage' }, h('span', { class: k > 0 ? '' : 'off' }, '‹'), ETAGES.find(x => x[0] === cascLieux.etage)[1], h('span', { class: k < etagesDispo.length - 1 ? '' : 'off' }, '›')));
  }
  L.forEach((n, k) => col.append(h('div', { class: 'row' + (k === cascLieux.i ? ' on' : '') }, n === 'Autre…' ? ic('micro', 12, 12) : null, h('b', {}, n))));
  ecran.append(col);
}
function suivreCascLieux(p) {
  const c = cascLieux, dy = p[1] - c.o[1];
  if (c.der && Math.abs(p[1] - c.der[1]) > 2.5 * Math.abs(p[0] - c.der[0])) c.lx = p[0];
  c.der = p; const dx = p[0] - (c.lx ?? c.o[0]);
  if (cam.bord === 'interieur' && Math.abs(dx) >= 28) {
    const k = etagesDispo.indexOf(c.etage) + (dx > 0 ? 1 : -1);
    if (k < 0 || k >= etagesDispo.length) vibrer([20, 40, 20]);
    else { c.etage = etagesDispo[k]; c.i = listeLieux().length - 1; vibrer(12); }
    c.o = p.slice(); c.lx = p[0]; rendreCascLieux(); return;
  }
  const n = listeLieux().length, i = Math.max(0, Math.min(n - 1, n - 1 + Math.round(dy / PAS)));
  if (i !== c.i) { c.i = i; vibrer(3); rendreCascLieux(); }
}
function terminerCascLieux() {
  const c = cascLieux; if (!c) return;
  const nom = listeLieux()[c.i], etage = c.etage;
  fermerCascLieux();
  if (nom === 'Autre…') return ouvrirLieuAutre(etage);
  poserLieu(nom, cam.bord, etage); vibrer([8, 30, 8]);
}
function fermerCascLieux() { cascLieux = null; $('#casc-lieux')?.remove(); rond.classList.remove('actif', 'grand', 'presse'); majChrome(); }
function poserLieu(nom, bord, etage) { cam.bord = bord; cam.lieu = { nom, bord, etage, caption: legende(nom, bord, etage) }; $('#lieux-panneau')?.remove(); majChrome(); }
/* panneau complet des lieux (CS:2620-2734) : toucher la pastille du lieu */
$('#lieu-pastille').addEventListener('click', () => ouvrirLesLieux());
function ouvrirLesLieux(bord = cam.lieu?.bord || cam.bord, etage = cam.lieu?.etage || 'rdc') {
  $('#lieux-panneau')?.remove(); vibrer(4);
  const p = h('div', { id: 'lieux-panneau' });
  const seg = h('div', { class: 'seg' },
    h('button', { class: bord === 'interieur' ? 'on' : '', onclick: () => ouvrirLesLieux('interieur', etage) }, ic('house2', 12, 11), 'Intérieur'),
    h('button', { class: bord === 'exterieur' ? 'on' : '', onclick: () => ouvrirLesLieux('exterieur', etage) }, ic('arbre', 11, 11), 'Extérieur'));
  p.append(h('div', { class: 'haut' }, seg, h('button', { class: 'x', 'aria-label': 'Fermer les lieux', onclick: () => { p.remove(); majChrome(); } }, ic('xmark', 12, 12))));
  if (bord === 'interieur') p.append(h('div', { class: 'etages' }, ...ETAGES.map(([k, l]) => h('button', { class: k === etage ? 'on' : '', onclick: () => ouvrirLesLieux('interieur', k) }, l))));
  const g = h('div', { class: 'grille' });
  (bord === 'interieur' ? GRILLE_INT : GRILLE_EXT).forEach(n => g.append(h('button', { class: 'lieu', onclick: () => { poserLieu(n, bord, etage); vibrer(6); } }, h('i', { class: 'r' }, ic(picto(n), 17, 17)), h('span', {}, n))));
  g.append(h('button', { class: 'lieu', onclick: () => { p.remove(); ouvrirLieuAutre(etage, bord); } }, h('i', { class: 'r' }, ic('micro', 17, 17)), h('span', {}, 'Autre')));
  p.append(g); $('#vf').append(p); majChrome();
}
/* « Autre » : QUELLE PIÈCE ? / QUEL ENDROIT ? (CS:2749-2826) */
function ouvrirLieuAutre(etage, bord = cam.bord) {
  const int = bord === 'interieur';
  const voile = h('div', { id: 'voile-autre', style: 'position:absolute;inset:0;background:rgba(0,0,0,.32);z-index:74' });
  const champ = h('input', { placeholder: int ? 'Atelier, véranda…' : 'Remise, clôture…', style: 'flex:1;min-width:0;height:42px;border-radius:21px;border:0;padding:0 14px;font:400 16px var(--sf);background:rgba(255,255,255,.12);color:#fff' });
  const fermer = () => { voile.remove(); boite.remove(); micro.arreter(true); };
  const micro = new Micro({ surTexte: t => { champ.value = t; } }); micro.demarrer();
  const boite = h('div', { style: 'position:absolute;left:36px;width:330px;top:300px;z-index:75;padding:16px;box-sizing:border-box;border-radius:24px;background:rgba(20,20,22,.94);color:#fff;display:flex;flex-direction:column;gap:12px' },
    h('div', { style: 'font:500 10px var(--mono);letter-spacing:1.6px;color:rgba(255,255,255,.6)' }, int ? 'QUELLE PIÈCE ?' : 'QUEL ENDROIT ?'),
    h('div', { style: 'display:flex;gap:8px' }, champ),
    h('div', { style: 'display:flex;gap:8px' },
      h('button', { style: 'flex:1;height:42px;border-radius:21px;background:rgba(255,255,255,.12);font-size:15px;font-weight:600', onclick: fermer }, 'Annuler'),
      h('button', { style: 'flex:1;height:42px;border-radius:21px;background:#fff;color:#000;font-size:15px;font-weight:600', onclick: () => { const v = champ.value.trim(); fermer(); if (v) poserLieu(v.replace(/^./, x => x.toUpperCase()), bord, etage); } }, 'Poser')));
  voile.onclick = fermer;
  ecran.append(voile, boite); champ.focus();
}

/* ---------- gestes du viseur : glisser ← = la Banque · double tap = Composantes (CS:11311-11362) ---------- */
(() => {
  const vf = $('#vf'); let d = null, dernierTap = 0;
  vf.addEventListener('pointerdown', e => { if (e.target.closest('#lieux-panneau, #lieu-pastille')) return; d = pt(e); fermerRaccourcis(); });
  vf.addEventListener('pointerup', e => {
    if (!d) return; const p = pt(e), dx = p[0] - d[0], dy = p[1] - d[1]; d = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) { if (dx < 0 && !cam.lot && !cam.dictee) { finGuide(); ouvrirBanque(); } return; }
    if (Math.hypot(dx, dy) < 10) { const t = performance.now(); if (t - dernierTap < 300) { dernierTap = 0; ouvrirComposantes(); } else dernierTap = t; }
  });
})();
function ouvrirComposantes() {
  vibrer(4);
  const systemes = CATS.filter(c => !['general'].includes(c[0]));
  const corps = h('div', { style: 'display:flex;flex-direction:column;gap:12px' });
  systemes.forEach(([k, l, subs]) => {
    corps.append(h('div', { class: 'tg' }, `${l} 0/${subs.length}`));
    corps.append(h('div', { class: 'groupe' }, ...subs.map(s => h('div', { class: 'r' }, h('div', { class: 'd' }, s), h('small', {}, '0/4')))));
  });
  const f = feuilleSys('Composantes du bâtiment', corps);
  f.querySelector('.nav b').append(h('small', { style: 'display:block;font-size:12px;font-weight:400;color:#8A8A8E' }, `0 / ${systemes.reduce((n, c) => n + c[2].length, 0)} fiches`));
}

/* ---------- ☰ tiroir « DOSSIER » (aibqTiroirDossier, CS:11056-11161 ; AIBQRaccourcisDossier.swift) ---------- */
$('#btn-tiroir').addEventListener('click', ouvrirTiroir);
(() => { /* glisser depuis le bord gauche */
  let x0 = null;
  ecran.addEventListener('pointerdown', e => { const p = pt(e); x0 = p[0] < 16 && !$('#calque') && !$('#feuille') && !$('#banque') ? p : null; }, true);
  ecran.addEventListener('pointermove', e => { if (!x0) return; const p = pt(e); if (p[0] - x0[0] > 30) { x0 = null; ouvrirTiroir(); } }, true);
})();
function ouvrirTiroir() {
  if ($('#tiroir')) return; finGuide();
  vibrer(10); fermerRaccourcis();
  const n = photosDuDossier(), m = dossier.constats.length;
  const res = `Préachat · ${n === 1 ? '1 photo' : n + ' photos'} · ${m === 1 ? '1 constat' : m + ' constats'}`;
  const notes = carnet => dossier.notes.filter(x => (x.carnet || null) === carnet).length;
  const lignes = [
    ['Notes inspecteur', 'tout le dossier, filtrable', 'notet', { cpt: notes(null) }, () => feuilleNotes(null)],
    ['Description du bâtiment', 'audio · photos · remplit le rapport', 'textephoto', { cpt: notes('Description du bâtiment') }, () => feuilleNotes('Description du bâtiment')],
    ['Composantes du bâtiment', 'audio · photos · notes libres', 'cube', { cpt: notes('Composantes du bâtiment') }, () => feuilleNotes('Composantes du bâtiment')],
    ['Fiche pré-achat', 'client · description · conditions', 'fiche', { rouge: 4 }, () => feuilleFichePreachat()],
    ['Déclaration du vendeur', 'points à vérifier', 'tdoc', {}, () => feuilleSys('Déclaration du vendeur', h('p', { class: 'vide' }, 'Dépose la déclaration du vendeur (ici ou au Mac) : ses points à valider apparaîtront ici.'))],
    ['Mécanique du bâtiment', 'eau · évacuation · panneau · chauffe-eau · thermopompe', 'cle', { txt: '0/5' }, () => feuilleMecanique()],
    ['Galerie', 'toutes les photos', 'galerie', {}, () => feuilleGalerie()],
    ['Documents, facture et relances', 'client · courtier · convention · facture', 'presse', {}, () => feuilleSys('Documents, facture et relances', h('div', { class: 'groupe' }, ...['Client', 'Courtier', 'Convention de service', 'Facture', 'Relances'].map(x => h('div', { class: 'r' }, h('div', { class: 'd' }, x), ic('chevr2', 8, 13)))))],
    ['Assistant IA', '« ouvre les constats de… » · à la voix', 'spark', {}, () => assistant()],
    ['Accueil', '', 'maison', {}, () => ouvrirAccueil()],
  ];
  const carte = h('div', { class: 'carte' });
  lignes.forEach(([t, s, i, b, action]) => carte.append(h('button', { class: 'ligne-t', onclick: () => { fermerTiroir(); setTimeout(action, 60); } },
    h('span', { class: 'ico' }, ic(i, 19, 19)), h('span', { class: 'tx' }, h('b', {}, t), s ? h('small', {}, s) : null),
    b.rouge ? h('span', { class: 'rouge', 'aria-label': `${b.rouge} en attente` }, b.rouge) : b.cpt ? h('span', { class: 'cpt' }, b.cpt) : b.txt ? h('span', { class: 'cpt' }, b.txt) : null,
    h('span', { class: 'chev' }, ic('chevr2', 7, 12)))));
  const tir = h('div', { id: 'tiroir' }, h('div', { class: 'dos' }, 'DOSSIER'), h('h3', {}, `${catLabel(cam.cat)} · ${cam.sub}`), h('div', { class: 'res' }, res), carte);
  let x0 = null;
  tir.addEventListener('pointerdown', e => { x0 = pt(e)[0]; });
  tir.addEventListener('pointerup', e => { if (x0 != null && pt(e)[0] - x0 < -40) fermerTiroir(); x0 = null; });
  ecran.append(h('div', { id: 'voile-tiroir', onclick: fermerTiroir }), tir);
}
function fermerTiroir() { $('#voile-tiroir')?.remove(); $('#tiroir')?.remove(); }
function feuilleNotes(carnet) {
  const L = dossier.notes.filter(x => carnet == null || x.carnet === carnet);
  const corps = L.length ? h('div', { class: 'groupe' }, ...L.map(n => h('div', { class: 'r' }, h('div', { class: 'd' }, n.texte || 'Photos seules', h('small', {}, `${n.carnet || 'Note interne'} · ${new Date(n.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} · ${n.photos.length === 1 ? '1 photo' : n.photos.length + ' photos'}`)))))
    : h('p', { class: 'vide' }, carnet ? `Aucune note dans « ${carnet} ». Touche ⚡ puis ce carnet pour en dicter une.` : 'Aucune note inspecteur. Touche ✏️ pour en dicter une : jamais au rapport.');
  feuilleSys(carnet || 'Notes inspecteur', corps);
}
function feuilleGalerie() {
  const ph = [...dossier.constats.flatMap(c => c.photos), ...dossier.notes.flatMap(n => n.photos)];
  feuilleSys('Galerie', ph.length ? h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:3px' }, ...ph.map(p => h('img', { src: p.url, alt: '', style: 'width:100%;aspect-ratio:1;object-fit:cover' }))) : h('p', { class: 'vide' }, 'Aucune photo dans ce dossier.'));
}
function feuilleFichePreachat() {
  const ch = (t, v) => h('div', { class: 'r' }, h('div', { class: 'd' }, t, h('small', {}, v || 'À compléter')));
  feuilleSys('Fiche pré-achat', h('div', { style: 'display:flex;flex-direction:column;gap:12px' },
    h('div', { class: 'tg' }, 'Client'), h('div', { class: 'groupe' }, ch('Nom du client'), ch('Courriel'), ch('Téléphone')),
    h('div', { class: 'tg' }, 'Description'), h('div', { class: 'groupe' }, ch('Adresse', `${dossier.adresse}, ${dossier.ville}`), ch('Type de bâtiment', 'Cottage'), ch('Année de construction')),
    h('div', { class: 'tg' }, 'Conditions'), h('div', { class: 'groupe' }, ch('Météo'), ch('Personnes présentes'))));
}
function feuilleMecanique() {
  feuilleSys('Mécanique du bâtiment', h('div', { class: 'groupe' }, ...['Entrée d’eau', 'Évacuation', 'Panneau électrique', 'Chauffe-eau', 'Thermopompe'].map(x => h('div', { class: 'r' }, h('div', { class: 'd' }, x, h('small', {}, 'À confirmer')), ic('chevr2', 8, 13)))));
}
function assistant() { toast('Assistant à l’écoute — dis « ouvre les constats de… »'); }
