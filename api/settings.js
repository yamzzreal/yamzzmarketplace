const {bin}=require("./_lib");
module.exports=async(req,res)=>{
  try{
    const db=await bin();
    const s=db.settings||{};
    res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
    res.json({settings:{
      store_name:s.store_name||"Yamzz Market",
      tagline:s.tagline||"Marketplace digital terpercaya",
      logo_url:s.logo_url||"",
      favicon_url:s.favicon_url||"",
      maintenance:!!s.maintenance,
      maintenance_message:s.maintenance_message||"Website sedang dalam perbaikan. Silakan kembali beberapa saat lagi.",
      ticker_enabled:s.ticker_enabled!==false,
      ticker_messages:Array.isArray(s.ticker_messages)?s.ticker_messages:[],
      banners:Array.isArray(s.banners)?s.banners.filter(x=>x&&x.active!==false):[],
      support_whatsapp:s.support_whatsapp||"",
      support_email:s.support_email||"",social_media:s.social_media||{},
      footer_text:s.footer_text||"Yamzz Market"
    }});}
  catch(e){res.status(500).json({error:e.message})}
};