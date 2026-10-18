/* Layout: berechnet aus der tatsächlichen Fläche die feste Position der Uhr und
   ordnet alles andere in Spalten (quer) oder im Dock (hoch) an. In Lernuhr und Quiz steht die Uhr immer an derselben
   Stelle; nur Sonne hat eine eigene Aufteilung (großer Himmel, kleinere Uhr). Spalten und Dock scrollen senkrecht,
   falls bei sehr kleiner Fläche oder starkem Zoom nicht alles hineinpasst. */
(function(){
'use strict';
const LU=window.LU,$=LU.$;

const TYP={
  tafel:{ans:40,txt:24,kopf:28,dig:54,worte:34,klein:20,cap:16,hAns:72,hBtn:60,gap:10,r:14},
  tablet:{ans:22,txt:18,kopf:20,dig:34,worte:20,klein:15,cap:12.5,hAns:52,hBtn:44,gap:8,r:12}
};
LU.TYP=TYP;

/* Blöcke je Bereich, in beiden Lagen in derselben Reihenfolge:
   Bereichswahl oben links in der Kopfzeile, die Uhr mit Digital- und Wortanzeige, die Aktionen, zuletzt Lernstufe und Hilfen.
   quer: Kopfzeile (links / Mitte) und Spalten (oben / unten); hoch: Kopfzeile und Zeilen des Docks (mit Zeilentitel).
   Sonne hoch: Spalte „links“ steht neben der kleinen Uhr; Ort und Datum stehen in beiden Lagen oben links im Himmel. */
const SLOTS={
  zeigen:{
    kopf:{links:['b-bereiche'],mitte:[]},
    quer:{links:{oben:['digital','b-worte','b-sprechweise','b-legende','b-seit'],unten:['b-aktionen','b-transport','b-stufe']},
          rechts:{oben:[],unten:['b-hilfen']}},
    hoch:[{titel:'Uhrzeit',ids:['digital','b-worte']},{titel:'Sprechweise',ids:['b-sprechweise']},{titel:'',ids:['b-legende','b-seit']},
          {titel:'Bedienen',ids:['b-aktionen','b-transport']},{titel:'Lernstufe',ids:['b-stufe']},{titel:'Hilfen',ids:['b-hilfen']}]
  },
  quiz:{
    kopf:{links:['b-bereiche'],mitte:['digital']},
    quer:{links:{oben:['b-fortschritt','b-kontext','b-paar','b-legende'],unten:['b-kacheln-vor','b-nochmal']},
          rechts:{oben:[],unten:['b-frage','b-antworten','b-eingabe','b-ziffern','b-kacheln-nach','b-stunden','b-satzknoepfe','b-vorlesen2','b-weiter','b-pause']}},
    hoch:[{ids:['b-fortschritt','b-frage','b-nochmal']},{ids:['b-kontext','b-paar','b-satz']},
          {ids:['b-antworten','b-eingabe','b-ziffern','b-kacheln-nach','b-kacheln-vor','b-stunden']},
          {ids:['b-satzknoepfe','b-vorlesen2','b-weiter','b-pause']},{ids:['b-legende']}]
  },
  sonne:{
    kopf:{links:['b-bereiche'],mitte:['digital']},
    quer:{links:{oben:['b-tage','b-schnell','b-vgl'],unten:[]},
          rechts:{oben:['b-fakten','b-mond','b-vergleich'],unten:['b-tagspiel','b-jahr']}},
    neben:{oben:['b-tage','b-schnell','b-vgl'],unten:[]},
    titel:['b-ort'],
    hoch:[{ids:['b-fakten']},{ids:['b-mond']},{ids:['b-vergleich']},{ids:['b-tagspiel','b-jahr']}]
  }
};
LU.SLOTS=SLOTS;

/* Geometrie: in Lernuhr und Quiz steht die Uhr groß in der Mitte und an derselben Stelle.
   In Sonne bekommt der Himmel mit der Sonnenbahn die Hauptfläche; die Uhr steht kleiner links (quer) bzw. unter dem Himmel (hoch). */
function geometrie(W,H,profil,bereich){
  const t=TYP[profil],hoch=W/H<1.15,sonne=bereich==='sonne';
  let s;
  if(profil==='tafel')s=hoch?Math.min(W/800,H/1600):Math.min(W/1600,H/800);
  else s=hoch?Math.min(W/760,H/952):Math.min(W/1000,H/652);
  s=Math.max(1,Math.min(s,1.45));
  const g=Math.round(t.gap*s+4);
  const T=Math.round((t.hBtn+10)*s)+(W<680?Math.round(t.hBtn*s+2*g):0);
  const G={hoch,s,g,T,W,H,sonne};
  if(!hoch){
    const B=Math.round(H*(profil==='tafel'?.10:.085)),mTop=Math.round(H*.02);
    const seiteMin=Math.round(W*(profil==='tafel'?.25:.235));
    const D=Math.floor(Math.min(H-T-2*g-B-mTop-6,W-2*seiteMin-4*g));
    const m=Math.max(0,Math.min(.035*D,(W-D-2*seiteMin-4*g)/2));
    const fw=D+2*m,fx=(W-fw)/2,fy=T+g,fh=H-T-2*g;
    const cw=fx-2*g;
    G.fenster={x:fx,y:fy,w:fw,h:fh};
    G.links={x:g,y:fy,w:cw,h:fh};G.rechts={x:fx+fw+g,y:fy,w:cw,h:fh};
    G.blattL=G.links;G.blattR=G.rechts;
    if(!sonne){
      G.uhr={x:(W-D)/2,y:fy+mTop,w:D,h:D};
      G.band={x:fx,y:G.uhr.y+D+6,w:fw,h:fy+fh-(G.uhr.y+D+6)};
    }else{
      // Uhr oben in der linken Spalte, darunter Platz für vier Knopfreihen (eine davon zweizeilig)
      const Ds=Math.floor(Math.min(cw,Math.max(fh*.5,fh-4.6*t.hBtn*s-4*g-6))); // bei sehr wenig Höhe (Zoom) scrollt die Spalte darunter
      G.uhr={x:g+(cw-Ds)/2,y:fy,w:Ds,h:Ds};
      G.links={x:g,y:fy+Ds+g,w:cw,h:fh-Ds-g};
      G.band=G.fenster;
    }
    G.entsperren={x:G.rechts.x,y:G.rechts.y,w:G.rechts.w,h:Math.round(t.hBtn*s*2.4)};
  }else{
    const fx=g,fw=W-2*g,fy=T+g;
    if(!sonne){
      const K=Math.round(H*.30),B=Math.round(44*s),mTop=10;
      const D=Math.floor(Math.min(W-2*g-20,H-T-g-mTop-6-B-g-K-g));
      G.uhr={x:(W-D)/2,y:fy+mTop,w:D,h:D};
      G.band={x:fx,y:G.uhr.y+D+6,w:fw,h:B};
      G.fenster={x:fx,y:fy,w:fw,h:G.band.y+B-fy};
      G.dock={x:g,y:fy+G.fenster.h+g,w:W-2*g,h:H-(fy+G.fenster.h+g)-g};
      // Einstellungsblatt hoch: vom Horizontband bis unten, nie über der Uhr
      G.blattD={x:G.dock.x,y:G.band.y,w:G.dock.w,h:G.dock.y+G.dock.h-G.band.y};
    }else{
      // Himmel oben über die ganze Breite, darunter die kleine Uhr mit den Datumsknöpfen daneben, unten das Dock
      const hh=Math.round(H*.40),Dc=Math.round(Math.min(fw*.5,H*.30));
      G.fenster={x:fx,y:fy,w:fw,h:hh};G.band=G.fenster;
      G.uhr={x:g,y:fy+hh+g,w:Dc,h:Dc};
      G.links={x:g+Dc+g,y:G.uhr.y,w:fw-Dc-g,h:Dc};
      G.dock={x:g,y:G.uhr.y+Dc+g,w:fw,h:H-(G.uhr.y+Dc+g)-g};
      // Einstellungsblatt in Sonne: unter dem Himmel, der Himmel bleibt sichtbar
      G.blattD={x:g,y:G.uhr.y,w:fw,h:H-G.uhr.y-g};
    }
    G.entsperren={x:G.dock.x,y:G.dock.y,w:G.dock.w,h:Math.round(t.hBtn*s*2.4)};
  }
  // Sonne: Ort, Datum und Hinweis „Schema“ oben links im Himmel
  if(sonne){const p=Math.round(10*s);G.titel={x:G.fenster.x+p,y:G.fenster.y+Math.round(p*.6),w:G.fenster.w-2*p,h:Math.round((t.txt*1.25+t.kopf*1.44+t.klein*1.35)*s)};}
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
  const W=document.documentElement.clientWidth||window.innerWidth,viewportH=document.documentElement.clientHeight||window.innerHeight;
  // Mindesthöhe der Arbeitsfläche: bei wenig Platz scrollt die gesamte Ansicht.
  // Keine negativen Uhr-, Dock- oder Einstellungsflächen bei starkem Browserzoom.
  const H=Math.max(viewportH,W<680?1000:600);
  const profil=LU.profil(W,H),schluessel=[W,H,profil,LU.s.bereich,LU.einst.schema].join('|');
  if(!erzwingen&&schluessel===letzte)return;
  const G=geometrie(W,H,profil,LU.s.bereich),t=TYP[profil],s=G.s;letzte=schluessel;LU.G=G;
  const app=$('app');app.style.minHeight=H+'px';app.dataset.profil=profil;app.dataset.lage=G.hoch?'hoch':'quer';
  app.classList.toggle('eng',W<680*s); // sehr schmal: Bereichsknöpfe dürfen zweizeilig werden
  const root=document.documentElement.style;
  const px=v=>Math.round(v*s)+'px';
  root.setProperty('--fs-ans',px(t.ans));root.setProperty('--fs-txt',px(t.txt));root.setProperty('--fs-kopf',px(t.kopf));
  root.setProperty('--fs-dig',px(t.dig));root.setProperty('--fs-worte',px(t.worte));root.setProperty('--fs-klein',px(t.klein));root.setProperty('--fs-cap',px(t.cap));root.setProperty('--h-ans',px(t.hAns));
  root.setProperty('--h-btn',px(t.hBtn));root.setProperty('--gap',px(t.gap));root.setProperty('--r',px(t.r));
  root.setProperty('--uhr-d',G.uhr.w+'px');
  const kopf=$('kopf');setze(kopf,{x:G.g,y:0,w:W-2*G.g,h:W<680?G.T-(t.hBtn*s+2*G.g):G.T});
  setze($('fenster'),G.fenster);$('fenster').style.borderRadius=Math.round(t.r*1.5*s)+'px';
  setze($('uhr'),G.uhr);setze($('lob'),G.uhr);setze($('band'),G.band);
  for(const id of ['links','rechts','dock']){$(id).hidden=!G[id];setze($(id),G[id]);}
  $('himmel-titel').hidden=!G.titel;setze($('himmel-titel'),G.titel);
  for(const id of ['links','rechts'])if(G[id]){$(id).classList.toggle('schmal',G[id].w<300*s);$(id).classList.toggle('eng',G[id].w<26*t.klein*s);}
  if(!G.hoch){
    setze($('blatt-links'),G.blattL);setze($('blatt-rechts'),G.blattR);
    for(const id of ['blatt-links','blatt-rechts'])$(id).classList.toggle('schmal',G.blattL.w<300*s);
  }else{setze($('blatt-dock'),G.blattD);$('blatt-dock').classList.toggle('schmal',G.blattD.w<620*s);}
  setze($('entsperren'),G.entsperren);
  LU.platziere();
  LU.blatt&&LU.blatt.platziere();
  LU.himmel&&LU.himmel.groesse();
  LU.zeichne();
};

/* Blöcke an ihren Platz hängen. DOM-Knoten werden verschoben, nicht kopiert: Zustand bleibt erhalten. */
LU.platziere=function(){
  const ablage=$('ablage'),G=LU.G,hoch=G&&G.hoch,slot=SLOTS[LU.s.bereich];
  for(const el of LU.qa('.spalte>.oben,.spalte>.unten,#kopf>.kopf-links,#kopf>.kopf-mitte,#himmel-titel'))while(el.firstChild)ablage.appendChild(el.firstChild);
  for(const id of slot.titel||[])$('himmel-titel').appendChild($(id));
  for(const teil of ['links','mitte'])for(const id of slot.kopf[teil])$('kopf').querySelector('.kopf-'+teil).appendChild($(id));
  const dock=$('dock');
  for(const z of LU.qa('.zeile',dock))while(z.firstChild){const c=z.firstChild;if(c.classList&&(c.classList.contains('block')||c.id==='digital'))ablage.appendChild(c);else z.removeChild(c);}
  dock.replaceChildren();
  const spalte=(seite,teile)=>{for(const teil of ['oben','unten'])for(const id of teile[teil])$(seite).querySelector('.'+teil).appendChild($(id));};
  if(!hoch){spalte('links',slot.quer.links);spalte('rechts',slot.quer.rechts);}
  else{
    if(slot.neben)spalte('links',slot.neben);
    for(const reihe of slot.hoch){
      const z=document.createElement('div');z.className='zeile';
      if(reihe.titel!=null){z.classList.add('mit-titel');const t=document.createElement('span');t.className='zeilen-titel';t.textContent=reihe.titel;z.appendChild(t);}
      for(const id of reihe.ids)z.appendChild($(id));dock.appendChild(z);
    }
  }
};
/* Leere Dock-Zeilen ausblenden (ohne :has, für ältere Browser). */
LU.zeilenAufraeumen=function(){
  for(const z of LU.qa('#dock .zeile'))z.hidden=!Array.from(z.children).some(c=>!c.hidden&&!c.classList.contains('zeilen-titel')&&!(c.id==='digital'&&c.classList.contains('aus')));
};
})();
