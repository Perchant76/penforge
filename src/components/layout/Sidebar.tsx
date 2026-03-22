// src/components/layout/Sidebar.tsx
import React from "react";
import { useApp } from "../../lib/AppContext";
import {
  LayoutDashboard, FolderOpen, Shield, BookOpen,
  LayoutTemplate, ArrowLeftRight, Settings, LogOut, Download,
} from "lucide-react";

function Logo() {
  return (
    <svg width="30" height="36" viewBox="0 0 40 44" fill="none">
      <path d="M20 2L4 9v12c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z"
        fill="#dc2626" opacity="0.2" stroke="#dc2626" strokeWidth="2"/>
      <path d="M20 10L10 14v8c0 6.2 4.5 12 10 14 5.5-2 10-7.8 10-14v-8L20 10z"
        fill="#dc2626" opacity="0.35"/>
      <text x="20" y="27" textAnchor="middle" fill="white"
        fontSize="12" fontWeight="700" fontFamily="Inter,system-ui,sans-serif">PF</text>
    </svg>
  );
}

const NAV = [
  { id:"dashboard",  label:"Dashboard",          Icon:LayoutDashboard },
  { id:"projects",   label:"Projects",            Icon:FolderOpen },
  { id:"vulns",      label:"Vulnerabilities",     Icon:Shield },
  { id:"writeups",   label:"Writeup Library",     Icon:BookOpen },
  { id:"import",     label:"Universal Importer",  Icon:Download },
  { id:"templates",  label:"Report Templates",    Icon:LayoutTemplate },
  { id:"sync",       label:"Import / Export",     Icon:ArrowLeftRight },
  { id:"settings",   label:"Settings",            Icon:Settings },
];

export function Sidebar() {
  const { currentPage, navigate, config, vulns, setAuthenticated } = useApp();
  const profile = config?.profile;
  const openCount = vulns.filter(v => v.status === "Open").length;
  const isActive = (id: string) =>
    currentPage === id || (id === "projects" && currentPage === "project-detail");

  return (
    <aside style={{
      width:224, minHeight:"100vh", background:"#080808",
      borderRight:"1px solid #1a1a1a", display:"flex", flexDirection:"column",
      position:"fixed", left:0, top:0, bottom:0, zIndex:10,
      fontFamily:"Inter, system-ui, sans-serif",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"18px 16px", borderBottom:"1px solid #1a1a1a" }}>
        <Logo/>
        <div>
          <div style={{ color:"#f5f5f5", fontWeight:700, fontSize:14, lineHeight:1 }}>PenForge</div>
          <div style={{ color:"#dc2626", fontSize:10, letterSpacing:3, textTransform:"uppercase", marginTop:4, opacity:.7 }}>Report Manager</div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = isActive(id);
          return (
            <button key={id} onClick={() => navigate(id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
              borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
              border:"none", background:active?"rgba(220,38,38,0.09)":"transparent",
              color:active?"#dc2626":"#71717a", width:"100%", textAlign:"left",
              position:"relative", transition:"all 0.15s",
            }}
            onMouseEnter={e=>{ if(!active){(e.currentTarget as HTMLElement).style.background="#111";(e.currentTarget as HTMLElement).style.color="#f5f5f5";}}}
            onMouseLeave={e=>{ if(!active){(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.color="#71717a";}}}
            >
              {active&&<div style={{ position:"absolute", left:0, top:4, bottom:4, width:3, background:"#dc2626", borderRadius:"0 2px 2px 0" }}/>}
              <Icon size={15}/>
              <span style={{ flex:1 }}>{label}</span>
              {id==="vulns"&&openCount>0&&<span style={{ background:"#dc2626", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10, minWidth:18, textAlign:"center" }}>{openCount>99?"99+":openCount}</span>}
              {id==="writeups"&&<span style={{ fontSize:10, color:"#3f3f46", background:"#111", border:"1px solid #1f1f1f", padding:"1px 5px", borderRadius:4 }}>61</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop:"1px solid #1a1a1a" }}>
        {profile?.full_name&&(
          <div style={{ padding:"10px 14px", borderBottom:"1px solid #111", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(220,38,38,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#dc2626", fontSize:12, fontWeight:700, flexShrink:0 }}>
              {profile.full_name[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ color:"#f5f5f5", fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.full_name}</div>
              {profile.title&&<div style={{ color:"#52525b", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.title}</div>}
            </div>
          </div>
        )}
        <button onClick={()=>setAuthenticated(false)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px", background:"transparent", border:"none", color:"#52525b", fontSize:12, cursor:"pointer", transition:"color 0.15s" }}
          onMouseEnter={e=>(e.currentTarget.style.color="#dc2626")} onMouseLeave={e=>(e.currentTarget.style.color="#52525b")}>
          <LogOut size={13}/> Lock App
        </button>
        <div style={{ textAlign:"center", padding:"8px 0 10px", fontSize:11, color:"#3f3f46" }}>Made with ❤️ by Perchant</div>
      </div>
    </aside>
  );
}
