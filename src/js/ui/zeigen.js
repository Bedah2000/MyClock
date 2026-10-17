/* Bereich Zeigen: Laufwerk, Zufallszeit, Jetzt, vergangene Zeit, Stufe mit passenden Hilfen,
   Anzeige (digital, in Worten, Vorlesen auf Tipp) */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z,W=LU.W,A=LU.A;
const zeigen={};LU.zeigen=zeigen;
const TEMPO={1:1,2:15}; // Minuten pro Sekunde: ▶ und ▶▶

zeigen.worte=function(form){
  const m=Math.floor(LU.wandMinuten()+1e-6);
  return W.timeWords(m,form);
};
zeigen.vorlesen=function(e){
  const f=LU.s.form;
  const text=f==='beide'?'Süddeutsch: '+zeigen.worte('sued')+'. Hochdeutsch: '+zeigen.worte('hoch')+'.':'Es ist '+zeigen.worte(f)+'.';
  LU.sprache.sprich(text,e&&e.currentTarget);
};

/* Zufallszeit im Schritt der Stufe. Die Zeiger laufen nur vorwärts: das Ziel liegt in den nächsten 12 Stunden,
   so ist jede Zeigerstellung genau einmal erreichbar (außer der aktuellen). */
zeigen.zufall=function(zufall=Math.random){
  LU.stoppeAlles();LU.s.start=null;
  const schritt=A.STEP[LU.einst.stufe]||60,jetzt=LU.wandMinuten(),stellung=Math.round(jetzt)%720,wahl=[];
  for(let t=0;t<1440;t+=schritt){const d=((t-jetzt)%1440+1440)%1440;if(d>0&&d<=720&&t%720!==stellung)wahl.push([t,d]);}
  const [ziel,d]=wahl[Math.min(wahl.length-1,Math.floor(zufall()*wahl.length))];
  const tag=jetzt+d>=1440?Z.shiftDate(LU.ymd(),1):LU.ymd();
  let zielZeit=Z.wallToInstant(tag,ziel,LU.zone());
  if(!(zielZeit>LU.s.instant))zielZeit=LU.s.instant+d*Z.MIN; // Sicherheit bei Zeitumstellung
  LU.animiere({art:'gehe',von:LU.s.instant,ziel:zielZeit,dauer:Math.round(500+d/720*900)});
  LU.neu();
  return ziel;
};

zeigen.binden=function(){
  for(const b of LU.qa('[data-lauf]'))LU.tippen(b,()=>{
    const r=Number(b.dataset.lauf);LU.stoppeAlles();
    if(r!==0)LU.animiere({art:'lauf',richtung:Math.sign(r),rate:TEMPO[Math.abs(r)],taste:r});
    LU.neu();
  });
  LU.tippen($('zufall'),()=>zeigen.zufall());
  LU.tippen($('jetzt'),()=>{LU.stoppeAlles();LU.s.instant=Date.now();LU.liveStart();LU.neu();});
  LU.tippen($('start-fest'),()=>{LU.s.start=LU.s.start==null?LU.s.instant:null;LU.neu();});
  for(const b of LU.qa('#b-hilfen [data-hilfe],#b-anzeige [data-hilfe]'))LU.tippen(b,()=>{LU.schalteHilfe(b.dataset.hilfe);LU.neu();});
  for(const b of LU.qa('[data-stufe]'))LU.tippen(b,()=>{LU.setzeStufe(b.dataset.stufe);LU.neu();});
  for(const b of LU.qa('#b-sprechweise [data-form]'))LU.tippen(b,()=>{LU.s.form=b.dataset.form;LU.neu();});
  LU.tippen($('vorlesen'),zeigen.vorlesen);
};

zeigen.zeichne=function(){
  const s=LU.s,h=s.hilfen,a=s.anim;
  const taste=a&&a.art==='lauf'?a.taste:(s.live?null:0);
  for(const b of LU.qa('[data-lauf]'))b.setAttribute('aria-pressed',String(Number(b.dataset.lauf)===taste));
  $('jetzt').setAttribute('aria-pressed',String(s.live));
  $('start-fest').setAttribute('aria-pressed',String(s.start!=null));
  for(const b of LU.qa('#b-hilfen [data-hilfe],#b-anzeige [data-hilfe]'))b.setAttribute('aria-pressed',String(!!h[b.dataset.hilfe]));
  for(const b of LU.qa('[data-stufe]'))b.setAttribute('aria-pressed',String(b.dataset.stufe===LU.einst.stufe));
  for(const b of LU.qa('#b-sprechweise [data-form]'))b.setAttribute('aria-pressed',String(b.dataset.form===s.form));
  $('b-sprechweise').hidden=!h.worte;
  // Worte
  const bw=$('b-worte');bw.hidden=!h.worte;
  if(h.worte){
    const beide=s.form==='beide';bw.classList.toggle('einzeln',!beide);
    for(const z of LU.qa('.wort-zeile',bw)){const f=z.dataset.form,an=beide||f===s.form;z.hidden=!an;if(an)z.querySelector('.wort-text').textContent=zeigen.worte(f);}
  }
  // Vergangene Zeit
  const seit=$('seit');$('b-seit').hidden=s.start==null;
  if(s.start!=null){
    const min=Math.round((s.instant-s.start)/Z.MIN);
    seit.replaceChildren();
    if(min<0){seit.textContent='vor der Startzeit';}
    else{
      if(!LU.G.hoch)seit.append('seit '+LU.hm(s.start)+' · ');
      const x=document.createElement('span');x.className='h';x.textContent=Math.floor(min/60)+' Std.';
      const y=document.createElement('span');y.className='m';y.textContent=(min%60)+' Min.';
      seit.append(x,' ',y);
    }
  }
};
})();
