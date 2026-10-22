/* Partie 3 : le parcours guidé de l'essai (propre au site, pas à l'app).
   Accueil « 60 secondes » → 1. photo → 2. note vocale → 3. scène de rédaction → aperçu du rapport.
   Branché sur l'app par quatre crochets : parcoursPhoto (lotAjouter), parcoursDictee (maintienDebut),
   parcoursConstat (capsuleStop) et parcoursDemarrer (démarrage). */

const MAIN_MINUTES = 4;            /* temps de rédaction à la main d'un constat, affiché en comparaison */
const NB_BANQUE = BANQUE ? BANQUE.length : 1569;
const EXEMPLES = [
  'La pente du terrain descend vers la maison, côté avant.',
  'Fissure en escalier dans le mur de fondation, coin arrière gauche.',
  'Le bardeau de toiture est gondolé, il manque des granules.',
];
/* AIBQStyle.teinteGravite : fond et encre de la pastille au rapport */
const TEINTE = { correctif: ['#fff3e8', '#8a4306'], expertise: ['#fff3e8', '#8a4306'], attention: ['#fff6d4', '#9a7400'], suivi: ['#fff6d4', '#9a7400'], securite: ['#fdecec', '#c62828'], urgent: ['#fdecec', '#c62828'] };
const teinte = g => TEINTE[g] || ['#e9e9ee', '#6e6e73'];

let P = null;   /* { etape: 1|2|3, t0, c } tant que le parcours est en cours */
const parcoursActif = () => !!P && P.etape < 3;

/* ---------- accueil ---------- */
function parcoursDemarrer() {
  guide(null);
  const el = h('div', { id: 'intro' },
    h('div', { class: 'carte' },
      h('div', { class: 'marque' }, h('i'), h('b', {}, 'BatiFlow'), h('span', {}, 'ESSAI · 60 SECONDES')),
      h('h1', {}, 'Rédige ton premier constat d’inspection en moins d’une minute.'),
      h('ol', {},
        h('li', {}, h('span', { class: 'n' }, '1'), h('div', {}, h('b', {}, 'Prends une photo'), h('small', {}, 'Un mur, un plancher, une fenêtre… ou la photo d’exemple.'))),
        h('li', {}, h('span', { class: 'n' }, '2'), h('div', {}, h('b', {}, 'Décris ce que tu vois'), h('small', {}, 'Maintiens le déclencheur et parle, comme sur un chantier.'))),
        h('li', {}, h('span', { class: 'n' }, '3'), h('div', {}, h('b', {}, 'BatiFlow rédige'), h('small', {}, `Un constat complet dans le style de la banque AIBQ, prêt pour le rapport.`)))),
      h('button', { class: 'go', onclick: () => { el.remove(); parcoursEtape1(); } }, 'Commencer'),
      h('button', { class: 'libre', onclick: () => { el.remove(); P = null; guideVu = false; guide('Touchez : photo · Maintenez : note vocale'); } }, 'Explorer l’app librement')));
  ecran.append(el);
}

/* ---------- le coach : un anneau sur la commande et une bulle d'explication ---------- */
function coach({ cible, etape, titre, texte, haut }) {
  $('#coach')?.remove();
  if (!cible) return;
  const b = $(cible).getBoundingClientRect(), E = ecran.getBoundingClientRect(), s = E.width / 402;
  const x = (b.left - E.left) / s, y = (b.top - E.top) / s, w = b.width / s, hh = b.height / s;
  const el = h('div', { id: 'coach' },
    h('div', { class: 'anneau', style: `left:${x - 7}px;top:${y - 7}px;width:${w + 14}px;height:${hh + 14}px` }),
    h('div', { class: 'bulle-coach', style: `bottom:${874 - haut}px` },
      h('div', { class: 'tete' }, h('span', { class: 'et' }, `Étape ${etape} sur 3`), h('span', { class: 'pts' }, ...[1, 2, 3].map(k => h('i', { class: k <= etape ? 'on' : '' }))),
        h('button', { class: 'quitter', 'aria-label': 'Quitter le parcours', onclick: parcoursQuitter }, ic('xmark', 12, 12))),
      h('b', {}, titre), h('p', {}, texte),
      h('span', { class: 'fl', style: `left:${Math.min(Math.max(x + w / 2 - 12, 22), 380 - 22) - 12}px` })));
  ecran.append(el);
}
function parcoursQuitter() { P = null; $('#coach')?.remove(); $$('.bulle-parcours .consigne, .bulle-parcours .exemples').forEach(x => x.remove()); toast('Parcours quitté — l’app est à toi'); }

