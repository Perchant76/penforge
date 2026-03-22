// src/components/pages/Templates.tsx
import React, { useState, useEffect, useRef } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Btn, Footer, Input, Label } from "../ui";
import {
  PLACEHOLDERS, getBuiltInTemplate, applyPlaceholders
} from "../../lib/reportGenerator";
import {
  importHtmlTemplate, loadAllTemplates, deleteTemplate,
  findPlaceholders, renderAndPreview,
} from "../../lib/pdfTemplateEngine";
import type { UploadedTemplate } from "../../lib/pdfTemplateEngine";
import { useApp } from "../../lib/AppContext";
import {
  FileText, Plus, Trash2, Eye, Download, Upload, Copy,
  Check, BookOpen, Pencil, X, Save, ChevronDown, ChevronRight,
  AlertTriangle, Tag,
} from "lucide-react";

const F = "Inter, system-ui, sans-serif";

const BUILT_IN: UploadedTemplate = {
  id: "builtin", name: "PenForge Default",
  description: "Professional dark-accent report. Cover, exec summary, findings table, detailed writeups, remediation table.",
  type: "html", content: getBuiltInTemplate(),
  uploadedAt: "", originalFilename: "built-in",
  placeholdersFound: Object.keys(PLACEHOLDERS),
};

export function Templates() {
  const { projects, vulns } = useApp();
  const [templates, setTemplates] = useState<UploadedTemplate[]>([BUILT_IN]);
  const [selected, setSelected] = useState<UploadedTemplate>(BUILT_IN);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [previewProjectId, setPreviewProjectId] = useState(projects[0]?.id ?? "");
  const [showPH, setShowPH] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingPath, setPendingPath] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const saved = await loadAllTemplates();
    setTemplates([BUILT_IN, ...saved]);
  };

  const handleUpload = async () => {
    const path = await openDialog({
      filters: [{ name: "HTML Template", extensions: ["html","htm"] }],
    });
    if (!path || typeof path !== "string") return;
    const fname = path.split(/[\\/]/).pop() ?? path;
    setPendingPath(path);
    setUploadName(fname.replace(/\.(html?)$/i, ""));
    setUploadDesc("Custom HTML report template");
    setShowUploadForm(true);
  };

  const confirmUpload = async () => {
    if (!pendingPath || !uploadName) return;
    setUploading(true);
    try {
      const t = await importHtmlTemplate(pendingPath, uploadName, uploadDesc);
      await load();
      setSelected(t);
      setShowUploadForm(false);
      setPendingPath("");
      setSaveMsg(`✓ Template "${uploadName}" imported`);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch(e) { alert(`Import failed: ${e}`); }
    setUploading(false);
  };

  const saveEdit = async () => {
    if (!editName || !editContent) return;
    const id = selected.id === "builtin" ? `tpl_${Date.now()}` : selected.id;
    const t: UploadedTemplate = {
      ...selected, id, name: editName, description: editDesc,
      content: editContent, type: "html",
      uploadedAt: new Date().toISOString(),
      originalFilename: selected.originalFilename,
      placeholdersFound: findPlaceholders(editContent),
    };
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_template", {
      filename: `templates/${id}.json`,
      content: JSON.stringify(t, null, 2),
    });
    await load();
    setSelected(t); setEditing(false);
    setSaveMsg("✓ Saved"); setTimeout(() => setSaveMsg(""), 2000);
  };

  const del = async (t: UploadedTemplate) => {
    if (t.id === "builtin") return;
    await deleteTemplate(t.id);
    await load();
    setSelected(BUILT_IN);
  };

  const preview = async () => {
    const proj = projects.find(p => p.id === previewProjectId) ?? projects[0];
    if (!proj) { alert("Add a project first."); return; }
    const pv = vulns.filter(v => v.project_id === proj.id);
    await renderAndPreview(selected, proj, pv);
  };

  const exportHtml = () => {
    const blob = new Blob([selected.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selected.name.replace(/\s+/g,"_")}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyPH = (ph: string) => {
    navigator.clipboard.writeText(ph);
    setCopied(ph); setTimeout(() => setCopied(null), 1500);
  };

  const startEdit = (t: UploadedTemplate) => {
    setEditName(t.id === "builtin" ? `${t.name} (copy)` : t.name);
    setEditDesc(t.description);
    setEditContent(t.content);
    setEditing(true);
  };

  const panelStyle: React.CSSProperties = { flex:1, overflow:"hidden", display:"flex", flexDirection:"column" };
  const thStyle: React.CSSProperties = { padding:"8px 12px", background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", fontFamily:F };

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", fontFamily:F }}>

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <div style={{ width:280, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #1a1a1a", background:"#080808", overflow:"hidden" }}>
        <div style={{ padding:16, borderBottom:"1px solid #1a1a1a" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <FileText size={15} style={{ color:"#dc2626" }}/>
            <span style={{ fontSize:13, fontWeight:700, color:"#f5f5f5" }}>Report Templates</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            <Btn variant="primary" size="sm" onClick={handleUpload} style={{ justifyContent:"center" }}>
              <Upload size={12}/>Upload HTML Template
            </Btn>
            <Btn variant="muted" size="sm" onClick={() => startEdit(BUILT_IN)} style={{ justifyContent:"center" }}>
              <Plus size={12}/>Fork Built-in Template
            </Btn>
          </div>
          {saveMsg && <div style={{ marginTop:8, fontSize:12, color:"#22c55e" }}>{saveMsg}</div>}
        </div>

        {/* Upload name/desc form */}
        {showUploadForm && (
          <div style={{ padding:12, background:"#0d0d0d", borderBottom:"1px solid #1a1a1a" }}>
            <div style={{ fontSize:11, color:"#dc2626", marginBottom:10, fontWeight:600 }}>Name your template</div>
            <div style={{ marginBottom:8 }}>
              <Label>Name</Label>
              <Input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="My Company Template"/>
            </div>
            <div style={{ marginBottom:10 }}>
              <Label>Description</Label>
              <Input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Short description"/>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn variant="primary" size="sm" onClick={confirmUpload} disabled={uploading || !uploadName}>
                {uploading ? "Importing…" : "Import"}
              </Btn>
              <Btn variant="muted" size="sm" onClick={() => setShowUploadForm(false)}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Template list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {templates.map(t => (
            <div key={t.id} onClick={() => { setSelected(t); setEditing(false); }}
              style={{
                padding:"12px 14px", borderBottom:"1px solid #111", cursor:"pointer",
                background: selected.id === t.id ? "rgba(220,38,38,0.06)" : "transparent",
                borderLeft: selected.id === t.id ? "2px solid #dc2626" : "2px solid transparent",
                transition:"all 0.15s",
              }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"#f5f5f5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.name}</span>
                    {t.id === "builtin" && <span style={{ fontSize:9, background:"rgba(220,38,38,0.15)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.3)", padding:"1px 5px", borderRadius:4, textTransform:"uppercase", fontWeight:700, flexShrink:0 }}>Built-in</span>}
                  </div>
                  <div style={{ fontSize:10, color:"#52525b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.description}</div>
                  <div style={{ fontSize:10, color:"#3a3a3a", marginTop:3 }}>{t.placeholdersFound.length} placeholders</div>
                </div>
                {t.id !== "builtin" && (
                  <button onClick={e => { e.stopPropagation(); del(t); }}
                    style={{ background:"none", border:"none", color:"#3a3a3a", cursor:"pointer", padding:2, flexShrink:0, transition:"color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color="#ef4444")}
                    onMouseLeave={e => (e.currentTarget.style.color="#3a3a3a")}>
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder reference */}
        <div style={{ borderTop:"1px solid #1a1a1a" }}>
          <button onClick={() => setShowPH(!showPH)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"none", border:"none", color:"#71717a", cursor:"pointer", fontSize:12, fontFamily:F }}>
            <span style={{ display:"flex", alignItems:"center", gap:7 }}><Tag size={12}/>Placeholders</span>
            {showPH ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
          </button>
          {showPH && (
            <div style={{ maxHeight:240, overflowY:"auto", padding:"0 8px 8px" }}>
              {Object.entries(PLACEHOLDERS).map(([ph, desc]) => (
                <div key={ph} onClick={() => copyPH(ph)}
                  style={{ padding:"6px 8px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}
                  onMouseEnter={e => (e.currentTarget.style.background="#111")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                  <div>
                    <div style={{ fontSize:10, fontFamily:"monospace", color:"#dc2626" }}>{ph}</div>
                    <div style={{ fontSize:9, color:"#52525b" }}>{desc}</div>
                  </div>
                  {copied === ph ? <Check size={10} style={{ color:"#22c55e", flexShrink:0 }}/> : <Copy size={10} style={{ color:"#3a3a3a", flexShrink:0 }}/>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ textAlign:"center", padding:"8px 0 10px", fontSize:11, color:"#3f3f46", borderTop:"1px solid #1a1a1a" }}>Made with ❤️ by Perchant</div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────── */}
      <div style={panelStyle}>
        {editing ? (
          /* ── EDITOR ── */
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #1f1f1f", background:"#0d0d0d", flexShrink:0 }}>
              <div style={{ flex:1 }}>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Template name"
                  style={{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #2a2a2a", color:"#f5f5f5", fontSize:14, fontWeight:700, outline:"none", paddingBottom:3, fontFamily:F }}/>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  placeholder="Short description"
                  style={{ width:"100%", background:"transparent", border:"none", color:"#71717a", fontSize:12, outline:"none", marginTop:4, fontFamily:F }}/>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                {saveMsg && <span style={{ fontSize:12, color:"#22c55e" }}>{saveMsg}</span>}
                <Btn variant="muted" size="sm" onClick={() => setEditing(false)}><X size={12}/>Cancel</Btn>
                <Btn variant="primary" size="sm" onClick={saveEdit}><Save size={12}/>Save</Btn>
              </div>
            </div>
            <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:11, color:"#52525b" }}>HTML editor — use {"{{PLACEHOLDER}}"} syntax from the reference panel</span>
                <span style={{ fontSize:11, color:"#3a3a3a" }}>{editContent.length.toLocaleString()} chars</span>
              </div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                style={{ flex:1, background:"#0d0d0d", border:"1px solid #1f1f1f", color:"#d4d4d8", fontFamily:"monospace", fontSize:12, borderRadius:10, padding:14, outline:"none", resize:"none", lineHeight:1.6, transition:"border 0.15s" }}
                spellCheck={false}
                onFocus={e => (e.target.style.borderColor="#dc2626")}
                onBlur={e  => (e.target.style.borderColor="#1f1f1f")}
              />
            </div>
          </>
        ) : (
          /* ── DETAIL ── */
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", borderBottom:"1px solid #1f1f1f", background:"#0d0d0d", flexShrink:0, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"#f5f5f5" }}>{selected.name}</span>
                  {selected.id === "builtin" && <span style={{ fontSize:9, background:"rgba(220,38,38,0.15)", color:"#dc2626", border:"1px solid rgba(220,38,38,0.3)", padding:"1px 5px", borderRadius:4, textTransform:"uppercase", fontWeight:700 }}>Built-in</span>}
                </div>
                <div style={{ fontSize:12, color:"#71717a", marginTop:3 }}>{selected.description}</div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                {projects.length > 0 && (
                  <select value={previewProjectId} onChange={e => setPreviewProjectId(e.target.value)}
                    style={{ background:"#111", border:"1px solid #1f1f1f", color:"#a1a1aa", borderRadius:8, padding:"5px 10px", fontSize:12, outline:"none", fontFamily:F }}>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <Btn variant="muted" size="sm" onClick={exportHtml}><Download size={12}/>Export HTML</Btn>
                <Btn variant="ghost" size="sm" onClick={preview}><Eye size={12}/>Preview Report</Btn>
                <Btn variant="muted" size="sm" onClick={() => startEdit(selected)}><Pencil size={12}/>{selected.id === "builtin" ? "Fork & Edit" : "Edit"}</Btn>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:24 }}>
              <div style={{ maxWidth:680, display:"flex", flexDirection:"column", gap:20 }}>

                {/* How to use */}
                <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <BookOpen size={14} style={{ color:"#dc2626" }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>How to generate a report</span>
                  </div>
                  <ol style={{ display:"flex", flexDirection:"column", gap:10, paddingLeft:0, listStyle:"none" }}>
                    {[
                      ["1.", "Select a project in the dropdown above"],
                      ["2.", "Click Preview Report — your browser opens with the fully rendered report"],
                      ["3.", "Press Ctrl+P and choose Save as PDF, or click the Save as PDF button in the page"],
                    ].map(([n,t]) => (
                      <li key={n} style={{ display:"flex", gap:12, fontSize:13, color:"#a1a1aa" }}>
                        <span style={{ color:"#dc2626", fontWeight:700, flexShrink:0 }}>{n}</span>{t}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Upload guide */}
                <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <Upload size={14} style={{ color:"#dc2626" }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Upload your own HTML template</span>
                  </div>
                  <p style={{ fontSize:13, color:"#a1a1aa", marginBottom:12, lineHeight:1.7 }}>
                    Build a report in your company's branding using HTML + CSS. Add <code style={{ background:"#0d0d0d", padding:"1px 5px", borderRadius:3, fontSize:12, color:"#dc2626" }}>{"{{PLACEHOLDER}}"}</code> tokens wherever PenForge should inject data.
                  </p>
                  <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:8, padding:14, fontFamily:"monospace", fontSize:12, color:"#d4d4d8", lineHeight:1.8 }}>
                    <div style={{ color:"#71717a" }}>{`<!-- Your company header -->`}</div>
                    <div style={{ color:"#22c55e" }}>{`<h1>{{CLIENT_NAME}}</h1>`}</div>
                    <div style={{ color:"#22c55e" }}>{`<p>Tested by: {{TESTER_NAME}}, {{TESTER_COMPANY}}</p>`}</div>
                    <div style={{ color:"#71717a", marginTop:8 }}>{`<!-- Auto-populated findings table -->`}</div>
                    <div style={{ color:"#22c55e" }}>{`{{FINDINGS_TABLE}}`}</div>
                    <div style={{ color:"#71717a", marginTop:8 }}>{`<!-- Full writeup sections -->`}</div>
                    <div style={{ color:"#22c55e" }}>{`{{FINDINGS_DETAIL}}`}</div>
                    <div style={{ color:"#71717a", marginTop:8 }}>{`<!-- Remediation table -->`}</div>
                    <div style={{ color:"#22c55e" }}>{`{{REMEDIATION_TABLE}}`}</div>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <Btn variant="primary" size="sm" onClick={handleUpload}><Upload size={12}/>Upload HTML File</Btn>
                  </div>
                </div>

                {/* Placeholders found in current template */}
                {selected.placeholdersFound.length > 0 && (
                  <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5", marginBottom:12 }}>
                      Placeholders in this template ({selected.placeholdersFound.length})
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {selected.placeholdersFound.map(ph => {
                        const desc = (PLACEHOLDERS as Record<string,string>)[ph];
                        return (
                          <div key={ph} onClick={() => copyPH(ph)}
                            style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:8, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor="#dc262644")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor="#1a1a1a")}>
                            <div>
                              <div style={{ fontSize:11, fontFamily:"monospace", color:"#dc2626" }}>{ph}</div>
                              {desc && <div style={{ fontSize:10, color:"#52525b", marginTop:2 }}>{desc}</div>}
                            </div>
                            {copied === ph ? <Check size={11} style={{ color:"#22c55e" }}/> : <Copy size={11} style={{ color:"#3a3a3a" }}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All available placeholders */}
                <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5", marginBottom:12 }}>
                    All Available Placeholders
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {Object.entries(PLACEHOLDERS).map(([ph, desc]) => (
                      <div key={ph} onClick={() => copyPH(ph)}
                        style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:7, padding:"7px 10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor="#dc262633")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor="#1a1a1a")}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:10, fontFamily:"monospace", color:"#dc2626", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ph}</div>
                          <div style={{ fontSize:9, color:"#52525b" }}>{desc}</div>
                        </div>
                        {copied === ph ? <Check size={10} style={{ color:"#22c55e", flexShrink:0 }}/> : <Copy size={10} style={{ color:"#3a3a3a", flexShrink:0 }}/>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
