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
import { UniversalImport } from "./components/pages/UniversalImport";
import { Templates } from "./components/pages/Templates";
import { Sync } from "./components/pages/Sync";
import { Settings } from "./components/pages/Settings";

function AppInner() {
  const { isAuthenticated, hasPin, currentPage } = useApp();
  if (!isAuthenticated || !hasPin) return <PinScreen />;

  const isFull = ["writeups","templates","import"].includes(currentPage);

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0a0a0a", fontFamily:"Inter, system-ui, sans-serif" }}>
      <Sidebar/>
      <main style={{ flex:1, marginLeft:224, background:"#0a0a0a", overflowY:isFull?"hidden":"auto", height:"100vh", display:"flex", flexDirection:"column" }}>
        {currentPage === "dashboard"      && <Dashboard/>}
        {currentPage === "projects"       && <Projects/>}
        {currentPage === "project-detail" && <ProjectDetail/>}
        {currentPage === "vulns"          && <Vulns/>}
        {currentPage === "writeups"       && <WriteupLibrary/>}
        {currentPage === "import"         && <UniversalImport/>}
        {currentPage === "templates"      && <Templates/>}
        {currentPage === "sync"           && <Sync/>}
        {currentPage === "settings"       && <Settings/>}
      </main>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner/></AppProvider>;
}
