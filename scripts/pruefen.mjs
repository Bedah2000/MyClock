// Prüfung mit Playwright und Touch-Emulation, App jeweils im iframe als Nachbildung des mebis-Rahmens.
//   npm run build && npm run pruefen
// Playwright wird lokal (npm i --no-save playwright) oder global gesucht.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SCREENS = path.join(ROOT, 'docs', 'screens');
const require = createRequire(import.meta.url);
function ladePlaywright() {
  try { return require('playwright'); } catch (_) {}
  const global = execSync('npm root -g').toString().trim();
  return require(path.join(global, 'playwright'));
}
const { chromium } = ladePlaywright();
const PAKETE = (await import('./build.mjs')).PAKETE;

/* ---------- Ergebnisse ---------- */
const ergebnisse = [];
function pruefe(gruppe, name, ok, info = '') {
  ergebnisse.push({ gruppe, name, ok: !!ok, info: String(info || '') });
  console.log(`${ok ? 'OK  ' : 'FEHL'} [${gruppe}] ${name}${info ? ' – ' + info : ''}`);
}

/* ---------- ZIP lesen (für die Paketprüfung) ---------- */
function entpacke(buf) {
  const dateien = {};
  let eocd = buf.length - 22; while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const anzahl = buf.readUInt16LE(eocd + 10); let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < anzahl; i++) {
    const methode = buf.readUInt16LE(p + 10), komp = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), kl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString('utf8');
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28), daten = buf.slice(off + 30 + lnl + lel, off + 30 + lnl + lel + komp);
    dateien[name] = methode === 8 ? zlib.inflateRawSync(daten) : daten;
    p += 46 + nl + el + kl;
  }
  return dateien;
}

