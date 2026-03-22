// src/components/pages/Dashboard.tsx
import React from "react";
import { useApp } from "../../lib/AppContext";
import { StatCard, Btn, Footer } from "../ui";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Shield, AlertTriangle, FolderOpen, Plus } from "lucide-react";
import type { Severity } from "../../types";
import { SEVERITY_COLORS } from "../../types";

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
    Open:   vulns.filter(v => v.severity === s && v.status === "Open").length,
    Fixed:  vulns.filter(v => v.severity === s && v.status === "Fixed").length,
  }));

  const recentProjects = [...projects].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).slice(0,5);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f5]">Dashboard</h1>
            <p className="text-[#71717a] text-sm mt-0.5">Overview of your pentest engagements</p>
          </div>
          <Btn variant="primary" onClick={() => navigate("projects")}><Plus size={14}/>New Project</Btn>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Projects" value={projects.length} color="#dc2626" icon={<FolderOpen size={18}/>}/>
          <StatCard label="Critical" value={openVulns.filter(v=>v.severity==="Critical").length} color="#ef4444" icon={<AlertTriangle size={18}/>}/>
          <StatCard label="High" value={openVulns.filter(v=>v.severity==="High").length} color="#f97316" icon={<AlertTriangle size={18}/>}/>
          <StatCard label="Open Vulns" value={openVulns.length} color="#f59e0b" icon={<Shield size={18}/>}/>
        </div>

        {/* Charts */}
        {vulns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#f5f5f5] mb-4">Severity Distribution (Open)</h3>
              {severityCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={severityCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {severityCounts.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:8, color:"#f5f5f5", fontSize:12 }} />
                    <Legend iconType="circle" formatter={(v) => <span style={{color:"#a1a1aa",fontSize:12}}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-[#52525b] text-sm">No open vulnerabilities</div>
              )}
            </div>
            {/* Bar */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#f5f5f5] mb-4">Status by Severity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={16}>
                  <XAxis dataKey="severity" tick={{ fill:"#71717a", fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:"#71717a", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip contentStyle={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:8, color:"#f5f5f5", fontSize:12 }}/>
                  <Bar dataKey="Open"  fill="#dc2626" radius={[3,3,0,0]}/>
                  <Bar dataKey="Fixed" fill="#22c55e" radius={[3,3,0,0]}/>
                  <Legend formatter={(v) => <span style={{color:"#a1a1aa",fontSize:12}}>{v}</span>}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-8 text-center">
            <Shield size={40} className="mx-auto text-[#2a2a2a] mb-3"/>
            <p className="text-[#71717a] text-sm">No vulnerability data yet. Start by adding a project.</p>
          </div>
        )}

        {/* Recent projects */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
            <h3 className="text-sm font-semibold text-[#f5f5f5]">Recent Projects</h3>
            <button onClick={() => navigate("projects")} className="text-xs text-[#dc2626] hover:underline">View all</button>
          </div>
          {recentProjects.length === 0 ? (
            <div className="p-8 text-center text-[#52525b] text-sm">No projects yet</div>
          ) : (
            <div className="divide-y divide-[#1f1f1f]">
              {recentProjects.map(p => {
                const pVulns = vulns.filter(v => v.project_id === p.id);
                const critCount = pVulns.filter(v => v.severity === "Critical" && v.status === "Open").length;
                return (
                  <div key={p.id} onClick={() => navigate("project-detail", p.id)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#1a1a1a] cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(220,38,38,0.1)] flex items-center justify-center text-[#dc2626] flex-shrink-0">
                      <FolderOpen size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#f5f5f5] truncate group-hover:text-white">{p.name}</div>
                      <div className="text-xs text-[#71717a]">{p.client}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {critCount > 0 && <span className="bg-red-950 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30">{critCount} critical</span>}
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        p.status === "Completed" ? "bg-green-950/50 text-green-400 border-green-500/30" :
                        p.status === "In Progress" ? "bg-yellow-950/50 text-yellow-400 border-yellow-500/30" :
                        "bg-zinc-900 text-zinc-400 border-zinc-600/30"}`}>{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
