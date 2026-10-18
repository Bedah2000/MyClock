/* Himmel hinter der Uhr und Horizontband darunter. Farbe folgt der Sonnenhöhe. Das Band zeigt den Himmel mit
   Blick nach Süden, auf den mittleren Bereich unter der Uhr verkleinert: Osten links, Süden in der Mitte, Westen rechts.
   Sonne und (optional) Mond laufen auf ihren Bahnen, gehen links auf, stehen mittags in der Mitte am höchsten und
   verschwinden rechts hinter dem Boden.
   Im Bereich Sonne wird daraus ein großes Himmelsbild (Schema): Himmelsrichtung waagrecht (Norden am Rand, Osten,
   Süden in der Mitte, Westen), Höhe über dem Horizont senkrecht, für das ganze Jahr im selben Maßstab. Auf- und
   Untergang stehen mit Uhrzeit an ihrer Stelle am Horizont. Die Werte selbst kommen unverändert aus SunCalc. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z;
const NS='http://www.w3.org/2000/svg';
const himmel={};LU.himmel=himmel;

const STOPS=[[-18,'#0A1430','#1B2851'],[-10,'#15254D','#47467A'],[-4,'#2C4983','#E3906F'],[0,'#4770AE','#F3B07D'],
  [6,'#5C9AD6','#F1D7AE'],[15,'#58A4E0','#CFE7F6'],[70,'#4A9ADB','#DCEFFA']];
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>'#'+hex(a).map((v,i)=>Math.round(v+(hex(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
himmel.farben=function(alt){
  if(alt<=STOPS[0][0])return [STOPS[0][1],STOPS[0][2]];
  for(let i=1;i<STOPS.length;i++)if(alt<=STOPS[i][0]){const p=STOPS[i-1],q=STOPS[i],t=(alt-p[0])/(q[0]-p[0]);return [mix(p[1],q[1],t),mix(p[2],q[2],t)];}
  const l=STOPS[STOPS.length-1];return [l[1],l[2]];
};
himmel.verlauf=(alt,richtung='180deg')=>{const [a,b]=himmel.farben(alt);return `linear-gradient(${richtung},${a},${b})`;};
himmel.sonnenhoehe=(t,place=LU.s.place)=>SunCalc.getPosition(new Date(t),place.lat,place.lon).altitude;

/* Sonnenbahn eines Tages: Himmelsrichtung (Grad ab Norden) und Höhe in 10-Minuten-Schritten */
const bahnCache=new Map();
himmel.bahn=function(ymd,place=LU.s.place){
  const key=[ymd,place.lat,place.lon,place.zone].join('|');if(bahnCache.has(key))return bahnCache.get(key);
  const [start,end]=Z.dayBounds(ymd,place.zone),pts=[];
  for(let t=start;t<=end;t+=10*Z.MIN){const p=SunCalc.getPosition(new Date(t),place.lat,place.lon);pts.push([p.azimuth,p.altitude]);}
  if(bahnCache.size>60)bahnCache.clear();bahnCache.set(key,pts);return pts;
};

let BW=0,BH=0;
himmel.groesse=function(){const b=LU.G&&LU.G.band;if(!b)return;BW=b.w;BH=b.h;$('band').setAttribute('viewBox',`0 0 ${BW} ${BH}`);bandKey='';};

function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e;}
let bandKey='',bandTeile=null;
const MAXALT=66;

function sonnenZeichen(parent,r){
  const g=el('g',{},parent);
  for(let k=0;k<8;k++){const w=k*Math.PI/4;el('line',{x1:(Math.cos(w)*r*1.35).toFixed(1),y1:(Math.sin(w)*r*1.35).toFixed(1),x2:(Math.cos(w)*r*1.8).toFixed(1),y2:(Math.sin(w)*r*1.8).toFixed(1),stroke:'#F2A000','stroke-width':Math.max(1.6,r*.3),'stroke-linecap':'round'},g);}
  el('circle',{r,fill:'#FFC93C',stroke:'#E39400','stroke-width':Math.max(1.2,r*.16)},g);
  return g;
}

