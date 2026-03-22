// src/lib/reportGenerator.ts
import { invoke } from "@tauri-apps/api/core";
import type { Project, Vulnerability } from "../types";
import { SEVERITY_COLORS } from "../types";
import { loadConfig } from "./storage";

// ── Placeholder system ────────────────────────────────────────────────────────
// Custom templates use these placeholders which get replaced at render time.
export const PLACEHOLDERS = {
  // Project
  "{{PROJECT_NAME}}":       "Project name",
  "{{CLIENT_NAME}}":        "Client name",
  "{{START_DATE}}":         "Engagement start date",
  "{{END_DATE}}":           "Engagement end date",
  "{{SCOPE}}":              "Engagement scope",
  "{{STATUS}}":             "Project status",
  "{{REPORT_DATE}}":        "Today's date",
  // Tester profile
  "{{TESTER_NAME}}":        "Tester full name",
  "{{TESTER_TITLE}}":       "Tester job title",
  "{{TESTER_COMPANY}}":     "Tester company",
  "{{TESTER_EMAIL}}":       "Tester email",
  "{{TESTER_PHONE}}":       "Tester phone",
  // Counts
  "{{TOTAL_FINDINGS}}":     "Total vulnerability count",
  "{{CRITICAL_COUNT}}":     "Critical vulnerability count",
  "{{HIGH_COUNT}}":         "High vulnerability count",
  "{{MEDIUM_COUNT}}":       "Medium vulnerability count",
  "{{LOW_COUNT}}":          "Low vulnerability count",
  "{{INFO_COUNT}}":         "Info vulnerability count",
  "{{OPEN_COUNT}}":         "Open vulnerability count",
  "{{FIXED_COUNT}}":        "Fixed vulnerability count",
  // Dynamic blocks — these get replaced with generated HTML tables/sections
  "{{FINDINGS_TABLE}}":     "HTML table of all findings (severity sorted)",
  "{{FINDINGS_DETAIL}}":    "Full detailed findings sections",
  "{{EXECUTIVE_SUMMARY}}":  "Auto-generated executive summary paragraph",
  "{{REMEDIATION_TABLE}}":  "Remediation summary table",
  "{{LOGO}}":               "Company logo (img tag or placeholder)",
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  html: string;   // Full HTML with placeholders
  createdAt: string;
  isBuiltIn: boolean;
};

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function sevBadge(s: string): string {
  const colors: Record<string, string> = {
    Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#3b82f6", Info: "#71717a"
  };
  const bgs: Record<string, string> = {
    Critical: "#450a0a", High: "#431407", Medium: "#422006", Low: "#172554", Info: "#18181b"
  };
  const c = colors[s] ?? "#71717a";
  const bg = bgs[s] ?? "#18181b";
  return `<span style="background:${bg};color:${c};border:1px solid ${c}44;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.5px">${s}</span>`;
}

function statusBadge(s: string): string {
  const styles: Record<string, string> = {
    Open:     "background:#450a0a;color:#ef4444",
    Fixed:    "background:#052e16;color:#22c55e",
    Accepted: "background:#18181b;color:#71717a",
  };
  return `<span style="${styles[s] ?? styles.Open};padding:2px 8px;border-radius:4px;font-size:11px">${s}</span>`;
}

// ── Dynamic block generators ──────────────────────────────────────────────────
function buildFindingsTable(sorted: Vulnerability[]): string {
  if (!sorted.length) return "<p style='color:#6b7280;font-style:italic'>No vulnerabilities recorded.</p>";
  return `
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead>
      <tr style="background:#f8f8f8;border-bottom:2px solid #e5e7eb">
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">#</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Title</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Severity</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">CVSS</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">CVE / CWE</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Status</th>
      </tr>
    </thead>
    <tbody>
      ${sorted.map((v, i) => `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:10px 12px;font-size:11px;color:#9ca3af">${String(i + 1).padStart(2, "0")}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:500">${esc(v.title)}</td>
          <td style="padding:10px 12px">${sevBadge(v.severity)}</td>
          <td style="padding:10px 12px;font-size:12px;font-family:monospace">${v.cvss_score !== null ? v.cvss_score.toFixed(1) : "—"}</td>
          <td style="padding:10px 12px;font-size:11px;font-family:monospace;color:#6b7280">${esc(v.cve_id || "—")}</td>
          <td style="padding:10px 12px">${statusBadge(v.status)}</td>
        </tr>`).join("")}
    </tbody>
  </table>`;
}

