// src/types/index.ts

export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";
export type VulnStatus = "Open" | "Fixed" | "Accepted";
export type ProjectStatus = "In Progress" | "Completed" | "Draft";

export interface Project {
  id: string;
  name: string;
  client: string;
  scope: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Vulnerability {
  id: string;
  project_id: string;
  title: string;
  severity: Severity;
  cvss_score: number | null;
  cve_id: string;
  description: string;
  impact: string;
  steps_to_reproduce: string;
  proof_of_concept: string;
  remediation: string;
  references: string[];
  status: VulnStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  full_name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  logo_path: string;
}

export interface AppConfig {
  pin_hash: string;
  profile: Profile;
}

export interface PtsyncFile {
  format: "ptsync-v1";
  exported_at: string;
  exported_by: string;
  vulnerabilities: Omit<Vulnerability, "project_id">[];
}

// Severity helpers
export const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#f59e0b",
  Low:      "#3b82f6",
  Info:     "#71717a",
};

export const SEVERITY_BG: Record<Severity, string> = {
  Critical: "rgba(239,68,68,0.15)",
  High:     "rgba(249,115,22,0.15)",
  Medium:   "rgba(245,158,11,0.15)",
  Low:      "rgba(59,130,246,0.15)",
  Info:     "rgba(113,113,122,0.15)",
};

export const defaultProfile = (): Profile => ({
  full_name: "", title: "", company: "", email: "", phone: "", logo_path: "",
});

export const defaultVuln = (project_id: string): Vulnerability => ({
  id: crypto.randomUUID(),
  project_id,
  title: "",
  severity: "Medium",
  cvss_score: null,
  cve_id: "",
  description: "",
  impact: "",
  steps_to_reproduce: "",
  proof_of_concept: "",
  remediation: "",
  references: [],
  status: "Open",
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const defaultProject = (): Project => ({
  id: crypto.randomUUID(),
  name: "",
  client: "",
  scope: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "Draft",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
