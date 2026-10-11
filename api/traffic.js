const c=require('../lib/core');const {localDate}=require('../lib/analytics');
function cookie(req,name){return String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);}
module.exports=c.wrap(async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end();}
 if(!c.originOK(req))return res.status(403).json({error:'Invalid origin.'});
 if(c.session(req)||req.headers.dnt==='1'||req.headers['sec-gpc']==='1'||/bot|crawler|spider|headless|preview|curl|wget/i.test(req.headers['user-agent']||''))return res.status(204).end();
 if(!process.env.BLOB_READ_WRITE_TOKEN||!process.env.SESSION_SECRET)return res.status(503).end();
 const data=c.json(req,1000);if(data.path!=='/')return res.status(400).json({error:'Invalid page.'});
 let visitor=c.decode(cookie(req,'__Host-guru-visitor')),visit=c.decode(cookie(req,'__Host-guru-visit'));const cookies=[];
 if(visitor?.type!=='visitor'){visitor={type:'visitor',id:c.randomBytes(20).toString('hex'),exp:Date.now()+365*86400000};cookies.push(`__Host-guru-visitor=${c.token(visitor)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`);}
 if(visit?.type!=='visit'||visit.browser!==visitor.id){visit={type:'visit',browser:visitor.id,id:c.randomBytes(16).toString('hex'),exp:Date.now()+30*60000};cookies.push(`__Host-guru-visit=${c.token(visit)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800`);}
 if(cookies.length)res.setHeader('Set-Cookie',cookies);
 const date=localDate(),browser=c.sign('visitor:'+visitor.id).slice(0,40),path=`analytics/visits/${date}/${browser}-${visit.id}.json`;
 // One durable event per browser session/day; reloads do not inflate the count.
 if(await c.read(path))return res.status(204).end();
 await c.rate(req,'traffic',60);
 try{await c.write(path,{date});}catch(e){if(!/already exists/i.test(e.message))throw e;}
 res.status(204).end();
});
