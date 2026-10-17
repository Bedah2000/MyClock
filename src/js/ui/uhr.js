/* Die Uhr: Zifferblatt, Lernhilfen, gekoppelte Zeiger, Ziehen mit dem ersten Finger.
   Einheiten im viewBox: außen der Minutenring bis 117, innen das Zifferblatt (Radius 100, mit K verkleinert).
   Zeiger liegen über den Zahlen wie bei einer echten Uhr. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z,A=LU.A;
const NS='http://www.w3.org/2000/svg',RAD=Math.PI/180;
const P=(a,r)=>[r*Math.sin(a*RAD),-r*Math.cos(a*RAD)];
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e;}
const f=n=>n.toFixed(2);

const uhr={};LU.uhr=uhr;
/* Innenblatt verkleinert, damit die Minutenzahlen im Ring größer werden können (ausgemessen mit den Umrissen der Ziffern). */
const K=.93;uhr.K=K;
const R_STUNDE=70,HV=1.05;
/* Minutenring: von der Außenkante des Innenblatts bis zur Innenkante des Rings; alle Minutenzahlen stehen mittig darin, ungestaucht. */
const R_INNEN=100*K+.9*K,R_AUSSEN=116.4-.6,R_MITTE=(R_INNEN+R_AUSSEN)/2;uhr.RING={innen:R_INNEN,aussen:R_AUSSEN,mitte:R_MITTE};
/* Ziffern (Playwrite DE Grund): Ziffernhöhe und Breiten (Anteil am Geviert), Schriftgrößen für Stunden (innen),
   5er-Minuten und alle Minuten, Faktor für die 5er bei allen Minuten. Größen pixelgenau ausgemessen
   (npm run pruefen prüft Abstand und Lage im Ring). */
const S={dh:.935,adv:[.793,.468,.689,.696,.709,.696,.749,.565,.696,.749],stunde:18,m5:13,alle:6,x5:1.06};
uhr.S=S;
const breite=n=>String(n).split('').reduce((b,z)=>b+S.adv[+z],0);
let stundenText=[],minText=[],alleText=[];

uhr.aufbauen=function(){
  $('innen').setAttribute('transform',`scale(${K})`);
  const st=$('striche');
  for(let i=0;i<60;i++){const gross=i%5===0,[x1,y1]=P(i*6,gross?86:91),[x2,y2]=P(i*6,97.5);
    el('line',{x1:f(x1),y1:f(y1),x2:f(x2),y2:f(y2),class:'strich'+(gross?' gross':'')},st);}
  uhr.zahlenBauen();
};
/* Zahl mit Grundlinie aus der Ziffernhöhe: mittig auf (x|y), unabhängig von Browser-Grundlinien. */
function zahl(n,x,y,fs,parent){
  const a={x:f(x),y:f(y+fs*S.dh/2),'font-size':f(fs)};
  const t=el('text',a,parent);t.textContent=n;return t;
}
uhr.zahlenBauen=function(){
  for(const id of ['stundenzahlen','minutenzahlen','alleminuten'])$(id).replaceChildren();
  stundenText=[];minText=[];alleText=[];
  for(let n=1;n<=12;n++){const [x,y]=P(n*30,R_STUNDE);stundenText.push(zahl(n,x,y,S.stunde,$('stundenzahlen')));}
  for(let n=0;n<60;n+=5){const [x,y]=P(n*6,R_MITTE);minText.push(zahl(n,x,y,S.m5,$('minutenzahlen')));}
  for(let n=0;n<60;n++){const [x,y]=P(n*6,R_MITTE),fs=S.alle*(n%5?1:S.x5);alleText.push(zahl(n,x,y,fs,$('alleminuten')));}
};

function keil(a0,grad,r0,r1){
  if(grad<=0.01)return '';
  if(grad>=359.9){ // voller Kreis bzw. Ring
    const ring=(r)=>`M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}Z`;
    return r0>0?ring(r1)+ring(r0):ring(r1);
  }
  const big=grad>180?1:0,[ax,ay]=P(a0,r1),[bx,by]=P(a0+grad,r1);
  if(r0<=0)return `M0 0L${f(ax)} ${f(ay)}A${r1} ${r1} 0 ${big} 1 ${f(bx)} ${f(by)}Z`;
  const [cx,cy]=P(a0+grad,r0),[dx,dy]=P(a0,r0);
  return `M${f(ax)} ${f(ay)}A${r1} ${r1} 0 ${big} 1 ${f(bx)} ${f(by)}L${f(cx)} ${f(cy)}A${r0} ${r0} 0 ${big} 0 ${f(dx)} ${f(dy)}Z`;
}