function parcoursEtape1() {
  P = { etape: 1, t0: performance.now(), c: null };
  coach({ cible: '#shutter', etape: 1, titre: 'Prends une photo', texte: 'Vise un mur, un plancher ou une fenêtre, puis touche le déclencheur. Pas de caméra ? La photo d’exemple fera l’affaire.', haut: 600 });
}
function parcoursPhoto() {
  if (!parcoursActif() || P.etape !== 1 || cam.dictee) return;
  P.etape = 2;
  coach({ cible: '#shutter', etape: 2, titre: 'Maintiens le déclencheur et décris ce que tu vois', texte: 'Garde le doigt appuyé, puis parle normalement : « La pente du terrain descend vers la maison, côté avant. »', haut: 600 });
  $('#coach').classList.add('maintien');
}
/* pendant la note vocale : la bulle de dictée porte la consigne, l'anneau passe sur Stop */
function parcoursDictee() {
  if (!parcoursActif()) return;
  P.etape = 2;
  coach({ cible: '#btn-droite', etape: 2, titre: '', texte: '', haut: 0 });
  $('#coach .bulle-coach')?.remove();
  const b = cam.dictee.bulle || bulleCamera('Dis ce que tu vois, et où.');
  cam.dictee.bulle = b;
  b.classList.add('bulle-parcours');
  b.insertBefore(h('div', { class: 'consigne' }, h('span', { class: 'et' }, 'Étape 2 sur 3'), 'Décris ce que tu vois, puis touche ', h('b', {}, 'Arrêter'), '.'), b.firstChild);
  b.insertBefore(h('div', { class: 'exemples' }, h('small', {}, 'Pas d’idée ? Touche un exemple :'),
    ...EXEMPLES.map(t => h('button', { onclick: () => { const z = b.querySelector('textarea'); z.hidden = false; b.querySelector('.tx').hidden = true; z.value = t; b.titre('Exemple choisi — touche Arrêter'); } }, t))), b.querySelector('.act'));
}
/* Arrêter : au lieu d'ouvrir l'onglet Constats, la rédaction se joue devant le visiteur */
function parcoursConstat(c) {
  if (!parcoursActif()) return false;
  P.etape = 3; P.c = c; $('#coach')?.remove();
  sceneRedaction(c);
  return true;
}

