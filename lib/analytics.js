function localDate(time=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yangon',year:'numeric',month:'2-digit',day:'2-digit'}).format(time);}
function summarize(paths,year,month,today=localDate()) {
 const days=new Map(),months=new Map(),years=new Map();let first=null;
 const group=(map,key,browser)=>{if(!map.has(key))map.set(key,{visits:0,browsers:new Set()});const bucket=map.get(key);bucket.visits++;bucket.browsers.add(browser);};
 for(const path of paths){const match=path.match(/^analytics\/visits\/(\d{4}-\d{2}-\d{2})\/([a-f0-9]{40})-([a-f0-9]{32})\.json$/);if(!match)continue;const date=match[1],browser=match[2];if(!first||date<first)first=date;group(days,date,browser);group(months,date.slice(0,7),browser);group(years,date.slice(0,4),browser);}
 const count=bucket=>({visits:bucket?.visits||0,visitors:bucket?.browsers.size||0});
 const numberOfDays=new Date(Date.UTC(Number(year),Number(month),0)).getUTCDate();
 return {today:count(days.get(today)),month:count(months.get(today.slice(0,7))),year:count(years.get(today.slice(0,4))),firstTrackedDate:first,daily:Array.from({length:numberOfDays},(_,i)=>{const key=`${year}-${month}-${String(i+1).padStart(2,'0')}`;return {key,label:String(i+1),...count(days.get(key))};}),monthly:Array.from({length:12},(_,i)=>{const key=`${year}-${String(i+1).padStart(2,'0')}`;return {key,label:new Intl.DateTimeFormat('en',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(Number(year),i,1))),...count(months.get(key))};}),yearly:[...years.keys()].sort().map(key=>({key,label:key,...count(years.get(key))})),availableYears:[...new Set([today.slice(0,4),...years.keys()])].sort().reverse()};
}
module.exports={localDate,summarize};
