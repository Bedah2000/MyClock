// Freigabeprüfung: Browserpfad optional über LU_BROWSER, Bilder optional über LU_SCREENS.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const screenshots=process.env.LU_SCREENS;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.LU_BROWSER||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
for(const [name,width,height,scale] of [['quer',1000,652,1],['hoch',760,952,1],['schmal',320,640,1],['zoom200-simuliert',640,400,2]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'dist/lernuhr.html')).href);
 await page.evaluate(()=>localStorage.clear());await page.reload();await page.evaluate(()=>document.fonts.ready);
 const capture=async label=>{await page.waitForTimeout(300);if(screenshots)await page.screenshot({path:path.join(screenshots,`${name}-${label}.png`),fullPage:true});};
 await page.evaluate(()=>{
  const L=window.LU,h=L.s.hilfen;
  if(h.digital||h.worte||!h.stunden||h.minuten||h.alleMinuten||!L.einst.mond)throw Error('Erststart');
  for(const st of ['full','half','quarter','five','any']){L.setzeStufe(st);if(h.minuten||h.alleMinuten)throw Error('Automatischer Ringwechsel');}
  L.setzeStufe('full');L.schalteHilfe('stundenzeiger');L.schalteHilfe('minutenzeiger');
  if(h.stundenzeiger||h.minutenzeiger)throw Error('Zeiger nicht unabhängig');
  L.schalteHilfe('stundenzeiger');L.schalteHilfe('minutenzeiger');L.zeichne();
 });
 await capture('erststart');
 for(const [label,m] of [['1200',720],['0300',180],['ueberlagerung',720/11]]){
  const angles=await page.evaluate(m=>{const L=window.LU;L.stoppeAlles();L.s.instant=L.Z.wallToInstant('2026-10-18',m,L.zone());L.s.hilfen.erklaerung=true;L.zeichne();return {m:L.wandMinuten(),h:document.getElementById('zeiger-h').getAttribute('transform'),min:document.getElementById('zeiger-m').getAttribute('transform')};},m);
  assert.equal(angles.h,`rotate(${((angles.m%720)*.5).toFixed(2)})`);assert.equal(angles.min,`rotate(${((angles.m%60)*6).toFixed(2)})`);
  await capture(label);
 }
 await page.evaluate(()=>{const L=window.LU,h=L.s.hilfen;h.hervorheben=true;h.bereich=true;h.minuten=true;L.zeichne();});
 assert(await page.locator('#stundenzahlen text.leuchtet').count()===1);
 assert(await page.locator('#stundenzahlen text.matt').count()===11);
 assert(await page.locator('#sektor').getAttribute('d'));
 const ringBefore=await page.locator('#uhr').boundingBox();
 await capture('leuchten-tortenstueck');
 await page.evaluate(()=>{LU.s.hilfen.minuten=false;LU.s.hilfen.alleMinuten=false;LU.zeichne()});
 assert.deepEqual(await page.locator('#uhr').boundingBox(),ringBefore);
 await page.setViewportSize({width:height,height:width});await page.setViewportSize({width,height});
 await page.evaluate(()=>{if(!LU.s.hilfen.hervorheben||!LU.s.hilfen.bereich)throw Error('Zustandsverlust beim Drehen')});
 await page.evaluate(()=>{LU.blatt.oeffnen();LU.s.blatt.reiter='quiz';LU.blatt.zeichne()});
 await capture('einstellungen');
 const panel=width/Math.max(height,width<680?1000:600)<1.15?'#blatt-dock':'#blatt-rechts';
 for(const text of ['Süddeutsch','Hochdeutsch']){
  const control=page.locator(panel+' button').filter({hasText:text}).first();await control.scrollIntoViewIfNeeded();assert(await control.isVisible());
  const fits=await control.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1);assert(fits,'Sprechweise überläuft');
 }
 await capture('einstellungen-gescrollt');
 await page.evaluate(()=>{LU.blatt.schliessen();LU.s.instant=LU.Z.wallToInstant('2026-10-18',720,'Europe/Berlin');LU.wechsle('sonne')});
 await capture('sonne');
 const solar=await page.evaluate(()=>{const p=SunCalc.getPosition(new Date(LU.s.instant),LU.s.place.lat,LU.s.place.lon);return p.altitude;});assert(solar>28&&solar<30);
 const winter=page.locator('[data-schnell="winter"]');await winter.scrollIntoViewIfNeeded();assert(await winter.isVisible());
 await capture('sonne-bedienung-gescrollt');
 await page.evaluate(()=>{LU.s.sonne.vergleich=true;LU.zeichne()});await capture('vergleich');
 await page.evaluate(()=>{LU.wechsle('zeigen');LU.s.hilfen.digital=true;LU.s.hilfen.worte=true;LU.zeichne();document.getElementById('dock').scrollTop=0;window.scrollTo(0,0)});
 await capture('digital-worte');
 assert.deepEqual(errors,[]);console.log(`OK ${name}: Erststart, Hilfen, Zeigerwinkel, Formatwechsel, Einstellungen, Scrollzugang, Sonne und Vergleich`);
 await ctx.close();
}
}finally{await browser.close()}
