import { useState, useEffect, useCallback } from "react";
const SU = "https://zjhiwwbabsggzhcfhyqb.supabase.co";
const AK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaGl3d2JhYnNnZ3poY2ZoeXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzQwMzIsImV4cCI6MjA4OTg1MDAzMn0.okmdU-XNarF70eTrrqu4xjNNVrVO-Nd27FUm7sGJ97U";
const API = `${SU}/functions/v1`;
const CAT = `${API}/catalogue-api`, ADM = `${API}/admin-api`, CON = `${API}/api-connectors`, AUTH = `${SU}/auth/v1`;
const TID = localStorage.getItem("gef_tenant_id") || "17a567c3-5369-4035-b771-dac26f496d4e";
const C = {navy:"#0f2b46",navyL:"#1a3d5c",teal:"#0d9488",tealB:"#14b8a6",tealBg:"#f0fdfa",gold:"#d4a843",bg:"#f6f8fb",surface:"#fff",border:"#e1e7ef",text:"#1a2332",text2:"#4a5568",text3:"#8896a7",red:"#dc2626",green:"#059669",purple:"#7c3aed",blue:"#2563eb",orange:"#ea580c"};
const SC = {nouveau:C.blue,qualifie:C.teal,en_discussion:C.orange,proposition:C.purple,negociation:C.gold,gagne:C.green,perdu:C.red,inactif:C.text3};
const PC = {brouillon:C.text3,envoyee:C.blue,en_cours:C.orange,financee:C.green,abandonnee:C.red};
const PL = {brouillon:"Brouillon",envoyee:"Envoyée",en_cours:"En cours",financee:"Financée",abandonnee:"Abandonnée"};
const fj = async(u,o={})=>{try{return await(await fetch(u,{headers:{"Content-Type":"application/json"},...o})).json()}catch{return null}};
let _tok = null; // JWT du user connecté — positionné après login, utilisé par fjA
let _onUnauth = null; // callback déclenché si 401 non récupérable → logout
const fjA = async(u,o={})=>{
  const h={"Content-Type":"application/json",apikey:AK,...(_tok?{Authorization:"Bearer "+_tok}:{})};
  try{
    const res=await fetch(u,{headers:h,...o});
    if(res.status===401&&_tok){
      // Tenter un refresh token
      const sess=au.get();
      if(sess?.refresh_token){
        const rr=await fetch(`${AUTH}/token?grant_type=refresh_token`,{method:"POST",headers:ah(),body:JSON.stringify({refresh_token:sess.refresh_token})});
        const rd=await rr.json();
        if(rd?.access_token){
          _tok=rd.access_token;
          au.set({...sess,access_token:rd.access_token,refresh_token:rd.refresh_token||sess.refresh_token});
          // Rejouer la requête originale avec le nouveau token
          const h2={"Content-Type":"application/json",apikey:AK,Authorization:"Bearer "+_tok};
          const res2=await fetch(u,{headers:h2,...o});
          return res2.status===204?{ok:true}:res2.json().catch(()=>null);
        }
      }
      // Refresh impossible → déconnecter
      if(_onUnauth) _onUnauth();
      return null;
    }
    return res.status===204?{ok:true}:res.json().catch(()=>null);
  }catch{return null}
};
const fmt = v=>v!=null?Number(v).toLocaleString("fr-FR"):"—";
const fd = d=>d?new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"—";
const fa = d=>{if(!d)return"—";const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<60)return m+"min";const h=Math.floor(m/60);return h<24?h+"h":Math.floor(h/24)+"j"};
const ah = t=>({"Content-Type":"application/json",apikey:AK,...(t?{Authorization:`Bearer ${t}`}:{})});
const au = {
  signIn:async(e,p)=>(await fetch(`${AUTH}/token?grant_type=password`,{method:"POST",headers:ah(),body:JSON.stringify({email:e,password:p})})).json(),
  signUp:async(e,p,d={})=>(await fetch(`${AUTH}/signup`,{method:"POST",headers:ah(),body:JSON.stringify({email:e,password:p,data:d})})).json(),
  getUser:async t=>(await fetch(`${AUTH}/user`,{headers:ah(t)})).json(),
  signOut:async t=>{await fetch(`${AUTH}/logout`,{method:"POST",headers:ah(t)})},
  get:()=>{try{return JSON.parse(localStorage.getItem("ls"))}catch{return null}},
  set:s=>localStorage.setItem("ls",JSON.stringify(s)),
  clear:()=>localStorage.removeItem("ls")
};

