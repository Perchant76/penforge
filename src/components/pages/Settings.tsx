// src/components/pages/Settings.tsx
import React, { useState } from "react";
import { useApp } from "../../lib/AppContext";
import { Btn, Input, Label, Footer } from "../ui";
import { Save, Lock, Upload, User } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import * as storage from "../../lib/storage";
import type { Profile } from "../../types";

export function Settings() {
  const { config, refreshConfig } = useApp();
  const [profile, setProfile] = useState<Profile>(config?.profile ?? { full_name:"",title:"",company:"",email:"",phone:"",logo_path:"" });
  const [saved, setSaved] = useState(false);

  // PIN change state
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
    if (!config?.pin_hash)            { setPinError("No PIN set yet."); return; }
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
    if (path && typeof path === "string") setProfile(p => ({ ...p, logo_path: path }));
  };

  const fp = (k: keyof Profile, v: string) => setProfile(x => ({ ...x, [k]: v }));

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-[#f5f5f5]">Settings</h1>
          <p className="text-[#71717a] text-sm mt-0.5">Profile information and security settings</p>
        </div>

        {/* Profile card */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#1f1f1f]">
            <div className="p-2 bg-[rgba(220,38,38,0.1)] rounded-lg text-[#dc2626]"><User size={16}/></div>
            <h2 className="text-sm font-semibold text-[#f5f5f5]">Tester Profile</h2>
            <p className="text-xs text-[#71717a]">Auto-injected into every generated report</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={profile.full_name} onChange={e=>fp("full_name",e.target.value)} placeholder="Jane Smith"/></div>
            <div><Label>Job Title</Label><Input value={profile.title} onChange={e=>fp("title",e.target.value)} placeholder="Senior Penetration Tester"/></div>
            <div><Label>Company</Label><Input value={profile.company} onChange={e=>fp("company",e.target.value)} placeholder="CyberSec Ltd"/></div>
            <div><Label>Email</Label><Input type="email" value={profile.email} onChange={e=>fp("email",e.target.value)} placeholder="jane@cybersec.com"/></div>
            <div><Label>Phone</Label><Input value={profile.phone} onChange={e=>fp("phone",e.target.value)} placeholder="+1 555 000 0000"/></div>
            <div><Label>Company Logo</Label>
              <div className="flex gap-2 items-center">
                <Input value={profile.logo_path} onChange={e=>fp("logo_path",e.target.value)} placeholder="Path to logo file" className="flex-1"/>
                <button onClick={pickLogo} className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#71717a] hover:text-[#f5f5f5] hover:border-[#3a3a3a] transition-all flex-shrink-0"><Upload size={14}/></button>
              </div>
              {profile.logo_path && <p className="text-xs text-[#52525b] mt-1 truncate">{profile.logo_path}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Btn variant="primary" onClick={saveProfile}><Save size={13}/>Save Profile</Btn>
            {saved && <span className="text-[#22c55e] text-sm animate-fade-in">✓ Saved</span>}
          </div>
        </div>

        {/* PIN change card */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#1f1f1f]">
            <div className="p-2 bg-[rgba(220,38,38,0.1)] rounded-lg text-[#dc2626]"><Lock size={16}/></div>
            <h2 className="text-sm font-semibold text-[#f5f5f5]">Change PIN</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Current PIN</Label>
              <Input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setCurrentPin(e.target.value)}} placeholder="••••••"/>
            </div>
            <div><Label>New PIN</Label>
              <Input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setNewPin(e.target.value)}} placeholder="••••••"/>
            </div>
            <div><Label>Confirm New PIN</Label>
              <Input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e=>{if(/^\d*$/.test(e.target.value))setConfirmPin(e.target.value)}} placeholder="••••••"/>
            </div>
          </div>
          {pinError   && <p className="text-xs text-red-400 animate-fade-in">{pinError}</p>}
          {pinSuccess && <p className="text-xs text-[#22c55e] animate-fade-in">{pinSuccess}</p>}
          <Btn variant="ghost" onClick={changePin}><Lock size={13}/>Update PIN</Btn>
        </div>

        {/* App info */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#f5f5f5]">PenForge</div>
              <div className="text-xs text-[#52525b] mt-0.5">Local-only Pentest Report Manager · v1.0.0</div>
            </div>
            <div className="text-xs text-[#3f3f46]">No cloud. No accounts. 100% local.</div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