/* sicht: welche Hilfen gerade gelten (Bereich und Quiz-Hilfe entscheiden mit). */
uhr.zeichne=function(sicht){
  const m=LU.wandMinuten(),ganz=Math.floor(m+1e-6),E=LU.einst;
  $('zeiger-h').setAttribute('transform',`rotate(${f((m%720)*.5)})`);
  $('zeiger-m').setAttribute('transform',`rotate(${f((m%60)*6)})`);
  $('zeiger-s').setAttribute('transform',`rotate(${(LU.teile().second%60)*6})`);
  $('zeiger-h').style.display=E.stundenzeiger?'':'none';
  $('zeiger-m').style.display=sicht.minutenzeiger!==false?'':'none';
  $('zeiger-s').style.display=E.sekundenzeiger&&LU.s.live?'':'none';
  $('stundenzahlen').style.display=sicht.stunden?'':'none';
  $('minutenzahlen').style.display=sicht.minuten&&!sicht.alleMinuten?'':'none';
  $('alleminuten').style.display=sicht.alleMinuten?'':'none';
  const label=LU.label(ganz);
  for(const id of ['zeiger-h','zeiger-m']){$(id).setAttribute('aria-valuenow',ganz);$(id).setAttribute('aria-valuetext',label);}
  // Stundenbereich
  const h12=Math.floor(ganz/60)%12;
  $('sektor').setAttribute('d',sicht.bereich?keil(h12*30,30,0,95):'');
  // Hervorheben: aktuelle Zahl etwa 5 % größer und in ihrer eigenen Farbe leuchtend, alle anderen grau und blass
  const ringe=$('ringe'),fokus=$('mfokus');ringe.replaceChildren();fokus.replaceChildren();
  const hv=!!sicht.hervorheben,cur=h12||12,mm=ganz%60;
  stundenText.forEach((t,i)=>{const an=hv&&i+1===cur;t.setAttribute('font-size',f(S.stunde*(an?HV:1)));
    t.setAttribute('y',f(+P((i+1)*30,R_STUNDE)[1]+S.stunde*(an?HV:1)*S.dh/2));
    t.classList.toggle('matt',hv&&!an);t.classList.toggle('leuchtet',an);
  });
  // Minuten: im 5er-Ring die zuletzt erreichte Zahl, bei allen Minuten die genaue
  const m5=Math.floor(mm/5)*5;
  const zeigMin=sicht.alleMinuten?mm:(sicht.minuten?m5:null);
  minText.forEach((t,i)=>{t.classList.toggle('matt',hv&&i*5!==m5);t.classList.toggle('weg',hv&&i*5===zeigMin&&!sicht.alleMinuten);});
  alleText.forEach((t,i)=>{t.classList.toggle('matt',hv&&i!==mm);t.classList.toggle('weg',hv&&i===zeigMin&&!!sicht.alleMinuten);});
  if(hv&&zeigMin!=null){
    // so groß wie die Zahl darunter, nur etwa 5 % größer
    const [x,y]=P(zeigMin*6,R_MITTE),fs=(sicht.alleMinuten?S.alle*(zeigMin%5?1:S.x5):S.m5)*HV;
    zahl(zeigMin,x,y,fs,fokus).classList.add('leuchtet');
  }
  // Vergangene Zeit
  const v=sicht.vergangen;
  if(v&&v.min>0){
    const startM=v.startWand,dauer=v.min;
    $('verg-h').setAttribute('d',keil((startM%720)*.5,Math.min(360,dauer*.5),0,60));
    $('verg-m').setAttribute('d',keil((startM%60)*6,(dauer%60)*6,64,95));
    const [sx,sy]=P((startM%720)*.5,62);$('start-marke').setAttribute('transform',`translate(${f(sx)} ${f(sy)})`);$('start-marke').style.display='';
  }else{
    $('verg-h').setAttribute('d','');$('verg-m').setAttribute('d','');
    if(v){const [sx,sy]=P((v.startWand%720)*.5,62);$('start-marke').setAttribute('transform',`translate(${f(sx)} ${f(sy)})`);$('start-marke').style.display='';}
    else $('start-marke').style.display='none';
  }
};

