// src/components/layout/Sidebar.tsx
import React from "react";
import { ShieldLogo } from "../ui";
import { useApp } from "../../lib/AppContext";
import { LayoutDashboard, FolderOpen, Shield, ArrowLeftRight, Settings } from "lucide-react";

const NAV = [
  { id:"dashboard",   label:"Dashboard",     icon:LayoutDashboard },
  { id:"projects",    label:"Projects",      icon:FolderOpen },
  { id:"vulns",       label:"Vulnerabilities", icon:Shield },
  { id:"sync",        label:"Import / Export", icon:ArrowLeftRight },
  { id:"settings",    label:"Settings",      icon:Settings },
];

export function Sidebar() {
  const { currentPage, navigate, config, vulns } = useApp();
  const profile = config?.profile;
  const openVulns = vulns.filter(v => v.status === "Open").length;

  return (
    <aside className="w-56 min-h-screen bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col fixed left-0 top-0 bottom-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1f1f1f]">
        <ShieldLogo size={28} />
        <div>
          <div className="text-white font-bold text-sm leading-none">PenForge</div>
          <div className="text-[#52525b] text-xs mt-0.5">v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = currentPage === item.id || (item.id === "projects" && currentPage === "project-detail");
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${active
                  ? "text-[#dc2626] bg-[rgba(220,38,38,0.1)] border-l-2 border-[#dc2626] pl-[10px]"
                  : "text-[#71717a] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]"}`}>
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "vulns" && openVulns > 0 && (
                <span className="bg-[#dc2626] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                  {openVulns}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile footer */}
      {profile?.full_name && (
        <div className="px-4 py-4 border-t border-[#1f1f1f]">
          <div className="text-[#f5f5f5] text-xs font-medium truncate">{profile.full_name}</div>
          {profile.title && <div className="text-[#52525b] text-xs truncate mt-0.5">{profile.title}</div>}
          {profile.company && <div className="text-[#52525b] text-xs truncate">{profile.company}</div>}
        </div>
      )}
    </aside>
  );
}
