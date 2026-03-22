// src/components/pages/VulnForm.tsx — CVSS 3.1 calculator + full form
import React, { useState } from "react";
import { Btn, Input, Select, Label, TagInput, SeverityBadge, Footer } from "../ui";
import { useApp } from "../../lib/AppContext";
import type { Vulnerability, Severity } from "../../types";
import { defaultVuln } from "../../types";
import { ChevronLeft, Calculator, Paperclip, X as XIcon } from "lucide-react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";

// ── CVSS 3.1 Calculator ───────────────────────────────────────────────────────
const CVSS_METRICS = {
  AV: { label:"Attack Vector",        opts:[["N","Network",0.85],["A","Adjacent",0.62],["L","Local",0.55],["P","Physical",0.2]] },
  AC: { label:"Attack Complexity",    opts:[["L","Low",0.77],["H","High",0.44]] },
  PR: { label:"Privileges Required",  opts:[["N","None",0.85],["L","Low",0.62],["H","High",0.27]] },
  UI: { label:"User Interaction",     opts:[["N","None",0.85],["R","Required",0.62]] },
  S:  { label:"Scope",                opts:[["U","Unchanged",null],["C","Changed",null]] },
  C:  { label:"Confidentiality",      opts:[["H","High",0.56],["L","Low",0.22],["N","None",0.0]] },
  I:  { label:"Integrity",            opts:[["H","High",0.56],["L","Low",0.22],["N","None",0.0]] },
  A:  { label:"Availability",         opts:[["H","High",0.56],["L","Low",0.22],["N","None",0.0]] },
};
type MetricKey = keyof typeof CVSS_METRICS;
type Selections = Record<MetricKey, string>;

function calcCVSS(sel: Selections): number {
  const get = (k: MetricKey) => {
    const m = CVSS_METRICS[k].opts.find(o => o[0] === sel[k]);
    return m ? (m[2] as number) : 0;
  };
  const scope = sel.S;
  const iss = 1 - (1-get("C"))*(1-get("I"))*(1-get("A"));
  const iss_scope = scope === "U" ? 6.42*iss : 7.52*(iss-0.029)-3.25*Math.pow(iss-0.02,15);
  if (iss_scope <= 0) return 0;
  const PR_val = sel.S === "C"
    ? sel.PR === "N" ? 0.85 : sel.PR === "L" ? 0.68 : 0.50
    : get("PR");
  const exploitability = 8.22 * get("AV") * get("AC") * PR_val * get("UI");
  const base = scope === "U"
    ? Math.min(iss_scope + exploitability, 10)
    : Math.min(1.08*(iss_scope + exploitability), 10);
  return Math.ceil(base * 10) / 10;
}

function scoreToSeverity(s: number): Severity {
  if (s >= 9.0) return "Critical";
  if (s >= 7.0) return "High";
  if (s >= 4.0) return "Medium";
  if (s >= 0.1) return "Low";
  return "Info";
}