/* ---------- Ziehen ---------- */
let zug=null;
const winkelAbstand=(a,b)=>{const d=Math.abs(((a-b)%360+540)%360-180);return d;};
function lokal(e){
  const r=$('uhr').getBoundingClientRect(),sc=r.width/234;
  const dx=(e.clientX-r.left-r.width/2)/sc,dy=(e.clientY-r.top-r.height/2)/sc;
  return {rho:Math.hypot(dx,dy),winkel:(Math.atan2(dx,-dy)/RAD+360)%360};
}
uhr.gesperrt=()=>LU.zeigerGesperrt&&LU.zeigerGesperrt();
function greife(e){
  if(!e.isPrimary||zug||uhr.gesperrt())return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const {rho,winkel}=lokal(e);
  if(rho<10||rho>117)return;
  const m=LU.wandMinuten(),E=LU.einst;
  const dm=LU.s.hilfen.minutenzeiger!==false?winkelAbstand(winkel,(m%60)*6):999,dh=E.stundenzeiger?winkelAbstand(winkel,(m%720)*.5):999;
  const TOL=26;let zeiger=null;
  if(dm<=TOL&&dh<=TOL)zeiger=rho>62*K?'m':'h';
  else if(dm<=TOL)zeiger='m';else if(dh<=TOL)zeiger='h';
  if(!zeiger)return;
  e.preventDefault();
  LU.vorZiehen&&LU.vorZiehen();
  zug={id:e.pointerId,zeiger,letzter:winkel};
  try{$('uhr').setPointerCapture(e.pointerId);}catch(_){}
  $('uhr').classList.add('zieht');
}
function ziehe(e){
  if(!zug||e.pointerId!==zug.id)return;
  const {rho,winkel}=lokal(e);if(rho<6)return;
  const d=((winkel-zug.letzter)%360+540)%360-180;zug.letzter=winkel;
  LU.s.instant+=d*(zug.zeiger==='h'?2:1/6)*Z.MIN;
  LU.zeitGeaendert&&LU.zeitGeaendert();LU.neu();
}
function lasse(e){
  if(!zug||e.pointerId!==zug.id)return;
  zug=null;$('uhr').classList.remove('zieht');
  const m=LU.teile().minutes;
  let ziel=Math.round(m);
  if(LU.s.hilfen.einrasten)ziel=A.snapNearest(m,LU.einst.stufe);
  LU.s.instant+=(ziel-m)*Z.MIN;
  LU.s.instant=Math.round(LU.s.instant/1000)*1000;
  LU.zeitGeaendert&&LU.zeitGeaendert();LU.neu();
}
uhr.abbrechen=function(){if(zug){try{$('uhr').releasePointerCapture(zug.id);}catch(_){}zug=null;$('uhr').classList.remove('zieht');}};
uhr.ziehtGerade=()=>!!zug;

uhr.binden=function(){
  const svg=$('uhr');
  svg.addEventListener('pointerdown',greife);
  svg.addEventListener('pointermove',ziehe);
  svg.addEventListener('pointerup',lasse);
  svg.addEventListener('pointercancel',lasse);
  svg.addEventListener('lostpointercapture',lasse);
  // Ältere Safari- und WebKit-Versionen: Wischen auf der Uhr darf nie scrollen oder zoomen
  const halt=e=>{if(zug||e.touches.length>1)e.preventDefault();};
  svg.addEventListener('touchmove',halt,{passive:false});
  svg.addEventListener('touchstart',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
  for(const [id,schritt] of [['zeiger-h',60],['zeiger-m',1]]){
    $(id).addEventListener('keydown',e=>{
      const r={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];
      if(!r||uhr.gesperrt())return;e.preventDefault();
      LU.vorZiehen&&LU.vorZiehen();LU.s.instant+=r*schritt*Z.MIN;LU.zeitGeaendert&&LU.zeitGeaendert();LU.neu();
    });
  }
};
})();
