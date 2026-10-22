// Produit section-essai.html (le bloc à coller dans la vitrine batiflow.app) à partir de modele-section.html :
// l'adresse de l'essai et son code QR (SVG statique, rien à charger sur le site).
//   node fabriquer.mjs [https://essai.batiflow.app/]
import fs from 'node:fs';
import { createRequire } from 'node:module';
const ESSAI = process.argv[2] || 'https://essai.batiflow.app/';
const qrcode = createRequire(import.meta.url)('../src/vendor/qrcode.js');
const q = qrcode(0, 'M'); q.addData(ESSAI); q.make();
const n = q.getModuleCount(); let d = '';
for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
const svg = `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="Code QR vers ${ESSAI}"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#111214"/></svg>`;
const ici = new URL('.', import.meta.url);
const html = fs.readFileSync(new URL('modele-section.html', ici), 'utf8').replaceAll('__ESSAI__', ESSAI).replace('__QR__', svg);
fs.writeFileSync(new URL('section-essai.html', ici), html);
console.log('section-essai.html', Math.round(html.length / 1024), 'Ko →', ESSAI);
