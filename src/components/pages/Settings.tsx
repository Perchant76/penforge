// src/components/pages/Settings.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, Input, Label, Footer } from "../ui";
import { Save, Lock, Upload, User } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import * as storage from "../../lib/storage";
import type { Profile } from "../../types";

const F = "Inter, system-ui, sans-serif";
const cardStyle: React.CSSProperties = { background:"#111", border:"1px solid #1f1f1f", borderRadius:12, padding:20 };
const sectionHdr: React.CSSProperties = { display:"flex", alignItems:"center", gap:10, paddingBottom:14, marginBottom:16, borderBottom:"1px solid #1f1f1f" };

export function Settings() {
  const { config, refreshConfig } = useApp();
  const [profile, setProfile] = useState<Profile>(config?.profile ?? { full_name:"",title:"",company:"",email:"",phone:"",logo_path:"" });
  const [saved, setSaved] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");

  const saveProfile = async () => {
    const cfg = config ?? { pin_hash:"", profile };
    await storage.saveConfig({ ...cfg, profile });
    await refreshConfig();
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const changePin = async () => {
    setPinError(""); setPinSuccess("");
    if (!/^\d{6}$/.test(currentPin)) { setPinError("Current PIN must be 6 digits."); return; }
    if (!/^\d{6}$/.test(newPin))     { setPinError("New PIN must be 6 digits."); return; }
    if (newPin !== confirmPin)        { setPinError("New PINs don't match."); return; }
    if (!config?.pin_hash)            { setPinError("No PIN set."); return; }
    const ok = await storage.verifyPin(currentPin, config.pin_hash);
    if (!ok) { setPinError("Current PIN is incorrect."); return; }
    const hash = await storage.hashPin(newPin);
    await storage.saveConfig({ ...config, pin_hash: hash });
    await refreshConfig();
    setPinSuccess("PIN updated successfully.");
    setCurrentPin(""); setNewPin(""); setConfirmPin("");
    setTimeout(()=>setPinSuccess(""), 3000);
  };

  const pickLogo = async () => {
    const path = await openDialog({ filters:[{name:"Images",extensions:["png","jpg","jpeg","svg","webp"]}] });
    if (path && typeof path==="string") setProfile(p=>({...p,logo_path:path}));
  };

  const fp = (k: keyof Profile, v: string) => setProfile(x=>({...x,[k]:v}));

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100%", fontFamily:F }}>
      <div style={{ flex:1, padding:24, maxWidth:680, display:"flex", flexDirection:"column", gap:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#f5f5f5", margin:0 }}>Settings</h1>
          <p style={{ fontSize:13, color:"#71717a", marginTop:4 }}>Profile and security settings</p>
        </div>

        {/* Profile */}
        <div style={cardStyle}>
          <div style={sectionHdr}>
            <div style={{ padding:7, background:"rgba(220,38,38,0.1)", borderRadius:8, color:"#dc2626" }}><User size={15}/></div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Tester Profile</div>
              <div style={{ fontSize:11, color:"#71717a", marginTop:2 }}>Auto-injected into every generated report</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div><Label>Full Name</Label><Input value={profile.full_name} onChange={e=>fp("full_name",e.target.value)} placeholder="Jane Smith"/></div>
            <div><Label>Job Title</Label><Input value={profile.title} onChange={e=>fp("title",e.target.value)} placeholder="Senior Penetration Tester"/></div>
            <div><Label>Company</Label><Input value={profile.company} onChange={e=>fp("company",e.target.value)} placeholder="CyberSec Ltd"/></div>
            <div><Label>Email</Label><Input type="email" value={profile.email} onChange={e=>fp("email",e.target.value)} placeholder="jane@cybersec.com"/></div>
            <div><Label>Phone</Label><Input value={profile.phone} onChange={e=>fp("phone",e.target.value)} placeholder="+1 555 000 0000"/></div>
            <div>
              <Label>Company Logo</Label>
              <div style={{ display:"flex", gap:8 }}>
                <Input value={profile.logo_path} onChange={e=>fp("logo_path",e.target.value)} placeholder="Path to logo file" style={{ flex:1 }}/>
                <button onClick={pickLogo} style={{ padding:"7px 10px", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:8, color:"#71717a", cursor:"pointer", transition:"color 0.15s" }} onMouseEnter={e=>(e.currentTarget.style.color="#f5f5f5")} onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}><Upload size={14}/></button>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:16 }}>
            <Btn variant="primary" onClick={saveProfile}><Save size={13}/>Save Profile</Btn>
            {saved && <span style={{ color:"#22c55e", fontSize:13, animation:"fadeIn 0.2s ease" }}>✓ Saved</span>}
          </div>
        </div>

        {/* PIN */}
        <div style={cardStyle}>
          <div style={sectionHdr}>
            <div style={{ padding:7, background:"rgba(220,38,38,0.1)", borderRadius:8, color:"#dc2626" }}><Lock size={15}/></div>
            <div style={{ fontSize:13, fontWeight:600, color:"#f5f5f5" }}>Change PIN</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div><Label>Current PIN</Label><Input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setCurrentPin(e.target.value)}} placeholder="••••••"/></div>
            <div><Label>New PIN</Label><Input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setNewPin(e.target.value)}} placeholder="••••••"/></div>
            <div><Label>Confirm New</Label><Input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setConfirmPin(e.target.value)}} placeholder="••••••"/></div>
          </div>
          {pinError   && <p style={{ color:"#ef4444", fontSize:12, marginBottom:10 }}>{pinError}</p>}
          {pinSuccess && <p style={{ color:"#22c55e", fontSize:12, marginBottom:10 }}>{pinSuccess}</p>}
          <Btn variant="ghost" onClick={changePin}><Lock size={13}/>Update PIN</Btn>
        </div>

        {/* App info */}
        <div style={cardStyle}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#f5f5f5" }}>PenForge</div>
              <div style={{ fontSize:11, color:"#52525b", marginTop:4 }}>Local-only Pentest Report Manager · v1.0.0 · No cloud, no accounts</div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
