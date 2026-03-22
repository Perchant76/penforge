// src/lib/pdfTemplateEngine.ts
// Handles PDF/HTML template upload, placeholder injection, and rendering

import { invoke } from "@tauri-apps/api/core";
import type { Project, Vulnerability } from "../types";
import { applyPlaceholders } from "./reportGenerator";
import { loadConfig } from "./storage";

export interface UploadedTemplate {
  id: string;
  name: string;
  description: string;
  type: "html";          // we convert PDF templates to HTML-with-styles
  content: string;       // full HTML content
  uploadedAt: string;
  originalFilename: string;
  placeholdersFound: string[];
}

/** Scan an HTML string and return all {{PLACEHOLDER}} tokens found */
export function findPlaceholders(html: string): string[] {
  const matches = html.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [];
  return [...new Set(matches)].sort();
}

/** Read an uploaded HTML file, scan for placeholders, store as template */
export async function importHtmlTemplate(
  filePath: string,
  name: string,
  description: string
): Promise<UploadedTemplate> {
  const content = await invoke<string>("read_template_file", { path: filePath });
  const placeholders = findPlaceholders(content);
  const id = `tpl_${Date.now()}`;
  const t: UploadedTemplate = {
    id, name, description, type: "html", content,
    uploadedAt: new Date().toISOString(),
    originalFilename: filePath.split(/[\\/]/).pop() ?? filePath,
    placeholdersFound: placeholders,
  };
  await invoke("save_template", {
    filename: `templates/${id}.json`,
    content: JSON.stringify(t, null, 2),
  });
  return t;
}

/** Load all saved templates from disk */
export async function loadAllTemplates(): Promise<UploadedTemplate[]> {
  try {
    const names = await invoke<string[]>("list_templates");
    const loaded: UploadedTemplate[] = [];
    for (const n of names) {
      const raw = await invoke<string>("read_json_file", { filename: `templates/${n}` }).catch(() => "");
      if (!raw) continue;
      try { loaded.push(JSON.parse(raw)); } catch {}
    }
    return loaded.sort((a,b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch { return []; }
}

/** Delete a template */
export async function deleteTemplate(id: string): Promise<void> {
  await invoke("delete_template", { filename: `${id}.json` });
}

/** Render a template with live project data and open in browser */
export async function renderAndPreview(
  template: UploadedTemplate,
  project: Project,
  vulns: Vulnerability[]
): Promise<void> {
  const cfg = await loadConfig();
  const html = applyPlaceholders(template.content, project, vulns, cfg?.profile ?? null);
  await invoke("open_report_in_browser", { html });
}
