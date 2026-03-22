// src/components/pages/Dashboard.tsx
import React from "react";
import { useApp } from "../../lib/AppContext";
import { StatCard, Btn, Footer } from "../ui";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Shield, AlertTriangle, FolderOpen, Plus } from "lucide-react";
import type { Severity } from "../../types";
import { projectRiskRating, riskColor } from "../../types";
import { SEVERITY_COLORS } from "../../types";

const F = "Inter, system-ui, sans-serif";
const SEVERITIES: Severity[] = ["Critical","High","Medium","Low","Info"];

export function Dashboard() {
  const { projects, vulns, navigate } = useApp();
  const openVulns = vulns.filter(v => v.status === "Open");

  const severityCounts = SEVERITIES.map(s => ({
    name: s,
    value: openVulns.filter(v => v.severity === s).length,
    color: SEVERITY_COLORS[s],
  })).filter(x => x.value > 0);

  const barData = SEVERITIES.map(s => ({
    severity: s,
    Open:  vulns.filter(v => v.severity === s && v.status === "Open").length,
    Fixed: vulns.filter(v => v.severity === s && v.status === "Fixed").length,
  }));

  const recentProjects = [...projects].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).slice(0,5);

  const ttStyle: React.CSSProperties = {
    background:"#1a1a1a", border:"1px solid #2a2a2a",
    borderRadius:8, color:"#f5f5f5", fontSize:12,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Dashboard</h1>
            <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>Overview of your pentest engagements</p>
          </div>
          <Btn variant="primary" onClick={() => navigate("projects")}><Plus size={14}/>New Project</Btn>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <StatCard label="Total Projects" value={projects.length} color="#dc2626" icon={<FolderOpen size={18}/>}/>
          <StatCard label="Critical Open"  value={openVulns.filter(v=>v.severity==="Critical").length} color="#ef4444" icon={<AlertTriangle size={18}/>}/>
          <StatCard label="High Open"      value={openVulns.filter(v=>v.severity==="High").length}     color="#f97316" icon={<AlertTriangle size={18}/>}/>
          <StatCard label="Total Open"     value={openVulns.length} color="#f59e0b" icon={<Shield size={18}/>}/>
        </div>

        {/* Charts */}
        {vulns.length > 0 ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#f5f5f5", marginBottom:16 }}>Severity Distribution (Open)</p>
              {severityCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={severityCounts} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                      {severityCounts.map((e,i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle}/>
                    <Legend formatter={v => <span style={{color:"#a1a1aa",fontSize:12}}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height:210, display:"flex", alignItems:"center", justifyContent:"center", color:"#52525b", fontSize:13 }}>No open vulnerabilities</div>
              )}
            </div>
            <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"#f5f5f5", marginBottom:16 }}>Status by Severity</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={barData} barSize={14}>
                  <XAxis dataKey="severity" tick={{fill:"#71717a",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#71717a",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={ttStyle}/>
                  <Bar dataKey="Open"  fill="#dc2626" radius={[3,3,0,0]}/>
                  <Bar dataKey="Fixed" fill="#22c55e" radius={[3,3,0,0]}/>
                  <Legend formatter={v => <span style={{color:"#a1a1aa",fontSize:12}}>{v}</span>}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:32, textAlign:"center" }}>
            <Shield size={40} style={{ color:"#2a2a2a", margin:"0 auto 12px" }}/>
            <p style={{ color:"#71717a", fontSize:13 }}>No vulnerability data yet. Create a project and add findings.</p>
          </div>
        )}

        {/* Recent projects */}
        <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #1f1f1f" }}>
            <p style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Recent Projects</p>
            <button onClick={() => navigate("projects")} style={{ fontSize:12, color:"#dc2626", background:"none", border:"none", cursor:"pointer" }}>View all</button>
          </div>
          {recentProjects.length === 0 ? (
            <div style={{ padding:32, textAlign:"center", color:"#52525b", fontSize:13 }}>No projects yet</div>
          ) : recentProjects.map(p => {
            const pv = vulns.filter(v => v.project_id === p.id);
            const crit = pv.filter(v => v.severity === "Critical" && v.status === "Open").length;
            const sc = { "Completed":{ bg:"rgba(34,197,94,0.1)", col:"#4ade80", br:"rgba(34,197,94,0.3)" }, "In Progress":{ bg:"rgba(245,158,11,0.1)", col:"#fbbf24", br:"rgba(245,158,11,0.3)" }, "Draft":{ bg:"rgba(113,113,122,0.1)", col:"#a1a1aa", br:"rgba(113,113,122,0.3)" } }[p.status];
            return (
              <div key={p.id} onClick={() => navigate("project-detail", p.id)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 20px", borderBottom:"1px solid #1a1a1a", cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="#1a1a1a")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <div style={{ width:32, height:32, borderRadius:8, background:"rgba(220,38,38,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626", flexShrink:0 }}>
                  <FolderOpen size={14}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"#f5f5f5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"#71717a", marginTop:2 }}>{p.client}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  {crit > 0 && <span style={{ background:"rgba(220,38,38,0.12)", color:"#f87171", border:"1px solid rgba(220,38,38,0.3)", padding:"2px 8px", borderRadius:4, fontSize:11 }}>{crit} critical</span>}
                  {sc && <span style={{ background:sc.bg, color:sc.col, border:`1px solid ${sc.br}`, padding:"2px 8px", borderRadius:4, fontSize:11 }}>{p.status}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
