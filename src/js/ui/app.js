/* Start, Zeichnen, Zeitlauf, Bereichswechsel */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z;

/* ---------- Zeitlauf: ein Antrieb für Zeigen, Quiz und Sonne ---------- */
let frame=null,vorher=null,liveTimer=null;
LU.animiere=function(a){
  LU.s.anim=a;vorher=null;
  if(frame===null)frame=requestAnimationFrame(schritt);
};
function schritt(ts){
  frame=null;const a=LU.s.anim;if(!a)return;
  if(a.art==='gehe'){ // feste Dauer, weich ein- und ausgeblendet (Zufallszeit)
    if(a.t0==null)a.t0=ts;
    const ruhig=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p=ruhig?1:Math.min(1,(ts-a.t0)/a.dauer),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    LU.s.instant=a.von+(a.ziel-a.von)*e;
    if(p>=1){LU.s.instant=a.ziel;LU.s.anim=null;vorher=null;LU.zeichne();return;}
    LU.zeichne();frame=requestAnimationFrame(schritt);return;
  }
  if(vorher!==null&&!a.pause){
    const dt=Math.min((ts-vorher)/1000,.1);
    if(a.art==='lauf'){LU.s.instant+=a.richtung*a.rate*dt*Z.MIN;}
    else{LU.s.instant=Math.min(a.ziel,LU.s.instant+a.rate*dt*Z.MIN);
      if(LU.s.instant>=a.ziel){LU.s.anim=null;vorher=null;LU.zeichne();a.fertig&&a.fertig();return;}}
    LU.grenzen();LU.zeichne();
  }
  vorher=ts;frame=requestAnimationFrame(schritt);
}
LU.stoppeAlles=function(){
  LU.s.anim=null;vorher=null;if(frame!==null){cancelAnimationFrame(frame);frame=null;}
  LU.liveStopp();LU.uhr.abbrechen&&0;
};
/* Echtzeit: im Takt der Sekunde, damit der Sekundenzeiger genau auf den Minutenstrichen springt */
function liveTakt(){
  if(!LU.s.live)return;
  if(!document.hidden){LU.s.instant=Date.now();LU.zeichne();}
  liveTimer=setTimeout(liveTakt,1000-Date.now()%1000+8);
}
LU.liveStart=function(){if(liveTimer)clearTimeout(liveTimer);LU.s.live=true;liveTimer=setTimeout(liveTakt,1000-Date.now()%1000+8);};
LU.liveStopp=function(){LU.s.live=false;if(liveTimer){clearTimeout(liveTimer);liveTimer=null;}};
/* Datum bleibt im Bereich der Vorlage (1900 bis 2100) */
LU.grenzen=function(){
  const p=LU.teile();if(Z.validDate(p.ymd))return;
  LU.stoppeAlles();LU.s.instant=Z.wallToInstant(p.year<1900?'1900-01-01':'2100-12-31',p.year<1900?0:1439,LU.zone());
};
LU.vorZiehen=function(){LU.stoppeAlles();};
LU.zeigerGesperrt=function(){
  if(LU.einst.zeigerSperren)return true;
  if(LU.s.bereich==='quiz'&&LU.quiz.gesperrt())return true;
  return false;
};
LU.setzeOrt=function(ort){
  const p=LU.teile();LU.stoppeAlles();LU.s.place=ort;LU.s.instant=Z.wallToInstant(p.ymd,p.minutes,ort.zone);LU.neu();
};

/* ---------- Lob ---------- */
let lobTimer=null;
LU.lob=function(text){
  const l=$('lob');$('lob-text').textContent=text;l.classList.remove('an');void l.offsetWidth;
  // statt Konfetti: die Uhr leuchtet kurz auf
  const u=$('uhr');u.classList.remove('lob-leuchten');void u.getBoundingClientRect();u.classList.add('lob-leuchten');
  l.classList.add('an');clearTimeout(lobTimer);lobTimer=setTimeout(()=>{l.classList.remove('an');u.classList.remove('lob-leuchten');},1500);
};

/* ---------- Bereich ---------- */
LU.wechsle=function(b){
  if(b===LU.s.bereich)return;
  LU.stoppeAlles();LU.uhr.abbrechen();LU.sprache.stopp();
  LU.s.bereich=b;LU.s.autoHilfe=null;
  if(b==='quiz'&&!LU.s.quiz)LU.quiz.neu();
  if(b==='quiz'&&LU.s.quiz&&['lauf','frage','dauer','gut1','gut2'].includes(LU.s.quiz.phase))LU.quiz.neu();
  if(b!=='sonne')LU.s.sonne.vergleich=false;
  if(LU.s.blatt)LU.blatt.schliessen();
  $('entsperren').hidden=true;
  LU.layout(true);
};

