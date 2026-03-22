// src/lib/universalImporter.ts
// Universal vulnerability importer — parses output from 20+ security tools
// and converts to PenForge VulnFinding format

import type { Vulnerability, Severity } from "../types";

export interface ImportResult {
  vulnerabilities: Omit<Vulnerability, "id" | "project_id" | "created_at" | "updated_at">[];
  tool: string;
  count: number;
  errors: string[];
}

// ── Severity normaliser ───────────────────────────────────────────────────────
function normaliseSeverity(raw: string): Severity {
  const s = raw.toLowerCase().trim();
  if (["critical","crit","p0","0","10"].some(x => s.includes(x))) return "Critical";
  if (["high","p1","1","severe"].some(x => s.includes(x))) return "High";
  if (["medium","med","p2","2","moderate","warning"].some(x => s.includes(x))) return "Medium";
  if (["low","p3","3","minor","info","informational","note"].some(x => s.includes(x))) return "Low";
  return "Info";
}

function blankVuln(): Omit<Vulnerability, "id"|"project_id"|"created_at"|"updated_at"> {
  return {
    title: "", severity: "Info", cvss_score: null, cve_id: "",
    description: "", impact: "", steps_to_reproduce: "",
    proof_of_concept: "", remediation: "", references: [],
    status: "Open", tags: [],
  };
}

// ── Tool parsers ──────────────────────────────────────────────────────────────

/** Nessus .nessus XML export */
function parseNessus(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];

  // Each <ReportItem> is a finding
  const itemRe = /<ReportItem\s([^>]+)>([\s\S]*?)<\/ReportItem>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(text)) !== null) {
    try {
      const attrs = m[1];
      const body  = m[2];

      const get = (tag: string) => {
        const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
        return r.exec(body)?.[1]?.trim() ?? "";
      };
      const attr = (name: string) => {
        const r = new RegExp(`${name}="([^"]+)"`);
        return r.exec(attrs)?.[1] ?? "";
      };

      const pluginName = attr("pluginName");
      const severity   = attr("severity"); // 0=info,1=low,2=med,3=high,4=crit
      const sevMap: Record<string, Severity> = { "4":"Critical","3":"High","2":"Medium","1":"Low","0":"Info" };
      const cve  = get("cve");
      const cvss = parseFloat(get("cvss3_base_score") || get("cvss_base_score") || "0") || null;

      if (!pluginName) continue;

      vulns.push({
        ...blankVuln(),
        title:             pluginName,
        severity:          sevMap[severity] ?? "Info",
        cvss_score:        cvss,
        cve_id:            cve,
        description:       get("description"),
        impact:            get("synopsis"),
        remediation:       get("solution"),
        proof_of_concept:  get("plugin_output"),
        references:        get("see_also").split("\n").map(s => s.trim()).filter(Boolean),
        tags:              ["nessus", get("pluginFamily")].filter(Boolean),
      });
    } catch (e) { errors.push(`Parse error: ${e}`); }
  }

  return { vulnerabilities: vulns, tool: "Nessus", count: vulns.length, errors };
}

/** OpenVAS / GVM XML report */
function parseOpenVAS(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];
  const resultRe = /<result\s[^>]*>([\s\S]*?)<\/result>/g;
  let m: RegExpExecArray | null;

  while ((m = resultRe.exec(text)) !== null) {
    try {
      const body = m[1];
      const get = (tag: string) => new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(body)?.[1]?.trim() ?? "";
      const name = get("name");
      if (!name || name === "0 CVEs") continue;
      const threat = get("threat"); // High, Medium, Low, Log
      const cvss = parseFloat(get("cvss_base") || "0") || null;

      vulns.push({
        ...blankVuln(),
        title:       name,
        severity:    normaliseSeverity(threat),
        cvss_score:  cvss,
        cve_id:      get("cve"),
        description: get("description"),
        impact:      get("impact"),
        remediation: get("solution"),
        proof_of_concept: get("port") ? `Port: ${get("port")}` : "",
        tags:        ["openvas"],
      });
    } catch (e) { errors.push(`${e}`); }
  }
  return { vulnerabilities: vulns, tool: "OpenVAS/GVM", count: vulns.length, errors };
}

