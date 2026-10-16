// Bauskript: erzeugt aus src/ alle Endprodukte in dist/. Node 18+, keine Abhängigkeiten.
//   node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');

const CSS = ['styles/base.css', 'styles/layout.css', 'styles/uhr.css', 'styles/blatt.css'];
const JS = ['js/vendor/suncalc.js', 'js/core/lernzeit.js', 'js/core/worte.js', 'js/core/aufgaben.js',
  'js/ui/zustand.js', 'js/ui/layout.js', 'js/ui/uhr.js', 'js/ui/himmel.js', 'js/ui/ton.js',
  'js/ui/zeigen.js', 'js/ui/quiz.js', 'js/ui/sonne.js', 'js/ui/blatt.js', 'js/ui/app.js'];

export const PAKETE = [
  { datei: 'lernuhr-scorm', id: 'LERN_UHR_SCORM12', titel: 'Meine Lernuhr', item: 'Meine Lernuhr – zeigen, üben, Sonne', preset: null },
  { datei: 'lernuhr-quiz-volle-stunden', id: 'LERN_UHR_QUIZ_FULL', titel: 'Lernuhr – Quiz volle Stunden', preset: { bereich: 'quiz', stufe: 'full' } },
  { datei: 'lernuhr-quiz-halbe-stunden', id: 'LERN_UHR_QUIZ_HALF', titel: 'Lernuhr – Quiz halbe Stunden', preset: { bereich: 'quiz', stufe: 'half' } },
  { datei: 'lernuhr-quiz-viertelstunden', id: 'LERN_UHR_QUIZ_QUARTER', titel: 'Lernuhr – Quiz Viertelstunden', preset: { bereich: 'quiz', stufe: 'quarter' } },
  { datei: 'lernuhr-quiz-5-minuten', id: 'LERN_UHR_QUIZ_FIVE', titel: 'Lernuhr – Quiz 5 Minuten', preset: { bereich: 'quiz', stufe: 'five' } },
  { datei: 'lernuhr-quiz-alle-minuten', id: 'LERN_UHR_QUIZ_ANY', titel: 'Lernuhr – Quiz alle Minuten', preset: { bereich: 'quiz', stufe: 'any' } },
];

