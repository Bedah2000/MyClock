/* Einstellungen für die Lehrkraft. Öffnen über Knopf und Schieberegler, damit Schüler sie nicht
   aus Versehen öffnen. Das Blatt liegt neben der Uhr (quer) oder im Dock (hoch), nie über der Uhr. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z;
const blatt={};LU.blatt=blatt;
let zeigTimer=null;

/* Breite eines Textes in em (Schrift der App), für Mindestbreiten von Knöpfen */
let mess=null;
LU.textEm=function(t){
  if(!mess){mess=document.createElement('canvas').getContext('2d');}
  mess.font='100px Grund,sans-serif';return mess.measureText(t).width/100;
};
/* Einstellungszeile: Bezeichnung in eigener Zeile, darunter die Wahlknöpfe. Die Knöpfe sind mindestens so breit wie
   ihr längstes Wort und brechen bei Platzmangel in die nächste Zeile um; die Schrift bleibt gleich groß.
   optionen: [wert, text, beispiel?] */
function zeile(name,optionen,aktuell,setze,opt={}){
  const z=document.createElement('div');z.className='ezeile'+(opt.voll?' voll':'')+(opt.drittel?' drittel':'');
  const n=document.createElement('div');n.className='name';
  if(opt.bild){const i=document.createElement('img');i.className='symbol';i.src=$('bild-mond').src;i.alt='';n.appendChild(i);}
  n.appendChild(document.createTextNode(name));z.appendChild(n);
  const box=document.createElement('div');box.className='optionen';
  box.setAttribute('role','group');box.setAttribute('aria-label',name);
  let breit=0;
  for(const [,text,bsp] of optionen){
    for(const w of String(text).split(/[\s\u00ad]+/))breit=Math.max(breit,LU.textEm(w));
    if(bsp)for(const w of bsp.split(/\s+/))breit=Math.max(breit,LU.textEm(w)*.84); // Beispiel in kleinerer Schrift
  }
  box.style.setProperty('--min',(breit+.75).toFixed(2)+'em');
  for(const [wert,text,bsp] of optionen){const b=document.createElement('button');b.type='button';b.dataset.wert=String(wert);
    if(bsp){b.classList.add('mit-bsp');const t=document.createElement('span');t.className='name';t.textContent=text;const e=document.createElement('span');e.className='bsp';e.textContent=bsp;b.append(t,e);}
    else b.textContent=text;
    b.setAttribute('aria-pressed',String(wert===aktuell));
    LU.tippen(b,()=>{setze(wert);blatt.zeichne();LU.neu();});box.appendChild(b);}
  z.appendChild(box);return z;
}
LU.SPRECHWEISEN=[['sued','Süddeutsch','„Viertel drei“'],['hoch','Hochdeutsch','„Viertel nach zwei“']];
const quizAendern=(k)=>v=>{if(LU.einst[k]===v)return;if(k==='stufe'){LU.setzeStufe(v);return;}LU.einst[k]=v;LU.quiz.neu();};
const geraet=(k)=>v=>{LU.einst[k]=v;LU.speichern();if(k==='schema')document.documentElement.dataset.schema=v;if(k==='layout')LU.layout(true);};

/* Hilfen auf der Uhr fürs Quiz: quer unter den Reitern, hoch unter den Quiz-Einstellungen */
const QUIZHILFEN=[['stunden','i-stundenzahlen','Stunden\u00adzahlen'],['minuten','i-minutenzahlen','Minuten\u00adzahlen'],['alleMinuten','i-alleminuten','Alle Minuten'],
  ['bereich','i-bereich','Stunden\u00adbereich'],['hervorheben','i-hervorheben','Hervor\u00adheben'],['stundenzeiger','i-stundenzeiger','Stunden\u00adzeiger'],
  ['minutenzeiger','i-minutenzeiger','Minuten\u00adzeiger'],['erklaerung','i-erklaerung','Zeiger erklären']];
