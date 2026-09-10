const crypto=require('crypto');
const {bin,bcrypt}=require('./_lib');
function fail(res,c,m){return res.status(c).json({error:m})}
module.exports=async(req,res)=>{
 try{
  if(req.method!=='POST')return res.status(405).end();
  const userId=String(req.body?.userId||''),token=String(req.body?.token||''),password=String(req.body?.password||'');
  if(!userId||!token||!password)return fail(res,400,'Data reset tidak lengkap.');
  if(password.length<6)return fail(res,400,'Password minimal 6 karakter.');
  const db=await bin(); db.users=db.users||[]; const u=db.users.find(x=>x.id===userId);
  const hash=crypto.createHash('sha256').update(token).digest('hex');
  if(!u||!u.resetTokenHash||u.resetTokenHash!==hash||Number(u.resetTokenExpires||0)<Date.now())return fail(res,400,'Link reset sandi tidak valid atau sudah kedaluwarsa.');
  u.passwordHash=await bcrypt.hash(password,12); delete u.resetTokenHash; delete u.resetTokenExpires; await bin('PUT',db);
  res.json({ok:true,message:'Sandi berhasil diubah. Silakan login kembali.'});
 }catch(e){res.status(500).json({error:e.message})}
}