function CVSSCalculator({ onApply }: { onApply: (score: number, sev: Severity) => void }) {
  const [sel, setSel] = useState<Selections>({ AV:"N",AC:"L",PR:"N",UI:"N",S:"U",C:"H",I:"H",A:"H" });
  const score = calcCVSS(sel);
  const sev = scoreToSeverity(score);
  const sevColor = { Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6",Info:"#71717a" }[sev];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-xl border border-[#2a2a2a]">
        <div>
          <div className="text-xs text-[#71717a] uppercase tracking-wide mb-1">CVSS 3.1 Score</div>
          <div className="text-4xl font-bold" style={{ color: sevColor }}>{score.toFixed(1)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#71717a] mb-2">Severity</div>
          <SeverityBadge severity={sev}/>
          <div className="text-xs text-[#52525b] mt-2 font-mono">
            CVSS:3.1/AV:{sel.AV}/AC:{sel.AC}/PR:{sel.PR}/UI:{sel.UI}/S:{sel.S}/C:{sel.C}/I:{sel.I}/A:{sel.A}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(CVSS_METRICS) as [MetricKey, typeof CVSS_METRICS[MetricKey]][]).map(([key, m]) => (
          <div key={key}>
            <div className="text-xs text-[#71717a] mb-1.5">{m.label}</div>
            <div className="flex gap-2 flex-wrap">
              {m.opts.map(([val, label]) => (
                <button key={val as string} onClick={() => setSel(s => ({ ...s, [key]: val }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    sel[key] === val
                      ? "bg-[rgba(220,38,38,0.2)] border-[#dc2626] text-[#dc2626]"
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-[#71717a] hover:border-[#3a3a3a] hover:text-[#a1a1aa]"
                  }`}>
                  <span className="font-mono font-bold">{val as string}</span>
                  <span className="ml-1.5 opacity-70">{label as string}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Btn variant="primary" className="w-full justify-center" onClick={() => onApply(score, sev)}>
        Apply Score ({score.toFixed(1)} — {sev})
      </Btn>
    </div>
  );
}

// ── Main VulnForm ─────────────────────────────────────────────────────────────
interface VulnFormProps {
  projectId: string;
  existing?: Vulnerability;
  onSave: () => void;
  onCancel: () => void;
}

export function VulnForm({ projectId, existing, onSave, onCancel }: VulnFormProps) {
  const { vulns, saveVulns } = useApp();
  const [form, setForm] = useState<Vulnerability>({
    ...(existing ?? defaultVuln(projectId)),
    evidence_paths: existing?.evidence_paths ?? [],
  });
  const [showCalc, setShowCalc] = useState(false);
  const [activeTab, setActiveTab] = useState<"details"|"technical"|"remediation">("details");

  const f = (k: keyof Vulnerability, v: any) => setForm(x => ({ ...x, [k]: v }));

  const handleSave = async () => {
    const now = new Date().toISOString();
    if (existing) {
      await saveVulns(vulns.map(v => v.id === existing.id ? { ...form, updated_at: now } : v));
    } else {
      await saveVulns([...vulns, { ...form, created_at: now, updated_at: now }]);
    }
    onSave();
  };

  const TA = ({ k, rows=4, placeholder="" }: { k: keyof Vulnerability; rows?: number; placeholder?: string }) => (
    <textarea value={form[k] as string} onChange={e => f(k, e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.2)] placeholder:text-[#52525b] resize-y"/>
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onCancel} className="text-[#71717a] hover:text-[#f5f5f5] flex items-center gap-1.5 text-sm transition-colors">
            <ChevronLeft size={16}/> Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#f5f5f5]">{existing ? "Edit Vulnerability" : "Add Vulnerability"}</h1>
          </div>
          <div className="flex gap-2">
            <Btn variant="muted" onClick={onCancel}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={!form.title}>Save Finding</Btn>
          </div>
        </div>

        {/* Live preview header */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 mb-5 flex items-center gap-4">
          <SeverityBadge severity={form.severity}/>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#f5f5f5]">{form.title || "Untitled Finding"}</div>
            {form.cve_id && <div className="text-xs text-[#71717a] mt-0.5 font-mono">{form.cve_id}</div>}
          </div>
          {form.cvss_score !== null && (
            <div className="text-right">
              <div className="text-xs text-[#71717a]">CVSS</div>
              <div className="text-xl font-bold text-[#dc2626]">{form.cvss_score.toFixed(1)}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-1">
              {(["details","technical","remediation"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                    activeTab === t ? "bg-[#1a1a1a] text-[#f5f5f5] shadow" : "text-[#71717a] hover:text-[#a1a1aa]"}`}>
                  {t}
                </button>
              ))}
            </div>

            {activeTab === "details" && (
              <div className="space-y-4 bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                <div><Label required>Title</Label><Input value={form.title} onChange={e=>f("title",e.target.value)} placeholder="SQL Injection in /api/users"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label required>Severity</Label>
                    <Select value={form.severity} onChange={e=>f("severity",e.target.value as Severity)}>
                      {["Critical","High","Medium","Low","Info"].map(s=><option key={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onChange={e=>f("status",e.target.value as any)}>
                      <option>Open</option><option>Fixed</option><option>Accepted</option>
                    </Select>
                  </div>
                  <div><Label>CVE ID</Label><Input value={form.cve_id} onChange={e=>f("cve_id",e.target.value)} placeholder="CVE-2024-1234"/></div>
                  <div><Label>CVSS Score</Label>
                    <div className="flex gap-2">
                      <Input type="number" min={0} max={10} step={0.1} value={form.cvss_score ?? ""} onChange={e=>f("cvss_score",e.target.value?parseFloat(e.target.value):null)} placeholder="0.0 – 10.0" className="flex-1"/>
                      <button onClick={() => setShowCalc(!showCalc)} className="px-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#71717a] hover:text-[#dc2626] hover:border-[#dc2626] transition-all" title="CVSS Calculator"><Calculator size={15}/></button>
                    </div>
                  </div>
                </div>
                <div><Label>Description</Label><TA k="description" rows={4} placeholder="Describe the vulnerability..."/></div>
                <div><Label>Impact</Label><TA k="impact" rows={3} placeholder="What is the business and technical impact?"/></div>
                <div><Label>Tags</Label><TagInput tags={form.tags} onChange={v=>f("tags",v)} placeholder="Add tag..."/></div>
              {/* Evidence attachments */}
              <div style={{ marginTop:8 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#71717a", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8 }}>
                  Evidence Files
                </label>
                <button onClick={async () => {
                  const path = await openFileDialog({ multiple: true });
                  if (!path) return;
                  const paths = Array.isArray(path) ? path : [path];
                  f("evidence_paths", [...form.evidence_paths, ...paths]);
                }} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:8, color:"#a1a1aa", cursor:"pointer", fontSize:12, fontFamily:"Inter,system-ui,sans-serif", marginBottom:8 }}>
                  <span>📎</span> Attach Evidence Files
                </button>
                {form.evidence_paths.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {form.evidence_paths.map((p, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:"#111", border:"1px solid #1f1f1f", borderRadius:6, padding:"5px 10px" }}>
                        <span style={{ fontSize:12, color:"#3b82f6", fontFamily:"monospace", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.split(/[\\/]/).pop()}</span>
                        <button onClick={() => f("evidence_paths", form.evidence_paths.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", fontSize:14, lineHeight:1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                <div><Label>References</Label><TagInput tags={form.references} onChange={v=>f("references",v)} placeholder="https://..."/></div>
              </div>
            )}

            {activeTab === "technical" && (
              <div className="space-y-4 bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                <div><Label>Steps to Reproduce</Label><TA k="steps_to_reproduce" rows={6} placeholder="1. Navigate to...\n2. Enter payload...\n3. Observe..."/></div>
                <div><Label>Proof of Concept</Label><TA k="proof_of_concept" rows={6} placeholder="curl -X POST https://target.com/api/users -d 'id=1 OR 1=1'"/></div>
              </div>
            )}

            {activeTab === "remediation" && (
              <div className="space-y-4 bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
                <div><Label required>Remediation</Label><TA k="remediation" rows={6} placeholder="Use parameterised queries. Implement input validation..."/></div>
              </div>
            )}
          </div>

          {/* CVSS Calculator sidebar */}
          <div>
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={15} className="text-[#dc2626]"/>
                <h3 className="text-sm font-semibold text-[#f5f5f5]">CVSS 3.1 Calculator</h3>
                <button onClick={() => setShowCalc(!showCalc)} className="ml-auto text-xs text-[#71717a] hover:text-[#dc2626]">
                  {showCalc ? "Hide" : "Show"}
                </button>
              </div>
              {showCalc ? (
                <CVSSCalculator onApply={(score, sev) => { f("cvss_score", score); f("severity", sev); setShowCalc(false); }}/>
              ) : (
                <div className="text-center py-6">
                  <div className="text-[#52525b] text-sm mb-3">Click "Show" to open the interactive CVSS 3.1 calculator</div>
                  <Btn variant="ghost" size="sm" className="mx-auto" onClick={() => setShowCalc(true)}><Calculator size={13}/>Open Calculator</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
