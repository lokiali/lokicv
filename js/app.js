const $=s=>document.querySelector(s);

const ls=(k,v)=>{try{if(v===undefined){const r=localStorage.getItem(k);return r?JSON.parse(r):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
let lang=ls("fv_lang")||"ar",db,items=[],cur="",view="home",user=null,sess=null,ready=false;
const t=()=>L[lang];

/* ---------- support ---------- */
function openSupport(){
  if(!SUPPORT_URL)return toast(t().supNone),setTimeout(()=>toast(""),2500);
  window.open(SUPPORT_URL,"_blank","noopener");
}

/* ---------- supabase ---------- */
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const errMsg=e=>(e&&(e.message||e.error_description))||"error";
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
const logAct=(a,tg="")=>{if(sb)sb.rpc("log_action",{p_action:a,p_target:tg}).then(()=>{},()=>{})};
let toastEl=null;
function toast(m){if(!toastEl){toastEl=el("div","toast");document.body.append(toastEl)}toastEl.textContent=m;toastEl.hidden=!m}
const GIC='<svg viewBox="0 0 48 48" width="20" height="20" style="flex:none"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

/* ---------- auth ---------- */
function authShell(inner,again){
  const T=t();
  const bt=$("#boot");if(bt)bt.hidden=true;
  $("#app").hidden=true;$("#auth").hidden=false;
  $("#auth").innerHTML=`<div class="card"><div class="cob"><span class="pill"><img src="${LOGO}" alt=""></span><b class="cn">${T.co}</b></div><img class="lg" src="${MARK_S}" alt=""><h1>${T.t1} <b>${T.t2}</b></h1>${inner}<button class="lnk" id="a_lang">${T.lang}</button><p class="foot">By Eng.Ali nadhim waheed for Sadiq Nadhim</p></div>`;
  $("#a_lang").onclick=()=>{lang=lang==="ar"?"en":"ar";ls("fv_lang",lang);setLang();again()};
}
function showAuth(msg,mode="login"){
  const T=t(),su=mode==="signup";
  authShell(`<p class="mute">${su?T.signSub:T.gSub2}</p>`
    +(su?`<label class="fld">${ic("user")}<input id="a_name" placeholder="${T.fullname}" autocomplete="name"></label>`:"")
    +`<label class="fld">${ic("user")}<input id="a_email" type="email" placeholder="${T.email}" autocomplete="email" dir="ltr"></label>`
    +`<label class="fld">${ic("lock")}<input id="a_pass" type="password" placeholder="${T.pass}" autocomplete="${su?"new-password":"current-password"}" dir="ltr"><button type="button" class="eye" aria-label="${T.showPw}">${ic("eye")}</button></label>`
    +(su?`<label class="fld">${ic("lock")}<input id="a_pass2" type="password" placeholder="${T.confirm}" autocomplete="new-password" dir="ltr"><button type="button" class="eye" aria-label="${T.showPw}">${ic("eye")}</button></label>`:"")
    +`<p class="err" id="a_err" role="alert"></p><button class="btn pri" id="a_go" style="justify-content:center">${su?T.signup:T.login}</button><button class="lnk" id="a_sw">${su?T.haveAcc:T.newAcc}</button><button type="button" class="lnk" id="a_sup">${T.support}</button>`,()=>showAuth(msg,mode));
  document.querySelectorAll("#auth .eye").forEach(b=>{b.onclick=e=>{e.preventDefault();const i=b.parentElement.querySelector("input"),show=i.type==="password";i.type=show?"text":"password";b.innerHTML=ic(show?"eyeoff":"eye");i.focus()}});
  $("#a_sup").onclick=openSupport;
  const er=$("#a_err");if(msg)er.textContent=msg;
  if(!sb)er.textContent=T.noSb;
  $("#a_sw").onclick=()=>showAuth("",su?"login":"signup");
  const go=async()=>{
    if(!sb)return;er.textContent="";
    const em=$("#a_email").value.trim(),pw=$("#a_pass").value;
    const nm=su?$("#a_name").value.trim():"";
    if(!em||!pw||(su&&!nm))return er.textContent=T.fill;
    if(su){if(pw.length<6)return er.textContent=T.short;if(pw!==$("#a_pass2").value)return er.textContent=T.mism}
    const b=$("#a_go");b.disabled=true;
    let r;
    try{
      r=su?await sb.auth.signUp({email:em,password:pw,options:{data:{full_name:nm}}}):await sb.auth.signInWithPassword({email:em,password:pw});
    }catch(e){r={error:e}}
    b.disabled=false;
    if(r.error){
      const m=errMsg(r.error);
      if(/invalid login/i.test(m))return er.textContent=T.bad;
      if(/already registered|already been registered/i.test(m))return er.textContent=T.exists;
      if(/email not confirmed/i.test(m))return er.textContent=T.confirmEm;
      return er.textContent=m;
    }
    if(su&&!r.data.session){
      if(r.data.user&&r.data.user.identities&&!r.data.user.identities.length)return er.textContent=T.exists;
      return er.textContent=T.confirmEm;
    }
    admSet(true);
    await start();
  };
  $("#a_go").onclick=go;
  $("#auth").onkeydown=e=>{if(e.key==="Enter")go()};
  (su?$("#a_name"):$("#a_email")).focus();
}
const admOk=()=>{try{return sessionStorage.getItem("fv_adm")==="1"}catch(e){return false}};
const admSet=v=>{try{if(v)sessionStorage.setItem("fv_adm","1");else sessionStorage.removeItem("fv_adm")}catch(e){}};
function showAdminConfirm(){
  const T=t();
  authShell(`<p class="mute">${T.admSub}</p><div class="who"><span class="avs"></span><div><b></b><small></small></div></div><label class="fld">${ic("lock")}<input id="a_code" type="password" placeholder="${T.admCode}" autocomplete="off" dir="ltr"><button type="button" class="eye" aria-label="${T.showPw}">${ic("eye")}</button></label><p class="err" id="a_err" role="alert"></p><button class="btn pri" id="a_go" style="justify-content:center">${T.confirmB}</button><button class="lnk" id="a_out">${T.switchAcc}</button>`,showAdminConfirm);
  paint($(".who .avs"),user.photo,user.name);$(".who b").textContent=user.name;$(".who small").textContent=user.email;
  const eb=$("#auth .eye");eb.onclick=e=>{e.preventDefault();const i=$("#a_code"),show=i.type==="password";i.type=show?"text":"password";eb.innerHTML=ic(show?"eyeoff":"eye");i.focus()};
  const go=async()=>{
    const er=$("#a_err"),v=$("#a_code").value.trim();er.textContent="";
    if(!v)return er.textContent=T.fill;
    const b=$("#a_go");b.disabled=true;
    const {data,error}=await sb.rpc("confirm_admin",{p_code:v});
    b.disabled=false;
    if(error)return er.textContent=errMsg(error);
    if(!data||!data.ok)return er.textContent=T["e_"+(data&&data.error==="invalid"?"bad_admin":data&&data.error)]||T.e_bad_admin;
    admSet(true);enter();
  };
  $("#a_go").onclick=go;
  $("#auth").onkeydown=e=>{if(e.key==="Enter")go()};
  $("#a_out").onclick=()=>logout();
  $("#a_code").focus();
}
function showCode(){
  const T=t();
  authShell(`<p class="mute">${T.codeSub}</p><div class="who"><span class="avs"></span><div><b></b><small></small></div></div><label class="fld">${ic("lock")}<input id="a_code" placeholder="${T.code}" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr"></label><p class="err" id="a_err" role="alert"></p><button class="btn pri" id="a_go" style="justify-content:center">${T.enter}</button><button class="lnk" id="a_out">${T.switchAcc}</button>`,showCode);
  paint($(".who .avs"),user.photo,user.name);$(".who b").textContent=user.name;$(".who small").textContent=user.email;
  const go=async()=>{
    const er=$("#a_err"),v=$("#a_code").value.trim();er.textContent="";
    if(!v)return er.textContent=T.fill;
    const b=$("#a_go");b.disabled=true;
    const {data,error}=await sb.rpc("redeem_code",{p_code:v});
    b.disabled=false;
    if(error)return er.textContent=errMsg(error);
    if(!data||!data.ok)return er.textContent=T["e_"+(data&&data.error)]||T.e_invalid;
    admSet(true);
    await start();
  };
  $("#a_go").onclick=go;
  $("#auth").onkeydown=e=>{if(e.key==="Enter")go()};
  $("#a_out").onclick=()=>logout();
  $("#a_code").focus();
}
async function start(){
  if(!sb)return showAuth();
  const {data:{session}}=await sb.auth.getSession();sess=session;
  if(!session){user=null;return showAuth()}
  const {data:p,error}=await sb.from("profiles").select("*").eq("id",session.user.id).maybeSingle();
  if(error)return showAuth(errMsg(error));
  const m=session.user.user_metadata||{};
  if(p&&p.banned){await sb.auth.signOut();user=null;return showAuth(t().e_banned)}
  user={id:session.user.id,name:(p&&p.name)||m.full_name||m.name||session.user.email,email:session.user.email,photo:(p&&p.avatar)||null,role:p?p.role:"user",active:!!(p&&p.activated)};
  if(!user.active)return showCode();
  if(user.role==="admin"&&!admOk())return showAdminConfirm();
  enter();
}

/* ---------- storage (Supabase: shared) ---------- */
const rowToItem=r=>({id:r.id,kind:r.kind,name:r.name,parent:r.parent||"",size:Number(r.size)||0,added:Number(r.added)||0,cat:r.cat,mime:r.mime||"",trashed:!!r.trashed,by:r.added_by_name||""});
async function load(){
  let all=[],from=0;
  for(;;){
    const {data,error}=await sb.from("items").select("*").order("added",{ascending:false}).order("id").range(from,from+999);
    if(error)throw error;all=all.concat(data);if(data.length<1000)break;from+=1000;
  }
  items=all.map(rowToItem);render();
}
let ch=null,tmr=null;
function subscribe(){
  if(ch||!sb)return;
  ch=sb.channel("items-live").on("postgres_changes",{event:"*",schema:"public",table:"items"},()=>{clearTimeout(tmr);tmr=setTimeout(()=>load().catch(()=>{}),500)}).subscribe();
}
const chunk=(a,n=80)=>{const r=[];for(let i=0;i<a.length;i+=n)r.push(a.slice(i,i+n));return r};
async function upd(ids,patch){for(const c of chunk(ids)){const {error}=await sb.from("items").update(patch).in("id",c);if(error)throw error}}
const kids=id=>{const r=[],w=p=>items.filter(i=>i.parent===p).forEach(i=>{r.push(i);w(i.id)});w(id);return r};
const byId=id=>items.find(i=>i.id===id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const catOf=n=>{const e=extOf(n).toLowerCase();return /^(jpe?g|png|gif|webp|svg|heic|bmp)$/.test(e)?"img":/^(zip|rar|7z|tar|gz)$/.test(e)?"arc":/^(pdf|docx?|txt|md|pptx?|xlsx?|csv|odt|rtf)$/.test(e)?"doc":"oth"};
const extOf=n=>{const i=n.lastIndexOf(".");return i>0&&i<n.length-1?n.slice(i+1):""};
function dlg(msg,o={}){
  return new Promise(res=>{
    const ov=el("div","cfo"),bx=el("div","cfb"),r=el("div","cfr"),cb=o.cancel?el("button","btn",o.cancel):null;
    const kd=e=>{if(e.key==="Escape")done(false)};
    const done=v=>{document.removeEventListener("keydown",kd);ov.remove();res(v)};
    if(cb){cb.onclick=()=>done(false);r.append(cb)}
    const ob=el("button","btn "+(o.danger?"dng":"pri"),o.ok);ob.onclick=()=>done(true);r.append(ob);
    bx.append(el("p",null,msg),r);ov.append(bx);ov.onclick=e=>{if(e.target===ov)done(false)};
    document.addEventListener("keydown",kd);document.body.append(ov);(o.danger&&cb?cb:ob).focus();
  });
}
const askConfirm=(m,danger=true)=>dlg(m,{ok:t().yesB,cancel:t().cancel,danger});
const notify=m=>dlg(m,{ok:t().okB});
const fail=e=>notify(t().errS+"\n("+errMsg(e)+")");
function setTheme(m){
  const L=m==="light";
  if(L)document.documentElement.dataset.theme="light";else document.documentElement.removeAttribute("data-theme");
  ls("fv_theme",L?"light":"dark");
  const mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.content=L?"#F3F6FB":"#0F172A";
}
const isLight=()=>document.documentElement.dataset.theme==="light";
function skel(){
  const ul=$("#list");ul.textContent="";
  for(let i=0;i<7;i++){const li=el("li","sk");li.innerHTML='<div class="skb"></div><div class="skt"><i></i><i></i></div>';ul.append(li)}
}

function xhrUpload(id,blob,onp){
  return sb.auth.getSession().then(({data:{session}})=>{
    if(!session)throw new Error(t().e_auth);
    return new Promise((res,rej)=>{
      const x=new XMLHttpRequest(),fd=new FormData();
      fd.append("cacheControl","3600");fd.append("",blob);
      x.open("POST",SB_URL+"/storage/v1/object/"+BUCKET+"/"+encodeURIComponent(id));
      x.setRequestHeader("apikey",SB_KEY);x.setRequestHeader("Authorization","Bearer "+session.access_token);
      x.upload.onprogress=e=>{if(e.lengthComputable)onp(e.loaded/e.total)};
      x.onload=()=>{
        if(x.status>=200&&x.status<300){onp(1);res()}
        else{let m="HTTP "+x.status;try{m=JSON.parse(x.responseText).message||m}catch(e){}rej(new Error(m))}
      };
      x.onerror=()=>rej(new Error("network error"));
      x.send(fd);
    });
  });
}
async function putFile(blob,name,mime,onp){
  const id=uid(),ct=mime||"application/octet-stream";
  if(onp)await xhrUpload(id,blob,onp);
  else{const {error:e1}=await sb.storage.from(BUCKET).upload(id,blob,{contentType:ct});if(e1)throw e1}
  const {error:e2}=await sb.from("items").insert({id,kind:"file",name,parent:cur,size:blob.size,added:Date.now(),cat:catOf(name),mime:mime||"",trashed:false});
  if(e2){await sb.storage.from(BUCKET).remove([id]);throw e2}
}
let upEl=null;
function showProg(name,i,n,p){
  if(!upEl){
    upEl=el("div","upg");
    upEl.innerHTML='<div class="r"><b></b><span></span></div><div class="stb"><i></i></div>';
    document.body.append(upEl);
  }
  const pc=Math.round(p*100);
  upEl.querySelector("b").textContent=name;
  upEl.querySelector("span").textContent=(n>1?i+"/"+n+" • ":"")+pc+"%";
  upEl.querySelector("i").style.width=pc+"%";
}
function hideProg(){if(upEl){upEl.remove();upEl=null}}
async function addFiles(list){
  for(const f of list){
    try{const k=list.indexOf(f)+1;showProg(f.name,k,list.length,0);await putFile(f,f.name,f.type,p=>showProg(f.name,k,list.length,p))}
    catch(e){hideProg();fail(e);break}
  }
  hideProg();await load().catch(()=>{});
}
async function addFolder(name){
  const {error}=await sb.from("items").insert({id:uid(),kind:"folder",name,parent:cur,added:Date.now(),trashed:false,size:0});
  if(error)return fail(error);
  load().catch(()=>{});
}
async function setTrash(it,v){
  try{
    const all=[it,...kids(it.id)];
    await upd(all.map(i=>i.id),{trashed:v});
    if(!v&&it.parent&&!byId(it.parent))await upd([it.id],{parent:""});
  }catch(e){fail(e)}
  load().catch(()=>{});
}
async function purge(it){
  if(!await askConfirm(t().conf(it.name)))return;
  try{
    const all=[it,...kids(it.id)],files=all.filter(i=>i.kind==="file").map(i=>i.id);
    for(const c of chunk(files)){const {error}=await sb.storage.from(BUCKET).remove(c);if(error)throw error}
    for(const c of chunk(all.map(i=>i.id))){const {error}=await sb.from("items").delete().in("id",c);if(error)throw error}
  }catch(e){fail(e)}
  load().catch(()=>{});
}
async function getBlob(it,onp){
  if(!onp){const {data,error}=await sb.storage.from(BUCKET).download(it.id);if(error)throw error;return data}
  const {data:{session}}=await sb.auth.getSession();
  if(!session)throw new Error(t().e_auth);
  return new Promise((res,rej)=>{
    const x=new XMLHttpRequest();
    x.open("GET",SB_URL+"/storage/v1/object/authenticated/"+BUCKET+"/"+encodeURIComponent(it.id));
    x.responseType="blob";
    x.setRequestHeader("apikey",SB_KEY);x.setRequestHeader("Authorization","Bearer "+session.access_token);
    x.onprogress=e=>{const tot=e.lengthComputable?e.total:it.size;if(tot)onp(Math.min(1,e.loaded/tot))};
    x.onload=()=>{if(x.status>=200&&x.status<300){onp(1);res(x.response)}else rej(new Error("HTTP "+x.status))};
    x.onerror=()=>rej(new Error("network error"));
    x.send();
  });
}
/* ---------- selection ---------- */
let selMode=false,sel=new Set(),selKey="",lpAt=0;
function updSel(){
  const T=t(),bar=$("#sbar"),on=selMode&&view!=="storage";
  document.body.classList.toggle("selmode",on);
  $("#bSel").innerHTML=ic("check")+(selMode?T.cancel:T.selectB);
  bar.hidden=!on;if(!on)return;
  bar.textContent="";
  bar.append(el("b",null,T.selN(sel.size)));
  const add=(label,fn,cls,always)=>{const b=el("button","btn"+(cls||""),label);b.disabled=!always&&!sel.size;b.onclick=fn;bar.append(b)};
  add(T.selAll,selectAll,"",true);
  if(view==="trash"){add(T.rest,()=>bulkTrash(false));add(T.delf,bulkPurge," dng")}
  else{add(T.move,bulkMove);add(T.del,()=>bulkTrash(true)," dng")}
}
function toggleSel(id){if(sel.has(id))sel.delete(id);else sel.add(id);render()}
function selectAll(){const a=list();if(a.every(i=>sel.has(i.id)))sel.clear();else a.forEach(i=>sel.add(i.id));render()}
const picked=()=>[...sel].map(byId).filter(Boolean);
const withKids=arr=>{const m=new Map();arr.forEach(it=>{m.set(it.id,it);kids(it.id).forEach(k=>m.set(k.id,k))});return [...m.values()]};
async function bulkTrash(v){
  const p=picked();if(!p.length)return;
  try{
    await upd(withKids(p).map(i=>i.id),{trashed:v});
    if(!v){const orphan=p.filter(i=>i.parent&&!byId(i.parent)).map(i=>i.id);if(orphan.length)await upd(orphan,{parent:""})}
  }catch(e){fail(e)}
  sel.clear();load().catch(()=>{});
}
async function bulkPurge(){
  const p=picked();if(!p.length)return;
  if(!await askConfirm(t().confBulk(p.length)))return;
  try{
    const all=withKids(p),files=all.filter(i=>i.kind==="file").map(i=>i.id);
    for(const c of chunk(files)){const {error}=await sb.storage.from(BUCKET).remove(c);if(error)throw error}
    for(const c of chunk(all.map(i=>i.id))){const {error}=await sb.from("items").delete().in("id",c);if(error)throw error}
  }catch(e){fail(e)}
  sel.clear();load().catch(()=>{});
}
function bulkMove(){
  const T=t(),p=picked();if(!p.length)return;
  const bad=new Set(withKids(p).map(i=>i.id));
  const path=f=>{const n=[];let c=f;while(c){n.unshift(c.name);c=c.parent?byId(c.parent):null}return n.join(" / ")};
  const opts=[["",T.my]].concat(items.filter(i=>i.kind==="folder"&&!i.trashed&&!bad.has(i.id)).map(f=>[f.id,path(f)]).sort((a,b)=>a[1].localeCompare(b[1],lang)));
  modal(T.moveTo,[{k:"d",label:T.dest,type:"select",opts,val:""}],T.move,async v=>{
    try{
      await upd(p.map(i=>i.id),{parent:v.d});
      logAct("edit",p.map(i=>i.name).join(" | ")+" → "+(v.d?path(byId(v.d)):T.my));
    }catch(e){fail(e);return false}
    sel.clear();load().catch(()=>{});
  });
}

/* ---------- ui helpers ---------- */
function closeMenu(){const m=$("#menu");if(m)m.remove()}
document.addEventListener("click",e=>{if(!e.target.closest("#menu"))closeMenu()});
addEventListener("scroll",closeMenu,true);
function menu(btn,acts){
  closeMenu();
  const m=document.createElement("div");m.className="menu";m.id="menu";
  for(const [label,fn,danger] of acts){const b=document.createElement("button");b.textContent=label;if(danger)b.className="dng";b.onclick=()=>{closeMenu();fn()};m.append(b)}
  document.body.append(m);
  const r=btn.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;
  m.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-h-8))+"px";
  m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px";
}
function modal(title,fields,okLabel,cb){
  const T=t(),o=document.createElement("div");o.className="ov";
  o.innerHTML=`<div class="md" role="dialog" aria-modal="true"><div class="mh"><h3></h3><button class="x" aria-label="${T.cancel}">${ic("x")}</button></div><div class="mb" style="display:flex;flex-direction:column;gap:12px"></div><div class="mf2"><button class="btn c">${T.cancel}</button><button class="btn pri s">${okLabel}</button></div></div>`;
  o.querySelector("h3").textContent=title;
  const els={};
  for(const f of fields){
    const l=document.createElement(f.type==="checks"?"div":"label"),s=document.createElement("span");l.className="mf";s.textContent=f.label;let e;
    if(f.type==="select"){e=document.createElement("select");for(const [v,n] of f.opts){const op=document.createElement("option");op.value=v;op.textContent=n;e.append(op)}}
    else if(f.type==="area"){e=document.createElement("textarea");e.rows=5}
    else if(f.type==="checks"){e=document.createElement("div");e.className="chk";for(const [v,n] of f.opts){const lb=document.createElement("label"),cb=document.createElement("input"),sp=document.createElement("span");cb.type="checkbox";cb.value=v;sp.textContent=n;lb.append(cb,sp);e.append(lb)}}
    else e=document.createElement("input");
    if(f.ph)e.placeholder=f.ph;e.value=f.val||"";els[f.k]=e;l.append(s,e);o.querySelector(".mb").append(l);
  }
  const kd=e=>{if(e.key==="Escape")close()},close=()=>{o.remove();document.removeEventListener("keydown",kd)};
  const ok=async()=>{const v={};for(const k in els)v[k]=els[k].classList.contains("chk")?[...els[k].querySelectorAll("input:checked")].map(x=>x.value):els[k].value.trim();if(await cb(v)!==false)close()};
  o.querySelector(".x").onclick=o.querySelector(".c").onclick=close;
  o.querySelector(".s").onclick=ok;
  o.onclick=e=>{if(e.target===o)close()};
  o.onkeydown=e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT")ok()};
  document.addEventListener("keydown",kd);
  document.body.append(o);
  const first=o.querySelector("input,textarea");if(first)first.focus();
}
const catOpts=()=>["doc","img","arc","oth"].map(k=>[k,t()[k]]);
function newFolder(){const T=t();modal(T.nf,[{k:"n",label:T.fname,ph:T.ent}],T.create,v=>{if(!v.n)return false;addFolder(v.n)})}
function newNote(){
  const T=t();
  modal(T.an,[{k:"n",label:T.nTitle},{k:"x",label:T.nText,type:"area"}],T.create,async v=>{
    if(!v.n)return false;
    const name=extOf(v.n)?v.n:v.n+".txt",b=new Blob([v.x],{type:"text/plain"});
    try{await putFile(b,name,"text/plain");await load()}catch(e){fail(e)}
  });
}
function editItem(it){
  const T=t(),fl=[{k:"n",label:it.kind==="folder"?T.fname:T.fileName,val:it.name}];
  if(it.kind==="file")fl.push({k:"c",label:T.cat,type:"select",opts:catOpts(),val:it.cat});
  modal(T.editF,fl,T.save,async v=>{if(!v.n)return false;try{const patch={name:v.n};if(it.kind==="file")patch.cat=v.c||it.cat;await upd([it.id],patch);logAct("edit",it.name+" → "+v.n)}catch(e){fail(e);return false}load().catch(()=>{})});
}
function saveBlob(b,name){const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
async function download(f){try{showProg(f.name,1,1,0);const b=await getBlob(f,p=>showProg(f.name,1,1,p));hideProg();saveBlob(b,f.name);logAct("download",f.name)}catch(e){hideProg();fail(e)}}
async function openIt(it){
  if(it.kind==="folder"){cur=it.id;view="home";$("#q").value="";return render()}
  const ty=it.mime||"";
  if(!(/^(image|text)\//.test(ty)||ty==="application/pdf"))return download(it);
  openPreview(it);
}

/* ---------- in-site preview ---------- */
let PV=null,pdfjsP=null;
const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
function loadPdfjs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  return pdfjsP||(pdfjsP=new Promise((res,rej)=>{
    const sc=document.createElement("script");sc.src=PDFJS+"pdf.min.js";
    sc.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+"pdf.worker.min.js";res(window.pdfjsLib)};
    sc.onerror=()=>{pdfjsP=null;rej(new Error("pdf.js"))};
    document.head.append(sc);
  }));
}
function closePreview(){
  if(!PV)return;
  const p=PV;PV=null;
  document.removeEventListener("keydown",p.key);
  if(p.obs)p.obs.disconnect();
  if(p.pdf)try{p.pdf.destroy()}catch(e){}
  if(p.url)URL.revokeObjectURL(p.url);
  p.ov.remove();
}
async function openPreview(it){
  const T=t(),ty=it.mime||"",isPdf=ty==="application/pdf",isImg=/^image\//.test(ty);
  closePreview();
  const ov=el("div","pv");
  ov.innerHTML='<div class="pvh"><b></b><span class="pz"></span></div><div class="pvb"><div class="pld"><div class="mt"></div><div class="stb"><i></i></div><div class="mt pc">0%</div></div></div>';
  const head=ov.querySelector(".pvh"),body=ov.querySelector(".pvb"),pz=ov.querySelector(".pz");
  head.querySelector("b").textContent=it.name;
  ov.querySelector(".pld .mt").textContent=T.loadingF;
  const mk=(html,fn,label)=>{const b=el("button","btn");b.innerHTML=html;if(label)b.title=label;b.onclick=fn;head.append(b);return b};
  mk(ic("print"),()=>printFiles([it]),T.print);
  mk(T.dl,()=>download(it));
  mk(ic("x"),closePreview,"close");
  const key=e=>{if(e.key==="Escape")closePreview()};
  document.addEventListener("keydown",key);
  PV={ov,key};document.body.append(ov);
  const mine=()=>PV&&PV.ov===ov;
  let blob;
  try{
    blob=await getBlob(it,p=>{if(!mine())return;const v=Math.round(p*100);ov.querySelector(".pld i").style.width=v+"%";ov.querySelector(".pc").textContent=v+"%"});
  }catch(e){if(mine())closePreview();return fail(e)}
  if(!mine())return;
  body.textContent="";
  if(isImg){
    const u=URL.createObjectURL(new Blob([blob],{type:ty}));PV.url=u;
    const im=document.createElement("img");im.alt=it.name;im.src=u;body.append(im);return;
  }
  if(!isPdf){
    const pre=document.createElement("pre");
    try{pre.textContent=await blob.text()}catch(e){pre.textContent=""}
    if(mine())body.append(pre);return;
  }
  try{
    const lib=await loadPdfjs();
    const pdf=await lib.getDocument({data:await blob.arrayBuffer()}).promise;
    if(!mine()){pdf.destroy();return}
    PV.pdf=pdf;
    let zoom=1,token=0;
    const build=async()=>{
      const my=++token;
      if(PV.obs)PV.obs.disconnect();
      body.textContent="";
      const base=Math.min(body.clientWidth-28,900)*zoom,dpr=Math.min(window.devicePixelRatio||1,2);
      const obs=new IntersectionObserver(es=>es.forEach(en=>{
        if(!en.isIntersecting)return;
        const d=en.target;obs.unobserve(d);
        pdf.getPage(+d.dataset.n).then(pg=>{
          if(my!==token)return;
          const v0=pg.getViewport({scale:1}),sc=base/v0.width,v=pg.getViewport({scale:sc*dpr});
          const c=document.createElement("canvas");c.width=v.width;c.height=v.height;
          d.append(c);
          return pg.render({canvasContext:c.getContext("2d"),viewport:v}).promise;
        }).catch(()=>{});
      }),{root:body,rootMargin:"700px 0px"});
      PV.obs=obs;
      for(let n=1;n<=pdf.numPages;n++){
        const pg=await pdf.getPage(n);if(my!==token||!mine())return;
        const v=pg.getViewport({scale:base/pg.getViewport({scale:1}).width});
        const d=document.createElement("div");d.className="pg";d.dataset.n=n;d.style.width=v.width+"px";d.style.height=v.height+"px";
        body.append(d);obs.observe(d);
      }
    };
    const zb=(txt,f)=>{const b=el("button","btn",txt);b.onclick=()=>{zoom=Math.max(.5,Math.min(3,zoom*f));build()};pz.append(b)};
    zb("−",1/1.25);zb("+",1.25);
    await build();
  }catch(e){
    if(!mine())return;
    const u=URL.createObjectURL(new Blob([blob],{type:"application/pdf"}));PV.url=u;
    pz.textContent="";body.textContent="";
    const f=document.createElement("iframe");f.src=u;body.style.padding="0";body.append(f);
  }
}

/* ---------- profile (from Google) ---------- */
const initial=()=>user&&user.name?user.name.trim().charAt(0).toUpperCase():"?";
function paint(el,photo=user&&user.photo,name=user&&user.name){
  el.textContent="";
  if(photo){const im=document.createElement("img");im.alt="";im.referrerPolicy="no-referrer";im.src=photo;im.onerror=()=>{el.textContent=(name||"").trim().charAt(0).toUpperCase()||"?"};el.append(im)}
  else el.textContent=(name||"").trim().charAt(0).toUpperCase()||"?";
}
function updateAv(){paint($("#av"))}
function toAvatar(file){
  return new Promise((res,rej)=>{
    const u=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{
      const S=256,c=document.createElement("canvas");c.width=c.height=S;
      const m=Math.min(im.width,im.height),sx=(im.width-m)/2,sy=(im.height-m)/2;
      c.getContext("2d").drawImage(im,sx,sy,m,m,0,0,S,S);
      URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",.85));
    };
    im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("img"))};
    im.src=u;
  });
}
function openProfile(){
  const T=t(),o=document.createElement("div");o.className="dov";
  o.innerHTML=`<aside class="dp" role="dialog" aria-modal="true"><div class="mh"><h3>${T.prof}</h3><button class="x" aria-label="${T.close}">${ic("x")}</button></div><div class="pfw" role="button" tabindex="0"><div class="pfav"></div><span class="pfbd">${ic("edit")}</span><input type="file" class="pf" accept="image/*" hidden></div><label class="pff"><span>${T.fullname}</span><input class="nm" readonly></label><label class="pff"><span>${T.email}</span><input class="em" readonly dir="ltr"></label><p class="mute" style="text-align:center"></p><div class="pfb"><button class="btn pri ad" hidden></button><button class="btn lg2"></button><button class="btn sup thm"></button><button class="btn sup su2"></button><button class="btn lo"></button></div></aside>`;
  const q=c=>o.querySelector(c);
  paint(q(".pfav"));q(".nm").value=user.name;q(".em").value=user.email;
  q(".mute").textContent=user.role==="admin"?T.role_admin:T.role_user;
  const kd=e=>{if(e.key==="Escape")close()},close=()=>{o.remove();document.removeEventListener("keydown",kd)};
  q(".x").onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const pf=q(".pf"),pw=q(".pfw");
  const saveAv=async v=>{
    const {error}=await sb.rpc("set_avatar",{p_avatar:v});
    if(error){notify(T.photoErr+"\n("+errMsg(error)+")");return}
    user.photo=v;paint(q(".pfav"));updateAv();
  };
  pf.onchange=async()=>{
    const f=pf.files[0];pf.value="";if(!f)return;
    try{await saveAv(await toAvatar(f))}catch(e){notify(T.photoErr)}
  };
  const pick=()=>{if(!user.photo)return pf.click();menu(pw,[[T.photoChange,()=>pf.click()],[T.photoRemove,()=>saveAv(null),1]])};
  pw.onclick=e=>{e.stopPropagation();pick()};
  pw.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick()}};
  if(user.role==="admin"){const ad=q(".ad");ad.hidden=false;ad.innerHTML=ic("user")+T.admin;ad.onclick=()=>{close();openAdmin()}}
  q(".lg2").innerHTML=ic("globe")+T.lang;
  q(".lg2").onclick=()=>{lang=lang==="ar"?"en":"ar";ls("fv_lang",lang);setLang();close();openProfile()};
  q(".su2").innerHTML=ic("user")+T.support;q(".su2").onclick=openSupport;
  const tb=q(".thm"),pt=()=>{tb.innerHTML=ic(isLight()?"moon":"sun")+(isLight()?T.themeDark:T.themeLight)};
  tb.onclick=()=>{setTheme(isLight()?"dark":"light");pt()};pt();
  q(".lo").innerHTML=ic("out")+T.out;
  q(".lo").onclick=()=>{close();logout()};
  document.addEventListener("keydown",kd);
  document.body.append(o);
}

