const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png'};
const handlers=Object.fromEntries(fs.readdirSync('api').filter(f=>f.endsWith('.js')).map(f=>[f.slice(0,-3),require(`../api/${f}`)]));
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost:5173');
 if(url.pathname.startsWith('/api/')){
  const handler=handlers[url.pathname.slice(5)];if(!handler){res.writeHead(404).end();return;}
  let length=0,chunks=[];for await(const chunk of req){length+=chunk.length;if(length>4000000){res.writeHead(413).end();return;}chunks.push(chunk);}
  req.body=Buffer.concat(chunks).toString();req.query=Object.fromEntries(url.searchParams);
  res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  await handler(req,res);return;
 }
 const target=url.pathname==='/admin'?'/admin.html':url.pathname==='/'?'/index.html':url.pathname;
 const root=path.resolve('dist'),file=path.resolve(root,`.${target}`);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
}).listen(5173,()=>console.log('Guru local preview: http://localhost:5173 (staff authentication requires HTTPS; use the deployed dashboard).'));
