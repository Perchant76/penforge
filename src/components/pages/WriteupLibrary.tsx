// src/components/pages/WriteupLibrary.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, SeverityBadge, Footer, Input, Select, Label, Textarea, Modal } from "../ui";
import { WRITEUPS_DB_FULL, WRITEUP_CATEGORIES, searchWriteupsAll } from "../../lib/writeupDatabase";
import type { Writeup, WriteupCategory } from "../../lib/writeupDatabase";
import type { Severity } from "../../types";
import { defaultVuln } from "../../types";
import { BookOpen, Search, Plus, ChevronRight, X, Tag, Shield, Link, Copy, Check, Pencil, Trash2, Save } from "lucide-react";
import * as storage from "../../lib/storage";

const F = "Inter, system-ui, sans-serif";
const CUSTOM_KEY = "custom_writeups";

const EMPTY_CUSTOM: Omit<Writeup,"id"> = {
  title:"", category:"Injection", severity:"Medium", cvss_score:null,
  cwe_id:"", owasp:"", description:"", impact:"",
  steps_to_reproduce:"", remediation:"", references:[], tags:[],
};

export function WriteupLibrary() {
  const { projects, vulns, saveVulns, navigate } = useApp();
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState<WriteupCategory|"All">("All");
  const [sevFilter, setSevFilter] = useState<Severity|"All">("All");
  const [selected, setSelected]   = useState<Writeup|null>(null);
  const [addingToProject, setAddingToProject] = useState(false);
  const [targetProject, setTargetProject]     = useState(projects[0]?.id ?? "");
  const [copied, setCopied]       = useState(false);
  const [addedMsg, setAddedMsg]   = useState("");
  const [customWriteups, setCustomWriteups]   = useState<Writeup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustom, setEditingCustom]     = useState<Writeup|null>(null);
  const [customForm, setCustomForm]           = useState<Omit<Writeup,"id">>(EMPTY_CUSTOM);
  const [tagInput, setTagInput]               = useState("");
  const [refInput, setRefInput]               = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);

  // Load custom writeups from storage
  useEffect(() => { loadCustom(); }, []);
  const loadCustom = async () => {
    const raw = await storage.readFile("custom_writeups.json").catch(() => "");
    if (raw) try { setCustomWriteups(JSON.parse(raw)); } catch {}
  };
  const saveCustom = async (list: Writeup[]) => {
    setCustomWriteups(list);
    await storage.writeFile("custom_writeups.json", JSON.stringify(list, null, 2));
  };

  const allWriteups = useMemo(() => [...WRITEUPS_DB_FULL, ...customWriteups], [customWriteups]);

  const results = useMemo(() => {
    let r = search ? searchWriteupsAll(search) : WRITEUPS_DB_FULL;
    // Add matching custom writeups
    const customFiltered = search
      ? customWriteups.filter((w: Writeup) => w.title.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase()) || w.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
      : customWriteups;
    r = [...r, ...customFiltered];
    if (catFilter !== "All") r = r.filter((w: Writeup) => w.category === catFilter);
    if (sevFilter !== "All") r = r.filter((w: Writeup) => w.severity === sevFilter);
    return r;
  }, [search, catFilter, sevFilter, customWriteups]);

  const catCounts = useMemo(() => {
    const m: Record<string,number> = {};
    allWriteups.forEach((w: Writeup) => { m[w.category] = (m[w.category]??0)+1; });
    return m;
  }, [allWriteups]);

  const addToProject = async () => {
    if (!selected || !targetProject) return;
    const newVuln = { ...defaultVuln(targetProject), title:selected.title, severity:selected.severity,
      cvss_score:selected.cvss_score, cve_id:selected.cwe_id, description:selected.description,
      impact:selected.impact, steps_to_reproduce:selected.steps_to_reproduce,
      remediation:selected.remediation, references:selected.references, tags:selected.tags, proof_of_concept:"" };
    await saveVulns([...vulns, newVuln]);
    const pname = projects.find(p=>p.id===targetProject)?.name ?? "";
    setAddedMsg(`✓ Added to ${pname}`); setAddingToProject(false);
    setTimeout(()=>setAddedMsg(""), 4000);
  };

  const copyMarkdown = () => {
    if (!selected) return;
    const md = `# ${selected.title}\n\n**Severity:** ${selected.severity}\n**CVSS:** ${selected.cvss_score??'N/A'}\n**CWE:** ${selected.cwe_id}\n**OWASP:** ${selected.owasp}\n\n## Description\n${selected.description}\n\n## Impact\n${selected.impact}\n\n## Steps to Reproduce\n${selected.steps_to_reproduce}\n\n## Remediation\n${selected.remediation}\n\n## References\n${selected.references.join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const openCreate = () => { setCustomForm(EMPTY_CUSTOM); setEditingCustom(null); setTagInput(""); setRefInput(""); setShowCreateModal(true); };
  const openEdit   = (w: Writeup) => { setCustomForm({...w}); setEditingCustom(w); setTagInput(""); setRefInput(""); setShowCreateModal(true); };

  const saveCustomWriteup = async () => {
    if (!customForm.title) return;
    if (editingCustom) {
      const updated = customWriteups.map(w => w.id===editingCustom.id ? {...customForm, id:editingCustom.id} : w);
      await saveCustom(updated);
      if (selected?.id===editingCustom.id) setSelected({...customForm, id:editingCustom.id});
    } else {
      const newW = { ...customForm, id:`custom_${Date.now()}` };
      await saveCustom([...customWriteups, newW]);
      setSelected(newW);
    }
    setShowCreateModal(false);
  };

  const deleteCustom = async (id: string) => {
    const updated = customWriteups.filter(w=>w.id!==id);
    await saveCustom(updated);
    if (selected?.id===id) setSelected(null);
    setConfirmDeleteId(null);
  };

  const addTag = () => { if (tagInput.trim()) { setCustomForm(f=>({...f,tags:[...f.tags,tagInput.trim()]})); setTagInput(""); }};
  const addRef = () => { if (refInput.trim()) { setCustomForm(f=>({...f,references:[...f.references,refInput.trim()]})); setRefInput(""); }};
  const cf = (k: keyof Omit<Writeup,"id">, v: any) => setCustomForm(f=>({...f,[k]:v}));

  const SEV_ORDER: (Severity|"All")[] = ["All","Critical","High","Medium","Low","Info"];
  const isCustom = (w: Writeup|null) => !!w && customWriteups.some(c=>c.id===w.id);

  const panelHead: React.CSSProperties = { padding:"10px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", flexDirection:"column", gap:8, flexShrink:0, background:"#080808" };
  const chip = (label: string, active: boolean, onClick: ()=>void) => (
    <button key={label} onClick={onClick} style={{ padding:"3px 10px", borderRadius:12, fontSize:11, cursor:"pointer", border:`1px solid ${active?"#7c3aed":"transparent"}`, background:active?"rgba(124,58,237,0.12)":"transparent", color:active?"#a78bfa":"#71717a", fontFamily:F, transition:"all 0.15s" }}>{label}</button>
  );

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", fontFamily:F }}>
      {/* Left panel */}
      <div style={{ width:400, flexShrink:0, display:"flex", flexDirection:"column", borderRight:"1px solid #1a1a1a", overflow:"hidden" }}>
        <div style={panelHead}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <BookOpen size={15} style={{ color:"#dc2626" }}/>
              <span style={{ fontSize:13, fontWeight:700, color:"#f5f5f5" }}>Writeup Library</span>
              <span style={{ fontSize:11, color:"#3a3a3a", background:"#111", border:"1px solid #1f1f1f", padding:"1px 7px", borderRadius:10 }}>{results.length}</span>
            </div>
            <Btn variant="primary" size="sm" onClick={openCreate}><Plus size={12}/>Create</Btn>
          </div>
          <div style={{ position:"relative" }}>
            <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#52525b" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, CWE, OWASP, tag..."
              style={{ width:"100%", background:"#0d0d0d", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"7px 28px 7px 32px", fontSize:12, outline:"none", fontFamily:F }}/>
            {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#52525b", cursor:"pointer" }}><X size={12}/></button>}
          </div>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
            {SEV_ORDER.map(s=>chip(s, sevFilter===s, ()=>setSevFilter(s)))}
          </div>
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value as any)}
            style={{ background:"#0d0d0d", border:"1px solid #1f1f1f", color:"#f5f5f5", borderRadius:8, padding:"5px 10px", fontSize:12, outline:"none", fontFamily:F }}>
            <option value="All">All Categories ({allWriteups.length})</option>
            {WRITEUP_CATEGORIES.map((c: WriteupCategory)=>catCounts[c]?<option key={c} value={c}>{c} ({catCounts[c]})</option>:null)}
          </select>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {customWriteups.length > 0 && (
            <div style={{ padding:"8px 14px 4px", fontSize:10, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600 }}>Your Custom Writeups ({customWriteups.filter(w=>catFilter==="All"||w.category===catFilter).filter(w=>sevFilter==="All"||w.severity===sevFilter).length})</div>
          )}
          {results.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:120, color:"#52525b", fontSize:12 }}>
              <Shield size={28} style={{ marginBottom:8, opacity:.3 }}/>No writeups match
            </div>
          ) : results.map((w: Writeup)=>{
            const custom = customWriteups.some(c=>c.id===w.id);
            const active = selected?.id===w.id;
            return (
              <div key={w.id} onClick={()=>setSelected(w)}
                style={{ padding:"10px 14px", borderBottom:"1px solid #111", cursor:"pointer", background:active?"rgba(220,38,38,0.05)":"transparent", borderLeft:`2px solid ${active?"#dc2626":"transparent"}`, transition:"all 0.1s" }}
                onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="#0d0d0d";}}
                onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <SeverityBadge severity={w.severity}/>
                      {custom&&<span style={{ fontSize:9, background:"rgba(124,58,237,0.15)", color:"#a78bfa", border:"1px solid rgba(124,58,237,0.3)", padding:"1px 5px", borderRadius:4, fontWeight:700, textTransform:"uppercase" }}>Custom</span>}
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#f5f5f5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.title}</div>
                    <div style={{ fontSize:10, color:"#52525b", marginTop:2 }}>{w.category} · {w.cwe_id}</div>
                  </div>
                  <ChevronRight size={13} style={{ color:active?"#dc2626":"#2a2a2a", flexShrink:0, marginTop:2 }}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"8px 0 10px", textAlign:"center", fontSize:11, color:"#3f3f46", borderTop:"1px solid #1a1a1a" }}>Made with ❤️ by Perchant</div>
      </div>

      {/* Right detail panel */}
      <div style={{ flex:1, overflowY:"auto", background:"#0a0a0a" }}>
        {!selected ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center", padding:32 }}>
            <BookOpen size={48} style={{ color:"#1a1a1a", marginBottom:16 }}/>
            <div style={{ color:"#f5f5f5", fontSize:17, fontWeight:700, marginBottom:8 }}>Vulnerability Writeup Library</div>
            <div style={{ color:"#71717a", fontSize:13, maxWidth:360, lineHeight:1.7, marginBottom:24 }}>
              {allWriteups.length} writeups across {WRITEUP_CATEGORIES.length} categories. Select one to view, add to a project, or create your own custom writeups.
            </div>
            <Btn variant="primary" onClick={openCreate}><Plus size={14}/>Create Custom Writeup</Btn>
          </div>
        ) : (
          <div style={{ padding:24, animation:"fadeIn 0.2s ease" }}>
            {/* Action bar */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, flexWrap:"wrap" }}>
              <SeverityBadge severity={selected.severity}/>
              {selected.cvss_score!==null&&<span style={{ fontSize:12, fontWeight:700, color:"#dc2626", background:"rgba(220,38,38,0.1)", padding:"2px 9px", borderRadius:4, border:"1px solid rgba(220,38,38,0.3)", fontFamily:"monospace" }}>CVSS {selected.cvss_score.toFixed(1)}</span>}
              <span style={{ fontSize:11, color:"#71717a", background:"#111", border:"1px solid #1f1f1f", padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>{selected.cwe_id||"—"}</span>
              <span style={{ fontSize:11, color:"#71717a", background:"#111", border:"1px solid #1f1f1f", padding:"2px 8px", borderRadius:4 }}>{selected.owasp||"—"}</span>
              <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                {isCustom(selected)&&<>
                  <Btn variant="muted" size="sm" onClick={()=>openEdit(selected)}><Pencil size={12}/>Edit</Btn>
                  <Btn variant="danger" size="sm" onClick={()=>setConfirmDeleteId(selected.id)}><Trash2 size={12}/>Delete</Btn>
                </>}
                <Btn variant="muted" size="sm" onClick={copyMarkdown}>{copied?<><Check size={12}/>Copied!</>:<><Copy size={12}/>Copy MD</>}</Btn>
                <button onClick={()=>setAddingToProject(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"0 14px", height:28, background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:F }}>
                  <Plus size={12}/>Add to Project
                </button>
              </div>
            </div>

            {addingToProject&&(
              <div style={{ background:"#111", border:"1px solid rgba(220,38,38,0.3)", borderRadius:10, padding:14, marginBottom:18, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#f5f5f5", fontWeight:600 }}>Add to:</span>
                <select value={targetProject} onChange={e=>setTargetProject(e.target.value)}
                  style={{ flex:1, minWidth:200, background:"#0d0d0d", border:"1px solid #2a2a2a", color:"#f5f5f5", borderRadius:8, padding:"6px 10px", fontSize:12, outline:"none", fontFamily:F }}>
                  <option value="">Select project…</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
                </select>
                <Btn variant="primary" size="sm" onClick={addToProject} disabled={!targetProject}>Add</Btn>
                <Btn variant="muted" size="sm" onClick={()=>setAddingToProject(false)}>Cancel</Btn>
              </div>
            )}
            {addedMsg&&<div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#22c55e", marginBottom:16 }}>{addedMsg}</div>}

            <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>{selected.title}</h2>
            <div style={{ fontSize:12, color:"#52525b", marginBottom:16 }}>{selected.category}</div>

            {selected.tags.length>0&&(
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
                {selected.tags.map((t: string)=><span key={t} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#111", border:"1px solid #1f1f1f", color:"#71717a", fontSize:10, padding:"2px 8px", borderRadius:4, fontFamily:F }}><Tag size={9}/>{t}</span>)}
              </div>
            )}

            {[
              {label:"Description",k:"description",style:{}},
              {label:"Impact",k:"impact",style:{borderLeft:"3px solid #ef4444",paddingLeft:12}},
              {label:"Steps to Reproduce",k:"steps_to_reproduce",style:{background:"#0d0d0d",fontFamily:"monospace",fontSize:12}},
              {label:"Remediation",k:"remediation",style:{background:"rgba(34,197,94,0.05)",borderLeft:"3px solid #22c55e",paddingLeft:12}},
            ].map(({label,k,style})=>{
              const val = (selected as any)[k];
              if (!val) return null;
              return (
                <div key={label} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:3, height:13, background:"#dc2626", borderRadius:2 }}/>
                    <span style={{ fontSize:11, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</span>
                  </div>
                  <div style={{ fontSize:13, color:"#d4d4d4", lineHeight:1.75, whiteSpace:"pre-wrap", background:"#111", border:"1px solid #1f1f1f", borderRadius:8, padding:"12px 14px", ...style }}>{val}</div>
                </div>
              );
            })}

            {selected.references.length>0&&(
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><div style={{ width:3, height:13, background:"#dc2626", borderRadius:2 }}/><span style={{ fontSize:11, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:"0.8px" }}>References</span></div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {selected.references.map((r: string)=><div key={r} style={{ display:"flex", alignItems:"center", gap:8 }}><Link size={11} style={{ color:"#3b82f6", flexShrink:0 }}/><span style={{ fontSize:11, color:"#3b82f6", fontFamily:"monospace", wordBreak:"break-all" }}>{r}</span></div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit custom writeup modal */}
      <Modal open={showCreateModal} onClose={()=>setShowCreateModal(false)} title={editingCustom?"Edit Custom Writeup":"Create Custom Writeup"} maxWidth={720}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><Label required>Title</Label><Input value={customForm.title} onChange={e=>cf("title",e.target.value)} placeholder="SQL Injection in /api/search"/></div>
            <div><Label required>Severity</Label>
              <Select value={customForm.severity} onChange={e=>cf("severity",e.target.value)}>
                {["Critical","High","Medium","Low","Info"].map(s=><option key={s}>{s}</option>)}
              </Select>
            </div>
            <div><Label>Category</Label>
              <Select value={customForm.category} onChange={e=>cf("category",e.target.value)}>
                {WRITEUP_CATEGORIES.map((c: WriteupCategory)=><option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>CVSS Score</Label><Input type="number" min={0} max={10} step={0.1} value={customForm.cvss_score??""} onChange={e=>cf("cvss_score",e.target.value?parseFloat(e.target.value):null)} placeholder="0.0 – 10.0"/></div>
            <div><Label>CWE ID</Label><Input value={customForm.cwe_id} onChange={e=>cf("cwe_id",e.target.value)} placeholder="CWE-89"/></div>
            <div style={{ gridColumn:"1/-1" }}><Label>OWASP Reference</Label><Input value={customForm.owasp} onChange={e=>cf("owasp",e.target.value)} placeholder="A03:2021"/></div>
            <div style={{ gridColumn:"1/-1" }}><Label>Description</Label><Textarea value={customForm.description} onChange={e=>cf("description",e.target.value)} rows={3} placeholder="Describe the vulnerability…"/></div>
            <div style={{ gridColumn:"1/-1" }}><Label>Impact</Label><Textarea value={customForm.impact} onChange={e=>cf("impact",e.target.value)} rows={2} placeholder="Business and technical impact…"/></div>
            <div style={{ gridColumn:"1/-1" }}><Label>Steps to Reproduce</Label><Textarea value={customForm.steps_to_reproduce} onChange={e=>cf("steps_to_reproduce",e.target.value)} rows={3} placeholder="1. Navigate to…"/></div>
            <div style={{ gridColumn:"1/-1" }}><Label>Remediation</Label><Textarea value={customForm.remediation} onChange={e=>cf("remediation",e.target.value)} rows={3} placeholder="Use parameterised queries…"/></div>
            <div style={{ gridColumn:"1/-1" }}>
              <Label>Tags</Label>
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <Input value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="Add tag…" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTag();}}} style={{ flex:1 }}/>
                <Btn variant="ghost" size="sm" onClick={addTag}>Add</Btn>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {customForm.tags.map((t: string)=><span key={t} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", color:"#a1a1aa", fontSize:11, padding:"2px 8px", borderRadius:4, display:"flex", alignItems:"center", gap:4 }}>{t}<button onClick={()=>cf("tags",customForm.tags.filter((x: string)=>x!==t))} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", fontSize:13, lineHeight:1 }}>×</button></span>)}
              </div>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Label>References</Label>
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <Input value={refInput} onChange={e=>setRefInput(e.target.value)} placeholder="https://…" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addRef();}}} style={{ flex:1 }}/>
                <Btn variant="ghost" size="sm" onClick={addRef}>Add</Btn>
              </div>
              {customForm.references.map((r: string)=><div key={r} style={{ fontSize:11, color:"#3b82f6", fontFamily:"monospace", marginBottom:2 }}>{r}<button onClick={()=>cf("references",customForm.references.filter((x: string)=>x!==r))} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", marginLeft:8 }}>×</button></div>)}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:"1px solid #1f1f1f" }}>
            <Btn variant="muted" onClick={()=>setShowCreateModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveCustomWriteup} disabled={!customForm.title}><Save size={13}/>{editingCustom?"Save Changes":"Create Writeup"}</Btn>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      {confirmDeleteId&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60 }} onClick={()=>setConfirmDeleteId(null)}>
          <div style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:14, padding:24, width:360 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:700, color:"#f5f5f5", marginBottom:8 }}>Delete Custom Writeup</div>
            <div style={{ fontSize:13, color:"#a1a1aa", marginBottom:18 }}>This will permanently delete this custom writeup from your library.</div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="muted" onClick={()=>setConfirmDeleteId(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={()=>deleteCustom(confirmDeleteId)}><Trash2 size={13}/>Delete</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