/* ---------- admin panel ---------- */
const fmtDT=d=>d?new Date(d).toLocaleString("en-GB",{hour12:false}):"—";
const fmtCode=c=>c&&c.length===8?c.slice(0,4)+"-"+c.slice(4):c;
function tbl(head,rows,onRow){
  const w=el("div","tw"),tb=el("table"),hd=el("thead"),hr=el("tr");
  head.forEach(h=>hr.append(el("th",null,h)));hd.append(hr);tb.append(hd);
  const bd=el("tbody");
  rows.forEach(r=>{const tr=el("tr");r.cells.forEach(c=>{const td=el("td");if(c instanceof Node)td.append(c);else td.textContent=c==null?"":String(c);tr.append(td)});if(onRow){tr.className="clk";tr.onclick=()=>onRow(r)}bd.append(tr)});
  tb.append(bd);w.append(tb);return w;
}
function openAdmin(tab="users",logUser=""){
  const T=t(),o=document.createElement("div");o.className="ov";
  o.innerHTML=`<div class="md adm" role="dialog" aria-modal="true"><div class="mh"><h3>${T.admin}</h3><button class="x" aria-label="${T.close}">${ic("x")}</button></div><div class="tabs"></div><div class="ab"></div></div>`;
  const kd=e=>{if(e.key==="Escape")close()},close=()=>{o.remove();document.removeEventListener("keydown",kd)};
  o.querySelector(".x").onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const tabs=o.querySelector(".tabs"),body=o.querySelector(".ab");
  let stats=[];
  const go=async(k,lu="")=>{
    tabs.textContent="";
    [["users",T.tUsers],["codes",T.tCodes],["log",T.tLog]].forEach(([v,n])=>{const b=el("button","tb"+(v===k?" on":""),n);b.onclick=()=>go(v);tabs.append(b)});
    body.textContent="";body.append(el("p","mute",T.loading));
    try{
      const {data,error}=await sb.rpc("admin_stats");if(error)throw error;stats=data||[];
      body.textContent="";
      if(k==="users")usersTab();else if(k==="codes")await codesTab();else await logTab(lu);
    }catch(e){body.textContent="";body.append(el("p","err",errMsg(e)))}
  };
  const usersTab=()=>{
    const act=stats.filter(s=>s.activated);
    body.append(el("p","mute",`${T.usersN}: ${act.length}`));
    const doIt=async(fn,args)=>{const {error}=await sb.rpc(fn,args);if(error)notify(errMsg(error));go("users")};
    body.append(tbl([T.colName,T.colEmail,T.colRole,T.colLogins,T.colAdd,T.colDel,T.colPrint,T.colLast,T.colAct2],
      stats.map(s=>{
        let roleC;
        if(s.banned){roleC=el("span","tag",T.banned)}else roleC=s.activated?(s.role==="admin"?T.role_admin:T.role_user):T.pending;
        let act2="";
        if(s.user_id!==user.id){
          act2=el("div","rbtn");
          const bb=el("button",null,s.banned?T.unban:T.ban);
          bb.onclick=async e=>{e.stopPropagation();if(await askConfirm((s.banned?T.unbanQ:T.banQ)(s.name||s.email),!s.banned))doIt("admin_set_ban",{p_user:s.user_id,p_ban:!s.banned})};
          const db=el("button","dg",T.delUser);
          db.onclick=async e=>{e.stopPropagation();if(await askConfirm(T.delUserQ(s.name||s.email)))doIt("admin_delete_user",{p_user:s.user_id})};
          act2.append(bb,db);
        }
        return {id:s.user_id,cells:[s.name,s.email,roleC,s.logins,s.adds,s.deletes,s.prints,fmtDT(s.last_login),act2]};
      }),
      r=>go("log",r.id)));
    body.append(el("p","mute sm",T.clickRow));
  };
  const codesTab=async()=>{
    const bar=el("div","cbar"),inp=el("input");inp.placeholder=T.codeLabel;inp.className="cin";
    const nb=el("button","btn pri",T.newCode);bar.append(inp,nb);body.append(bar);
    const res=el("div","newc");res.hidden=true;body.append(res);
    const lst=el("div");body.append(lst);
    const draw=async()=>{
      const {data,error}=await sb.from("access_codes").select("*").order("created_at",{ascending:false});
      if(error){lst.textContent=errMsg(error);return}
      const nm=id=>{const s=stats.find(x=>x.user_id===id);return s?`${s.name} (${s.email})`:"—"};
      lst.textContent="";
      const free=data.filter(c=>!c.used_at).length;
      lst.append(el("p","mute",`${T.unused}: ${free} • ${T.used}: ${data.length-free}`));
      lst.append(tbl([T.code,T.codeLabel,T.status,T.usedBy,T.usedAt,T.createdAt,""],data.map(c=>{
        let del="";if(!c.used_at){del=el("button","mini",T.delCode);del.onclick=async()=>{if(!await askConfirm(T.delCodeQ))return;const {error:e}=await sb.from("access_codes").delete().eq("id",c.id);if(e)notify(errMsg(e));draw()}}
        return{cells:[fmtCode(c.code),c.label||"",c.used_at?T.used:T.unused,c.used_at?(c.used_name?`${c.used_name} (${c.used_email||""})`:nm(c.used_by)):"—",fmtDT(c.used_at),fmtDT(c.created_at),del]};
      })));
    };
    nb.onclick=async()=>{
      nb.disabled=true;
      const {data,error}=await sb.rpc("create_code",{p_label:inp.value});
      nb.disabled=false;
      if(error)return notify(errMsg(error));
      inp.value="";res.hidden=false;res.textContent="";
      const cd=el("b","big",fmtCode(data)),cp=el("button","btn",T.copy);
      cp.onclick=async()=>{try{await navigator.clipboard.writeText(fmtCode(data));cp.textContent=T.copied}catch(e){}};
      res.append(el("span","mute",T.newCodeIs+" "),cd,cp);
      draw();
    };
    await draw();
  };
  const logTab=async(lu)=>{
    const bar=el("div","cbar"),us=el("select"),ac=el("select");
    us.append(new Option(T.allUsers,""));stats.forEach(s=>us.append(new Option(`${s.name} (${s.email})`,s.user_id)));us.value=lu||"";
    ac.append(new Option(T.allActs,""));["login","logout","add","delete","purge","restore","edit","print","download","redeem","ban","unban","user_delete"].forEach(a=>ac.append(new Option(T["a_"+a],a)));
    bar.append(us,ac);body.append(bar);
    const out=el("div");body.append(out);
    const draw=async()=>{
      out.textContent="";out.append(el("p","mute",T.loading));
      let q=sb.from("activity_log").select("*").order("ts",{ascending:false}).limit(300);
      if(us.value)q=q.eq("user_id",us.value);if(ac.value)q=q.eq("action",ac.value);
      const {data,error}=await q;out.textContent="";
      if(error)return out.append(el("p","err",errMsg(error)));
      if(!data.length)return out.append(el("p","mute",T.noData));
      out.append(tbl([T.colTime,T.colName,T.colAct,T.colTarget],data.map(r=>({cells:[fmtDT(r.ts),`${r.name||""} (${r.email||""})`,T["a_"+r.action]||r.action,r.target||""]}))));
    };
    us.onchange=ac.onchange=draw;await draw();
  };
  document.addEventListener("keydown",kd);document.body.append(o);go(tab,logUser);
}

