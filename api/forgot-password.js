const crypto=require("crypto");
const {bin,now,encryptText,id}=require("./_lib");
function fail(res,c,m){return res.status(c).json({error:m})}
async function telegram(text){
 const bot=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
 if(!bot||!chat)return false;
 const r=await fetch(`https://api.telegram.org/bot${encodeURIComponent(bot)}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chat,text,parse_mode:"HTML",disable_web_page_preview:true})});
 return r.ok;
}
module.exports=async(req,res)=>{
 try{
  if(req.method!=="POST")return res.status(405).end();
  const username=String(req.body?.username||"").trim(),email=String(req.body?.email||"").trim().toLowerCase();
  if(!username||!email)return fail(res,400,"Username dan email wajib diisi.");
  const db=await bin();db.users=db.users||[];db.resetRequests=db.resetRequests||[];
  const u=db.users.find(x=>String(x.username||"").toLowerCase()===username.toLowerCase()&&String(x.email||"").toLowerCase()===email);
  // Selalu beri respons generik agar keberadaan akun tidak bocor.
  if(!u)return res.json({ok:true,message:"Permintaan reset sudah diterima. Jika data cocok, admin akan memprosesnya."});
  const raw=crypto.randomBytes(32).toString("hex"),expires=Date.now()+30*60*1000;
  u.resetTokenHash=crypto.createHash("sha256").update(raw).digest("hex");u.resetTokenExpires=expires;
  // Token disimpan terenkripsi agar admin dapat mengambil link tanpa menyimpan token mentah.
  db.resetRequests=db.resetRequests.filter(r=>!(r.userId===u.id&&r.status==="pending"&&Number(r.expiresAt)>Date.now()));
  db.resetRequests.push({id:id("RPR"),userId:u.id,username:u.username,email:u.email,tokenEncrypted:encryptText(raw),createdAt:now(),expiresAt:expires,status:"pending"});
  await bin("PUT",db);
  let telegramSent=false;
  try{telegramSent=await telegram(`🔐 <b>Permintaan Reset Sandi</b>\n\n👤 Username: <b>${String(u.username).replace(/[&<>]/g,"")}</b>\n📧 Email: ${String(u.email).replace(/[&<>]/g,"")}\n🕒 Waktu: ${new Date().toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})}\n\nPermintaan baru masuk. Buka Admin Panel → Reset Sandi untuk mengambil link dan kirim manual kepada pelanggan.`)}catch{}
  res.json({ok:true,message:"Permintaan reset sudah diterima. Admin akan memproses dan mengirim link reset secara manual."});
 }catch(e){res.status(500).json({error:e.message})}
}
