// src/App.tsx
import React from "react";
import { AppProvider, useApp } from "./lib/AppContext";
import { PinScreen } from "./components/layout/PinScreen";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./components/pages/Dashboard";
import { Projects } from "./components/pages/Projects";
import { ProjectDetail } from "./components/pages/ProjectDetail";
import { Vulns } from "./components/pages/Vulns";
import { WriteupLibrary } from "./components/pages/WriteupLibrary";
import { Templates } from "./components/pages/Templates";
import { Sync } from "./components/pages/Sync";
import { Settings } from "./components/pages/Settings";

function AppInner() {
  const { isAuthenticated, hasPin, currentPage } = useApp();
  if (!isAuthenticated || !hasPin) return <PinScreen />;

  const fullHeight = currentPage === "writeups" || currentPage === "templates";
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <Sidebar />
      <main className={`flex-1 ml-56 bg-[#0a0a0a] ${fullHeight ? "overflow-hidden flex flex-col" : "overflow-y-auto min-h-screen"}`}>
        {currentPage === "dashboard"       && <Dashboard />}
        {currentPage === "projects"        && <Projects />}
        {currentPage === "project-detail"  && <ProjectDetail />}
        {currentPage === "vulns"           && <Vulns />}
        {currentPage === "writeups"        && <WriteupLibrary />}
        {currentPage === "templates"       && <Templates />}
        {currentPage === "sync"            && <Sync />}
        {currentPage === "settings"        && <Settings />}
      </main>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
