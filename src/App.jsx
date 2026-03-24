import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://zjhiwwbabsggzhcfhyqb.supabase.co";
const API = `${SUPABASE_URL}/functions/v1`;
const CATALOGUE_API = `${API}/catalogue-api`;
const ADMIN_API = `${API}/admin-api`;

const C = {
  navy: "#0f2b46", navyL: "#1a3d5c",
  teal: "#0d9488", tealB: "#14b8a6", tealBg: "#f0fdfa",
  gold: "#d4a843",
  bg: "#f6f8fb", surface: "#fff", border: "#e1e7ef",
  text: "#1a2332", text2: "#4a5568", text3: "#8896a7",
  red: "#dc2626", green: "#059669", purple: "#7c3aed", blue: "#2563eb",
};

const fetchJson = async (url, opts = {}) => {
  try {
    const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
    return await r.json();
  } catch (e) { return null; }
};

function Badge({ children, color = C.teal }) {
  return <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${color}15`, color, textTransform: "uppercase" }}>{children}</span>;
}

function Btn({ children, onClick, color = C.navy, variant = "solid", small, disabled, style: sx }) {
  const solid = variant === "solid";
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? "5px 10px" : "8px 16px", borderRadius: 8, border: solid ? "none" : `1px solid ${color}40`, cursor: disabled ? "not-allowed" : "pointer", background: solid ? color : "transparent", color: solid ? "#fff" : color, fontSize: small ? 11 : 12, fontWeight: 600, fontFamily: "inherit", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...sx }}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder, rows, options, disabled }) {
  const s = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", background: disabled ? C.bg : C.surface, color: C.text, outline: "none", width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.text3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>}
      {options ? <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={s}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
       : rows ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} disabled={disabled} style={{ ...s, resize: "vertical" }} />
       : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={s} />}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,43,70,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: 24, width: wide ? 680 : 460, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(15,43,70,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.text3 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, padding: "10px 20px", borderRadius: 10, background: C.green, color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", animation: "toastIn 0.25s ease" }}>{msg}<style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style></div>;
}

function DataTable({ columns, data, onEdit, onDelete, loading }) {
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.text3 }}>Chargement...</div>;
  if (!data?.length) return <div style={{ padding: 40, textAlign: "center", color: C.text3 }}>Aucune donnée</div>;
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead><tr style={{ background: C.navy }}>
          {columns.map((c, i) => <th key={i} style={{ padding: "9px 12px", color: "#fff", fontWeight: 600, textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{c.label}</th>)}
          {(onEdit || onDelete) && <th style={{ padding: "9px 12px", color: "#fff", textAlign: "right", fontSize: 10, width: 90 }}>Actions</th>}
        </tr></thead>
        <tbody>{data.map((row, ri) => (
          <tr key={row.id || ri} style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 ? C.bg : C.surface }}>
            {columns.map((c, ci) => <td key={ci} style={{ padding: "8px 12px" }}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}</td>)}
            {(onEdit || onDelete) && <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
              {onEdit && <Btn small variant="outline" color={C.blue} onClick={() => onEdit(row)} style={{ marginRight: 4 }}>✏️</Btn>}
              {onDelete && <Btn small variant="outline" color={C.red} onClick={() => onDelete(row)}>🗑</Btn>}
            </td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function useCrud(table) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); const r = await fetchJson(`${ADMIN_API}/${table}`); setData(r?.data || []); setLoading(false); }, [table]);
  useEffect(() => { refresh(); }, [refresh]);
  const create = async (rec) => { const r = await fetchJson(`${ADMIN_API}/${table}`, { method: "POST", body: JSON.stringify(rec) }); if (r?.data) { await refresh(); return true; } return false; };
  const update = async (id, rec) => { const r = await fetchJson(`${ADMIN_API}/${table}/${id}`, { method: "PUT", body: JSON.stringify(rec) }); if (r?.updated || r?.data) { await refresh(); return true; } return false; };
  const remove = async (id) => { const r = await fetchJson(`${ADMIN_API}/${table}/${id}`, { method: "DELETE" }); if (r?.deleted || r?.soft_deleted) { await refresh(); return true; } return false; };
  return { data, loading, refresh, create, update, remove };
}

// ═══ PAGES ═══

function DashboardPage() {
  const [stats, setStats] = useState({});
  useEffect(() => { fetchJson(`${CATALOGUE_API}/stats`).then(s => setStats(s || {})); }, []);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: "0 0 4px" }}>Tableau de bord</h2>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Vue d'ensemble de la plateforme</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 20 }}>
        {[{ v: stats.organismes, l: "Organismes", i: "🏛️", c: C.navy }, { v: stats.dispositifs, l: "Dispositifs", i: "📋", c: C.teal }, { v: stats.fiches_cee, l: "Fiches CEE", i: "⚡", c: C.gold }, { v: stats.equipements, l: "Équipements", i: "🏭", c: C.green }, { v: stats.catalogues, l: "Éligibilités", i: "✅", c: C.purple }].map((c, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>{c.i}</span>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: c.c, fontFamily: "'JetBrains Mono',monospace" }}>{c.v ?? "—"}</div><div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.l}</div></div>
          </div>
        ))}
      </div>
      <div style={{ padding: 20, borderRadius: 12, background: `linear-gradient(135deg,${C.navy},${C.navyL})`, color: "#fff" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🚀 Architecture back-end active</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, opacity: 0.85 }}>
          <div>• PostgreSQL Supabase — Paris</div><div>• Edge: copilot-proxy (IA)</div>
          <div>• RLS + Auth + Triggers</div><div>• Edge: catalogue-api (lecture)</div>
          <div>• Multi-tenant ready</div><div>• Edge: admin-api (CRUD)</div>
        </div>
      </div>
    </div>
  );
}

function OrganismesPage() {
  const { data, loading, create, update, remove } = useCrud("organismes");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({});
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ nom: "", sigle: "", type: "national", pays: "FR", description: "", site_web: "", couleur: "#0d9488", actif: true, ordre: data.length + 1 }); setModal("new"); };
  const openEdit = r => { setForm({ ...r }); setModal("edit"); };
  const save = async () => { const ok = modal === "new" ? await create(form) : await update(form.id, form); if (ok) { setToast(modal === "new" ? "Organisme créé ✓" : "Mis à jour ✓"); setModal(null); setTimeout(() => setToast(""), 3000); } };
  const del = async r => { if (confirm(`Désactiver ${r.sigle} ?`) && await remove(r.id)) { setToast("Désactivé ✓"); setTimeout(() => setToast(""), 3000); } };
  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>Organismes financeurs</h2><p style={{ fontSize: 13, color: C.text3, margin: "4px 0 0" }}>{data.length} organismes</p></div>
        <Btn onClick={openNew} color={C.teal}>+ Ajouter</Btn>
      </div>
      <DataTable loading={loading} data={data} onEdit={openEdit} onDelete={del} columns={[
        { key: "sigle", label: "Sigle", render: (v, r) => <span style={{ fontWeight: 700, color: r.couleur }}>{v}</span> },
        { key: "nom", label: "Nom" },
        { key: "type", label: "Type", render: v => <Badge color={{ national: C.teal, europeen: C.purple, regional: "#7e22ce", fiscal: C.gold }[v]}>{v}</Badge> },
        { key: "api_disponible", label: "API", render: v => v ? <Badge color={C.green}>Oui</Badge> : "—" },
        { key: "actif", label: "Actif", render: v => v ? "✅" : "❌" },
      ]} />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nouvel organisme" : `Modifier ${form.sigle}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Sigle *" value={form.sigle || ""} onChange={v => F("sigle", v)} placeholder="ADEME" />
          <Input label="Nom complet *" value={form.nom || ""} onChange={v => F("nom", v)} />
          <Input label="Type" value={form.type || "national"} onChange={v => F("type", v)} options={[{ value: "national", label: "National" }, { value: "europeen", label: "Européen" }, { value: "regional", label: "Régional" }, { value: "fiscal", label: "Fiscal" }]} />
          <Input label="Pays" value={form.pays || "FR"} onChange={v => F("pays", v)} />
          <Input label="Couleur" value={form.couleur || "#0d9488"} onChange={v => F("couleur", v)} type="color" />
          <Input label="Ordre" value={form.ordre || 0} onChange={v => F("ordre", parseInt(v) || 0)} type="number" />
          <Input label="Site web" value={form.site_web || ""} onChange={v => F("site_web", v)} />
          <Input label="URL API" value={form.api_url || ""} onChange={v => F("api_url", v)} />
        </div>
        <Input label="Description" value={form.description || ""} onChange={v => F("description", v)} rows={3} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="outline" onClick={() => setModal(null)}>Annuler</Btn>
          <Btn color={C.teal} onClick={save}>{modal === "new" ? "Créer" : "Sauvegarder"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

function DispositifsPage() {
  const { data, loading, create, update, remove } = useCrud("dispositifs");
  const [orgs, setOrgs] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({});
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { fetchJson(`${ADMIN_API}/organismes`).then(r => setOrgs(r?.data || [])); }, []);
  const orgName = id => orgs.find(o => o.id === id)?.sigle || "—";
  const openNew = () => { setForm({ nom: "", code: "", description: "", type_aide: "subvention", taux_min: 0, taux_max: 50, statut: "actif", organisme_id: orgs[0]?.id, actif: true }); setModal("new"); };
  const openEdit = r => { setForm({ ...r }); setModal("edit"); };
  const save = async () => { const ok = modal === "new" ? await create(form) : await update(form.id, form); if (ok) { setToast("Sauvegardé ✓"); setModal(null); setTimeout(() => setToast(""), 3000); } };
  const del = async r => { if (confirm(`Désactiver "${r.nom}" ?`) && await remove(r.id)) { setToast("Désactivé ✓"); setTimeout(() => setToast(""), 3000); } };
  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>Dispositifs d'aide</h2><p style={{ fontSize: 13, color: C.text3, margin: "4px 0 0" }}>{data.length} dispositifs</p></div>
        <Btn onClick={openNew} color={C.teal}>+ Ajouter</Btn>
      </div>
      <DataTable loading={loading} data={data} onEdit={openEdit} onDelete={del} columns={[
        { key: "code", label: "Code", render: v => <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600 }}>{v}</span> },
        { key: "nom", label: "Nom" },
        { key: "organisme_id", label: "Org.", render: v => <Badge color={C.navy}>{orgName(v)}</Badge> },
        { key: "type_aide", label: "Type", render: v => <Badge color={C.teal}>{v?.replace("_", " ")}</Badge> },
        { key: "taux_max", label: "Taux", render: (v, r) => v ? `${r.taux_min}–${v}%` : "—" },
        { key: "statut", label: "Statut", render: v => <Badge color={v === "actif" ? C.green : C.red}>{v}</Badge> },
      ]} />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nouveau dispositif" : `Modifier ${form.code}`} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <Input label="Code *" value={form.code || ""} onChange={v => F("code", v)} />
          <Input label="Nom *" value={form.nom || ""} onChange={v => F("nom", v)} />
          <Input label="Organisme *" value={form.organisme_id || ""} onChange={v => F("organisme_id", v)} options={orgs.map(o => ({ value: o.id, label: `${o.sigle} — ${o.nom}` }))} />
          <Input label="Type d'aide" value={form.type_aide || "subvention"} onChange={v => F("type_aide", v)} options={["subvention", "pret", "credit_impot", "prime", "garantie", "reduction_taux"].map(v => ({ value: v, label: v.replace("_", " ") }))} />
          <Input label="Taux min (%)" value={form.taux_min ?? 0} onChange={v => F("taux_min", parseFloat(v) || 0)} type="number" />
          <Input label="Taux max (%)" value={form.taux_max ?? 0} onChange={v => F("taux_max", parseFloat(v) || 0)} type="number" />
          <Input label="Plafond (€)" value={form.plafond_euros || ""} onChange={v => F("plafond_euros", v ? parseFloat(v) : null)} type="number" />
          <Input label="Statut" value={form.statut || "actif"} onChange={v => F("statut", v)} options={["actif", "suspendu", "clos", "a_venir"].map(v => ({ value: v, label: v }))} />
          <Input label="Lien officiel" value={form.lien_officiel || ""} onChange={v => F("lien_officiel", v)} />
        </div>
        <Input label="Description" value={form.description || ""} onChange={v => F("description", v)} rows={2} />
        <Input label="Notes" value={form.notes || ""} onChange={v => F("notes", v)} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="outline" onClick={() => setModal(null)}>Annuler</Btn>
          <Btn color={C.teal} onClick={save}>{modal === "new" ? "Créer" : "Sauvegarder"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

function EquipementsPage() {
  const { data, loading, create, update, remove } = useCrud("equipements");
  const [cats, setCats] = useState([]);
  const [fiches, setFiches] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({});
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { fetchJson(`${ADMIN_API}/categories_equipements`).then(r => setCats(r?.data || [])); fetchJson(`${ADMIN_API}/fiches_cee`).then(r => setFiches(r?.data || [])); }, []);
  const catName = id => { const c = cats.find(c => c.id === id); return c ? `${c.icone || ""} ${c.nom}` : "—"; };
  const ficheName = id => fiches.find(f => f.id === id)?.code || "—";
  const openNew = () => { setForm({ libelle: "", code_nomenclature: "", description: "", categorie_id: cats[0]?.id, fiche_cee_id: "", puissance_min_kw: 10, puissance_max_kw: 500, gain_energetique_min: 10, gain_energetique_max: 40, gain_energetique_typique: 25, duree_vie_ans: 15, actif: true }); setModal("new"); };
  const openEdit = r => { setForm({ ...r }); setModal("edit"); };
  const save = async () => { const payload = { ...form }; if (!payload.fiche_cee_id) payload.fiche_cee_id = null; const ok = modal === "new" ? await create(payload) : await update(payload.id, payload); if (ok) { setToast("Sauvegardé ✓"); setModal(null); setTimeout(() => setToast(""), 3000); } };
  const del = async r => { if (confirm(`Désactiver "${r.libelle}" ?`) && await remove(r.id)) { setToast("Désactivé ✓"); setTimeout(() => setToast(""), 3000); } };
  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: 0 }}>Équipements</h2><p style={{ fontSize: 13, color: C.text3, margin: "4px 0 0" }}>{data.length} équipements</p></div>
        <Btn onClick={openNew} color={C.teal}>+ Ajouter</Btn>
      </div>
      <DataTable loading={loading} data={data} onEdit={openEdit} onDelete={del} columns={[
        { key: "code_nomenclature", label: "Code", render: v => <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{v}</span> },
        { key: "categorie_id", label: "Cat.", render: v => catName(v) },
        { key: "libelle", label: "Équipement", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
        { key: "fiche_cee_id", label: "CEE", render: v => v ? <Badge color={C.teal}>{ficheName(v)}</Badge> : "—" },
        { key: "gain_energetique_typique", label: "Gain", render: v => v ? <span style={{ color: C.green, fontWeight: 700 }}>{v}%</span> : "—" },
        { key: "actif", label: "", render: v => v ? "✅" : "❌" },
      ]} />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Nouvel équipement" : `Modifier ${form.code_nomenclature}`} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <Input label="Code" value={form.code_nomenclature || ""} onChange={v => F("code_nomenclature", v)} placeholder="AIR-005" />
          <Input label="Libellé *" value={form.libelle || ""} onChange={v => F("libelle", v)} />
          <Input label="Catégorie" value={form.categorie_id || ""} onChange={v => F("categorie_id", v)} options={cats.map(c => ({ value: c.id, label: `${c.icone} ${c.nom}` }))} />
          <Input label="Fiche CEE" value={form.fiche_cee_id || ""} onChange={v => F("fiche_cee_id", v)} options={[{ value: "", label: "— Aucune —" }, ...fiches.map(f => ({ value: f.id, label: `${f.code}` }))]} />
          <Input label="P min (kW)" value={form.puissance_min_kw ?? ""} onChange={v => F("puissance_min_kw", v ? parseFloat(v) : null)} type="number" />
          <Input label="P max (kW)" value={form.puissance_max_kw ?? ""} onChange={v => F("puissance_max_kw", v ? parseFloat(v) : null)} type="number" />
          <Input label="Gain min %" value={form.gain_energetique_min ?? ""} onChange={v => F("gain_energetique_min", v ? parseFloat(v) : null)} type="number" />
          <Input label="Gain max %" value={form.gain_energetique_max ?? ""} onChange={v => F("gain_energetique_max", v ? parseFloat(v) : null)} type="number" />
          <Input label="Gain typ. %" value={form.gain_energetique_typique ?? ""} onChange={v => F("gain_energetique_typique", v ? parseFloat(v) : null)} type="number" />
        </div>
        <Input label="Description" value={form.description || ""} onChange={v => F("description", v)} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="outline" onClick={() => setModal(null)}>Annuler</Btn>
          <Btn color={C.teal} onClick={save}>{modal === "new" ? "Créer" : "Sauvegarder"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

function FichesCEEPage() {
  const { data, loading } = useCrud("fiches_cee");
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: "0 0 4px" }}>Fiches CEE</h2>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>{data.length} fiches standardisées</p>
      <DataTable loading={loading} data={data} columns={[
        { key: "code", label: "Code", render: v => <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: C.teal }}>{v}</span> },
        { key: "libelle", label: "Libellé" },
        { key: "secteur", label: "Secteur", render: v => <Badge color={v === "industrie" ? C.navy : C.purple}>{v}</Badge> },
        { key: "duree_vie_conventionnelle", label: "DVc", render: v => `${v} ans` },
        { key: "facteur_actualisation", label: "Fact.", render: v => Number(v).toFixed(2) },
        { key: "puissance_max_kw", label: "P max", render: v => v ? `${Number(v).toLocaleString("fr-FR")} kW` : "—" },
      ]} />
    </div>
  );
}

function CataloguePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ org: "", cat: "" });
  useEffect(() => { fetchJson(`${CATALOGUE_API}/catalogue`).then(r => { setData(r?.data || []); setLoading(false); }); }, []);
  const orgs = [...new Set(data.map(d => d.organisme_sigle))].sort();
  const cats = [...new Set(data.map(d => d.categorie_code).filter(Boolean))].sort();
  const filtered = data.filter(d => (!f.org || d.organisme_sigle === f.org) && (!f.cat || d.categorie_code === f.cat));
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, margin: "0 0 4px" }}>Matrice d'éligibilité</h2>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 12 }}>{data.length} éligibilités totales</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select value={f.org} onChange={e => setF(p => ({ ...p, org: e.target.value }))} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }}><option value="">Tous organismes</option>{orgs.map(o => <option key={o} value={o}>{o}</option>)}</select>
        <select value={f.cat} onChange={e => setF(p => ({ ...p, cat: e.target.value }))} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }}><option value="">Toutes catégories</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.text3 }}>{filtered.length} résultats</span>
      </div>
      <DataTable loading={loading} data={filtered} columns={[
        { key: "organisme_sigle", label: "Org.", render: (v, r) => <span style={{ color: r.organisme_couleur, fontWeight: 700 }}>{v}</span> },
        { key: "dispositif_code", label: "Dispositif", render: v => <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{v}</span> },
        { key: "categorie_icone", label: "", render: (v, r) => <span title={r.categorie_nom}>{v}</span> },
        { key: "equipement_libelle", label: "Équipement", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
        { key: "fiche_cee_code", label: "CEE", render: v => v ? <Badge color={C.teal}>{v}</Badge> : "" },
        { key: "taux_subvention", label: "Taux", render: v => v ? <span style={{ color: C.green, fontWeight: 700 }}>{Number(v)}%</span> : "—" },
      ]} />
    </div>
  );
}

