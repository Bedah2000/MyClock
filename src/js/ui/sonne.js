/* Bereich Sonne: Datum wählen, Sommer und Winter vergleichen, Tag abspielen, Fakten und Jahresband.
   Die Uhr bleibt bedienbar; Uhrzeit und Sonnenstand sind gekoppelt. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z;
const sonne={};LU.sonne=sonne;
const RICHTUNG=['Norden','Nordosten','Osten','Südosten','Süden','Südwesten','Westen','Nordwesten'];
const richtung=(t,place)=>RICHTUNG[Math.round(((SunCalc.getPosition(new Date(t),place.lat,place.lon).azimuth%360)+360)%360/45)%8];

sonne.datum=function(ymd){
  if(!Z.validDate(ymd))return;
  LU.stoppeAlles();
  const m=LU.teile().minutes;LU.s.instant=Z.wallToInstant(ymd,m,LU.zone());LU.neu();
};
function verschiebeMonat(d){
  const p=LU.teile(),dt=new Date(Date.UTC(p.year,p.month-1+d,1)),max=new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).getUTCDate();
  dt.setUTCDate(Math.min(p.day,max));sonne.datum(dt.toISOString().slice(0,10));
}
sonne.binden=function(){
  for(const b of LU.qa('[data-tage]'))LU.tippen(b,()=>{LU.s.sonne.vergleich=false;sonne.datum(Z.shiftDate(LU.ymd(),Number(b.dataset.tage)));});
  for(const b of LU.qa('[data-monat]'))LU.tippen(b,()=>{LU.s.sonne.vergleich=false;verschiebeMonat(Number(b.dataset.monat));});
  for(const b of LU.qa('[data-schnell]'))LU.tippen(b,()=>{
    const w=b.dataset.schnell,y=LU.teile().year;
    if(w==='beide'){LU.s.sonne.vergleich=!LU.s.sonne.vergleich;LU.neu();return;}
    LU.s.sonne.vergleich=false;
    sonne.datum(w==='heute'?Z.parts(Date.now(),LU.zone()).ymd:w==='sommer'?y+'-06-21':y+'-12-21');
  });
  LU.tippen($('tagspiel'),()=>{
    const a=LU.s.anim;
    if(a&&a.art==='tag'){a.pause=!a.pause;LU.neu();return;}
    LU.stoppeAlles();
    const p=LU.teile(),ziel=Z.wallToInstant(Z.shiftDate(p.ymd,1),p.minutes,LU.zone());
    LU.animiere({art:'tag',ziel,rate:48,fertig:()=>LU.neu()});LU.neu();
  });
  const jahr=$('jahr');let zieht=null;
  jahr.addEventListener('pointerdown',e=>{if(!e.isPrimary||zieht!=null)return;zieht=e.pointerId;try{jahr.setPointerCapture(e.pointerId);}catch(_){}LU.s.sonne.vergleich=false;sonne.datum(LU.himmel.jahrTag(e));});
  jahr.addEventListener('pointermove',e=>{if(e.pointerId!==zieht)return;const d=LU.himmel.jahrTag(e);if(d!==LU.ymd())sonne.datum(d);});
  const los=e=>{if(e.pointerId===zieht)zieht=null;};
  jahr.addEventListener('pointerup',los);jahr.addEventListener('pointercancel',los);
  jahr.addEventListener('keydown',e=>{const r={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];if(!r)return;e.preventDefault();sonne.datum(Z.shiftDate(LU.ymd(),r));});
};

function karte(titel,ymd){
  const place=LU.s.place,s=Z.solar(ymd,place),m=LU.wandMinuten(),t=Z.wallToInstant(ymd,m,place.zone),alt=LU.himmel.sonnenhoehe(t);
  const k=document.createElement('div');k.className='karte';
  const mini=document.createElement('div');mini.className='mini';mini.style.background=LU.himmel.verlauf(alt);
  if(alt>0){const i=document.createElement('i');i.style.top=(70-Math.min(alt,50)/50*45)+'%';mini.appendChild(i);}
  const txt=document.createElement('div');
  const a=document.createElement('p');a.className='k';a.textContent=titel;
  const b=document.createElement('p');b.textContent=s.sunrise&&s.sunset?Z.clock(s.sunrise,place.zone)+' bis '+Z.clock(s.sunset,place.zone):'—';
  const c=document.createElement('p');c.className='l';c.textContent=Z.duration(s.length)+' hell';
  txt.append(a,b,c);k.append(mini,txt);return k;
}

let vKey='';
sonne.zeichne=function(){
  const s=LU.s,place=s.place,p=LU.teile(),ymd=p.ymd,v=s.sonne.vergleich;
  $('ort-name').textContent=place.name;
  $('datum').textContent=v?'Sommer und Winter':Z.dateLabel(ymd);
  const heute=Z.parts(Date.now(),place.zone).ymd;
  for(const b of LU.qa('[data-schnell]')){const w=b.dataset.schnell;
    b.setAttribute('aria-pressed',String(w==='beide'?v:!v&&(w==='heute'?ymd===heute:w==='sommer'?ymd.slice(5)==='06-21':ymd.slice(5)==='12-21')));}
  const a=s.anim&&s.anim.art==='tag';
  $('tagspiel').setAttribute('aria-pressed',String(a&&!s.anim.pause));
  $('tagspiel').querySelector('.cap').textContent=a?(s.anim.pause?'Weiter':'Anhalten'):'Tag abspielen';
  $('tagspiel').querySelector('use').setAttribute('href',a&&!s.anim.pause?'#i-pause':'#i-vor');
  // Fakten
  $('b-fakten').hidden=v;
  if(!v){
    const so=Z.solar(ymd,place);
    const setz=(id,zeit,rest)=>{const d=$(id);d.replaceChildren(zeit);if(rest){const sm=document.createElement('small');sm.textContent=' '+rest;d.appendChild(sm);}};
    if(so.alwaysUp){setz('f-auf','—','geht nicht unter');setz('f-unter','—');}
    else if(so.alwaysDown){setz('f-auf','—','geht nicht auf');setz('f-unter','—');}
    else{setz('f-auf',Z.clock(so.sunrise,place.zone),LU.G&&LU.G.hoch?'':'im '+richtung(+so.sunrise,place));
      setz('f-unter',Z.clock(so.sunset,place.zone),LU.G&&LU.G.hoch?'':'im '+richtung(+so.sunset,place));}
    $('f-laenge').textContent=Z.duration(so.length);
    const alt=LU.himmel.sonnenhoehe(s.instant),mitte=so.solarNoon?Z.parts(+so.solarNoon,place.zone).minutes:720;
    $('f-hoehe').textContent=alt>=1?Math.round(alt)+'° hoch':alt>-.833?(p.minutes<mitte?'geht gerade auf':'geht gerade unter'):alt>-6?'Dämmerung':'untergegangen';
  }
  // Mond
  $('b-mond').hidden=!LU.einst.mond||v;
  if(LU.einst.mond&&!v){
    const mp=SunCalc.getMoonPosition(new Date(s.instant),place.lat,place.lon),ill=SunCalc.getMoonIllumination(new Date(s.instant)),lt=Z.lunar(ymd,place);
    $('mond-text').textContent=Z.phaseName(ill.phase)+', '+(mp.altitude>0?'über':'unter')+' dem Horizont'+
      (LU.G&&LU.G.hoch?'':'\nAufgang '+(lt.rise?Z.clock(lt.rise,place.zone):'keiner')+' · Untergang '+(lt.set?Z.clock(lt.set,place.zone):'keiner'));
  }
  // Vergleich
  const vb=$('b-vergleich');vb.hidden=!v;
  if(v){const key=[p.year,Math.floor(LU.wandMinuten()/5),place.lat,place.lon].join('|');
    if(key!==vKey){vKey=key;vb.replaceChildren(karte('Sommer · 21. Juni',p.year+'-06-21'),karte('Winter · 21. Dezember',p.year+'-12-21'));
      if(!LU.G.hoch){const d=Z.solar(p.year+'-06-21',place).length-Z.solar(p.year+'-12-21',place).length;
        const u=document.createElement('p');u.className='hinweis';u.textContent='Im Sommer ist es '+Z.duration(d)+' länger hell.';vb.appendChild(u);}}
  }else vKey='';
  LU.himmel.jahr();
};
})();
