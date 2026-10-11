const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const base='https://guru-school.vercel.app';let cookie='',csrf='';
async function request(path,method='GET',body,auth=false){const response=await fetch(base+path,{method,headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:cookie,'X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();return {response,data};}
(async()=>{
 assert.equal((await request('/api/inbox')).response.status,401);
 const password=fs.readFileSync('.admin-credentials','utf8').match(/^Password: (.+)$/m)[1];
 const login=await request('/api/session','POST',{username:process.env.ADMIN_USERNAME,password});assert.equal(login.response.status,200,login.data.error);cookie=login.response.headers.get('set-cookie').split(';')[0];csrf=login.data.csrf;
 const current=await request('/api/content','GET',null,true);assert.equal(current.response.status,200);
 const testId=randomUUID();const testNews={id:testId,title:'Internal deployment verification',titleMy:'',body:'Temporary private test record. Not published.',bodyMy:'',date:'2026-10-11',published:false};
 const edited={...current.data.content,news:[...current.data.content.news,testNews]};
 const saved=await request('/api/content','PUT',{content:edited,version:current.data.version},true);assert.equal(saved.response.status,200,saved.data.error);
 const publicContent=await request('/api/content');assert.ok(!publicContent.data.content.news.some(x=>x.id===testId));
 const readback=await request('/api/content','GET',null,true);assert.ok(readback.data.content.news.some(x=>x.id===testId));
 const rollback=await request('/api/content','PUT',{content:current.data.content,version:readback.data.version},true);assert.equal(rollback.response.status,200,rollback.data.error);
 const media=await request('/api/media','POST',{image:fs.readFileSync('dist/assets/hero.webp').toString('base64')},true);assert.equal(media.response.status,200,media.data.error);
 const preview=await fetch(`${base}/api/media?id=${media.data.id}`,{headers:{Cookie:cookie}});assert.equal(preview.status,200);assert.equal(preview.headers.get('content-type'),'image/webp');
 assert.equal((await fetch(`${base}/api/media?id=${media.data.id}`)).status,404);
 // Remove only the temporary uploaded verification image, never user content.
 await require('@vercel/blob').del([`media/${media.data.id}.webp`,`media/${media.data.id}.json`]);
 const setup=await request('/api/health','GET',null,true);assert.equal(setup.response.status,200);
 const proof=await request('/api/enquiry');assert.equal(proof.response.status,200);
 await new Promise(resolve=>setTimeout(resolve,2200));
 const submission=await request('/api/enquiry','POST',{token:proof.data.token,name:'Deployment verification',email:'test@example.com',phone:'',kind:'Short message',message:'Internal deployment test — verifying the enquiry is stored. No action required.',date:'',website:''});assert.equal(submission.response.status,200,submission.data.error);
 const inbox=await request('/api/inbox','GET',null,true);assert.equal(inbox.response.status,200);const item=inbox.data.items.find(x=>x.id===submission.data.reference);assert.ok(item);
 const updated=await request('/api/inbox','PATCH',{id:item.id,createdKey:item.createdKey,version:item.version,status:'closed',notes:'Automated deployment verification passed; this is a test record.'},true);assert.equal(updated.response.status,200,updated.data.error);
 const again=await request('/api/inbox','GET',null,true);assert.equal(again.data.items.find(x=>x.id===item.id).status,'closed');
 const logout=await request('/api/session','DELETE',null,true);assert.equal(logout.response.status,200);
 console.log('Live verification passed: staff login, private drafts, persistent content, image uploads, private images, saved enquiries, status updates, and logout.');
 console.log(`Email notifications configured: ${setup.data.emailConfigured}. Test enquiry retained as closed in dashboard.`);
})().catch(e=>{console.error('Live verification failed:',e.message);process.exit(1);});