/* Schmales Horizontband unter der Uhr (Lernuhr und Quiz) */
function baueBand(ymd){
  const svg=$('band');svg.replaceChildren();
  const boden=Math.max(6,BH*.22),hy=BH-boden,oben=Math.max(3,BH*.05);
  const r=Math.max(5,Math.min(BH*.12,(hy-oben)*.22)),cx=BW/2,halb=BW*.36;
  // Himmelsrichtung -> x (Süden = Mitte, Osten/Westen bei halber Breite des mittleren Bereichs), Höhe -> y
  const X=az=>cx+((az-180)/180)*halb,Y=a=>hy-(Math.min(a,MAXALT)/MAXALT)*(hy-oben-r*1.8);
  const teile={X,Y,hy,r};
  const himmelG=el('g',{},svg); // Bahn und Gestirne; der Boden darüber verdeckt alles unter dem Horizont
  let p='',an=false;
  for(const [az,a] of himmel.bahn(ymd)){if(a>0){p+=(an?'L':'M')+X(az).toFixed(1)+' '+Y(a).toFixed(1);an=true;}else an=false;}
  el('path',{d:p,fill:'none',stroke:'#FFE27A','stroke-opacity':.85,'stroke-width':Math.max(2,BH*.03),'stroke-linecap':'round','stroke-linejoin':'round'},himmelG);
  teile.sonnen=[sonnenZeichen(himmelG,r)];
  teile.mond=el('g',{},himmelG);
  el('circle',{r,fill:'#2F3A52','fill-opacity':.6,stroke:'#E3ECF7','stroke-width':Math.max(1.2,r*.12)},teile.mond);
  teile.mondLicht=el('path',{fill:'#FFF2B5'},teile.mond);teile.mondR=r;
  teile.boden=el('rect',{x:0,y:hy,width:BW,height:boden,fill:'#55774F'},svg);
  el('line',{x1:0,x2:BW,y1:hy,y2:hy,stroke:'#E6EFD9','stroke-width':2},svg);
  bandTeile=teile;
}

