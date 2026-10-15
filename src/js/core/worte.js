/* Uhrzeit in Worten: süddeutsch und hochdeutsch.
   numberWord, timeWords, normalize und validWordAnswer stammen aus der Vorlage.
   Neu: weitere gültige Varianten bei der Prüfung und die Wortbausteine für „Schwer“. */
(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.Worte=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const mod=(n,m)=>((n%m)+m)%m;
  const SMALL=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
  const TENS=['','','zwanzig','dreißig','vierzig','fünfzig'];
  const HOURS=['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf'];

  function numberWord(n){
    if(n<20)return SMALL[n];
    return n%10?(n%10===1?'ein':SMALL[n%10])+'und'+TENS[Math.floor(n/10)]:TENS[Math.floor(n/10)];
  }
  /* region: 'sued' oder 'hoch' (in der Vorlage 'south' / 'standard'). */
  function timeWords(time,region){
    const south=region==='sued'||region==='south';
    const t=mod(Math.round(time),720),h=Math.floor(t/60)||12,m=t%60,next=(h%12)+1;
    const hour=numberWord(h),following=numberWord(next);
    if(m===0)return (h===1?'ein':hour)+' Uhr';
    if(m===15)return south?'viertel '+following:'Viertel nach '+hour;
    if(m===30)return 'halb '+following;
    if(m===45)return south?'dreiviertel '+following:'Viertel vor '+following;
    if(south&&m===25)return 'fünf vor halb '+following;
    if(south&&m===35)return 'fünf nach halb '+following;
    const amount=m<30?m:60-m;
    return (amount===1?'eine Minute':numberWord(amount)+(amount%5?' Minuten':''))+(m<30?' nach '+hour:' vor '+following);
  }
  /* Uhrzeit in Zahlen gesprochen, 24 Stunden: „vierzehn Uhr fünfundvierzig“. */
  function spokenDigits(time){
    const t=mod(Math.round(time),1440),h=Math.floor(t/60),m=t%60;
    return (h===1?'ein':numberWord(h))+' Uhr'+(m?' '+numberWord(m):'');
  }
  function normalize(text){
    return String(text).toLowerCase().normalize('NFKC').replace(/^\s*es\s+ist\s+/,'')
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[\s.,!?…-]/g,'');
  }
  /* Alle Formen, die für diese Uhrzeit als richtig gelten. */
  function variants(time){
    const t=mod(Math.round(time),720),h=Math.floor(t/60)||12,m=t%60,next=(h%12)+1;
    const list=[timeWords(time,'sued'),timeWords(time,'hoch')];
    if(!m)list.push(numberWord(h),numberWord(h)+' Uhr');
    const amount=m<30?m:60-m;
    if(m&&m!==30){
      const words=amount===1?'eine Minute':numberWord(amount)+' Minuten';
      const tail=m<30?' nach '+numberWord(h):' vor '+numberWord(next);
      list.push(words+tail);                       // „zehn Minuten nach drei“
      if(amount%5===0)list.push(numberWord(amount)+tail);
    }
    if(m===15)list.push('viertel nach '+numberWord(h));
    if(m===45)list.push('viertel vor '+numberWord(next));
    // Im Süden ebenfalls üblich: „zehn vor halb vier“ (3:20), „zehn nach halb vier“ (3:40).
    if(m===20)list.push('zehn vor halb '+numberWord(next));
    if(m===40)list.push('zehn nach halb '+numberWord(next));
    if(m===25)list.push('fünf vor halb '+numberWord(next));
    if(m===35)list.push('fünf nach halb '+numberWord(next));
    return list;
  }
  function validWordAnswer(value,time){
    const n=normalize(value);
    return variants(time).some(v=>normalize(v)===n);
  }

  /* Wortbausteine: Schritt 1 Minutenteil, Schritt 2 Stunde.
     Ein Baustein hat vorne/hinten-Text um das Stundenwort, oder fragt eine Minutenzahl ab. */
  const P=(label,pre,post='')=>({label,pre,post});
  const FULL=P('… Uhr','',' Uhr');
  const TILES={
    full:{sued:[FULL],hoch:[FULL]},
    half:{sued:[FULL,P('halb …','halb ')],hoch:[FULL,P('halb …','halb ')]},
    quarter:{
      sued:[FULL,P('viertel …','viertel '),P('halb …','halb '),P('dreiviertel …','dreiviertel ')],
      hoch:[FULL,P('Viertel nach …','Viertel nach '),P('halb …','halb '),P('Viertel vor …','Viertel vor ')]},
    five:{
      sued:[FULL,P('fünf nach …','fünf nach '),P('zehn nach …','zehn nach '),P('viertel …','viertel '),
        P('zwanzig nach …','zwanzig nach '),P('fünf vor halb …','fünf vor halb '),P('halb …','halb '),
        P('fünf nach halb …','fünf nach halb '),P('zwanzig vor …','zwanzig vor '),P('dreiviertel …','dreiviertel '),
        P('zehn vor …','zehn vor '),P('fünf vor …','fünf vor ')],
      hoch:[FULL,P('fünf nach …','fünf nach '),P('zehn nach …','zehn nach '),P('Viertel nach …','Viertel nach '),
        P('zwanzig nach …','zwanzig nach '),P('fünfundzwanzig nach …','fünfundzwanzig nach '),P('halb …','halb '),
        P('fünfundzwanzig vor …','fünfundzwanzig vor '),P('zwanzig vor …','zwanzig vor '),P('Viertel vor …','Viertel vor '),
        P('zehn vor …','zehn vor '),P('fünf vor …','fünf vor ')]},
    any:{
      sued:[FULL,P('viertel …','viertel '),P('halb …','halb '),P('dreiviertel …','dreiviertel '),
        P('fünf vor halb …','fünf vor halb '),P('fünf nach halb …','fünf nach halb '),
        {label:'… Minuten nach …',count:'nach'},{label:'… Minuten vor …',count:'vor'}],
      hoch:[FULL,P('Viertel nach …','Viertel nach '),P('halb …','halb '),P('Viertel vor …','Viertel vor '),
        {label:'… Minuten nach …',count:'nach'},{label:'… Minuten vor …',count:'vor'}]}
  };
  function tiles(level,region){
    const set=TILES[level]||TILES.full;
    return set[region==='hoch'?'hoch':'sued'];
  }
  /* Baustein mit gewählter Minutenzahl festlegen: 1 bis 29. */
  function countTile(direction,amount){
    const words=amount===1?'eine Minute':numberWord(amount)+' Minuten';
    return P(words+' '+direction+' …',words+' '+direction+' ');
  }
  function buildPhrase(tile,hourIndex){
    const word=HOURS[hourIndex];
    if(!tile)return '';
    if(hourIndex==null)return tile.label;
    return tile.pre+(tile.post===' Uhr'&&word==='eins'?'ein':word)+tile.post;
  }
  return {numberWord,timeWords,spokenDigits,normalize,variants,validWordAnswer,tiles,countTile,buildPhrase,HOURS};
});