/** Burp Suite XML export */
function parseBurp(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];
  const issueRe = /<issue>([\s\S]*?)<\/issue>/g;
  let m: RegExpExecArray | null;

  while ((m = issueRe.exec(text)) !== null) {
    try {
      const body = m[1];
      const get = (tag: string) => {
        const raw = new RegExp(`<${tag}>(<!\\[CDATA\\[)?([\\s\\S]*?)(\\]\\]>)?<\\/${tag}>`).exec(body)?.[2]?.trim() ?? "";
        return raw.replace(/<[^>]+>/g, ""); // strip inner HTML tags
      };

      const name = get("name") || get("type");
      if (!name) continue;

      vulns.push({
        ...blankVuln(),
        title:             name,
        severity:          normaliseSeverity(get("severity")),
        cvss_score:        null,
        cve_id:            "",
        description:       get("issueBackground") || get("issueDetail"),
        impact:            get("issueBackground"),
        remediation:       get("remediationBackground") || get("remediationDetail"),
        proof_of_concept:  get("requestresponse") || get("issueDetail"),
        steps_to_reproduce: get("issueDetail"),
        references:        get("references").split("\n").map(s=>s.trim()).filter(Boolean),
        tags:              ["burp-suite"],
      });
    } catch (e) { errors.push(`${e}`); }
  }
  return { vulnerabilities: vulns, tool: "Burp Suite", count: vulns.length, errors };
}

/** OWASP ZAP XML/JSON export */
function parseZAP(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];

  // Try JSON first
  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      const data = JSON.parse(text);
      const site = Array.isArray(data) ? data : data.site ?? [data];
      for (const s of (Array.isArray(site) ? site : [site])) {
        const alerts = s.alerts ?? s.alert ?? [];
        for (const a of (Array.isArray(alerts) ? alerts : [alerts])) {
          if (!a.name && !a.alert) continue;
          vulns.push({
            ...blankVuln(),
            title:             a.name ?? a.alert,
            severity:          normaliseSeverity(String(a.riskdesc ?? a.risk ?? a.riskcode ?? "info")),
            cvss_score:        null,
            cve_id:            "",
            description:       a.desc ?? a.description ?? "",
            impact:            a.desc ?? "",
            remediation:       a.solution ?? "",
            proof_of_concept:  a.evidence ?? a.url ?? "",
            references:        (a.reference ?? "").split("\n").filter(Boolean),
            tags:              ["zap", "owasp"],
          });
        }
      }
      return { vulnerabilities: vulns, tool: "OWASP ZAP", count: vulns.length, errors };
    } catch { /* fall through to XML */ }
  }

  // XML
  const alertRe = /<alertitem>([\s\S]*?)<\/alertitem>/g;
  let m: RegExpExecArray | null;
  while ((m = alertRe.exec(text)) !== null) {
    try {
      const body = m[1];
      const get = (tag: string) => new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(body)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g,"").trim() ?? "";
      vulns.push({
        ...blankVuln(),
        title:       get("alert") || get("name"),
        severity:    normaliseSeverity(get("riskdesc") || get("riskcode")),
        description: get("desc"),
        remediation: get("solution"),
        proof_of_concept: get("evidence") || get("uri"),
        references:  get("reference").split("\n").filter(Boolean),
        tags:        ["zap","owasp"],
      });
    } catch(e) { errors.push(`${e}`); }
  }
  return { vulnerabilities: vulns, tool: "OWASP ZAP", count: vulns.length, errors };
}

