// Ersatzprüfung mit der WebKit-Engine (WebKitGTK über WebKitWebDriver), weil der Playwright-WebKit-
// Download in der Bauumgebung gesperrt war. WebKitGTK ist dieselbe Engine-Familie wie Safari, aber
// nicht Safari auf dem iPad.
//   sudo apt install webkit2gtk-driver xvfb
//   xvfb-run -a node scripts/pruefen-webkit.mjs
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { IM_APP } from './pruef-app.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SCREENS = path.join(ROOT, 'docs', 'screens');
const ergebnisse = [];
const pruefe = (gruppe, name, ok, info = '') => { ergebnisse.push({ gruppe, name, ok: !!ok, info: String(info || '') }); console.log(`${ok ? 'OK  ' : 'FEHL'} [${gruppe}] ${name}${info ? ' – ' + info : ''}`); };
const pause = ms => new Promise(r => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/rahmen.html') { res.setHeader('content-type', 'text/html'); return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}.bar{height:48px;background:#0b3d6b}iframe{display:block;border:0;width:100%;height:calc(100% - 48px)}</style></head><body><div class="bar"></div><iframe id="app" src="/lernuhr.html"></iframe></body></html>`); }
  if (p === '/lernuhr.html') { res.setHeader('content-type', 'text/html'); return res.end(fs.readFileSync(path.join(DIST, 'lernuhr.html'))); }
  res.statusCode = 404; res.end();
}).listen(0);
const BASIS = `http://127.0.0.1:${server.address().port}`;

