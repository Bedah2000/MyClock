/* Layout: berechnet aus der tatsächlichen Fläche einmal die feste Position der Uhr und
   ordnet alles andere in Spalten (quer) oder im Dock (hoch) an. Bereich und Schritt
   ändern nie die Geometrie. */
(function(){
'use strict';
const LU=window.LU,$=LU.$;

const TYP={
  tafel:{ans:40,txt:24,kopf:28,dig:54,worte:34,klein:20,hAns:72,hBtn:60,gap:10,r:14},
  tablet:{ans:22,txt:18,kopf:20,dig:34,worte:20,klein:15,hAns:52,hBtn:44,gap:8,r:12}
};
LU.TYP=TYP;

/* Blöcke je Bereich: quer in Spalten (oben / unten), hoch in Zeilen des Docks. */
const SLOTS={
  zeigen:{
    quer:{links:{oben:['b-worte'],unten:['b-anzeige','b-sprechweise','b-seit','b-aktionen','b-transport']},
          rechts:{oben:['b-stufe'],unten:['b-hilfen']}},
    hoch:[['b-worte','b-sprechweise'],['b-transport','b-aktionen','b-seit'],['b-stufe','b-anzeige'],['b-hilfen']]
  },
  quiz:{
    quer:{links:{oben:['b-fortschritt','b-kontext','b-paar'],unten:['b-kacheln-vor','b-nochmal']},
          rechts:{oben:['b-frage'],unten:['b-antworten','b-eingabe','b-ziffern','b-kacheln-nach','b-stunden','b-satzknoepfe','b-vorlesen2','b-weiter','b-pause']}},
    hoch:[['b-fortschritt','b-frage','b-nochmal'],['b-kontext','b-paar','b-satz'],
          ['b-antworten','b-eingabe','b-ziffern','b-kacheln-nach','b-kacheln-vor','b-stunden'],
          ['b-satzknoepfe','b-vorlesen2','b-weiter','b-pause']]
  },
  sonne:{
    quer:{links:{oben:['b-ort'],unten:['b-tage','b-schnell','b-tagspiel']},
          rechts:{oben:['b-fakten','b-mond','b-vergleich'],unten:['b-jahr']}},
    hoch:[['b-ort','b-tage'],['b-schnell','b-tagspiel'],['b-fakten','b-vergleich'],['b-mond'],['b-jahr']]
  }
};
LU.SLOTS=SLOTS;

function geometrie(W,H,profil){
  const t=TYP[profil],hoch=W/H<1.15;
  let s;
  if(profil==='tafel')s=hoch?Math.min(W/800,H/1600):Math.min(W/1600,H/800);
  else s=hoch?Math.min(W/760,H/952):Math.min(W/1000,H/652);
  s=Math.max(1,Math.min(s,1.45));
  const g=Math.round(t.gap*s+4);
  const T=Math.round((t.hBtn+10)*s);
  const G={hoch,s,g,T,W,H};
  if(!hoch){
    const B=Math.round(H*(profil==='tafel'?.10:.085)),mTop=Math.round(H*.02);
    const seiteMin=Math.round(W*(profil==='tafel'?.25:.235));
    const D=Math.floor(Math.min(H-T-2*g-B-mTop-6,W-2*seiteMin-4*g));
    const m=Math.max(0,Math.min(.035*D,(W-D-2*seiteMin-4*g)/2));
    const fw=D+2*m,fx=(W-fw)/2,fy=T+g,fh=H-T-2*g;
    G.uhr={x:(W-D)/2,y:fy+mTop,w:D,h:D};
    G.fenster={x:fx,y:fy,w:fw,h:fh};
    G.band={x:fx,y:G.uhr.y+D+6,w:fw,h:fy+fh-(G.uhr.y+D+6)};
    const cw=fx-2*g;
    G.links={x:g,y:fy,w:cw,h:fh};G.rechts={x:fx+fw+g,y:fy,w:cw,h:fh};
  }else{
    const K=Math.round(H*(profil==='tafel'?.27:.27)),B=Math.round(44*s),mTop=10;
    const D=Math.floor(Math.min(W-2*g-20,H-T-g-mTop-6-B-g-K-g));
    const fx=g,fw=W-2*g,fy=T+g;
    G.uhr={x:(W-D)/2,y:fy+mTop,w:D,h:D};
    G.band={x:fx,y:G.uhr.y+D+6,w:fw,h:B};
    G.fenster={x:fx,y:fy,w:fw,h:G.band.y+B-fy};
    G.dock={x:g,y:fy+G.fenster.h+g,w:W-2*g,h:H-(fy+G.fenster.h+g)-g};
  }
  return G;
}
LU.geometrie=geometrie;

function setze(el,r){if(!el||!r)return;el.style.left=r.x+'px';el.style.top=r.y+'px';el.style.width=r.w+'px';el.style.height=r.h+'px';}

LU.profil=function(W,H){
  const l=LU.einst.layout;
  if(l==='tafel'||l==='tablet')return l;
  // Tafel nur bei großer Fläche und Touch als Hauptbedienung; Rechner mit Maus bekommen das kompakte Layout
  const maus=window.matchMedia&&matchMedia('(pointer: fine)').matches&&!matchMedia('(any-pointer: coarse)').matches;
  return (!maus&&Math.max(W,H)>=1400&&Math.min(W,H)>=700)?'tafel':'tablet';
};

let letzte='';
LU.layout=function(erzwingen){
  const W=document.documentElement.clientWidth||window.innerWidth,H=document.documentElement.clientHeight||window.innerHeight;
  const profil=LU.profil(W,H),schluessel=[W,H,profil,LU.s.bereich,LU.einst.schema].join('|');
  if(!erzwingen&&schluessel===letzte)return;
  const G=geometrie(W,H,profil),t=TYP[profil],s=G.s;letzte=schluessel;LU.G=G;
  const app=$('app');app.dataset.profil=profil;app.dataset.lage=G.hoch?'hoch':'quer';
  const root=document.documentElement.style;
  const px=v=>Math.round(v*s)+'px';
  root.setProperty('--fs-ans',px(t.ans));root.setProperty('--fs-txt',px(t.txt));root.setProperty('--fs-kopf',px(t.kopf));
  root.setProperty('--fs-dig',px(t.dig));root.setProperty('--fs-worte',px(t.worte));root.setProperty('--fs-klein',px(t.klein));root.setProperty('--h-ans',px(t.hAns));
  root.setProperty('--h-btn',px(t.hBtn));root.setProperty('--gap',px(t.gap));root.setProperty('--r',px(t.r));
  root.setProperty('--uhr-d',G.uhr.w+'px');
  const kopf=$('kopf');setze(kopf,{x:G.g,y:0,w:W-2*G.g,h:G.T});
  setze($('fenster'),G.fenster);$('fenster').style.borderRadius=Math.round(t.r*1.5*s)+'px';
  setze($('uhr'),G.uhr);setze($('lob'),G.uhr);setze($('band'),G.band);
  if(!G.hoch){
    setze($('links'),G.links);setze($('rechts'),G.rechts);
    setze($('blatt-links'),G.links);setze($('blatt-rechts'),G.rechts);
    for(const id of ['links','rechts','blatt-links','blatt-rechts'])$(id).classList.toggle('schmal',G.links.w<300*s);
    setze($('entsperren'),{x:G.rechts.x,y:G.rechts.y,w:G.rechts.w,h:Math.round(t.hBtn*s*2.4)});
  }else{
    setze($('dock'),G.dock);setze($('blatt-dock'),G.dock);
    setze($('entsperren'),{x:G.dock.x,y:G.dock.y,w:G.dock.w,h:Math.round(t.hBtn*s*2.4)});
  }
  LU.platziere();
  LU.blatt&&LU.blatt.platziere();
  LU.himmel&&LU.himmel.groesse();
  LU.zeichne();
};

/* Blöcke an ihren Platz hängen. DOM-Knoten werden verschoben, nicht kopiert: Zustand bleibt erhalten. */
LU.platziere=function(){
  const ablage=$('ablage'),hoch=LU.G&&LU.G.hoch,slot=SLOTS[LU.s.bereich];
  for(const el of LU.qa('.spalte>.oben,.spalte>.unten'))while(el.firstChild)ablage.appendChild(el.firstChild);
  const dock=$('dock');
  for(const z of LU.qa('.zeile',dock))while(z.firstChild){const c=z.firstChild;if(c.classList&&c.classList.contains('block'))ablage.appendChild(c);else z.removeChild(c);}
  dock.replaceChildren();
  if(!hoch){
    for(const seite of ['links','rechts'])for(const teil of ['oben','unten'])
      for(const id of slot.quer[seite][teil])$(seite).querySelector('.'+teil).appendChild($(id));
  }else{
    for(const reihe of slot.hoch){const z=document.createElement('div');z.className='zeile';for(const id of reihe)z.appendChild($(id));dock.appendChild(z);}
  }
};
/* Leere Dock-Zeilen ausblenden (ohne :has, für ältere Browser). */
LU.zeilenAufraeumen=function(){
  for(const z of LU.qa('#dock .zeile'))z.hidden=!Array.from(z.children).some(c=>!c.hidden);
};
})();
