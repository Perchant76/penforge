// src/components/pages/Projects.tsx — with risk scoring + delete + rename
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, Modal, Input, Select, Label, EmptyState, Footer, ProjectStatusBadge, ConfirmDialog } from "../ui";
import { Plus, FolderOpen, Pencil, Trash2, ArrowRight, ShieldAlert } from "lucide-react";
import type { Project } from "../../types";
import { defaultProject, projectRiskRating, riskColor } from "../../types";

const F = "Inter, system-ui, sans-serif";

export function Projects() {
  const { projects, vulns, saveProjects, navigate } = useApp();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Project | null>(null);
  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal]   = useState("");
  const [form, setForm]             = useState<Project>(defaultProject());

  const openNew  = () => { setEditing(null); setForm(defaultProject()); setModalOpen(true); };
  const openEdit = (p: Project, e: React.MouseEvent) => { e.stopPropagation(); setEditing(p); setForm({...p}); setModalOpen(true); };

  const save = async () => {
    const now = new Date().toISOString();
    if (editing) await saveProjects(projects.map(p => p.id===editing.id ? {...form,updated_at:now} : p));
    else await saveProjects([...projects, {...form,id:crypto.randomUUID(),created_at:now,updated_at:now}]);
    setModalOpen(false);
  };

  const del = async (id: string) => {
    await saveProjects(projects.filter(p => p.id !== id));
  };

  const startRename = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation(); setRenamingId(p.id); setRenameVal(p.name);
  };

  const confirmRename = async (id: string) => {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    await saveProjects(projects.map(p => p.id===id ? {...p, name:renameVal.trim(), updated_at:new Date().toISOString()} : p));
    setRenamingId(null);
  };

  const f = (k: keyof Project, v: string) => setForm(x=>({...x,[k]:v}));

  const thStyle: React.CSSProperties = { textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.6px", color:"#71717a", fontFamily:F };
  const tdStyle: React.CSSProperties = { padding:"11px 14px", fontSize:13, color:"#d4d4d4", fontFamily:F, verticalAlign:"middle" };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:18 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Projects</h1>
            <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>{projects.length} engagement{projects.length!==1?"s":""}</p>
          </div>
          <Btn variant="primary" onClick={openNew}><Plus size={14}/>New Project</Btn>
        </div>

        {projects.length===0 ? (
          <EmptyState icon={<FolderOpen size={48}/>} title="No projects yet" message="Create your first pentest engagement." action={<Btn variant="primary" onClick={openNew}><Plus size={14}/>Create Project</Btn>}/>
        ) : (
          <div style={{ background:"#111", border:"1px solid #1f1f1f", borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ borderBottom:"1px solid #1f1f1f" }}>
                {["Risk","Project","Client","Status","Vulns","Date Range",""].map(h=><th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[...projects].sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).map(p => {
                  const pv = vulns.filter(v=>v.project_id===p.id);
                  const risk = projectRiskRating(pv);
                  const rc   = riskColor(risk);
                  return (
                    <tr key={p.id} onClick={()=>navigate("project-detail",p.id)}
                      style={{ borderBottom:"1px solid #1a1a1a", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#1a1a1a")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      {/* Risk badge */}
                      <td style={tdStyle}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:rc, boxShadow:`0 0 6px ${rc}` }}/>
                          <span style={{ fontSize:10, fontWeight:700, color:rc, textTransform:"uppercase", letterSpacing:"0.5px" }}>{risk}</span>
                        </div>
                      </td>
                      {/* Name with inline rename */}
                      <td style={tdStyle}>
                        {renamingId===p.id ? (
                          <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                            <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter")confirmRename(p.id);if(e.key==="Escape")setRenamingId(null);}}
                              style={{ background:"#0d0d0d", border:"1px solid #dc2626", color:"#f5f5f5", borderRadius:6, padding:"3px 8px", fontSize:13, outline:"none", fontFamily:F, minWidth:180 }}/>
                            <button onClick={()=>confirmRename(p.id)} style={{ background:"#dc2626", border:"none", color:"#fff", borderRadius:5, padding:"3px 8px", cursor:"pointer", fontSize:11 }}>✓</button>
                            <button onClick={()=>setRenamingId(null)} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#a1a1aa", borderRadius:5, padding:"3px 8px", cursor:"pointer", fontSize:11 }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:28, height:28, borderRadius:6, background:"rgba(220,38,38,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626", flexShrink:0 }}><FolderOpen size={13}/></div>
                            <span style={{ fontWeight:500, color:"#f5f5f5" }}>{p.name}</span>
                          </div>
                        )}
                      </td>
                      <td style={{...tdStyle,color:"#a1a1aa"}}>{p.client||"—"}</td>
                      <td style={tdStyle}><ProjectStatusBadge status={p.status}/></td>
                      <td style={tdStyle}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span>{pv.length}</span>
                          {pv.filter(v=>v.status==="Open").length>0&&<span style={{ fontSize:11, color:"#71717a" }}>({pv.filter(v=>v.status==="Open").length} open)</span>}
                        </div>
                      </td>
                      <td style={{...tdStyle,fontSize:12,color:"#71717a"}}>{p.start_date} → {p.end_date}</td>
                      <td style={tdStyle}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={e=>startRename(p,e)} style={{ padding:6, borderRadius:6, background:"none", border:"none", color:"#71717a", cursor:"pointer" }} title="Rename" onMouseEnter={e=>(e.currentTarget.style.color="#f5f5f5")} onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}><Pencil size={13}/></button>
                          <button onClick={e=>openEdit(p,e)} style={{ padding:6, borderRadius:6, background:"none", border:"none", color:"#71717a", cursor:"pointer" }} title="Edit" onMouseEnter={e=>(e.currentTarget.style.color="#f5f5f5")} onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}><ShieldAlert size={13}/></button>
                          <button onClick={e=>{e.stopPropagation();setConfirmId(p.id);}} style={{ padding:6, borderRadius:6, background:"none", border:"none", color:"#71717a", cursor:"pointer" }} title="Delete" onMouseEnter={e=>(e.currentTarget.style.color="#ef4444")} onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}><Trash2 size={13}/></button>
                          <button onClick={e=>{e.stopPropagation();navigate("project-detail",p.id);}} style={{ padding:6, borderRadius:6, background:"none", border:"none", color:"#dc2626", cursor:"pointer" }}><ArrowRight size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer/>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?"Edit Project":"New Project"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><Label required>Project Name</Label><Input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Q3 Infrastructure Assessment"/></div>
            <div><Label required>Client</Label><Input value={form.client} onChange={e=>f("client",e.target.value)} placeholder="Acme Corp"/></div>
            <div><Label>Status</Label><Select value={form.status} onChange={e=>f("status",e.target.value)}><option>Draft</option><option>In Progress</option><option>Completed</option></Select></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e=>f("start_date",e.target.value)}/></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e=>f("end_date",e.target.value)}/></div>
            <div style={{ gridColumn:"1/-1" }}>
              <Label>Scope</Label>
              <textarea value={form.scope} onChange={e=>f("scope",e.target.value)} rows={3} placeholder="192.168.0.0/24, app.client.com…"
                style={{ width:"100%", background:"#111", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"7px 11px", fontSize:13, outline:"none", resize:"vertical", fontFamily:F }}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8 }}>
            <Btn variant="muted" onClick={()=>setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={!form.name}>{editing?"Save Changes":"Create Project"}</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={()=>setConfirmId(null)}
        onConfirm={()=>confirmId&&del(confirmId)}
        title="Delete Project"
        message="This will permanently delete the project and remove it from the list. Vulnerabilities linked to it remain in the database."/>
    </div>
  );
}
