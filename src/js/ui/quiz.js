/* Bereich Quiz: Runde mit Aufgaben. Ablauf wie in der Vorlage: Zeit läuft zur Zielzeit,
   dann Uhrzeit erraten, dann Zeitdauer. Kein Punktestand, nichts wird gespeichert. */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z,W=LU.W,A=LU.A;
const quiz={};LU.quiz=quiz;
const ABLAUF={langsam:6,mittel:24,schnell:60};
const GESPERRT=['lauf','frage','gut1','dauer','gut2'];

function q(){return LU.s.quiz;}
quiz.neu=function(){
  LU.s.quiz={phase:'start',nr:0,fertig:0,start:null,ziel:null,antwort:null,optionen:[],falsch:new Set(),fehler:0,
    eingabe:['',''],feld:0,schritt:1,kachel:null,stunde:null,zahl:'',pause:false,erneut:false,meldung:'',meldungGut:false,schluessel:''};
  LU.s.autoHilfe=null;
};
quiz.gesperrt=()=>!!q()&&GESPERRT.includes(q().phase);
const schwer=()=>LU.einst.antworten==='schwer';
const worte=()=>LU.einst.aufgabe==='worte';
const bausteine=()=>q().phase==='frage'&&schwer()&&worte();

function versuchZurueck(){const x=q();x.falsch=new Set();x.fehler=0;x.eingabe=['',''];x.feld=0;x.schritt=1;x.kachel=null;x.stunde=null;x.zahl='';x.meldung='';x.meldungGut=false;LU.s.autoHilfe=null;}

quiz.los=function(){
  const x=q();LU.stoppeAlles();
  let start;
  if(x.ziel==null||x.phase==='start'){
    const m=LU.teile().minutes,snap=A.snapDown(Math.floor(m+1e-6),LU.einst.stufe);
    start=Math.round((LU.s.instant+(snap-m)*Z.MIN)/Z.MIN)*Z.MIN;
  }else start=x.ziel;
  x.start=start;x.ziel=Z.randomPracticeTarget(start,LU.einst.stufe,LU.zone());
  versuchZurueck();x.phase='lauf';x.pause=false;LU.s.instant=start;
  LU.animiere({art:'reise',ziel:x.ziel,rate:ABLAUF[LU.einst.tempoAblauf],fertig:()=>{x.phase='frage';vorbereiten();LU.neu();}});
  LU.neu();
};
function vorbereiten(){
  const x=q(),p=Z.parts(x.ziel,LU.zone());
  x.antwort=p.hour*60+p.minute;
  if(x.phase==='frage')x.optionen=A.buildAnswerChoices(x.antwort,LU.einst.stufe);
  if(x.phase==='dauer')x.optionen=A.durationChoices(dauer(),LU.einst.stufe);
}
const dauer=()=>Math.round((q().ziel-q().start)/Z.MIN);
function loesungWorte(){const x=q();return worte()?W.timeWords(x.antwort,LU.einst.sprechweise):W.spokenDigits(x.antwort);}

function richtig(){
  const x=q();LU.s.autoHilfe=null;LU.ton.gut();
  if(x.phase==='frage'){x.phase='gut1';LU.lob('Richtig!');}
  else{x.fertig++;
    if(x.fertig>=LU.einst.runde){x.phase='ende';LU.lob('Geschafft!');}
    else{x.phase='gut2';LU.lob('Richtig!');}
  }
  LU.ansage('Richtig!');LU.neu();
}
function falsch(text){
  const x=q();x.fehler++;LU.ton.falsch();
  x.meldung=text;x.meldungGut=false;
  if(x.fehler>=2){
    if(x.phase==='frage')LU.s.autoHilfe={bereich:true,hervorheben:true};
    if(x.phase==='dauer')LU.s.autoHilfe={vergangen:true};
  }
  LU.neu();
}
const FALSCH_UHR='Noch nicht. Schauen Sie auf beide Zeiger.';
const FALSCH_DAUER='Noch nicht. Zählen Sie von der Startzeit weiter.';