/* ---------- 3. la scène de rédaction ---------- */
const attendre = ms => new Promise(ok => setTimeout(ok, ms));
function taper(el, texte, ms) {
  return new Promise(ok => {
    const t0 = performance.now(), n = texte.length;
    const pas = () => { const k = Math.min(n, Math.ceil((performance.now() - t0) / ms * n)); el.textContent = texte.slice(0, k); if (k < n) requestAnimationFrame(pas); else ok(); };
    pas();
  });
}
async function sceneRedaction(c) {
  if (!c.photos.length) { const p = await prendrePhoto(); p.lieu = c.lieu; c.photos.push(p); }
  const ligne = (titre) => { const d = h('div', { class: 'etape-ia' }, h('span', { class: 'rond' }), h('div', {}, h('b', {}, titre), h('small'))); return d; };
  const l1 = ligne('Parole comprise'), l2 = ligne('Banque AIBQ consultée'), l3 = ligne('Rédaction du constat');
  const carte = h('div', { class: 'res', hidden: true });
  const pied = h('div', { class: 'pied', hidden: true });
  const el = h('div', { id: 'scene-ia' },
    h('div', { class: 'haut' }, h('span', { class: 'et' }, 'Étape 3 sur 3'), h('b', {}, 'BatiFlow rédige ton constat')),
    h('div', { class: 'dit' }, h('img', { src: c.photos[0].url, alt: '' }), h('div', {}, h('small', {}, 'Ce que tu as dit'), h('q', {}, c.dictee))),
    h('div', { class: 'etapes' }, l1, l2, l3), carte, pied);
  ecran.append(el);
  const fait = (l, detail) => { l.classList.remove('cours'); l.classList.add('fait'); l.querySelector('.rond').replaceChildren(ic('check', 12, 12)); if (detail != null) l.querySelector('small').textContent = detail; };
  const encours = (l, detail) => { l.classList.add('cours'); if (detail != null) l.querySelector('small').textContent = detail; };

  /* la carte du constat se remplit pendant que l'IA écrit (flux), champ par champ, curseur au bout */
  const sev = h('span', { class: 'sev', hidden: true }), sec = h('span', { class: 'sec' }, `${catLabel(c.cat)} › ${c.sub}`);
  const tT = h('b', { class: 'ti' }), tC = h('p'), tRi = h('i'), tR = h('div', { class: 'reco', hidden: true }, h('span', {}, '→ '), tRi);
  carte.append(h('div', { class: 'tete' }, sev, sec), tT, tC, tR);
  const poserSev = g => { if (!GRAV[g]) return; const [fond, encre] = teinte(g); sev.textContent = GRAV[g][0]; sev.style.cssText = `background:${fond};color:${encre}`; sev.hidden = false; };
  const montrerCarte = () => { if (!carte.hidden) return; carte.hidden = false; carte.classList.add('attente'); requestAnimationFrame(() => carte.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); };
  let enFlux = false;
  const surFlux = part => {
    if (!enFlux) { enFlux = true; encours(l3, 'L’IA écrit…'); }
    montrerCarte(); carte.classList.remove('attente');
    poserSev(part.gravite);
    const k = catParLabel(part.section); if (k) sec.textContent = `${k[1]} › ${part.sous_section || ''}`;
    tT.textContent = part.titre || ''; tC.textContent = part.constat || '';
    if (part.recommandation) { tR.hidden = false; tRi.textContent = part.recommandation; }
    const courant = ['recommandation', 'constat', 'titre'].find(f => part[f] != null);
    [tT, tC, tRi].forEach(x => x.classList.remove('curseur'));
    if (courant && !part.fini[courant]) ({ titre: tT, constat: tC, recommandation: tRi })[courant].classList.add('curseur');
  };

  const redaction = rediger(c.dictee, { cat: c.cat, sub: c.sub, surFlux });
  encours(l1); await attendre(250);
  fait(l1, `${c.dictee.split(/\s+/).filter(Boolean).length} mots · ${c.duree} s de dictée`);
  encours(l2, `${NB_BANQUE.toLocaleString('fr-CA')} constats types`); await attendre(350);
  const proches = BANQUE ? candidats(c.dictee, 3).map(x => x.e.t) : [];
  fait(l2, `${NB_BANQUE.toLocaleString('fr-CA')} constats types · ${proches.length ? 'les plus proches :' : 'comparés à ta phrase'}`);
  if (proches.length) l2.lastChild.append(h('div', { class: 'proches' }, ...proches.map(t => h('span', {}, t))));
  if (!enFlux) { encours(l3, 'Style, gravité, recommandation…'); montrerCarte(); }
  const r = await redaction;
  if (!proches.length && r?.proches?.length) { fait(l2, `${NB_BANQUE.toLocaleString('fr-CA')} constats types · les plus proches :`); l2.lastChild.append(h('div', { class: 'proches' }, ...r.proches.slice(0, 3).map(t => h('span', {}, t)))); }
  const res = r || { src: 'brouillon', cat: c.cat, sub: c.sub, gravite: 'correctif', titre: c.dictee.split(/[.,;]/)[0].slice(0, 60), constat: 'Nous avons constaté ' + c.dictee.charAt(0).toLowerCase() + c.dictee.slice(1), reco: 'Faire évaluer la situation par un entrepreneur qualifié.', lieu: '' };
  Object.assign(c, { cat: res.cat, sub: res.sub, titre: res.titre, constat: res.constat, reco: res.reco, gravite: res.gravite, statut: 'valider', iaSrc: res.src, lieu: c.lieu || res.lieu });
  const secondes = Math.max(1, Math.round((performance.now() - P.t0) / 1000));
  P.secondes = secondes;
  fait(l3, res.src === 'ia' ? 'Rédigé par l’IA dans le style de la banque' : res.src === 'banque' ? 'Tiré du constat type le plus proche' : 'Brouillon à compléter');
  majChrome();

  /* texte final (identique au flux quand l'IA a écrit ; sinon, il s'écrit vite sous les yeux) */
  carte.classList.remove('attente'); [tT, tC, tRi].forEach(x => x.classList.remove('curseur'));
  poserSev(c.gravite); sec.textContent = `${catLabel(c.cat)} › ${c.sub}`;
  if (enFlux) { tT.textContent = c.titre; tC.textContent = c.constat; tRi.textContent = c.reco; tR.hidden = !c.reco; }
  else {
    await taper(tT, c.titre, 250);
    await taper(tC, c.constat, Math.min(700, 6 * c.constat.length));
    tR.hidden = !c.reco; if (c.reco) await taper(tRi, c.reco, Math.min(450, 5 * c.reco.length));
  }
  vibrer(14);
  pied.append(
    h('div', { class: 'chrono' }, ic('clock', 18, 18), h('div', {}, h('b', {}, `${secondes} s`), h('small', {}, 'de la photo au constat rédigé')),
      h('div', { class: 'vs' }, h('b', {}, `~${MAIN_MINUTES} min`), h('small', {}, 'à la main'))),
    h('button', { class: 'go', onclick: () => { el.remove(); ouvrirRapport(c); } }, 'Voir mon rapport', ic('chevr2', 16, 16)));
  pied.hidden = false;
  requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
}