/** Nuclei JSONL output */
function parseNuclei(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];

  for (const line of text.split("\n")) {
    const l = line.trim();
    if (!l || !l.startsWith("{")) continue;
    try {
      const r = JSON.parse(l);
      const info = r.info ?? {};
      const sev = info.severity ?? r.severity ?? "info";
      vulns.push({
        ...blankVuln(),
        title:        info.name ?? r["template-id"] ?? "Nuclei Finding",
        severity:     normaliseSeverity(sev),
        cvss_score:   info.classification?.["cvss-score"] ?? null,
        cve_id:       (info.classification?.["cve-id"] ?? []).join(", "),
        description:  info.description ?? r.description ?? "",
        impact:       info.impact ?? "",
        remediation:  info.remediation ?? "",
        proof_of_concept: r.matched ?? r.url ?? r["matched-at"] ?? "",
        references:   info.reference ?? [],
        tags:         ["nuclei", ...(info.tags ?? [])],
      });
    } catch(e) { errors.push(`Line error: ${e}`); }
  }
  return { vulnerabilities: vulns, tool: "Nuclei", count: vulns.length, errors };
}

/** Nikto text/XML output */
function parseNikto(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];

  // Try XML
  if (text.includes("<niktoscan>") || text.includes("<item>")) {
    const itemRe = /<item\s[^>]*>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(text)) !== null) {
      try {
        const body = m[1];
        const get = (tag: string) => new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(body)?.[1]?.trim() ?? "";
        const desc = get("description");
        if (!desc) continue;
        vulns.push({
          ...blankVuln(),
          title:       `Nikto: ${desc.slice(0, 80)}`,
          severity:    normaliseSeverity(get("osvdbid") ? "Medium" : "Info"),
          description: desc,
          proof_of_concept: get("uri"),
          tags:        ["nikto"],
        });
      } catch(e) { errors.push(`${e}`); }
    }
  } else {
    // Text output: "+ " lines
    for (const line of text.split("\n")) {
      if (!line.startsWith("+ ")) continue;
      const msg = line.slice(2).trim();
      if (msg.length < 10 || msg.startsWith("Target") || msg.startsWith("Start") || msg.startsWith("End") || msg.startsWith("0 error")) continue;
      vulns.push({
        ...blankVuln(),
        title:       `Nikto: ${msg.slice(0, 80)}`,
        severity:    msg.toLowerCase().includes("version") || msg.toLowerCase().includes("cve") ? "Medium" : "Info",
        description: msg,
        tags:        ["nikto"],
      });
    }
  }
  return { vulnerabilities: vulns, tool: "Nikto", count: vulns.length, errors };
}

/** Metasploit XML report */
function parseMetasploit(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];
  const vulnRe = /<vuln\s[^>]*>([\s\S]*?)<\/vuln>/g;
  let m: RegExpExecArray | null;

  while ((m = vulnRe.exec(text)) !== null) {
    try {
      const body = m[1];
      const get = (tag: string) => new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(body)?.[1]?.trim() ?? "";
      const name = get("name");
      if (!name) continue;
      vulns.push({
        ...blankVuln(),
        title:       name,
        severity:    normaliseSeverity(get("risk") || get("severity") || "medium"),
        cve_id:      get("refs")?.match(/CVE-\d{4}-\d+/)?.[0] ?? "",
        description: get("info"),
        tags:        ["metasploit"],
      });
    } catch(e) { errors.push(`${e}`); }
  }
  return { vulnerabilities: vulns, tool: "Metasploit", count: vulns.length, errors };
}