/* ---------- Zeichnen ---------- */
LU.zeichne=function(){
  const s=LU.s,E=LU.einst,b=s.bereich,h=s.hilfen,a=s.autoHilfe||{},app=$('app');
  app.dataset.bereich=b;
  // Kopf
  for(const k of LU.qa('#bereiche [data-bereich]'))k.setAttribute('aria-pressed',String(k.dataset.bereich===b));
  $('bereiche').hidden=E.bereichSperre;$('bereich-name').hidden=!E.bereichSperre;
  $('bereich-name').textContent={zeigen:'Zeigen',quiz:'Quiz',sonne:'Sonne'}[b];
  const digitalAn=b==='quiz'?LU.quiz.digitalSichtbar():h.digital;
  const satzAn=b==='quiz'&&!$('kopf-satz').hidden;
  $('digital').classList.toggle('aus',!digitalAn&&!satzAn);
  $('digital-zeit').hidden=satzAn;
  const m=Math.floor(LU.wandMinuten()+1e-6);$('digital-zeit').textContent=LU.label(m);
  $('digital').setAttribute('aria-label',digitalAn?'Uhrzeit '+LU.label(m):'Uhrzeit verdeckt');
  // Uhr
  // Im Quiz verraten Stundenbereich und Hervorheben die Lösung: dort nur als Hilfe nach zwei Fehlversuchen
  const quiz=b==='quiz';
  const sicht={stunden:h.stunden,minuten:h.minuten,alleMinuten:h.alleMinuten,bereich:(!quiz&&h.bereich)||!!a.bereich,hervorheben:(!quiz&&h.hervorheben)||!!a.hervorheben,minutenzeiger:h.minutenzeiger,vergangen:null};
  if(b==='zeigen'&&s.start!=null)sicht.vergangen={startWand:Z.parts(s.start,LU.zone()).minutes,min:(s.instant-s.start)/Z.MIN};
  if(b==='quiz'&&s.quiz&&s.quiz.start!=null&&(a.vergangen||(s.quiz.phase==='lauf'&&E.dauerZeigen)))
    sicht.vergangen={startWand:Z.parts(s.quiz.start,LU.zone()).minutes,min:(s.instant-s.quiz.start)/Z.MIN};
  app.classList.toggle('gesperrt',LU.zeigerGesperrt());
  LU.uhr.zeichne(sicht);
  // Himmel
  LU.himmel.zeichne(b==='sonne'||E.himmel,b==='sonne',b==='sonne'&&s.sonne.vergleich);
  // Bereich
  if(b==='zeigen')LU.zeigen.zeichne();
  else if(b==='quiz')LU.quiz.zeichne();
  else LU.sonne.zeichne();
  LU.zeilenAufraeumen();
};

/* ---------- Start ---------- */
function start(){
  LU.laden();LU.voreinstellung();
  document.documentElement.dataset.schema=LU.einst.schema;
  LU.uhr.aufbauen();LU.uhr.binden();
  LU.zeigen.binden();LU.quiz.binden();LU.sonne.binden();LU.blatt.binden();
  LU.setzeStufe(LU.einst.stufe);LU.quiz.neu();
  for(const k of LU.qa('#bereiche [data-bereich]'))LU.tippen(k,()=>LU.wechsle(k.dataset.bereich));
  for(const b of LU.qa('.b-vorlesen button'))b.addEventListener('pointerdown',()=>LU.entsperreMedien());
  // Vollbild nur, wenn der Rahmen es erlaubt
  const vb=$('vollbild'),erlaubt=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  vb.hidden=!erlaubt;
  if(erlaubt){
    LU.tippen(vb,()=>{
      const d=document,an=d.fullscreenElement||d.webkitFullscreenElement;
      try{if(an)(d.exitFullscreen||d.webkitExitFullscreen).call(d);else{const r=d.documentElement;(r.requestFullscreen||r.webkitRequestFullscreen).call(r);}}catch(e){}
    });
    const upd=()=>{vb.textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'Vollbild beenden':'Vollbild';};
    document.addEventListener('fullscreenchange',upd);document.addEventListener('webkitfullscreenchange',upd);
  }
  const zurueck=()=>{if(window.scrollX||window.scrollY)window.scrollTo(0,0);const a=$('app');if(a.scrollTop||a.scrollLeft){a.scrollTop=0;a.scrollLeft=0;}};
  window.addEventListener('scroll',zurueck,{passive:true});$('app').addEventListener('scroll',zurueck,{passive:true});
  const neuLayout=()=>LU.layout();
  window.addEventListener('resize',neuLayout);
  window.addEventListener('orientationchange',()=>setTimeout(neuLayout,150));
  if(window.visualViewport)visualViewport.addEventListener('resize',neuLayout);
  if(window.ResizeObserver)new ResizeObserver(neuLayout).observe(document.documentElement);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&LU.s.live){LU.s.instant=Date.now();LU.neu();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(LU.s.blatt)LU.blatt.schliessen();else{LU.stoppeAlles();LU.neu();}}});
  LU.layout(true);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>LU.layout(true));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
