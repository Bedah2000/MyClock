/* Zustand der App. Nichts davon betrifft Lernende; gespeichert werden höchstens Gerät-Einstellungen. */
(function(){
'use strict';
const LU=window.LU={};
const Z=LU.Z=window.Lernzeit, W=LU.W=window.Worte, A=LU.A=window.Aufgaben;
LU.$=id=>document.getElementById(id);
LU.qa=(sel,root=document)=>Array.from(root.querySelectorAll(sel));

const GERAET_KEY='lernuhr-geraet';
LU.einst={
  stufe:'full', antworten:'leicht', aufgabe:'zahlen', sprechweise:'sued',
  runde:5, tempoAblauf:'mittel', dauerZeigen:false,
  zeigerSperren:false, sekundenzeiger:true, himmel:true,
  ort:'herrieden', mond:true, eigenerOrt:{lat:49.23,lon:10.5,zone:'Europe/Berlin'},
  layout:'auto', schema:'hell', ton:true, lob:'kurz', bereichSperre:false
};
LU.STUFEN={full:'Volle Stunden',half:'Halbe Stunden',quarter:'Viertelstunden',five:'5 Minuten',any:'Alle Minuten'};
/* Beschriftung der Knöpfe: „Viertelstunden“ darf in schmalen Knöpfen getrennt werden */
LU.STUFEN_KNOPF=Object.assign({},LU.STUFEN,{quarter:'Viertel\u00adstunden'});
LU.ZONEN=[['Europe/Berlin','Deutschland'],['Europe/London','London'],['America/New_York','New York'],['Asia/Tokyo','Tokio'],['Australia/Sydney','Sydney'],['UTC','UTC']];

/* Hilfen auf der Uhr: gelten für alle Stufen. Beim ersten Start nur die Stundenzahlen und beide Zeiger;
   alles andere blendet die Lehrkraft bei Bedarf ein. Die Auswahl merkt sich das Gerät. */
LU.HILFEN_UHR=['stunden','minuten','alleMinuten','bereich','hervorheben','stundenzeiger','minutenzeiger','einrasten','erklaerung'];
LU.HILFEN_STANDARD={digital:false,worte:false,stunden:true,minuten:false,alleMinuten:false,bereich:false,hervorheben:false,
  stundenzeiger:true,minutenzeiger:true,einrasten:true,erklaerung:false};
const HILFEN_KEY='lernuhr-hilfen';
/* Hilfen im Quiz: eigene Auswahl, ebenfalls für alle Stufen. Stundenbereich und Hervorheben verraten die Lösung und
   sind deshalb aus; nach Fehlern helfen sie ohnehin automatisch. */
LU.HILFEN_QUIZ=['stunden','minuten','alleMinuten','bereich','hervorheben','stundenzeiger','minutenzeiger','erklaerung'];
LU.QUIZ_STANDARD={stunden:true,minuten:false,alleMinuten:false,bereich:false,hervorheben:false,stundenzeiger:true,minutenzeiger:true,erklaerung:false};
const QUIZ_KEY='lernuhr-quizhilfen';
LU.quizHilfen=Object.assign({},LU.QUIZ_STANDARD);

const heute=Z.parts(Date.now(),'Europe/Berlin').ymd;
LU.s={
  bereich:'zeigen',
  place:Object.assign({},Z.places.herrieden),
  instant:Z.wallToInstant(heute,900,'Europe/Berlin'), // erster Start: 15 Uhr, beide Zeiger gut getrennt
  hilfen:Object.assign({},LU.HILFEN_STANDARD),
  form:'sued', live:false, start:null,
  quiz:null, sonne:{vergleich:false}, blatt:null, autoHilfe:null, anim:null
};

/* Gerät-Einstellungen: nur Darstellung, Farben, Ton. Jeder Zugriff abgesichert. */
LU.laden=function(){
  try{
    const raw=window.localStorage&&localStorage.getItem(GERAET_KEY);
    if(raw){const v=JSON.parse(raw);for(const k of ['layout','schema','ton','lob'])if(k in v)LU.einst[k]=v[k];}
  }catch(e){/* Speicher gesperrt: Voreinstellungen gelten */}
  // Hilfen (flach); ältere Speicherstände je Stufe haben keine flachen Werte und werden übergangen
  try{
    const raw=window.localStorage&&localStorage.getItem(HILFEN_KEY);
    if(raw){const v=JSON.parse(raw);for(const k in LU.HILFEN_STANDARD)if(typeof v[k]==='boolean')LU.s.hilfen[k]=v[k];}
  }catch(e){}
  try{
    const raw=window.localStorage&&localStorage.getItem(QUIZ_KEY);
    if(raw){const v=JSON.parse(raw);for(const k of LU.HILFEN_QUIZ)if(typeof v[k]==='boolean')LU.quizHilfen[k]=v[k];}
  }catch(e){}
  for(const h of [LU.s.hilfen,LU.quizHilfen]){if(h.minuten&&h.alleMinuten)h.minuten=false;}
};
LU.hilfenSpeichern=function(){try{localStorage.setItem(HILFEN_KEY,JSON.stringify(LU.s.hilfen));}catch(e){}};
/* Stufe wählen: gilt für Zeigen (Zufall, Einrasten) und Quiz (Lernstufe). Die Hilfen bleiben, wie sie sind. */
LU.setzeStufe=function(st){
  if(!A.STEP[st])return;
  const neu=LU.einst.stufe!==st;LU.einst.stufe=st;
  if(neu&&LU.quiz&&LU.s.quiz)LU.quiz.neu();
};
/* Nur die beiden Minutenzahlen-Ringe schließen sich aus. Zeiger sind unabhängig schaltbar. */
function schalte(h,k){
  h[k]=!h[k];
  if(k==='minuten'&&h.minuten)h.alleMinuten=false;
  if(k==='alleMinuten'&&h.alleMinuten)h.minuten=false;
}
LU.schalteHilfe=function(k){schalte(LU.s.hilfen,k);LU.hilfenSpeichern();};
LU.hilfenZuruecksetzen=function(){Object.assign(LU.s.hilfen,LU.HILFEN_STANDARD);LU.hilfenSpeichern();
  Object.assign(LU.quizHilfen,LU.QUIZ_STANDARD);LU.quizSpeichern();};
LU.quizSpeichern=function(){try{localStorage.setItem(QUIZ_KEY,JSON.stringify(LU.quizHilfen));}catch(e){}};
LU.quizHilfeAn=k=>!!LU.quizHilfen[k];
LU.schalteQuizHilfe=function(k){schalte(LU.quizHilfen,k);LU.quizSpeichern();};
LU.speichern=function(){
  try{localStorage.setItem(GERAET_KEY,JSON.stringify({layout:LU.einst.layout,schema:LU.einst.schema,ton:LU.einst.ton,lob:LU.einst.lob}));}catch(e){}
};
/* Voreinstellung aus dem SCORM-Paket (vom Bauskript eingesetzt). */
LU.voreinstellung=function(){
  const v=window.LERNUHR_VOREINSTELLUNG;if(!v||typeof v!=='object')return;
  if(v.stufe&&A.STEP[v.stufe])LU.einst.stufe=v.stufe;
  if(v.bereich&&['zeigen','quiz','sonne'].includes(v.bereich))LU.s.bereich=v.bereich;
};

/* Zeit-Hilfen */
LU.zone=()=>LU.s.place.zone;
LU.teile=(t=LU.s.instant)=>Z.parts(t,LU.zone());
LU.wandMinuten=()=>{const m=LU.teile().minutes;return ((m%1440)+1440)%1440;};
LU.ymd=()=>LU.teile().ymd;
LU.hm=t=>Z.clock(t,LU.zone());
LU.label=min=>{const t=((Math.round(min)%1440)+1440)%1440;return Z.pad(Math.floor(t/60))+':'+Z.pad(t%60);};
LU.formText=f=>f==='hoch'?'hochdeutsch':'süddeutsch';

/* Tippen: nur der erste Kontakt zählt. Weitere Finger oder ein Handballen lösen nichts aus. */
const aktiv=new Map();let mehrfach=false,ersterZiel=null;
document.addEventListener('pointerdown',e=>{
  if(aktiv.size>0||!e.isPrimary){mehrfach=true;aktiv.set(e.pointerId,false);return;}
  aktiv.set(e.pointerId,true);ersterZiel=e.target;LU.entsperreMedien();
},true);
const ende=e=>{aktiv.delete(e.pointerId);if(aktiv.size===0){setTimeout(()=>{if(aktiv.size===0)mehrfach=false;},80);}};
document.addEventListener('pointerup',ende,true);
document.addEventListener('pointercancel',ende,true);
document.addEventListener('click',e=>{
  if(e.detail===0)return; // Tastatur
  if(mehrfach&&ersterZiel&&!(ersterZiel===e.target||ersterZiel.contains&&ersterZiel.contains(e.target)||e.target.contains&&e.target.contains(ersterZiel))){e.stopPropagation();e.preventDefault();}
},true);
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());

/* Auslösen beim Loslassen des ersten Fingers (ohne auf ein click-Ereignis zu warten, das nach
   Wischbewegungen ausbleiben kann). click bleibt als Rückfall, etwa für die Tastatur. */
let getippt=0;
/* Nach dem Auslösen per Loslassen folgt ein click; der darf nichts mehr auslösen, auch wenn an
   derselben Stelle inzwischen ein neuer Knopf liegt. */
document.addEventListener('click',e=>{if(e.detail!==0&&performance.now()-getippt<700){e.stopPropagation();e.preventDefault();}},true);
LU.tippen=function(el,fn){
  let start=null,zuletzt=0;
  el.addEventListener('pointerdown',e=>{start=(e.isPrimary&&!mehrfach&&!(e.pointerType==='mouse'&&e.button!==0))?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;});
  el.addEventListener('pointercancel',()=>{start=null;});
  el.addEventListener('pointerup',e=>{
    if(!start||e.pointerId!==start.id)return;
    const weg=Math.hypot(e.clientX-start.x,e.clientY-start.y);start=null;
    if(weg>30||mehrfach||el.disabled)return;
    zuletzt=Date.now();getippt=performance.now();fn(e);
  });
  el.addEventListener('click',e=>{if(Date.now()-zuletzt<900||el.disabled)return;fn(e);});
};

/* Ton und Sprache dürfen in Safari erst nach der ersten Berührung starten. */
let entsperrt=false;
LU.entsperreMedien=function(){
  if(entsperrt)return;entsperrt=true;
  try{LU.ton&&LU.ton.entsperren();}catch(e){}
};

/* Aktualisierung bündeln */
let geplant=false;
LU.neu=function(){if(geplant)return;geplant=true;requestAnimationFrame(()=>{geplant=false;LU.zeichne();});};
})();