/* ---------- l'aperçu du rapport : la carte au gabarit AIBQCarteRapport ---------- */
function ouvrirRapport(c) {
  $('#rapport')?.remove();
  const ic0 = CATS.findIndex(x => x[0] === c.cat), cat = CATS[ic0], is = cat ? Math.max(0, cat[2].indexOf(c.sub)) : 0;
  const no = `${ic0 + 1}.${is + 1}`;
  const [fond, encre] = teinte(c.gravite);
  const d = new Date(), date = d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  const photo = c.photos[0];
  const annoter = () => { $('#rapport')?.remove(); ouvrirAnnotation(photo, () => ouvrirRapport(c)); };
  const el = h('div', { id: 'rapport' },
    h('div', { class: 'barre' }, h('button', { 'aria-label': 'Fermer', onclick: () => fermerRapport(c) }, ic('xmark', 14, 14)), h('b', {}, 'Ce que ton client reçoit'), h('span')),
    h('div', { class: 'defile' },
      h('div', { class: 'papier' },
        h('div', { class: 'entete-r' }, h('small', {}, 'RAPPORT D’INSPECTION PRÉACHAT'), h('h2', {}, dossier.adresse), h('span', {}, `${dossier.ville} · ${date}`)),
        h('div', { class: 'sec' }, h('b', {}, `${ic0 + 1} · ${catLabel(c.cat)}`), h('span', {}, `${no} · ${c.sub}`)),
        h('div', { class: 'cb' },
          h('div', { class: 'cb-head' }, h('span', { class: 'sev', style: `background:${fond};color:${encre}` }, GRAV[c.gravite][0]), h('span', { class: 'code' }, `${no}-1`), h('span', { class: 'sp' }),
            h('span', { class: 'etq' }, ic('check', 9, 9), 'au rapport')),
          h('b', { class: 'ti' }, c.titre), h('p', {}, c.constat),
          c.reco ? h('div', { class: 'reco' }, h('span', {}, '→ '), h('i', {}, c.reco)) : null,
          h('div', { class: 'lieu' }, `📍 ${c.lieu || 'Lieu non précisé'} · relevé par toi`),
          h('div', { class: 'ph-rapport' }, h('button', { class: 'ph', 'aria-label': 'Annoter la photo', onclick: annoter }, h('img', { src: photo.url, alt: 'Photo du constat' })),
            photo.legende ? h('small', {}, photo.legende) : null,
            h('button', { class: 'annoter' + (photo.traits?.length ? ' fait' : ''), onclick: annoter }, ic('pencil', 12, 12), photo.traits?.length ? 'Modifier l’annotation' : 'Entoure le problème sur la photo'))),
        h('div', { class: 'suite', 'aria-hidden': 'true' }, h('i', { style: 'width:62%' }), h('i', { style: 'width:88%' }), h('i', { style: 'width:74%' }), h('i', { style: 'width:40%' })),
        h('div', { class: 'pied-papier' }, 'Préparé avec BatiFlow · banque de constats AIBQ')),
      h('div', { class: 'appel' },
        h('b', {}, `Ce constat t’a pris ${P?.secondes || '…'} secondes.`),
        h('p', {}, 'Une inspection en compte des dizaines. Imagine le rapport complet, rédigé pendant que tu inspectes.'),
        h('button', { class: 'go', onclick: () => toast('Le PDF par courriel arrive avec le formulaire du site') }, 'Recevoir ce rapport en PDF'),
        h('button', { class: 'sec2', onclick: () => fermerRapport(c) }, 'Explorer BatiFlow librement'),
        h('button', { class: 'lien', onclick: () => { el.remove(); parcoursEtape1(); } }, 'Refaire un constat'))));
  ecran.append(el);
}
function fermerRapport(c) { $('#rapport')?.remove(); P = null; dernierId = c.id; majChrome(); ouvrirOnglet('chat', c.id); }

