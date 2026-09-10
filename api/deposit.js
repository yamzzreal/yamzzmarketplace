const crypto=require("crypto");
const {bin,userId,id,now}=require("./_lib");

async function handleWebhook(req,res){
  try{
    const sig=req.headers["x-casaku-signature"],secret=process.env.CASAKU_WEBHOOK_SECRET;
    if(!secret||!sig)return res.status(401).json({error:"Invalid signature"});
    const raw=Buffer.isBuffer(req.body)?req.body:Buffer.from(JSON.stringify(req.body));
    const expected=crypto.createHmac("sha256",secret).update(raw).digest("hex");
    const a=Buffer.from(String(sig),"hex"),b=Buffer.from(expected,"hex");
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:"Invalid signature"});
    const p=JSON.parse(raw.toString()),db=await bin();
    const dep=(db.deposits||[]).find(x=>x.transactionId===p.transactionId);
    if(!dep||p.status!=="paid")return res.sendStatus(200);
    if(dep.status==="paid")return res.sendStatus(200);
    const u=(db.users||[]).find(x=>x.id===dep.userId);
    if(!u)return res.sendStatus(200);
    dep.status="paid";
    dep.paidAt=p.paidAt||now();
    u.saldo=Number(u.saldo||0)+Number(dep.amount);
    db.transactions=db.transactions||[];
    db.transactions.push({id:id("TRX"),userId:u.id,type:"deposit",reference:dep.id,amount:dep.amount,status:"success",createdAt:now()});
    await bin("PUT",db);
    return res.sendStatus(200);
  }catch(e){
    console.error(e);
    return res.sendStatus(200);
  }
}

module.exports=async(req,res)=>{
  try{
    if(req.query?.webhook==="casaku" || String(req.url||"").includes("webhook=casaku")){
      return handleWebhook(req,res);
    }
    if(req.method!=="POST")return res.status(405).end();
    const uid=userId(req),amount=Number(req.body.amount);
    if(!uid)return res.status(401).json({error:"Silakan login."});
    if(!Number.isInteger(amount)||amount<1000||amount>10000000)return res.status(400).json({error:"Nominal deposit 1.000–10.000.000."});
    if(!process.env.CASAKU_LICENSE_KEY||!process.env.CASAKU_QR_ID)return res.status(500).json({error:"Layanan pembayaran belum dikonfigurasi."});
    const payload={
      qr_id:process.env.CASAKU_QR_ID,
      amount,
      useUniqueCode:true,
      packageIds:(process.env.CASAKU_PACKAGE_IDS||"id.dana").split(",").map(x=>x.trim()).filter(Boolean),
      expiredInMinutes:Number(process.env.CASAKU_EXPIRED_MINUTES||15),
      qrType:"dynamic",
      paymentMethod:"qris",
      useQris:true,
      prefix:"YAMZZ"
    };
    const r=await fetch("https://api.casaku.id/api/generate/v2/qris",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-license-key":process.env.CASAKU_LICENSE_KEY},
      body:JSON.stringify(payload)
    });
    const d=await r.json();
    if(!r.ok)return res.status(r.status).json({error:d.message||"Gagal membuat pembayaran."});
    const t=d.data||d;
    const dep={id:id("DEP"),userId:uid,amount,totalAmount:Number(t.totalAmount||amount),transactionId:t.transactionId,status:"pending",createdAt:now()};
    const db=await bin();
    db.deposits=db.deposits||[];
    db.deposits.push(dep);
    await bin("PUT",db);
    return res.json({deposit:dep,qrString:t.qr_string||t.qrString||null});
  }catch(e){
    return res.status(500).json({error:e.message});
  }
};