/* Lizenzierte Dateien: aus src/assets/ oder, falls dort nicht vorhanden, aus vorlage/index.html */
function assets() {
  const a = path.join(SRC, 'assets');
  const f = n => path.join(a, n);
  if (fs.existsSync(f('bayerndruck.ttf')) && fs.existsSync(f('metacom-sonne.png')) && fs.existsSync(f('metacom-mond.png'))) {
    return {
      font: fs.readFileSync(f('bayerndruck.ttf')).toString('base64'),
      sonne: 'data:image/png;base64,' + fs.readFileSync(f('metacom-sonne.png')).toString('base64'),
      mond: 'data:image/png;base64,' + fs.readFileSync(f('metacom-mond.png')).toString('base64'),
    };
  }
  const vorlage = path.join(ROOT, 'vorlage', 'index.html');
  if (!fs.existsSync(vorlage)) throw new Error('Schrift und METACOM-Symbole fehlen: src/assets/ füllen oder vorlage/index.html ablegen (siehe README).');
  const html = fs.readFileSync(vorlage, 'utf8');
  const font = /data:font\/ttf;base64,([A-Za-z0-9+/=]+)/.exec(html);
  const pngs = [...html.matchAll(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)].map(m => m[0]);
  if (!font || pngs.length < 2) throw new Error('vorlage/index.html enthält Schrift oder Symbole nicht.');
  return { font: font[1], sonne: pngs[0], mond: pngs[1] };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function seite({ titel, preset, scorm }, A) {
  let html = read('index.html');
  const css = CSS.map(read).join('\n');
  const js = JS.map(p => `/* ${p} */\n` + read(p)).join('\n');
  if (/<\/script/i.test(js)) throw new Error('Skript enthält </script>');
  const ersetze = (marke, wert) => { if (!html.includes(marke)) throw new Error('Marke fehlt: ' + marke); html = html.split(marke).join(wert); };
  ersetze('/*STYLE*/', css);
  ersetze('/*SCRIPT*/', js);
  ersetze('{{TITEL}}', esc(titel));
  ersetze('{{FONT_BAYERNDRUCK}}', A.font);
  ersetze('{{FONT_ZIFFERN}}', fs.readFileSync(path.join(SRC, 'assets', 'ziffern-atkinson.woff2')).toString('base64'));
  ersetze('{{METACOM_SONNE}}', A.sonne);
  ersetze('{{METACOM_MOND}}', A.mond);
  ersetze('<!--VOREINSTELLUNG-->', preset ? `<script>window.LERNUHR_VOREINSTELLUNG=${JSON.stringify(preset)};</script>` : '');
  ersetze('<!--SCORM-->', scorm ? '<script src="scorm.js"></script>' : '');
  return html;
}

/* ---------- ZIP (deflate, ohne Abhängigkeiten) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
export function zip(dateien) {
  const lokal = [], zentral = []; let off = 0;
  const d = new Date(), zeit = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), datum = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const [name, inhalt] of dateien) {
    const daten = Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt, 'utf8');
    const komp = zlib.deflateRawSync(daten, { level: 9 }), n = Buffer.from(name, 'utf8'), crc = crc32(daten);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt16LE(zeit, 10); h.writeUInt16LE(datum, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(komp.length, 18); h.writeUInt32LE(daten.length, 22);
    h.writeUInt16LE(n.length, 26); h.writeUInt16LE(0, 28);
    lokal.push(h, n, komp);
    const z = Buffer.alloc(46); z.writeUInt32LE(0x02014b50, 0); z.writeUInt16LE(20, 4); z.writeUInt16LE(20, 6); z.writeUInt16LE(0x0800, 8); z.writeUInt16LE(8, 10);
    z.writeUInt16LE(zeit, 12); z.writeUInt16LE(datum, 14); z.writeUInt32LE(crc, 16); z.writeUInt32LE(komp.length, 20); z.writeUInt32LE(daten.length, 24);
    z.writeUInt16LE(n.length, 28); z.writeUInt32LE(off, 42); zentral.push(z, n);
    off += 30 + n.length + komp.length;
  }
  const zb = Buffer.concat(zentral), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(dateien.length, 8); e.writeUInt16LE(dateien.length, 10); e.writeUInt32LE(zb.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...lokal, zb, e]);
}

function bauen() {
  const A = assets();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'scorm'), { recursive: true });
  const scormJs = read('scorm/scorm.js'), manifest = read('scorm/imsmanifest.xml');
  fs.writeFileSync(path.join(DIST, 'lernuhr.html'), seite({ titel: 'Meine Lernuhr', preset: null, scorm: false }, A));
  const liste = ['lernuhr.html'];
  for (const p of PAKETE) {
    const html = seite({ titel: p.titel, preset: p.preset, scorm: true }, A);
    const man = manifest.split('{{ID}}').join(p.id).split('{{TITEL}}').join(esc(p.titel)).split('{{ITEMTITEL}}').join(esc(p.item || p.titel));
    const ordner = path.join(DIST, 'scorm', p.datei);
    fs.mkdirSync(ordner, { recursive: true });
    fs.writeFileSync(path.join(ordner, 'index.html'), html);
    fs.writeFileSync(path.join(ordner, 'scorm.js'), scormJs);
    fs.writeFileSync(path.join(ordner, 'imsmanifest.xml'), man);
    fs.writeFileSync(path.join(DIST, p.datei + '.zip'), zip([['imsmanifest.xml', man], ['index.html', html], ['scorm.js', scormJs]]));
    liste.push(p.datei + '.zip');
  }
  for (const n of liste) console.log(String(Math.round(fs.statSync(path.join(DIST, n)).size / 1024)).padStart(5) + ' KB  dist/' + n);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) bauen();