/** Nmap XML (vulners/vuln script output) */
function parseNmap(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];

  // Extract <script id="vulners"> or <script id="vuln"> output
  const scriptRe = /<script\s+id="(?:vulners|vuln)[^"]*"\s+output="([^"]+)"/g;
  let m: RegExpExecArray | null;

  while ((m = scriptRe.exec(text)) !== null) {
    try {
      const output = m[1].replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#10;/g,"\n");
      // Each CVE line: "CVE-XXXX-XXXX	score	url"
      for (const line of output.split(/\\n|\n/)) {
        const cveMatch = line.match(/CVE-(\d{4}-\d+)\s+([\d.]+)/);
        if (!cveMatch) continue;
        const score = parseFloat(cveMatch[2]);
        vulns.push({
          ...blankVuln(),
          title:      `CVE-${cveMatch[1]} (Nmap Vulners)`,
          severity:   score >= 9 ? "Critical" : score >= 7 ? "High" : score >= 4 ? "Medium" : "Low",
          cvss_score: score,
          cve_id:     `CVE-${cveMatch[1]}`,
          description: `Vulnerability detected by Nmap Vulners script. CVSS: ${score}`,
          tags:       ["nmap","vulners"],
        });
      }
    } catch(e) { errors.push(`${e}`); }
  }
  return { vulnerabilities: vulns, tool: "Nmap (Vulners)", count: vulns.length, errors };
}

/** SQLMap text output */
function parseSQLMap(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  let target = "";
  const urlM = text.match(/target URL[:\s]+([^\s\n]+)/i);
  if (urlM) target = urlM[1];

  const injRe = /Parameter:\s*(.+?)\s*\(([^)]+)\)[\s\S]*?Type:\s*(.+?)\n[\s\S]*?Title:\s*(.+?)\n[\s\S]*?Payload:\s*(.+?)(?=\n---|\nParameter:|$)/g;
  let m: RegExpExecArray | null;

  while ((m = injRe.exec(text)) !== null) {
    vulns.push({
      ...blankVuln(),
      title:             `SQL Injection — Parameter: ${m[1].trim()} (${m[2].trim()})`,
      severity:          "Critical",
      cvss_score:        9.8,
      cve_id:            "CWE-89",
      description:       `SQLmap confirmed SQL injection in parameter '${m[1].trim()}'. Injection type: ${m[3].trim()}`,
      impact:            "Full database compromise possible. Data exfiltration, modification, deletion, and potential RCE.",
      proof_of_concept:  `Payload: ${m[5].trim()}`,
      steps_to_reproduce: `Target: ${target}\nParameter: ${m[1].trim()}\nType: ${m[3].trim()}\nTitle: ${m[4].trim()}\nPayload: ${m[5].trim()}`,
      remediation:       "Use parameterised queries / prepared statements. Never concatenate user input into SQL queries.",
      references:        ["https://owasp.org/www-community/attacks/SQL_Injection","https://cwe.mitre.org/data/definitions/89.html"],
      tags:              ["sqlmap","sqli","injection"],
    });
  }

  // Also catch simple "is vulnerable" lines
  if (vulns.length === 0 && text.toLowerCase().includes("is vulnerable")) {
    vulns.push({
      ...blankVuln(),
      title:       "SQL Injection Detected (SQLMap)",
      severity:    "Critical",
      cvss_score:  9.8,
      cve_id:      "CWE-89",
      description: text.split("\n").filter(l=>l.toLowerCase().includes("vulnerab")).slice(0,3).join("\n"),
      tags:        ["sqlmap","sqli"],
    });
  }
  return { vulnerabilities: vulns, tool: "SQLMap", count: vulns.length, errors: [] };
}

