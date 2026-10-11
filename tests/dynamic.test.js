const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const records=new Map();let counter=0;
const store={get:async path=>{const record=records.get(path);return record?{stream:new Blob([record.text]).stream(),blob:{etag:record.etag}}:null;},put:async(path,value,options)=>{const prior=records.get(path);if(prior&&!options.allowOverwrite)throw Error('Blob already exists');if(options.ifMatch&&prior?.etag!==options.ifMatch)throw Error('Precondition failed');const etag=String(++counter);records.set(path,{text:value,etag});return {etag};},list:async({prefix})=>({blobs:[...records.keys()].filter(p=>p.startsWith(prefix)).map(pathname=>({pathname})),hasMore:false}),del:async path=>records.delete(path)};
require.cache[require.resolve('@vercel/blob')]={exports:store};
process.env.SESSION_SECRET='test-only-key';process.env.BLOB_READ_WRITE_TOKEN='test-only-token';process.env.ADMIN_USERNAME='staff';const salt='test-salt';process.env.ADMIN_PASSWORD_HASH=salt+':'+crypto.scryptSync('strong-test-password',salt,64).toString('hex');delete process.env.SMTP_PASS;
const c=require('../lib/core'),sessions=require('../api/session'),content=require('../api/content'),enquiry=require('../api/enquiry'),inbox=require('../api/inbox');
async function run(handler,req){const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},end(){}};await handler({method:'GET',headers:{},query:{},...req},res);return res;}
const session={type:'staff',id:'test-session',exp:Date.now()+3600000};
const headers={cookie:`__Host-guru=${c.token(session)}`,origin:'https://guru-school.vercel.app','content-type':'application/json','x-csrf-token':c.sign(session.id)};
test('session cookies reject tampering and expire; password hashes verify',()=>{assert.ok(c.session({headers}));assert.equal(c.session({headers:{cookie:headers.cookie+'tampered'}}),null);assert.equal(c.decode(c.token({...session,exp:1})),null);assert.ok(c.passwordOK('strong-test-password'));assert.equal(c.passwordOK('wrong'),false);});
test('admin endpoints reject unauthenticated access and missing CSRF',async()=>{assert.equal((await run(inbox,{})).statusCode,401);assert.equal((await run(content,{method:'PUT',headers:{...headers,'x-csrf-token':''},body:{}})).statusCode,403);assert.equal((await run(content,{method:'PUT',headers:{...headers,origin:'https://attacker.example'},body:{}})).statusCode,403);});
test('login issues a secure cookie and limits repeated failed attempts',async()=>{const result=await run(sessions,{method:'POST',headers:{origin:headers.origin,'content-type':'application/json'},body:{username:'staff',password:'strong-test-password'}});assert.equal(result.statusCode,200);assert.match(result.headers['Set-Cookie'],/Secure; HttpOnly; SameSite=Strict/);for(let i=0;i<9;i++)assert.equal((await run(sessions,{method:'POST',headers:{origin:headers.origin,'content-type':'application/json'},body:{username:'staff',password:'bad'}})).statusCode,401);assert.equal((await run(sessions,{method:'POST',headers:{origin:headers.origin,'content-type':'application/json'},body:{username:'staff',password:'bad'}})).statusCode,429);});
test('draft news is private and stale content updates are rejected',async()=>{const site={announcement:'Hello',announcementMy:'',photos:[],news:[{id:crypto.randomUUID(),title:'Draft',body:'Not public',date:'2026-10-11',published:false},{id:crypto.randomUUID(),title:'Published',body:'Public story',date:'2026-10-11',published:true}]};const save=await run(content,{method:'PUT',headers,body:{content:site,version:null}});assert.equal(save.statusCode,200);const publicResult=await run(content,{});assert.equal(publicResult.body.content.news.length,1);assert.equal(publicResult.body.content.news[0].title,'Published');assert.equal(publicResult.body.version,undefined);assert.equal((await run(content,{method:'PUT',headers,body:{content:site,version:null}})).statusCode,409);});
test('enquiries persist without SMTP, retries do not duplicate, and inbox status updates persist',async()=>{const token=c.token({type:'enquiry',nonce:crypto.randomBytes(24).toString('hex'),issued:Date.now()-3000,exp:Date.now()+3600000});const body={token,name:'Test Parent',email:'test@example.com',kind:'Book a school visit',date:'2099-01-01',message:'Test visit request',website:''};const result=await run(enquiry,{method:'POST',headers,body});assert.equal(result.statusCode,200);assert.equal((await run(enquiry,{method:'POST',headers,body})).body.reference,result.body.reference);assert.equal([...records.keys()].filter(p=>p.startsWith('enquiries/')).length,1);const list=await run(inbox,{headers});const item=list.body.items[0];assert.equal(item.emailStatus,'not-configured');const update=await run(inbox,{method:'PATCH',headers,body:{id:item.id,createdKey:item.createdKey,version:item.version,status:'confirmed',notes:'Test confirmation'}});assert.equal(update.statusCode,200);assert.equal(update.body.item.status,'confirmed');assert.equal((await run(inbox,{method:'PATCH',headers,body:{id:item.id,createdKey:item.createdKey,version:item.version,status:'closed',notes:''}})).statusCode,409);});
test('invalid visit dates and spam fields are rejected',async()=>{for(const extra of [{date:'2026-99-99'},{date:'2020-01-01'},{website:'spam'}]){const token=c.token({type:'enquiry',nonce:crypto.randomBytes(24).toString('hex'),issued:Date.now()-3000,exp:Date.now()+3600000});const result=await run(enquiry,{method:'POST',headers,body:{token,name:'Test',email:'test@example.com',kind:'Book a school visit',date:'2099-01-01',message:'Testing validation',...extra}});assert.equal(result.statusCode,400);}});
test('health requires staff access and reports missing email credentials',async()=>{
 const health=require('../api/health');assert.equal((await run(health,{})).statusCode,401);assert.equal((await run(health,{headers})).body.emailConfigured,false);
});
test('media uploads reject unsafe/oversized images and accept re-encoded WebP photos',async()=>{
 const media=require('../api/media');
 assert.equal((await run(media,{method:'POST',body:{image:'abc'}})).statusCode,401);
 assert.equal((await run(media,{method:'POST',headers,body:{image:Buffer.from('<svg>not a photo</svg>').toString('base64')}})).statusCode,400);
 assert.equal((await run(media,{method:'POST',headers,body:{image:Buffer.alloc(2500001).toString('base64')}})).statusCode,413);
 const buffer=await require('sharp')({create:{width:20,height:20,channels:3,background:'blue'}}).png().toBuffer();
 const upload=await run(media,{method:'POST',headers,body:{image:buffer.toString('base64')}});assert.equal(upload.statusCode,200);assert.ok(c.UUID.test(upload.body.id));
 const image=records.get(`media/${upload.body.id}.webp`);assert.equal((await require('sharp')(image.text).metadata()).format,'webp');
 assert.equal((await run(media,{query:{id:upload.body.id}})).statusCode,404);
 assert.equal((await run(media,{query:{id:'../private'}})).statusCode,404);
});
test('email notification uses the school inbox and visitor Reply-To, and SMTP failure does not lose enquiries',async()=>{
 const nodemailer=require('nodemailer'),original=nodemailer.createTransport;const keys=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','MAIL_FROM','MAIL_TO'];const before=Object.fromEntries(keys.map(key=>[key,process.env[key]]));let sent=[];
 Object.assign(process.env,{SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'465',SMTP_USER:'sender@example.com',SMTP_PASS:'test-only',MAIL_FROM:'sender@example.com',MAIL_TO:'guruinternationalschool.aca@gmail.com'});
 try{
  nodemailer.createTransport=()=>({sendMail:async message=>{sent.push(message);return {accepted:['guruinternationalschool.aca@gmail.com']};},close(){}});
  const submit=async()=>{const token=c.token({type:'enquiry',nonce:crypto.randomBytes(24).toString('hex'),issued:Date.now()-3000,exp:Date.now()+3600000});return run(enquiry,{method:'POST',headers,body:{token,name:'Test parent',email:'parent@example.com',phone:'091234567',kind:'General enquiry',message:'Please contact me.',website:''}});};
  const accepted=await submit();assert.equal(accepted.statusCode,200);assert.equal(sent[0].to,'guruinternationalschool.aca@gmail.com');assert.equal(sent[0].replyTo.address,'parent@example.com');assert.ok(sent[0].text.includes('091234567'));assert.ok(sent[0].html.includes('Please contact me.'));
  const first=await run(inbox,{headers});assert.equal(first.body.items.find(item=>item.id===accepted.body.reference).emailStatus,'accepted');
  nodemailer.createTransport=()=>({sendMail:async()=>{throw Error('SMTP unavailable');},close(){}});
  const failed=await submit();assert.equal(failed.statusCode,200);const second=await run(inbox,{headers});assert.equal(second.body.items.find(item=>item.id===failed.body.reference).emailStatus,'failed');
 }finally{nodemailer.createTransport=original;for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}}
});

