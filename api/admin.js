const {bin,bcrypt,adminToken,adminCookie,adminUser,clearAdminCookie,id,now,decryptText}=require("./_lib");

function fail(res,code,msg){return res.status(code).json({error:msg})}
function isAdmin(req){return !!adminUser(req)}
function clean(s){return String(s??"").trim()}
function safeCustomer(u,users,transactions){return {id:u.id,username:u.username,email:u.email,saldo:Number(u.saldo||0),status:u.status||"active",createdAt:u.createdAt,transactionCount:transactions.filter(t=>t.userId===u.id).length}}

module.exports=async(req,res)=>{
  try{
    if(req.method==="POST" && req.body?.action==="login"){
      const username=clean(req.body.username);
      const password=String(req.body.password||"");
      const envUser=process.env.ADMIN_USERNAME;
      const envPass=process.env.ADMIN_PASSWORD;
      const envHash=process.env.ADMIN_PASSWORD_HASH;
      if(!envUser || (!envPass && !envHash)) return fail(res,503,"Admin belum dikonfigurasi. Isi ADMIN_USERNAME dan ADMIN_PASSWORD (atau ADMIN_PASSWORD_HASH) di Vercel.");
      const okUser=username.toLowerCase()===envUser.toLowerCase();
      const okPass=envHash ? await bcrypt.compare(password,envHash) : password===envPass;
      if(!okUser||!okPass) return fail(res,401,"Username atau password admin salah.");
      res.setHeader("Set-Cookie",adminCookie(adminToken(envUser)));
      return res.json({ok:true,username:envUser});
    }

    if(req.method==="POST" && req.body?.action==="logout"){
      res.setHeader("Set-Cookie",clearAdminCookie());
      return res.json({ok:true});
    }

    if(!isAdmin(req)) return fail(res,401,"Silakan login sebagai admin.");

    const db=await bin();
    db.products=db.products||[];
    db.transactions=db.transactions||[];
    db.users=db.users||[];
    db.deposits=db.deposits||[];
    db.settings=db.settings||{};
    db.resetRequests=db.resetRequests||[];

    if(req.method==="GET"){
      const usersById=Object.fromEntries(db.users.map(u=>[u.id,u]));
      const transactions=db.transactions.slice().reverse().map(t=>({
        ...t,
        username:usersById[t.userId]?.username||"—",
        email:usersById[t.userId]?.email||"—"
      }));
      const base=(process.env.APP_URL||`${req.headers["x-forwarded-proto"]||"https"}://${req.headers.host}`).replace(/\/$/,"");
      const resetRequests=db.resetRequests.slice().reverse().map(r=>{
        let link="";
        if(r.status==="pending" && Number(r.expiresAt)>Date.now()){try{link=`${base}/reset-password.html?token=${encodeURIComponent(decryptText(r.tokenEncrypted))}&user=${encodeURIComponent(r.userId)}`}catch{}}
        return {id:r.id,userId:r.userId,username:r.username,email:r.email,createdAt:r.createdAt,expiresAt:r.expiresAt,status:Number(r.expiresAt)<=Date.now()?"expired":r.status,link};
      });
      return res.json({
        admin:{username:adminUser(req)},
        stats:{
          users:db.users.length,
          products:db.products.length,
          activeProducts:db.products.filter(x=>x.active!==false).length,
          transactions:db.transactions.length,
          pending:db.transactions.filter(x=>["pending","processing"].includes(x.status)).length,
          deposits:db.deposits.length,
          revenue:db.transactions.filter(x=>x.status==="success").reduce((a,x)=>a+Number(x.amount||0),0)
        },
        settings:db.settings,
        products:db.products,
        transactions:transactions.slice(0,200),
        customers:db.users.map(u=>safeCustomer(u,db.users,db.transactions)),
        resetRequests
      });
    }

    const action=req.body?.action;

    if(action==="save_settings"){
      const allowed=[
        "store_name","tagline","logo_url","favicon_url","maintenance",
        "maintenance_message","ticker_enabled","ticker_messages","banners",
        "support_whatsapp","support_email","footer_text","social_media"
      ];
      db.settings={...db.settings};
      for(const key of allowed){
        if(req.body.settings && Object.prototype.hasOwnProperty.call(req.body.settings,key)){
          db.settings[key]=req.body.settings[key];
        }
      }
      await bin("PUT",db);
      return res.json({ok:true,settings:db.settings});
    }

    if(action==="save_product"){
      const p=req.body.product||{};
      const category=clean(p.category).toLowerCase().replace(/[^a-z0-9-]/g,"-");
      const product={
        id:clean(p.id)||id("PRD"),
        category,
        name:clean(p.name),
        description:clean(p.description),
        price:Number(p.price||0),
        active:p.active!==false,
        updatedAt:now()
      };
      if(!product.category||!product.name) return fail(res,400,"Kategori dan nama produk wajib diisi.");
      const idx=db.products.findIndex(x=>x.id===product.id);
      if(idx>=0) db.products[idx]={...db.products[idx],...product};
      else db.products.push({...product,createdAt:now()});
      await bin("PUT",db);
      return res.json({ok:true,product});
    }

    if(action==="delete_product"){
      const productId=clean(req.body.id);
      db.products=db.products.filter(x=>x.id!==productId);
      await bin("PUT",db);
      return res.json({ok:true});
    }

    if(action==="toggle_product"){
      const p=db.products.find(x=>x.id===clean(req.body.id));
      if(!p) return fail(res,404,"Produk tidak ditemukan.");
      p.active=req.body.active!==false;
      p.updatedAt=now();
      await bin("PUT",db);
      return res.json({ok:true,product:p});
    }

    if(action==="update_customer"){
      const customerId=clean(req.body.id); const u=db.users.find(x=>x.id===customerId);
      if(!u)return fail(res,404,"Pelanggan tidak ditemukan.");
      if(req.body.status!==undefined){const st=clean(req.body.status);if(!["active","suspended"].includes(st))return fail(res,400,"Status akun tidak valid.");u.status=st;}
      if(req.body.saldo!==undefined){const n=Number(req.body.saldo);if(!Number.isFinite(n)||n<0)return fail(res,400,"Saldo tidak valid.");u.saldo=Math.floor(n);}
      if(req.body.password!==undefined){const p=String(req.body.password||"");if(p.length<6)return fail(res,400,"Password minimal 6 karakter.");u.passwordHash=await bcrypt.hash(p,12);delete u.resetTokenHash;delete u.resetTokenExpires;}
      await bin("PUT",db); return res.json({ok:true,customer:safeCustomer(u,db.users,db.transactions)});
    }

    if(action==="update_reset_request"){
      const r=db.resetRequests.find(x=>x.id===clean(req.body.id));
      if(!r)return fail(res,404,"Permintaan reset tidak ditemukan.");
      if(req.body.status && ["pending","handled","cancelled"].includes(clean(req.body.status)))r.status=clean(req.body.status);
      await bin("PUT",db);return res.json({ok:true});
    }

    if(action==="update_transaction"){
      const t=db.transactions.find(x=>x.id===clean(req.body.id));
      if(!t) return fail(res,404,"Transaksi tidak ditemukan.");
      if(req.body.status) t.status=clean(req.body.status);
      if(req.body.note!==undefined) t.adminNote=clean(req.body.note);
      t.updatedAt=now();
      await bin("PUT",db);
      return res.json({ok:true,transaction:t});
    }

    return fail(res,400,"Action admin tidak dikenal.");
  }catch(e){return fail(res,500,e.message)}
};