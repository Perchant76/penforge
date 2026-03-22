// src/lib/reportGenerator.ts
import type { Project, Vulnerability, Profile } from "../types";
import { SEVERITY_COLORS } from "../types";
import { loadConfig } from "./storage";

function sevBadge(s: string) {
  const colors: Record<string,string> = { Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6",Info:"#71717a" };
  const bgs: Record<string,string>    = { Critical:"#450a0a",High:"#431407",Medium:"#422006",Low:"#172554",Info:"#18181b" };
  return `<span style="background:${bgs[s]||"#18181b"};color:${colors[s]||"#71717a"};border:1px solid ${colors[s]||"#71717a"}33;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;">${s}</span>`;
}

function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>");
}

export async function generateReport(project: Project, vulns: Vulnerability[]) {
  const cfg = await loadConfig();
  const profile = cfg?.profile;

  const sorted = [...vulns].sort((a,b) => {
    const o = { Critical:0,High:1,Medium:2,Low:3,Info:4 };
    return (o[a.severity as keyof typeof o]??4) - (o[b.severity as keyof typeof o]??4);
  });

  const counts = { Critical:0,High:0,Medium:0,Low:0,Info:0 };
  vulns.forEach(v => { if (counts[v.severity as keyof typeof counts] !== undefined) counts[v.severity as keyof typeof counts]++; });

  const openVulns = vulns.filter(v => v.status === "Open");
  const criticalOrHigh = counts.Critical + counts.High;

  const execSummary = `This report presents the findings of a penetration test conducted against ${project.client || "the target environment"} 
between ${project.start_date} and ${project.end_date}. The assessment identified ${vulns.length} vulnerabilities: 
${counts.Critical} Critical, ${counts.High} High, ${counts.Medium} Medium, ${counts.Low} Low, and ${counts.Info} Informational.
${criticalOrHigh > 0 ? `<strong>${criticalOrHigh} critical/high severity finding${criticalOrHigh>1?"s were":"was"} identified requiring immediate remediation.</strong>` : "No critical or high severity findings were identified."}
The overall security posture ${criticalOrHigh > 2 ? "requires significant improvement" : criticalOrHigh > 0 ? "requires attention in key areas" : "is acceptable with minor improvements recommended"}.`;

  const logoHtml = profile?.logo_path
    ? `<img src="${profile.logo_path}" style="max-height:60px;max-width:200px;object-fit:contain;" alt="Logo"/>`
    : `<svg width="48" height="54" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2L4 9v12c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z" fill="#dc2626" opacity="0.3" stroke="#dc2626" strokeWidth="2"/>
        <text x="20" y="28" text-anchor="middle" fill="#dc2626" font-size="14" font-weight="700" font-family="Inter,sans-serif">PF</text>
       </svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${project.client} Penetration Test Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#1a1a1a;font-size:13px;line-height:1.6}
  @page{size:A4;margin:20mm 15mm}
  @media print{.pagebreak{page-break-before:always}}
  h1{font-size:28px;font-weight:700;color:#0a0a0a}
  h2{font-size:18px;font-weight:600;color:#0a0a0a;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #dc2626}
  h3{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:8px}
  p{color:#374151;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#f8f8f8;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;border-bottom:2px solid #e5e7eb}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;vertical-align:top}
  tr:hover td{background:#fafafa}
  .cover{min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:40px}
  .cover-top{display:flex;justify-content:space-between;align-items:flex-start}
  .cover-mid{text-align:center;padding:40px 0}
  .cover-stripe{height:6px;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:3px;margin:20px 0}
  .cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-top:24px}
  .meta-item label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;display:block;margin-bottom:3px}
  .meta-item span{font-size:13px;font-weight:600;color:#1a1a1a}
  .confidential{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;text-align:center;font-size:11px;color:#dc2626;font-weight:600;letter-spacing:1px;margin-top:24px}
  .section{margin-bottom:32px}
  .vuln-card{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px}
  .vuln-header{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .vuln-body{padding:16px;border-top:1px solid #f3f4f6}
  .vuln-field{margin-bottom:14px}
  .vuln-field label{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;font-weight:600;display:block;margin-bottom:5px}
  .vuln-field .content{background:#f9fafb;border-radius:6px;padding:10px 12px;font-size:12px;color:#374151;white-space:pre-wrap;word-break:break-word}
  .poc{background:#0a0a0a;color:#22c55e;padding:12px 14px;border-radius:6px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all}
  .cvss-badge{background:#dc2626;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
  .summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
  .summary-card{text-align:center;padding:16px 8px;border-radius:8px;border:1px solid #e5e7eb}
  .summary-card .num{font-size:28px;font-weight:800}
  .summary-card .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-top:4px}
  .tester-info{font-size:12px;color:#6b7280}
  .tester-info strong{color:#1a1a1a;display:block}
  .footer-brand{text-align:center;font-size:11px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-top">
    ${logoHtml}
    <div class="tester-info" style="text-align:right">
      ${profile?.full_name ? `<strong>${esc(profile.full_name)}</strong>` : ""}
      ${profile?.title ? esc(profile.title)+"<br/>" : ""}
      ${profile?.company ? esc(profile.company)+"<br/>" : ""}
      ${profile?.email ? esc(profile.email)+"<br/>" : ""}
    </div>
  </div>
  <div class="cover-mid">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#dc2626;margin-bottom:16px;font-weight:600">PENETRATION TEST REPORT</div>
    <div class="cover-stripe"></div>
    <h1 style="font-size:36px;margin:16px 0">${esc(project.client || "Client")}</h1>
    <div style="font-size:16px;color:#6b7280;font-weight:400">${esc(project.name)}</div>
    <div class="cover-meta" style="max-width:480px;margin:24px auto 0">
      <div class="meta-item"><label>Report Date</label><span>${new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</span></div>
      <div class="meta-item"><label>Assessment Period</label><span>${project.start_date} – ${project.end_date}</span></div>
      <div class="meta-item"><label>Total Findings</label><span>${vulns.length}</span></div>
      <div class="meta-item"><label>Status</label><span>${project.status}</span></div>
    </div>
  </div>
  <div>
    <div class="confidential">⚠ CONFIDENTIAL — FOR AUTHORISED RECIPIENTS ONLY</div>
    <div class="footer-brand">Generated by PenForge · Made with ❤️ by Perchant</div>
  </div>
</div>

<!-- EXECUTIVE SUMMARY -->
<div class="pagebreak section" style="padding:40px">
  <h2>Executive Summary</h2>
  <div class="summary-grid">
    ${(["Critical","High","Medium","Low","Info"] as const).map(s => {
      const cs: Record<string,string> = {Critical:"#ef4444",High:"#f97316",Medium:"#f59e0b",Low:"#3b82f6",Info:"#71717a"};
      const bgs: Record<string,string> = {Critical:"#fef2f2",High:"#fff7ed",Medium:"#fffbeb",Low:"#eff6ff",Info:"#fafafa"};
      return `<div class="summary-card" style="background:${bgs[s]};border-color:${cs[s]}33">
        <div class="num" style="color:${cs[s]}">${counts[s as keyof typeof counts]}</div>
        <div class="lbl">${s}</div>
      </div>`;
    }).join("")}
  </div>
  <p>${execSummary}</p>
  ${project.scope ? `<h3 style="margin-top:16px">Scope</h3><p>${esc(project.scope)}</p>` : ""}
</div>

<!-- FINDINGS TABLE -->
<div class="pagebreak section" style="padding:40px">
  <h2>Findings Overview</h2>
  <table>
    <thead><tr><th>#</th><th>Title</th><th>Severity</th><th>CVSS</th><th>CVE</th><th>Status</th></tr></thead>
    <tbody>
      ${sorted.map((v,i) => `
      <tr>
        <td style="color:#9ca3af;font-size:11px">${String(i+1).padStart(2,"0")}</td>
        <td style="font-weight:500">${esc(v.title)}</td>
        <td>${sevBadge(v.severity)}</td>
        <td style="font-family:monospace">${v.cvss_score !== null ? v.cvss_score.toFixed(1) : "—"}</td>
        <td style="font-family:monospace;font-size:11px;color:#6b7280">${v.cve_id || "—"}</td>
        <td><span style="padding:2px 8px;border-radius:4px;font-size:11px;background:${v.status==="Open"?"#450a0a":v.status==="Fixed"?"#052e16":"#18181b"};color:${v.status==="Open"?"#ef4444":v.status==="Fixed"?"#22c55e":"#9ca3af"}">${v.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<!-- DETAILED FINDINGS -->
<div class="pagebreak section" style="padding:40px">
  <h2>Detailed Findings</h2>
  ${sorted.map((v,i) => `
  <div class="vuln-card" style="border-left:4px solid ${SEVERITY_COLORS[v.severity]}">
    <div class="vuln-header" style="background:linear-gradient(90deg,${SEVERITY_COLORS[v.severity]}12,transparent)">
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        <span style="font-size:11px;color:#9ca3af;font-weight:600;min-width:24px">${String(i+1).padStart(2,"0")}</span>
        ${sevBadge(v.severity)}
        <h3 style="margin:0;font-size:14px">${esc(v.title)}</h3>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        ${v.cvss_score !== null ? `<span class="cvss-badge">CVSS ${v.cvss_score.toFixed(1)}</span>` : ""}
        ${v.cve_id ? `<span style="font-size:11px;font-family:monospace;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px">${esc(v.cve_id)}</span>` : ""}
      </div>
    </div>
    <div class="vuln-body">
      ${v.description ? `<div class="vuln-field"><label>Description</label><div class="content">${esc(v.description)}</div></div>` : ""}
      ${v.impact ? `<div class="vuln-field"><label>Impact</label><div class="content">${esc(v.impact)}</div></div>` : ""}
      ${v.steps_to_reproduce ? `<div class="vuln-field"><label>Steps to Reproduce</label><div class="content">${esc(v.steps_to_reproduce)}</div></div>` : ""}
      ${v.proof_of_concept ? `<div class="vuln-field"><label>Proof of Concept</label><div class="poc">${esc(v.proof_of_concept)}</div></div>` : ""}
      ${v.remediation ? `<div class="vuln-field"><label>Remediation</label><div class="content" style="border-left:3px solid #22c55e">${esc(v.remediation)}</div></div>` : ""}
      ${v.references.length>0 ? `<div class="vuln-field"><label>References</label><div style="display:flex;gap:6px;flex-wrap:wrap">${v.references.map(r=>`<a href="${r}" style="font-size:11px;color:#3b82f6">${esc(r)}</a>`).join("")}</div></div>` : ""}
    </div>
  </div>`).join("")}
</div>

<!-- REMEDIATION SUMMARY -->
<div class="pagebreak section" style="padding:40px">
  <h2>Remediation Summary</h2>
  <table>
    <thead><tr><th>Finding</th><th>Severity</th><th>Status</th><th>Remediation Summary</th></tr></thead>
    <tbody>
      ${sorted.map(v => `
      <tr>
        <td style="font-weight:500;max-width:200px">${esc(v.title)}</td>
        <td>${sevBadge(v.severity)}</td>
        <td><span style="padding:2px 8px;border-radius:4px;font-size:11px;background:${v.status==="Fixed"?"#052e16":"#450a0a"};color:${v.status==="Fixed"?"#22c55e":"#ef4444"}">${v.status}</span></td>
        <td style="font-size:12px;color:#6b7280;max-width:300px">${v.remediation ? esc(v.remediation.slice(0,120)) + (v.remediation.length > 120 ? "..." : "") : "—"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="footer-brand">Made with ❤️ by Perchant · PenForge Report Manager</div>
</div>

<script>
  window.onload = () => window.print();
</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1000,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