test('news images validate storage references and become accessible only when published',async()=>{
 const media=require('../api/media');const imageId=crypto.randomUUID();await c.write(`media/${imageId}.json`,{id:imageId});
 const current=await run(content,{headers});const site={...current.body.content,news:[{id:crypto.randomUUID(),title:'Image story',body:'With a photo',date:'2026-10-11',published:false,imageId,imageAlt:'School photo',imageAltMy:''}]};
 const save=await run(content,{method:'PUT',headers,body:{content:site,version:current.body.version}});assert.equal(save.statusCode,200);assert.equal(save.body.content.news[0].imageId,imageId);assert.equal((await run(media,{query:{id:imageId}})).statusCode,404);
 const invalid={...site,news:[{...site.news[0],imageId:crypto.randomUUID()}]};assert.equal((await run(content,{method:'PUT',headers,body:{content:invalid,version:save.body.version}})).statusCode,400);
 site.news[0].published=true;assert.equal((await run(content,{method:'PUT',headers,body:{content:site,version:save.body.version}})).statusCode,200);
 const original=c.get;let accessed=false;c.get=async()=>{accessed=true;return null;};try{await run(media,{query:{id:imageId}});assert.ok(accessed);}finally{c.get=original;}
});

test('existing gallery visibility persists and rejects unknown or duplicate photo names',async()=>{
 const image=require('../lib/gallery.json')[0].image;const current=await run(content,{headers});const site={...current.body.content,hiddenGallery:[image]};
 const saved=await run(content,{method:'PUT',headers,body:{content:site,version:current.body.version}});assert.equal(saved.statusCode,200);assert.deepEqual((await run(content,{})).body.content.hiddenGallery,[image]);
 for(const hiddenGallery of [['../private'],[image,image]])assert.equal((await run(content,{method:'PUT',headers,body:{content:{...site,hiddenGallery},version:saved.body.version}})).statusCode,400);
 const restored=await run(content,{method:'PUT',headers,body:{content:{...site,hiddenGallery:[]},version:saved.body.version}});assert.equal(restored.statusCode,200);assert.deepEqual(restored.body.content.hiddenGallery,[]);
});
test('deleting enquiries requires staff, CSRF and current version and frees storage',async()=>{
 const id=crypto.randomUUID(),createdKey='1791670000000',path=`enquiries/${createdKey}-${id}.json`;
 const saved=await c.write(path,{id,createdKey,created:new Date().toISOString(),name:'Delete test',status:'closed'});
 const body={id,createdKey,version:saved.etag};
 assert.equal((await run(inbox,{method:'DELETE',body})).statusCode,401);
 assert.equal((await run(inbox,{method:'DELETE',headers:{...headers,'x-csrf-token':''},body})).statusCode,403);
 assert.equal((await run(inbox,{method:'DELETE',headers,body:{...body,createdKey:'../private'}})).statusCode,400);
 assert.equal((await run(inbox,{method:'DELETE',headers,body:{...body,version:'stale'}})).statusCode,409);
 assert.ok(records.has(path));
 assert.equal((await run(inbox,{method:'DELETE',headers,body})).statusCode,200);
 assert.equal(records.has(path),false);
 assert.equal((await run(inbox,{method:'DELETE',headers,body})).statusCode,404);
});
test('gallery uploads support events, graduation and trips and retain their categories',async()=>{
 const current=await run(content,{headers});const photos=[];
 for(const category of ['events','graduation','trips']){const id=crypto.randomUUID();await c.write(`media/${id}.json`,{id});photos.push({id,caption:`Test ${category}`,captionMy:'',category,published:true});}
 const result=await run(content,{method:'PUT',headers,body:{content:{...current.body.content,photos},version:current.body.version}});
 assert.equal(result.statusCode,200);
 assert.deepEqual((await run(content,{})).body.content.photos.map(photo=>photo.category),['events','graduation','trips']);
});