/* ---------- print ---------- */
function openPrint(){
  const T=t(),fl=items.filter(i=>!i.trashed&&i.kind==="file"&&i.parent===cur);
  if(!fl.length)return notify(T.noFiles);
  modal(T.print,[{k:"ids",label:T.pickPrint,type:"checks",opts:fl.map(f=>[f.id,f.name])}],T.print,v=>{if(!v.ids.length)return false;printFiles(v.ids.map(byId))});
}
async function printFiles(list){
  const T=t(),pdf=[],ok=[],bad=[];
  for(const f of list){
    const ty=f.mime||"",e=extOf(f.name).toLowerCase();
    if(ty==="application/pdf"||e==="pdf")pdf.push(f);
    else if(ty.startsWith("image/")||/^(jpe?g|png|gif|webp|svg|bmp)$/.test(e))ok.push([f,"img"]);
    else if(ty.startsWith("text/")||/^(txt|md|csv|json|log)$/.test(e))ok.push([f,"txt"]);
    else bad.push(f.name);
  }
  const wins=pdf.map(()=>window.open("","_blank"));
  if(bad.length)notify(T.noPrint+"\n"+bad.join("\n"));
  if(pdf.length||ok.length)logAct("print",[...pdf,...ok.map(x=>x[0])].map(f=>f.name).join(" | "));
  try{
    for(let i=0;i<pdf.length;i++){const b=await getBlob(pdf[i]),u=URL.createObjectURL(new Blob([b],{type:"application/pdf"}));if(wins[i])wins[i].location.href=u;else saveBlob(b,pdf[i].name)}
    if(!ok.length)return;
    const pa=$("#printArea"),urls=[],waits=[];pa.textContent="";
    for(const [f,k] of ok){
      const b=await getBlob(f),pg=document.createElement("div");pg.className="pg";
      if(k==="img"){const im=document.createElement("img"),u=URL.createObjectURL(b);urls.push(u);waits.push(new Promise(r=>{im.onload=im.onerror=r}));im.src=u;pg.append(im)}
      else{const pre=document.createElement("pre");pre.dir="auto";pre.textContent=await b.text();pg.append(pre)}
      pa.append(pg);
    }
    await Promise.all(waits);
    const done=()=>{pa.textContent="";urls.forEach(u=>URL.revokeObjectURL(u));removeEventListener("afterprint",done)};
    addEventListener("afterprint",done);
    window.print();
  }catch(e){wins.forEach(w=>w&&w.close());fail(e)}
}


