(async function(){
  const path=location.pathname.split("/").pop()||"index.html";
  if(path==="admin.html") return;
  try{
    const r=await fetch("/api/settings");
    if(!r.ok)return;
    const {settings:s}=await r.json();
    window.YAMZZ_SETTINGS=s;
    document.title=(s.store_name||"Yamzz Market")+(document.title.includes(" - ")?document.title.slice(document.title.indexOf(" - ")):"");
    if(s.favicon_url){
      let fav=document.querySelector('link[rel="icon"]')||document.createElement("link");
      fav.rel="icon";fav.href=s.favicon_url;document.head.appendChild(fav);
    }
    document.querySelectorAll(".brand").forEach(el=>{
      if(s.logo_url) el.innerHTML='<img src="'+esc(s.logo_url)+'" alt="'+esc(s.store_name)+'" class="site-logo">'+esc(s.store_name||"Yamzz Market");
      else el.innerHTML='<span class="brand-dot"></span> '+esc(s.store_name||"Yamzz Market");
    });
    if(path==="index.html"||path===""){
      const hero=document.querySelector(".hero");
      if(hero && s.tagline){const p=hero.querySelector("p");if(p)p.textContent=s.tagline}
      if(hero) renderHomeExtras(s);
    }
    if(s.maintenance) showMaintenance(s);
    if(s.footer_text){
      document.querySelectorAll("footer").forEach(f=>f.textContent=s.footer_text);
    }
  }catch(e){}
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function renderHomeExtras(s){
    const main=document.querySelector("main"); if(!main)return;
    const ticker=(s.ticker_messages||[]).filter(Boolean);
    if(s.ticker_enabled!==false && ticker.length){
      const el=document.createElement("div");el.className="yamzz-ticker";
      el.innerHTML='<div class="ticker-track">'+ticker.map(x=>'<span><b>✦</b> '+esc(x)+'</span>').join("")+'</div>';
      main.prepend(el);
    }
    const banners=(s.banners||[]).filter(x=>x&&x.image&&x.active!==false);
    if(banners.length){
      const sec=document.createElement("section");sec.className="yamzz-banners section";
      sec.innerHTML='<div class="yamzz-banner-wrap">'+banners.map(x=>'<a class="yamzz-banner" href="'+esc(x.link||"#")+'"><img src="'+esc(x.image)+'" alt="'+esc(x.title||"Banner Yamzz Market")+'"><div class="yamzz-banner-caption">'+esc(x.title||"")+'</div></a>').join("")+'</div>';
      const products=document.querySelector("#produk");
      if(products)main.insertBefore(sec,products); else main.appendChild(sec);
    }
  }
  function showMaintenance(s){
    if(document.getElementById("yamzz-maintenance"))return;
    document.body.classList.add("maintenance-active");
    document.querySelectorAll("#products .service a").forEach(a=>{a.setAttribute("aria-disabled","true");a.addEventListener("click",e=>e.preventDefault())});
    const ov=document.createElement("div");ov.id="yamzz-maintenance";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");
    ov.innerHTML='<div class="maintenance-card"><span class="material-symbols-rounded">construction</span><div class="badge">MAINTENANCE</div><h1>'+esc(s.store_name||"Yamzz Market")+' sedang dalam maintenance</h1><p>'+esc(s.maintenance_message||"Website sedang dalam perbaikan. Silakan kembali beberapa saat lagi.")+'</p><div class="maintenance-note"><span class="material-symbols-rounded">block</span><span>Untuk sementara, produk tidak dapat dibeli sampai maintenance selesai.</span></div><div class="maintenance-status"><span class="dot"></span> Sistem akan kembali normal setelah maintenance selesai.</div></div>';
    document.body.appendChild(ov);
  }
})();