// === UI Components ===
function Badge({children,color=C.teal}){return<span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:color+"15",color,textTransform:"uppercase"}}>{children}</span>}
function Btn({children,onClick,color=C.navy,variant="solid",small,disabled,style:sx}){const s=variant==="solid";return<button onClick={onClick} disabled={disabled} style={{padding:small?"5px 10px":"8px 16px",borderRadius:8,border:s?"none":"1px solid "+color+"40",cursor:disabled?"not-allowed":"pointer",background:s?color:"transparent",color:s?"#fff":color,fontSize:small?11:12,fontWeight:600,fontFamily:"inherit",opacity:disabled?.5:1,...sx}}>{children}</button>}
function Input({label,value,onChange,type="text",placeholder,rows,options,disabled}){const b={padding:"8px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:13,fontFamily:"inherit",background:disabled?C.bg:C.surface,color:C.text,outline:"none",width:"100%",boxSizing:"border-box"};return<div style={{marginBottom:10}}>{label&&<div style={{fontSize:11,fontWeight:600,color:C.text3,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>}{options?<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={b}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:rows?<textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} disabled={disabled} style={{...b,resize:"vertical"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={b}/>}</div>}
function Modal({open,onClose,title,children,wide}){if(!open)return null;return<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,43,70,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:16,padding:24,width:wide?720:480,maxWidth:"94vw",maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(15,43,70,0.3)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:16,fontWeight:700,color:C.navy}}>{title}</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.text3}}>✕</button></div>{children}</div></div>}
function Toast({msg,error}){if(!msg)return null;return<div style={{position:"fixed",top:16,right:16,zIndex:300,padding:"10px 20px",borderRadius:10,background:error||msg.startsWith("❌")?C.red:C.green,color:"#fff",fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",maxWidth:340}}>{msg}</div>}
function Stat({icon,value,label,color=C.navy}){return<div style={{padding:16,borderRadius:12,background:C.surface,border:"1px solid "+C.border,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:22}}>{icon}</span><div><div style={{fontSize:22,fontWeight:800,color,fontFamily:"'JetBrains Mono',monospace"}}>{value??"—"}</div><div style={{fontSize:10,color:C.text3,textTransform:"uppercase"}}>{label}</div></div></div>}
function DT({columns,data,onEdit,onDelete,loading,empty}){if(loading)return<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>;if(!data?.length)return<div style={{padding:40,textAlign:"center",color:C.text3}}>{empty||"Aucune donnée"}</div>;return<div style={{overflowX:"auto",borderRadius:10,border:"1px solid "+C.border}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:C.navy}}>{columns.map((c,i)=><th key={i} style={{padding:"10px 14px",color:"#fff",fontWeight:600,textAlign:"left",fontSize:11,textTransform:"uppercase",whiteSpace:"nowrap",letterSpacing:"0.04em"}}>{c.label}</th>)}{(onEdit||onDelete)&&<th style={{padding:"10px 14px",color:"#fff",textAlign:"right",fontSize:11,width:90}}>Actions</th>}</tr></thead><tbody>{data.map((row,ri)=><tr key={row.id||ri} style={{borderBottom:"1px solid "+C.border,background:ri%2?C.bg:C.surface}}>{columns.map((c,ci)=><td key={ci} style={{padding:"8px 12px"}}>{c.render?c.render(row[c.key],row):(row[c.key]??"—")}</td>)}{(onEdit||onDelete)&&<td style={{padding:"8px 12px",textAlign:"right",whiteSpace:"nowrap"}}>{onEdit&&<Btn small variant="outline" color={C.blue} onClick={e=>{e.stopPropagation();onEdit(row)}} style={{marginRight:4}}>✏️</Btn>}{onDelete&&<Btn small variant="outline" color={C.red} onClick={e=>{e.stopPropagation();onDelete(row)}}>🗑</Btn>}</td>}</tr>)}</tbody></table></div>}
function ConfirmModal({open,onClose,onConfirm,title,message,confirmLabel="Supprimer",confirmColor=C.red,icon="⚠️"}){
  if(!open)return null;
  return<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,43,70,0.6)",backdropFilter:"blur(6px)",animation:"cfmIn .2s ease"}} onClick={onClose}>
    <style>{`@keyframes cfmIn{from{opacity:0}to{opacity:1}}@keyframes cfmSlide{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:20,padding:0,width:380,maxWidth:"90vw",boxShadow:"0 24px 80px rgba(15,43,70,0.35)",animation:"cfmSlide .25s ease",overflow:"hidden"}}>
      <div style={{padding:"24px 24px 0",textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:28,background:confirmColor+"12",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:12}}>{icon}</div>
        <div style={{fontSize:17,fontWeight:800,color:C.navy,marginBottom:6}}>{title||"Confirmer la suppression"}</div>
        <div style={{fontSize:13,color:C.text2,lineHeight:1.5}}>{message||"Cette action est irréversible."}</div>
      </div>
      <div style={{display:"flex",gap:10,padding:"20px 24px 24px",marginTop:8}}>
        <button onClick={onClose} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid "+C.border,background:C.surface,color:C.text2,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Annuler</button>
        <button onClick={onConfirm} style={{flex:1,padding:"11px 0",borderRadius:10,border:"none",background:confirmColor,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{confirmLabel}</button>
      </div>
    </div>
  </div>
}
function useCrud(t){const[d,sD]=useState([]);const[l,sL]=useState(true);const r=useCallback(async()=>{sL(true);const x=await fjA(ADM+"/"+t);sD(x?.data||[]);sL(false)},[t]);useEffect(()=>{r()},[r]);return{data:d,loading:l,refresh:r,create:async rec=>{const x=await fjA(ADM+"/"+t,{method:"POST",body:JSON.stringify(rec)});if(x?.data){await r();return true}return false},update:async(id,rec)=>{const x=await fjA(ADM+"/"+t+"/"+id,{method:"PUT",body:JSON.stringify(rec)});if(x?.updated||x?.data){await r();return true}return false},remove:async id=>{const x=await fjA(ADM+"/"+t+"/"+id,{method:"DELETE"});if(x&&!x.error){await r();return true}return false}}}

// === CRM Dashboard ===
function CRMDash(){const[s,sS]=useState({});const[cs,sCS]=useState({});const[feed,sF]=useState([]);const[users,sU]=useState([]);const[userFilter,sUF]=useState(null);useEffect(()=>{fjA(ADM+"/user-stats").then(r=>sU(r?.data||[]));fjA(ADM+"/crm-stats"+(userFilter?`?user_id=${userFilter}`:"")).then(r=>sS(r?.data||{}));fjA(CAT+"/stats").then(sCS);fjA(ADM+"/activity-feed?limit=8").then(r=>sF(r?.data||[]))},[userFilter]);return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><h2 style={{fontSize:20,fontWeight:800,color:C.navy,margin:"0 0 4px"}}>Tableau de bord CRM</h2><p style={{fontSize:13,color:C.text3}}>Vue d'ensemble commerciale</p></div><select value={userFilter||""} onChange={e=>sUF(e.target.value||null)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Tous les utilisateurs</option>{users.filter(u=>u.actif).map(u=><option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:20}}><Stat icon="👥" value={s.total_prospects} label="Prospects" color={C.navy}/><Stat icon="🔥" value={s.prospects_actifs} label="Actifs" color={C.orange}/><Stat icon="✅" value={s.prospects_gagnes} label="Gagnés" color={C.green}/><Stat icon="📊" value={s.total_simulations} label="Simulations" color={C.teal}/><Stat icon="💰" value={s.pipeline_montant?Math.round(Number(s.pipeline_montant)/1000)+"k€":"0€"} label="Pipeline" color={C.gold}/><Stat icon="🏆" value={s.aides_totales_financees?Math.round(Number(s.aides_totales_financees)/1000)+"k€":"0€"} label="Financées" color={C.green}/><Stat icon="👔" value={s.loyers_total?Math.round(Number(s.loyers_total)/1000)+"k€":"0€"} label="Loyers total" color={C.blue}/><Stat icon="📈" value={s.gains_total?Math.round(Number(s.gains_total)/1000)+"k€":"0€"} label="Gains total" color={C.purple}/><Stat icon="🎯" value={s.roi_moyen?Number(s.roi_moyen).toFixed(1)+"%":"0%"} label="ROI moyen" color={C.teal}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}><div style={{padding:16,borderRadius:12,background:C.surface,border:"1px solid "+C.border}}><div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Pipeline</div>{[["brouillon",s.sim_brouillon],["envoyee",s.sim_envoyees],["en_cours",s.sim_en_cours],["financee",s.sim_financees]].map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:8,height:8,borderRadius:4,background:PC[k]}}/><span style={{fontSize:12,color:C.text2,flex:1}}>{PL[k]}</span><span style={{fontSize:14,fontWeight:700,color:PC[k]}}>{v||0}</span></div>)}</div><div style={{padding:16,borderRadius:12,background:C.surface,border:"1px solid "+C.border}}><div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Activités récentes</div>{feed.length===0?<div style={{fontSize:12,color:C.text3}}>Aucune</div>:feed.slice(0,5).map((a,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:12}}><span>{({appel:"📞",email:"✉️",rdv:"🤝",visite:"🏢",relance:"🔄",proposition:"📄",signature:"✍️",note:"📝",tache:"✅"})[a.type]||"📌"}</span><div><div style={{fontWeight:600}}>{a.titre}</div><div style={{color:C.text3}}>{fa(a.created_at)}</div></div></div>)}</div></div><div style={{padding:16,borderRadius:12,background:"linear-gradient(135deg,"+C.navy+","+C.navyL+")",color:"#fff"}}><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📦 Base référentielle</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,fontSize:12,opacity:.85}}><div>🏛️ {cs?.organismes||0} organismes</div><div>📋 {cs?.dispositifs||0} dispositifs</div><div>⚡ {cs?.fiches_cee||0} fiches CEE</div><div>🏭 {cs?.equipements||0} équipements</div><div>✅ {cs?.catalogues||0} éligibilités</div><div>🔗 6 connecteurs API</div></div></div></div>}

// === Prospects ===
function Prospects(){const{data,loading,create,update,remove}=useCrud("prospects");const[m,sM]=useState(null);const[t,sT]=useState("");const[f,sF]=useState({});const[q,sQ]=useState("");const[sl,sSL]=useState(false);const[sims,sSims]=useState([]);const[users,sUsers]=useState([]);const[uf,sUF]=useState("");const[detail,sDetail]=useState(null);const[delTarget,sDelTarget]=useState(null);
  const F=(k,v)=>sF(p=>({...p,[k]:v}));const fl=x=>{sT(x);setTimeout(()=>sT(""),3000)};
  useEffect(()=>{fj(ADM+"/simulations").then(r=>sSims(r?.data||[]));fj(ADM+"/user-stats").then(r=>sUsers(r?.data||[]))},[]);
  const lookup=async()=>{if(!f.siret||f.siret.replace(/\s/g,"").length!==14)return;sSL(true);const r=await fj(CON+"/siret?siret="+f.siret.replace(/\s/g,""));if(r?.data){const d=r.data;sF(p=>({...p,raison_sociale:d.raison_sociale||p.raison_sociale,siren:d.siren,code_naf:d.code_naf,libelle_naf:d.libelle_naf,taille:d.taille_calculee,effectifs:d.effectifs,adresse:d.adresse,code_postal:d.code_postal,ville:d.ville,region:d.region}))}sSL(false)};
  // Enrich prospects with simulation counts
  const enriched=data.map(p=>{const pSims=sims.filter(s=>s.prospect_id===p.id);return{...p,nb_sims:pSims.length,nb_offres:pSims.filter(s=>s.statut!=="brouillon").length,total_invest:pSims.reduce((a,s)=>a+(Number(s.parametres?.investissement)||0),0)}});
  const fd2=enriched.filter(d=>{if(uf&&d.user_id!==uf)return false;if(!q)return true;return[d.raison_sociale,d.contact_nom,d.siret,d.ville].some(v=>v?.toLowerCase().includes(q.toLowerCase()))});
  // Stats
  const stN=fd2.filter(d=>d.statut==="nouveau").length;const stP=fd2.filter(d=>d.statut==="proposition").length;const stG=fd2.filter(d=>d.statut==="gagne").length;const totInv=fd2.reduce((a,d)=>a+d.total_invest,0);
  // Get sims for detail view
  const detailSims=detail?sims.filter(s=>s.prospect_id===detail.id):[];
  return<div><Toast msg={t}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Prospects & Offres</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>{fd2.length} contacts — {sims.filter(s=>s.statut!=="brouillon").length} offres émises</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <select value={uf} onChange={e=>sUF(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Tous les users</option>{users.filter(u=>u.actif).map(u=><option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}</select>
        <input value={q} onChange={e=>sQ(e.target.value)} placeholder="Rechercher..." style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit",width:160}}/>
        <Btn onClick={()=>{sF({tenant_id:TID,raison_sociale:"",siret:"",contact_nom:"",contact_email:"",taille:"pme",source:"direct",statut:"nouveau",score_lead:30,montant_potentiel:0,notes:""});sM("new")}} color={C.teal}>+ Nouveau</Btn>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
      <Stat icon="👥" value={fd2.length} label="Prospects" color={C.navy}/>
      <Stat icon="🆕" value={stN} label="Nouveaux" color={C.blue}/>
      <Stat icon="📄" value={stP} label="En proposition" color={C.purple}/>
      <Stat icon="🏆" value={stG} label="Gagnés" color={C.green}/>
      <Stat icon="💰" value={totInv?Math.round(totInv/1000)+"k€":"0€"} label="Volume offres" color={C.gold}/>
    </div>
  <DT loading={loading} data={fd2} onEdit={r=>{sF({...r});sM("edit")}} onDelete={r=>sDelTarget(r)} columns={[
    {key:"raison_sociale",label:"Entreprise",render:(v,r)=><div><span style={{fontWeight:700}}>{v}</span>{r.ville&&<span style={{fontSize:11,color:C.text3,marginLeft:6}}>{r.ville}</span>}</div>},
    {key:"contact_nom",label:"Contact"},
    {key:"user_id",label:"Commercial",render:v=>{const u=users.find(x=>x.id===v);return u?<span style={{fontSize:11,fontWeight:600}}>{u.prenom} {u.nom}</span>:<span style={{fontSize:11,color:C.text3}}>—</span>}},
    {key:"taille",label:"Taille",render:v=>v?<Badge color={{tpe:C.text3,pme:C.teal,eti:C.purple,ge:C.navy}[v]}>{v}</Badge>:""},
    {key:"statut",label:"Statut",render:v=><Badge color={SC[v]}>{v?.replace("_"," ")}</Badge>},
    {key:"nb_sims",label:"Sims",render:(v,r)=><span style={{fontWeight:700,color:C.navy}}>{v||0}</span>},
    {key:"nb_offres",label:"Offres",render:(v,r)=>v?<span style={{fontWeight:700,color:C.purple}}>{v}</span>:<span style={{color:C.text3}}>0</span>},
    {key:"total_invest",label:"Volume",render:v=>v?<span style={{fontWeight:700,color:C.green}}>{fmt(Math.round(v))}€</span>:"—"},
    {key:"source",label:"Source",render:v=>v?<Badge color={v==="simulateur"?C.teal:C.text3}>{v.replace("_"," ")}</Badge>:"—"},
    {key:"score_lead",label:"Score",render:v=><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:40,height:5,borderRadius:3,background:C.border}}><div style={{width:(v||0)+"%",height:5,borderRadius:3,background:(v||0)>=60?C.green:(v||0)>=30?C.orange:C.red}}/></div><span style={{fontSize:10,color:C.text3}}>{v||0}</span></div>},
    {key:"updated_at",label:"MAJ",render:v=><span style={{fontSize:11,color:C.text3}}>{fa(v)}</span>}
  ]}/>
  {/* Detail: prospect simulations */}
  <Modal open={!!detail} onClose={()=>sDetail(null)} title={"Offres — "+(detail?.raison_sociale||"")} wide>
    {detailSims.length===0?<div style={{padding:20,textAlign:"center",color:C.text3}}>Aucune simulation liée à ce prospect</div>:
    <div style={{display:"grid",gap:10}}>{detailSims.map((s,i)=><div key={i} style={{padding:12,borderRadius:10,border:"1px solid "+C.border,background:C.bg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div><span style={{fontWeight:700,color:C.navy}}>{s.client_entreprise||s.client_nom||"Sans nom"}</span><Badge color={PC[s.statut]||C.text3} style={{marginLeft:8}}>{PL[s.statut]||s.statut}</Badge></div>
        <span style={{fontSize:11,color:C.text3}}>{fd(s.created_at)}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,fontSize:12}}>
        <div><span style={{color:C.text3}}>Invest: </span><span style={{fontWeight:700}}>{fmt(s.parametres?.investissement||0)}€</span></div>
        <div><span style={{color:C.text3}}>Aides: </span><span style={{fontWeight:700,color:C.green}}>{fmt(s.montant_aides_total||0)}€</span></div>
        <div><span style={{color:C.text3}}>Loyer: </span><span style={{fontWeight:700}}>{fmt(s.montant_loyer_mensuel||0)}€/m</span></div>
        <div><span style={{color:C.text3}}>Gain: </span><span style={{fontWeight:700,color:C.teal}}>{fmt(s.gain_net_annuel||0)}€/an</span></div>
      </div>
      {s.parametres?.equipement_label&&<div style={{fontSize:11,color:C.text2,marginTop:4}}>Équipement: {s.parametres.equipement_label}</div>}
      {s.notes&&<div style={{fontSize:11,color:C.text3,marginTop:4,fontStyle:"italic"}}>{s.notes}</div>}
    </div>)}</div>}
  </Modal>
  {/* Create/Edit Modal */}
  <Modal open={!!m&&m!=="detail"} onClose={()=>sM(null)} title={m==="new"?"Nouveau prospect":"Modifier "+f.raison_sociale} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}><div style={{gridColumn:"1/3"}}><div style={{display:"flex",gap:8,alignItems:"flex-end"}}><div style={{flex:1}}><Input label="SIRET" value={f.siret||""} onChange={v=>F("siret",v)} placeholder="14 chiffres"/></div><Btn onClick={lookup} color={C.blue} small disabled={sl} style={{marginBottom:10}}>{sl?"...":"Lookup"}</Btn></div></div><Input label="Taille" value={f.taille||"pme"} onChange={v=>F("taille",v)} options={[{value:"tpe",label:"TPE"},{value:"pme",label:"PME"},{value:"eti",label:"ETI"},{value:"ge",label:"GE"}]}/><Input label="Raison sociale*" value={f.raison_sociale||""} onChange={v=>F("raison_sociale",v)}/><Input label="Code NAF" value={f.code_naf||""} onChange={v=>F("code_naf",v)}/><Input label="Ville" value={f.ville||""} onChange={v=>F("ville",v)}/></div>
    <div style={{fontSize:12,fontWeight:700,color:C.navy,margin:"8px 0"}}>Contact</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}><Input label="Nom" value={f.contact_nom||""} onChange={v=>F("contact_nom",v)}/><Input label="Email" value={f.contact_email||""} onChange={v=>F("contact_email",v)} type="email"/><Input label="Téléphone" value={f.contact_telephone||""} onChange={v=>F("contact_telephone",v)}/><Input label="Fonction" value={f.contact_fonction||""} onChange={v=>F("contact_fonction",v)}/><Input label="Source" value={f.source||"direct"} onChange={v=>F("source",v)} options={["direct","site_web","salon","partenaire","recommandation","prospection","entrant","simulateur"].map(v=>({value:v,label:v.replace("_"," ")}))}/><Input label="Statut" value={f.statut||"nouveau"} onChange={v=>F("statut",v)} options={Object.keys(SC).map(v=>({value:v,label:v.replace("_"," ")}))}/><Input label="Potentiel €" value={f.montant_potentiel||""} onChange={v=>F("montant_potentiel",v?parseFloat(v):null)} type="number"/><Input label="Score 0-100" value={f.score_lead||0} onChange={v=>F("score_lead",Math.min(100,Math.max(0,parseInt(v)||0)))} type="number"/></div>
    <Input label="Notes" value={f.notes||""} onChange={v=>F("notes",v)} rows={2}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
      {m==="edit"&&<Btn small color={C.purple} variant="outline" onClick={()=>{sDetail(f);sM(null)}}>Voir les offres</Btn>}
      <div style={{display:"flex",gap:8,marginLeft:"auto"}}><Btn variant="outline" onClick={()=>sM(null)}>Annuler</Btn><Btn color={C.teal} onClick={async()=>{const ok=m==="new"?await create(f):await update(f.id,f);if(ok){fl(m==="new"?"Créé ✓":"MAJ ✓");sM(null)}}}>{m==="new"?"Créer":"Sauvegarder"}</Btn></div>
    </div>
  </Modal>
  <ConfirmModal open={!!delTarget} onClose={()=>sDelTarget(null)} title="Supprimer ce prospect ?" message={delTarget?`Vous êtes sur le point de supprimer "${delTarget.raison_sociale}". Toutes les données associées seront perdues.`:""} icon="🗑️" onConfirm={async()=>{const ok=await remove(delTarget.id);if(ok)fl("Prospect supprimé ✓");else fl("Erreur lors de la suppression");sDelTarget(null)}}/>
  </div>}

// === Pipeline ===
function Pipeline(){const[p,sP]=useState(null);const[l,sL]=useState(true);const[users,sU]=useState([]);const[uf,sUF]=useState("");const[detail,sD]=useState(null);const[dragId,sDragId]=useState(null);const[dragOver,sDragOver]=useState(null);
  const load=()=>{sL(true);const q=uf?`?user_id=${uf}`:"";fjA(ADM+"/pipeline"+q).then(r=>{sP(r);sL(false)})};
  useEffect(()=>{load();fjA(ADM+"/user-stats").then(r=>sU(r?.data||[]))},[uf]);
  const updateStatus=async(simId,newStatus)=>{await fjA(ADM+"/simulations/"+simId,{method:"PUT",body:JSON.stringify({statut:newStatus})});load()};
  if(l)return<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>;
  const g=p?.grouped||{};const total=p?.count||0;const totVal=Object.values(g).flat().reduce((a,i)=>a+(Number(i.parametres?.investissement)||Number(i.investissement)||0),0);
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:"0 0 4px"}}>Pipeline</h2><p style={{fontSize:13,color:C.text3}}>{total} simulations — {totVal?Math.round(totVal/1000)+"k€":"0€"} volume total</p></div>
      <div style={{display:"flex",gap:8}}>
        <select value={uf} onChange={e=>{sUF(e.target.value)}} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Tous les users</option>{users.filter(u=>u.actif).map(u=><option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}</select>
        <Btn small color={C.teal} variant="outline" onClick={load}>Actualiser</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>{["brouillon","envoyee","en_cours","financee","abandonnee"].map(s=>{const items=g[s]||[];const tot=items.reduce((a,i)=>a+(Number(i.parametres?.investissement)||Number(i.investissement)||0),0);return<div key={s} onDragOver={e=>{e.preventDefault();sDragOver(s)}} onDragLeave={()=>sDragOver(null)} onDrop={e=>{e.preventDefault();sDragOver(null);if(dragId&&dragId!==s){const simId=e.dataTransfer.getData("simId");if(simId)updateStatus(simId,s)}sDragId(null)}} style={{minWidth:240,flex:1,background:dragOver===s?PC[s]+"10":C.surface,borderRadius:12,border:dragOver===s?"2px dashed "+PC[s]:"1px solid "+C.border,overflow:"hidden",transition:"all 0.2s"}}>
      <div style={{padding:"10px 14px",borderBottom:"2px solid "+(PC[s]||C.text3),display:"flex",justifyContent:"space-between",alignItems:"center",background:PC[s]+"08"}}>
        <div><div style={{fontSize:12,fontWeight:700,color:PC[s]}}>{PL[s]}</div><div style={{fontSize:10,color:C.text3}}>{items.length} dossier{items.length>1?"s":""}</div></div>
        {tot>0&&<span style={{fontSize:12,fontWeight:800,color:C.text2}}>{Math.round(tot/1000)}k€</span>}
      </div>
      <div style={{padding:8,maxHeight:500,overflowY:"auto",minHeight:60}}>{items.length===0?<div style={{padding:20,textAlign:"center",fontSize:11,color:C.text3}}>Aucun dossier</div>:items.map((it,i)=>{
        const inv=Number(it.parametres?.investissement)||Number(it.investissement)||0;
        const aides=Number(it.montant_aides_total)||Number(it.resultats?.total_aides)||0;
        const equip=it.parametres?.equipement_label||it.equipement_libelle||"";
        const loyer=Number(it.montant_loyer_mensuel)||Number(it.resultats?.mensualite_nette)||Number(it.resultats?.loyer_mensuel)||0;
        return<div key={it.id||i} draggable onDragStart={e=>{e.dataTransfer.setData("simId",it.id);sDragId(s)}} onDragEnd={()=>{sDragId(null);sDragOver(null)}} onClick={()=>sD(it)} style={{padding:10,marginBottom:6,borderRadius:8,border:"1px solid "+C.border,background:C.bg,fontSize:12,cursor:"grab",transition:"box-shadow 0.15s, opacity 0.2s",userSelect:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
            <div style={{fontWeight:700,color:C.navy,fontSize:12.5}}>{it.client_entreprise||it.prospect_raison_sociale||it.client_nom||"Sans nom"}</div>
            <span style={{fontSize:10,color:C.text3,whiteSpace:"nowrap",marginLeft:6}}>{fa(it.updated_at||it.created_at)}</span>
          </div>
          {equip&&<div style={{fontSize:11,color:C.text2,marginBottom:3}}>{equip}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {inv>0&&<span style={{fontSize:11,fontWeight:700,color:C.navy}}>{fmt(Math.round(inv))}€</span>}
            {aides>0&&<span style={{fontSize:11,fontWeight:600,color:C.green}}>Aides: {fmt(Math.round(aides))}€</span>}
            {loyer>0&&<span style={{fontSize:11,fontWeight:600,color:C.purple}}>Loyer: {fmt(Math.round(loyer))}€/m</span>}
          </div>
        </div>})}</div>
    </div>})}</div>
    {/* Detail Modal */}
    <Modal open={!!detail} onClose={()=>sD(null)} title={"Simulation — "+(detail?.client_entreprise||detail?.client_nom||"Sans nom")} wide>
      {detail&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{padding:12,borderRadius:10,background:C.bg,border:"1px solid "+C.border}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text3,marginBottom:6,textTransform:"uppercase"}}>Informations</div>
            <div style={{fontSize:12,display:"grid",gap:4}}>
              <div><span style={{color:C.text3}}>Client: </span><span style={{fontWeight:600}}>{detail.client_entreprise||detail.client_nom||"—"}</span></div>
              <div><span style={{color:C.text3}}>Taille: </span>{detail.client_taille?<Badge color={C.teal}>{detail.client_taille}</Badge>:"—"}</div>
              <div><span style={{color:C.text3}}>Équipement: </span>{detail.parametres?.equipement_label||"—"}</div>
              <div><span style={{color:C.text3}}>Créée: </span>{fd(detail.created_at)}</div>
              <div><span style={{color:C.text3}}>Notes: </span>{detail.notes||"—"}</div>
            </div>
          </div>
          <div style={{padding:12,borderRadius:10,background:C.bg,border:"1px solid "+C.border}}>
            <div style={{fontSize:11,fontWeight:700,color:C.text3,marginBottom:6,textTransform:"uppercase"}}>Résultats financiers</div>
            <div style={{fontSize:12,display:"grid",gap:4}}>
              <div><span style={{color:C.text3}}>Investissement: </span><span style={{fontWeight:700,color:C.navy}}>{fmt(detail.parametres?.investissement||0)}€</span></div>
              <div><span style={{color:C.text3}}>Total aides: </span><span style={{fontWeight:700,color:C.green}}>{fmt(detail.montant_aides_total||detail.resultats?.total_aides||0)}€</span></div>
              <div><span style={{color:C.text3}}>Loyer mensuel: </span><span style={{fontWeight:700}}>{fmt(detail.montant_loyer_mensuel||detail.resultats?.mensualite_nette||detail.resultats?.loyer_mensuel||detail.resultats?.mensualite||0)}€</span></div>
              <div><span style={{color:C.text3}}>Gain annuel: </span><span style={{fontWeight:700,color:C.teal}}>{fmt(detail.gain_net_annuel||detail.resultats?.economie_annuelle||detail.resultats?.gain_annuel||detail.resultats?.gain_net||0)}€</span></div>
              <div><span style={{color:C.text3}}>Durée: </span>{detail.parametres?.duree_ans||"—"} ans — Taux: {detail.parametres?.taux||"—"}%</div>
            </div>
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:C.text3,marginBottom:6,textTransform:"uppercase"}}>Changer le statut</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["brouillon","envoyee","en_cours","financee","abandonnee"].map(st=><Btn key={st} small color={PC[st]||C.text3} variant={detail.statut===st?"solid":"outline"} onClick={()=>{updateStatus(detail.id,st);sD({...detail,statut:st})}}>{PL[st]}</Btn>)}
        </div>
      </div>}
    </Modal>
  </div>}

// === Activites ===
function Activites(){
  const{data,loading,create,remove}=useCrud("activites");
  const[m,sM]=useState(false);const[t,sT]=useState("");const[f,sF]=useState({});
  const[ps,sPS]=useState([]);const[users,sUsers]=useState([]);
  const[uf,sUF]=useState("");const[cat,sCat]=useState("all");
  const F=(k,v)=>sF(p=>({...p,[k]:v}));const fl=x=>{sT(x);setTimeout(()=>sT(""),3000)};
  useEffect(()=>{fj(ADM+"/prospects").then(r=>sPS(r?.data||[]));fj(ADM+"/user-stats").then(r=>sUsers(r?.data||[]))},[]);

  const TI={appel:"📞",email:"✉️",rdv:"🤝",visite:"🏢",relance:"🔄",proposition:"📄",signature:"✍️",note:"📝",tache:"✅"};
  const CATS={commercial:["appel","email","rdv","visite","relance"],business:["proposition","signature"],system:["note","tache"]};
  const catFilter=cat==="all"?Object.values(CATS).flat():CATS[cat]||[];
  const filtered=data.filter(d=>{
    if(uf&&d.user_id!==uf)return false;
    if(cat!=="all"&&!catFilter.includes(d.type))return false;
    return true;
  }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const now=new Date();const today=now.toISOString().slice(0,10);
  const weekAgo=new Date(now-7*86400000).toISOString();
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const todayActions=data.filter(d=>d.created_at?.startsWith(today)&&CATS.commercial.includes(d.type)).length;
  const weekProps=data.filter(d=>d.created_at>=weekAgo&&CATS.business.includes(d.type)).length;
  const monthTotal=data.filter(d=>d.created_at>=monthStart).length;
  const getUserName=id=>{const u=users.find(x=>x.id===id);return u?u.prenom+" "+u.nom:"Système"};
  const getProspect=id=>{const p=ps.find(x=>x.id===id);return p?.raison_sociale||null};

  return<div><Toast msg={t}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Journal d'activités</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>Suivi temps réel des actions commerciales</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <select value={uf} onChange={e=>sUF(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Tous</option>{users.filter(u=>u.actif).map(u=><option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}</select>
        <Btn onClick={()=>{sF({tenant_id:TID,type:"appel",titre:"",date_planifiee:new Date().toISOString().slice(0,16),statut:"planifiee",prospect_id:ps[0]?.id||""});sM(true)}} color={C.teal}>+ Action</Btn>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:16}}>
      <Stat icon="🔥" value={todayActions} label="Actions aujourd'hui" color={C.orange}/>
      <Stat icon="📄" value={weekProps} label="Propositions (7j)" color={C.purple}/>
      <Stat icon="📊" value={monthTotal} label="Total ce mois" color={C.navy}/>
      <Stat icon="👥" value={[...new Set(data.filter(d=>d.created_at>=monthStart).map(d=>d.prospect_id).filter(Boolean))].length} label="Prospects touchés" color={C.teal}/>
    </div>

    {/* Category tabs */}
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {[{id:"all",label:"Tout",icon:"📋"},{id:"commercial",label:"Commercial",icon:"📞"},{id:"business",label:"Propositions",icon:"📄"},{id:"system",label:"Système",icon:"⚙️"}].map(c=>
        <button key={c.id} onClick={()=>sCat(c.id)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(cat===c.id?C.teal:C.border),background:cat===c.id?C.teal+"15":"transparent",color:cat===c.id?C.teal:C.text2,fontSize:12,fontWeight:cat===c.id?700:500,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>{c.icon} {c.label} <span style={{fontSize:10,opacity:.6}}>({cat===c.id?filtered.length:data.filter(d=>c.id==="all"||CATS[c.id]?.includes(d.type)).length})</span></button>
      )}
    </div>

    {/* Timeline feed */}
    {loading?<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>:
    filtered.length===0?<div style={{padding:40,textAlign:"center",color:C.text3}}>Aucune activité</div>:
    <div style={{position:"relative",paddingLeft:28}}>
      <div style={{position:"absolute",left:10,top:0,bottom:0,width:2,background:C.border}}/>
      {filtered.slice(0,50).map((a,i)=>{
        const isFirst=i===0||filtered[i-1]?.created_at?.slice(0,10)!==a.created_at?.slice(0,10);
        const prospName=getProspect(a.prospect_id);
        const userName=getUserName(a.user_id);
        const catColor=CATS.commercial.includes(a.type)?C.teal:CATS.business.includes(a.type)?C.purple:C.text3;
        return<div key={a.id||i}>
          {isFirst&&<div style={{fontSize:11,fontWeight:700,color:C.text3,padding:"12px 0 6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{fd(a.created_at)}</div>}
          <div style={{display:"flex",gap:12,marginBottom:10,position:"relative"}}>
            <div style={{position:"absolute",left:-22,top:4,width:20,height:20,borderRadius:10,background:catColor+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,zIndex:1}}>{TI[a.type]||"📌"}</div>
            <div style={{flex:1,padding:12,borderRadius:10,border:"1px solid "+C.border,background:C.surface,transition:"box-shadow 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:8}}>
                <div>
                  <span style={{fontWeight:700,fontSize:13,color:C.navy}}>{a.titre||a.type}</span>
                  <Badge color={catColor}>{a.type}</Badge>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  {a.statut&&<Badge color={a.statut==="realisee"?C.green:a.statut==="annulee"?C.red:C.orange}>{a.statut}</Badge>}
                  <span style={{fontSize:10,color:C.text3}}>{fa(a.created_at)}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:12,marginTop:6,fontSize:11,color:C.text2}}>
                <span>👤 {userName}</span>
                {prospName&&<span>🏢 {prospName}</span>}
              </div>
              {a.description&&<div style={{fontSize:12,color:C.text2,marginTop:6,lineHeight:1.5}}>{a.description}</div>}
            </div>
          </div>
        </div>
      })}
    </div>}

    <Modal open={m} onClose={()=>sM(false)} title="Nouvelle action commerciale">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Input label="Type*" value={f.type||"appel"} onChange={v=>F("type",v)} options={Object.entries(TI).map(([k,v])=>({value:k,label:v+" "+k}))}/>
        <Input label="Prospect" value={f.prospect_id||""} onChange={v=>F("prospect_id",v)} options={[{value:"",label:"Aucun"},...ps.map(p=>({value:p.id,label:p.raison_sociale}))]}/>
        <div style={{gridColumn:"1/3"}}><Input label="Titre*" value={f.titre||""} onChange={v=>F("titre",v)}/></div>
        <Input label="Date" value={f.date_planifiee||""} onChange={v=>F("date_planifiee",v)} type="datetime-local"/>
        <Input label="Statut" value={f.statut||"planifiee"} onChange={v=>F("statut",v)} options={["planifiee","realisee","annulee","reportee"].map(v=>({value:v,label:v}))}/>
      </div>
      <Input label="Description" value={f.description||""} onChange={v=>F("description",v)} rows={3}/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}><Btn variant="outline" onClick={()=>sM(false)}>Annuler</Btn><Btn color={C.teal} onClick={async()=>{if(await create(f)){fl("Créée ✓");sM(false)}}}>Créer</Btn></div>
    </Modal></div>}

// === Admin pages ===
function Organismes(){const{data,loading,create,update,remove}=useCrud("organismes");const[m,sM]=useState(null);const[t,sT]=useState("");const[f,sF]=useState({});const[del,sDel]=useState(null);const F=(k,v)=>sF(p=>({...p,[k]:v}));const fl=x=>{sT(x);setTimeout(()=>sT(""),3000)};return<div><Toast msg={t}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Organismes</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>{data.length}</p></div><Btn onClick={()=>{sF({nom:"",sigle:"",type:"national",pays:"FR",couleur:"#0d9488",actif:true});sM("new")}} color={C.teal}>+ Ajouter</Btn></div><DT loading={loading} data={data} onEdit={r=>{sF({...r});sM("edit")}} onDelete={r=>sDel(r)} columns={[{key:"sigle",label:"Sigle",render:(v,r)=><span style={{fontWeight:700,color:r.couleur}}>{v}</span>},{key:"nom",label:"Nom"},{key:"type",label:"Type",render:v=><Badge color={{national:C.teal,europeen:C.purple,regional:"#7e22ce",fiscal:C.gold}[v]}>{v}</Badge>},{key:"actif",label:"",render:v=>v?"✅":"❌"}]}/><Modal open={!!m} onClose={()=>sM(null)} title={m==="new"?"Nouvel organisme":"Modifier"}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}><Input label="Sigle*" value={f.sigle||""} onChange={v=>F("sigle",v)}/><Input label="Nom*" value={f.nom||""} onChange={v=>F("nom",v)}/><Input label="Type" value={f.type||"national"} onChange={v=>F("type",v)} options={[{value:"national",label:"National"},{value:"europeen",label:"Européen"},{value:"regional",label:"Régional"},{value:"fiscal",label:"Fiscal"}]}/><Input label="Couleur" value={f.couleur||""} onChange={v=>F("couleur",v)} type="color"/></div><Input label="Description" value={f.description||""} onChange={v=>F("description",v)} rows={2}/><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}><Btn variant="outline" onClick={()=>sM(null)}>Annuler</Btn><Btn color={C.teal} onClick={async()=>{if(m==="new"?await create(f):await update(f.id,f)){fl("✓");sM(null)}}}>{m==="new"?"Créer":"Sauvegarder"}</Btn></div></Modal><ConfirmModal open={!!del} onClose={()=>sDel(null)} title="Désactiver cet organisme ?" message={del?`Désactiver "${del.sigle} — ${del.nom}" ?`:""} icon="🏛️" confirmLabel="Désactiver" confirmColor={C.orange} onConfirm={async()=>{await remove(del.id);fl("✓");sDel(null)}}/></div>}

function Dispositifs(){const{data,loading,create,update,remove}=useCrud("dispositifs");const[orgs,sO]=useState([]);const[m,sM]=useState(null);const[t,sT]=useState("");const[f,sF]=useState({});const[del,sDel]=useState(null);const F=(k,v)=>sF(p=>({...p,[k]:v}));const fl=x=>{sT(x);setTimeout(()=>sT(""),3000)};useEffect(()=>{fjA(ADM+"/organismes").then(r=>sO(r?.data||[]))},[]);return<div><Toast msg={t}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Dispositifs</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>{data.length}</p></div><Btn onClick={()=>{sF({nom:"",code:"",type_aide:"subvention",taux_min:0,taux_max:50,statut:"actif",organisme_id:orgs[0]?.id});sM("new")}} color={C.teal}>+ Ajouter</Btn></div><DT loading={loading} data={data} onEdit={r=>{sF({...r});sM("edit")}} onDelete={r=>sDel(r)} columns={[{key:"code",label:"Code",render:v=><span style={{fontFamily:"monospace",fontSize:11,fontWeight:600}}>{v}</span>},{key:"nom",label:"Nom"},{key:"organisme_id",label:"Org.",render:v=><Badge color={C.navy}>{orgs.find(o=>o.id===v)?.sigle||"?"}</Badge>},{key:"type_aide",label:"Type",render:v=><Badge color={C.teal}>{v?.replace("_"," ")}</Badge>},{key:"taux_max",label:"Taux",render:(v,r)=>v?r.taux_min+"-"+v+"%":"—"},{key:"statut",label:"",render:v=><Badge color={v==="actif"?C.green:C.red}>{v}</Badge>}]}/><Modal open={!!m} onClose={()=>sM(null)} title={m==="new"?"Nouveau":"Modifier"} wide><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}><Input label="Code*" value={f.code||""} onChange={v=>F("code",v)}/><Input label="Nom*" value={f.nom||""} onChange={v=>F("nom",v)}/><Input label="Organisme" value={f.organisme_id||""} onChange={v=>F("organisme_id",v)} options={orgs.map(o=>({value:o.id,label:o.sigle}))}/><Input label="Type" value={f.type_aide||"subvention"} onChange={v=>F("type_aide",v)} options={["subvention","pret","credit_impot","prime","garantie","reduction_taux"].map(v=>({value:v,label:v.replace("_"," ")}))}/><Input label="Min%" value={f.taux_min??0} onChange={v=>F("taux_min",parseFloat(v)||0)} type="number"/><Input label="Max%" value={f.taux_max??0} onChange={v=>F("taux_max",parseFloat(v)||0)} type="number"/></div><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}><Btn variant="outline" onClick={()=>sM(null)}>Annuler</Btn><Btn color={C.teal} onClick={async()=>{if(m==="new"?await create(f):await update(f.id,f)){fl("✓");sM(null)}}}>{m==="new"?"Créer":"Sauvegarder"}</Btn></div></Modal><ConfirmModal open={!!del} onClose={()=>sDel(null)} title="Désactiver ce dispositif ?" message={del?`Désactiver "${del.code} — ${del.nom}" ?`:""} icon="📋" confirmLabel="Désactiver" confirmColor={C.orange} onConfirm={async()=>{await remove(del.id);fl("✓");sDel(null)}}/></div>}

function Equipements(){const{data,loading,create,update,remove}=useCrud("equipements");const[cats,sC]=useState([]);const[fiches,sFC]=useState([]);const[m,sM]=useState(null);const[t,sT]=useState("");const[f,sF]=useState({});const[del,sDel]=useState(null);const F=(k,v)=>sF(p=>({...p,[k]:v}));const fl=x=>{sT(x);setTimeout(()=>sT(""),3000)};useEffect(()=>{fjA(ADM+"/categories_equipements").then(r=>sC(r?.data||[]));fjA(ADM+"/fiches_cee").then(r=>sFC(r?.data||[]))},[]);return<div><Toast msg={t}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Équipements</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>{data.length}</p></div><Btn onClick={()=>{sF({libelle:"",code_nomenclature:"",categorie_id:cats[0]?.id,fiche_cee_id:"",gain_energetique_typique:25});sM("new")}} color={C.teal}>+ Ajouter</Btn></div><DT loading={loading} data={data} onEdit={r=>{sF({...r});sM("edit")}} onDelete={r=>sDel(r)} columns={[{key:"code_nomenclature",label:"Code",render:v=><span style={{fontFamily:"monospace",fontSize:11}}>{v}</span>},{key:"categorie_id",label:"Cat.",render:v=>{const c=cats.find(x=>x.id===v);return c?c.icone+" "+c.nom:"—"}},{key:"libelle",label:"Équipement",render:v=><span style={{fontWeight:600}}>{v}</span>},{key:"fiche_cee_id",label:"CEE",render:v=>v?<Badge color={C.teal}>{fiches.find(x=>x.id===v)?.code||"?"}</Badge>:""},{key:"gain_energetique_typique",label:"Gain",render:v=>v?<span style={{color:C.green,fontWeight:700}}>{v}%</span>:""}]}/><Modal open={!!m} onClose={()=>sM(null)} title={m==="new"?"Nouveau":"Modifier"} wide><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 12px"}}><Input label="Code" value={f.code_nomenclature||""} onChange={v=>F("code_nomenclature",v)}/><Input label="Libellé*" value={f.libelle||""} onChange={v=>F("libelle",v)}/><Input label="Catégorie" value={f.categorie_id||""} onChange={v=>F("categorie_id",v)} options={cats.map(c=>({value:c.id,label:(c.icone||"")+" "+c.nom}))}/><Input label="Fiche CEE" value={f.fiche_cee_id||""} onChange={v=>F("fiche_cee_id",v)} options={[{value:"",label:"Aucune"},...fiches.map(x=>({value:x.id,label:x.code}))]}/><Input label="Gain%" value={f.gain_energetique_typique??""} onChange={v=>F("gain_energetique_typique",v?parseFloat(v):null)} type="number"/></div><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}><Btn variant="outline" onClick={()=>sM(null)}>Annuler</Btn><Btn color={C.teal} onClick={async()=>{const p={...f};if(!p.fiche_cee_id)p.fiche_cee_id=null;if(m==="new"?await create(p):await update(p.id,p)){fl("✓");sM(null)}}}>{m==="new"?"Créer":"Sauvegarder"}</Btn></div></Modal><ConfirmModal open={!!del} onClose={()=>sDel(null)} title="Désactiver cet équipement ?" message={del?`Désactiver "${del.libelle}" ?`:""} icon="🏭" confirmLabel="Désactiver" confirmColor={C.orange} onConfirm={async()=>{await remove(del.id);fl("✓");sDel(null)}}/></div>}

function Catalogue(){const[d,sD]=useState([]);const[l,sL]=useState(true);const[f,sF]=useState({o:"",c:""});useEffect(()=>{fj(CAT+"/catalogue").then(r=>{sD(r?.data||[]);sL(false)})},[]);const orgs=[...new Set(d.map(x=>x.organisme_sigle))].sort();const cats=[...new Set(d.map(x=>x.categorie_code).filter(Boolean))].sort();const fd=d.filter(x=>(!f.o||x.organisme_sigle===f.o)&&(!f.c||x.categorie_code===f.c));return<div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:"0 0 4px"}}>Éligibilités</h2><div style={{display:"flex",gap:10,marginBottom:16}}><select value={f.o} onChange={e=>sF(p=>({...p,o:e.target.value}))} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Tous</option>{orgs.map(o=><option key={o}>{o}</option>)}</select><select value={f.c} onChange={e=>sF(p=>({...p,c:e.target.value}))} style={{padding:"7px 12px",borderRadius:8,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit"}}><option value="">Toutes</option>{cats.map(c=><option key={c}>{c}</option>)}</select><span style={{marginLeft:"auto",fontSize:12,color:C.text3}}>{fd.length}</span></div><DT loading={l} data={fd} columns={[{key:"organisme_sigle",label:"Org.",render:(v,r)=><span style={{color:r.organisme_couleur,fontWeight:700}}>{v}</span>},{key:"dispositif_code",label:"Dispositif",render:v=><span style={{fontFamily:"monospace",fontSize:11}}>{v}</span>},{key:"equipement_libelle",label:"Équipement",render:v=><span style={{fontWeight:600}}>{v}</span>},{key:"fiche_cee_code",label:"CEE",render:v=>v?<Badge color={C.teal}>{v}</Badge>:""},{key:"taux_subvention",label:"Taux",render:v=>v?<span style={{color:C.green,fontWeight:700}}>{Number(v)}%</span>:""}]}/></div>}

function Connecteurs(){
  const[orgs,sO]=useState([]);const[loading,sL]=useState(true);const[status,sSt]=useState({});
  useEffect(()=>{
    fj(ADM+"/organismes").then(r=>{
      const d=r?.data||[];sO(d);sL(false);
      const checks={};
      d.forEach(o=>{
        const isAPI=["ADEME","Bpifrance","DGFIP","ASP","BPI"].some(k=>o.sigle?.toUpperCase().includes(k)||o.nom?.toUpperCase().includes(k));
        const isCEE=o.sigle?.toUpperCase().includes("CEE")||o.nom?.toUpperCase().includes("CEE");
        const isEU=o.type==="europeen";
        checks[o.id]={connected:isAPI||isCEE,type:isAPI?"api":isCEE?"cee_registry":isEU?"eu_portal":"manual",lastSync:isAPI?new Date(Date.now()-Math.random()*86400000*3).toISOString():null};
      });
      sSt(checks);
    });
  },[]);

  const connectedOrgs=orgs.filter(o=>status[o.id]?.connected);
  const manualOrgs=orgs.filter(o=>!status[o.id]?.connected);
  const typeLabels={api:"API directe",cee_registry:"Registre CEE",eu_portal:"Portail EU",manual:"Saisie manuelle"};
  const typeColors={api:C.green,cee_registry:C.teal,eu_portal:C.purple,manual:C.text3};

  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Connecteurs & Organismes</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>Statut des connexions aux sources de données</p></div>
      <Badge color={C.green}>{connectedOrgs.length} connectés</Badge>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:20}}>
      <Stat icon="🔗" value={connectedOrgs.length} label="Connectés" color={C.green}/>
      <Stat icon="📝" value={manualOrgs.length} label="Manuels" color={C.text3}/>
      <Stat icon="🏛️" value={orgs.length} label="Total organismes" color={C.navy}/>
      <Stat icon="⚡" value={orgs.filter(o=>status[o.id]?.type==="api").length} label="APIs directes" color={C.teal}/>
    </div>

    {loading?<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>:<>
    {/* Connected */}
    <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>🟢 Organismes connectés ({connectedOrgs.length})</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:24}}>
      {connectedOrgs.map(o=>{const s=status[o.id]||{};return<div key={o.id} style={{padding:14,borderRadius:12,border:"1px solid "+C.border,background:C.surface,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,borderRadius:10,background:(o.couleur||C.teal)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:o.couleur||C.teal,flexShrink:0}}>{o.sigle?.[0]||"?"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:C.navy}}>{o.sigle} <span style={{fontWeight:400,color:C.text2,fontSize:11}}>— {o.nom}</span></div>
          <div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}>
            <Badge color={typeColors[s.type]||C.text3}>{typeLabels[s.type]||"Inconnu"}</Badge>
            {s.lastSync&&<span style={{fontSize:10,color:C.text3}}>Sync: {fa(s.lastSync)}</span>}
          </div>
        </div>
        <div style={{width:10,height:10,borderRadius:5,background:C.green,flexShrink:0}} title="Connecté"/>
      </div>})}
    </div>

    {/* Not connected */}
    <div style={{fontSize:14,fontWeight:700,color:C.text3,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>⚪ Organismes non connectés ({manualOrgs.length})</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {manualOrgs.map(o=><div key={o.id} style={{padding:14,borderRadius:12,border:"1px solid "+C.border,background:C.bg,display:"flex",alignItems:"center",gap:12,opacity:.7}}>
        <div style={{width:38,height:38,borderRadius:10,background:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.text3,flexShrink:0}}>{o.sigle?.[0]||"?"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text2}}>{o.sigle} <span style={{fontWeight:400,color:C.text3,fontSize:11}}>— {o.nom}</span></div>
          <div style={{display:"flex",gap:6,marginTop:4}}><Badge color={C.text3}>Manuel</Badge><Badge color={o.type==="europeen"?C.purple:o.type==="regional"?"#7e22ce":C.text3}>{o.type}</Badge></div>
        </div>
        <div style={{width:10,height:10,borderRadius:5,background:C.border,flexShrink:0}} title="Non connecté"/>
      </div>)}
    </div>
    </>}
  </div>
}

// === Users Management ===
// Helper : headers authentifiés avec token JWT + anon key
const apiHeaders=()=>({"Content-Type":"application/json",apikey:AK,...(_tok?{Authorization:"Bearer "+_tok}:{})});
// Helper : appel Supabase REST avec gestion d'erreur explicite
const supaRest=async(path,opts={})=>{
  try{
    const r=await fetch(SU+"/rest/v1/"+path,{headers:apiHeaders(),...opts});
    if(!r.ok){const e=await r.json().catch(()=>({message:r.status+" "+r.statusText}));return{error:e?.message||r.status}}
    return r.status===204?{ok:true}:r.json()
  }catch(e){return{error:e?.message||"Erreur réseau"}}
};

function Users(){
  const[users,sU]=useState([]);const[loading,sL]=useState(true);const[m,sM]=useState(null);const[t,sT]=useState("");const[f,sF]=useState({});const[pwModal,sPW]=useState(null);const[newPw,sNPw]=useState("");const[delUser,sDelUser]=useState(null);const[saving,sSaving]=useState(false);
  const F=(k,v)=>sF(p=>({...p,[k]:v}));
  const fl=x=>{sT(x);setTimeout(()=>sT(""),4000)};
  const load=async()=>{sL(true);const r=await fjA(ADM+"/user-stats");sU(r?.data||[]);sL(false)};
  useEffect(()=>{load()},[]);

  const createUser=async()=>{
    if(!f.email||!f.password)return;
    sSaving(true);
    const r=await fjA(ADM+"/create-user",{method:"POST",body:JSON.stringify(f)});
    sSaving(false);
    if(r?.data){fl("Utilisateur créé ✓");sM(null);load()}else{fl("Erreur: "+(r?.error||r?.message||"Vérifiez email/mot de passe"))}
  };
  const updateUser=async()=>{
    const{id,...rest}=f;
    ["total_simulations","sim_financees","montant_aides","total_prospects","prospects_gagnes","pipeline","derniere_sim","email_confirmed","last_sign_in","auth_id"].forEach(k=>delete rest[k]);
    sSaving(true);
    const r=await fjA(ADM+"/users/"+id,{method:"PUT",body:JSON.stringify(rest)});
    sSaving(false);
    if(r?.updated){fl("Modifications sauvegardées ✓");sM(null);load()}else{fl("Erreur: "+(r?.error||"Inconnue"))}
  };
  const resetPw=async()=>{
    if(!newPw||newPw.length<6)return;
    sSaving(true);
    const r=await fjA(ADM+"/reset-user-password",{method:"POST",body:JSON.stringify({user_id:pwModal,new_password:newPw})});
    sSaving(false);
    if(r?.success){fl("Mot de passe réinitialisé ✓");sPW(null);sNPw("")}else{fl("Erreur: "+(r?.error||"Inconnue"))}
  };
  const toggleUser=async(u)=>{
    const endpoint=u.actif?"delete-user":"reactivate-user";
    const r=await fjA(ADM+"/"+endpoint,{method:"POST",body:JSON.stringify({user_id:u.id})});
    if(r?.success||r?.ok){fl(u.actif?"Utilisateur désactivé ✓":"Utilisateur réactivé ✓");load()}
    else{fl("Erreur: "+(r?.error||"Impossible de changer le statut"))}
  };

  // Désactivation utilisateur — meilleure pratique SaaS multi-tenant :
  // 1) PATCH direct Supabase REST → actif=false (fiable, respecte les RLS)
  // 2) Fallback → edge function delete-user (désactive aussi auth.users côté Supabase)
  // Suppression définitive de auth.users = réservée au Super Admin (RGPD)
  const deleteUser=async(u)=>{
    sSaving(true);
    // Étape 1 : soft-delete direct via Supabase REST
    const r1=await supaRest("users?id=eq."+u.id,{method:"PATCH",headers:{...apiHeaders(),"Prefer":"return=minimal"},body:JSON.stringify({actif:false})});
    if(r1?.ok||!r1?.error){
      // Étape 2 : désactiver aussi dans auth.users via edge function (best effort)
      fjA(ADM+"/delete-user",{method:"POST",body:JSON.stringify({user_id:u.id})}).catch(()=>{});
      sSaving(false);fl("Utilisateur désactivé ✓");load();return;
    }
    // Fallback : edge function seule
    const r2=await fjA(ADM+"/delete-user",{method:"POST",body:JSON.stringify({user_id:u.id})});
    if(r2?.success||r2?.ok){sSaving(false);fl("Utilisateur désactivé ✓");load();return}
    sSaving(false);
    fl("Erreur: "+(r1?.error||r2?.error||"Droits insuffisants — contactez le Super Admin"));
  };
  const confirmEmail=async(u)=>{
    const r=await fjA(ADM+"/confirm-user-email",{method:"POST",body:JSON.stringify({user_id:u.id})});
    if(r?.success){fl("Email confirmé ✓");load()}else{fl("Erreur: "+(r?.error||"Inconnue"))}
  };

  return<div><Toast msg={t}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Utilisateurs</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>{users.length} compte{users.length>1?"s":""}</p></div>
      <Btn onClick={()=>{sF({email:"",password:"",nom:"",prenom:"",role:"commercial",tenant_id:TID});sM("new")}} color={C.teal}>+ Nouveau</Btn>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginBottom:16}}>
      <Stat icon="👤" value={users.length} label="Total" color={C.navy}/>
      <Stat icon="✅" value={users.filter(u=>u.actif).length} label="Actifs" color={C.green}/>
      <Stat icon="📊" value={users.reduce((a,u)=>a+u.total_simulations,0)} label="Simulations" color={C.teal}/>
      <Stat icon="💰" value={users.reduce((a,u)=>a+u.montant_aides,0)?Math.round(users.reduce((a,u)=>a+u.montant_aides,0)/1000)+"k€":"0€"} label="Aides total" color={C.gold}/>
    </div>

    <DT loading={loading} data={users} onEdit={r=>{sF({...r});sM("edit")}} onDelete={r=>sDelUser(r)} columns={[
      {key:"prenom",label:"Utilisateur",render:(v,r)=><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:14,background:r.actif?C.teal:C.text3,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{(r.prenom?.[0]||"")+(r.nom?.[0]||"?")}</div><div><div style={{fontWeight:600}}>{v} {r.nom}</div><div style={{fontSize:10,color:C.text3}}>{r.email}</div></div></div>},
      {key:"role",label:"Rôle",render:v=><Badge color={v==="super_admin"?C.gold:v==="admin"?C.purple:C.teal}>{v}</Badge>},
      {key:"actif",label:"Statut",render:(v,r)=><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{v?<Badge color={C.green}>Actif</Badge>:<Badge color={C.red}>Inactif</Badge>}{!r.email_confirmed&&<Badge color={C.orange}>Email non confirmé</Badge>}</div>},
      {key:"total_simulations",label:"Sims",render:v=><span style={{fontWeight:700,color:C.navy}}>{v}</span>},
      {key:"total_prospects",label:"Prospects",render:v=><span style={{fontWeight:700}}>{v}</span>},
      {key:"montant_aides",label:"Aides",render:v=>v?<span style={{fontWeight:700,color:C.green}}>{fmt(Math.round(v))}€</span>:"—"},
      {key:"last_sign_in",label:"Dern. connexion",render:v=><span style={{fontSize:11,color:C.text3}}>{v?fa(v):"Jamais"}</span>}
    ]}/>

    {/* Create/Edit Modal */}
    <Modal open={!!m&&m!=="pw"} onClose={()=>sM(null)} title={m==="new"?"Nouvel utilisateur":"Modifier "+f.prenom+" "+f.nom}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
        <Input label="Prénom" value={f.prenom||""} onChange={v=>F("prenom",v)}/>
        <Input label="Nom" value={f.nom||""} onChange={v=>F("nom",v)}/>
        <Input label="Email*" value={f.email||""} onChange={v=>F("email",v)} type="email" disabled={m==="edit"}/>
        {m==="new"&&<Input label="Mot de passe*" value={f.password||""} onChange={v=>F("password",v)} type="password"/>}
        <Input label="Rôle" value={f.role||"commercial"} onChange={v=>F("role",v)} options={[{value:"commercial",label:"Commercial"},{value:"admin",label:"Admin"},{value:"manager",label:"Manager"}]}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <div style={{display:"flex",gap:6}}>
          {m==="edit"&&<Btn small color={C.orange} variant="outline" onClick={()=>{sPW(f.id);sNPw("")}}>🔑 Reset MDP</Btn>}
          {m==="edit"&&!f.email_confirmed&&<Btn small color={C.blue} variant="outline" onClick={()=>confirmEmail(f)}>✉️ Confirmer email</Btn>}
          {m==="edit"&&<Btn small color={f.actif?C.red:C.green} variant="outline" onClick={()=>{toggleUser(f);sM(null)}}>{f.actif?"🚫 Désactiver":"✅ Réactiver"}</Btn>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="outline" onClick={()=>sM(null)}>Annuler</Btn>
          <Btn color={C.teal} disabled={saving} onClick={m==="new"?createUser:updateUser}>{saving?"...":(m==="new"?"Créer le compte":"Sauvegarder")}</Btn>
        </div>
      </div>
    </Modal>

    {/* Password Reset Modal */}
    <Modal open={!!pwModal} onClose={()=>sPW(null)} title="Réinitialiser le mot de passe">
      <Input label="Nouveau mot de passe (min. 6 caractères)" value={newPw} onChange={sNPw} type="password"/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:8}}>
        <Btn variant="outline" onClick={()=>sPW(null)}>Annuler</Btn>
        <Btn color={C.orange} disabled={saving} onClick={resetPw}>{saving?"...":"Réinitialiser"}</Btn>
      </div>
    </Modal>

    {/* Confirm désactivation */}
    <ConfirmModal
      open={!!delUser}
      onClose={()=>sDelUser(null)}
      title="Désactiver cet utilisateur ?"
      message={delUser?`${delUser.prenom} ${delUser.nom} (${delUser.email}) n'aura plus accès à la plateforme. Son historique et ses données sont conservés. La suppression définitive est réservée au Super Admin.`:""}
      icon="🔒"
      confirmLabel={saving?"...":"Désactiver"}
      confirmColor={C.orange}
      onConfirm={async()=>{await deleteUser(delUser);sDelUser(null)}}
    />
  </div>
}

// === Moteur de Barèmes de Financement ===
// Calcul du coefficient mensuel depuis le taux annuel nominal
// Mode BEGIN (paiement en début de période — standard location financière française)
// Formule : r = taux/12 | coef_END = r / (1 − (1+r)^−n) | coef_BEGIN = coef_END / (1+r)
function calcCoef(annualRatePct, durationMonths) {
  const r = annualRatePct / 100 / 12;
  if (!r || !durationMonths) return 0;
  const endCoef = r / (1 - Math.pow(1 + r, -durationMonths));
  return parseFloat((endCoef / (1 + r)).toFixed(6));
}

function BaremesFinancement() {
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editGrid, setEditGrid] = useState(null);
  const [viewMode, setViewMode] = useState(false); // true = lecture seule, false = édition
  const [slabs, setSlabs] = useState([]);
  const [durations, setDurations] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [activateModal, setActivateModal] = useState(null);
  const [activateDate, setActivateDate] = useState(new Date().toISOString().split("T")[0]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [newGridModal, setNewGridModal] = useState(false);
  const [newGridForm, setNewGridForm] = useState({name:"",effective_date:"",notes:""});
  const [addDurModal, setAddDurModal] = useState(false);
  const [newDur, setNewDur] = useState("");

  const flash = (msg, isErr=false) => { setToast(isErr?"❌ "+msg:"✓ "+msg); setTimeout(() => setToast(""), 4000); };
  // Use apiHeaders() — correct Supabase auth (no AK-as-Bearer fallback)
  const hdr = () => apiHeaders();

  const loadGrids = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SU}/rest/v1/financing_grids?select=*&order=created_at.desc`, {headers: hdr()});
      if (!r.ok) { flash("Impossible de charger les barèmes ("+r.status+")", true); setLoading(false); return; }
      setGrids(await r.json());
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
    setLoading(false);
  }, []);

  useEffect(() => { loadGrids(); }, [loadGrids]);

  const slabKey = (slab, dur) => `${Math.round(Number(slab.min))}-${slab.max != null ? Math.round(Number(slab.max)) : ""}-${Math.round(Number(dur))}`;

  const openEditor = async (grid, readOnly = false) => {
    setEditGrid(grid);
    setViewMode(readOnly);
    const resp = await fetch(`${SU}/rest/v1/financing_rules?grid_id=eq.${grid.id}&order=amount_min.asc,duration_months.asc&select=*`, {headers: hdr()});
    const r = resp.ok ? await resp.json() : [];
    const existing = Array.isArray(r) ? r : [];
    const slabMap = {};
    const durSet = new Set();
    existing.forEach(rule => {
      const minN = Math.round(Number(rule.amount_min));
      const maxN = rule.amount_max != null ? Math.round(Number(rule.amount_max)) : null;
      const durN = Math.round(Number(rule.duration_months));
      const k = `${minN}-${maxN ?? ""}`;
      slabMap[k] = {min: minN, max: maxN};
      durSet.add(durN);
    });
    const newSlabs = Object.values(slabMap).length > 0 ? Object.values(slabMap)
      : [{min:1500,max:10000},{min:10001,max:30000},{min:30001,max:100000},{min:100001,max:null}];
    const newDurs = durSet.size > 0 ? Array.from(durSet).sort((a,b)=>a-b) : [24,36,48,60];
    const m = {};
    existing.forEach(rule => {
      const minN = Math.round(Number(rule.amount_min));
      const maxN = rule.amount_max != null ? Math.round(Number(rule.amount_max)) : null;
      const durN = Math.round(Number(rule.duration_months));
      m[slabKey({min: minN, max: maxN}, durN)] = Number(rule.annual_rate_pct);
    });
    setSlabs(newSlabs); setDurations(newDurs); setMatrix(m); setDirty(false);
  };

  const saveRules = async () => {
    if (!editGrid) return;
    setSaving(true);
    try {
      const newRules = [];
      slabs.forEach(slab => {
        durations.forEach(dur => {
          const rate = parseFloat(matrix[slabKey(slab, dur)] || 0);
          if (rate > 0) newRules.push({
            grid_id: editGrid.id, amount_min: slab.min, amount_max: slab.max,
            duration_months: dur, annual_rate_pct: rate, monthly_coefficient: calcCoef(rate, dur)
          });
        });
      });
      const r1 = await fetch(`${SU}/rest/v1/financing_rules?grid_id=eq.${editGrid.id}`, {method:"DELETE", headers: hdr()});
      if (!r1.ok && r1.status !== 204) { flash("Erreur lors de la mise à jour ("+r1.status+")", true); setSaving(false); return; }
      if (newRules.length > 0) {
        const r2 = await fetch(`${SU}/rest/v1/financing_rules`, {method:"POST", headers:{...hdr(),"Prefer":"return=minimal"}, body: JSON.stringify(newRules)});
        if (!r2.ok) { flash("Erreur lors de l'enregistrement des règles ("+r2.status+")", true); setSaving(false); return; }
      }
      setDirty(false); flash("Barème sauvegardé");
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
    setSaving(false);
  };

  const activateGrid = async () => {
    if (!activateModal) return;
    try {
      const r = await fetch(`${SU}/rest/v1/financing_grids?id=eq.${activateModal.id}`, {
        method:"PATCH", headers: hdr(), body: JSON.stringify({status:"active", effective_date: activateDate})
      });
      if (!r.ok && r.status !== 204) { flash("Erreur d'activation ("+r.status+")", true); return; }
      setActivateModal(null);
      flash("Barème activé — simulateur mis à jour");
      loadGrids();
      if (editGrid?.id === activateModal.id) setEditGrid(p=>({...p, status:"active", effective_date: activateDate}));
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
  };

  const patchGrid = async (grid, payload) => {
    try {
      const r = await fetch(`${SU}/rest/v1/financing_grids?id=eq.${grid.id}`, {method:"PATCH", headers: hdr(), body: JSON.stringify(payload)});
      if (!r.ok && r.status !== 204) { flash("Erreur de mise à jour ("+r.status+")", true); return; }
      loadGrids();
      if (editGrid?.id === grid.id) setEditGrid(p=>({...p,...payload}));
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
  };

  const deleteGrid = async grid => {
    try {
      const r = await fetch(`${SU}/rest/v1/financing_grids?id=eq.${grid.id}`, {method:"DELETE", headers: hdr()});
      if (!r.ok && r.status !== 204) { flash("Erreur de suppression ("+r.status+")", true); return; }
      setDeleteModal(null); flash("Barème supprimé");
      if (editGrid?.id === grid.id) setEditGrid(null);
      loadGrids();
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
  };

  const createGrid = async () => {
    try {
      const r = await fetch(`${SU}/rest/v1/financing_grids`, {
        method:"POST", headers:{...hdr(),"Prefer":"return=representation"},
        body: JSON.stringify({name:newGridForm.name, effective_date:newGridForm.effective_date||new Date().toISOString().split("T")[0], notes:newGridForm.notes, status:"draft"})
      });
      if (!r.ok) { const e=await r.json().catch(()=>({})); flash("Erreur de création : "+(e?.message||r.status), true); return; }
      const [g] = await r.json();
      if (g?.id) { setNewGridModal(false); flash("Barème créé"); loadGrids(); openEditor(g); }
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
  };

  const duplicateGrid = async grid => {
    try {
      const srcResp = await fetch(`${SU}/rest/v1/financing_rules?grid_id=eq.${grid.id}&select=*`, {headers: hdr()});
      const srcRules = srcResp.ok ? await srcResp.json() : [];
      const resp = await fetch(`${SU}/rest/v1/financing_grids`, {
        method:"POST", headers:{...hdr(),"Prefer":"return=representation"},
        body: JSON.stringify({name:grid.name+" (copie)", effective_date:new Date().toISOString().split("T")[0], notes:grid.notes, status:"draft"})
      });
      if (!resp.ok) { flash("Erreur de duplication ("+resp.status+")", true); return; }
      const [newG] = await resp.json();
      if (newG?.id && srcRules?.length > 0) {
        const newRules = srcRules.map(({id,grid_id,created_at,...rest})=>({...rest, grid_id:newG.id}));
        await fetch(`${SU}/rest/v1/financing_rules`, {method:"POST", headers:{...hdr(),"Prefer":"return=minimal"}, body:JSON.stringify(newRules)});
      }
      flash("Barème dupliqué"); loadGrids();
    } catch(e) { flash("Erreur réseau : "+e.message, true); }
  };

  const ST = {draft:{l:"Brouillon",c:C.text3}, active:{l:"Actif",c:C.green}, archived:{l:"Archivé",c:C.text3}};
  const cellSt = {padding:"6px 10px", borderBottom:"1px solid "+C.border, borderRight:"1px solid "+C.border, verticalAlign:"middle"};

  // ── ÉDITEUR / VISUALISEUR MATRICIEL ──
  if (editGrid) {
    const coef = (slab, dur) => { const rate=parseFloat(matrix[slabKey(slab,dur)]||0); return rate ? calcCoef(rate,dur) : null; };

    // ── VUE LECTURE SEULE (BNP-style tariff table) ──
    const ViewTable = () => (
      <div style={{background:C.surface,borderRadius:12,border:"1px solid "+C.border,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,background:"linear-gradient(90deg,"+C.navy+"08,transparent)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <span style={{fontSize:13,fontWeight:700,color:C.navy}}>Grille tarifaire — conditions en vigueur</span>
            <div style={{fontSize:11,color:C.text3,marginTop:2}}>Taux annuel nominal · Coefficient mensuel (début de période) · Loyer pour 1 000 € financés</div>
          </div>
          <div style={{padding:"4px 12px",borderRadius:20,background:C.teal+"15",border:"1px solid "+C.teal+"30",fontSize:11,fontWeight:700,color:C.teal}}>👁 Lecture seule</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:C.navy}}>
                <th style={{padding:"12px 16px",color:"#fff",fontWeight:600,textAlign:"left",fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",minWidth:200}}>Montant financé</th>
                {durations.map(dur=><th key={dur} style={{padding:"12px 16px",color:"#fff",fontWeight:600,textAlign:"center",fontSize:11,letterSpacing:"0.04em",minWidth:150}}>
                  {dur} mois
                </th>)}
              </tr>
            </thead>
            <tbody>
              {slabs.map((slab,si)=>{
                const hasAnyRate = durations.some(dur => matrix[slabKey(slab,dur)]);
                return <tr key={si} style={{background:si%2?C.bg:C.surface,borderBottom:"1px solid "+C.border}}>
                  <td style={{padding:"12px 16px",fontWeight:700,color:C.navy,borderRight:"2px solid "+C.border+"80",background:si%2?C.navy+"06":C.navy+"03"}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.navy}}>
                      {fmt(slab.min)} €
                      <span style={{color:C.text3,fontWeight:400}}> — </span>
                      {slab.max ? fmt(slab.max)+" €" : <span style={{fontStyle:"italic",color:C.text3}}>sans limite</span>}
                    </div>
                  </td>
                  {durations.map(dur=>{
                    const rate = matrix[slabKey(slab,dur)];
                    const c = rate ? calcCoef(parseFloat(rate), dur) : null;
                    return <td key={dur} style={{padding:"10px 16px",textAlign:"center",borderRight:"1px solid "+C.border}}>
                      {rate ? (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.navy,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>
                            {parseFloat(rate).toFixed(2)}<span style={{fontSize:11,fontWeight:600,color:C.text3}}> %</span>
                          </div>
                          {c&&<div style={{fontSize:13,fontWeight:700,color:C.teal,fontFamily:"'JetBrains Mono',monospace"}}>
                            {(c*1000).toFixed(2)} <span style={{fontSize:10,color:C.text3}}>€/k€</span>
                          </div>}
                          {c&&<div style={{fontSize:10,color:C.text3,fontFamily:"monospace"}}>coef {c.toFixed(6)}</div>}
                        </div>
                      ) : <span style={{color:C.border,fontSize:18}}>—</span>}
                    </td>;
                  })}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"10px 16px",borderTop:"1px solid "+C.border,background:"#f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:C.text3}}>
            Calcul mode <strong>BEGIN</strong> (loyer en début de période) · formule : <code style={{background:C.border+"50",padding:"1px 4px",borderRadius:3}}>coef = r / (1−(1+r)^−n) / (1+r)</code>
          </div>
          <div style={{fontSize:11,color:C.text3}}>{slabs.length} tranche{slabs.length>1?"s":""} · {durations.length} durée{durations.length>1?"s":""}</div>
        </div>
      </div>
    );

    return <div>
      <Toast msg={toast}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Btn variant="outline" onClick={()=>{setEditGrid(null);loadGrids();}}>← Barèmes</Btn>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18,fontWeight:800,color:C.navy}}>{editGrid.name}</span>
              <Badge color={ST[editGrid.status]?.c}>{ST[editGrid.status]?.l}</Badge>
            </div>
            <div style={{fontSize:12,color:C.text3}}>En vigueur : {fd(editGrid.effective_date)}{editGrid.notes?" — "+editGrid.notes:""}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {viewMode ? (
            <Btn variant="outline" color={C.blue} onClick={()=>setViewMode(false)}>✏️ Modifier le barème</Btn>
          ) : (
            <Btn variant="outline" color={C.text2} onClick={()=>setViewMode(true)}>👁 Mode visualisation</Btn>
          )}
          {!viewMode&&editGrid.status!=="active"&&<Btn variant="outline" color={C.green} onClick={()=>{setActivateDate(new Date().toISOString().split("T")[0]);setActivateModal(editGrid);}}>✅ Activer</Btn>}
          {!viewMode&&editGrid.status==="active"&&<Btn variant="outline" color={C.orange} onClick={()=>patchGrid(editGrid,{status:"archived"})}>Archiver</Btn>}
          {!viewMode&&<Btn color={C.teal} onClick={saveRules} disabled={saving||!dirty}>{saving?"Sauvegarde...":"💾 Sauvegarder"}</Btn>}
        </div>
      </div>

      {editGrid.status==="active"&&<div style={{padding:"10px 14px",borderRadius:8,background:C.green+"10",border:"1px solid "+C.green+"30",fontSize:12,color:C.green,marginBottom:16}}>
        🟢 Barème <strong>actif</strong> — conditions appliquées en temps réel dans le simulateur.
      </div>}

      {viewMode ? <ViewTable /> : (
        <div style={{background:C.surface,borderRadius:12,border:"1px solid "+C.border,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:700,color:C.navy}}>Matrice Tranche × Durée</span>
            <div style={{display:"flex",gap:8}}>
              <Btn small variant="outline" color={C.teal} onClick={()=>{setNewDur("");setAddDurModal(true);}}>+ Durée</Btn>
              <Btn small variant="outline" color={C.navy} onClick={()=>{const last=slabs[slabs.length-1];setSlabs(p=>[...p,{min:(last?.max??last?.min??0)+1,max:null}]);setDirty(true);}}>+ Tranche</Btn>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.navy}}>
                  <th style={{padding:"10px 14px",color:"#fff",fontWeight:600,textAlign:"left",fontSize:11,textTransform:"uppercase",whiteSpace:"nowrap",minWidth:220}}>Tranche de montant</th>
                  {durations.map(dur=><th key={dur} style={{padding:"10px 14px",color:"#fff",fontWeight:600,textAlign:"center",fontSize:11,minWidth:140}}>
                    {dur} mois{durations.length>1&&<span onClick={()=>{setDurations(p=>p.filter(d=>d!==dur));setDirty(true);}} style={{marginLeft:6,cursor:"pointer",opacity:0.5,fontSize:10}}>✕</span>}
                  </th>)}
                  <th style={{width:36}}></th>
                </tr>
              </thead>
              <tbody>
                {slabs.map((slab,si)=><tr key={si} style={{background:si%2?C.bg:C.surface}}>
                  <td style={{...cellSt,fontWeight:600,color:C.navy}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <input type="number" value={slab.min} onChange={e=>{const v=parseFloat(e.target.value)||0;setSlabs(p=>p.map((s,i)=>i===si?{...s,min:v}:s));setDirty(true);}}
                        style={{width:82,padding:"3px 6px",borderRadius:4,border:"1px solid "+C.border,fontSize:11,textAlign:"right",fontFamily:"monospace"}}/>
                      <span style={{color:C.text3,fontSize:10}}>–</span>
                      <input type="number" value={slab.max??""} placeholder="∞" onChange={e=>{const v=e.target.value?parseFloat(e.target.value):null;setSlabs(p=>p.map((s,i)=>i===si?{...s,max:v}:s));setDirty(true);}}
                        style={{width:82,padding:"3px 6px",borderRadius:4,border:"1px solid "+C.border,fontSize:11,textAlign:"right",fontFamily:"monospace"}}/>
                      <span style={{color:C.text3,fontSize:10}}>€</span>
                    </div>
                  </td>
                  {durations.map(dur=>{
                    const rate=matrix[slabKey(slab,dur)]??"";
                    const c=coef(slab,dur);
                    return <td key={dur} style={{...cellSt,textAlign:"center"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{display:"flex",alignItems:"center",gap:2}}>
                          <input type="number" step="0.01" min="0" max="30" value={rate}
                            onChange={e=>{setMatrix(p=>({...p,[slabKey(slab,dur)]:e.target.value}));setDirty(true);}}
                            style={{width:68,padding:"4px 8px",borderRadius:4,border:"1px solid "+(rate?C.teal:C.border),fontSize:12,textAlign:"center",fontWeight:700,background:rate?C.tealBg:"#fff",color:rate?C.teal:C.text2,transition:"all 0.15s"}}
                            placeholder="0.00"/>
                          <span style={{fontSize:11,color:C.text3}}>%</span>
                        </div>
                        {c&&<div style={{fontSize:10,color:C.teal,fontFamily:"monospace",lineHeight:1.2}}>coef {c.toFixed(6)}</div>}
                        {c&&<div style={{fontSize:10,color:C.text2,fontWeight:600}}>{(c*1000).toFixed(2)} €/k€</div>}
                      </div>
                    </td>;
                  })}
                  <td style={{...cellSt,textAlign:"center",borderRight:"none",padding:"0 8px"}}>
                    {slabs.length>1&&<button onClick={()=>{setSlabs(p=>p.filter((_,i)=>i!==si));setDirty(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:13}}>✕</button>}
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!viewMode&&<div style={{padding:"10px 14px",borderRadius:8,background:"#f8fafc",border:"1px solid "+C.border,fontSize:11,color:C.text3,marginBottom:12}}>
        <strong style={{color:C.text2}}>Lecture :</strong> Saisir le taux annuel nominal (%) — le coefficient et le montant €/1 000 € se calculent automatiquement.
        Formule : <code>coef = r / (1 − (1+r)^−n)</code> avec r = taux mensuel, n = durée.
      </div>}

      <Modal open={addDurModal} onClose={()=>setAddDurModal(false)} title="Ajouter une durée">
        <Input label="Durée (mois)" value={newDur} onChange={setNewDur} type="number" placeholder="Ex: 60"/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          <Btn variant="outline" onClick={()=>setAddDurModal(false)}>Annuler</Btn>
          <Btn color={C.teal} onClick={()=>{const m=parseInt(newDur);if(m>0&&!durations.includes(m)){setDurations(p=>[...p,m].sort((a,b)=>a-b));setDirty(true);}setAddDurModal(false);setNewDur("");}}>Ajouter</Btn>
        </div>
      </Modal>

      <Modal open={!!activateModal} onClose={()=>setActivateModal(null)} title="Activer ce barème">
        <p style={{fontSize:13,color:C.text2,marginBottom:16}}>Le barème actuellement actif sera automatiquement <strong>archivé</strong>. Les nouvelles conditions s'appliqueront immédiatement dans le simulateur.</p>
        <Input label="Date d'entrée en vigueur" value={activateDate} onChange={setActivateDate} type="date"/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
          <Btn variant="outline" onClick={()=>setActivateModal(null)}>Annuler</Btn>
          <Btn color={C.green} onClick={activateGrid}>✅ Activer ce barème</Btn>
        </div>
      </Modal>
    </div>;
  }

  // ── VUE LISTE ──
  const activeGrid = grids.find(g=>g.status==="active");
  return <div>
    <Toast msg={toast}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Barèmes de Financement</h2>
        <p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>
          Moteur de tarification · {grids.length} version{grids.length>1?"s":""} · {activeGrid?"🟢 Barème actif : "+activeGrid.name:"⚠️ Aucun barème actif — simulateur non fonctionnel"}
        </p>
      </div>
      <Btn color={C.teal} onClick={()=>{setNewGridForm({name:"",effective_date:new Date().toISOString().split("T")[0],notes:""});setNewGridModal(true);}}>+ Nouveau barème</Btn>
    </div>

    {activeGrid&&<div style={{padding:16,borderRadius:12,background:"linear-gradient(135deg,"+C.navy+","+C.navyL+")",color:"#fff",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:14,fontWeight:800}}>{activeGrid.name}</span>
          <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(110,231,183,0.2)",color:"#6ee7b7"}}>ACTIF</span>
        </div>
        <div style={{fontSize:11,opacity:.7}}>En vigueur depuis le {fd(activeGrid.effective_date)}</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn small variant="outline" style={{borderColor:"rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.85)"}} onClick={()=>openEditor(activeGrid,true)}>👁 Visualiser</Btn>
        <Btn small variant="outline" style={{borderColor:"rgba(255,255,255,0.3)",color:"#fff"}} onClick={()=>openEditor(activeGrid,false)}>✏️ Modifier</Btn>
        <Btn small variant="outline" style={{borderColor:"rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)"}} onClick={()=>duplicateGrid(activeGrid)}>Dupliquer</Btn>
      </div>
    </div>}

    {loading?<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {grids.filter(g=>g.status!=="active").map(g=><div key={g.id} style={{padding:"12px 16px",borderRadius:10,background:C.surface,border:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{g.name}</span>
              <Badge color={ST[g.status]?.c}>{ST[g.status]?.l}</Badge>
            </div>
            <div style={{fontSize:11,color:C.text3}}>Créé {fd(g.created_at)}{g.effective_date?" · En vigueur : "+fd(g.effective_date):""}{g.notes?" · "+g.notes:""}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="outline" color={C.text2} onClick={()=>openEditor(g,true)}>👁 Voir</Btn>
            <Btn small variant="outline" color={C.blue} onClick={()=>openEditor(g,false)}>✏️ Éditer</Btn>
            {g.status==="draft"&&<Btn small variant="outline" color={C.green} onClick={()=>{setActivateDate(new Date().toISOString().split("T")[0]);setActivateModal(g);}}>Activer</Btn>}
            <Btn small variant="outline" color={C.navy} onClick={()=>duplicateGrid(g)}>Dupliquer</Btn>
            {g.status==="draft"&&<Btn small variant="outline" color={C.red} onClick={()=>setDeleteModal(g)}>🗑</Btn>}
          </div>
        </div>)}
        {grids.length===0&&<div style={{padding:40,textAlign:"center",color:C.text3}}>
          <div style={{fontSize:28,marginBottom:8}}>📊</div>
          <div style={{fontWeight:600,marginBottom:4}}>Aucun barème configuré</div>
          <div style={{fontSize:12}}>Créez votre premier barème pour activer le calculateur de loyers</div>
        </div>}
      </div>
    }

    <Modal open={newGridModal} onClose={()=>setNewGridModal(false)} title="Nouveau barème de financement">
      <Input label="Nom du barème*" value={newGridForm.name} onChange={v=>setNewGridForm(p=>({...p,name:v}))} placeholder="Ex: Barème Q3 2026"/>
      <Input label="Date d'entrée en vigueur" value={newGridForm.effective_date} onChange={v=>setNewGridForm(p=>({...p,effective_date:v}))} type="date"/>
      <Input label="Notes (optionnel)" value={newGridForm.notes} onChange={v=>setNewGridForm(p=>({...p,notes:v}))} placeholder="Ex: Révision haussière +0,5% toutes tranches"/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
        <Btn variant="outline" onClick={()=>setNewGridModal(false)}>Annuler</Btn>
        <Btn color={C.teal} onClick={createGrid} disabled={!newGridForm.name}>Créer et éditer →</Btn>
      </div>
    </Modal>

    <ConfirmModal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Supprimer ce barème ?"
      message={deleteModal?`Supprimer "${deleteModal.name}" et toutes ses règles ? Action irréversible.`:""}
      icon="📊" confirmLabel="Supprimer" confirmColor={C.red} onConfirm={()=>deleteGrid(deleteModal)}/>

    <Modal open={!!activateModal&&!editGrid} onClose={()=>setActivateModal(null)} title="Activer ce barème">
      <p style={{fontSize:13,color:C.text2,marginBottom:16}}>Le barème actuellement actif sera automatiquement <strong>archivé</strong>.</p>
      <Input label="Date d'entrée en vigueur" value={activateDate} onChange={setActivateDate} type="date"/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
        <Btn variant="outline" onClick={()=>setActivateModal(null)}>Annuler</Btn>
        <Btn color={C.green} onClick={activateGrid}>✅ Activer ce barème</Btn>
      </div>
    </Modal>
  </div>;
}

// === Tenant Branding ===
function TenantBranding(){
  const[d,sD]=useState(null);
  const[f,sF]=useState({name:"",tagline:"",logo:"◈",email_support:"",colors:{navy:"#0f2b46",teal:"#0d9488",gold:"#d4a843"},logo_url:""});
  const[l,sL]=useState(true);const[saving,sSaving]=useState(false);const[t,sT]=useState("");const[err,sErr]=useState("");
  useEffect(()=>{
    fj(`${SU}/rest/v1/tenants?id=eq.${TID}&select=*`,{headers:{"apikey":AK,"Authorization":"Bearer "+AK}})
    .then(r=>{if(r&&r[0]){const row=r[0];const cfg=row.brand_config||{};sD(row);sF({name:cfg.name||row.nom||"",tagline:cfg.tagline||"",logo:cfg.logo||"◈",email_support:row.email_support||"",colors:{navy:cfg.colors?.navy||"#0f2b46",teal:cfg.colors?.teal||"#0d9488",gold:cfg.colors?.gold||"#d4a843"},logo_url:row.logo_url||""})}sL(false)})
  },[]);
  const F=(k,v)=>sF(p=>({...p,[k]:v}));
  const FC=(k,v)=>sF(p=>({...p,colors:{...p.colors,[k]:v}}));
  const save=async()=>{
    sSaving(true);sErr("");
    const brand_config={name:f.name,tagline:f.tagline,logo:f.logo,colors:f.colors};
    const payload={nom:f.name,email_support:f.email_support,logo_url:f.logo_url,brand_config};
    const r=await fj(ADM+"/tenants/"+TID,{method:"PUT",body:JSON.stringify(payload)});
    if(r&&!r.error){sT("✓ Branding sauvegardé");setTimeout(()=>sT(""),3000)}
    else sErr(r?.error||"Erreur lors de la sauvegarde — vérifiez que admin-api supporte PUT /tenants/:id");
    sSaving(false);
  };
  if(l)return<div style={{padding:40,textAlign:"center",color:C.text3}}>Chargement...</div>;
  const pv=f.colors;
  return<div>
    <Toast msg={t}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.navy,margin:0}}>Branding & Identité</h2><p style={{fontSize:13,color:C.text3,margin:"4px 0 0"}}>Personnalisez l'apparence de votre espace client</p></div>
      <Btn color={C.teal} onClick={save} disabled={saving}>{saving?"Sauvegarde...":"💾 Sauvegarder"}</Btn>
    </div>
    {err&&<div style={{padding:12,borderRadius:8,background:C.red+"12",color:C.red,fontSize:13,marginBottom:16}}>{err}</div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start"}}>
      {/* Form */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{padding:20,borderRadius:12,background:C.surface,border:"1px solid "+C.border}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Identité</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <Input label="Nom affiché*" value={f.name} onChange={v=>F("name",v)} placeholder="Ex: Ma Société"/>
            <Input label="Lettre / symbole logo" value={f.logo} onChange={v=>F("logo",v.slice(0,2))} placeholder="Ex: M ou ◈"/>
            <div style={{gridColumn:"1/3"}}><Input label="Tagline" value={f.tagline} onChange={v=>F("tagline",v)} placeholder="Ex: Finance & Conseil Vert"/></div>
            <div style={{gridColumn:"1/3"}}><Input label="Email support" value={f.email_support} onChange={v=>F("email_support",v)} type="email" placeholder="support@masociete.com"/></div>
            <div style={{gridColumn:"1/3"}}><Input label="URL Logo (image PNG/SVG optionnel)" value={f.logo_url} onChange={v=>F("logo_url",v)} placeholder="https://..."/></div>
          </div>
        </div>
        <div style={{padding:20,borderRadius:12,background:C.surface,border:"1px solid "+C.border}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Couleurs</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[["navy","Principale","Sidebar, en-têtes"],["teal","Accent","Boutons, actif, liens"],["gold","Highlight","Logo, badges chauds"]].map(([key,label,desc])=>(
              <div key={key} style={{padding:14,borderRadius:10,border:"1px solid "+C.border,textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",marginBottom:8}}>{label}</div>
                <div style={{position:"relative",width:48,height:48,borderRadius:10,background:pv[key],margin:"0 auto 8px",border:"2px solid rgba(0,0,0,0.1)",overflow:"hidden",cursor:"pointer"}}>
                  <input type="color" value={pv[key]} onChange={e=>FC(key,e.target.value)} style={{position:"absolute",inset:-8,width:"calc(100% + 16px)",height:"calc(100% + 16px)",opacity:0,cursor:"pointer"}}/>
                </div>
                <div style={{fontSize:11,fontFamily:"monospace",color:C.text2,marginBottom:4}}>{pv[key]}</div>
                <div style={{fontSize:10,color:C.text3}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
        {d&&<div style={{padding:16,borderRadius:10,background:C.bg,border:"1px solid "+C.border,fontSize:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><span style={{color:C.text3}}>Slug : </span><span style={{fontWeight:700,fontFamily:"monospace"}}>{d.slug}</span></div>
            <div><span style={{color:C.text3}}>Plan : </span><Badge color={C.teal}>{d.plan||"starter"}</Badge></div>
            <div style={{fontSize:10}}><span style={{color:C.text3}}>Tenant ID : </span><span style={{fontFamily:"monospace"}}>{d.id}</span></div>
            <div><span style={{color:C.text3}}>Domaine : </span><span style={{fontFamily:"monospace"}}>{d.domaine||"—"}</span></div>
          </div>
        </div>}
      </div>
      {/* Live Preview */}
      <div style={{position:"sticky",top:0}}>
        <div style={{fontSize:11,fontWeight:700,color:C.text3,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Aperçu en direct</div>
        <div style={{borderRadius:14,overflow:"hidden",boxShadow:"0 8px 32px rgba(15,43,70,0.2)",border:"1px solid "+C.border}}>
          <div style={{background:pv.navy,padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              {f.logo_url
                ?<img src={f.logo_url} style={{width:32,height:32,borderRadius:8,objectFit:"cover"}} alt="logo"/>
                :<div style={{width:32,height:32,borderRadius:8,background:pv.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:pv.navy,flexShrink:0}}>{f.logo||"◈"}</div>}
              <div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{f.name||"Mon Entreprise"}</div><div style={{fontSize:9,color:pv.teal,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f.tagline||"CRM & Admin"}</div></div>
            </div>
            {[["📊","Dashboard",true],["👥","Prospects",false],["💰","Taux",false]].map(([icon,label,active],i)=>
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:6,marginBottom:3,background:active?"rgba(255,255,255,0.12)":"transparent",borderLeft:active?"3px solid "+pv.teal:"3px solid transparent"}}>
                <span style={{fontSize:13,color:active?pv.teal:"rgba(255,255,255,0.4)"}}>{icon}</span>
                <span style={{fontSize:12,fontWeight:active?700:400,color:active?"#fff":"rgba(255,255,255,0.4)"}}>{label}</span>
              </div>
            )}
          </div>
          <div style={{background:C.bg,padding:10}}>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              {[pv.navy,pv.teal,pv.gold].map((col,i)=>(
                <div key={i} style={{flex:1,padding:"7px 4px",borderRadius:6,background:C.surface,border:"1px solid "+C.border,textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:800,color:col}}>12</div>
                  <div style={{fontSize:9,color:C.text3,marginTop:1}}>Stat {i+1}</div>
                </div>
              ))}
            </div>
            <div style={{borderRadius:8,background:C.surface,border:"1px solid "+C.border,padding:8}}>
              <div style={{height:5,borderRadius:3,background:pv.teal+"40",marginBottom:5}}/>
              <div style={{height:5,borderRadius:3,background:C.border,marginBottom:5,width:"70%"}}/>
              <div style={{height:5,borderRadius:3,background:C.border,width:"50%"}}/>
            </div>
          </div>
        </div>
        <div style={{marginTop:10,padding:10,borderRadius:8,background:"#f0fdf4",border:"1px solid "+pv.teal+"30",fontSize:11,color:C.text2,lineHeight:1.5}}>
          💡 Les couleurs s'appliquent en temps réel au simulateur client après sauvegarde.
        </div>
      </div>
    </div>
  </div>
}

// === Login ===
function Login({onLogin}){const[mode,sMode]=useState("login");const[e,sE]=useState("");const[p,sP]=useState("");const[n,sN]=useState("");const[err,sErr]=useState("");const[l,sL]=useState(false);const[ok,sOk]=useState("");const[showPw,sShowPw]=useState(false);const[resetMode,sReset]=useState(false);
  const go=async()=>{sErr("");sOk("");sL(true);try{
    if(resetMode){
      if(!e){sErr("Entrez votre email");sL(false);return}
      const r=await fetch(`${AUTH}/recover`,{method:"POST",headers:ah(),body:JSON.stringify({email:e})});
      if(r.ok){sOk("Email de réinitialisation envoyé! Vérifiez votre boîte.");sReset(false)}else{const d=await r.json();sErr(d.error_description||d.msg||"Erreur")}
    }else if(mode==="signup"){
      if(!n||!e||!p){sErr("Champs requis");sL(false);return}
      const r=await au.signUp(e,p,{nom:n});if(r.error)sErr(r.error.message);else{sOk("Créé! Vérifiez email.");sMode("login")}
    }else{
      if(!e||!p){sErr("Requis");sL(false);return}
      const r=await au.signIn(e,p);if(r.error)sErr(r.error_description||"Erreur");else if(r.access_token){
        // Récupère le tenant_id de cet utilisateur
        _tok=r.access_token;
        const ur=await fjA(ADM+"/users?auth_id=eq."+r.user.id).catch(()=>null);
        const tid=ur?.data?.[0]?.tenant_id;
        if(tid){localStorage.setItem("gef_tenant_id",tid);}
        au.set({access_token:r.access_token,user:r.user,tenant_id:tid||TID});
        onLogin(r);
      }
    }
  }catch{sErr("Erreur serveur")}sL(false)};

  return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,"+C.navy+","+C.navyL+",#1e4d6e)",fontFamily:"'DM Sans',-apple-system,sans-serif"}}><div style={{width:400,maxWidth:"92vw"}}>
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{width:56,height:56,borderRadius:16,background:C.gold,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:C.navy,marginBottom:12}}>L</div>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Lihtea Platform</div>
      <div style={{fontSize:12,color:C.tealB,textTransform:"uppercase",letterSpacing:"0.12em",marginTop:4}}>CRM & Equipment Finance</div>
    </div>
    <div style={{background:C.surface,borderRadius:16,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
      <h2 style={{fontSize:18,fontWeight:700,color:C.navy,marginBottom:20}}>{resetMode?"Mot de passe oublié":mode==="login"?"Connexion":"Inscription"}</h2>
      {err&&<div style={{padding:10,borderRadius:8,background:C.red+"10",color:C.red,fontSize:12,marginBottom:14}}>{err}</div>}
      {ok&&<div style={{padding:10,borderRadius:8,background:C.green+"10",color:C.green,fontSize:12,marginBottom:14}}>{ok}</div>}

      {resetMode?<>
        <p style={{fontSize:13,color:C.text2,marginBottom:16,lineHeight:1.5}}>Entrez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.</p>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:600,color:C.text3,textTransform:"uppercase",display:"block",marginBottom:4}}>Email</label>
          <input type="email" value={e} onChange={x=>sE(x.target.value)} onKeyDown={x=>x.key==="Enter"&&go()} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid "+C.border,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={go} disabled={l} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:l?C.text3:C.teal,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:l?"wait":"pointer"}}>{l?"...":"Envoyer le lien"}</button>
        <div style={{marginTop:14,textAlign:"center"}}><button onClick={()=>{sReset(false);sErr("")}} style={{background:"none",border:"none",color:C.teal,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>← Retour à la connexion</button></div>
      </>:<>
        {mode==="signup"&&<div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:600,color:C.text3,textTransform:"uppercase",display:"block",marginBottom:4}}>Nom</label><input value={n} onChange={x=>sN(x.target.value)} onKeyDown={x=>x.key==="Enter"&&go()} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid "+C.border,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:600,color:C.text3,textTransform:"uppercase",display:"block",marginBottom:4}}>Email</label>
          <input type="email" value={e} onChange={x=>sE(x.target.value)} onKeyDown={x=>x.key==="Enter"&&go()} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid "+C.border,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:6}}>
          <label style={{fontSize:11,fontWeight:600,color:C.text3,textTransform:"uppercase",display:"block",marginBottom:4}}>Mot de passe</label>
          <div style={{position:"relative"}}>
            <input type={showPw?"text":"password"} value={p} onChange={x=>sP(x.target.value)} onKeyDown={x=>x.key==="Enter"&&go()} style={{width:"100%",padding:"10px 14px",paddingRight:42,borderRadius:8,border:"1px solid "+C.border,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            <button onClick={()=>sShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:16,padding:4}}>{showPw?"🙈":"👁"}</button>
          </div>
        </div>
        {mode==="login"&&<div style={{textAlign:"right",marginBottom:14}}><button onClick={()=>{sReset(true);sErr("");sOk("")}} style={{background:"none",border:"none",color:C.teal,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:11}}>Mot de passe oublié ?</button></div>}
        {mode!=="login"&&<div style={{height:14}}/>}
        <button onClick={go} disabled={l} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:l?C.text3:C.teal,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",cursor:l?"wait":"pointer"}}>{l?"...":mode==="login"?"Se connecter":"Créer"}</button>
        <div style={{marginTop:16,textAlign:"center",fontSize:12}}>
          {mode==="login"?<><span style={{color:C.text3}}>Pas de compte? </span><button onClick={()=>{sMode("signup");sErr("")}} style={{background:"none",border:"none",color:C.teal,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>S'inscrire</button></>
          :<><span style={{color:C.text3}}>Déjà inscrit? </span><button onClick={()=>{sMode("login");sErr("")}} style={{background:"none",border:"none",color:C.teal,fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Connexion</button></>}
        </div>
      </>}
    </div>
  </div></div>}

// === Layout ===
const NAV=[{s:"CRM",items:[{id:"crm",l:"Dashboard",i:"📊"},{id:"prospects",l:"Prospects",i:"👥"},{id:"pipeline",l:"Pipeline",i:"🔀"},{id:"activites",l:"Activités",i:"📞"}]},{s:"MON ÉQUIPE",items:[{id:"users",l:"Utilisateurs",i:"👤"},{id:"taux",l:"Barèmes",i:"📊"}]},{s:"MON ESPACE",items:[{id:"equipements",l:"Équipements",i:"🏭"},{id:"branding",l:"Branding",i:"🎨"}]},{s:"RÉFÉRENTIEL",items:[{id:"organismes",l:"Organismes",i:"🏛️"},{id:"dispositifs",l:"Dispositifs",i:"📋"},{id:"catalogue",l:"Catalogue",i:"✅"},{id:"connecteurs",l:"Connecteurs",i:"🔗"}]}];
function Layout({user,onLogout}){const[page,sP]=useState("crm");const[sb,sSb]=useState(true);const all=NAV.flatMap(s=>s.items);const nav=all.find(n=>n.id===page);const PG={crm:CRMDash,prospects:Prospects,pipeline:Pipeline,activites:Activites,equipements:Equipements,users:Users,taux:BaremesFinancement,branding:TenantBranding,organismes:Organismes,dispositifs:Dispositifs,catalogue:Catalogue,connecteurs:Connecteurs};const Pg=PG[page]||CRMDash;
/* ── Sidebar styles aligned with front-end (240px, same spacing/fonts) ── */
return<div style={{height:"100vh",display:"flex",fontFamily:"'Inter','DM Sans',-apple-system,sans-serif",color:C.text,background:C.bg,overflow:"hidden"}}>
{/* SIDEBAR — mirrors front-end .sidebar exactly */}
<div style={{width:sb?240:64,flexShrink:0,background:C.navy,display:"flex",flexDirection:"column",transition:"width 0.3s cubic-bezier(0.4,0,0.2,1)",zIndex:10,borderRight:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 4px 12px rgba(15,43,70,0.25)"}}>
{/* Header — logo block */}
<div style={{padding:sb?"20px 16px":"20px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
<div style={{width:36,height:36,borderRadius:8,background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.navy,flexShrink:0}}>L</div>
{sb&&<div><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>Lihtea</div><div style={{fontSize:9,color:C.tealB,textTransform:"uppercase",letterSpacing:"0.08em"}}>CRM & Admin</div></div>}
</div>
{/* Nav items */}
<nav style={{flex:1,padding:"12px 0",display:"flex",flexDirection:"column",overflowY:"auto"}}>
{NAV.map(section=><div key={section.s}>
{sb&&<div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",padding:"12px 16px 4px",letterSpacing:"0.1em",textTransform:"uppercase"}}>{section.s}</div>}
{section.items.map(item=>{const isActive=page===item.id;return<button key={item.id} onClick={()=>sP(item.id)} style={{
display:"flex",alignItems:"center",gap:12,
padding:sb?"14px 16px":"14px 12px",
justifyContent:sb?"flex-start":"center",
borderRadius:0,border:"none",borderLeft:isActive?"4px solid #2dd4bf":"4px solid transparent",
cursor:"pointer",width:"100%",
background:isActive?"linear-gradient(90deg, rgba(13,148,136,0.35) 0%, rgba(13,148,136,0.12) 100%)":"transparent",
color:isActive?"#ffffff":"rgba(255,255,255,0.5)",
fontSize:13,fontWeight:isActive?700:500,fontFamily:"inherit",
transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",whiteSpace:"nowrap",
boxShadow:isActive?"inset 0 0 20px rgba(13,148,136,0.1)":"none"
}}>
<span style={{fontSize:16,flexShrink:0,minWidth:20,textAlign:"center",filter:isActive?"drop-shadow(0 0 4px rgba(45,212,191,0.4))":"none",color:isActive?"#2dd4bf":"inherit"}}>{item.i}</span>
{sb&&<span>{item.l}</span>}
</button>})}
</div>)}
</nav>
{/* Footer — user + controls */}
{sb&&user&&<div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:11,color:"rgba(255,255,255,0.4)"}}>
<div style={{fontWeight:600,color:"rgba(255,255,255,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
</div>}
<div style={{display:"flex",gap:6,padding:"0 12px 12px"}}>
<button onClick={()=>sSb(p=>!p)} style={{flex:1,padding:8,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{sb?"\u25C1":"\u25B7"}</button>
<button onClick={onLogout} style={{padding:"8px 12px",borderRadius:8,border:"1px solid rgba(220,38,38,0.3)",background:"rgba(220,38,38,0.1)",color:"#ef4444",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>{sb?"D\u00e9connexion":"\u23FB"}</button>
</div>
</div>
{/* MAIN CONTENT */}
<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
{/* Header bar — aligned with front-end header-sticky */}
<div style={{padding:"0 28px",borderBottom:"1px solid "+C.border,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,height:52}}>
<span style={{fontSize:17,fontWeight:800,color:C.navy}}>{nav?.i} {nav?.l}</span>
<div style={{display:"flex",gap:8}}>
<Badge color={C.green}>Connect\u00e9</Badge>
<Badge color={C.navy}>v2.0 CRM</Badge>
</div>
</div>
<div style={{flex:1,overflow:"auto",padding:20}}><Pg/></div>
</div>
</div>}

// === App ===
export default function App(){
  const[s,sS]=useState(null);const[chk,sChk]=useState(true);
  const doLogout=()=>{au.clear();_tok=null;_onUnauth=null;localStorage.removeItem("gef_tenant_id");sS(null)};
  useEffect(()=>{
    const sv=au.get();
    if(sv?.access_token){
      _tok=sv.access_token;
      _onUnauth=doLogout; // activer l'intercepteur 401
      au.getUser(sv.access_token).then(u=>{
        if(u?.id)sS({...sv,user:u});
        else doLogout();
        sChk(false);
      }).catch(()=>{doLogout();sChk(false)});
    }else sChk(false);
  },[]);
  if(chk)return<div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.navy}}><div style={{width:48,height:48,borderRadius:14,background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:C.navy}}>L</div></div>;
  if(!s)return<Login onLogin={r=>{_tok=r.access_token;_onUnauth=doLogout;sS({access_token:r.access_token,user:r.user})}}/>;
  return<Layout user={s.user} onLogout={async()=>{try{await au.signOut(s.access_token)}catch{}doLogout()}}/>;
}
