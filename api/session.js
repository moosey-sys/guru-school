const c=require('../lib/core');
module.exports=c.wrap(async(req,res)=>{
 if(req.method==='GET'){const s=c.session(req);return res.status(s?200:401).json(s?{user:process.env.ADMIN_USERNAME,csrf:c.sign(s.id)}:{error:'Please sign in.'});}
 if(!c.originOK(req))return res.status(403).json({error:'Invalid origin.'});
 if(req.method==='DELETE'){c.staff(req,true);res.setHeader('Set-Cookie','__Host-guru=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');return res.json({ok:true});}
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST, DELETE');return res.status(405).json({error:'Method not allowed.'});}
 const data=c.json(req,2000);await c.rate(req,'login',10);
 if(!c.equal(data.username,process.env.ADMIN_USERNAME)||!c.passwordOK(data.password))return res.status(401).json({error:'Incorrect username or password.'});
 const s={type:'staff',id:c.randomBytes(24).toString('hex'),exp:Date.now()+8*3600000};
 res.setHeader('Set-Cookie',`__Host-guru=${c.token(s)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`);
 res.json({user:process.env.ADMIN_USERNAME,csrf:c.sign(s.id)});
});
