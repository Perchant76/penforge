// src/components/ui/index.tsx — All styles inline for production safety
import React from "react";
import type { Severity, VulnStatus, ProjectStatus } from "../../types";
import { SEVERITY_COLORS } from "../../types";

const F = "Inter, system-ui, sans-serif";

// ── Logo / Shield ─────────────────────────────────────────────────────────────
export function ShieldLogo({ size=32 }: { size?: number }) {
  return (
    <svg width={size} height={size*1.1} viewBox="0 0 40 44" fill="none">
      <path d="M20 2L4 9v12c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z"
        fill="#dc2626" opacity="0.2" stroke="#dc2626" strokeWidth="2"/>
      <path d="M20 10L10 14v8c0 6.2 4.5 12 10 14 5.5-2 10-7.8 10-14v-8L20 10z"
        fill="#dc2626" opacity="0.4"/>
      <text x="20" y="27" textAnchor="middle" fill="white"
        fontSize="12" fontWeight="700" fontFamily={F}>PF</text>
    </svg>
  );
}

// ── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: Severity }) {
  const bg: Record<Severity,string> = {
    Critical:"#450a0a", High:"#431407", Medium:"#422006", Low:"#172554", Info:"#18181b"
  };
  const col: Record<Severity,string> = {
    Critical:"#f87171", High:"#fb923c", Medium:"#fbbf24", Low:"#60a5fa", Info:"#71717a"
  };
  return (
    <span style={{
      background:bg[severity], color:col[severity],
      border:`1px solid ${col[severity]}44`,
      padding:"2px 9px", borderRadius:4,
      fontSize:11, fontWeight:700,
      display:"inline-flex", alignItems:"center", gap:5,
      whiteSpace:"nowrap", fontFamily:F,
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:col[severity] }}/>
      {severity}
    </span>
  );
}

// ── Vuln Status Badge ─────────────────────────────────────────────────────────
export function VulnStatusBadge({ status }: { status: VulnStatus }) {
  const s = {
    Open:     { bg:"rgba(220,38,38,0.12)",  color:"#f87171", border:"rgba(220,38,38,0.3)" },
    Fixed:    { bg:"rgba(34,197,94,0.1)",   color:"#4ade80", border:"rgba(34,197,94,0.3)" },
    Accepted: { bg:"rgba(113,113,122,0.1)", color:"#a1a1aa", border:"rgba(113,113,122,0.3)" },
  }[status];
  return (
    <span style={{
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      padding:"2px 8px", borderRadius:4, fontSize:11, fontFamily:F,
    }}>{status}</span>
  );
}