function waehle(v){
  const x=q();if(x.erneut)return;
  if(x.phase==='frage'){if(v===x.antwort)richtig();else{x.falsch.add(v);falsch(FALSCH_UHR);}}
  else if(x.phase==='dauer'){if(v===dauer())richtig();else{x.falsch.add(v);falsch(FALSCH_DAUER);}}
}
function pruefeEingabe(){
  const x=q();if(x.erneut)return;
  const h=x.eingabe[0],m=x.eingabe[1];
  if(h===''){x.feld=0;x.meldung=x.phase==='dauer'?'Bitte zuerst die Stunden eintippen.':'Bitte zuerst die Stunde eintippen.';LU.neu();return;}
  const wert=Number(h)*60+Number(m||0),text=x.phase==='dauer'?A.durationLabel(wert):Z.pad(Number(h))+':'+Z.pad(Number(m||0));
  const ok=x.phase==='dauer'?wert===dauer():Number(h)<24&&Number(m||0)<60&&wert===x.antwort;
  if(ok)richtig();else{x.eingabe=['',''];x.feld=0;falsch((x.phase==='dauer'?FALSCH_DAUER:FALSCH_UHR)+' ('+text+' stimmt nicht.)');}
}
function ziffer(k){
  const x=q();
  if(bausteine()&&x.schritt==='zahl'){
    if(k==='Löschen')x.zahl=x.zahl.slice(0,-1);
    else if(k==='Weiter'){const n=Number(x.zahl);if(n>=1&&n<=29){x.kachel=W.countTile(x.richtung,n);x.schritt=2;x.meldung='';}else{x.meldung='Bitte eine Zahl von 1 bis 29.';}}
    else if(x.zahl.length<2)x.zahl+=k;
    LU.neu();return;
  }
  if(k==='Prüfen'){pruefeEingabe();return;}
  if(k==='Löschen'){if(x.eingabe[x.feld]==='')x.feld=Math.max(0,x.feld-1);x.eingabe[x.feld]=x.eingabe[x.feld].slice(0,-1);LU.neu();return;}
  const f=x.feld;if(x.eingabe[f].length>=2){if(f===0)x.feld=1;else{LU.neu();return;}}
  x.eingabe[x.feld]+=k;
  const voll=x.feld===0&&(x.eingabe[0].length===2||(x.phase==='dauer'?true:Number(x.eingabe[0])>2));
  if(voll)x.feld=1;
  x.meldung='';LU.neu();
}

/* Wortbausteine: Minutenteil (getrennt nach erster und zweiter Stundenhälfte), dann Stunde */
const kachelCache=new Map();
function kacheln(){
  const key=LU.einst.stufe+'|'+LU.einst.sprechweise;if(kachelCache.has(key))return kachelCache.get(key);
  const liste=W.tiles(LU.einst.stufe,LU.einst.sprechweise).map(t=>{
    if(t.count)return Object.assign({},t,{minute:t.count==='nach'?1:31});
    let minute=0;for(let m=0;m<60;m++)if(W.validWordAnswer(W.buildPhrase(t,2),2*60+m)||W.validWordAnswer(W.buildPhrase(t,2),3*60+m)){minute=m;break;}
    return Object.assign({},t,{minute});
  }).sort((a,b)=>a.minute-b.minute);
  const r={nach:liste.filter(t=>t.minute<30),vor:liste.filter(t=>t.minute>=30)};kachelCache.set(key,r);return r;
}
function satzText(){
  const x=q();
  if(x.schritt===1)return '…';
  if(x.schritt==='zahl')return (x.zahl||'…')+' Minuten '+x.richtung+' …';
  return W.buildPhrase(x.kachel,x.stunde);
}
function pruefeSatz(){
  const x=q();if(x.stunde==null)return;
  const satz=W.buildPhrase(x.kachel,x.stunde);
  if(W.validWordAnswer(satz,x.antwort))richtig();
  else{x.schritt=1;x.kachel=null;x.stunde=null;falsch('Noch nicht: „'+satz+'“ passt nicht.');}
}

quiz.weiter=function(){
  const x=q();
  if(x.phase==='start')quiz.los();
  else if(x.phase==='gut1'){x.phase='dauer';versuchZurueck();vorbereiten();LU.neu();}
  else if(x.phase==='gut2'){x.nr++;quiz.los();}
  else if(x.phase==='ende'){quiz.neu();quiz.los();}
};