/* ---------- render ---------- */
const COL={pdf:"#EF4444",zip:"#CA8A04",rar:"#CA8A04","7z":"#CA8A04",txt:"#60A5FA",md:"#60A5FA",doc:"#2563EB",docx:"#2563EB",ppt:"#F97316",pptx:"#F97316",xls:"#16A34A",xlsx:"#16A34A",csv:"#16A34A"};
const fmtSize=b=>b<1024?b+" B":b<1048576?(b/1024).toFixed(1)+" KB":b<1073741824?(b/1048576).toFixed(1)+" MB":(b/1073741824).toFixed(2)+" GB";
const fmtDate=d=>new Date(d).toLocaleDateString("en-GB");
const fmtTime=d=>new Date(d).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false});
const fmtDT2=d=>fmtDate(d)+" "+fmtTime(d);
const SORT={new:(a,b)=>b.added-a.added,old:(a,b)=>a.added-b.added,name:(a,b)=>a.name.localeCompare(b.name,lang),size:(a,b)=>(b.size||0)-(a.size||0)};

function list(){
  const q=$("#q").value.trim().toLowerCase(),cat=$("#cat").value;
  let a;
  if(view==="trash")a=items.filter(i=>i.trashed&&!(byId(i.parent)||{}).trashed);
  else{
    a=items.filter(i=>!i.trashed);
    if(q);
    else if(view==="home")a=a.filter(i=>i.parent===cur);
    else a=a.filter(i=>i.kind==="file");
  }
  if(q)a=a.filter(i=>i.name.toLowerCase().includes(q));
  if(cat)a=a.filter(i=>i.kind==="file"&&i.cat===cat);
  if(view==="recent"&&!q)a=a.sort(SORT.new).slice(0,15);
  const s=$("#sort").value||"new";
  return a.sort((x,y)=>(y.kind==="folder")-(x.kind==="folder")||SORT[s](x,y));
}
function row(it){
  const T=t(),li=document.createElement("li"),tr=view==="trash";
  const rb=document.createElement("button");rb.className="rb";
  let bd;
  if(it.kind==="folder")bd='<div class="bd fo"><svg viewBox="0 0 24 20"><path d="M1 3a2 2 0 0 1 2-2h6l2 2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" fill="#3B82F6"/></svg></div>';
  else{const e=extOf(it.name).toLowerCase();bd=`<div class="bd" style="background:${COL[e]||(it.cat==="img"?"#10B981":"#64748B")}">${(e||"file").slice(0,4).toUpperCase()}</div>`}
  rb.innerHTML=bd+'<div class="inf"><div class="nm"></div><div class="mt"></div></div>';
  rb.querySelector(".nm").textContent=it.name;
  rb.querySelector(".mt").textContent=it.kind==="folder"?`${T.folder} • ${items.filter(i=>i.parent===it.id&&!i.trashed).length} ${T.items} • ${fmtDT2(it.added)}`:`${(extOf(it.name)||"FILE").toUpperCase()} • ${fmtSize(it.size)} • ${fmtDT2(it.added)}`+(it.by?" • "+it.by:"");
  let tm=0,sx=0,sy=0;const cl=()=>clearTimeout(tm);
  const startSel=()=>{lpAt=Date.now();if(navigator.vibrate)navigator.vibrate(15);selMode=true;sel.add(it.id);render()};
  rb.addEventListener("pointerdown",e=>{if(selMode||(e.button||0)>0)return;sx=e.clientX;sy=e.clientY;tm=setTimeout(startSel,500)});
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>rb.addEventListener(ev,cl));
  rb.addEventListener("pointermove",e=>{if(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)cl()});
  rb.addEventListener("contextmenu",e=>{e.preventDefault();cl();if(!selMode)startSel()});
  rb.onclick=()=>{if(Date.now()-lpAt<700)return;if(selMode)toggleSel(it.id);else if(!tr)openIt(it)};
  if(selMode){const on=sel.has(it.id),ck=el("span","ck"+(on?" on":""));ck.innerHTML=ic("check");rb.prepend(ck);if(on)li.classList.add("picked")}
  const d=document.createElement("button");d.className="dots";d.innerHTML=ic("dots");d.setAttribute("aria-label","menu");
  d.onclick=e=>{e.stopPropagation();menu(d,tr?[[T.rest,()=>setTrash(it,false)],[T.delf,()=>purge(it),1]]:[...(it.kind==="folder"?[[T.open,()=>openIt(it)]]:[[T.open,()=>openIt(it)],[T.dl,()=>download(it)],[T.print,()=>printFiles([it])]]),[T.edit,()=>editItem(it)],[T.del,()=>setTrash(it,true),1]])};
  if(selMode)d.hidden=true;
  li.append(rb,d);return li;
}
function render(){
  const T=t(),q=$("#q").value.trim();
  if(view==="storage"&&!(user&&user.role==="admin"))view="home";
  const st=view==="storage";
  const key=view+"|"+cur;if(key!==selKey){selKey=key;sel.clear()}
  sel.forEach(id=>{if(!byId(id))sel.delete(id)});
  $("#stp").hidden=!st;$("#list").hidden=st;$(".sel").hidden=st;
  document.querySelectorAll(".nv[data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===view));
  $("#hero").hidden=!(view==="home"&&!q);
  $("#greet").hidden=$("#uname").hidden=!!cur;$(".hero .art").toggleAttribute("hidden",!!cur);
  $("#hero").style.paddingTop=cur?"8px":"";
  const fo=cur&&byId(cur);
  $("#h2").textContent=view==="home"?(fo?fo.name:T.my):T[view];
  $("#back").hidden=!(view==="home"&&cur);
  const a=list(),ul=$("#list");ul.textContent="";
  if(!a.length){const e=document.createElement("li");e.className="empty";e.style.display="block";e.textContent=q||$("#cat").value?T.noRes:view==="trash"?T.emptyT:T.empty;ul.append(e)}
  else a.forEach(i=>ul.append(row(i)));
  updSel();
}
function setLang(){
  const T=t(),r=document.documentElement;
  r.lang=lang;r.dir=lang==="ar"?"rtl":"ltr";document.title=T.title;
  $("#brand").innerHTML=`${T.t1} <b>${T.t2}</b>`;
  $("#nav").innerHTML="";
  for(const [v,i] of [["home","home"],["all","files"],["recent","clock"],["trash","trash"],...(user&&user.role==="admin"?[["storage","nf"]]:[])]){
    const b=document.createElement("button");b.className="nv";b.dataset.v=v;b.innerHTML=ic(i)+`<span>${T[v]}</span>`;
    b.onclick=()=>{view=v;if(v==="home")cur="";$("#q").value="";render();if(v==="storage")renderStorage()};$("#nav").append(b);
  }
  if(user&&user.role==="admin"){const b=document.createElement("button");b.className="nv";b.innerHTML=ic("user")+`<span>${T.admin}</span>`;b.onclick=()=>openAdmin();$("#nav").append(b)}
  $("#out").innerHTML=ic("out")+`<span>${T.out}</span>`;
  $("#srchic").innerHTML=ic("search");$("#q").placeholder=T.search;
  document.querySelectorAll(".cn").forEach(e=>e.textContent=T.co);
  $("#bUp").innerHTML=ic("upload")+T.up;$("#bFold").innerHTML=ic("nf")+T.nf;$("#bNote").innerHTML=ic("note")+T.an;$("#bPrint").innerHTML=ic("print")+T.print;
  $("#back").innerHTML=ic("back","flip");$("#back").setAttribute("aria-label",T.back);
  const s=$("#sort").value,c=$("#cat").value;
  $("#sort").innerHTML=[["new",T.sNew],["old",T.sOld],["name",T.sName],["size",T.sSize]].map(([v,n])=>`<option value="${v}">${n}</option>`).join("");
  $("#sort").value=s||"new";
  $("#cat").innerHTML=`<option value="">${T.cAll}</option>`+catOpts().map(([v,n])=>`<option value="${v}">${n}</option>`).join("");
  $("#cat").value=c||"";
  $("#sort").setAttribute("aria-label",T.sort);$("#cat").setAttribute("aria-label",T.cat);
  if(user){$("#greet").textContent=new Date().getHours()<12?T.g0:T.g1;$("#uname").textContent=user.name;updateAv()}
  if(ready)render();
}
async function logout(msg){
  let was=false;try{was=sessionStorage.getItem("fv_in")==="1";sessionStorage.removeItem("fv_in")}catch(e){}
  if(was&&user&&user.active)await sb.rpc("log_action",{p_action:"logout",p_target:""}).then(()=>{},()=>{});
  if(ch&&sb){sb.removeChannel(ch);ch=null}
  ready=false;user=null;items=[];cur="";view="home";selMode=false;sel.clear();admSet(false);
  if(sb)await sb.auth.signOut();
  showAuth(typeof msg==="string"?msg:"");
}
async function enter(){
  $("#auth").hidden=true;$("#app").hidden=false;
  const bt=$("#boot");if(bt)bt.hidden=true;
  setLang();skel();
  try{await load()}catch(e){fail(e)}
  ready=true;render();
  let fl=false;try{fl=sessionStorage.getItem("fv_in")==="1"}catch(e){}
  if(!fl){try{sessionStorage.setItem("fv_in","1")}catch(e){}logAct("login")}
  subscribe();
}
addEventListener("pagehide",()=>{
  let fl=false;try{fl=sessionStorage.getItem("fv_in")==="1";sessionStorage.removeItem("fv_in")}catch(e){}
  if(!fl||!sess||!user||!user.active)return;
  fetch(SB_URL+"/rest/v1/rpc/log_action",{method:"POST",keepalive:true,headers:{apikey:SB_KEY,Authorization:"Bearer "+sess.access_token,"Content-Type":"application/json"},body:JSON.stringify({p_action:"logout",p_target:""})}).catch(()=>{});
});

/* ---------- storage info (admin) ---------- */
async function renderStorage(){
  const T=t(),box=$("#stp");box.textContent="";box.append(el("p","mute",T.loading));
  const {data:d,error}=await sb.rpc("admin_storage_info");
  box.textContent="";
  if(error){box.append(el("p","err",errMsg(error)));return}
  const pct=(u,m)=>Math.min(100,Math.round(u/m*1000)/10);
  const card=(title,used,max)=>{
    const c=el("div","stc"),p=pct(used,max),h=el("h3");
    h.append(el("span",null,title),el("span",null,p+"%"));
    const b=el("div","stb"),i=el("i",p>=90?"d":p>=70?"w":"");i.style.width=p+"%";b.append(i);
    c.append(h,b,el("div","mt",`${T.stUsed}: ${fmtSize(used)} ${T.stOf} ${fmtSize(max)}`),el("div","mt",`${T.stLeft}: ${fmtSize(Math.max(0,max-used))}`));
    return c;
  };
  box.append(card(T.stDb,Number(d.db_bytes)||0,PLAN.db),card(T.stFiles,Number(d.files_bytes)||0,PLAN.files));
  const g=el("div","stg"),n=(l,v,sub)=>{const c=el("div","stc");c.append(el("div","mt",l),el("div","stn",String(v)));if(sub)c.append(el("div","mt",sub));return c};
  g.append(n(T.stUsersAll,d.users_total,`${d.users_active} ${T.stAct}`),n(T.stCount,d.files_count));
  box.append(g);
  const rb=el("button","btn",T.stRef);rb.onclick=renderStorage;box.append(rb,el("p","mute sm",T.stNote));
}

/* ---------- recheck ban/delete ---------- */
let rck=0;
document.addEventListener("visibilitychange",async()=>{
  if(document.hidden||!sb||!user||!user.active||Date.now()-rck<15000)return;
  rck=Date.now();
  const {data:p,error}=await sb.from("profiles").select("banned,activated").eq("id",user.id).maybeSingle();
  if(error)return;
  if(!p)return logout(t().e_auth);
  if(p.banned)return logout(t().e_banned);
});

/* ---------- events ---------- */
$("#q").oninput=render;$("#sort").onchange=render;$("#cat").onchange=render;
$("#bSel").onclick=()=>{selMode=!selMode;if(!selMode)sel.clear();render()};
$("#bUp").onclick=()=>$("#file").click();$("#bFold").onclick=newFolder;$("#bNote").onclick=newNote;$("#bPrint").onclick=openPrint;
$("#file").onchange=e=>{addFiles([...e.target.files]);e.target.value=""};
$("#back").onclick=()=>{const f=byId(cur);cur=f?f.parent:"";render()};
$("#out").onclick=logout;
$("#av").onclick=e=>{e.stopPropagation();openProfile()};
const mn=$("#main");
["dragenter","dragover"].forEach(ev=>mn.addEventListener(ev,e=>{e.preventDefault();mn.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>mn.addEventListener(ev,e=>{e.preventDefault();mn.classList.remove("drag")}));
mn.addEventListener("drop",e=>{if(view!=="trash")addFiles([...e.dataTransfer.files])});

/* ---------- start ---------- */
document.querySelectorAll("img.colg").forEach(i=>i.src=LOGO);
document.querySelectorAll("img.mkL").forEach(i=>i.src=MARK_L);document.querySelectorAll("img.mkS").forEach(i=>i.src=MARK_S);
{const fi=document.querySelector("link[rel=icon]");if(fi)fi.href=MARK_F}
document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.title=t().title;
if(sb)sb.auth.onAuthStateChange((ev,s)=>{sess=s});
start().then(()=>{if(location.hash.includes("access_token")||location.search.includes("code="))history.replaceState(null,"",location.pathname)});
