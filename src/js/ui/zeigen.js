/* Bereich Zeigen: Zeit laufen lassen, Jetzt, vergangene Zeit, Lernhilfen, Sprechweise, Vorlesen */
(function(){
'use strict';
const LU=window.LU,$=LU.$,Z=LU.Z,W=LU.W,A=LU.A;
const zeigen={};LU.zeigen=zeigen;
const TEMPO={langsam:1,mittel:10,schnell:60}; // Minuten pro Sekunde

zeigen.worte=function(form){
  const m=Math.floor(LU.wandMinuten()+1e-6);
  return W.timeWords(m,form);
};
zeigen.vorlesen=function(e){
  const f=LU.s.form;
  const text=f==='beide'?'Süddeutsch: '+zeigen.worte('sued')+'. Hochdeutsch: '+zeigen.worte('hoch')+'.':'Es ist '+zeigen.worte(f)+'.';
  LU.sprache.sprich(text,e&&e.currentTarget);
};

zeigen.binden=function(){
  for(const b of LU.qa('[data-lauf]'))LU.tippen(b,()=>{
    const r=Number(b.dataset.lauf);
    if(r===0){LU.stoppeAlles();}
    else{LU.stoppeAlles();LU.s.lauf=r;LU.animiere({art:'lauf',richtung:r,rate:TEMPO[LU.s.tempo]});}
    LU.neu();
  });
  for(const b of LU.qa('[data-tempo]'))LU.tippen(b,()=>{
    LU.s.tempo=b.dataset.tempo;
    if(LU.s.anim&&LU.s.anim.art==='lauf')LU.s.anim.rate=TEMPO[LU.s.tempo];
    LU.neu();
  });
  LU.tippen($('jetzt'),()=>{LU.stoppeAlles();LU.s.live=true;LU.s.instant=Date.now();LU.liveStart();LU.neu();});
  LU.tippen($('start-fest'),()=>{LU.s.start=LU.s.start==null?LU.s.instant:null;LU.neu();});
  for(const b of LU.qa('[data-hilfe]'))LU.tippen(b,()=>{
    const k=b.dataset.hilfe,h=LU.s.hilfen;h[k]=!h[k];
    if(k==='minuten'&&h.minuten)h.alleMinuten=false;
    if(k==='alleMinuten'&&h.alleMinuten)h.minuten=false;
    LU.neu();
  });
  for(const b of LU.qa('#b-sprechweise [data-form]'))LU.tippen(b,()=>{LU.s.form=b.dataset.form;if(!LU.s.hilfen.worte)LU.s.hilfen.worte=true;LU.neu();});
  LU.tippen($('b-vorlesen').querySelector('button'),zeigen.vorlesen);
};

zeigen.zeichne=function(){
  const s=LU.s,h=s.hilfen;
  for(const b of LU.qa('[data-lauf]'))b.setAttribute('aria-pressed',String(s.anim&&s.anim.art==='lauf'?Number(b.dataset.lauf)===s.anim.richtung:Number(b.dataset.lauf)===0&&!s.live));
  for(const b of LU.qa('[data-tempo]'))b.setAttribute('aria-pressed',String(b.dataset.tempo===s.tempo));
  $('jetzt').setAttribute('aria-pressed',String(s.live));
  for(const b of LU.qa('[data-hilfe]'))b.setAttribute('aria-pressed',String(!!h[b.dataset.hilfe]));
  for(const b of LU.qa('#b-sprechweise [data-form]'))b.setAttribute('aria-pressed',String(b.dataset.form===s.form));
  // Worte
  const bw=$('b-worte');bw.hidden=!h.worte;
  if(h.worte){
    const beide=s.form==='beide';bw.classList.toggle('einzeln',!beide);
    for(const z of LU.qa('.wort-zeile',bw)){const f=z.dataset.form,an=beide||f===s.form;z.hidden=!an;if(an)z.querySelector('.wort-text').textContent=zeigen.worte(f);}
  }
  $('b-vorlesen').hidden=!h.vorlesen;
  // Vergangene Zeit
  const st=$('start-fest');st.setAttribute('aria-pressed',String(s.start!=null));
  st.textContent=s.start==null?'Start festhalten':'Start löschen';
  const seit=$('seit');
  if(s.start==null){seit.textContent=LU.G&&LU.G.hoch?'':'Startzeit festhalten, dann Zeit laufen lassen.';}
  else{
    const min=Math.round((s.instant-s.start)/Z.MIN);
    seit.replaceChildren();
    if(min<0){seit.textContent='Die Uhr steht vor der Startzeit.';}
    else{
      if(!LU.G.hoch)seit.append('seit '+LU.hm(s.start)+' · ');
      const a=document.createElement('span');a.className='h';a.textContent=Math.floor(min/60)+' Std.';
      const b=document.createElement('span');b.className='m';b.textContent=(min%60)+' Min.';
      seit.append(a,' ',b);
    }
  }
};
})();
