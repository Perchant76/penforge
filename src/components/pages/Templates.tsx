// src/components/pages/Templates.tsx
import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Btn, Footer, EmptyState } from "../ui";
import { PLACEHOLDERS, getBuiltInTemplate, applyPlaceholders } from "../../lib/reportGenerator";
import { useApp } from "../../lib/AppContext";
import {
  FileText, Plus, Trash2, Eye, Download, Upload, Copy,
  Check, Info, BookOpen, Pencil, X, Save, ChevronDown, ChevronRight
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  isBuiltIn: boolean;
  createdAt: string;
}

const BUILT_IN: Template = {
  id: "builtin",
  name: "PenForge Default",
  description: "Professional dark-accented report with cover page, executive summary, detailed findings, and remediation table.",
  content: getBuiltInTemplate(),
  isBuiltIn: true,
  createdAt: "",
};

export function Templates() {
  const { projects, vulns } = useApp();
  const [templates, setTemplates] = useState<Template[]>([BUILT_IN]);
  const [selected, setSelected] = useState<Template>(BUILT_IN);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [previewProject, setPreviewProject] = useState(projects[0]?.id ?? "");
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const names = await invoke<string[]>("list_templates");
      const loaded: Template[] = [];
      for (const name of names) {
        const raw = await invoke<string>("read_json_file", { filename: `templates/${name}` }).catch(() => "");
        if (!raw) continue;
        try {
          const t = JSON.parse(raw) as Template;
          loaded.push(t);
        } catch {}
      }
      setTemplates([BUILT_IN, ...loaded]);
    } catch {}
  };

  const saveTemplate = async () => {
    if (!editName.trim() || !editContent.trim()) return;
    const id = selected.isBuiltIn ? `template_${Date.now()}` : selected.id;
    const t: Template = {
      id,
      name: editName,
      description: editDesc,
      content: editContent,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    await invoke("save_template", {
      filename: `templates/${id}.json`,
      content: JSON.stringify(t, null, 2),
    });
    await loadTemplates();
    setSelected(t);
    setEditing(false);
    setSaveMsg("✓ Template saved");
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const deleteTemplate = async (t: Template) => {
    if (t.isBuiltIn) return;
    await invoke("delete_template", { filename: `${t.id}.json` });
    await loadTemplates();
    setSelected(BUILT_IN);
  };

  const importTemplate = async () => {
    const path = await openDialog({ filters: [{ name: "HTML Template", extensions: ["html", "htm"] }] });
    if (!path || typeof path !== "string") return;
    const html = await invoke<string>("read_template_file", { path });
    const name = path.split(/[\\/]/).pop()?.replace(/\.(html?)/i, "") ?? "Imported Template";
    setEditName(name);
    setEditDesc("Imported HTML template");
    setEditContent(html);
    setEditing(true);
    setSelected({ ...BUILT_IN, name: "New Template", isBuiltIn: false });
  };

  const startEdit = (t: Template) => {
    setSelected(t);
    setEditName(t.isBuiltIn ? `${t.name} (copy)` : t.name);
    setEditDesc(t.description);
    setEditContent(t.content);
    setEditing(true);
  };

  const startNew = () => {
    setEditName("My Custom Template");
    setEditDesc("Custom penetration test report");
    setEditContent(getBuiltInTemplate());
    setEditing(true);
    setSelected({ ...BUILT_IN, id: "", name: "New Template", isBuiltIn: false });
  };

  const preview = () => {
    const proj = projects.find(p => p.id === previewProject) ?? projects[0];
    if (!proj) { alert("Add a project first to preview."); return; }
    const pVulns = vulns.filter(v => v.project_id === proj.id);
    const { loadConfig } = require("../../lib/storage");
    loadConfig().then((cfg: any) => {
      const html = applyPlaceholders(selected.content, proj, pVulns, cfg?.profile ?? null);
      invoke("open_report_in_browser", { html });
    });
  };

  const copyPlaceholder = (ph: string) => {
    navigator.clipboard.writeText(ph);
    setCopied(ph);
    setTimeout(() => setCopied(null), 1500);
  };

  const exportTemplate = () => {
    const blob = new Blob([selected.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.name.replace(/\s+/g, "_")}_template.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: template list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#1f1f1f] bg-[#080808]">
        <div className="p-4 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-[#dc2626]"/>
            <span className="text-sm font-bold text-[#f5f5f5]">Report Templates</span>
          </div>
          <div className="flex gap-2">
            <Btn variant="primary" size="sm" onClick={startNew} className="flex-1 justify-center"><Plus size={12}/>New</Btn>
            <Btn variant="muted" size="sm" onClick={importTemplate} className="flex-1 justify-center"><Upload size={12}/>Import HTML</Btn>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {templates.map(t => (
            <div key={t.id} onClick={() => { setSelected(t); setEditing(false); }}
              className={`px-4 py-3.5 border-b border-[#111] cursor-pointer transition-all group ${selected.id === t.id ? "bg-[rgba(220,38,38,0.07)] border-l-2 border-l-[#dc2626]" : "hover:bg-[#111]"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#f5f5f5] truncate">{t.name}</span>
                    {t.isBuiltIn && <span className="text-[9px] bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold flex-shrink-0">Built-in</span>}
                  </div>
                  <p className="text-[10px] text-[#52525b] mt-1 truncate">{t.description}</p>
                </div>
                {!t.isBuiltIn && (
                  <button onClick={e => { e.stopPropagation(); deleteTemplate(t); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#52525b] hover:text-red-400 transition-all">
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder reference */}
        <div className="border-t border-[#1f1f1f]">
          <button onClick={() => setShowPlaceholders(!showPlaceholders)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-[#71717a] hover:text-[#f5f5f5] transition-colors">
            <div className="flex items-center gap-2"><Info size={13}/>Placeholder Reference</div>
            {showPlaceholders ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
          </button>
          {showPlaceholders && (
            <div className="px-3 pb-3 max-h-64 overflow-y-auto space-y-1">
              {Object.entries(PLACEHOLDERS).map(([ph, desc]) => (
                <div key={ph} onClick={() => copyPlaceholder(ph)}
                  className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-[#111] cursor-pointer group">
                  <div>
                    <div className="text-[10px] font-mono text-[#dc2626]">{ph}</div>
                    <div className="text-[9px] text-[#52525b]">{desc}</div>
                  </div>
                  {copied === ph
                    ? <Check size={10} className="text-[#22c55e] flex-shrink-0"/>
                    : <Copy size={10} className="text-[#2a2a2a] group-hover:text-[#71717a] flex-shrink-0"/>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 text-center text-[10px] text-[#3f3f46] border-t border-[#1f1f1f]">Made with ❤️ by Perchant</div>
      </div>

      {/* Right: editor / detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        {editing ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1f1f1f] bg-[#0d0d0d] flex-shrink-0">
              <div className="flex-1 min-w-0">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-transparent text-[#f5f5f5] text-sm font-semibold focus:outline-none border-b border-transparent focus:border-[#dc2626] pb-0.5 transition-colors"
                  placeholder="Template name..."/>
                <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-transparent text-[#52525b] text-xs focus:outline-none mt-1"
                  placeholder="Short description..."/>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {saveMsg && <span className="text-xs text-[#22c55e] animate-fade-in">{saveMsg}</span>}
                <Btn variant="muted" size="sm" onClick={() => setEditing(false)}><X size={12}/>Cancel</Btn>
                <Btn variant="primary" size="sm" onClick={saveTemplate}><Save size={12}/>Save Template</Btn>
              </div>
            </div>

            {/* HTML editor */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-[#52525b] uppercase tracking-wide">HTML Editor — Use placeholders from the reference panel on the left</span>
                <span className="text-[10px] text-[#3a3a3a] ml-auto">{editContent.length.toLocaleString()} chars</span>
              </div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="flex-1 bg-[#0d0d0d] border border-[#1f1f1f] text-[#d4d4d8] font-mono text-xs rounded-xl p-4 focus:outline-none focus:border-[#dc2626] resize-none leading-relaxed"
                spellCheck={false}
                placeholder="Paste your HTML template here. Use {{PLACEHOLDER}} syntax."
              />
            </div>
          </>
        ) : (
          <>
            {/* Detail view */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1f1f1f] bg-[#0d0d0d] flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#f5f5f5]">{selected.name}</h2>
                  {selected.isBuiltIn && <span className="text-[9px] bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold">Built-in</span>}
                </div>
                <p className="text-xs text-[#71717a] mt-0.5">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {projects.length > 0 && (
                  <select value={previewProject} onChange={e => setPreviewProject(e.target.value)}
                    className="bg-[#111] border border-[#1f1f1f] text-[#a1a1aa] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#dc2626]">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                <Btn variant="muted" size="sm" onClick={exportTemplate}><Download size={12}/>Export HTML</Btn>
                <Btn variant="ghost" size="sm" onClick={preview}><Eye size={12}/>Preview Report</Btn>
                <Btn variant="muted" size="sm" onClick={() => startEdit(selected)}><Pencil size={12}/>{selected.isBuiltIn ? "Fork" : "Edit"}</Btn>
              </div>
            </div>

            {/* Template info */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl space-y-5">
                {/* How to use */}
                <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
                    <BookOpen size={14} className="text-[#dc2626]"/>How to use this template
                  </h3>
                  <ol className="space-y-2 text-sm text-[#a1a1aa]">
                    <li className="flex gap-3"><span className="text-[#dc2626] font-bold flex-shrink-0">1.</span>Click <span className="text-[#f5f5f5] font-medium">Preview Report</span> to generate a report using a selected project.</li>
                    <li className="flex gap-3"><span className="text-[#dc2626] font-bold flex-shrink-0">2.</span>Your browser opens with the full HTML report and a <span className="text-[#f5f5f5] font-medium">Save as PDF</span> button.</li>
                    <li className="flex gap-3"><span className="text-[#dc2626] font-bold flex-shrink-0">3.</span>Click <span className="text-[#f5f5f5] font-medium">Save as PDF</span> or press <kbd className="bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded text-xs text-[#f5f5f5]">Ctrl+P</kbd> and choose "Save as PDF".</li>
                  </ol>
                </div>

                {/* Custom template guide */}
                <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
                    <Upload size={14} className="text-[#dc2626]"/>Import your own template
                  </h3>
                  <p className="text-sm text-[#a1a1aa] mb-3">Create an HTML file using your company's branding. Add placeholders where PenForge should inject data:</p>
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-3 font-mono text-xs text-[#d4d4d8] space-y-1">
                    <div><span className="text-[#71717a]">&lt;!-- Client name: --&gt;</span></div>
                    <div><span className="text-[#22c55e]">{"{{CLIENT_NAME}}"}</span></div>
                    <div className="mt-2"><span className="text-[#71717a]">&lt;!-- Auto-generated findings table: --&gt;</span></div>
                    <div><span className="text-[#22c55e]">{"{{FINDINGS_TABLE}}"}</span></div>
                    <div className="mt-2"><span className="text-[#71717a]">&lt;!-- Detailed writeups: --&gt;</span></div>
                    <div><span className="text-[#22c55e]">{"{{FINDINGS_DETAIL}}"}</span></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Btn variant="ghost" size="sm" onClick={importTemplate}><Upload size={12}/>Import HTML File</Btn>
                    <Btn variant="muted" size="sm" onClick={() => startEdit(BUILT_IN)}><Copy size={12}/>Fork Built-in as Starting Point</Btn>
                  </div>
                </div>

                {/* Placeholder list */}
                <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">All Available Placeholders</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PLACEHOLDERS).map(([ph, desc]) => (
                      <div key={ph} onClick={() => copyPlaceholder(ph)}
                        className="flex items-center justify-between gap-2 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2 cursor-pointer hover:border-[#dc2626]/40 transition-all group">
                        <div>
                          <div className="text-[10px] font-mono text-[#dc2626]">{ph}</div>
                          <div className="text-[9px] text-[#52525b]">{desc}</div>
                        </div>
                        {copied === ph
                          ? <Check size={11} className="text-[#22c55e] flex-shrink-0"/>
                          : <Copy size={11} className="text-[#2a2a2a] group-hover:text-[#71717a] flex-shrink-0"/>}
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