/* ---------- sur ordinateur : barre d'état d'iPhone + panneau « Essaie-le sur ton téléphone » ---------- */
const SITE = 'https://essai.batiflow.app/';   /* adresse publique ; dans l'aperçu claude.ai, le QR y mène */
function codeQR(texte) {
  const q = qrcode(0, 'M'); q.addData(texte); q.make();
  const n = q.getModuleCount(); let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `-2 -2 ${n + 4} ${n + 4}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Code QR vers ' + texte);
  const fond = document.createElementNS(svg.namespaceURI, 'rect'); fond.setAttribute('x', -2); fond.setAttribute('y', -2); fond.setAttribute('width', n + 4); fond.setAttribute('height', n + 4); fond.setAttribute('fill', '#fff');
  const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', d); path.setAttribute('fill', '#111214');
  svg.append(fond, path); return svg;
}
function poserBureau() {
  if (INTEGRE) { ecran.append(h('div', { id: 'ile', 'aria-hidden': 'true' }), h('div', { id: 'barre-etat', 'aria-hidden': 'true' }, h('b', {}, '9:41'), h('span', { class: 'ind' }, h('i', { class: 'reseau' }, h('i'), h('i'), h('i'), h('i')), h('i', { class: 'pile' }, h('i'))))); return; }
  const adresse = window.self === window.top && location.protocol.startsWith('http') ? location.href : SITE;
  ecran.append(h('div', { id: 'ile', 'aria-hidden': 'true' }), h('div', { id: 'barre-etat', 'aria-hidden': 'true' }, h('b', {}, '9:41'),
    h('span', { class: 'ind' }, h('i', { class: 'reseau' }, h('i'), h('i'), h('i'), h('i')), h('i', { class: 'pile' }, h('i')))));
  document.body.append(h('aside', { id: 'panneau-bureau' },
    h('div', { class: 'marque' }, h('i'), h('b', {}, 'BatiFlow')),
    h('h1', {}, 'Essaie-le sur ton téléphone.'),
    h('p', {}, 'Scanne ce code avec l’appareil photo de ton iPhone : la caméra et la dictée y fonctionnent pour vrai. Ou fais l’essai ici, à la souris.'),
    h('div', { class: 'qr' }, codeQR(adresse)),
    h('small', {}, adresse.replace(/^https?:\/\//, '').replace(/\/$/, '')),
    h('ul', {}, h('li', {}, 'Rien à installer'), h('li', {}, 'Un constat AIBQ en 60 secondes'), h('li', {}, 'Rédigé par l’IA, dans le style de la banque'))));
}
poserBureau();

/* ---------- démarrage ---------- */
parcoursDemarrer();