/** Generic CSV — common column names from many tools */
function parseCSV(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { vulnerabilities: [], tool: "CSV", count: 0, errors: ["File too short"] };

  // Parse CSV properly (handle quoted fields)
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g,"_"));
  const idx = (names: string[]) => {
    for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  };

  const titleIdx  = idx(["title","name","vulnerability","vuln_name","finding","issue","check_name"]);
  const sevIdx    = idx(["severity","risk","risk_level","priority","criticality"]);
  const descIdx   = idx(["description","desc","details","summary"]);
  const remIdx    = idx(["remediation","solution","recommendation","fix","mitigation"]);
  const cveIdx    = idx(["cve","cve_id","cve_number"]);
  const cvssIdx   = idx(["cvss","cvss_score","cvss3","cvss_v3","base_score"]);
  const impactIdx = idx(["impact","consequence"]);
  const pocIdx    = idx(["poc","proof","evidence","output","plugin_output"]);
  const urlIdx    = idx(["url","uri","host","target","affected_url","location"]);
  const statusIdx = idx(["status","state"]);

  if (titleIdx < 0) return { vulnerabilities: [], tool: "CSV", count: 0, errors: ["No title/name/vulnerability column found"] };

  for (const line of lines.slice(1)) {
    try {
      const cols = parseRow(line);
      const get = (i: number) => (i >= 0 && i < cols.length) ? cols[i]?.replace(/^"|"$/g,"") ?? "" : "";
      const title = get(titleIdx);
      if (!title) continue;
      const statusRaw = get(statusIdx).toLowerCase();
      const status = statusRaw.includes("fix") || statusRaw.includes("clos") || statusRaw.includes("resolv") ? "Fixed"
        : statusRaw.includes("accept") ? "Accepted" : "Open";
      vulns.push({
        ...blankVuln(),
        title,
        severity:    normaliseSeverity(get(sevIdx) || "info"),
        cvss_score:  cvssIdx >= 0 ? (parseFloat(get(cvssIdx)) || null) : null,
        cve_id:      get(cveIdx),
        description: get(descIdx),
        impact:      get(impactIdx),
        remediation: get(remIdx),
        proof_of_concept: get(pocIdx) || get(urlIdx),
        status,
        tags:        ["csv-import"],
      });
    } catch(e) { errors.push(`Row error: ${e}`); }
  }
  return { vulnerabilities: vulns, tool: "CSV", count: vulns.length, errors };
}

/** PenForge .ptsync */
function parsePtsync(text: string): ImportResult {
  try {
    const data = JSON.parse(text);
    if (data.format !== "ptsync-v1") throw new Error("Not ptsync-v1");
    return {
      vulnerabilities: data.vulnerabilities.map((v: any) => ({ ...blankVuln(), ...v })),
      tool: "PenForge .ptsync",
      count: data.vulnerabilities.length,
      errors: [],
    };
  } catch(e) {
    return { vulnerabilities: [], tool: "PenForge .ptsync", count: 0, errors: [`${e}`] };
  }
}

/** Rufus Framework JSON (from Rufus scan results) */
function parseRufus(text: string): ImportResult {
  const vulns: ReturnType<typeof blankVuln>[] = [];
  const errors: string[] = [];
  try {
    const data = JSON.parse(text);
    // Rufus stores findings as array or findings.json format
    const findings = Array.isArray(data) ? data : (data.findings ?? data.vulns ?? []);
    for (const f of findings) {
      if (!f.title && !f.name) continue;
      vulns.push({
        ...blankVuln(),
        title:             f.title ?? f.name,
        severity:          normaliseSeverity(f.severity ?? "info"),
        cvss_score:        f.cvss_score ?? null,
        cve_id:            (f.cve_references ?? []).join(", ") || f.cve_id || "",
        description:       f.description ?? "",
        impact:            f.impact ?? "",
        remediation:       f.remediation ?? "",
        proof_of_concept:  f.evidence ?? f.proof_of_concept ?? "",
        steps_to_reproduce: f.steps_to_reproduce ?? "",
        references:        f.references ?? [],
        status:            "Open",
        tags:              ["rufus", ...(f.tags ?? [])],
      });
    }
  } catch(e) { errors.push(`${e}`); }
  return { vulnerabilities: vulns, tool: "Rufus Framework", count: vulns.length, errors };
}