/* ---------- Server: Rahmen, App, SCORM-Pakete ---------- */
const pakete = {};
for (const p of PAKETE) pakete[p.datei] = entpacke(fs.readFileSync(path.join(DIST, p.datei + '.zip')));
const RAHMEN = (src, api, vollbild = true) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;font-family:sans-serif}.bar{height:48px;background:#0b3d6b;color:#fff;display:flex;align-items:center;padding:0 16px;font-size:15px}iframe{display:block;border:0;width:100%;height:calc(100% - 48px)}</style>
${api ? `<script>window.scormRufe=[];window.API={LMSInitialize(){scormRufe.push('LMSInitialize');return 'true'},LMSFinish(){scormRufe.push('LMSFinish');return 'true'},LMSGetValue(k){return k==='cmi.core.lesson_status'?'not attempted':''},LMSSetValue(k,v){scormRufe.push(k+'='+v);return 'true'},LMSCommit(){scormRufe.push('LMSCommit');return 'true'},LMSGetLastError(){return '0'},LMSGetErrorString(){return ''},LMSGetDiagnostic(){return ''}};</script>` : ''}
</head><body><div class="bar">mebis – Nachbildung des Player-Rahmens</div><iframe id="app" src="${src}"${vollbild ? ' allow="fullscreen; autoplay"' : ' allow="fullscreen \'none\'"'}></iframe></body></html>`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname);
  const send = (typ, inhalt) => { res.setHeader('content-type', typ); res.end(inhalt); };
  if (p === '/rahmen.html') return send('text/html', RAHMEN(url.searchParams.get('src'), url.searchParams.get('api') === '1', url.searchParams.get('vollbild') !== '0'));
  if (p === '/lernuhr.html') return send('text/html', fs.readFileSync(path.join(DIST, 'lernuhr.html')));
  const m = /^\/paket\/([^/]+)\/(.+)$/.exec(p);
  if (m && pakete[m[1]] && pakete[m[1]][m[2]]) return send(m[2].endsWith('.html') ? 'text/html' : m[2].endsWith('.js') ? 'text/javascript' : 'application/xml', pakete[m[1]][m[2]]);
  res.statusCode = 404; res.end('fehlt');
}).listen(0);
const BASIS = `http://127.0.0.1:${server.address().port}`;

import { IM_APP } from './pruef-app.mjs';

async function appFrame(page) {
  const f = await (await page.waitForSelector('iframe#app')).contentFrame();
  await f.waitForLoadState('load'); await f.waitForFunction(() => window.LU && LU.G);
  await f.evaluate(IM_APP); return f;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
const schnell = f => f.evaluate(() => { if (LU.s.anim) LU.s.anim.rate = 1e6; });
async function warteBis(f, fn, arg) { await f.waitForFunction(fn, arg, { timeout: 10000 }); await f.evaluate(() => LU.zeichne()); await pause(60); }

/* Ein Schritt: Maße prüfen, Uhr merken, Bildschirmbild */
async function schritt(ctx, name, { bild = true } = {}) {
  const { page, f, geraet, uhren } = ctx;
  await pause(120);
  const lay = await f.evaluate(() => __pruef.layout());
  pruefe(geraet.name, `${name}: kein Scrollen, nichts ragt heraus`, lay.length === 0, lay.slice(0, 4).join('; '));
  const gr = await f.evaluate(p => __pruef.groessen(p), geraet.profil);
  pruefe(geraet.name, `${name}: Mindestgrößen`, gr.length === 0, gr.slice(0, 4).join('; '));
  if (geraet.profil === 'tafel') { const rw = await f.evaluate(() => __pruef.reichweite()); pruefe(geraet.name, `${name}: Schüler-Bedienung in den unteren zwei Dritteln`, rw.length === 0, rw.slice(0, 3).join('; ')); }
  uhren.push([name, await f.evaluate(() => __pruef.uhr())]);
  if (bild) await page.screenshot({ path: path.join(SCREENS, `${geraet.name}-${name}.png`) });
}

async function antworteRichtig(f) {
  const v = await f.evaluate(() => { const q = LU.s.quiz; return q.phase === 'dauer' ? Math.round((q.ziel - q.start) / 60000) : q.antwort; });
  await f.tap(`.antwort[data-v="${v}"]`);
}
async function tippeZahl(f, zahl) { for (const z of String(zahl)) await f.tap(`#b-ziffern button[data-k="${z}"]`); }
async function antworteSchwer(f) {
  const { phase, h, m } = await f.evaluate(() => { const q = LU.s.quiz, v = q.phase === 'dauer' ? Math.round((q.ziel - q.start) / 60000) : q.antwort; return { phase: q.phase, h: Math.floor(v / 60), m: v % 60 }; });
  await tippeZahl(f, phase === 'dauer' ? h : String(h).padStart(2, '0'));
  if (m) await tippeZahl(f, String(m).padStart(2, '0'));
  await f.tap('#b-ziffern button[data-k="Prüfen"]');
}
async function antworteBausteine(f) {
  const loes = await f.evaluate(() => {
    const q = LU.s.quiz, E = LU.einst;
    for (const t of Worte.tiles(E.stufe, E.sprechweise)) for (let i = 0; i < 12; i++) {
      if (t.count) { for (let n = 1; n < 30; n++) if (Worte.validWordAnswer(Worte.buildPhrase(Worte.countTile(t.count, n), i), q.antwort)) return { label: t.label, zahl: n, i }; }
      else if (Worte.validWordAnswer(Worte.buildPhrase(t, i), q.antwort)) return { label: t.label, i };
    }
    return null;
  });
  if (!loes) throw new Error('keine Lösung aus Bausteinen');
  const kachel = f.locator('.b-kacheln .kachel', { hasText: loes.label }).filter({ hasText: new RegExp('^' + loes.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });
  await kachel.first().tap();
  if (loes.zahl) { await tippeZahl(f, loes.zahl); await f.tap('#b-ziffern button[data-k="Weiter"]'); }
  await f.tap(`#b-stunden .kachel[data-i="${loes.i}"]`);
  await f.tap('#satz-pruefen');
}
async function warteLob(f) { await pause(1600); }

/* Eine Aufgabe (Uhrzeit und Dauer) */
async function aufgabe(ctx, art, { bilder = false, falschZuerst = false, prefix = '' } = {}) {
  const { f } = ctx;
  await schnell(f); await warteBis(f, () => LU.s.quiz.phase === 'frage');
  if (bilder) await schritt(ctx, prefix + 'frage');
  if (falschZuerst && art === 'leicht') {
    pruefe(ctx.geraet.name, 'Quiz: Stundenbereich und Hervorheben erst nach Fehlversuchen', await f.evaluate(() => document.getElementById('sektor').getAttribute('d') === '' && !document.querySelector('#ringe circle')));
    const falsch = await f.evaluate(() => [...document.querySelectorAll('.antwort')].map(b => +b.dataset.v).filter(v => v !== LU.s.quiz.antwort).slice(0, 2));
    for (const v of falsch) { await f.tap(`.antwort[data-v="${v}"]`); await pause(80); }
    const hilfe = await f.evaluate(() => !!(LU.s.autoHilfe && LU.s.autoHilfe.bereich) && document.querySelectorAll('.antwort.falsch').length === 2 && document.getElementById('sektor').getAttribute('d') !== '');
    pruefe(ctx.geraet.name, 'Falsch: Felder ausgegraut, nach zwei Fehlversuchen Lernhilfe', hilfe);
    if (bilder) await schritt(ctx, prefix + 'falsch');
  }
  if (art === 'leicht') await antworteRichtig(f); else if (art === 'schwer') await antworteSchwer(f); else await antworteBausteine(f);
  await warteBis(f, () => LU.s.quiz.phase === 'gut1');
  pruefe(ctx.geraet.name, `${prefix || art}: Uhrzeit richtig erkannt`, true);
  if (bilder) { await pause(250); await ctx.page.screenshot({ path: path.join(SCREENS, `${ctx.geraet.name}-${prefix}lob.png`) }); }
  await warteLob(f);
  if (bilder) await schritt(ctx, prefix + 'richtig');
  await f.tap('#weiter'); await warteBis(f, () => LU.s.quiz.phase === 'dauer');
  if (bilder) await schritt(ctx, prefix + 'dauer');
  if (art === 'schwer' || art === 'bausteine') await antworteSchwer(f); else await antworteRichtig(f);
  await warteBis(f, () => ['gut2', 'ende'].includes(LU.s.quiz.phase));
  await warteLob(f);
}

/* ---------- Geräte ---------- */
const GERAETE = [
  { name: 'escreen', breite: 1600, hoehe: 848, profil: 'tafel' },
  { name: 'ipad-quer', breite: 1000, hoehe: 700, profil: 'tablet' },
  { name: 'ipad-hoch', breite: 760, hoehe: 1000, profil: 'tablet' },
];

async function geraetPruefen(browser, geraet) {
  const context = await browser.newContext({ viewport: { width: geraet.breite, height: geraet.hoehe }, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const fehler = [], anfragen = [];
  page.on('pageerror', e => fehler.push(e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith('data:')) anfragen.push(r.url()); });
  await page.goto(`${BASIS}/rahmen.html?src=/lernuhr.html`);
  const f = await appFrame(page);
  const ctx = { page, f, geraet, uhren: [] };
  pruefe(geraet.name, 'Vollbild-Knopf erscheint, wenn der Rahmen Vollbild erlaubt', await f.evaluate(() => !document.getElementById('vollbild').hidden));
  const profil = await f.evaluate(() => document.getElementById('app').dataset.profil);
  pruefe(geraet.name, `Layout erkannt: ${profil}`, profil === geraet.profil);

  // Zeigen
  await f.evaluate(() => { LU.s.hilfen.worte = true; LU.s.form = 'beide'; LU.s.hilfen.minuten = true; LU.neu(); });
  await f.tap('#start-fest'); await f.tap('[data-lauf="2"]'); await pause(800); await f.tap('[data-lauf="0"]');
  const verg = await f.evaluate(() => [LU.s.start != null, document.getElementById('verg-h').getAttribute('d') !== '', document.getElementById('seit').textContent]);
  pruefe(geraet.name, 'Zeigen: vergangene Zeit als Fläche und in Std./Min.', verg[0] && verg[1] && /Std\./.test(verg[2]), verg[2]);
  await schritt(ctx, 'zeigen');
  // Zeiger liegen über den Zahlen: um 5:00 trifft ein Tipp auf die Mitte der 12 den Minutenzeiger
  const ueber = await f.evaluate(() => {
    window.__stufeVorher = LU.einst.stufe; LU.setzeStufe('five'); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 5 * 60, LU.zone()); LU.zeichne();
    const z = [...document.querySelectorAll('#stundenzahlen text')].find(t => t.textContent === '12').getBoundingClientRect();
    const e = document.elementFromPoint(z.x + z.width / 2, z.y + z.height / 2);
    return [e && e.getAttribute('class'), !document.querySelector('#uhr [mask]')];
  });
  pruefe(geraet.name, 'Zeiger liegen über den Zahlen (Minutenzeiger verdeckt um 5:00 die 12)', ueber[0] === 'z-minute' && ueber[1], ueber[0]);
  // Hervorheben: aktuelle Zahlen bleiben, alle anderen grau und blass
  const matt = await f.evaluate(() => {
    LU.s.hilfen.hervorheben = true; LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 4 * 60 + 23, LU.zone()); LU.zeichne();
    const st = [...document.querySelectorAll('#stundenzahlen text')], mi = [...document.querySelectorAll('#minutenzahlen text')];
    const r = [st.filter(t => t.classList.contains('matt')).length, st.find(t => !t.classList.contains('matt')).textContent, mi.filter(t => t.classList.contains('matt')).length,
      document.querySelector('#mfokus text') && document.querySelector('#mfokus text').textContent, getComputedStyle(st[0]).opacity];
    LU.s.hilfen.hervorheben = false; LU.zeichne(); return r;
  });
  pruefe(geraet.name, 'Hervorheben: andere Zahlen grau und blass (4:23 → Stunde 4, Minute 20)', matt[0] === 11 && matt[1] === '4' && matt[2] === 11 && matt[3] === '20' && +matt[4] < .8, matt.join(' / '));
  // Minutenzahlen im Ring: keine Überlappung, in beiden Schriften
  const ring = await f.evaluate(() => __pruef.minutenring());
  pruefe(geraet.name, 'Minutenring: Zahlen mittig, ungestaucht, ohne Berührung', ring.length === 0, ring.slice(0, 3).join('; '));
  await f.evaluate(() => { LU.setzeStufe(window.__stufeVorher); LU.zeichne(); });
  await f.tap('#jetzt'); await pause(300);
  const jetzt = await f.evaluate(() => Math.abs(LU.s.instant - Date.now()) < 2000 && LU.s.live);
  pruefe(geraet.name, 'Zeigen: „Jetzt“ zeigt die aktuelle Uhrzeit', jetzt);
  // Sekundenzeiger springt auf die Minutenstriche (ganze Sekunden)
  const winkel = [];
  for (let i = 0; i < 3; i++) { await pause(450); winkel.push(await f.evaluate(() => [getComputedStyle(document.getElementById('zeiger-s')).display, document.getElementById('zeiger-s').getAttribute('transform')])); }
  const ganz = winkel.every(([d, t]) => d !== 'none' && /^rotate\((\d+)\)$/.test(t) && Number(/\d+/.exec(t)[0]) % 6 === 0);
  pruefe(geraet.name, 'Sekundenzeiger springt auf die Minutenstriche', ganz, winkel.map(w => w[1]).join(' '));
  // Laufwerk: ▶▶ ist schneller als ▶
  await f.evaluate(() => { LU.stoppeAlles(); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 9 * 60, LU.zone()); LU.zeichne(); });
  await f.tap('[data-lauf="1"]'); await pause(1000); await f.tap('[data-lauf="0"]');
  const langsam = await f.evaluate(() => LU.wandMinuten() - 540);
  await f.evaluate(() => { LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 9 * 60, LU.zone()); LU.zeichne(); });
  await f.tap('[data-lauf="2"]'); await pause(1000); await f.tap('[data-lauf="0"]');
  const schnellLauf = await f.evaluate(() => LU.wandMinuten() - 540);
  await f.tap('[data-lauf="-1"]'); await pause(500); await f.tap('[data-lauf="0"]');
  const zurueck = await f.evaluate(() => LU.wandMinuten() - 540);
  pruefe(geraet.name, 'Laufwerk: ▶ langsam, ▶▶ schnell, ◀ rückwärts', langsam > 0.5 && langsam < 3 && schnellLauf > 8 && zurueck < schnellLauf, `▶ ${langsam.toFixed(1)} min, ▶▶ ${schnellLauf.toFixed(1)} min, danach ◀ ${zurueck.toFixed(1)}`);
  // Zufall im Schritt der Stufe
  await f.tap('[data-stufe="quarter"]');
  const zeiten = [];
  const vorwaerts = [];
  for (let i = 0; i < 4; i++) {
    const vor = await f.evaluate(() => LU.s.instant); await f.tap('#zufall'); await pause(1600);
    const [m, nach] = await f.evaluate(() => [Math.round(LU.wandMinuten()), LU.s.instant]); zeiten.push(m); vorwaerts.push(nach > vor && nach - vor <= 12 * 3600e3 + 1000);
  }
  pruefe(geraet.name, 'Zufall: Zeiger laufen nur vorwärts (höchstens 12 Stunden)', vorwaerts.every(Boolean), vorwaerts.join(','));
  pruefe(geraet.name, 'Zufall: neue Uhrzeit im Viertelstunden-Schritt', zeiten.every(t => t % 15 === 0) && new Set(zeiten).size > 1, zeiten.map(t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0')).join(', '));
  // Stufe merkt sich Änderungen, Anzeige-Hilfen bleiben
  const vorher = await f.evaluate(() => [LU.s.hilfen.bereich, LU.s.hilfen.worte]);
  await f.tap('#b-hilfen [data-hilfe="bereich"]');
  await f.tap('[data-stufe="five"]'); await f.tap('[data-stufe="quarter"]');
  const nachher = await f.evaluate(() => [LU.s.hilfen.bereich, LU.s.hilfen.worte, LU.einst.stufe]);
  pruefe(geraet.name, 'Stufe merkt sich geänderte Hilfen; Worte und Digital bleiben gleich', nachher[0] === !vorher[0] && nachher[1] === vorher[1] && nachher[2] === 'quarter', JSON.stringify([vorher, nachher]));
  await f.tap('#b-hilfen [data-hilfe="bereich"]');
  await f.tap('[data-stufe="full"]');

  // Ziehen mit Touch: Minutenzeiger um 90° im Uhrzeigersinn, zweiter Finger stört nicht
  if (geraet.name !== 'ipad-quer') {
    await f.tap('[data-lauf="0"]');
    await f.evaluate(() => { LU.stoppeAlles(); LU.setzeStufe('any'); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 9 * 60, LU.zone()); LU.zeichne(); });
    const box = await f.locator('#uhr').boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = box.width / 234 * 70;
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy - r, id: 1 }] });
    const knopf = await f.locator('[data-stufe="five"]').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy - r, id: 1 }, { x: knopf.x + 10, y: knopf.y + 10, id: 2 }] });
    for (let i = 1; i <= 15; i++) { const a = i / 15 * Math.PI / 2; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), id: 1 }, { x: knopf.x + 10, y: knopf.y + 10, id: 2 }] }); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: knopf.x + 10, y: knopf.y + 10, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pause(150);
    const z = await f.evaluate(() => [document.getElementById('digital-zeit').textContent, scrollY, document.scrollingElement.scrollTop, window.visualViewport ? visualViewport.scale : 1, LU.einst.stufe]);
    const oben = await page.evaluate(() => [scrollY, window.visualViewport ? visualViewport.scale : 1]);
    pruefe(geraet.name, 'Touch: Minutenzeiger von 9:00 um eine Viertelstunde gezogen', z[0] === '09:15', z[0]);
    pruefe(geraet.name, 'Touch: kein Scrollen oder Zoomen beim Ziehen', z[1] === 0 && z[2] === 0 && z[3] === 1 && oben[0] === 0 && oben[1] === 1);
    pruefe(geraet.name, 'Touch: zweiter Finger löst nichts aus', z[4] === 'any', 'Stufe blieb ' + z[4]);
    // Einrasten passend zur Lernstufe (Viertelstunden): Ziehen auf etwa 9:17 rastet auf 9:15
    await f.evaluate(() => { LU.setzeStufe('quarter'); LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 9 * 60, LU.zone()); LU.zeichne(); });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy - r, id: 5 }] });
    for (let i = 1; i <= 12; i++) { const a = i / 12 * 102 * Math.PI / 180; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), id: 5 }] }); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(120);
    const ein = await f.evaluate(() => document.getElementById('digital-zeit').textContent);
    pruefe(geraet.name, 'Einrasten: Loslassen bei etwa 9:17 ergibt 9:15', ein === '09:15', ein);
    await f.evaluate(() => { LU.setzeStufe('full'); LU.zeichne(); });
  }

  // Quiz: Start, Lauf, leicht mit Fehlversuchen, ganze Runde
  await f.tap('#bereiche [data-bereich="quiz"]');
  await schritt(ctx, 'quiz-start');
  await f.tap('#weiter'); await pause(500);
  await schritt(ctx, 'quiz-lauf');
  await aufgabe(ctx, 'leicht', { bilder: true, falschZuerst: true, prefix: 'quiz-' });
  for (let i = 1; i < 5; i++) { await f.tap('#weiter'); await aufgabe(ctx, 'leicht'); }
  const ende = await f.evaluate(() => [LU.s.quiz.phase, LU.s.quiz.fertig, document.querySelectorAll('.b-fortschritt i.fertig').length]);
  pruefe(geraet.name, 'Quiz leicht: ganze Runde mit 5 Aufgaben, Fortschritt voll', ende[0] === 'ende' && ende[1] === 5 && ende[2] === 5, ende.join('/'));
  await schritt(ctx, 'quiz-ende');

  // Quiz schwer über das Einstellungsblatt einstellen (Schieberegler)
  await f.tap('#einstellungen');
  const kn = await f.locator('#schiebeknopf').boundingBox(), sch = await f.locator('#schiene').boundingBox();
  const cdp2 = await context.newCDPSession(page);
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: kn.x + kn.width / 2, y: kn.y + kn.height / 2, id: 3 }] });
  for (let i = 1; i <= 10; i++) await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: kn.x + kn.width / 2 + i / 10 * sch.width, y: kn.y + kn.height / 2, id: 3 }] });
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(300);
  pruefe(geraet.name, 'Einstellungen öffnen nur über den Schieberegler', await f.evaluate(() => !!LU.s.blatt));
  await schritt(ctx, 'einstellungen');
  for (const reiter of ['runde', 'anzeige', 'sonne', 'geraet', 'quiz']) {
    await f.tap(`#bl-reiter [data-reiter="${reiter}"]`); await pause(80);
    const lay = await f.evaluate(() => __pruef.layout()), gr = await f.evaluate(p => __pruef.groessen(p), geraet.profil);
    pruefe(geraet.name, `Einstellungen, Reiter ${reiter}: passt ohne Scrollen, Mindestgrößen`, lay.length === 0 && gr.length === 0, lay.concat(gr).slice(0, 3).join('; '));
  }
  // Eigener Ort mit eigenem Ziffernfeld
  await f.tap('#bl-reiter [data-reiter="sonne"]');
  await f.locator('.bl-inhalt button', { hasText: /^Eigener/ }).tap();
  await f.locator('.bl-inhalt .koord .feld').nth(0).tap();
  for (let i = 0; i < 6; i++) await f.locator('.bl-inhalt .b-ziffern button[data-k="Löschen"]').tap();
  for (const k of ['5', '2', ',', '5']) await f.locator(`.bl-inhalt .b-ziffern button[data-k="${k}"]`).tap();
  await f.locator('.bl-inhalt .koord .feld').nth(1).tap();
  for (let i = 0; i < 6; i++) await f.locator('.bl-inhalt .b-ziffern button[data-k="Löschen"]').tap();
  for (const k of ['1', '3', ',', '4']) await f.locator(`.bl-inhalt .b-ziffern button[data-k="${k}"]`).tap();
  await f.locator('#bl-zonen button', { hasText: /^London$/ }).tap();
  const layOrt = await f.evaluate(() => __pruef.layout());
  pruefe(geraet.name, 'Eigener Ort: Eingabe passt ohne Scrollen', layOrt.length === 0, layOrt.slice(0, 3).join('; '));
  await schritt(ctx, 'eigener-ort');
  await f.locator('.bl-inhalt .b-ziffern button[data-k="Übernehmen"]').tap();
  const ort = await f.evaluate(() => LU.s.place);
  pruefe(geraet.name, 'Eigener Ort: Koordinaten und Zeitzone übernommen', ort.lat === 52.5 && ort.lon === 13.4 && ort.zone === 'Europe/London', JSON.stringify(ort));
  await f.locator('.bl-inhalt button', { hasText: /^Herrieden$/ }).tap();
  // Bereichswahl sperren
  await f.tap('#bl-reiter [data-reiter="geraet"]');
  await f.locator('.bl-inhalt button', { hasText: /^gesperrt$/ }).tap(); await pause(80);
  const sperre = await f.evaluate(() => [document.getElementById('bereiche').hidden, document.getElementById('bereich-name').textContent]);
  pruefe(geraet.name, 'Bereichswahl lässt sich für Schüler sperren', sperre[0] && sperre[1] === 'Quiz');
  await f.locator('.bl-inhalt button', { hasText: /^frei$/ }).tap();
  await f.tap('#bl-reiter [data-reiter="quiz"]');
  await f.locator('.bl-inhalt button', { hasText: /^Schwer$/ }).tap();
  await f.locator('.bl-inhalt button', { hasText: /^Viertel$/ }).tap();
  await f.tap('#blatt-fertig');
  const einst = await f.evaluate(() => [LU.einst.antworten, LU.einst.stufe, !!LU.s.blatt]);
  pruefe(geraet.name, 'Blatt: Schwer und Viertelstunden eingestellt, geschlossen', einst[0] === 'schwer' && einst[1] === 'quarter' && !einst[2], einst.join('/'));
  await f.tap('#weiter');
  await aufgabe(ctx, 'schwer', { bilder: true, prefix: 'quiz-schwer-' });
  pruefe(geraet.name, 'Quiz schwer: Uhrzeit und Zeitdauer über das eigene Ziffernfeld', true);

  // Worte leicht und Worte schwer (Wortbausteine), süddeutsch und hochdeutsch
  for (const [antw, form, stufe] of [['leicht', 'sued', 'quarter'], ['schwer', 'sued', 'five'], ['schwer', 'hoch', 'quarter'], ['schwer', 'sued', 'any']]) {
    await f.evaluate(([a, s, st]) => { LU.einst.antworten = a; LU.einst.aufgabe = 'worte'; LU.einst.sprechweise = s; LU.einst.stufe = st; LU.quiz.neu(); LU.neu(); }, [antw, form, stufe]);
    await f.tap('#weiter');
    const name = `quiz-worte-${antw}-${form}-${stufe}-`;
    await aufgabe(ctx, antw === 'leicht' ? 'leicht' : 'bausteine', { bilder: (antw === 'schwer' && form === 'sued' && stufe === 'five') || antw === 'leicht', prefix: name });
    pruefe(geraet.name, `Quiz Worte ${antw} (${form === 'sued' ? 'süddeutsch' : 'hochdeutsch'}, ${stufe})`, true);
  }
  // Bildschirmbild Wortbausteine Schritt 1
  await f.evaluate(() => { LU.einst.antworten = 'schwer'; LU.einst.aufgabe = 'worte'; LU.einst.sprechweise = 'sued'; LU.einst.stufe = 'five'; LU.quiz.neu(); LU.neu(); });
  await f.tap('#weiter'); await schnell(f); await warteBis(f, () => LU.s.quiz.phase === 'frage');
  await schritt(ctx, 'quiz-wortbausteine');
  await f.evaluate(() => { LU.einst.antworten = 'leicht'; LU.einst.aufgabe = 'zahlen'; LU.einst.stufe = 'full'; LU.quiz.neu(); LU.neu(); });

  // Sonne
  await f.tap('#bereiche [data-bereich="sonne"]');
  await f.evaluate(() => { LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 18 * 60 + 15, LU.zone()); LU.einst.mond = true; LU.zeichne(); });
  await schritt(ctx, 'sonne');
  const himmel = await f.evaluate(() => document.getElementById('fenster').style.background);
  await f.tap('[data-schnell="sommer"]'); await pause(120);
  const sommer = await f.evaluate(() => [LU.ymd().slice(5), document.getElementById('f-laenge').textContent]);
  await f.tap('[data-schnell="winter"]'); await pause(120);
  const winter = await f.evaluate(() => [LU.ymd().slice(5), document.getElementById('f-laenge').textContent]);
  pruefe(geraet.name, 'Sonne: Sommer (21. Juni) und Winter (21. Dezember) mit einem Tippen', sommer[0] === '06-21' && winter[0] === '12-21' && parseInt(sommer[1]) >= 16 && parseInt(winter[1]) <= 8, sommer.join(' ') + ' | ' + winter.join(' '));
  await f.evaluate(() => { LU.s.instant = Lernzeit.wallToInstant(LU.ymd(), 20 * 60, LU.zone()); LU.zeichne(); });
  await f.tap('[data-schnell="beide"]'); await pause(150);
  const vgl = await f.evaluate(() => [document.querySelectorAll('#b-vergleich .karte').length, document.getElementById('fenster').classList.contains('geteilt')]);
  pruefe(geraet.name, 'Sonne: Vergleich zeigt zwei Karten und geteilten Himmel', vgl[0] === 2 && vgl[1]);
  await schritt(ctx, 'sonne-vergleich');
  // Uhr bleibt bedienbar und koppelt den Sonnenstand
  await f.tap('[data-schnell="beide"]');
  await f.evaluate(() => { LU.s.instant = Lernzeit.wallToInstant('2026-06-21', 13 * 60, LU.zone()); LU.zeichne(); });
  const mittag = await f.evaluate(() => document.getElementById('f-hoehe').textContent);
  await f.evaluate(() => { LU.s.instant = Lernzeit.wallToInstant('2026-06-21', 23 * 60, LU.zone()); LU.zeichne(); });
  const nacht = await f.evaluate(() => [document.getElementById('f-hoehe').textContent, document.getElementById('fenster').style.background]);
  pruefe(geraet.name, 'Sonne: Uhrzeit und Sonnenstand gekoppelt (Mittag hoch, Nacht dunkel)', /° hoch/.test(mittag) && /untergegangen|Dämmerung/.test(nacht[0]) && nacht[1] !== himmel, mittag + ' / ' + nacht[0]);
  const jahr = await f.locator('#jahr').boundingBox();
  await page.touchscreen.tap(jahr.x + jahr.width * .48, jahr.y + 10); await pause(120);
  pruefe(geraet.name, 'Sonne: Antippen im Jahresband wählt ein Datum', await f.evaluate(() => ['06', '07'].includes(LU.ymd().slice(5, 7))), await f.evaluate(() => LU.ymd()));

  // Uhr: gleiche Position und Größe in allen Bereichen und Schritten
  const verschieden = [...new Set(ctx.uhren.map(u => u[1]))];
  pruefe(geraet.name, `Uhr in ${ctx.uhren.length} Schritten an derselben Stelle (${verschieden[0]})`, verschieden.length === 1, verschieden.join(' | '));
  const zb = await f.evaluate(p => __pruef.zifferblatt(p), geraet.profil);
  if (geraet.profil === 'tafel') pruefe(geraet.name, `Uhr ${zb.anteilHoehe} % der Höhe (Zifferblatt ${zb.zifferblattAnteil} %)`, zb.zifferblattAnteil >= 55);
  pruefe(geraet.name, `Ziffernhöhe: Stunden ${zb.stundenzahlen} px, Minuten ${zb.minutenzahlen} px (vorher ${zb.minutenVorher} px), alle Minuten ${zb.alleMinuten} px`, zb.minutenzahlen >= 1.15 * zb.minutenVorher && zb.minutenzahlen >= (geraet.profil === 'tafel' ? 22 : 15.8), 'alle Minuten sind durch 60 Zahlen am Umfang begrenzt');

  if (geraet.name === 'escreen') {
    // Fernlesetest: Bild auf 25 % verkleinert
    await f.tap('#bereiche [data-bereich="quiz"]');
    await f.evaluate(() => { LU.einst.antworten = 'leicht'; LU.einst.aufgabe = 'zahlen'; LU.einst.stufe = 'quarter'; LU.quiz.neu(); LU.neu(); });
    await f.tap('#weiter'); await schnell(f); await warteBis(f, () => LU.s.quiz.phase === 'frage');
    const voll = path.join(SCREENS, 'escreen-fernlesetest-voll.png');
    await page.screenshot({ path: voll });
    const klein = await page.evaluate(async (src) => { const img = new Image(); img.src = src; await img.decode(); const c = document.createElement('canvas'); c.width = img.width / 4; c.height = img.height / 4; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/png'); }, 'data:image/png;base64,' + fs.readFileSync(voll).toString('base64'));
    fs.writeFileSync(path.join(SCREENS, 'escreen-fernlesetest-25prozent.png'), Buffer.from(klein.split(',')[1], 'base64'));
    fs.unlinkSync(voll);
    pruefe(geraet.name, 'Fernlesetest: Bild auf 25 % gespeichert (Sichtprüfung im Bericht)', true, 'docs/screens/escreen-fernlesetest-25prozent.png');
  }

  // Hoch- und Querformat wechseln ohne Zustandsverlust
  if (geraet.name === 'ipad-hoch') {
    await f.tap('#bereiche [data-bereich="quiz"]');
    await f.evaluate(() => { LU.einst.antworten = 'leicht'; LU.einst.aufgabe = 'zahlen'; LU.einst.stufe = 'half'; LU.quiz.neu(); LU.neu(); });
    await f.tap('#weiter'); await schnell(f); await warteBis(f, () => LU.s.quiz.phase === 'frage');
    const falsch = await f.evaluate(() => [...document.querySelectorAll('.antwort')].map(b => +b.dataset.v).find(v => v !== LU.s.quiz.antwort));
    await f.tap(`.antwort[data-v="${falsch}"]`);
    const vorher = await f.evaluate(() => JSON.stringify([LU.s.quiz.phase, LU.s.quiz.antwort, [...LU.s.quiz.falsch], LU.s.instant, LU.s.bereich]));
    await page.setViewportSize({ width: 1000, height: 700 }); await pause(400);
    const nachher = await f.evaluate(() => JSON.stringify([LU.s.quiz.phase, LU.s.quiz.antwort, [...LU.s.quiz.falsch], LU.s.instant, LU.s.bereich]));
    const lage = await f.evaluate(() => document.getElementById('app').dataset.lage);
    pruefe(geraet.name, 'Drehen ins Querformat: Zustand bleibt erhalten', vorher === nachher && lage === 'quer', lage);
    const lay = await f.evaluate(() => __pruef.layout());
    pruefe(geraet.name, 'Nach dem Drehen: kein Scrollen, nichts ragt heraus', lay.length === 0, lay.slice(0, 3).join('; '));
    await page.setViewportSize({ width: 760, height: 1000 }); await pause(400);
    const zurueck = await f.evaluate(() => JSON.stringify([LU.s.quiz.phase, LU.s.quiz.antwort, [...LU.s.quiz.falsch], LU.s.instant, LU.s.bereich]));
    pruefe(geraet.name, 'Zurück ins Hochformat: Zustand bleibt erhalten', vorher === zurueck);
  }

  const fremd = anfragen.filter(u => !u.startsWith(BASIS + '/rahmen.html') && !u.startsWith(BASIS + '/lernuhr.html'));
  pruefe(geraet.name, 'Keine Netzwerkanfragen außer Rahmen und App', fremd.length === 0, fremd.slice(0, 3).join(', '));
  pruefe(geraet.name, 'Keine JavaScript-Fehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
  await context.close();
}

async function speicherGesperrt(browser) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, hasTouch: true });
  await context.addInitScript(() => {
    const sperre = () => { throw new DOMException('gesperrt', 'SecurityError'); };
    try { Object.defineProperty(window, 'localStorage', { get: sperre, configurable: true }); Object.defineProperty(window, 'sessionStorage', { get: sperre, configurable: true }); } catch (_) {}
  });
  const page = await context.newPage(); const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  await page.goto(`${BASIS}/rahmen.html?vollbild=0&src=/lernuhr.html`);
  const f = await appFrame(page);
  pruefe('speicher', 'Vollbild-Knopf fehlt, wenn der Rahmen kein Vollbild erlaubt', await f.evaluate(() => document.getElementById('vollbild').hidden));
  await f.tap('#bereiche [data-bereich="quiz"]'); await f.tap('#weiter'); await schnell(f);
  await warteBis(f, () => LU.s.quiz.phase === 'frage');
  await antworteRichtig(f); await warteBis(f, () => LU.s.quiz.phase === 'gut1');
  await f.evaluate(() => LU.blatt.oeffnen()); await f.locator('.bl-reiter button', { hasText: 'Gerät' }).tap();
  await f.locator('.bl-inhalt button', { hasText: /^Kontrast$/ }).tap();
  const schema = await f.evaluate(() => document.documentElement.dataset.schema);
  pruefe('speicher', 'Gesperrter localStorage: App startet, Quiz läuft, Einstellungen wirken', fehler.length === 0 && schema === 'kontrast', fehler.join(' | '));
  await page.screenshot({ path: path.join(SCREENS, 'ipad-quer-kontrast.png') });
  await context.close();
}

