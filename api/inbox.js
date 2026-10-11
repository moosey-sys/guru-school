const c=require('../lib/core');
module.exports=c.wrap(async(req,res)=>{
 c.staff(req,req.method!=='GET');
 if(req.method==='GET'){
  const page=await c.list({prefix:'enquiries/',limit:50,...(req.query.cursor?{cursor:req.query.cursor}:{})});
  const records=await Promise.all(page.blobs.map(async b=>{const record=await c.read(b.pathname);return record?{...record.data,version:record.etag}:null;}));
  return res.json({items:records.filter(Boolean).sort((a,b)=>b.created.localeCompare(a.created)),cursor:page.hasMore?page.cursor:null});
 }
 if(req.method!=='PATCH')return res.status(405).json({error:'Method not allowed.'});
 const data=c.json(req,5000);if(!c.UUID.test(data.id||'')||!['new','in-progress','confirmed','closed'].includes(data.status)||typeof data.notes!=='string'||data.notes.length>2000)return res.status(400).json({error:'Invalid status or notes.'});
 if(!/^\d{13}$/.test(data.createdKey||''))return res.status(400).json({error:'Invalid record.'});
 const path=`enquiries/${data.createdKey}-${data.id}.json`;const item=await c.read(path);if(!item)return res.status(404).json({error:'Record not found.'});if(item.etag!==data.version)return res.status(409).json({error:'Record changed. Refresh before saving.'});
 const next={...item.data,status:data.status,notes:data.notes.trim(),updated:new Date().toISOString()};const saved=await c.write(path,next,item.etag);res.json({item:{...next,version:saved.etag}});
});