quiz.binden=function(){
  LU.tippen($('weiter'),quiz.weiter);
  LU.tippen($('pause'),()=>{const x=q();if(x.phase!=='lauf')return;x.pause=!x.pause;if(LU.s.anim)LU.s.anim.pause=x.pause;LU.neu();});
  LU.tippen($('nochmal'),()=>{const x=q();if(x.phase!=='dauer'||x.erneut)return;x.erneut=true;LU.s.instant=x.start;
    LU.animiere({art:'reise',ziel:x.ziel,rate:ABLAUF[LU.einst.tempoAblauf],fertig:()=>{x.erneut=false;LU.neu();}});LU.neu();});
  for(const f of LU.qa('#b-eingabe .feld'))LU.tippen(f,()=>{q().feld=Number(f.dataset.feld);LU.neu();});
  LU.baueZiffern($('b-ziffern'),'zeit',ziffer);
  LU.tippen($('satz-zurueck'),()=>{const x=q();x.schritt=1;x.kachel=null;x.stunde=null;x.zahl='';x.meldung='';LU.neu();});
  LU.tippen($('satz-pruefen'),pruefeSatz);
  LU.tippen($('b-vorlesen2').querySelector('button'),e=>{
    const x=q(),k=e.currentTarget;
    if(x.phase==='gut1')LU.sprache.sprich('Es ist '+loesungWorte()+'.',k);
    else{const d=Math.round((x.ziel-x.start)/Z.MIN),hh=Math.floor(d/60),mm=d%60;
      LU.sprache.sprich('Es sind '+(hh===1?'eine Stunde':W.numberWord(hh)+' Stunden')+(mm?' und '+(mm===1?'eine Minute':W.numberWord(mm)+' Minuten'):'')+' vergangen.',k);}
  });
};

/* Ziffernfeld: zeit (Prüfen), zahl (Weiter), koord (mit Minus und Komma) */
LU.baueZiffern=function(el,art,fn){
  el.replaceChildren();el.dataset.art=art;
  const keys=art==='koord'?['1','2','3','4','5','6','7','8','9','−','0',',','Löschen','Übernehmen']:['1','2','3','4','5','6','7','8','9','Löschen','0',art==='zahl'?'Weiter':'Prüfen'];
  const dockOrder=art==='koord'?{'1':1,'2':2,'3':3,'4':4,'5':5,'−':6,',':7,'Löschen':8,'6':9,'7':10,'8':11,'9':12,'0':13,'Übernehmen':14}:{'1':1,'2':2,'3':3,'4':4,'5':5,'Löschen':6,'6':7,'7':8,'8':9,'9':10,'0':11,'Prüfen':12,'Weiter':12};
  el.classList.toggle('breit',art==='koord');
  for(const k of keys){const b=document.createElement('button');b.type='button';b.textContent=k;b.dataset.k=k;b.style.setProperty('--o',dockOrder[k]);
    if(k.length>1)b.classList.add('wort');if(k==='Prüfen'||k==='Weiter'||k==='Übernehmen')b.classList.add('primaer');
    if(k==='Übernehmen')b.style.gridColumn='span 2';
    LU.tippen(b,()=>fn(k));el.appendChild(b);}
};
LU.ziffernUmstellen=function(el,art,fn){if(el.dataset.art!==art)LU.baueZiffern(el,art,fn);};

