/* Lernzeit: Zeitzonen, Zeitumstellung, Mitternacht, Sonne und Mond.
   Aus der Vorlage „Meine Lernuhr“ übernommen; nur der Pfad zu SunCalc ist angepasst. */
(function(root,factory){
  if(typeof module==='object' && module.exports) module.exports=factory(require('../vendor/suncalc.js'));
  else root.Lernzeit=factory(root.SunCalc);
})(typeof globalThis!=='undefined'?globalThis:this,function(SunCalc){
  'use strict';
  const MIN=60000, DAY=86400000;
  const formatters=new Map(), solarCache=new Map(), lunarCache=new Map();
  const places={
    herrieden:{name:'Herrieden',lat:49.233,lon:10.5,zone:'Europe/Berlin'},
    ansbach:{name:'Ansbach',lat:49.301,lon:10.572,zone:'Europe/Berlin'},
    berlin:{name:'Berlin',lat:52.52,lon:13.405,zone:'Europe/Berlin'},
    hamburg:{name:'Hamburg',lat:53.551,lon:9.994,zone:'Europe/Berlin'},
    munich:{name:'München',lat:48.137,lon:11.575,zone:'Europe/Berlin'}
  };
  const pad=n=>String(n).padStart(2,'0');
  const mod=(n,m)=>((n%m)+m)%m;
  function parts(instant,zone){
    if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));
    const p={};for(const v of formatters.get(zone).formatToParts(new Date(instant)))if(v.type!=='literal')p[v.type]=Number(v.value);
    p.ymd=`${p.year}-${pad(p.month)}-${pad(p.day)}`;
    p.minutes=p.hour*60+p.minute+p.second/60+mod(instant,1000)/60000;
    return p;
  }
  function offset(instant,zone){
    const p=parts(instant,zone);
    return (Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(instant/1000)*1000)/MIN;
  }
  function shiftDate(ymd,days){return new Date(Date.parse(ymd+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);}
  function validDate(ymd){const date=new Date(ymd+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(ymd)&&ymd>='1900-01-01'&&ymd<='2100-12-31'&&Number.isFinite(+date)&&date.toISOString().slice(0,10)===ymd;}
  function wallToInstant(ymd,minutes,zone){
    const wall=Date.parse(ymd+'T00:00:00Z')+Math.round(minutes*MIN);
    const offsets=[...new Set([-DAY,0,DAY].map(d=>offset(wall+d,zone)))];
    const candidates=offsets.map(o=>wall-o*MIN).sort((a,b)=>a-b);
    const exact=candidates.filter(t=>Math.abs(t+offset(t,zone)*MIN-wall)<1);
    if(exact.length)return exact[0]; // Repeated hour: first occurrence.
    // Missing spring hour: advance by the size of the gap (02:30 -> 03:30).
    return candidates.find(t=>t+offset(t,zone)*MIN>=wall)??candidates[candidates.length-1];
  }
  function dayBounds(ymd,zone){return [wallToInstant(ymd,0,zone),wallToInstant(shiftDate(ymd,1),0,zone)];}
  function clock(instant,zone){if(instant==null||!Number.isFinite(+instant))return '—';const p=parts(+instant+30000,zone);return `${pad(p.hour)}:${pad(p.minute)}`;}
  function dateLabel(ymd,options={day:'numeric',month:'long',year:'numeric'}){return new Intl.DateTimeFormat('de-DE',{...options,timeZone:'UTC'}).format(new Date(ymd+'T12:00:00Z'));}
  function duration(minutes){const n=Math.max(0,Math.round(minutes));return `${Math.floor(n/60)} Std. ${n%60} Min.`;}
  function solar(ymd,place){
    const key=[ymd,place.lat,place.lon,place.zone].join('|');if(solarCache.has(key))return solarCache.get(key);
    const noon=wallToInstant(ymd,720,place.zone);
    const v=SunCalc.getTimes(new Date(noon),place.lat,place.lon,0,offset(noon,place.zone));
    v.length=v.alwaysUp?1440:v.alwaysDown?0:v.sunrise&&v.sunset?(v.sunset-v.sunrise)/MIN:0;
    v.riseMinute=v.sunrise?parts(+v.sunrise,place.zone).minutes:0;
    v.setMinute=v.sunset?parts(+v.sunset,place.zone).minutes:v.alwaysUp?1440:0;
    if(solarCache.size>1500)solarCache.clear();solarCache.set(key,v);return v;
  }
  function lunar(ymd,place){
    const key=[ymd,place.lat,place.lon,place.zone].join('|');if(lunarCache.has(key))return lunarCache.get(key);
    const [start,end]=dayBounds(ymd,place.zone), events={};
    // Query UTC calendar days and filter against the real local day, including 23/25-hour DST days.
    for(let utc=Math.floor(start/DAY)*DAY;utc<end;utc+=DAY){
      const v=SunCalc.getMoonTimes(new Date(utc+DAY/2),place.lat,place.lon,0);
      for(const name of ['rise','set'])if(v[name]&&+v[name]>=start&&+v[name]<end)events[name]=v[name];
    }
    if(lunarCache.size>100)lunarCache.clear();lunarCache.set(key,events);return events;
  }
  function nextClockTarget(instant,dialMinute,zone){
    const p=parts(instant,zone), candidates=[];
    for(let d=0;d<=2;d++)for(const half of [0,720]){
      const t=wallToInstant(shiftDate(p.ymd,d),mod(dialMinute,720)+half,zone);
      if(t>instant+1&&mod(Math.round(parts(t,zone).minutes),720)===mod(dialMinute,720))candidates.push(t);
    }
    return Math.min(...candidates);
  }
  function randomPracticeTarget(instant,level,zone,random=Math.random){
    const step={full:60,half:30,quarter:15,five:5,any:1}[level]||1;
    const choices=[];
    // Scan real elapsed minutes, so the bounds also hold across midnight and DST.
    const first=Math.ceil((instant+60*MIN)/MIN)*MIN;
    for(let t=first;t<=instant+240*MIN;t+=MIN){
      const p=parts(t,zone);
      if((p.hour*60+p.minute)%step===0)choices.push(t);
    }
    return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];
  }
  function dayOfYear(ymd){return Math.round((Date.parse(ymd+'T12:00Z')-Date.parse(ymd.slice(0,4)+'-01-01T12:00Z'))/DAY)+1;}
  function daysInYear(year){return (Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/DAY;}
  function phaseName(phase){return ['Neumond','Zunehmende Sichel','Zunehmender Halbmond','Zunehmender Mond','Vollmond','Abnehmender Mond','Abnehmender Halbmond','Abnehmende Sichel'][Math.round(phase*8)%8];}
  return {MIN,DAY,places,pad,mod,parts,offset,shiftDate,validDate,wallToInstant,dayBounds,clock,dateLabel,duration,solar,lunar,nextClockTarget,randomPracticeTarget,dayOfYear,daysInYear,phaseName};
});
