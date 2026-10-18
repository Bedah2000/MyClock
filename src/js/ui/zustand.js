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
  zeigerSperren:false, stundenzeiger:true, sekundenzeiger:true, himmel:true,
  ort:'herrieden', mond:false, eigenerOrt:{lat:49.23,lon:10.5,zone:'Europe/Berlin'},
  layout:'auto', schema:'hell', ton:true, lob:'kurz', bereichSperre:false
};
LU.STUFEN={full:'volle Stunden',half:'halbe Stunden',quarter:'Viertelstunden',five:'5 Minuten',any:'alle Minuten'};
LU.STUFEN_KURZ={full:'volle',half:'halbe',quarter:'Viertel',five:'5 Min.',any:'alle'};
LU.ZONEN=[['Europe/Berlin','Deutschland'],['Europe/London','London'],['America/New_York','New York'],['Asia/Tokyo','Tokio'],['Australia/Sydney','Sydney'],['UTC','UTC']];

/* Stufen: jede bringt passende Hilfen auf der Uhr mit und merkt sich Änderungen (auf diesem Gerät). */
LU.HILFEN_STUFE=['stunden','minuten','alleMinuten','bereich','hervorheben','minutenzeiger','einrasten'];
LU.STUFEN_STANDARD={
  full:   {stunden:true,minuten:false,alleMinuten:false,bereich:true, hervorheben:true, minutenzeiger:true,einrasten:true},
  half:   {stunden:true,minuten:false,alleMinuten:false,bereich:true, hervorheben:false,minutenzeiger:true,einrasten:true},
  quarter:{stunden:true,minuten:true, alleMinuten:false,bereich:false,hervorheben:false,minutenzeiger:true,einrasten:true},
  five:   {stunden:true,minuten:true, alleMinuten:false,bereich:false,hervorheben:false,minutenzeiger:true,einrasten:true},
  any:    {stunden:true,minuten:false,alleMinuten:true, bereich:false,hervorheben:false,minutenzeiger:true,einrasten:false}
};
const STUFEN_KEY='lernuhr-stufen';
LU.stufenHilfen=JSON.parse(JSON.stringify(LU.STUFEN_STANDARD));
/* Hilfen im Quiz: eigene Auswahl je Lernstufe. Stundenbereich und Hervorheben verraten die Lösung und sind
   deshalb aus; nach Fehlern helfen sie ohnehin automatisch. */
LU.HILFEN_QUIZ=['stunden','minuten','alleMinuten','bereich','hervorheben','minutenzeiger'];
const Q=(m,a)=>({stunden:true,minuten:m,alleMinuten:a,bereich:false,hervorheben:false,minutenzeiger:true});
LU.QUIZ_STANDARD={full:Q(false,false),half:Q(false,false),quarter:Q(true,false),five:Q(true,false),any:Q(false,true)};
const QUIZ_KEY='lernuhr-quizhilfen';
LU.quizHilfen=JSON.parse(JSON.stringify(LU.QUIZ_STANDARD));

const heute=Z.parts(Date.now(),'Europe/Berlin').ymd;
LU.s={
  bereich:'zeigen',
  place:Object.assign({},Z.places.herrieden),
  instant:Z.wallToInstant(heute,540,'Europe/Berlin'),
  hilfen:Object.assign({digital:true,worte:false},LU.stufenHilfen.full),
  form:'sued', live:false, start:null,
  quiz:null, sonne:{vergleich:false}, blatt:null, autoHilfe:null, anim:null
};

/* Gerät-Einstellungen: nur Darstellung, Farben, Ton. Jeder Zugriff abgesichert. */
LU.laden=function(){
  try{
    const raw=window.localStorage&&localStorage.getItem(GERAET_KEY);
    if(raw){const v=JSON.parse(raw);for(const k of ['layout','schema','ton','lob'])if(k in v)LU.einst[k]=v[k];}
  }catch(e){/* Speicher gesperrt: Voreinstellungen gelten */}
  try{
    const raw=window.localStorage&&localStorage.getItem(STUFEN_KEY);
    if(raw){const v=JSON.parse(raw);for(const st in LU.stufenHilfen)if(v[st])for(const k of LU.HILFEN_STUFE)if(typeof v[st][k]==='boolean')LU.stufenHilfen[st][k]=v[st][k];}
  }catch(e){}
  try{
    const raw=window.localStorage&&localStorage.getItem(QUIZ_KEY);
    if(raw){const v=JSON.parse(raw);for(const st in LU.quizHilfen)if(v[st])for(const k of LU.HILFEN_QUIZ)if(typeof v[st][k]==='boolean')LU.quizHilfen[st][k]=v[st][k];}
  }catch(e){}
};
LU.stufenSpeichern=function(){try{localStorage.setItem(STUFEN_KEY,JSON.stringify(LU.stufenHilfen));}catch(e){}};
/* Stufe wählen: gilt für Zeigen (Zufall, Einrasten, Hilfen) und Quiz (Lernstufe). */
LU.setzeStufe=function(st){
  if(!A.STEP[st])return;
  const neu=LU.einst.stufe!==st;LU.einst.stufe=st;
  for(const k of LU.HILFEN_STUFE)LU.s.hilfen[k]=LU.stufenHilfen[st][k];
  if(LU.s.hilfen.minuten&&LU.s.hilfen.alleMinuten)LU.s.hilfen.minuten=false;
  if(!LU.einst.stundenzeiger&&!LU.s.hilfen.minutenzeiger)LU.s.hilfen.minutenzeiger=true;
  if(neu&&LU.quiz&&LU.s.quiz)LU.quiz.neu();
};
LU.schalteHilfe=function(k){
  const h=LU.s.hilfen;h[k]=!h[k];
  if(k==='minuten'&&h.minuten)h.alleMinuten=false;
  if(k==='alleMinuten'&&h.alleMinuten)h.minuten=false;
  if(k==='minutenzeiger'&&!h.minutenzeiger&&!LU.einst.stundenzeiger)h.minutenzeiger=true;
  if(LU.HILFEN_STUFE.includes(k)){const st=LU.stufenHilfen[LU.einst.stufe];for(const x of LU.HILFEN_STUFE)st[x]=h[x];LU.stufenSpeichern();}
};
LU.stufenZuruecksetzen=function(){LU.stufenHilfen=JSON.parse(JSON.stringify(LU.STUFEN_STANDARD));LU.stufenSpeichern();
  LU.quizHilfen=JSON.parse(JSON.stringify(LU.QUIZ_STANDARD));LU.quizSpeichern();LU.setzeStufe(LU.einst.stufe);};
LU.quizSpeichern=function(){try{localStorage.setItem(QUIZ_KEY,JSON.stringify(LU.quizHilfen));}catch(e){}};
LU.quizHilfeAn=k=>!!LU.quizHilfen[LU.einst.stufe][k];
LU.schalteQuizHilfe=function(k){
  const h=LU.quizHilfen[LU.einst.stufe];h[k]=!h[k];
  if(k==='minuten'&&h.minuten)h.alleMinuten=false;
  if(k==='alleMinuten'&&h.alleMinuten)h.minuten=false;
  if(k==='minutenzeiger'&&!h.minutenzeiger&&!LU.einst.stundenzeiger)h.minutenzeiger=true;
  LU.quizSpeichern();
};
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