function buildFindingsDetail(sorted: Vulnerability[]): string {
  return sorted.map((v, i) => `
  <div style="border:1px solid #e5e7eb;border-left:4px solid ${SEVERITY_COLORS[v.severity]};border-radius:10px;overflow:hidden;margin-bottom:24px;page-break-inside:avoid">
    <div style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(90deg,${SEVERITY_COLORS[v.severity]}10,transparent)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;min-width:24px">${String(i + 1).padStart(2, "0")}</span>
        ${sevBadge(v.severity)}
        <h3 style="margin:0;font-size:14px;font-weight:600;color:#111">${esc(v.title)}</h3>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        ${v.cvss_score !== null ? `<span style="background:#dc2626;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">CVSS ${v.cvss_score.toFixed(1)}</span>` : ""}
        ${v.cve_id ? `<span style="font-size:11px;font-family:monospace;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px">${esc(v.cve_id)}</span>` : ""}
        ${statusBadge(v.status)}
      </div>
    </div>
    <div style="padding:18px">
      ${v.description ? `<div style="margin-bottom:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">Description</div><div style="background:#f9fafb;border-radius:6px;padding:10px 14px;font-size:12px;color:#374151;line-height:1.7">${esc(v.description)}</div></div>` : ""}
      ${v.impact ? `<div style="margin-bottom:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">Impact</div><div style="background:#fef2f2;border-radius:6px;padding:10px 14px;font-size:12px;color:#374151;line-height:1.7;border-left:3px solid #ef4444">${esc(v.impact)}</div></div>` : ""}
      ${v.steps_to_reproduce ? `<div style="margin-bottom:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">Steps to Reproduce</div><div style="background:#0a0a0a;color:#22c55e;padding:12px 14px;border-radius:6px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-word;line-height:1.7">${esc(v.steps_to_reproduce)}</div></div>` : ""}
      ${v.proof_of_concept ? `<div style="margin-bottom:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">Proof of Concept</div><div style="background:#0a0a0a;color:#60a5fa;padding:12px 14px;border-radius:6px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-word;line-height:1.7">${esc(v.proof_of_concept)}</div></div>` : ""}
      ${v.remediation ? `<div style="margin-bottom:14px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">Remediation</div><div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:6px;padding:10px 14px;font-size:12px;color:#374151;line-height:1.7">${esc(v.remediation)}</div></div>` : ""}
      ${v.references.length ? `<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;margin-bottom:6px">References</div><div style="display:flex;flex-direction:column;gap:4px">${v.references.map(r => `<a href="${r}" style="font-size:11px;color:#3b82f6;text-decoration:none;font-family:monospace">↗ ${esc(r)}</a>`).join("")}</div></div>` : ""}
    </div>
  </div>`).join("");
}

function buildRemediationTable(sorted: Vulnerability[]): string {
  return `
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f8f8f8;border-bottom:2px solid #e5e7eb">
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Finding</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Severity</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Status</th>
        <th style="text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280">Remediation Summary</th>
      </tr>
    </thead>
    <tbody>
      ${sorted.map(v => `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:10px 12px;font-size:12px;font-weight:500;max-width:200px">${esc(v.title)}</td>
          <td style="padding:10px 12px">${sevBadge(v.severity)}</td>
          <td style="padding:10px 12px">${statusBadge(v.status)}</td>
          <td style="padding:10px 12px;font-size:12px;color:#6b7280;max-width:300px">${v.remediation ? esc(v.remediation.slice(0, 150)) + (v.remediation.length > 150 ? "…" : "") : "—"}</td>
        </tr>`).join("")}
    </tbody>
  </table>`;
}

// ── Placeholder replacement ───────────────────────────────────────────────────
export function applyPlaceholders(
  template: string,
  project: Project,
  vulns: Vulnerability[],
  profile: { full_name: string; title: string; company: string; email: string; phone: string; logo_path: string } | null
): string {
  const sorted = [...vulns].sort((a, b) => {
    const o: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };
    return (o[a.severity] ?? 4) - (o[b.severity] ?? 4);
  });

  const counts = {
    Critical: vulns.filter(v => v.severity === "Critical").length,
    High:     vulns.filter(v => v.severity === "High").length,
    Medium:   vulns.filter(v => v.severity === "Medium").length,
    Low:      vulns.filter(v => v.severity === "Low").length,
    Info:     vulns.filter(v => v.severity === "Info").length,
    Open:     vulns.filter(v => v.status === "Open").length,
    Fixed:    vulns.filter(v => v.status === "Fixed").length,
  };

  const critHigh = counts.Critical + counts.High;
  const execSummary = `This report presents the findings of a penetration test conducted against
    <strong>${esc(project.client || "the target environment")}</strong> between
    ${project.start_date} and ${project.end_date}. The assessment identified
    <strong>${vulns.length} vulnerabilities</strong>:
    ${counts.Critical} Critical, ${counts.High} High, ${counts.Medium} Medium,
    ${counts.Low} Low, and ${counts.Info} Informational.
    ${critHigh > 0
      ? `<strong>${critHigh} critical/high severity finding${critHigh > 1 ? "s" : ""} require immediate remediation.</strong>`
      : "No critical or high severity findings were identified."}
    The overall security posture
    ${critHigh > 3 ? "requires significant and urgent improvement"
      : critHigh > 0 ? "requires attention in key areas"
      : "is acceptable with minor improvements recommended"}.`;

  const logoHtml = profile?.logo_path
    ? `<img src="file:///${profile.logo_path.replace(/\\/g, "/")}" style="max-height:70px;max-width:220px;object-fit:contain" alt="Logo"/>`
    : `<svg width="52" height="64" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">
         <path d="M20 2L4 9v12c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z" fill="#dc2626" opacity="0.25" stroke="#dc2626" strokeWidth="2"/>
         <path d="M20 10L10 14v8c0 6.2 4.5 12 10 14 5.5-2 10-7.8 10-14v-8L20 10z" fill="#dc2626" opacity="0.4"/>
         <text x="20" y="27" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Inter,sans-serif">PF</text>
       </svg>`;

  const replacements: Record<string, string> = {
    "{{PROJECT_NAME}}":      esc(project.name),
    "{{CLIENT_NAME}}":       esc(project.client),
    "{{START_DATE}}":        project.start_date,
    "{{END_DATE}}":          project.end_date,
    "{{SCOPE}}":             esc(project.scope || "Not specified"),
    "{{STATUS}}":            project.status,
    "{{REPORT_DATE}}":       new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    "{{TESTER_NAME}}":       esc(profile?.full_name ?? ""),
    "{{TESTER_TITLE}}":      esc(profile?.title ?? ""),
    "{{TESTER_COMPANY}}":    esc(profile?.company ?? ""),
    "{{TESTER_EMAIL}}":      esc(profile?.email ?? ""),
    "{{TESTER_PHONE}}":      esc(profile?.phone ?? ""),
    "{{TOTAL_FINDINGS}}":    String(vulns.length),
    "{{CRITICAL_COUNT}}":    String(counts.Critical),
    "{{HIGH_COUNT}}":        String(counts.High),
    "{{MEDIUM_COUNT}}":      String(counts.Medium),
    "{{LOW_COUNT}}":         String(counts.Low),
    "{{INFO_COUNT}}":        String(counts.Info),
    "{{OPEN_COUNT}}":        String(counts.Open),
    "{{FIXED_COUNT}}":       String(counts.Fixed),
    "{{LOGO}}":              logoHtml,
    "{{FINDINGS_TABLE}}":    buildFindingsTable(sorted),
    "{{FINDINGS_DETAIL}}":   buildFindingsDetail(sorted),
    "{{EXECUTIVE_SUMMARY}}": execSummary,
    "{{REMEDIATION_TABLE}}": buildRemediationTable(sorted),
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

// ── Built-in professional template ────────────────────────────────────────────
export function getBuiltInTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>{{PROJECT_NAME}} — Penetration Test Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#1a1a1a;font-size:13px;line-height:1.6}
  @page{size:A4;margin:18mm 14mm}
  @media print{
    .no-print{display:none!important}
    .pagebreak{page-break-before:always}
    body{font-size:12px}
  }
  h2{font-size:18px;font-weight:700;color:#0a0a0a;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #dc2626}
  h3{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:8px}
  p{color:#374151;margin-bottom:10px;line-height:1.7}
  a{color:#3b82f6;text-decoration:none}
  .section{margin-bottom:36px}
  /* Print button */
  .print-bar{
    position:fixed;bottom:0;left:0;right:0;
    background:#0a0a0a;border-top:2px solid #dc2626;
    padding:14px 24px;display:flex;align-items:center;justify-content:space-between;
    z-index:999;box-shadow:0 -4px 24px rgba(0,0,0,0.5)
  }
  .print-bar p{color:#a1a1aa;font-size:12px;margin:0}
  .print-btn{
    background:#dc2626;color:#fff;border:none;padding:10px 28px;border-radius:8px;
    font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.5px;
    box-shadow:0 0 20px rgba(220,38,38,0.4);
  }
  .print-btn:hover{background:#b91c1c}
  /* Cover */
  .cover{min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:48px 48px 32px}
  .cover-stripe{height:5px;background:linear-gradient(90deg,#dc2626,#ef4444,#f97316);border-radius:3px;margin:24px 0}
  .cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-top:24px;max-width:480px}
  .meta-item label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;display:block;margin-bottom:3px;font-weight:600}
  .meta-item span{font-size:13px;font-weight:600;color:#111}
  .confidential{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;text-align:center;font-size:11px;color:#dc2626;font-weight:700;letter-spacing:1.5px;margin-top:20px;text-transform:uppercase}
  /* Summary grid */
  .summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
  .summary-card{text-align:center;padding:16px 8px;border-radius:10px;border:1px solid #e5e7eb}
  .summary-card .num{font-size:28px;font-weight:800;line-height:1}
  .summary-card .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-top:6px;font-weight:600}
  .footer-brand{text-align:center;font-size:11px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb}
  .tester-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;font-size:12px;color:#374151;margin-top:12px}
  .tester-card strong{display:block;font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
</style>
</head>
<body>

<!-- PRINT BAR (hidden when printing) -->
<div class="print-bar no-print">
  <div>
    <p>📄 <strong style="color:#f5f5f5">{{PROJECT_NAME}}</strong> — Penetration Test Report</p>
    <p style="font-size:11px;margin-top:2px">Press <kbd style="background:#1a1a1a;border:1px solid #3a3a3a;padding:1px 6px;border-radius:4px;color:#f5f5f5">Ctrl+P</kbd> or click Save as PDF to export</p>
  </div>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
</div>

<!-- ═══════════════════════════════════════ COVER ═══════════════════════════ -->
<div class="cover" style="padding-bottom:80px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    {{LOGO}}
    <div class="tester-card" style="text-align:right;max-width:240px">
      <strong>{{TESTER_NAME}}</strong>
      {{TESTER_TITLE}}<br/>
      {{TESTER_COMPANY}}<br/>
      <span style="color:#6b7280">{{TESTER_EMAIL}}</span>
    </div>
  </div>

  <div>
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:4px;color:#dc2626;margin-bottom:16px;font-weight:700">Penetration Test Report</div>
    <div class="cover-stripe"></div>
    <h1 style="font-size:38px;font-weight:800;color:#0a0a0a;margin:16px 0 4px;letter-spacing:-1px">{{CLIENT_NAME}}</h1>
    <div style="font-size:16px;color:#6b7280;font-weight:400">{{PROJECT_NAME}}</div>

    <div class="cover-meta">
      <div class="meta-item"><label>Report Date</label><span>{{REPORT_DATE}}</span></div>
      <div class="meta-item"><label>Assessment Period</label><span>{{START_DATE}} – {{END_DATE}}</span></div>
      <div class="meta-item"><label>Total Findings</label><span>{{TOTAL_FINDINGS}}</span></div>
      <div class="meta-item"><label>Project Status</label><span>{{STATUS}}</span></div>
    </div>
    <div class="confidential">⚠ Confidential — For Authorised Recipients Only</div>
  </div>

  <div class="footer-brand">Generated by PenForge · Made with ❤️ by Perchant</div>
</div>

<!-- ══════════════════════════════ EXECUTIVE SUMMARY ═══════════════════════ -->
<div class="pagebreak section" style="padding:48px">
  <h2>Executive Summary</h2>
  <div class="summary-grid">
    <div class="summary-card" style="background:#fef2f2;border-color:#fecaca"><div class="num" style="color:#ef4444">{{CRITICAL_COUNT}}</div><div class="lbl">Critical</div></div>
    <div class="summary-card" style="background:#fff7ed;border-color:#fed7aa"><div class="num" style="color:#f97316">{{HIGH_COUNT}}</div><div class="lbl">High</div></div>
    <div class="summary-card" style="background:#fffbeb;border-color:#fde68a"><div class="num" style="color:#f59e0b">{{MEDIUM_COUNT}}</div><div class="lbl">Medium</div></div>
    <div class="summary-card" style="background:#eff6ff;border-color:#bfdbfe"><div class="num" style="color:#3b82f6">{{LOW_COUNT}}</div><div class="lbl">Low</div></div>
    <div class="summary-card" style="background:#f9fafb;border-color:#e5e7eb"><div class="num" style="color:#6b7280">{{INFO_COUNT}}</div><div class="lbl">Info</div></div>
  </div>
  <p>{{EXECUTIVE_SUMMARY}}</p>
  <h3 style="margin-top:20px">Scope</h3>
  <p>{{SCOPE}}</p>
</div>

<!-- ════════════════════════════ FINDINGS OVERVIEW ═════════════════════════ -->
<div class="pagebreak section" style="padding:48px">
  <h2>Findings Overview</h2>
  {{FINDINGS_TABLE}}
</div>

<!-- ════════════════════════════ DETAILED FINDINGS ═════════════════════════ -->
<div class="pagebreak section" style="padding:48px">
  <h2>Detailed Findings</h2>
  {{FINDINGS_DETAIL}}
</div>

<!-- ══════════════════════════ REMEDIATION SUMMARY ═════════════════════════ -->
<div class="pagebreak section" style="padding:48px">
  <h2>Remediation Summary</h2>
  {{REMEDIATION_TABLE}}
  <div class="footer-brand" style="margin-top:48px">Made with ❤️ by Perchant · PenForge Report Manager</div>
</div>

<!-- Spacer for print bar -->
<div style="height:80px" class="no-print"></div>
</body>
</html>`;
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function generateReport(
  project: Project,
  vulns: Vulnerability[],
  customTemplate?: string
): Promise<void> {
  const cfg = await loadConfig();
  const profile = cfg?.profile ?? null;

  const template = customTemplate ?? getBuiltInTemplate();
  const html = applyPlaceholders(template, project, vulns, profile);

  // Use Rust command to write file and open in OS browser
  await invoke("open_report_in_browser", { html });
}
