// src/components/pages/Sync.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, SeverityBadge, Footer, EmptyState } from "../ui";
import { Download, Upload, FileText, CheckSquare, Square } from "lucide-react";
import { save as saveDialog, open as openDialog } from "@tauri-apps/plugin-dialog";
import * as storage from "../../lib/storage";
import type { PtsyncFile, Vulnerability } from "../../types";
import { SEVERITY_ORDER } from "../../types";

export function Sync() {
  const { vulns, projects, saveVulns, currentProjectId } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState<string>(currentProjectId ?? "all");
  const [exportMsg, setExportMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importResult, setImportResult] = useState<{imported:number;skipped:number;total:number}|null>(null);

  const { config } = useApp();
  const profile = config?.profile;

  const displayVulns = vulns
    .filter(v => projectFilter === "all" || v.project_id === projectFilter)
    .sort((a,b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const toggle = (id: string) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size===displayVulns.length ? new Set() : new Set(displayVulns.map(v=>v.id)));

  const handleExport = async () => {
    const toExport = vulns.filter(v => selected.has(v.id));
    if (!toExport.length) { setExportMsg("Select at least one finding to export."); return; }
    const path = await saveDialog({ defaultPath:`penforge-export-${new Date().toISOString().slice(0,10)}.ptsync`, filters:[{name:"PTSync",extensions:["ptsync"]}] });
    if (!path) return;
    const data: PtsyncFile = {
      format:"ptsync-v1",
      exported_at: new Date().toISOString(),
      exported_by: profile?.full_name ?? "Unknown",
      vulnerabilities: toExport.map(({project_id:_,...rest}) => rest as Omit<Vulnerability,"project_id">),
    };
    await storage.exportPtsync(JSON.stringify(data,null,2), path);
    setExportMsg(`✓ Exported ${toExport.length} finding${toExport.length!==1?"s":""} to ${path.split(/[\\/]/).pop()}`);
    setTimeout(()=>setExportMsg(""),5000);
  };

  const handleImport = async () => {
    const path = await openDialog({ filters:[{name:"PTSync",extensions:["ptsync","json"]}] });
    if (!path || typeof path !== "string") return;
    try {
      const raw = await storage.importPtsync(path);
      const data = JSON.parse(raw) as PtsyncFile;
      if (data.format !== "ptsync-v1") { setImportMsg("Invalid file format."); return; }
      const targetProjectId = projectFilter !== "all" ? projectFilter : projects[0]?.id;
      if (!targetProjectId) { setImportMsg("Select a project filter first."); return; }
      const targetVulns = vulns.filter(v => v.project_id === targetProjectId);
      let imported=0, skipped=0;
      const newVulns = [...vulns];
      for (const iv of data.vulnerabilities) {
        const dup = targetVulns.some(tv => tv.title===iv.title && tv.severity===iv.severity);
        if (dup) { skipped++; continue; }
        newVulns.push({ ...iv as any, id:crypto.randomUUID(), project_id:targetProjectId, created_at:new Date().toISOString(), updated_at:new Date().toISOString() });
        imported++;
      }
      await saveVulns(newVulns);
      setImportResult({ imported, skipped, total:imported+skipped });
      setImportMsg("");
    } catch(e) { setImportMsg("Failed to parse file."); }
  };

  const getProject = (id: string) => projects.find(p=>p.id===id);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f5]">Import / Export</h1>
          <p className="text-[#71717a] text-sm mt-0.5">Share vulnerability findings between PenForge instances using .ptsync files</p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[rgba(220,38,38,0.1)] rounded-lg text-[#dc2626]"><Download size={18}/></div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5f5f5]">Export Findings</h3>
                <p className="text-xs text-[#71717a]">Save selected findings as a .ptsync file</p>
              </div>
            </div>
            <div className="text-xs text-[#52525b] mb-3">
              {selected.size === 0 ? "No findings selected" : `${selected.size} finding${selected.size!==1?"s":""} selected`}
            </div>
            <Btn variant="primary" size="sm" onClick={handleExport} disabled={selected.size===0}><Download size={13}/>Export Selected</Btn>
            {exportMsg && <p className="text-xs text-[#22c55e] mt-2">{exportMsg}</p>}
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[rgba(34,197,94,0.1)] rounded-lg text-[#22c55e]"><Upload size={18}/></div>
              <div>
                <h3 className="text-sm font-semibold text-[#f5f5f5]">Import Findings</h3>
                <p className="text-xs text-[#71717a]">Load a .ptsync file into the selected project</p>
              </div>
            </div>
            <div className="text-xs text-[#52525b] mb-3">
              Imports into: <span className="text-[#a1a1aa]">{projectFilter==="all" ? "first project" : getProject(projectFilter)?.name ?? "unknown"}</span>
            </div>
            <Btn variant="ghost" size="sm" onClick={handleImport}><Upload size={13}/>Open .ptsync File</Btn>
            {importMsg && <p className="text-xs text-red-400 mt-2">{importMsg}</p>}
          </div>
        </div>

        {/* Import result */}
        {importResult && (
          <div className="bg-green-950/30 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
            <FileText size={20} className="text-[#22c55e] flex-shrink-0"/>
            <div className="flex gap-6 text-sm">
              <span><span className="text-[#22c55e] font-semibold">{importResult.imported}</span> <span className="text-[#71717a]">imported</span></span>
              <span><span className="text-[#f59e0b] font-semibold">{importResult.skipped}</span> <span className="text-[#71717a]">duplicates skipped</span></span>
              <span><span className="text-[#f5f5f5] font-semibold">{importResult.total}</span> <span className="text-[#71717a]">total</span></span>
            </div>
            <button onClick={()=>setImportResult(null)} className="ml-auto text-[#52525b] hover:text-[#f5f5f5]">✕</button>
          </div>
        )}

        {/* Filter + table */}
        <div className="flex items-center gap-3">
          <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}
            className="bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626]">
            <option value="all">All Projects</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-xs text-[#71717a]">{displayVulns.length} findings</span>
        </div>

        {displayVulns.length === 0 ? (
          <EmptyState icon={<FileText size={48}/>} title="No findings" message="No vulnerabilities to export."/>
        ) : (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1f1f1f]">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-[#71717a] hover:text-[#dc2626]">
                      {selected.size===displayVulns.length && displayVulns.length>0 ? <CheckSquare size={15}/> : <Square size={15}/>}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">Severity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {displayVulns.map(v => (
                  <tr key={v.id} onClick={()=>toggle(v.id)} className={`cursor-pointer transition-colors ${selected.has(v.id)?"bg-[rgba(220,38,38,0.05)]":"hover:bg-[#1a1a1a]"}`}>
                    <td className="px-4 py-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.has(v.id)?"bg-[#dc2626] border-[#dc2626]":"border-[#3a3a3a]"}`}>
                        {selected.has(v.id) && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity}/></td>
                    <td className="px-4 py-3 text-sm text-[#f5f5f5]">{v.title}</td>
                    <td className="px-4 py-3 text-xs text-[#71717a]">{getProject(v.project_id)?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${v.status==="Open"?"bg-red-950/50 text-red-400":v.status==="Fixed"?"bg-green-950/50 text-green-400":"bg-zinc-900 text-zinc-400"}`}>{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