function kontextText(){
  const x=q(),E=LU.einst;
  if(LU.s.autoHilfe&&LU.s.autoHilfe.bereich)return {t:'Hilfe: Die Zahl und der Stundenbereich leuchten.',hilfe:true};
  if(LU.s.autoHilfe&&LU.s.autoHilfe.vergangen)return {t:'Hilfe: Die vergangene Zeit ist eingefärbt.',hilfe:true};
  switch(x.phase){
    case 'start':return {t:'Lernstufe: '+LU.STUFEN[E.stufe]+(worte()?' · in Worten, '+LU.formText(E.sprechweise):'')};
    case 'lauf':return {t:'Start '+LU.hm(x.start)+(E.dauerZeigen?' · '+A.durationLabel((LU.s.instant-x.start)/Z.MIN)+' vergangen':'')};
    case 'frage':
      if(bausteine())return {t:x.schritt===2?'Jetzt: die Stunde.':x.schritt==='zahl'?'Wie viele Minuten?':'Zuerst: die Minuten.'};
      if(worte())return {t:'In Worten, '+LU.formText(E.sprechweise)};
      return {t:x.antwort<720?'Vormittags · 0\u00a0bis\u00a011\u00a0Uhr':'Nachmittags oder abends · 12\u00a0bis\u00a023\u00a0Uhr'};
    default:return {t:''};
  }
}

quiz.digitalSichtbar=function(){const p=q().phase;return p==='start'?LU.s.hilfen.digital:['gut1','dauer','gut2','ende'].includes(p);};

