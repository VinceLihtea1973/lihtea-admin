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
