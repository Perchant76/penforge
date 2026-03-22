// src/components/pages/UniversalImport.tsx
import React, { useState, useRef } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, Footer, SeverityBadge, Select } from "../ui";
import { detectAndParse, SUPPORTED_TOOLS } from "../../lib/universalImporter";
import type { ImportResult } from "../../lib/universalImporter";
import { Upload, FileText, Check, X, AlertTriangle, Zap } from "lucide-react";
import type { Vulnerability } from "../../types";
import { defaultVuln, SEVERITY_ORDER } from "../../types";

const F = "Inter, system-ui, sans-serif";

export function UniversalImport() {
  const { projects, vulns, saveVulns } = useApp();
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetProject, setTargetProject] = useState(projects[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<{imported:number;skipped:number}|null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setParsing(true); setResult(null); setSelected(new Set()); setImportDone(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const r = detectAndParse(file.name, text);
      setResult(r);
      setSelected(new Set(r.vulnerabilities.map((_,i) => i)));
    } catch(e) {
      setResult({ vulnerabilities:[], tool:"Error", count:0, errors:[`${e}`] });
    }
    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleAll = () => {
    if (!result) return;
    setSelected(selected.size === result.vulnerabilities.length
      ? new Set()
      : new Set(result.vulnerabilities.map((_,i) => i)));
  };

  const doImport = async () => {
    if (!result || !targetProject) return;
    setImporting(true);

    const targetVulns = vulns.filter(v => v.project_id === targetProject);
    const toImport = result.vulnerabilities.filter((_,i) => selected.has(i));
    let imported = 0, skipped = 0;
    const newVulns = [...vulns];

    for (const v of toImport) {
      // Duplicate check: same title + severity
      const dup = targetVulns.some(tv =>
        tv.title.toLowerCase() === v.title.toLowerCase() && tv.severity === v.severity
      );
      if (dup) { skipped++; continue; }
      const base = defaultVuln(targetProject);
      newVulns.push({ ...base, ...v,
        id: crypto.randomUUID(),
        project_id: targetProject,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      imported++;
    }

    await saveVulns(newVulns);
    setImportDone({ imported, skipped });
    setImporting(false);
    setSelected(new Set());
  };

  const sevCount = (sev: string) => result?.vulnerabilities.filter(v => v.severity === sev).length ?? 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:20 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Universal Importer</h1>
          <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>
            Import vulnerabilities from {SUPPORTED_TOOLS.length} security tools directly into any project
          </p>
        </div>

        {/* Supported tools */}
        <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#71717a", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>
            Supported Tools
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUPPORTED_TOOLS.map(t => (
              <div key={t.name} style={{
                display:"flex", alignItems:"center", gap:6,
                background:"#1a1a1a", border:"1px solid #2a2a2a",
                borderRadius:8, padding:"5px 10px", fontSize:12,
              }}>
                <span>{t.icon}</span>
                <span style={{ color:"#d4d4d4" }}>{t.name}</span>
                <span style={{ color:"#52525b", fontSize:10 }}>{t.ext}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#dc2626" : "#2a2a2a"}`,
            borderRadius:14,
            padding:"40px 24px",
            textAlign:"center",
            cursor:"pointer",
            background: dragging ? "rgba(220,38,38,0.05)" : "#0d0d0d",
            transition:"all 0.2s",
          }}
        >
          <input ref={fileRef} type="file" style={{ display:"none" }} onChange={handlePick}
            accept=".xml,.nessus,.json,.jsonl,.csv,.txt,.ptsync" />
          {parsing ? (
            <div style={{ color:"#dc2626", fontSize:14 }}>Parsing file…</div>
          ) : (
            <>
              <Upload size={36} style={{ color:"#3a3a3a", margin:"0 auto 12px" }}/>
              <div style={{ color:"#f5f5f5", fontSize:15, fontWeight:600, marginBottom:6 }}>
                Drop your scan file here or click to browse
              </div>
              <div style={{ color:"#52525b", fontSize:12 }}>
                Supports: .nessus, .xml, .json, .jsonl, .csv, .txt, .ptsync
              </div>
            </>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Summary bar */}
            <div style={{
              background:"#111", border:`1px solid ${result.count > 0 ? "rgba(220,38,38,0.3)" : "#2a2a2a"}`,
              borderRadius:12, padding:"14px 20px",
              display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <FileText size={16} style={{ color:"#dc2626" }}/>
                <span style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>{fileName}</span>
                <span style={{ fontSize:12, color:"#71717a" }}>detected as</span>
                <span style={{ fontSize:12, color:"#dc2626", fontWeight:700 }}>{result.tool}</span>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:12 }}>
                {(["Critical","High","Medium","Low","Info"] as const).map(s => {
                  const n = sevCount(s);
                  if (!n) return null;
                  const cols: Record<string,string> = { Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6",Info:"#71717a" };
                  return (
                    <div key={s} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:cols[s] }}>{n}</div>
                      <div style={{ fontSize:10, color:"#71717a" }}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ display:"flex", gap:8, color:"#f59e0b", fontSize:12, marginBottom:6 }}><AlertTriangle size={14}/> Parse warnings</div>
                {result.errors.slice(0,3).map((e,i) => <div key={i} style={{ fontSize:11, color:"#a1a1aa" }}>{e}</div>)}
              </div>
            )}

            {result.count === 0 ? (
              <div style={{ textAlign:"center", padding:32, color:"#71717a", fontSize:13 }}>
                No vulnerabilities found in this file. Check the format or try a different export type.
              </div>
            ) : (
              <>
                {/* Import controls */}
                <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div>
                    <label style={{ fontSize:11, color:"#71717a", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.6px", display:"block", marginBottom:6 }}>
                      Import into Project
                    </label>
                    <select value={targetProject} onChange={e=>setTargetProject(e.target.value)}
                      style={{ background:"#111", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"7px 11px", fontSize:13, outline:"none", fontFamily:F, minWidth:240 }}>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
                    </select>
                  </div>
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:12, color:"#71717a" }}>{selected.size}/{result.count} selected</span>
                    <Btn variant="muted" size="sm" onClick={toggleAll}>
                      {selected.size === result.count ? "Deselect All" : "Select All"}
                    </Btn>
                    <Btn variant="primary" onClick={doImport}
                      disabled={importing || selected.size === 0 || !targetProject}>
                      <Zap size={13}/>
                      {importing ? "Importing…" : `Import ${selected.size} Finding${selected.size !== 1 ? "s" : ""}`}
                    </Btn>
                  </div>
                </div>

                {importDone && (
                  <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:10, padding:"12px 16px", display:"flex", gap:24, fontSize:13 }}>
                    <span><span style={{ color:"#22c55e", fontWeight:700 }}>{importDone.imported}</span> <span style={{ color:"#71717a" }}>imported</span></span>
                    <span><span style={{ color:"#f59e0b", fontWeight:700 }}>{importDone.skipped}</span> <span style={{ color:"#71717a" }}>duplicates skipped</span></span>
                    <button onClick={() => setImportDone(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#52525b", cursor:"pointer" }}>✕</button>
                  </div>
                )}

                {/* Vulnerability table */}
                <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1f1f1f" }}>
                        <th style={{ padding:"10px 14px", width:44 }}>
                          <div onClick={toggleAll} style={{ width:15, height:15, border:`1px solid ${selected.size===result.count?"#dc2626":"#3a3a3a"}`, borderRadius:3, background:selected.size===result.count?"#dc2626":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {selected.size===result.count&&<Check size={10} style={{color:"#fff"}}/>}
                          </div>
                        </th>
                        {["Severity","Title","CVE","CVSS","Tags"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.6px", color:"#71717a" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...result.vulnerabilities]
                        .map((v,i) => ({v,i}))
                        .sort((a,b) => (SEVERITY_ORDER[a.v.severity]??4)-(SEVERITY_ORDER[b.v.severity]??4))
                        .map(({v,i}) => (
                          <tr key={i} onClick={() => setSelected(s => { const n=new Set(s); n.has(i)?n.delete(i):n.add(i); return n; })}
                            style={{ borderBottom:"1px solid #1a1a1a", cursor:"pointer",
                              background:selected.has(i)?"rgba(220,38,38,0.04)":"transparent", transition:"background 0.1s" }}>
                            <td style={{ padding:"9px 14px" }}>
                              <div style={{ width:15, height:15, border:`1px solid ${selected.has(i)?"#dc2626":"#3a3a3a"}`, borderRadius:3, background:selected.has(i)?"#dc2626":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {selected.has(i)&&<Check size={10} style={{color:"#fff"}}/>}
                              </div>
                            </td>
                            <td style={{ padding:"9px 14px" }}><SeverityBadge severity={v.severity}/></td>
                            <td style={{ padding:"9px 14px", fontSize:13, color:"#f5f5f5", maxWidth:320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</td>
                            <td style={{ padding:"9px 14px", fontSize:11, fontFamily:"monospace", color:"#71717a" }}>{v.cve_id || "—"}</td>
                            <td style={{ padding:"9px 14px", fontSize:11, fontFamily:"monospace", color:"#a1a1aa" }}>{v.cvss_score !== null ? v.cvss_score.toFixed(1) : "—"}</td>
                            <td style={{ padding:"9px 14px" }}>
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                {(v.tags ?? []).slice(0,3).map(t => (
                                  <span key={t} style={{ fontSize:10, background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#71717a", padding:"1px 6px", borderRadius:3 }}>{t}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
}
