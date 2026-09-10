const crypto=require("crypto");const bcrypt=require("bcryptjs");
const JSONBIN_URL=()=>`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`;
async function bin(method="GET",body){const r=await fetch(JSONBIN_URL(),{method,headers:{"Content-Type":"application/json","X-Master-Key":process.env.JSONBIN_API_KEY},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.message||`JSONBin ${r.status}`);return d.record??d}
const sid=c=>`__Host-yamzz=${c}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
function adminToken(username){
  const body=Buffer.from(JSON.stringify({a:username,e:Date.now()+86400000})).toString("base64url");
  const sig=crypto.createHmac("sha256",process.env.SESSION_SECRET).update("admin."+body).digest("base64url");
  return body+"."+sig
}
function adminCookie(c){return `__Host-yamzz-admin=${c}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`}
function adminUser(req){
  const m=(req.headers.cookie||"").match(/(?:^|;\s*)__Host-yamzz-admin=([^;]+)/);
  if(!m)return null;
  try{
    const [b,s]=m[1].split(".");
    const x=crypto.createHmac("sha256",process.env.SESSION_SECRET).update("admin."+b).digest("base64url");
    if(!s||s.length!==x.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(x)))return null;
    const d=JSON.parse(Buffer.from(b,"base64url"));
    return d.e>Date.now()?d.a:null;
  }catch{return null}
}
function clearAdminCookie(){return "__Host-yamzz-admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"}
function token(userId){const body=Buffer.from(JSON.stringify({u:userId,e:Date.now()+604800000})).toString("base64url");const sig=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(body).digest("base64url");return body+"."+sig}
function userId(req){const m=(req.headers.cookie||"").match(/(?:^|;\s*)__Host-yamzz=([^;]+)/);if(!m)return null;try{const [b,s]=m[1].split(".");const x=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(b).digest("base64url");if(!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(x)))return null;const d=JSON.parse(Buffer.from(b,"base64url"));return d.e>Date.now()?d.u:null}catch{return null}}
function publicUser(u){return{id:u.id,username:u.username,email:u.email,saldo:u.saldo,createdAt:u.createdAt}}
function id(p){return `${p}_${crypto.randomUUID()}`}function now(){return new Date().toISOString()}
function keyMaterial(){return crypto.createHash("sha256").update(String(process.env.SESSION_SECRET||"")).digest()}
function encryptText(text){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv("aes-256-gcm",keyMaterial(),iv);const enc=Buffer.concat([c.update(String(text),"utf8"),c.final()]);return `${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`}
function decryptText(payload){const [ivB,tagB,dataB]=String(payload||"").split(".");if(!ivB||!tagB||!dataB)throw Error("Token terenkripsi tidak valid.");const d=crypto.createDecipheriv("aes-256-gcm",keyMaterial(),Buffer.from(ivB,"base64url"));d.setAuthTag(Buffer.from(tagB,"base64url"));return Buffer.concat([d.update(Buffer.from(dataB,"base64url")),d.final()]).toString("utf8")}
module.exports={bin,bcrypt,sid,token,userId,publicUser,id,now,adminToken,adminCookie,adminUser,clearAdminCookie,encryptText,decryptText};
