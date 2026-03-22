// src/components/pages/Sync.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, SeverityBadge, Footer, EmptyState } from "../ui";
import { Download, Upload, FileText, Check } from "lucide-react";
import { save as saveDialog, open as openDialog } from "@tauri-apps/plugin-dialog";
import * as storage from "../../lib/storage";
import type { PtsyncFile, Vulnerability } from "../../types";
import { SEVERITY_ORDER } from "../../types";

const F = "Inter, system-ui, sans-serif";

export function Sync() {
  const { vulns, projects, saveVulns, currentProjectId, config } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState<string>(currentProjectId ?? "all");
  const [exportMsg, setExportMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importResult, setImportResult] = useState<{imported:number;skipped:number;total:number}|null>(null);

  const displayVulns = vulns
    .filter(v => projectFilter==="all" || v.project_id===projectFilter)
    .sort((a,b) => SEVERITY_ORDER[a.severity]-SEVERITY_ORDER[b.severity]);

  const toggle = (id:string) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size===displayVulns.length ? new Set() : new Set(displayVulns.map(v=>v.id)));

  const handleExport = async () => {
    const toExport = vulns.filter(v=>selected.has(v.id));
    if (!toExport.length) { setExportMsg("Select at least one finding."); return; }
    const path = await saveDialog({ defaultPath:`penforge-export-${new Date().toISOString().slice(0,10)}.ptsync`, filters:[{name:"PTSync",extensions:["ptsync"]}] });
    if (!path) return;
    const data: PtsyncFile = { format:"ptsync-v1", exported_at:new Date().toISOString(), exported_by:config?.profile?.full_name??"Unknown", vulnerabilities: toExport.map(({project_id:_,...rest}) => rest as any) };
    await storage.exportPtsync(JSON.stringify(data,null,2), path);
    setExportMsg(`✓ Exported ${toExport.length} finding${toExport.length!==1?"s":""}`);
    setTimeout(()=>setExportMsg(""), 5000);
  };

  const handleImport = async () => {
    const path = await openDialog({ filters:[{name:"PTSync",extensions:["ptsync","json"]}] });
    if (!path || typeof path!=="string") return;
    try {
      const raw = await storage.importPtsync(path);
      const data = JSON.parse(raw) as PtsyncFile;
      if (data.format!=="ptsync-v1") { setImportMsg("Invalid file format."); return; }
      const targetId = projectFilter!=="all" ? projectFilter : projects[0]?.id;
      if (!targetId) { setImportMsg("Select a project filter first."); return; }
      const targetVulns = vulns.filter(v=>v.project_id===targetId);
      let imported=0, skipped=0;
      const newVulns=[...vulns];
      for (const iv of data.vulnerabilities) {
        if (targetVulns.some(tv=>tv.title===iv.title&&tv.severity===iv.severity)) { skipped++; continue; }
        newVulns.push({...iv as any, id:crypto.randomUUID(), project_id:targetId, created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
        imported++;
      }
      await saveVulns(newVulns);
      setImportResult({imported,skipped,total:imported+skipped});
    } catch { setImportMsg("Failed to parse file."); }
  };

  const getProject = (id:string) => projects.find(p=>p.id===id);
  const thStyle: React.CSSProperties = { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.6px", color:"#71717a", fontFamily:F };
  const cardStyle: React.CSSProperties = { background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Import / Export</h1>
          <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>Share vulnerability findings between PenForge instances</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ padding:8, background:"rgba(220,38,38,0.1)", borderRadius:8, color:"#dc2626" }}><Download size={18}/></div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Export Findings</div>
                <div style={{ fontSize:12, color:"#71717a", marginTop:2 }}>Save selected findings as .ptsync</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:"#52525b", marginBottom:12 }}>{selected.size===0?"No findings selected":`${selected.size} selected`}</div>
            <Btn variant="primary" size="sm" onClick={handleExport} disabled={selected.size===0}><Download size={13}/>Export Selected</Btn>
            {exportMsg && <p style={{ fontSize:12, color:"#22c55e", marginTop:8 }}>{exportMsg}</p>}
          </div>
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ padding:8, background:"rgba(34,197,94,0.1)", borderRadius:8, color:"#22c55e" }}><Upload size={18}/></div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Import Findings</div>
                <div style={{ fontSize:12, color:"#71717a", marginTop:2 }}>Load a .ptsync file into a project</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:"#52525b", marginBottom:12 }}>Target: <span style={{ color:"#a1a1aa" }}>{projectFilter==="all"?"first project":getProject(projectFilter)?.name??"unknown"}</span></div>
            <Btn variant="ghost" size="sm" onClick={handleImport}><Upload size={13}/>Open .ptsync</Btn>
            {importMsg && <p style={{ fontSize:12, color:"#ef4444", marginTop:8 }}>{importMsg}</p>}
          </div>
        </div>

        {importResult && (
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:16 }}>
            <FileText size={20} style={{ color:"#22c55e", flexShrink:0 }}/>
            <div style={{ display:"flex", gap:24, fontSize:13 }}>
              <span><span style={{ color:"#22c55e", fontWeight:700 }}>{importResult.imported}</span> <span style={{ color:"#71717a" }}>imported</span></span>
              <span><span style={{ color:"#f59e0b", fontWeight:700 }}>{importResult.skipped}</span> <span style={{ color:"#71717a" }}>duplicates skipped</span></span>
              <span><span style={{ color:"#f5f5f5", fontWeight:700 }}>{importResult.total}</span> <span style={{ color:"#71717a" }}>total</span></span>
            </div>
            <button onClick={()=>setImportResult(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#52525b", cursor:"pointer", fontSize:16 }}>✕</button>
          </div>
        )}

        {/* Filter + table */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}
            style={{ background:"#111", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"7px 11px", fontSize:13, outline:"none", fontFamily:F }}>
            <option value="all">All Projects</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ fontSize:12, color:"#71717a" }}>{displayVulns.length} findings</span>
        </div>

        {displayVulns.length===0 ? (
          <EmptyState icon={<FileText size={48}/>} title="No findings" message="No vulnerabilities to export."/>
        ) : (
          <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ borderBottom:"1px solid #1f1f1f" }}>
                <th style={{ ...thStyle, width:44 }}>
                  <button onClick={toggleAll} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", display:"flex" }}>
                    <div style={{ width:15, height:15, border:`1px solid ${selected.size===displayVulns.length&&displayVulns.length>0?"#dc2626":"#3a3a3a"}`, borderRadius:3, background:selected.size===displayVulns.length&&displayVulns.length>0?"#dc2626":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {selected.size===displayVulns.length&&displayVulns.length>0&&<Check size={10} style={{ color:"#fff" }}/>}
                    </div>
                  </button>
                </th>
                {["Severity","Title","Project","Status"].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {displayVulns.map(v => (
                  <tr key={v.id} onClick={()=>toggle(v.id)}
                    style={{ borderBottom:"1px solid #1a1a1a", cursor:"pointer", background:selected.has(v.id)?"rgba(220,38,38,0.04)":"transparent", transition:"background 0.1s" }}>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ width:15, height:15, border:`1px solid ${selected.has(v.id)?"#dc2626":"#3a3a3a"}`, borderRadius:3, background:selected.has(v.id)?"#dc2626":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {selected.has(v.id)&&<Check size={10} style={{ color:"#fff" }}/>}
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}><SeverityBadge severity={v.severity}/></td>
                    <td style={{ padding:"11px 14px", fontSize:13, color:"#f5f5f5" }}>{v.title}</td>
                    <td style={{ padding:"11px 14px", fontSize:12, color:"#71717a" }}>{getProject(v.project_id)?.name??"—"}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ padding:"2px 8px", borderRadius:4, fontSize:11, background:v.status==="Open"?"rgba(220,38,38,0.12)":v.status==="Fixed"?"rgba(34,197,94,0.1)":"rgba(113,113,122,0.1)", color:v.status==="Open"?"#f87171":v.status==="Fixed"?"#4ade80":"#a1a1aa" }}>{v.status}</span>
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