// ═══ APP ═══
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "organismes", label: "Organismes", icon: "🏛️" },
  { id: "dispositifs", label: "Dispositifs", icon: "📋" },
  { id: "fiches", label: "Fiches CEE", icon: "⚡" },
  { id: "equipements", label: "Équipements", icon: "🏭" },
  { id: "catalogue", label: "Catalogue", icon: "✅" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sb, setSb] = useState(true);
  const nav = NAV.find(n => n.id === page);
  const pages = { dashboard: DashboardPage, organismes: OrganismesPage, dispositifs: DispositifsPage, fiches: FichesCEEPage, equipements: EquipementsPage, catalogue: CataloguePage };
  const Page = pages[page] || DashboardPage;
  return (
    <div style={{ height: "100vh", display: "flex", fontFamily: "'DM Sans',-apple-system,sans-serif", color: C.text, background: C.bg, overflow: "hidden" }}>
      <div style={{ width: sb ? 210 : 56, flexShrink: 0, background: C.navy, display: "flex", flexDirection: "column", transition: "width 0.2s", boxShadow: "4px 0 20px rgba(15,43,70,0.08)", zIndex: 10 }}>
        <div style={{ padding: sb ? "14px 12px" : "14px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.navy, flexShrink: 0 }}>L</div>
          {sb && <div><div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Lihtea</div><div style={{ fontSize: 8, color: C.tealB, textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform Admin</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 1 }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: sb ? "8px 10px" : "8px 0", justifyContent: sb ? "flex-start" : "center", borderRadius: 7, border: "none", cursor: "pointer", width: "100%", background: page === item.id ? "rgba(13,148,136,0.15)" : "transparent", color: page === item.id ? C.tealB : "rgba(255,255,255,0.5)", fontSize: 12.5, fontWeight: page === item.id ? 600 : 400, fontFamily: "inherit", transition: "all 0.12s" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>{sb && item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setSb(p => !p)} style={{ margin: "0 6px 10px", padding: 7, borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>{sb ? "◁" : "▷"}</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{nav?.icon} {nav?.label}</span>
          <div style={{ display: "flex", gap: 8 }}><Badge color={C.green}>Backend connecté</Badge><Badge color={C.navy}>Supabase</Badge></div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}><Page /></div>
      </div>
    </div>
  );
}
