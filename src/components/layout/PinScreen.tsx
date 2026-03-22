// src/components/layout/PinScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import { ShieldLogo } from "../ui";
import { useApp } from "../../lib/AppContext";
import * as storage from "../../lib/storage";

export function PinScreen() {
  const { hasPin, refreshConfig, config, setAuthenticated } = useApp();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState<"verify"|"set"|"confirm">(hasPin ? "verify" : "set");
  const [firstPin, setFirstPin] = useState("");
  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0,r1,r2,r3,r4,r5];

  useEffect(() => { r0.current?.focus(); }, []);
  const current = digits.join("");

  const triggerError = (msg: string) => {
    setError(msg); setShake(true);
    setDigits(Array(6).fill(""));
    setTimeout(() => { setShake(false); r0.current?.focus(); }, 500);
  };

  const handleSubmit = async (pin: string) => {
    if (mode === "verify") {
      const ok = await storage.verifyPin(pin, config!.pin_hash);
      if (ok) setAuthenticated(true);
      else triggerError("Incorrect PIN. Try again.");
    } else if (mode === "set") {
      setFirstPin(pin); setMode("confirm");
      setDigits(Array(6).fill("")); setError("");
      setTimeout(() => r0.current?.focus(), 50);
    } else {
      if (pin !== firstPin) { triggerError("PINs don't match."); setMode("set"); setFirstPin(""); }
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
      else if (i > 0) { const d=[...digits];d[i-1]="";setDigits(d);refs[i-1].current?.focus(); }
    }
  };

  const titles = { verify:"Enter your PIN", set:"Set a 6-digit PIN", confirm:"Confirm your PIN" };
  const subs = { verify:"Enter your PIN to access PenForge", set:"Create a PIN to secure your reports", confirm:"Re-enter your PIN to confirm" };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <ShieldLogo size={60} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-wide">PenForge</h1>
            <p className="text-xs text-[#52525b] tracking-widest uppercase mt-1">Pentest Report Manager</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-[#f5f5f5] font-semibold text-lg">{titles[mode]}</h2>
            <p className="text-[#71717a] text-sm mt-1">{subs[mode]}</p>
          </div>
          <div className={`flex gap-3 ${shake ? "animate-shake" : ""}`}>
            {digits.map((d,i) => (
              <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
                className={`pin-digit ${d?"filled":""}`}
                value={d} onChange={e=>handleChange(i,e.target.value)} onKeyDown={e=>handleKey(i,e)} />
            ))}
          </div>
          {error && <p className="text-[#dc2626] text-sm font-medium animate-fade-in">{error}</p>}
        </div>
      </div>
      <div className="absolute bottom-4 text-xs text-[#3f3f46]">Made with ❤️ by Perchant</div>
    </div>
  );
}
