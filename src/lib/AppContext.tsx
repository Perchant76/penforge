// src/lib/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Project, Vulnerability, AppConfig, Profile } from "../types";
import { defaultProfile } from "../types";
import * as storage from "./storage";

interface AppCtx {
  // Auth
  isAuthenticated: boolean;
  hasPin: boolean;
  config: AppConfig | null;
  setAuthenticated: (v: boolean) => void;
  refreshConfig: () => Promise<void>;

  // Data
  projects: Project[];
  vulns: Vulnerability[];
  loadData: () => Promise<void>;
  saveProjects: (p: Project[]) => Promise<void>;
  saveVulns: (v: Vulnerability[]) => Promise<void>;

  // Navigation
  currentPage: string;
  currentProjectId: string | null;
  navigate: (page: string, projectId?: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    const cfg = await storage.loadConfig();
    setConfig(cfg);
    setHasPin(!!cfg?.pin_hash);
  }, []);

  const loadData = useCallback(async () => {
    const [p, v] = await Promise.all([storage.loadProjects(), storage.loadVulns()]);
    setProjects(p);
    setVulns(v);
  }, []);

  const saveProjects = useCallback(async (p: Project[]) => {
    setProjects(p);
    await storage.saveProjects(p);
  }, []);

  const saveVulns = useCallback(async (v: Vulnerability[]) => {
    setVulns(v);
    await storage.saveVulns(v);
  }, []);

  const navigate = useCallback((page: string, projectId?: string) => {
    setCurrentPage(page);
    setCurrentProjectId(projectId ?? null);
  }, []);

  useEffect(() => { refreshConfig(); }, [refreshConfig]);
  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated, loadData]);

  return (
    <Ctx.Provider value={{
      isAuthenticated, hasPin, config, setAuthenticated, refreshConfig,
      projects, vulns, loadData, saveProjects, saveVulns,
      currentPage, currentProjectId, navigate,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