async function paketePruefen(browser) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 848 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASIS}/rahmen.html?src=about:blank`);
  const ids = new Set();
  for (const p of PAKETE) {
    const z = pakete[p.datei], man = z['imsmanifest.xml']?.toString('utf8') || '';
    const pr = await page.evaluate(xml => {
      const d = new DOMParser().parseFromString(xml, 'application/xml');
      if (d.getElementsByTagName('parsererror').length) return { ok: false, grund: 'XML fehlerhaft' };
      const m = d.documentElement, ns = 'http://www.imsproject.org/xsd/imscp_rootv1p1p2';
      const res = d.getElementsByTagNameNS(ns, 'resource')[0], files = [...d.getElementsByTagNameNS(ns, 'file')].map(f => f.getAttribute('href'));
      const titel = d.getElementsByTagNameNS(ns, 'organization')[0].getElementsByTagNameNS(ns, 'title')[0].textContent;
      const ver = d.getElementsByTagName('schemaversion')[0]?.textContent;
      const sco = res.getAttributeNS('http://www.adlnet.org/xsd/adlcp_rootv1p2', 'scormtype') || res.getAttribute('adlcp:scormtype');
      const item = d.getElementsByTagNameNS(ns, 'item')[0];
      return { ok: m.localName === 'manifest' && ver === '1.2' && sco === 'sco' && res.getAttribute('href') === 'index.html' && item.getAttribute('identifierref') === res.getAttribute('identifier'), id: m.getAttribute('identifier'), files, titel };
    }, man);
    const dateienDa = pr.files && pr.files.every(f => z[f]);
    pruefe('pakete', `${p.datei}.zip: gültiges Manifest (SCORM 1.2), Dateien vollständig, Titel „${pr.titel}“`, pr.ok && dateienDa && pr.titel === p.titel && !ids.has(pr.id), pr.grund || '');
    ids.add(pr.id);
    // Nur frei lizenzierte Dateien eingebettet: jede data-URI ist genau eine Datei aus src/assets
    const frei = new Set(['playwrite-de-grund-400.woff2'].map(n => path.join(ROOT, 'src', 'assets', n))
      .concat(fs.readdirSync(path.join(ROOT, 'src', 'assets', 'bilder')).map(n => path.join(ROOT, 'src', 'assets', 'bilder', n))).map(f => fs.readFileSync(f).toString('base64')));
    const html = z['index.html'].toString('utf8'), eingebettet = [...html.matchAll(/data:[a-z0-9+\/.-]+;base64,([A-Za-z0-9+\/=]+)/g)].map(m => m[1]);
    const fremd = eingebettet.filter(b => !frei.has(b)).length;
    pruefe('pakete', `${p.datei}: nur freie Schriften und Bilder eingebettet (${eingebettet.length} Dateien)`, eingebettet.length >= 3 && fremd === 0 && !/Bayerndruck|METACOM/i.test(html), fremd ? `${fremd} unbekannte Datei(en)` : '');
    // Start im Rahmen mit SCORM-API
    const fehler = []; const hdl = e => fehler.push(e.message); page.on('pageerror', hdl);
    await page.goto(`${BASIS}/rahmen.html?api=1&src=/paket/${p.datei}/index.html`);
    const f = await appFrame(page); await pause(300);
    const st = await f.evaluate(() => [LU.s.bereich, LU.einst.stufe, document.title, LU.s.quiz && LU.s.quiz.phase, document.getElementById('kontext').textContent]);
    const rufe = await page.evaluate(() => window.scormRufe);
    const erwartet = p.preset ? st[0] === 'quiz' && st[1] === p.preset.stufe : st[0] === 'zeigen';
    pruefe('pakete', `${p.datei}: Voreinstellung greift beim Start (${st[0]}${p.preset ? ', ' + st[1] : ''}), SCORM initialisiert`, erwartet && st[2] === p.titel && rufe.includes('LMSInitialize') && rufe.includes('cmi.core.lesson_status=browsed') && fehler.length === 0, st[4] + ' | ' + rufe.join(','));
    if (p.preset && p.preset.stufe === 'quarter') await page.screenshot({ path: path.join(SCREENS, 'paket-quiz-viertelstunden-start.png') });
    page.off('pageerror', hdl);
  }
  await context.close();
}

/* ---------- Ablauf ---------- */
fs.mkdirSync(SCREENS, { recursive: true });
for (const n of fs.readdirSync(SCREENS)) if (n.endsWith('.png')) fs.unlinkSync(path.join(SCREENS, n));
const browser = await chromium.launch();
try {
  const nur = process.env.GERAET;
  for (const g of GERAETE) if (!nur || nur === g.name) await geraetPruefen(browser, g);
  if (!nur) { await speicherGesperrt(browser); await paketePruefen(browser); }
} finally { await browser.close(); server.close(); }

const fehl = ergebnisse.filter(e => !e.ok);
let md = `# Prüfbericht\n\nAutomatisch erzeugt von \`scripts/pruefen.mjs\` am ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} mit Chromium ${browser.version()} und Touch-Emulation. Die App läuft jeweils in einem iframe unter einer 48 px hohen Leiste als Nachbildung des mebis-Rahmens.\n\n**${ergebnisse.length - fehl.length} von ${ergebnisse.length} Prüfungen bestanden.**\n\n`;
for (const g of [...new Set(ergebnisse.map(e => e.gruppe))]) {
  md += `## ${g}\n\n| | Prüfung | Hinweis |\n|---|---|---|\n`;
  for (const e of ergebnisse.filter(x => x.gruppe === g)) md += `| ${e.ok ? '✅' : '❌'} | ${e.name.replace(/\|/g, '/')} | ${e.info.replace(/\|/g, '/')} |\n`;
  md += '\n';
}
fs.writeFileSync(path.join(ROOT, 'docs', 'pruefbericht.md'), md);
console.log(`\n${ergebnisse.length - fehl.length}/${ergebnisse.length} bestanden. Bericht: docs/pruefbericht.md`);
process.exitCode = fehl.length ? 1 : 0;