// ── Project Status Badge ──────────────────────────────────────────────────────
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = {
    "In Progress": { bg:"rgba(245,158,11,0.12)", color:"#fbbf24", border:"rgba(245,158,11,0.3)" },
    Completed:     { bg:"rgba(34,197,94,0.1)",   color:"#4ade80", border:"rgba(34,197,94,0.3)" },
    Draft:         { bg:"rgba(113,113,122,0.1)", color:"#a1a1aa", border:"rgba(113,113,122,0.3)" },
  }[status];
  return (
    <span style={{
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      padding:"2px 8px", borderRadius:4, fontSize:11, fontFamily:F,
    }}>{status}</span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"ghost"|"danger"|"muted";
  size?: "sm"|"md"|"lg";
}
export function Btn({ variant="muted", size="md", style, children, ...props }: BtnProps) {
  const v = {
    primary: { background:"#dc2626", color:"#fff",    border:"1px solid #dc2626", boxShadow:"0 0 10px rgba(220,38,38,0.25)" },
    ghost:   { background:"transparent", color:"#dc2626", border:"1px solid #dc2626" },
    danger:  { background:"rgba(220,38,38,0.1)", color:"#f87171", border:"1px solid rgba(220,38,38,0.3)" },
    muted:   { background:"#1a1a1a", color:"#a1a1aa", border:"1px solid #2a2a2a" },
  }[variant];
  const sz = { sm:{height:28,padding:"0 11px",fontSize:11}, md:{height:34,padding:"0 14px",fontSize:12}, lg:{height:40,padding:"0 18px",fontSize:13} }[size];
  return (
    <button {...props} style={{
      ...v, ...sz,
      display:"inline-flex", alignItems:"center", gap:6,
      borderRadius:8, fontWeight:600, cursor:"pointer",
      transition:"all 0.15s", fontFamily:F,
      opacity: props.disabled ? 0.4 : 1,
      ...(props.disabled ? { cursor:"not-allowed" } : {}),
      ...style,
    }}>
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width:"100%",
  background:"#111111",
  border:"1px solid #1f1f1f",
  color:"#f5f5f5",
  borderRadius:8,
  padding:"7px 11px",
  fontSize:13,
  outline:"none",
  fontFamily:F,
  transition:"border-color 0.15s, box-shadow 0.15s",
};

export function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input {...props} style={{
      ...inputBase,
      borderColor: focused ? "#dc2626" : "#1f1f1f",
      boxShadow: focused ? "0 0 0 2px rgba(220,38,38,0.15)" : "none",
      ...style,
    }}
    onFocus={e => { setFocused(true); props.onFocus?.(e); }}
    onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

export function Textarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea {...props} style={{
      ...inputBase,
      resize:"vertical", minHeight:80,
      borderColor: focused ? "#dc2626" : "#1f1f1f",
      boxShadow: focused ? "0 0 0 2px rgba(220,38,38,0.15)" : "none",
      ...style,
    }}
    onFocus={e => { setFocused(true); props.onFocus?.(e); }}
    onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

export function Select({ style, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = React.useState(false);
  return (
    <select {...props} style={{
      ...inputBase, cursor:"pointer",
      borderColor: focused ? "#dc2626" : "#1f1f1f",
      boxShadow: focused ? "0 0 0 2px rgba(220,38,38,0.15)" : "none",
      ...style,
    }}
    onFocus={e => { setFocused(true); props.onFocus?.(e); }}
    onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    >{children}</select>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:"#111111", border:"1px solid #1f1f1f",
      borderRadius:12, padding:18,
      ...style,
    }}>{children}</div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      display:"block", fontSize:11, fontWeight:600,
      color:"#71717a", textTransform:"uppercase",
      letterSpacing:"0.8px", marginBottom:6, fontFamily:F,
    }}>
      {children}
      {required && <span style={{ color:"#dc2626", marginLeft:4 }}>*</span>}
    </label>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth=520 }: {
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode; maxWidth?:number;
}) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:50,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, background:"rgba(0,0,0,0.75)",
      backdropFilter:"blur(4px)",
      animation:"fadeIn 0.15s ease",
    }} onClick={onClose}>
      <div style={{
        background:"#111111", border:"1px solid #2a2a2a",
        borderRadius:16, width:"100%", maxWidth,
        maxHeight:"88vh", overflowY:"auto",
        boxShadow:"0 24px 60px rgba(0,0,0,0.6)",
        animation:"slideUp 0.2s ease",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:"1px solid #1f1f1f",
        }}>
          <span style={{ fontSize:14, fontWeight:600, color:"#f5f5f5", fontFamily:F }}>{title}</span>
          <button onClick={onClose} style={{
            background:"transparent", border:"none", color:"#71717a",
            cursor:"pointer", padding:4, borderRadius:6,
            fontSize:18, lineHeight:1, transition:"color 0.15s",
          }} onMouseEnter={e=>(e.currentTarget.style.color="#f5f5f5")}
             onMouseLeave={e=>(e.currentTarget.style.color="#71717a")}>✕</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message }: {
  open:boolean; onClose:()=>void; onConfirm:()=>void; title:string; message:string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
      <p style={{ color:"#a1a1aa", fontSize:13, marginBottom:20, lineHeight:1.6, fontFamily:F }}>{message}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn variant="muted" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Btn>
      </div>
    </Modal>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }: {
  icon:React.ReactNode; title:string; message:string; action?:React.ReactNode;
}) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"64px 32px", textAlign:"center",
    }}>
      <div style={{ color:"#2a2a2a", marginBottom:16 }}>{icon}</div>
      <div style={{ color:"#f5f5f5", fontWeight:600, fontSize:16, marginBottom:8, fontFamily:F }}>{title}</div>
      <p style={{ color:"#71717a", fontSize:13, maxWidth:320, marginBottom:24, lineHeight:1.6, fontFamily:F }}>{message}</p>
      {action}
    </div>
  );
}

// ── Tag Input ─────────────────────────────────────────────────────────────────
export function TagInput({ tags, onChange, placeholder }: {
  tags:string[]; onChange:(t:string[])=>void; placeholder?:string;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", gap:8 }}>
        <Input value={input} onChange={e=>setInput(e.target.value)}
          placeholder={placeholder ?? "Add tag..."}
          onKeyDown={e => { if (e.key==="Enter"){e.preventDefault();add();}}}/>
        <Btn variant="ghost" size="sm" onClick={add}>Add</Btn>
      </div>
      {tags.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {tags.map(t => (
            <span key={t} style={{
              background:"#1a1a1a", border:"1px solid #2a2a2a",
              color:"#a1a1aa", padding:"2px 8px", borderRadius:4,
              fontSize:11, display:"flex", alignItems:"center", gap:4, fontFamily:F,
            }}>
              {t}
              <button onClick={() => onChange(tags.filter(x=>x!==t))} style={{
                background:"none", border:"none", color:"#52525b",
                cursor:"pointer", padding:0, fontSize:13, lineHeight:1,
              }}
              onMouseEnter={e=>(e.currentTarget.style.color="#dc2626")}
              onMouseLeave={e=>(e.currentTarget.style.color="#52525b")}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <div style={{
      textAlign:"center", fontSize:11, color:"#3f3f46",
      padding:"12px 0", marginTop:"auto",
      borderTop:"1px solid #1a1a1a",
      fontFamily:F,
    }}>
      Made with ❤️ by Perchant
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }: {
  label:string; value:number|string; color:string; icon:React.ReactNode;
}) {
  return (
    <div style={{
      background:"#111111", border:"1px solid #1f1f1f",
      borderRadius:12, padding:"14px 18px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at top left, ${color}10, transparent 60%)`,
        pointerEvents:"none",
      }}/>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:10, color:"#71717a", textTransform:"uppercase",
            letterSpacing:"0.8px", marginBottom:8, fontFamily:F, fontWeight:600 }}>{label}</p>
          <p style={{ fontSize:30, fontWeight:800, color, fontFamily:F, lineHeight:1 }}>{value}</p>
        </div>
        <div style={{
          padding:8, borderRadius:8,
          background:`${color}18`, color,
        }}>{icon}</div>
      </div>
    </div>
  );
}
