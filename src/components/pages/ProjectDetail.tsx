// src/components/pages/ProjectDetail.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, SeverityBadge, VulnStatusBadge, ProjectStatusBadge, Footer, ConfirmDialog, EmptyState } from "../ui";
import { VulnForm } from "./VulnForm";
import { ChevronLeft, Plus, Shield, Pencil, Trash2, FileText, Download, Upload } from "lucide-react";
import type { Severity, Vulnerability } from "../../types";
import { SEVERITY_ORDER } from "../../types";
import { save as saveDialog, open as openDialog } from "@tauri-apps/plugin-dialog";
import * as storage from "../../lib/storage";
import { generateReport } from "../../lib/reportGenerator";

const TABS: (Severity | "All")[] = ["All","Critical","High","Medium","Low","Info"];

export function ProjectDetail() {
  const { projects, vulns, currentProjectId, saveVulns, navigate } = useApp();
  const project = projects.find(p => p.id === currentProjectId);
  const [filter, setFilter] = useState<Severity | "All">("All");
  const [addingVuln, setAddingVuln] = useState(false);
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  if (!project) { navigate("projects"); return null; }
  if (addingVuln || editingVuln) {
    return <VulnForm projectId={project.id} existing={editingVuln ?? undefined}
      onSave={() => { setAddingVuln(false); setEditingVuln(null); }}
      onCancel={() => { setAddingVuln(false); setEditingVuln(null); }} />;
  }

  const pVulns = vulns.filter(v => v.project_id === project.id);
  const displayed = [...pVulns.filter(v => filter === "All" || v.severity === filter)]
    .sort((a,b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const delVuln = async (id: string) => {
    await saveVulns(vulns.filter(v => v.id !== id));
  };

  const handleImport = async () => {
    const path = await openDialog({ filters: [{ name:"PTSync", extensions:["ptsync","json"] }] });
    if (!path || typeof path !== "string") return;
    try {
      const raw = await storage.importPtsync(path);
      const data = JSON.parse(raw);
      if (data.format !== "ptsync-v1") { setImportMsg("Invalid .ptsync file format."); return; }
      const incoming: Vulnerability[] = data.vulnerabilities;
      let imported = 0, skipped = 0;
      const newVulns = [...vulns];
      for (const iv of incoming) {
        const dup = pVulns.some(pv => pv.title === iv.title && pv.severity === iv.severity);
        if (dup) { skipped++; continue; }
        newVulns.push({ ...iv, id: crypto.randomUUID(), project_id: project.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        imported++;
      }
      await saveVulns(newVulns);
      setImportMsg(`✓ Imported: ${imported}  |  Skipped (duplicates): ${skipped}  |  Total: ${imported + skipped}`);
    } catch { setImportMsg("Failed to read .ptsync file."); }
    setTimeout(() => setImportMsg(""), 5000);
  };

  const handleReport = async () => {
    setGeneratingReport(true);
    try { await generateReport(project, pVulns); }
    finally { setGeneratingReport(false); }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          <button onClick={() => navigate("projects")} className="text-[#71717a] hover:text-[#f5f5f5] flex items-center gap-1.5 text-sm mb-3 transition-colors">
            <ChevronLeft size={16}/> All Projects
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-[#f5f5f5]">{project.name}</h1>
                <ProjectStatusBadge status={project.status}/>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#71717a]">
                <span>{project.client}</span>
                <span>•</span>
                <span>{project.start_date} → {project.end_date}</span>
                {project.scope && <><span>•</span><span className="truncate max-w-xs">{project.scope}</span></>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Btn variant="muted" size="sm" onClick={handleImport}><Upload size={13}/>Import .ptsync</Btn>
              <Btn variant="muted" size="sm" onClick={() => navigate("sync", project.id)}><Download size={13}/>Export</Btn>
              <Btn variant="ghost" size="sm" onClick={handleReport} disabled={generatingReport}><FileText size={13}/>{generatingReport ? "Generating..." : "Generate Report"}</Btn>
              <Btn variant="primary" size="sm" onClick={() => setAddingVuln(true)}><Plus size={13}/>Add Finding</Btn>
            </div>
          </div>
          {importMsg && <div className="mt-3 text-sm text-[#22c55e] bg-green-950/30 border border-green-500/20 rounded-lg px-4 py-2.5">{importMsg}</div>}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3">
          {(["Critical","High","Medium","Low","Info"] as Severity[]).map(s => {
            const cnt = pVulns.filter(v => v.severity === s).length;
            const colors = { Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6",Info:"#71717a" };
            return (
              <div key={s} onClick={() => setFilter(filter === s ? "All" : s)} style={{ borderColor: filter === s ? colors[s] : "#1f1f1f" }}
                className="bg-[#111] border rounded-xl p-3 cursor-pointer hover:border-opacity-60 transition-all text-center">
                <div className="text-2xl font-bold" style={{ color: colors[s] }}>{cnt}</div>
                <div className="text-xs text-[#71717a] mt-0.5">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === t ? "bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30" : "text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a1a]"}`}>
              {t} {t !== "All" && `(${pVulns.filter(v=>v.severity===t).length})`}
            </button>
          ))}
        </div>

        {/* Vuln table */}
        {displayed.length === 0 ? (
          <EmptyState icon={<Shield size={48}/>} title="No findings" message={filter === "All" ? "Add your first finding to this project." : `No ${filter} findings.`}
            action={filter === "All" ? <Btn variant="primary" onClick={() => setAddingVuln(true)}><Plus size={14}/>Add Finding</Btn> : undefined}/>
        ) : (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1f1f1f]">
                <tr>{["Severity","Title","CVSS","CVE","Status",""].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {displayed.map(v => (
                  <tr key={v.id} onClick={() => setEditingVuln(v)} className="hover:bg-[#1a1a1a] cursor-pointer group transition-colors">
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity}/></td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#f5f5f5] group-hover:text-white">{v.title}</div>
                      {v.tags.length > 0 && <div className="flex gap-1 mt-1">{v.tags.slice(0,3).map(t=><span key={t} className="text-xs bg-[#1a1a1a] text-[#71717a] px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#a1a1aa]">{v.cvss_score !== null ? v.cvss_score.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#71717a]">{v.cve_id || "—"}</td>
                    <td className="px-4 py-3"><VulnStatusBadge status={v.status}/></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e=>{e.stopPropagation();setEditingVuln(v);}} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#71717a] hover:text-[#f5f5f5]"><Pencil size={13}/></button>
                        <button onClick={e=>{e.stopPropagation();setConfirmId(v.id);}} className="p-1.5 rounded hover:bg-red-950 text-[#71717a] hover:text-red-400"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer/>
      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)} onConfirm={()=>confirmId&&delVuln(confirmId)} title="Delete Finding" message="This finding will be permanently deleted."/>
    </div>
  );
}