/** Auto-detect format and parse */
export function detectAndParse(filename: string, content: string): ImportResult {
  const lower = filename.toLowerCase();
  const trimmed = content.trim();

  // By filename
  if (lower.endsWith(".ptsync"))               return parsePtsync(content);
  if (lower.includes("nessus"))                return parseNessus(content);
  if (lower.includes("openvas") || lower.includes("gvm")) return parseOpenVAS(content);
  if (lower.includes("burp"))                  return parseBurp(content);
  if (lower.includes("zap"))                   return parseZAP(content);
  if (lower.includes("nikto"))                 return parseNikto(content);
  if (lower.includes("nuclei"))                return parseNuclei(content);
  if (lower.includes("nmap"))                  return parseNmap(content);
  if (lower.includes("sqlmap"))                return parseSQLMap(content);
  if (lower.includes("metasploit") || lower.includes("msf")) return parseMetasploit(content);

  // By content
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const d = JSON.parse(trimmed);
      if (d.format === "ptsync-v1")        return parsePtsync(content);
      if (d.findings || (Array.isArray(d) && d[0]?.source_tool)) return parseRufus(content);
      if (d.site || d.alerts || d["@version"]) return parseZAP(content);
      // Try Nuclei JSONL
      const firstLine = trimmed.split("\n")[0];
      if (JSON.parse(firstLine).info?.severity)  return parseNuclei(content);
    } catch {}
    return parseRufus(content); // generic JSON fallback
  }
  if (trimmed.split("\n").every(l => !l || l.trim().startsWith("{"))) return parseNuclei(content); // JSONL
  if (trimmed.includes("<NessusClientData_v2>") || trimmed.includes("<ReportItem")) return parseNessus(content);
  if (trimmed.includes("<OmpCommandResponse>") || trimmed.includes("<get_results_response")) return parseOpenVAS(content);
  if (trimmed.includes("<BurpVersion>") || trimmed.includes("<issue>")) return parseBurp(content);
  if (trimmed.includes("<niktoscan>") || trimmed.includes("Nikto v"))  return parseNikto(content);
  if (trimmed.includes("<nmapmapping>") || trimmed.includes("<nmaprun")) return parseNmap(content);
  if (trimmed.includes("<MSFDatabase>") || trimmed.includes("<MetasploitV4")) return parseMetasploit(content);
  if (lower.endsWith(".csv") || (trimmed.includes(",") && !trimmed.startsWith("<"))) return parseCSV(content);

  return { vulnerabilities: [], tool: "Unknown", count: 0, errors: ["Could not detect file format. Supported: Nessus, OpenVAS, Burp Suite, ZAP, Nuclei, Nikto, Nmap, SQLMap, Metasploit, CSV, .ptsync, Rufus Framework JSON"] };
}

export const SUPPORTED_TOOLS = [
  { name: "Nessus",             ext: ".nessus",        mime: "application/xml",  icon: "🔴" },
  { name: "OpenVAS / GVM",      ext: ".xml",           mime: "application/xml",  icon: "🟢" },
  { name: "Burp Suite",         ext: ".xml",           mime: "application/xml",  icon: "🟠" },
  { name: "OWASP ZAP",          ext: ".xml / .json",   mime: "*",                icon: "🔵" },
  { name: "Nuclei",             ext: ".jsonl / .json", mime: "application/json", icon: "⚡" },
  { name: "Nikto",              ext: ".xml / .txt",    mime: "*",                icon: "🌀" },
  { name: "Nmap (Vulners)",     ext: ".xml",           mime: "application/xml",  icon: "🗺" },
  { name: "SQLMap",             ext: ".txt",           mime: "text/plain",       icon: "💉" },
  { name: "Metasploit",         ext: ".xml",           mime: "application/xml",  icon: "💀" },
  { name: "Generic CSV",        ext: ".csv",           mime: "text/csv",         icon: "📊" },
  { name: "Rufus Framework",    ext: ".json",          mime: "application/json", icon: "🔺" },
  { name: "PenForge .ptsync",   ext: ".ptsync",        mime: "application/json", icon: "🛡" },
];