function quizHilfen(){
  const box=document.createElement('div');box.id='bl-quizhilfen';box.className='block bl-quizhilfen voll';
  const t=document.createElement('p');t.className='titel klein';t.textContent='Hilfen auf der Uhr';box.appendChild(t);
  const g=document.createElement('div');g.className='bl-hilfen-gitter';g.setAttribute('role','group');g.setAttribute('aria-label','Hilfen im Quiz');
  for(const [k,ik,name] of QUIZHILFEN){
    const b=document.createElement('button');b.type='button';b.className='hilfe';b.dataset.quizhilfe=k;b.setAttribute('aria-pressed',String(LU.quizHilfeAn(k)));
    b.innerHTML=`<svg class="ik"><use href="#${ik}"/></svg><span class="cap">${name}</span>`;
    LU.tippen(b,()=>{LU.schalteQuizHilfe(k);blatt.zeichne();LU.neu();});g.appendChild(b);
  }
  box.appendChild(g);return box;
}

function inhalt(reiter){
  const E=LU.einst,hoch=LU.G.hoch,teile=[];
  if(reiter==='quiz'){
    teile.push(zeile('Lernstufe',Object.entries(LU.STUFEN_KNOPF),E.stufe,quizAendern('stufe'),{voll:true}));
    teile.push(zeile('Antworten',[['leicht','Antwort auswählen'],['schwer','Antwort eingeben']],E.antworten,quizAendern('antworten'),{drittel:true}));
    teile.push(zeile('Aufgabe',[['zahlen','Zahlen'],['worte','Worte']],E.aufgabe,quizAendern('aufgabe'),{drittel:true}));
    teile.push(zeile('Sprechweise',LU.SPRECHWEISEN,E.sprechweise,quizAendern('sprechweise'),{drittel:true}));
  }else if(reiter==='runde'){
    teile.push(zeile('Aufgaben je Runde',[[3,'3'],[5,'5'],[8,'8']],E.runde,quizAendern('runde')));
    teile.push(zeile('Tempo',[['langsam','Langsam'],['mittel','Mittel'],['schnell','Schnell']],E.tempoAblauf,v=>{E.tempoAblauf=v;}));
    teile.push(zeile('Zeitdauer beim Ablauf zeigen',[[false,'aus'],[true,'an']],E.dauerZeigen,v=>{E.dauerZeigen=v;}));
  }else if(reiter==='anzeige'){
    teile.push(zeile('Zeiger sperren',[[false,'aus'],[true,'an']],E.zeigerSperren,v=>{E.zeigerSperren=v;}));
    teile.push(zeile('Sekunden\u00adzeiger bei „Jetzt“',[[false,'aus'],[true,'an']],E.sekundenzeiger,v=>{E.sekundenzeiger=v;}));
    teile.push(zeile('Himmel bei Lernuhr und Quiz',[[true,'an'],[false,'aus']],E.himmel,v=>{E.himmel=v;}));
  }else if(reiter==='sonne'){
    const orte=[['herrieden','Herrieden'],['ansbach','Ansbach'],['berlin','Berlin'],['hamburg','Hamburg'],['munich','München'],['eigen','Eigener Ort']];
    teile.push(zeile('Ort',orte,E.ort,v=>{if(v==='eigen'){blatt.ortBearbeiten();return;}E.ort=v;LU.setzeOrt(Object.assign({},Z.places[v]));},{voll:true}));
    teile.push(zeile('Mond',[[false,'aus'],[true,'an']],E.mond,v=>{E.mond=v;},{bild:true}));
    if(!hoch){const h=document.createElement('p');h.className='hinweis info';h.textContent='Zeiten gelten für freien Horizont. Berge, Häuser und Wetter sind nicht berücksichtigt. Sommer- und Winterzeit gelten für den gewählten Ort.';teile.push(h);}
  }else if(reiter==='geraet'){
    teile.push(zeile('Darstellung',[['auto','Auto'],['tafel','Tafel'],['tablet','Tablet']],E.layout,geraet('layout')));
    teile.push(zeile('Farben',[['hell','Hell'],['kontrast','Kontrast']],E.schema,geraet('schema')));
    teile.push(zeile('Ton',[[true,'an'],[false,'aus']],E.ton,geraet('ton')));
    teile.push(zeile('Lob',[['kurz','kurz'],['fanfare','Fanfare']],E.lob,geraet('lob')));
    teile.push(zeile('Bereichswahl',[[false,'frei'],[true,'gesperrt']],E.bereichSperre,v=>{E.bereichSperre=v;}));
    const z=document.createElement('div');z.className='ezeile';const n=document.createElement('div');n.className='name';n.textContent='Hilfen auf der Uhr (Lernuhr und Quiz)';
    const o=document.createElement('div');o.className='optionen';o.style.setProperty('--min','8em');
    const b=document.createElement('button');b.type='button';b.id='hilfen-zurueck';b.textContent='Zurücksetzen';
    LU.tippen(b,()=>{LU.hilfenZuruecksetzen();b.textContent='zurückgesetzt';LU.neu();});
    o.appendChild(b);z.append(n,o);teile.push(z);
  }
  return teile;
}

