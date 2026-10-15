/* Ton und Sprachausgabe. Töne werden lokal erzeugt (aus der Vorlage), keine Audiodateien.
   Beides startet erst nach der ersten Berührung (Safari). */
(function(){
'use strict';
const LU=window.LU;
let ctx=null;
const ton={};LU.ton=ton;
ton.entsperren=function(){
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx=ctx||new Audio();ctx.resume();
    // Stiller Ton entsperrt iOS
    const o=ctx.createOscillator(),g=ctx.createGain();g.gain.value=0;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.02);
  }catch(e){}
};
function spiele(art){
  if(!LU.einst.ton||!ctx)return;
  try{
    ctx.resume();
    const gain=ctx.createGain(),start=ctx.currentTime+.02,lang=LU.einst.lob==='fanfare'&&art==='gut';
    gain.gain.value=.16;gain.connect(ctx.destination);let filter=null;
    const note=(fr,at,len,type='triangle',vol=.6)=>{
      const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(fr,start+at);
      if(art==='falsch')osc.frequency.linearRampToValueAtTime(fr*.85,start+at+len);
      env.gain.setValueAtTime(0,start+at);env.gain.linearRampToValueAtTime(vol,start+at+.02);
      env.gain.exponentialRampToValueAtTime(.001,start+at+len-.02);env.gain.linearRampToValueAtTime(0,start+at+len);
      osc.connect(env);env.connect(gain);osc.start(start+at);osc.stop(start+at+len);
      osc.onended=()=>{osc.disconnect();env.disconnect();};
    };
    if(art==='falsch'){
      filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;filter.Q.value=.5;
      gain.disconnect();gain.connect(filter);filter.connect(ctx.destination);
      note(110,0,.55,'sawtooth',.65);note(116,0,.55,'sawtooth',.35);
    }else if(!lang){
      for(const [fr,t,d] of [[523.25,0,.25],[659.25,.22,.25],[783.99,.44,.25],[1046.5,.66,.59]])note(fr,t,d,'triangle',.6);
    }else{
      const mel=[[523.25,0,.32],[659.25,.35,.32],[783.99,.7,.32],[1046.5,1.05,.55],[783.99,1.7,.24],[1046.5,1.98,.24],[1174.66,2.26,.3],[1318.51,2.62,.46]];
      for(const [fr,t,d] of mel){note(fr,t,d,'triangle',.65);note(fr*2,t,d,'sine',.12);}
      for(const fr of [523.25,659.25,783.99,1046.5])note(fr,3.2,1.8,'sine',.3);
    }
  }catch(e){/* Ton darf die Übung nie unterbrechen */}
}
ton.gut=()=>spiele('gut');
ton.falsch=()=>spiele('falsch');

/* Vorlesen mit deutscher Stimme des Geräts */
const sprache={};LU.sprache=sprache;
function melde(knopf,text){if(!knopf)return;const alt=knopf.dataset.text||knopf.textContent;knopf.dataset.text=alt;knopf.textContent=text;setTimeout(()=>{knopf.textContent=alt;},2500);}
sprache.sprich=function(text,knopf){
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){melde(knopf,'Vorlesen geht hier nicht');LU.ansage('Vorlesen wird von diesem Browser nicht unterstützt.');return false;}
  const alle=speechSynthesis.getVoices(),stimmen=alle.filter(v=>/^de([_-]|$)/i.test(v.lang));
  if(alle.length&&!stimmen.length){melde(knopf,'Keine deutsche Stimme');return false;}
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.85;
    if(stimmen.length)u.voice=stimmen.find(v=>v.localService)||stimmen[0];
    speechSynthesis.speak(u);return true;
  }catch(e){return false;}
};
sprache.stopp=function(){try{if('speechSynthesis' in window)speechSynthesis.cancel();}catch(e){}};
LU.ansage=function(text){const a=LU.$('ansage');a.textContent='';setTimeout(()=>{a.textContent=text;},30);};
})();
