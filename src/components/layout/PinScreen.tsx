// src/components/layout/PinScreen.tsx — Purple theme, new logo
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../lib/AppContext";
import * as storage from "../../lib/storage";

// ── Detailed PenForge Logo ────────────────────────────────────────────────────
function PenForgeLogo() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="80" cy="80" r="76" stroke="#7c3aed" strokeWidth="1.5" opacity="0.3"/>
      <circle cx="80" cy="80" r="70" stroke="#7c3aed" strokeWidth="0.75" opacity="0.4" strokeDasharray="4 3"/>
      {/* Crosshair */}
      <line x1="0"   y1="80" x2="22" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.8"/>
      <line x1="138" y1="80" x2="160" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.8"/>
      <line x1="80" y1="0"   x2="80" y2="22"  stroke="#7c3aed" strokeWidth="2" opacity="0.8"/>
      <line x1="80" y1="138" x2="80" y2="160" stroke="#7c3aed" strokeWidth="2" opacity="0.8"/>
      {/* Diagonal ticks */}
      <line x1="24" y1="24" x2="33" y2="33" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
      <line x1="136" y1="24" x2="127" y2="33" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
      <line x1="24" y1="136" x2="33" y2="127" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
      <line x1="136" y1="136" x2="127" y2="127" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
      {/* Corner dots */}
      <circle cx="4"   cy="80" r="3" fill="#7c3aed"/>
      <circle cx="156" cy="80" r="3" fill="#7c3aed"/>
      <circle cx="80"  cy="4"  r="3" fill="#7c3aed"/>
      <circle cx="80"  cy="156" r="3" fill="#7c3aed"/>
      {/* Inner hex ring */}
      <polygon points="80,28 117,50 117,94 80,116 43,94 43,50"
        fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5"/>
      {/* Shield body */}
      <path d="M80 40 L108 52 L108 80 C108 98 95 112 80 118 C65 112 52 98 52 80 L52 52 Z"
        fill="url(#shieldGrad)" stroke="#7c3aed" strokeWidth="2"/>
      {/* Shield inner highlight */}
      <path d="M80 50 L100 59 L100 79 C100 93 91 104 80 109 C69 104 60 93 60 79 L60 59 Z"
        fill="#7c3aed" opacity="0.15"/>
      {/* Lock icon inside shield */}
      <rect x="70" y="76" width="20" height="16" rx="3" fill="#a78bfa"/>
      <path d="M74 76 V71 C74 66 86 66 86 71 V76" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="80" cy="83" r="2.5" fill="#0a0a0a"/>
      {/* Scan lines overlay */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="52" y1={94+i*5} x2="108" y2={94+i*5}
          stroke="#7c3aed" strokeWidth="0.5" opacity={0.08*(5-i)}/>
      ))}
      {/* Corner accent bars */}
      <rect x="0"  y="76" width="18" height="2" rx="1" fill="#7c3aed" opacity="0.6"/>
      <rect x="142" y="76" width="18" height="2" rx="1" fill="#7c3aed" opacity="0.6"/>
      <rect x="76" y="0"  width="2"  height="18" rx="1" fill="#7c3aed" opacity="0.6"/>
      <rect x="76" y="142" width="2" height="18" rx="1" fill="#7c3aed" opacity="0.6"/>
      {/* Gradient def */}
      <defs>
        <linearGradient id="shieldGrad" x1="80" y1="40" x2="80" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.15"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PinScreen() {
  const { hasPin, refreshConfig, config, setAuthenticated } = useApp();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError]   = useState("");
  const [shake, setShake]   = useState(false);
  const [mode, setMode]     = useState<"verify"|"set"|"confirm">(hasPin ? "verify" : "set");
  const [firstPin, setFirstPin] = useState("");
  const refs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { refs[0].current?.focus(); }, [mode]);

  const triggerError = (msg: string) => {
    setError(msg); setShake(true);
    setDigits(Array(6).fill(""));
    setTimeout(() => { setShake(false); refs[0].current?.focus(); }, 500);
  };

  const handleSubmit = async (pin: string) => {
    if (mode === "verify") {
      const ok = await storage.verifyPin(pin, config!.pin_hash);
      if (ok) setAuthenticated(true);
      else triggerError("Incorrect PIN — try again");
    } else if (mode === "set") {
      setFirstPin(pin); setMode("confirm");
      setDigits(Array(6).fill("")); setError("");
    } else {
      if (pin !== firstPin) { triggerError("PINs don't match"); setMode("set"); setFirstPin(""); }
      else {
        const hash = await storage.hashPin(pin);
        const prof = config?.profile ?? { full_name:"",title:"",company:"",email:"",phone:"",logo_path:"" };
        await storage.saveConfig({ pin_hash: hash, profile: prof });
        await refreshConfig();
        setAuthenticated(true);
      }
    }
  };

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const ch = val.slice(-1);
    const d = [...digits]; d[i] = ch; setDigits(d);
    if (ch && i < 5) refs[i+1].current?.focus();
    if (i === 5 && ch) { const p = [...d].join(""); setTimeout(() => handleSubmit(p), 50); }
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[i]) { const d=[...digits];d[i]="";setDigits(d); }
      else if (i>0) { const d=[...digits];d[i-1]="";setDigits(d);refs[i-1].current?.focus(); }
    }
  };

  const T = { verify:"Enter Your PIN", set:"Create Your PIN", confirm:"Confirm Your PIN" };
  const S = { verify:"Enter your 6-digit PIN to access PenForge", set:"Choose a secure 6-digit PIN", confirm:"Re-enter your PIN to confirm" };

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0a0f 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"Inter, system-ui, sans-serif",
      overflow:"hidden",
    }}>
      {/* Background glow */}
      <div style={{ position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:600, height:600, background:"radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", pointerEvents:"none" }}/>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:32, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <PenForgeLogo/>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#ffffff", fontWeight:800, fontSize:28, letterSpacing:3, textTransform:"uppercase" }}>
              Pen<span style={{ color:"#a78bfa" }}>Forge</span>
            </div>
            <div style={{ color:"#6d28d9", fontSize:11, letterSpacing:5, textTransform:"uppercase", marginTop:4 }}>
              Report Manager
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"#f5f5f5", fontWeight:600, fontSize:18, marginBottom:6 }}>{T[mode]}</div>
          <div style={{ color:"#71717a", fontSize:13 }}>{S[mode]}</div>
        </div>

        {/* PIN boxes */}
        <div style={{ display:"flex", gap:12, animation:shake?"shake 0.4s ease-in-out":"none" }}>
          {digits.map((d,i) => (
            <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
              value={d} onChange={e=>handleChange(i,e.target.value)} onKeyDown={e=>handleKey(i,e)}
              style={{
                width:56, height:72,
                background: d ? "rgba(124,58,237,0.15)" : "#0d0d0d",
                border:`2px solid ${d ? "#7c3aed" : "#1f1f1f"}`,
                borderRadius:12, fontSize:32, fontWeight:700, color:"#fff",
                textAlign:"center", outline:"none", caretColor:"transparent",
                boxShadow: d ? "0 0 16px rgba(124,58,237,0.3)" : "none",
                transition:"all 0.15s",
              }}
              onFocus={e=>{e.target.style.borderColor="#7c3aed";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.2)";}}
              onBlur={e=>{if(!d){e.target.style.borderColor="#1f1f1f";e.target.style.boxShadow="none";}}}
            />
          ))}
        </div>

        {error && <div style={{ color:"#f87171", fontSize:13, fontWeight:500 }}>{error}</div>}
        {mode==="set" && <div style={{ color:"#52525b", fontSize:12, textAlign:"center", maxWidth:260 }}>This PIN protects all your pentest data</div>}
      </div>

      <div style={{ position:"absolute", bottom:20, color:"#3f3f46", fontSize:11, letterSpacing:1 }}>
        Made with ❤️ by Perchant
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }`}</style>
    </div>
  );
}
