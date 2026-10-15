/* Die Uhr: Zifferblatt, Lernhilfen, gekoppelte Zeiger, Ziehen mit dem ersten Finger.
   Einheiten im viewBox: Zifferblatt-Radius 100, Minutenzahlen außen bis 117. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z,A=LU.A;
const NS='http://www.w3.org/2000/svg',RAD=Math.PI/180;
const P=(a,r)=>[r*Math.sin(a*RAD),-r*Math.cos(a*RAD)];
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e;}
const f=n=>n.toFixed(2);

const uhr={};LU.uhr=uhr;
const stundenText=[],minText=[],alleText=[];

uhr.aufbauen=function(){
  const st=$('striche');
  for(let i=0;i<60;i++){const gross=i%5===0,[x1,y1]=P(i*6,gross?86:91),[x2,y2]=P(i*6,97.5);
    el('line',{x1:f(x1),y1:f(y1),x2:f(x2),y2:f(y2),class:'strich'+(gross?' gross':'')},st);}
  const maske=$('zahlmaske');for(let n=1;n<=12;n++){const [x,y]=P(n*30,72);el('circle',{cx:f(x),cy:f(y),r:n>9?12.5:10,fill:'#000'},maske);}
  for(let n=1;n<=12;n++){const [x,y]=P(n*30,72);const t=el('text',{x:f(x),y:f(y),'font-size':17},$('stundenzahlen'));t.textContent=n;stundenText.push(t);}
  for(let n=0;n<60;n+=5){const [x,y]=P(n*6,109.5);const t=el('text',{x:f(x),y:f(y),'font-size':11.5},$('minutenzahlen'));t.textContent=n;minText.push(t);}
  for(let n=0;n<60;n++){const [x,y]=P(n*6,109.8),fs=n%5?9.6:10.8,a={x:f(x),y:f(y),'font-size':fs};
    if(n>9){a.textLength=(fs*1.05).toFixed(2);a.lengthAdjust='spacingAndGlyphs';}
    const t=el('text',a,$('alleminuten'));t.textContent=n;alleText.push(t);}
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
  $('zeiger-s').setAttribute('transform',`rotate(${f((m*60%60)*6)})`);
  $('zeiger-h').style.display=E.stundenzeiger?'':'none';
  $('zeiger-m').style.display=E.minutenzeiger?'':'none';
  $('zeiger-s').style.display=E.sekundenzeiger&&LU.s.live?'':'none';
  $('stundenzahlen').style.display=sicht.stunden?'':'none';
  $('zeiger-maske').setAttribute('mask',sicht.stunden?'url(#zahlmaske)':'');
  $('minutenzahlen').style.display=sicht.minuten&&!sicht.alleMinuten?'':'none';
  $('alleminuten').style.display=sicht.alleMinuten?'':'none';
  const label=LU.label(ganz);
  for(const id of ['zeiger-h','zeiger-m']){$(id).setAttribute('aria-valuenow',ganz);$(id).setAttribute('aria-valuetext',label);}
  // Stundenbereich
  const h12=Math.floor(ganz/60)%12;
  $('sektor').setAttribute('d',sicht.bereich?keil(h12*30,30,0,95):'');
  // Hervorheben: aktuelle Zahl größer mit Ring
  const ringe=$('ringe');ringe.replaceChildren();
  const hv=sicht.hervorheben,cur=h12||12,mm=ganz%60;
  stundenText.forEach((t,i)=>{const an=hv&&i+1===cur;t.setAttribute('font-size',an?21:17);
    if(an){const [x,y]=P((i+1)*30,72);el('circle',{cx:f(x),cy:f(y),r:14,class:'ring'},ringe);}});
  minText.forEach((t,i)=>t.setAttribute('font-size',hv&&i*5===mm?14:11.5));
  alleText.forEach((t,i)=>{const fs=hv&&i===mm?12.5:(i%5?9.6:10.8);t.setAttribute('font-size',fs);if(i>9)t.setAttribute('textLength',(fs*1.05).toFixed(2));});
  if(hv&&sicht.stunden===false){/* keine Ringe ohne Zahlen */ringe.replaceChildren();}
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
  const dm=E.minutenzeiger?winkelAbstand(winkel,(m%60)*6):999,dh=E.stundenzeiger?winkelAbstand(winkel,(m%720)*.5):999;
  const TOL=26;let zeiger=null;
  if(dm<=TOL&&dh<=TOL)zeiger=rho>62?'m':'h';
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
  if(LU.einst.einrasten)ziel=A.snapNearest(m,LU.einst.stufe);
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
