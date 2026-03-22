// src/components/pages/WriteupLibrary.tsx
import React, { useState, useMemo } from "react";
import { useApp } from "../../lib/AppContext";
import { SeverityBadge, Footer, Btn } from "../ui";
import { searchWriteups, WRITEUPS_DB, WRITEUP_CATEGORIES } from "../../lib/writeupDatabase";
import type { Writeup, WriteupCategory } from "../../lib/writeupDatabase";
import type { Severity } from "../../types";
import { defaultVuln } from "../../types";
import { BookOpen, Search, Plus, ChevronRight, X, Tag, Shield, Link, Copy, Check } from "lucide-react";

interface Props { onAddToProject?: (projectId: string, writeup: Writeup) => void; }

export function WriteupLibrary({ onAddToProject }: Props) {
  const { projects, vulns, saveVulns, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<WriteupCategory | "All">("All");
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [selected, setSelected] = useState<Writeup | null>(null);
  const [addingToProject, setAddingToProject] = useState(false);
  const [targetProject, setTargetProject] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");

  const results = useMemo(() => {
    let r = search ? searchWriteups(search) : WRITEUPS_DB;
    if (catFilter !== "All") r = r.filter(w => w.category === catFilter);
    if (sevFilter !== "All") r = r.filter(w => w.severity === sevFilter);
    return r;
  }, [search, catFilter, sevFilter]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    WRITEUPS_DB.forEach(w => { m[w.category] = (m[w.category] ?? 0) + 1; });
    return m;
  }, []);

  const sevCounts = useMemo(() => ({
    Critical: WRITEUPS_DB.filter(w=>w.severity==="Critical").length,
    High:     WRITEUPS_DB.filter(w=>w.severity==="High").length,
    Medium:   WRITEUPS_DB.filter(w=>w.severity==="Medium").length,
    Low:      WRITEUPS_DB.filter(w=>w.severity==="Low").length,
    Info:     WRITEUPS_DB.filter(w=>w.severity==="Info").length,
  }), []);

  const addToProject = async () => {
    if (!selected || !targetProject) return;
    const newVuln = {
      ...defaultVuln(targetProject),
      title: selected.title,
      severity: selected.severity,
      cvss_score: selected.cvss_score,
      cve_id: selected.cwe_id,
      description: selected.description,
      impact: selected.impact,
      steps_to_reproduce: selected.steps_to_reproduce,
      remediation: selected.remediation,
      references: selected.references,
      tags: selected.tags,
      proof_of_concept: "",
    };
    await saveVulns([...vulns, newVuln]);
    setAddedMsg(`✓ Added "${selected.title}" to ${projects.find(p=>p.id===targetProject)?.name}`);
    setAddingToProject(false);
    setTimeout(() => setAddedMsg(""), 4000);
  };

  const copyToClipboard = () => {
    if (!selected) return;
    const text = `# ${selected.title}\n\n**Severity:** ${selected.severity}\n**CVSS:** ${selected.cvss_score ?? "N/A"}\n**CWE:** ${selected.cwe_id}\n**OWASP:** ${selected.owasp}\n\n## Description\n${selected.description}\n\n## Impact\n${selected.impact}\n\n## Steps to Reproduce\n${selected.steps_to_reproduce}\n\n## Remediation\n${selected.remediation}\n\n## References\n${selected.references.join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SEV_ORDER: (Severity | "All")[] = ["All","Critical","High","Medium","Low","Info"];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: filters + list */}
      <div className="flex flex-col w-[420px] min-w-[320px] border-r border-[#1f1f1f] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f1f] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-[#dc2626]"/>
            <h1 className="text-sm font-bold text-[#f5f5f5]">Writeup Library</h1>
            <span className="ml-auto text-xs text-[#52525b] bg-[#1a1a1a] px-2 py-0.5 rounded-full">{WRITEUPS_DB.length} writeups</span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, CWE, OWASP, tag..."
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#dc2626] placeholder:text-[#3f3f46]"/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#f5f5f5]"><X size={12}/></button>}
          </div>
        </div>

        {/* Severity filter chips */}
        <div className="px-3 py-2 border-b border-[#1f1f1f] flex gap-1 flex-wrap flex-shrink-0">
          {SEV_ORDER.map(s => {
            const cnt = s === "All" ? WRITEUPS_DB.length : sevCounts[s as Severity];
            const active = sevFilter === s;
            return (
              <button key={s} onClick={()=>setSevFilter(s)} className={`px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${active?"bg-[rgba(220,38,38,0.15)] text-[#dc2626] border border-[#dc2626]/30":"text-[#71717a] hover:text-[#a1a1aa] border border-transparent hover:border-[#2a2a2a]"}`}>
                {s} <span className="text-[10px] opacity-60">{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div className="px-3 py-2 border-b border-[#1f1f1f] flex-shrink-0">
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value as any)}
            className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#dc2626]">
            <option value="All">All Categories ({WRITEUPS_DB.length})</option>
            {WRITEUP_CATEGORIES.map(c => catCounts[c] ? <option key={c} value={c}>{c} ({catCounts[c]})</option> : null)}
          </select>
        </div>

        {/* Results count */}
        <div className="px-4 py-2 text-xs text-[#52525b] flex-shrink-0 border-b border-[#1a1a1a]">
          {results.length} result{results.length !== 1 ? "s" : ""}
          {search && <span className="ml-1">for "{search}"</span>}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#52525b]">
              <Shield size={32} className="mb-2 opacity-30"/>
              <p className="text-xs">No writeups match your filters</p>
            </div>
          ) : (
            results.map(w => (
              <div key={w.id} onClick={()=>setSelected(w)}
                className={`px-4 py-3 border-b border-[#111] cursor-pointer transition-all group hover:bg-[#111] ${selected?.id===w.id?"bg-[rgba(220,38,38,0.06)] border-l-2 border-l-[#dc2626]":""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#f5f5f5] leading-tight truncate group-hover:text-white">{w.title}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <SeverityBadge severity={w.severity}/>
                      <span className="text-[10px] text-[#52525b] font-mono">{w.cwe_id}</span>
                      <span className="text-[10px] text-[#52525b]">{w.category}</span>
                    </div>
                  </div>
                  <ChevronRight size={13} className={`flex-shrink-0 mt-1 transition-colors ${selected?.id===w.id?"text-[#dc2626]":"text-[#2a2a2a] group-hover:text-[#52525b]"}`}/>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-[#1f1f1f] text-center text-xs text-[#3f3f46] flex-shrink-0">Made with ❤️ by Perchant</div>
      </div>

      {/* Right panel: detail */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <BookOpen size={48} className="text-[#1a1a1a] mb-4"/>
            <h3 className="text-[#f5f5f5] font-semibold text-lg mb-2">Vulnerability Writeup Library</h3>
            <p className="text-[#71717a] text-sm max-w-sm leading-relaxed">
              {WRITEUPS_DB.length} pre-loaded writeups across {WRITEUP_CATEGORIES.length} categories.
              Select a writeup to view details and add it to a project with one click.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6 max-w-sm">
              {(["Critical","High","Medium","Low"] as const).map(s => {
                const cols = {Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6"};
                return (
                  <div key={s} className="bg-[#111] border border-[#1f1f1f] rounded-lg p-3 text-center">
                    <div className="text-xl font-bold" style={{color:cols[s]}}>{sevCounts[s]}</div>
                    <div className="text-xs text-[#71717a]">{s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 animate-fade-in">
            {/* Action bar */}
            <div className="flex items-center gap-2 mb-5">
              <SeverityBadge severity={selected.severity}/>
              {selected.cvss_score !== null && (
                <span className="text-sm font-bold text-[#dc2626] bg-[rgba(220,38,38,0.1)] px-2 py-0.5 rounded border border-[#dc2626]/30 font-mono">
                  CVSS {selected.cvss_score.toFixed(1)}
                </span>
              )}
              <span className="text-xs text-[#71717a] font-mono bg-[#111] px-2 py-1 rounded border border-[#1f1f1f]">{selected.cwe_id}</span>
              <span className="text-xs text-[#71717a] bg-[#111] px-2 py-1 rounded border border-[#1f1f1f]">{selected.owasp}</span>
              <div className="flex gap-2 ml-auto">
                <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#71717a] hover:text-[#f5f5f5] hover:border-[#3a3a3a] transition-all">
                  {copied ? <><Check size={12} className="text-[#22c55e]"/>Copied!</> : <><Copy size={12}/>Copy Markdown</>}
                </button>
                <button onClick={()=>setAddingToProject(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white rounded-lg text-xs font-medium hover:bg-[#b91c1c] transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                  <Plus size={12}/>Add to Project
                </button>
              </div>
            </div>

            {addingToProject && (
              <div className="bg-[#111] border border-[#dc2626]/30 rounded-xl p-4 mb-5 animate-slide-up">
                <div className="text-xs font-medium text-[#f5f5f5] mb-3">Add "{selected.title}" to project:</div>
                <div className="flex gap-2">
                  <select value={targetProject} onChange={e=>setTargetProject(e.target.value)}
                    className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626]">
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
                  </select>
                  <Btn variant="primary" size="sm" onClick={addToProject} disabled={!targetProject}>Add</Btn>
                  <Btn variant="muted" size="sm" onClick={()=>setAddingToProject(false)}>Cancel</Btn>
                </div>
              </div>
            )}

            {addedMsg && <div className="text-xs text-[#22c55e] bg-green-950/30 border border-green-500/20 rounded-lg px-4 py-2.5 mb-4 animate-fade-in">{addedMsg}</div>}

            <h2 className="text-lg font-bold text-white mb-1">{selected.title}</h2>
            <div className="text-xs text-[#52525b] mb-5">{selected.category}</div>

            {/* Tags */}
            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selected.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-[#111] border border-[#1f1f1f] text-[#71717a] text-xs px-2 py-0.5 rounded">
                    <Tag size={9}/>{t}
                  </span>
                ))}
              </div>
            )}

            {/* Content sections */}
            {[
              { label:"Description",       val:selected.description },
              { label:"Impact",             val:selected.impact },
              { label:"Steps to Reproduce", val:selected.steps_to_reproduce },
              { label:"Remediation",        val:selected.remediation },
            ].map(s => s.val ? (
              <div key={s.label} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-[#dc2626] rounded-full"/>
                  <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">{s.label}</span>
                </div>
                <div className={`text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-line rounded-lg p-4 border ${
                  s.label === "Remediation"
                    ? "bg-green-950/10 border-green-500/15"
                    : s.label === "Steps to Reproduce"
                    ? "bg-[#0d0d0d] border-[#1a1a1a] font-mono text-xs"
                    : "bg-[#111] border-[#1f1f1f]"}`}>
                  {s.val}
                </div>
              </div>
            ) : null)}

            {/* References */}
            {selected.references.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-[#dc2626] rounded-full"/>
                  <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">References</span>
                </div>
                <div className="space-y-1">
                  {selected.references.map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <Link size={11} className="text-[#3b82f6] flex-shrink-0"/>
                      <span className="text-xs text-[#3b82f6] font-mono break-all">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