/* Großes Himmelsbild im Bereich Sonne */
function baueDiagramm(ymd,vergleich){
  const svg=$('band');svg.replaceChildren();
  const css=getComputedStyle(document.documentElement);
  const fs=parseFloat(css.getPropertyValue('--fs-txt'))||18,fk=parseFloat(css.getPropertyValue('--fs-klein'))||15;
  const lh=fs*1.2,pad=Math.round(Math.max(8,fs*.55));
  const G=LU.G,boden=Math.round(lh*(vergleich?5:3)+pad*1.4),hy=BH-boden,oben=G&&G.titel?Math.round(G.titel.y+G.titel.h-G.fenster.y+4):pad;
  const r=Math.round(Math.max(8,Math.min(22,Math.min(BW,BH)*.034)));
  const year=ymd.slice(0,4),tage=vergleich?[year+'-06-21',year+'-12-21']:[ymd],pl=LU.s.place;
  // gleicher Höhenmaßstab das ganze Jahr: Sommer und Winter bleiben vergleichbar
  const maxAlt=Math.max(...[year+'-06-21',year+'-12-21'].map(d=>Math.max(...himmel.bahn(d).map(p=>p[1]))));
  const top=Math.max(30,maxAlt)*1.06;
  const X=az=>pad+((az%360+360)%360)/360*(BW-2*pad),Y=a=>hy-(Math.min(a,top)/top)*(hy-oben-r*1.3);
  const teile={X,Y,hy,r};
  const text=(x,y,t,o={})=>{const e=el('text',Object.assign({x:x.toFixed(1),y:y.toFixed(1),'font-size':o.fs||fs,fill:o.farbe||'#FFFFFF','text-anchor':o.anker||'middle','font-family':'Grund,sans-serif'},o.attr||{}),svg);e.textContent=t;return e;};
  const himmelG=el('g',{},svg);
  // Bahnen (über Norden hinweg wird die Linie getrennt)
  tage.forEach((d,i)=>{
    let p='',an=false,xa=null;
    for(const [az,a] of himmel.bahn(d)){
      if(a>-1){const x=X(az),y=Y(a);p+=(an&&Math.abs(x-xa)<BW/2?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);an=true;xa=x;}
      else an=false;
    }
    const sommer=!vergleich||i===0;
    el('path',{d:p,fill:'none',stroke:sommer?'#FFE27A':'#FFFFFF','stroke-opacity':.9,'stroke-width':Math.max(3,r*.32),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':sommer?'none':`${r*.9} ${r*.7}`},himmelG);
  });
  teile.sonnen=tage.map(()=>sonnenZeichen(himmelG,r));
  teile.mond=el('g',{},himmelG);
  el('circle',{r,fill:'#2F3A52','fill-opacity':.6,stroke:'#E3ECF7','stroke-width':Math.max(1.2,r*.12)},teile.mond);
  teile.mondLicht=el('path',{fill:'#FFF2B5'},teile.mond);teile.mondR=r;
  // Boden mit Horizontlinie; verdeckt alles unter dem Horizont
  teile.boden=el('rect',{x:0,y:hy,width:BW,height:boden,fill:'#55774F'},svg);
  el('line',{x1:0,x2:BW,y1:hy,y2:hy,stroke:'#E6EFD9','stroke-width':2},svg);
  // Himmelsrichtungen an ihrer Stelle
  const yR=BH-pad*.7;
  for(const [az,n] of [[90,'Osten'],[180,'Süden'],[270,'Westen']]){
    el('line',{x1:X(az),x2:X(az),y1:hy,y2:hy+pad*.6,stroke:'#E6EFD9','stroke-width':2},svg);
    text(X(az),yR,n,{farbe:'#DCE8D2'});
  }
  // Auf- und Untergang: Marke am Horizont, darunter Wort und Uhrzeit (Wort nur ohne Vergleich)
  const marke=(az,zeit,wort,farbe,reihe=0)=>{
    const x=X(az),w=Math.max(LU.textEm(wort||'')*fs,LU.textEm(zeit)*fs)/2+2,xt=Math.max(w+2,Math.min(BW-w-2,x));
    el('path',{d:`M${(x-r*.55).toFixed(1)} ${hy+r*.75}L${x.toFixed(1)} ${hy+1}L${(x+r*.55).toFixed(1)} ${hy+r*.75}Z`,fill:farbe},svg);
    if(wort){text(xt,hy+pad*.5+lh*.95,wort);text(xt,hy+pad*.5+lh*1.95,zeit);}
    else text(xt,hy+pad*.5+lh*(.95+reihe),zeit,{farbe});
  };
  tage.forEach((d,i)=>{
    const so=Z.solar(d,pl),farbe=!vergleich||i===0?'#FFE27A':'#FFFFFF';
    if(!so.sunrise||!so.sunset)return;
    const az=t=>SunCalc.getPosition(new Date(t),pl.lat,pl.lon).azimuth;
    marke(az(so.sunrise),Z.clock(so.sunrise,pl.zone),vergleich?'':'Aufgang',farbe,i);
    marke(az(so.sunset),Z.clock(so.sunset,pl.zone),vergleich?'':'Untergang',farbe,i);
  });
  // Vergleich: Legende der beiden Bahnen in der mittleren Zeile des Bodens
  if(vergleich){
    const strich=fk*1.8,luft=fk*.5,abst=fk*1.4,yl=hy+pad*.5+lh*3.2-fk*.35;
    const breite=L=>L.map(([t])=>strich+luft+LU.textEm(t)*fk);
    let L=[['Sommer, 21. Juni','#FFE27A','none'],['Winter, 21. Dezember','#FFFFFF',`${r*.9} ${r*.7}`]];
    if(breite(L).reduce((a,b)=>a+b,0)+abst>BW-2*pad)L=[['Sommer','#FFE27A','none'],['Winter','#FFFFFF',`${r*.9} ${r*.7}`]]; // schmal: ohne Datum
    const breiten=breite(L),ges=breiten.reduce((a,b)=>a+b,0)+abst;
    let x=Math.max(pad,(BW-ges)/2);
    L.forEach(([t,farbe,dash],i)=>{
      el('line',{x1:x,x2:x+strich,y1:yl-fk*.3,y2:yl-fk*.3,stroke:farbe,'stroke-width':Math.max(3,r*.32),'stroke-linecap':'round','stroke-dasharray':dash},svg);
      text(x+strich+luft,yl,t,{fs:fk,anker:'start'});x+=breiten[i]+abst;
    });
  }
  bandTeile=teile;
}

function mondForm(path,phase,r){
  const pts=[],side=phase.waxing?1:-1;
  for(let i=0;i<=24;i++){const y=-r+2*r*i/24;pts.push([side*Math.sqrt(Math.max(0,r*r-y*y)),y]);}
  for(let i=24;i>=0;i--){const y=-r+2*r*i/24;pts.push([side*(1-2*phase.fraction)*Math.sqrt(Math.max(0,r*r-y*y)),y]);}
  path.setAttribute('d','M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L')+'Z');
}

/* an: Himmel sichtbar; beschriften: großes Himmelsbild mit Beschriftung (Bereich Sonne) */
himmel.zeichne=function(an,beschriften,vergleich){
  const app=$('app');app.dataset.himmel=an?'an':'aus';
  if(!an||!BW)return;
  const t=LU.s.instant,ymd=LU.ymd(),place=LU.s.place,m=LU.wandMinuten();
  const key=[ymd,place.lat,place.lon,place.zone,BW,BH,beschriften,vergleich].join('|');
  if(key!==bandKey){bandKey=key;if(beschriften)baueDiagramm(ymd,vergleich);else baueBand(ymd);}
  const year=ymd.slice(0,4),tage=vergleich?[year+'-06-21',year+'-12-21']:[ymd];
  const hoehen=tage.map(d=>d===ymd?himmel.sonnenhoehe(t):himmel.sonnenhoehe(Z.wallToInstant(d,m,place.zone)));
  const fen=$('fenster');
  // Vergleich: Taghimmel, damit beide Bahnen gut zu sehen sind (Tageshelligkeit zeigen die beiden Karten)
  fen.style.background=himmel.verlauf(vergleich?25:hoehen[0]);
  fen.classList.toggle('vergleich',!!vergleich);
  const T=bandTeile;
  T.boden.setAttribute('fill',vergleich||hoehen[0]>-4?'#55774F':'#2E4430');
  // Sonne(n) auf ihrer Bahn; unter dem Horizont verdeckt der Boden sie
  tage.forEach((d,i)=>{
    const p=SunCalc.getPosition(new Date(d===ymd?t:Z.wallToInstant(d,m,place.zone)),place.lat,place.lon),g=T.sonnen[i];
    g.style.display=p.altitude>-10?'':'none';g.setAttribute('transform',`translate(${T.X(p.azimuth).toFixed(1)} ${T.Y(p.altitude).toFixed(1)})`);
  });
  if(LU.einst.mond&&!vergleich){
    const mp=SunCalc.getMoonPosition(new Date(t),place.lat,place.lon);
    T.mond.style.display=mp.altitude>-10?'':'none';
    T.mond.setAttribute('transform',`translate(${T.X(mp.azimuth).toFixed(1)} ${T.Y(mp.altitude).toFixed(1)})`);
    mondForm(T.mondLicht,SunCalc.getMoonIllumination(new Date(t)),T.mondR);
  }else T.mond.style.display='none';
};

/* Jahresband in Sonne: Tageslicht über das Jahr, antippen wählt den Tag */
let jahrKey='';
himmel.jahr=function(){
  const svg=$('jahr');if(!svg.isConnected||!svg.getBoundingClientRect().width)return;
  const w=Math.round(svg.getBoundingClientRect().width),fs=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-txt'))||20;
  const hoch=LU.G.hoch,bh=Math.round((LU.G.hoch?LU.G.dock.h*.17:fs*3.4)),h=bh+(hoch?0:fs*1.4);
  const p=LU.teile(),year=p.year,key=[year,w,h,LU.s.place.lat,LU.s.place.lon,LU.s.place.zone].join('|');
  if(key!==jahrKey){
    jahrKey=key;svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.height=h+'px';
    el('rect',{x:0,y:0,width:w,height:bh,rx:8,fill:'#24394C'},svg);
    const n=Z.daysInYear(year),jan=year+'-01-01';
    for(let d=0;d<n;d+=2){const s=Z.solar(Z.shiftDate(jan,d),LU.s.place),lo=s.alwaysUp?0:s.riseMinute,hi=s.alwaysUp?1440:s.setMinute;
      el('rect',{x:(d/n*w).toFixed(1),y:(lo/1440*bh).toFixed(1),width:(2*w/n+.4).toFixed(1),height:Math.max(0,(hi-lo)/1440*bh).toFixed(1),fill:'#F5D77D'},svg);}
    if(!hoch)['J','F','M','A','M','J','J','A','S','O','N','D'].forEach((b,i)=>{const t=el('text',{x:((Z.dayOfYear(`${year}-${Z.pad(i+1)}-15`)-1)/n*w).toFixed(1),y:bh+fs*.7,'font-size':fs,'text-anchor':'middle','dominant-baseline':'central',fill:'currentColor','font-family':'Grund,sans-serif'},svg);t.textContent=b;});
    el('line',{id:'jahr-marke',y1:-2,y2:bh+2,stroke:'#E8473A','stroke-width':4},svg);
  }
  const n=Z.daysInYear(year),x=((Z.dayOfYear(p.ymd)-.5)/n*w).toFixed(1);
  const mk=svg.querySelector('#jahr-marke');mk.setAttribute('x1',x);mk.setAttribute('x2',x);
  svg.setAttribute('aria-valuetext',Z.dateLabel(p.ymd));
};
himmel.jahrTag=function(e){
  const svg=$('jahr'),r=svg.getBoundingClientRect(),p=LU.teile(),n=Z.daysInYear(p.year);
  const d=Math.max(0,Math.min(n-1,Math.floor((e.clientX-r.left)/r.width*n)));
  return Z.shiftDate(p.year+'-01-01',d);
};
})();
