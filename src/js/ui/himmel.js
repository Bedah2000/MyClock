/* Himmel hinter der Uhr und Horizontband darunter. Farbe folgt der Sonnenhöhe; das Band zeigt
   die Sonnenbahn über die Tageszeit (0 bis 24 Uhr), Aufgang, Untergang und optional den Mond. */
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

/* Sonnenbahn eines Tages: Wanduhr-Minute und Höhe in 10-Minuten-Schritten */
const bahnCache=new Map();
himmel.bahn=function(ymd,place=LU.s.place){
  const key=[ymd,place.lat,place.lon,place.zone].join('|');if(bahnCache.has(key))return bahnCache.get(key);
  const [start,end]=Z.dayBounds(ymd,place.zone),pts=[];
  for(let t=start;t<=end;t+=10*Z.MIN){
    let m=Z.parts(t,place.zone).minutes;if(t===end||(pts.length&&m<pts[pts.length-1][0]-600))m+=1440;
    pts.push([m,SunCalc.getPosition(new Date(t),place.lat,place.lon).altitude]);
  }
  if(bahnCache.size>60)bahnCache.clear();bahnCache.set(key,pts);return pts;
};

let BW=0,BH=0;
himmel.groesse=function(){const b=LU.G&&LU.G.band;if(!b)return;BW=b.w;BH=b.h;$('band').setAttribute('viewBox',`0 0 ${BW} ${BH}`);bandKey='';};

function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent&&parent.appendChild(e);return e;}
let bandKey='',bandTeile=null;
const MAXALT=66;

function baueBand(ymd,vergleich,beschriften){
  const svg=$('band');svg.replaceChildren();
  const fs=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-txt'))||20;
  const boden=Math.max(fs+10,BH*.4),hy=BH-boden,oben=Math.max(4,BH*.06),padX=BW*.045;
  const X=m=>padX+(m/1440)*(BW-2*padX),Y=a=>hy-(Math.max(0,a)/MAXALT)*(hy-oben);
  const teile={X,Y,hy};
  teile.boden=el('rect',{x:0,y:hy,width:BW,height:boden,fill:'#55774F'},svg);
  const year=ymd.slice(0,4),tage=vergleich?[year+'-06-21',year+'-12-21']:[ymd];
  tage.forEach((d,i)=>{
    let p='',an=false;
    for(const [m,a] of himmel.bahn(d)){if(a>0){p+=(an?'L':'M')+X(m).toFixed(1)+' '+Y(a).toFixed(1);an=true;}else an=false;}
    const sommer=!vergleich||i===0;
    el('path',{d:p,fill:'none',stroke:sommer?'#FFE27A':'#FFFFFF','stroke-width':Math.max(2.5,BH*(sommer?.04:.05)),'stroke-linecap':'round','stroke-dasharray':sommer?'none':`${BH*.1} ${BH*.08}`},svg);
  });
  el('line',{x1:0,x2:BW,y1:hy,y2:hy,stroke:'#E6EFD9','stroke-width':2},svg);
  teile.cursor=el('line',{y1:oben,y2:BH,stroke:'#FFFFFF','stroke-opacity':.6,'stroke-width':2},svg);
  teile.sonnen=tage.map(()=>el('circle',{r:Math.max(6,BH*.11),fill:'#FFD84A',stroke:'#7A5A10','stroke-width':2},svg));
  teile.mond=el('g',{},svg);
  const r=Math.max(5,BH*.09);
  el('circle',{r,fill:'#2F3A52',stroke:'#E3ECF7','stroke-width':1.5},teile.mond);
  teile.mondLicht=el('path',{fill:'#FFF2B5'},teile.mond);teile.mondR=r;
  if(beschriften){
    const ly=hy+boden/2,txt=(x,s,anchor)=>{const t=el('text',{x,y:ly,'font-size':fs,fill:'#FFFFFF','text-anchor':anchor,'dominant-baseline':'central','font-family':'Bayerndruck,sans-serif'},svg);t.textContent=s;return t;};
    if(vergleich){txt(padX,'Sommer: gelb','start');txt(BW-padX,'Winter: weiß gestrichelt','end');}
    else{const s=Z.solar(ymd,LU.s.place);
      if(s.sunrise&&s.sunset){txt(X(s.riseMinute),Z.clock(s.sunrise,LU.zone()),'middle');txt(X(s.setMinute),Z.clock(s.sunset,LU.zone()),'middle');}
      txt(X(720),'12','middle').setAttribute('fill','#DCE8D2');}
  }
  bandTeile=teile;
}

function mondForm(path,phase,r){
  const pts=[],side=phase.waxing?1:-1;
  for(let i=0;i<=24;i++){const y=-r+2*r*i/24;pts.push([side*Math.sqrt(Math.max(0,r*r-y*y)),y]);}
  for(let i=24;i>=0;i--){const y=-r+2*r*i/24;pts.push([side*(1-2*phase.fraction)*Math.sqrt(Math.max(0,r*r-y*y)),y]);}
  path.setAttribute('d','M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L')+'Z');
}

/* an: Himmel sichtbar; beschriften: Zeiten im Band (Bereich Sonne) */
himmel.zeichne=function(an,beschriften,vergleich){
  const app=$('app');app.dataset.himmel=an?'an':'aus';
  if(!an||!BW)return;
  const t=LU.s.instant,ymd=LU.ymd(),place=LU.s.place,m=LU.wandMinuten();
  const key=[ymd,place.lat,place.lon,place.zone,BW,BH,beschriften,vergleich].join('|');
  if(key!==bandKey){bandKey=key;baueBand(ymd,vergleich,beschriften);}
  const year=ymd.slice(0,4),tage=vergleich?[year+'-06-21',year+'-12-21']:[ymd];
  const hoehen=tage.map(d=>d===ymd?himmel.sonnenhoehe(t):himmel.sonnenhoehe(Z.wallToInstant(d,m,place.zone)));
  const fen=$('fenster');
  if(vergleich){fen.style.background=`${himmel.verlauf(hoehen[0])} left/50% 100% no-repeat,${himmel.verlauf(hoehen[1])} right/50% 100% no-repeat`;}
  else fen.style.background=himmel.verlauf(hoehen[0]);
  fen.classList.toggle('geteilt',!!vergleich);
  const T=bandTeile,x=T.X(m);
  T.cursor.setAttribute('x1',x);T.cursor.setAttribute('x2',x);
  T.sonnen.forEach((c,i)=>{const a=hoehen[i];c.style.display=a>-1?'':'none';c.setAttribute('cx',x);c.setAttribute('cy',T.Y(a));});
  T.boden.setAttribute('fill',hoehen[0]>-4?'#55774F':'#2E4430');
  if(LU.einst.mond&&!vergleich){
    const mp=SunCalc.getMoonPosition(new Date(t),place.lat,place.lon);
    T.mond.style.display=mp.altitude>-.5?'':'none';
    T.mond.setAttribute('transform',`translate(${x} ${T.Y(mp.altitude)})`);
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
    if(!hoch)['J','F','M','A','M','J','J','A','S','O','N','D'].forEach((b,i)=>{const t=el('text',{x:((Z.dayOfYear(`${year}-${Z.pad(i+1)}-15`)-1)/n*w).toFixed(1),y:bh+fs*.7,'font-size':fs,'text-anchor':'middle','dominant-baseline':'central',fill:'currentColor','font-family':'Bayerndruck,sans-serif'},svg);t.textContent=b;});
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