quiz.zeichne=function(){
  const x=q(),E=LU.einst,ph=x.phase,lauf=ph==='lauf';
  // Fortschritt
  const fs=$('b-fortschritt');
  if(fs.childElementCount!==E.runde){fs.replaceChildren();for(let i=0;i<E.runde;i++)fs.appendChild(document.createElement('i'));}
  Array.from(fs.children).forEach((d,i)=>{d.className=i<x.fertig?'fertig':(i===x.fertig&&ph!=='ende'&&ph!=='start'?'jetzt':'');});
  fs.setAttribute('aria-label','Aufgabe '+Math.min(x.fertig+1,E.runde)+' von '+E.runde);
  // Kontext
  const k=kontextText();$('b-kontext').hidden=!k.t;$('kontext').textContent=k.t;$('kontext').classList.toggle('hilfe',!!k.hilfe);
  // Start und Ziel
  const paar=ph==='dauer'||ph==='gut2';$('b-paar').hidden=!paar;
  if(paar){$('paar-start').textContent=LU.hm(x.start);$('paar-ziel').textContent=LU.hm(x.ziel);}
  // Frage und Rückmeldung
  const fr=$('frage'),rm=$('rueckmeldung');fr.classList.remove('loesung');rm.classList.remove('gut');rm.style.whiteSpace='';
  $('b-frage').classList.toggle('kompakt',bausteine()); // Wortbausteine brauchen den Platz
  if(ph==='start'){fr.textContent=E.runde+' Aufgaben';rm.textContent='Die Zeit läuft vorwärts. Welche Uhrzeit ist es dann?';}
  else if(lauf){fr.textContent=x.pause?'Angehalten':'Die Zeit läuft …';rm.textContent=x.pause?'':'Schauen Sie auf die Zeiger.';}
  else if(ph==='frage'){fr.textContent=worte()?'Wie heißt die Uhrzeit in Worten?':'Welche Uhrzeit zeigt die Uhr?';rm.textContent=x.meldung;}
  else if(ph==='dauer'){fr.textContent='Wie viel Zeit ist vergangen?';rm.textContent=x.erneut?'Schauen Sie noch einmal zu.':x.meldung;}
  else if(ph==='gut1'){fr.textContent='Richtig!';fr.classList.add('loesung');rm.classList.add('gut');rm.style.whiteSpace='pre-line';rm.textContent='Es ist '+LU.hm(x.ziel)+' Uhr.\n'+loesungWorte();}
  else if(ph==='gut2'){fr.textContent='Richtig!';fr.classList.add('loesung');rm.classList.add('gut');rm.textContent='Es sind '+A.durationLabel(dauer())+' vergangen.';}
  else if(ph==='ende'){fr.textContent='Runde geschafft!';fr.classList.add('loesung');rm.classList.add('gut');rm.textContent=E.runde+' Aufgaben gelöst.';}
  // Antworten
  const leicht=!schwer()&&(ph==='frage'||ph==='dauer');
  $('b-antworten').hidden=!leicht;
  if(leicht){
    const key=ph+'|'+x.optionen.join(',')+'|'+E.sprechweise+'|'+E.aufgabe;
    const box=$('b-antworten');
    if(box.dataset.k!==key){box.dataset.k=key;box.replaceChildren();
      for(const v of x.optionen){const b=document.createElement('button');b.type='button';b.className='antwort';b.dataset.v=v;
        b.textContent=ph==='dauer'?A.durationLabel(v):worte()?W.timeWords(v,E.sprechweise):LU.label(v);
        LU.tippen(b,()=>waehle(v));box.appendChild(b);}
    }
    for(const b of box.children){const v=Number(b.dataset.v),f=x.falsch.has(v);b.classList.toggle('falsch',f);b.disabled=f||x.erneut;b.setAttribute('aria-disabled',String(f));}
  }
  // Ziffernfeld
  const zahlSchritt=bausteine()&&x.schritt==='zahl';
  const zf=(schwer()&&((ph==='frage'&&!worte())||ph==='dauer'))||zahlSchritt;
  $('b-ziffern').hidden=!zf;$('b-eingabe').hidden=!(zf&&!zahlSchritt);
  if(zf){
    LU.ziffernUmstellen($('b-ziffern'),zahlSchritt?'zahl':'zeit',ziffer);
    if(!zahlSchritt){
      $('feld0-name').textContent=ph==='dauer'?'Stunden':'Stunde';$('feld1-name').textContent='Minuten';
      $('feld0').textContent=x.eingabe[0];$('feld1').textContent=x.eingabe[1];
      LU.qa('#b-eingabe .feld').forEach((f,i)=>f.classList.toggle('aktiv',i===x.feld));
      $('feld-trenner').textContent=ph==='dauer'?'':':';
    }
    for(const b of $('b-ziffern').children)b.disabled=!!x.erneut;
  }
  // Wortbausteine
  const bs=bausteine();
  const hoch=LU.G&&LU.G.hoch;$('kopf-satz').hidden=!bs||hoch;$('b-satz').hidden=!bs||!hoch;$('b-kacheln-nach').hidden=!(bs&&x.schritt===1);$('b-kacheln-vor').hidden=!(bs&&x.schritt===1);
  $('b-stunden').hidden=!(bs&&x.schritt===2);$('b-satzknoepfe').hidden=!(bs&&x.schritt!==1);
  if(bs){
    $('kopf-satz').textContent=satzText();$('satz').textContent=satzText();
    const kk=kacheln(),key=E.stufe+'|'+E.sprechweise;
    for(const seite of ['nach','vor']){const box=$('b-kacheln-'+seite);
      if(box.dataset.k!==key){box.dataset.k=key;box.replaceChildren();
        for(const t of kk[seite]){const b=document.createElement('button');b.type='button';b.className='kachel';b.textContent=t.label;
          LU.tippen(b,()=>{const y=q();if(t.count){y.schritt='zahl';y.richtung=t.count;y.zahl='';}else{y.kachel=t;y.schritt=2;}y.meldung='';LU.neu();});box.appendChild(b);}}
    }
    const sb=$('b-stunden');
    if(!sb.childElementCount)W.HOURS.forEach((w,i)=>{const b=document.createElement('button');b.type='button';b.className='kachel';b.textContent=w;b.dataset.i=i;
      LU.tippen(b,()=>{q().stunde=i;LU.neu();});sb.appendChild(b);});
    for(const b of sb.children)b.setAttribute('aria-pressed',String(Number(b.dataset.i)===x.stunde));
    $('satz-pruefen').hidden=x.schritt==='zahl';$('satz-pruefen').disabled=x.stunde==null;
  }
  // Knöpfe
  $('b-vorlesen2').hidden=!(ph==='gut1'||ph==='gut2');
  $('b-weiter').hidden=!(ph==='start'||ph==='gut1'||ph==='gut2'||ph==='ende');
  $('weiter').querySelector('.cap').textContent=ph==='start'?'Los geht’s':ph==='ende'?'Neue Runde':'Weiter';
  $('b-pause').hidden=!lauf;$('pause').querySelector('use').setAttribute('href',x.pause?'#i-vor':'#i-pause');$('pause').setAttribute('aria-label',x.pause?'Weiter laufen':'Pause');
  $('b-nochmal').hidden=ph!=='dauer';$('nochmal').disabled=!!x.erneut;
};
})();
