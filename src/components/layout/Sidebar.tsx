// src/components/layout/Sidebar.tsx
import React from "react";
import { useApp } from "../../lib/AppContext";
import { LayoutDashboard, FolderOpen, Shield, ArrowLeftRight, Settings, BookOpen, LogOut } from "lucide-react";

function PenForgeLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" stroke="#dc2626" strokeWidth="2" opacity="0.3"/>
      <circle cx="50" cy="50" r="38" stroke="#dc2626" strokeWidth="1" opacity="0.5"/>
      {/* Cross-hair lines */}
      <line x1="4" y1="50" x2="16" y2="50" stroke="#dc2626" strokeWidth="2"/>
      <line x1="84" y1="50" x2="96" y2="50" stroke="#dc2626" strokeWidth="2"/>
      <line x1="50" y1="4" x2="50" y2="16" stroke="#dc2626" strokeWidth="2"/>
      <line x1="50" y1="84" x2="50" y2="96" stroke="#dc2626" strokeWidth="2"/>
      {/* Diagonal ticks */}
      <line x1="18" y1="18" x2="24" y2="24" stroke="#dc2626" strokeWidth="1.5" opacity="0.6"/>
      <line x1="82" y1="18" x2="76" y2="24" stroke="#dc2626" strokeWidth="1.5" opacity="0.6"/>
      <line x1="18" y1="82" x2="24" y2="76" stroke="#dc2626" strokeWidth="1.5" opacity="0.6"/>
      <line x1="82" y1="82" x2="76" y2="76" stroke="#dc2626" strokeWidth="1.5" opacity="0.6"/>
      {/* Shield body */}
      <path d="M50 20 L72 30 L72 52 C72 65 62 75 50 80 C38 75 28 65 28 52 L28 30 Z" fill="#dc2626" opacity="0.15" stroke="#dc2626" strokeWidth="2"/>
      {/* Inner shield highlight */}
      <path d="M50 28 L65 35 L65 51 C65 61 58 69 50 73 C42 69 35 61 35 51 L35 35 Z" fill="#dc2626" opacity="0.2"/>
      {/* PF letters */}
      <text x="50" y="60" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontSize="20" fontWeight="800" fill="#fff" letterSpacing="-1">PF</text>
      {/* Corner dots */}
      <circle cx="4"  cy="50" r="2.5" fill="#dc2626"/>
      <circle cx="96" cy="50" r="2.5" fill="#dc2626"/>
      <circle cx="50" cy="4"  r="2.5" fill="#dc2626"/>
      <circle cx="50" cy="96" r="2.5" fill="#dc2626"/>
    </svg>
  );
}

const NAV = [
  { id:"dashboard",  label:"Dashboard",       icon:LayoutDashboard },
  { id:"projects",   label:"Projects",        icon:FolderOpen },
  { id:"vulns",      label:"Vulnerabilities", icon:Shield },
  { id:"writeups",   label:"Writeup Library", icon:BookOpen },
  { id:"sync",       label:"Import / Export", icon:ArrowLeftRight },
  { id:"settings",   label:"Settings",        icon:Settings },
];

export function Sidebar() {
  const { currentPage, navigate, config, vulns, setAuthenticated } = useApp();
  const profile = config?.profile;
  const openVulns = vulns.filter(v => v.status === "Open").length;

  return (
    <aside className="w-56 min-h-screen bg-[#080808] border-r border-[#1a1a1a] flex flex-col fixed left-0 top-0 bottom-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1a1a1a]">
        <PenForgeLogo size={36}/>
        <div>
          <div className="text-white font-bold text-sm leading-none tracking-wide">PenForge</div>
          <div className="text-[#dc2626] text-[10px] mt-1 tracking-widest uppercase opacity-70">Report Manager</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = currentPage === item.id || (item.id === "projects" && currentPage === "project-detail");
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 relative group
                ${active
                  ? "text-[#dc2626] bg-[rgba(220,38,38,0.1)]"
                  : "text-[#71717a] hover:text-[#f5f5f5] hover:bg-[#111]"}`}>
              {active && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#dc2626] rounded-full"/>}
              <item.icon size={15} className={active ? "text-[#dc2626]" : ""}/>
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "vulns" && openVulns > 0 && (
                <span className="bg-[#dc2626] text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight font-bold">
                  {openVulns > 99 ? "99+" : openVulns}
                </span>
              )}
              {item.id === "writeups" && (
                <span className="text-[10px] text-[#3f3f46] bg-[#111] border border-[#1f1f1f] px-1.5 py-0.5 rounded">61</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile + Lock */}
      <div className="border-t border-[#1a1a1a]">
        {profile?.full_name && (
          <div className="px-4 py-3 border-b border-[#111]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[rgba(220,38,38,0.2)] flex items-center justify-center text-[#dc2626] text-xs font-bold flex-shrink-0">
                {profile.full_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[#f5f5f5] text-xs font-medium truncate">{profile.full_name}</div>
                {profile.title && <div className="text-[#52525b] text-[10px] truncate">{profile.title}</div>}
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setAuthenticated(false)}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-[#52525b] hover:text-[#dc2626] transition-colors">
          <LogOut size={13}/> Lock App
        </button>
      </div>
    </aside>
  );
}
