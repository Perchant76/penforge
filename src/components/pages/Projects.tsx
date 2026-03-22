// src/components/pages/Projects.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, Modal, Input, Select, Label, EmptyState, Footer, ProjectStatusBadge, ConfirmDialog } from "../ui";
import { Plus, FolderOpen, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { Project } from "../../types";
import { defaultProject } from "../../types";

export function Projects() {
  const { projects, vulns, saveProjects, navigate } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<Project>(defaultProject());

  const openNew = () => { setEditing(null); setForm(defaultProject()); setModalOpen(true); };
  const openEdit = (p: Project, e: React.MouseEvent) => { e.stopPropagation(); setEditing(p); setForm({ ...p }); setModalOpen(true); };

  const save = async () => {
    const now = new Date().toISOString();
    if (editing) {
      await saveProjects(projects.map(p => p.id === editing.id ? { ...form, updated_at: now } : p));
    } else {
      await saveProjects([...projects, { ...form, id: crypto.randomUUID(), created_at: now, updated_at: now }]);
    }
    setModalOpen(false);
  };

  const del = async (id: string) => {
    await saveProjects(projects.filter(p => p.id !== id));
  };

  const f = (k: keyof Project, v: string) => setForm(x => ({ ...x, [k]: v }));

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#f5f5f5]">Projects</h1>
            <p className="text-[#71717a] text-sm mt-0.5">{projects.length} engagement{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <Btn variant="primary" onClick={openNew}><Plus size={14}/>New Project</Btn>
        </div>

        {projects.length === 0 ? (
          <EmptyState icon={<FolderOpen size={48}/>} title="No projects yet" message="Create your first pentest engagement to get started." action={<Btn variant="primary" onClick={openNew}><Plus size={14}/>Create Project</Btn>}/>
        ) : (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#1f1f1f]">
                <tr>
                  {["Project","Client","Status","Vulns","Date Range",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {[...projects].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).map(p => {
                  const pv = vulns.filter(v => v.project_id === p.id);
                  return (
                    <tr key={p.id} onClick={() => navigate("project-detail", p.id)}
                      className="hover:bg-[#1a1a1a] cursor-pointer transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-[rgba(220,38,38,0.1)] flex items-center justify-center text-[#dc2626]"><FolderOpen size={13}/></div>
                          <span className="text-sm font-medium text-[#f5f5f5] group-hover:text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#a1a1aa]">{p.client || "—"}</td>
                      <td className="px-4 py-3.5"><ProjectStatusBadge status={p.status}/></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {pv.filter(v=>v.severity==="Critical"&&v.status==="Open").length > 0 && <span className="w-2 h-2 rounded-full bg-red-500"/>}
                          <span className="text-sm text-[#a1a1aa]">{pv.length}</span>
                          {pv.filter(v=>v.status==="Open").length > 0 && <span className="text-[#71717a] text-xs">({pv.filter(v=>v.status==="Open").length} open)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#71717a]">{p.start_date} → {p.end_date}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e=>openEdit(p,e)} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#71717a] hover:text-[#f5f5f5]"><Pencil size={13}/></button>
                          <button onClick={e=>{e.stopPropagation();setConfirmId(p.id);}} className="p-1.5 rounded hover:bg-red-950 text-[#71717a] hover:text-red-400"><Trash2 size={13}/></button>
                          <button className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#dc2626]"><ArrowRight size={13}/></button>
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project" : "New Project"} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label required>Project Name</Label><Input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Q3 Infrastructure Assessment"/></div>
            <div><Label required>Client</Label><Input value={form.client} onChange={e=>f("client",e.target.value)} placeholder="Acme Corp"/></div>
            <div><Label>Status</Label>
              <Select value={form.status} onChange={e=>f("status",e.target.value as any)}>
                <option>Draft</option><option>In Progress</option><option>Completed</option>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e=>f("start_date",e.target.value)}/></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e=>f("end_date",e.target.value)}/></div>
            <div className="col-span-2"><Label>Scope</Label><textarea value={form.scope} onChange={e=>f("scope",e.target.value)} rows={3} placeholder="192.168.0.0/24, app.client.com..." className="w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.2)] placeholder:text-[#52525b] resize-y"/></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Btn variant="muted" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={save} disabled={!form.name}>{editing ? "Save Changes" : "Create Project"}</Btn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={() => confirmId && del(confirmId)} title="Delete Project" message="This will permanently delete the project. Vulnerabilities linked to it will remain in the database."/>
    </div>
  );
}
