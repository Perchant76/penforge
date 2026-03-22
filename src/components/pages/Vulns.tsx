// src/components/pages/Vulns.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { SeverityBadge, VulnStatusBadge, Footer, EmptyState, Btn } from "../ui";
import { Shield, Search } from "lucide-react";
import type { Severity, VulnStatus } from "../../types";
import { SEVERITY_ORDER } from "../../types";
import { VulnForm } from "./VulnForm";
import type { Vulnerability } from "../../types";

const F = "Inter, system-ui, sans-serif";

export function Vulns() {
  const { vulns, projects, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity|"All">("All");
  const [statusFilter, setStatusFilter] = useState<VulnStatus|"All">("All");
  const [editing, setEditing] = useState<Vulnerability|null>(null);

  if (editing) return <VulnForm projectId={editing.project_id} existing={editing} onSave={()=>setEditing(null)} onCancel={()=>setEditing(null)}/>;

  const filtered = vulns
    .filter(v => sevFilter==="All" || v.severity===sevFilter)
    .filter(v => statusFilter==="All" || v.status===statusFilter)
    .filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.cve_id.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => SEVERITY_ORDER[a.severity]-SEVERITY_ORDER[b.severity]);

  const chip = (label: string, active: boolean, onClick: ()=>void) => (
    <button key={label} onClick={onClick} style={{
      padding:"4px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
      background: active ? "rgba(220,38,38,0.12)" : "transparent",
      border: active ? "1px solid rgba(220,38,38,0.35)" : "1px solid transparent",
      color: active ? "#dc2626" : "#71717a",
      fontFamily:F, transition:"all 0.15s",
    }}>{label}</button>
  );

  const thStyle: React.CSSProperties = { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.6px", color:"#71717a", fontFamily:F };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Vulnerabilities</h1>
          <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>{vulns.length} total · {vulns.filter(v=>v.status==="Open").length} open</p>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:200, maxWidth:360 }}>
            <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#52525b" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search findings..."
              style={{ width:"100%", background:"#111", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"7px 11px 7px 32px", fontSize:13, outline:"none", fontFamily:F }}/>
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {(["All","Critical","High","Medium","Low","Info"] as const).map(s => chip(s, sevFilter===s, ()=>setSevFilter(s)))}
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {(["All","Open","Fixed","Accepted"] as const).map(s => chip(s, statusFilter===s, ()=>setStatusFilter(s)))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Shield size={48}/>} title="No vulnerabilities found" message="No findings match your current filters."/>
        ) : (
          <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ borderBottom:"1px solid #1f1f1f" }}>
                {["Severity","Title","Project","CVSS","CVE","Status"].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(v => {
                  const proj = projects.find(p=>p.id===v.project_id);
                  return (
                    <tr key={v.id} onClick={()=>setEditing(v)}
                      style={{ borderBottom:"1px solid #1a1a1a", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#1a1a1a")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <td style={{ padding:"11px 14px" }}><SeverityBadge severity={v.severity}/></td>
                      <td style={{ padding:"11px 14px", fontSize:13, color:"#f5f5f5", maxWidth:300, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</td>
                      <td style={{ padding:"11px 14px" }}>
                        {proj ? <button onClick={e=>{e.stopPropagation();navigate("project-detail",proj.id);}} style={{ fontSize:12, color:"#71717a", background:"none", border:"none", cursor:"pointer", fontFamily:F }} onMouseEnter={e=>(e.currentTarget.style.color="#dc2626")} onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}>{proj.name}</button>
                          : <span style={{ fontSize:12, color:"#52525b" }}>Unknown</span>}
                      </td>
                      <td style={{ padding:"11px 14px", fontSize:13, fontFamily:"monospace", color:"#a1a1aa" }}>{v.cvss_score!==null?v.cvss_score.toFixed(1):"—"}</td>
                      <td style={{ padding:"11px 14px", fontSize:12, fontFamily:"monospace", color:"#71717a" }}>{v.cve_id||"—"}</td>
                      <td style={{ padding:"11px 14px" }}><VulnStatusBadge status={v.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