const PORT = 4444 + Math.floor(Math.random() * 1000);
const treiber = spawn('WebKitWebDriver', [`--port=${PORT}`], { stdio: 'ignore' });
await pause(800);
async function wd(methode, pfad, body) {
  const r = await fetch(`http://127.0.0.1:${PORT}${pfad}`, { method: methode, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); if (j.value && j.value.error) throw new Error(j.value.error + ': ' + j.value.message); return j.value;
}
const binary = ['/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser', '/usr/lib/x86_64-linux-gnu/webkit2gtk-4.0/MiniBrowser'].find(f => fs.existsSync(f));
let sitzung;
try {
  sitzung = await wd('POST', '/session', { capabilities: { alwaysMatch: { 'webkitgtk:browserOptions': { binary, args: ['--automation'] } } } });
} catch (e) { console.error('WebKitWebDriver startet nicht:', e.message); treiber.kill(); server.close(); process.exit(2); }
const S = `/session/${sitzung.sessionId}`;
const version = sitzung.capabilities && (sitzung.capabilities.browserVersion || '');
const js = (code, args = []) => wd('POST', `${S}/execute/sync`, { script: code, args });
const app = (fn, ...args) => js(`return (${fn.toString()}).apply(null, arguments);`, args);

async function geraet(name, breite, hoehe) {
  await wd('POST', `${S}/window/rect`, { width: breite, height: hoehe + 400 });
  // Fensterhöhe so anpassen, dass der Inhalt die gewünschte Größe hat
  await wd('POST', `${S}/url`, { url: `${BASIS}/rahmen.html` }); await pause(800);
  const innen = await js('return [innerWidth, innerHeight, outerWidth, outerHeight];');
  await wd('POST', `${S}/window/rect`, { width: breite + (innen[2] - innen[0]), height: hoehe + (innen[3] - innen[1]) }); await pause(500);
  const ist = await js('return [innerWidth, innerHeight];');
  await wd('POST', `${S}/frame`, { id: 0 }); await pause(600);
  await js(`window.__fehler=[];window.addEventListener('error',e=>__fehler.push(e.message));(${IM_APP.toString()})();return 1;`);
  const uhren = [], gruppe = `webkit-${name}`;
  pruefe(gruppe, `Fenster ${ist[0]}×${ist[1]} (App ${ist[0]}×${ist[1] - 48}), Layout ${await js('return document.getElementById("app").dataset.profil+"/"+document.getElementById("app").dataset.lage;')}`, true);
  async function schritt(n) {
    await pause(250);
    const lay = await js('return __pruef.layout();'), gr = await js('return __pruef.groessen("tablet");');
    pruefe(gruppe, `${n}: kein Scrollen, nichts ragt heraus`, lay.length === 0, lay.slice(0, 3).join('; '));
    pruefe(gruppe, `${n}: Mindestgrößen`, gr.length === 0, gr.slice(0, 3).join('; '));
    uhren.push(await js('return __pruef.uhr();'));
    await wd('POST', `${S}/frame/parent`, {});
    const b64 = await wd('GET', `${S}/screenshot`);
    fs.writeFileSync(path.join(SCREENS, `${gruppe}-${n}.png`), Buffer.from(b64, 'base64'));
    await wd('POST', `${S}/frame`, { id: 0 });
  }
  await app(() => { LU.s.hilfen.worte = true; LU.s.form = 'beide'; LU.s.start = LU.s.instant - 75 * 60000; LU.zeichne(); });
  await schritt('zeigen');
  await app(() => { LU.wechsle('quiz'); LU.zeichne(); }); await schritt('quiz-start');
  await app(() => { LU.quiz.weiter(); LU.s.anim.rate = 1e6; }); await pause(400);
  await app(() => LU.zeichne()); await schritt('quiz-frage');
  await app(() => { const q = LU.s.quiz; const f = q.optionen.filter(v => v !== q.antwort).slice(0, 2); for (const v of f) document.querySelector(`.antwort[data-v="${v}"]`).click(); LU.zeichne(); });
  await schritt('quiz-falsch');
  await app(() => { document.querySelector(`.antwort[data-v="${LU.s.quiz.antwort}"]`).click(); }); await pause(1600);
  await app(() => LU.zeichne()); await schritt('quiz-richtig');
  await app(() => { LU.quiz.weiter(); LU.zeichne(); }); await schritt('quiz-dauer');
  await app(() => { LU.einst.antworten = 'schwer'; LU.quiz.neu(); LU.quiz.weiter(); LU.s.anim.rate = 1e6; }); await pause(400);
  await app(() => LU.zeichne()); await schritt('quiz-schwer');
  await app(() => { LU.einst.aufgabe = 'worte'; LU.einst.stufe = 'five'; LU.quiz.neu(); LU.quiz.weiter(); LU.s.anim.rate = 1e6; }); await pause(400);
  await app(() => LU.zeichne()); await schritt('quiz-wortbausteine');
  await app(() => { LU.einst.aufgabe = 'zahlen'; LU.einst.antworten = 'leicht'; LU.einst.stufe = 'full'; LU.wechsle('sonne'); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 18 * 60 + 15, LU.zone()); LU.zeichne(); });
  await schritt('sonne');
  await app(() => { LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 20 * 60, LU.zone()); LU.s.sonne.vergleich = true; LU.zeichne(); });
  await schritt('sonne-vergleich');
  await app(() => { LU.blatt.oeffnen(); }); await schritt('einstellungen');
  const v = [...new Set(uhren)];
  pruefe(gruppe, `Uhr in ${uhren.length} Schritten an derselben Stelle (${v[0]})`, v.length === 1, v.join(' | '));
  // Touch-Ziehen über WebDriver-Aktionen (Zeigertyp touch), falls WebKitGTK es unterstützt
  await app(() => { LU.blatt.schliessen(); LU.wechsle('zeigen'); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 9 * 60, LU.zone()); LU.zeichne(); });
  const r = await js('const r=document.getElementById("uhr").getBoundingClientRect();return [r.x,r.y,r.width,r.height];');
  // WebDriver-Koordinaten beziehen sich auf das Hauptfenster: Versatz des iframes addieren
  await wd('POST', `${S}/frame/parent`, {});
  const fr = await js('const r=document.getElementById("app").getBoundingClientRect();return [r.x,r.y];');
  await wd('POST', `${S}/frame`, { id: 0 });
  const cx = Math.round(fr[0] + r[0] + r[2] / 2), cy = Math.round(fr[1] + r[1] + r[3] / 2), rad = r[2] / 234 * 70;
  const zuege = [{ type: 'pointerMove', duration: 0, x: cx, y: Math.round(cy - rad) }, { type: 'pointerDown', button: 0 }];
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI / 2; zuege.push({ type: 'pointerMove', duration: 30, x: Math.round(cx + rad * Math.sin(a)), y: Math.round(cy - rad * Math.cos(a)) }); }
  zuege.push({ type: 'pointerUp', button: 0 });
  let artTouch = 'touch';
  try { await wd('POST', `${S}/actions`, { actions: [{ type: 'pointer', id: 'finger', parameters: { pointerType: 'touch' }, actions: zuege }] }); }
  catch (e) { artTouch = 'mouse'; await wd('POST', `${S}/actions`, { actions: [{ type: 'pointer', id: 'maus', parameters: { pointerType: 'mouse' }, actions: zuege }] }); }
  await pause(200);
  const zeit = await js('return document.getElementById("digital-zeit").textContent;');
  pruefe(gruppe, `Zeiger ziehen (${artTouch === 'touch' ? 'Touch' : 'Maus, Touch nicht unterstützt'}) von 9:00 auf 9:15`, zeit === '09:15', zeit);
  const fehler = await js('return window.__fehler;');
  pruefe(gruppe, 'Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));
  await wd('POST', `${S}/frame/parent`, {});
}

try {
  await geraet('ipad-quer', 1000, 700);
  await geraet('ipad-hoch', 760, 1000);
} finally {
  try { await wd('DELETE', S); } catch (_) {}
  treiber.kill(); server.close();
}
const fehl = ergebnisse.filter(e => !e.ok);
let md = `# Prüfbericht WebKit (Ersatz für Safari)\n\nWebKitGTK ${version} über WebKitWebDriver, MiniBrowser unter Xvfb. Dieselbe Engine-Familie wie Safari, aber nicht Safari auf dem iPad. **${ergebnisse.length - fehl.length} von ${ergebnisse.length} Prüfungen bestanden.**\n\n| | Prüfung | Hinweis |\n|---|---|---|\n`;
for (const e of ergebnisse) md += `| ${e.ok ? '✅' : '❌'} | [${e.gruppe}] ${e.name.replace(/\|/g, '/')} | ${e.info.replace(/\|/g, '/')} |\n`;
fs.writeFileSync(path.join(ROOT, 'docs', 'pruefbericht-webkit.md'), md);
console.log(`\n${ergebnisse.length - fehl.length}/${ergebnisse.length} bestanden. Bericht: docs/pruefbericht-webkit.md`);
process.exitCode = fehl.length ? 1 : 0;
