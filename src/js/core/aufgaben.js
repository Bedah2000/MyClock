/* Aufgaben: Auswahlfelder für Uhrzeit und Zeitdauer, Lernstufen.
   buildAnswerChoices und die Dauer-Auswahl stammen aus der Vorlage; die Zielzeiten liefert
   Lernzeit.randomPracticeTarget (ebenfalls aus der Vorlage). */
(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.Aufgaben=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const mod=(n,m)=>((n%m)+m)%m;
  const LEVELS=['full','half','quarter','five','any'];
  const STEP={full:60,half:30,quarter:15,five:5,any:1};
  const minuteChoices={full:[0],half:[30],quarter:[15,45],five:Array.from({length:12},(_,i)=>i*5),any:Array.from({length:60},(_,i)=>i)};
  function shuffle(list,random){
    for(let i=list.length-1;i>0;i--){const k=Math.floor(random()*(i+1));[list[i],list[k]]=[list[k],list[i]];}
    return list;
  }
  /* Vier verschiedene Uhrzeiten aus derselben Tageshälfte (Vorlage). */
  function buildAnswerChoices(time,level,random=Math.random){
    const correct=mod(Math.round(time),1440);
    const allowed=minuteChoices[level]||minuteChoices.full;
    const pool=[];
    for(let hour=Math.floor(correct/720)*12;hour<Math.floor(correct/720)*12+12;hour++)for(const min of allowed){
      const value=hour*60+min;if(value!==correct)pool.push(value);
    }
    shuffle(pool,random);
    return shuffle([correct,...pool.slice(0,3)],random);
  }
  /* Vier Zeitdauern im Raster der Lernstufe bis 5 Stunden (Vorlage). */
  function durationChoices(correct,level,random=Math.random){
    const step=STEP[level]||1,pool=[];
    for(let n=step;n<=300;n+=step)if(n!==correct)pool.push(n);
    shuffle(pool,random);
    return shuffle([correct,...pool.slice(0,3)],random);
  }
  /* Uhrzeit (Minuten des Tages) auf das Raster der Lernstufe abrunden. */
  function snapDown(minutes,level){const s=STEP[level]||1;return Math.floor(minutes/s)*s;}
  function snapNearest(minutes,level){const s=STEP[level]||1;return Math.round(minutes/s)*s;}
  function durationLabel(minutes){const n=Math.max(0,Math.round(minutes));return Math.floor(n/60)+' Std. '+(n%60)+' Min.';}
  return {LEVELS,STEP,minuteChoices,buildAnswerChoices,durationChoices,snapDown,snapNearest,durationLabel,shuffle};
});
