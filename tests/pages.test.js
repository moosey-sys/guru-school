const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const routes=['','about','programmes','life','campus','team','gallery','news','contact'];
const config=JSON.parse(fs.readFileSync('vercel.json'));
test('separate public pages resolve their navigation and local assets',()=>{
 for(const route of routes){
  const html=fs.readFileSync(`dist/${route||'index'}.html`,'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,route+' primary heading');
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1,route+' active tab');
  if(route)assert.ok(config.rewrites.some(rule=>rule.source==='/'+route&&rule.destination==='/'+route+'.html'));
  for(const [,href]of html.matchAll(/href="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
   assert.ok(routes.includes(href.slice(1))||['/privacy.html','/admin'].includes(href),'Unknown page: '+href);
  }
  for(const [,asset]of html.matchAll(/(?:src|data-image)="([^"?]+)(?:\?[^"]*)?"/g))assert.ok(fs.existsSync('dist/'+asset),'Missing asset: '+asset);
  assert.ok(!html.includes('href="#programmes"'),'Old single-page navigation');
 }
 assert.ok(!fs.readFileSync('dist/index.html','utf8').includes('id="enquiry-form"'));
 assert.ok(fs.readFileSync('dist/contact.html','utf8').includes('id="enquiry-form"'));
 assert.ok(fs.readFileSync('dist/gallery.html','utf8').includes('gallery-update-6222095624409125917.webp'));
});
