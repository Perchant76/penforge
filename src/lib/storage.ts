// src/lib/storage.ts
import { invoke } from "@tauri-apps/api/core";
import type { Project, Vulnerability, AppConfig, Profile } from "../types";
import { defaultProfile } from "../types";

// ── Raw file I/O ──────────────────────────────────────────────────────────────

export async function readFile(filename: string): Promise<string> {
  return invoke<string>("read_json_file", { filename });
}

export async function writeFile(filename: string, content: string): Promise<void> {
  return invoke("write_json_file", { filename, content });
}

// ── Config / PIN ──────────────────────────────────────────────────────────────

export async function loadConfig(): Promise<AppConfig | null> {
  const raw = await readFile("config.json");
  if (!raw) return null;
  try { return JSON.parse(raw) as AppConfig; } catch { return null; }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await writeFile("config.json", JSON.stringify(config, null, 2));
}

export async function hashPin(pin: string): Promise<string> {
  return invoke<string>("hash_pin", { pin });
}

export async function verifyPin(input: string, hash: string): Promise<boolean> {
  return invoke<boolean>("verify_pin", { input, hash });
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function loadProjects(): Promise<Project[]> {
  const raw = await readFile("projects.json");
  if (!raw) return [];
  try { return JSON.parse(raw) as Project[]; } catch { return []; }
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await writeFile("projects.json", JSON.stringify(projects, null, 2));
}

// ── Vulnerabilities ───────────────────────────────────────────────────────────

export async function loadVulns(): Promise<Vulnerability[]> {
  const raw = await readFile("vulnerabilities.json");
  if (!raw) return [];
  try { return JSON.parse(raw) as Vulnerability[]; } catch { return []; }
}

export async function saveVulns(vulns: Vulnerability[]): Promise<void> {
  await writeFile("vulnerabilities.json", JSON.stringify(vulns, null, 2));
}

// ── ptsync ────────────────────────────────────────────────────────────────────

export async function exportPtsync(data: string, path: string): Promise<void> {
  return invoke("export_ptsync", { data, path });
}

export async function importPtsync(path: string): Promise<string> {
  return invoke<string>("import_ptsync", { path });
}
