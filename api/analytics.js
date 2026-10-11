const c=require('../lib/core');const {localDate,summarize}=require('../lib/analytics');
module.exports=c.wrap(async(req,res)=>{
 c.staff(req);if(req.method!=='GET')return res.status(405).end();
 const today=localDate(),year=String(req.query.year||today.slice(0,4)),month=String(req.query.month||today.slice(5,7));
 if(!/^\d{4}$/.test(year)||Number(year)<2020||Number(year)>2100||! /^(0[1-9]|1[0-2])$/.test(month))return res.status(400).json({error:'Choose a valid year and month.'});
 let cursor,paths=[];do{const page=await c.list({prefix:'analytics/visits/',limit:1000,...(cursor?{cursor}:{})});paths.push(...page.blobs.map(b=>b.pathname));cursor=page.hasMore?page.cursor:null;if(paths.length>=100000&&cursor)throw Object.assign(new Error('Traffic history is too large for this report. Contact the site administrator to archive or migrate analytics.'),{status:503});}while(cursor);
 res.json({...summarize(paths,year,month,today),selectedYear:year,selectedMonth:month,timezone:'Asia/Yangon',updated:new Date().toISOString()});
});
