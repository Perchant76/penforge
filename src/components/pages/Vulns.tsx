// src/components/pages/Vulns.tsx — Global vulnerability browser
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { SeverityBadge, VulnStatusBadge, Footer, EmptyState, Btn } from "../ui";
import { Shield, Search } from "lucide-react";
import type { Severity, VulnStatus } from "../../types";
import { SEVERITY_ORDER } from "../../types";
import { VulnForm } from "./VulnForm";
import type { Vulnerability } from "../../types";

export function Vulns() {
  const { vulns, projects, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity|"All">("All");
  const [statusFilter, setStatusFilter] = useState<VulnStatus|"All">("All");
  const [editing, setEditing] = useState<Vulnerability|null>(null);

  if (editing) {
    return <VulnForm projectId={editing.project_id} existing={editing}
      onSave={() => setEditing(null)} onCancel={() => setEditing(null)}/>;
  }

  const filtered = vulns
    .filter(v => sevFilter === "All" || v.severity === sevFilter)
    .filter(v => statusFilter === "All" || v.status === statusFilter)
    .filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.cve_id.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const getProject = (id: string) => projects.find(p => p.id === id);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f5]">Vulnerabilities</h1>
            <p className="text-[#71717a] text-sm mt-0.5">{vulns.length} total · {vulns.filter(v=>v.status==="Open").length} open</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search findings..."
              className="w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] placeholder:text-[#52525b]"/>
          </div>
          <div className="flex gap-1">
            {(["All","Critical","High","Medium","Low","Info"] as const).map(s => (
              <button key={s} onClick={() => setSevFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sevFilter===s ? "bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30" : "text-[#71717a] hover:bg-[#1a1a1a]"}`}>{s}</button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["All","Open","Fixed","Accepted"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter===s ? "bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30" : "text-[#71717a] hover:bg-[#1a1a1a]"}`}>{s}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Shield size={48}/>} title="No vulnerabilities found" message="No findings match your current filters."/>
        ) : (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1f1f1f]">
                <tr>{["Severity","Title","Project","CVSS","CVE","Status"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filtered.map(v => {
                  const proj = getProject(v.project_id);
                  return (
                    <tr key={v.id} onClick={() => setEditing(v)} className="hover:bg-[#1a1a1a] cursor-pointer group transition-colors">
                      <td className="px-4 py-3"><SeverityBadge severity={v.severity}/></td>
                      <td className="px-4 py-3"><div className="text-sm font-medium text-[#f5f5f5] group-hover:text-white max-w-xs truncate">{v.title}</div></td>
                      <td className="px-4 py-3">
                        {proj ? <button onClick={e=>{e.stopPropagation();navigate("project-detail",proj.id);}} className="text-xs text-[#71717a] hover:text-[#dc2626] transition-colors">{proj.name}</button> : <span className="text-xs text-[#52525b]">Unknown</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[#a1a1aa]">{v.cvss_score!==null ? v.cvss_score.toFixed(1) : "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#71717a]">{v.cve_id||"—"}</td>
                      <td className="px-4 py-3"><VulnStatusBadge status={v.status}/></td>
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