/* Eigener Ort mit eigenem Ziffernfeld */
blatt.ortBearbeiten=function(){
  const o=LU.einst.eigenerOrt;
  LU.s.blatt.ort={lat:String(o.lat).replace('.',','),lon:String(o.lon).replace('.',','),zone:o.zone,feld:0,meldung:''};blatt.zeichne();
};
function ortTaste(k){
  const o=LU.s.blatt.ort,f=o.feld?'lon':'lat';
  if(k==='Löschen')o[f]=o[f].slice(0,-1);
  else if(k==='−'){o[f]=o[f].startsWith('-')?o[f].slice(1):'-'+o[f];}
  else if(k===','){if(!o[f].includes(','))o[f]+=',';}
  else if(k==='Übernehmen'){
    const lat=Number(o.lat.replace(',','.')),lon=Number(o.lon.replace(',','.'));
    if(!Number.isFinite(lat)||lat<-89||lat>89){o.meldung='Breitengrad: −89 bis 89';o.feld=0;}
    else if(!Number.isFinite(lon)||lon<-180||lon>180){o.meldung='Längengrad: −180 bis 180';o.feld=1;}
    else{LU.einst.eigenerOrt={lat,lon,zone:o.zone};LU.einst.ort='eigen';LU.setzeOrt({name:'Eigener Ort',lat,lon,zone:o.zone});LU.s.blatt.ort=null;}
  }
  else if(o[f].replace(/[-,]/g,'').length<7)o[f]+=k;
  blatt.zeichne();LU.neu();
}
function ortInhalt(){
  const o=LU.s.blatt.ort,teile=[];
  const kopf=document.createElement('p');kopf.className='hinweis voll'+(o.meldung?'':' leer');kopf.textContent=o.meldung||'Koordinaten eintippen, Zeitzone wählen.';teile.push(kopf);
  const k=document.createElement('div');k.className='koord voll';
  [['Breitengrad','lat'],['Längengrad','lon']].forEach(([n,f],i)=>{const b=document.createElement('button');b.type='button';b.className='feld'+(o.feld===i?' aktiv':'');
    const s=document.createElement('small');s.textContent=n;const v=document.createElement('span');v.textContent=(o[f]||'').replace('-','−');b.append(s,v);
    LU.tippen(b,()=>{o.feld=i;blatt.zeichne();});k.appendChild(b);});
  teile.push(k);
  const zf=document.createElement('div');zf.className='block b-ziffern voll';LU.baueZiffern(zf,'koord',ortTaste);teile.push(zf);
  return teile;
}
function zonen(){
  const o=LU.s.blatt.ort,box=$('bl-zonen');box.replaceChildren();
  const zur=document.createElement('button');zur.type='button';zur.textContent='Zurück';LU.tippen(zur,()=>{LU.s.blatt.ort=null;blatt.zeichne();});box.appendChild(zur);
  for(const [z,n] of LU.ZONEN){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',String(o.zone===z));LU.tippen(b,()=>{o.zone=z;blatt.zeichne();});box.appendChild(b);}
}

blatt.oeffnen=function(){
  clearTimeout(zeigTimer);$('entsperren').hidden=true;
  LU.s.blatt={reiter:LU.s.bereich==='quiz'?'quiz':LU.s.bereich==='sonne'?'sonne':'anzeige',ort:null};
  blatt.platziere();blatt.zeichne();LU.neu();
};
blatt.schliessen=function(){LU.s.blatt=null;for(const id of ['blatt-links','blatt-rechts','blatt-dock'])$(id).hidden=true;blatt.platziere();LU.neu();};
blatt.platziere=function(){
  const ablage=$('ablage'),offen=!!LU.s.blatt,hoch=LU.G&&LU.G.hoch;
  for(const id of ['bl-reiter','bl-zonen','bl-inhalt'])ablage.appendChild($(id));
  $('blatt-links').hidden=!offen||hoch;$('blatt-rechts').hidden=!offen||hoch;$('blatt-dock').hidden=!offen||!hoch;
  if(!offen)return;
  const ort=!!LU.s.blatt.ort;
  if(!hoch){$('blatt-links').appendChild($(ort?'bl-zonen':'bl-reiter'));$('blatt-rechts').appendChild($('bl-inhalt'));}
  else{$('blatt-dock').appendChild($(ort?'bl-zonen':'bl-reiter'));$('blatt-dock').appendChild($('bl-inhalt'));}
};
blatt.zeichne=function(){
  if(!LU.s.blatt)return;
  blatt.platziere();
  for(const b of LU.qa('#bl-reiter [data-reiter]'))b.setAttribute('aria-selected',String(b.dataset.reiter===LU.s.blatt.reiter));
  const box=$('bl-inhalt');box.replaceChildren();
  const alt=$('bl-quizhilfen');if(alt)alt.remove();
  if(LU.s.blatt.ort){zonen();for(const t of ortInhalt())box.appendChild(t);}
  else for(const t of inhalt(LU.s.blatt.reiter))box.appendChild(t);
  if(!LU.s.blatt.ort&&LU.s.blatt.reiter==='quiz'){
    const qh=quizHilfen();
    if(LU.G.hoch)box.appendChild(qh);else $('bl-reiter').insertBefore(qh,$('blatt-fertig'));
  }
};

blatt.binden=function(){
  LU.tippen($('einstellungen'),()=>{
    if(LU.s.blatt){blatt.schliessen();return;}
    const e=$('entsperren');e.hidden=!e.hidden;clearTimeout(zeigTimer);
    if(!e.hidden){zeigTimer=setTimeout(()=>{e.hidden=true;knopfZurueck();},6000);}
  });
  for(const b of LU.qa('#bl-reiter [data-reiter]'))LU.tippen(b,()=>{LU.s.blatt.reiter=b.dataset.reiter;LU.s.blatt.ort=null;blatt.zeichne();});
  LU.tippen($('blatt-fertig'),blatt.schliessen);
  // Schieberegler
  const knopf=$('schiebeknopf'),schiene=$('schiene');let zug=null;
  const max=()=>schiene.clientWidth-knopf.offsetWidth-8;
  function knopfZurueck(){knopf.style.transform='';}
  knopf.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;e.preventDefault();zug={id:e.pointerId,x0:e.clientX};try{knopf.setPointerCapture(e.pointerId);}catch(_){}clearTimeout(zeigTimer);});
  knopf.addEventListener('pointermove',e=>{if(!zug||e.pointerId!==zug.id)return;const dx=Math.max(0,Math.min(max(),e.clientX-zug.x0));knopf.style.transform=`translateX(${dx}px)`;zug.dx=dx;});
  const los=e=>{if(!zug||e.pointerId!==zug.id)return;const ok=(zug.dx||0)>=max()*.85;zug=null;knopfZurueck();
    if(ok)blatt.oeffnen();else zeigTimer=setTimeout(()=>{$('entsperren').hidden=true;},6000);};
  knopf.addEventListener('pointerup',los);knopf.addEventListener('pointercancel',los);
  knopf.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();blatt.oeffnen();}});
};
})();
