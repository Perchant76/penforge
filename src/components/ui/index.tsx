// src/components/ui/index.tsx
import React from "react";
import type { Severity, VulnStatus, ProjectStatus } from "../../types";
import { SEVERITY_COLORS, SEVERITY_BG } from "../../types";

// ── Shield Logo ───────────────────────────────────────────────────────────────
export function ShieldLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
      <path d="M20 2L4 9v12c0 10.5 6.8 20.3 16 23 9.2-2.7 16-12.5 16-23V9L20 2z" fill="#dc2626" opacity="0.2" stroke="#dc2626" strokeWidth="2"/>
      <path d="M20 10L10 14v8c0 6.2 4.5 12 10 14 5.5-2 10-7.8 10-14v-8L20 10z" fill="#dc2626" opacity="0.4"/>
      <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Inter,system-ui">PF</text>
    </svg>
  );
}

// ── Severity Badge ─────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: Severity }) {
  const classes: Record<Severity, string> = {
    Critical: "bg-red-950 text-red-400 border border-red-500/30",
    High:     "bg-orange-950 text-orange-400 border border-orange-500/30",
    Medium:   "bg-yellow-950 text-yellow-400 border border-yellow-500/30",
    Low:      "bg-blue-950 text-blue-400 border border-blue-500/30",
    Info:     "bg-zinc-900 text-zinc-400 border border-zinc-600/30",
  };
  return (
    <span className={`${classes[severity]} px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }} />
      {severity}
    </span>
  );
}

// ── Status Badges ──────────────────────────────────────────────────────────────
export function VulnStatusBadge({ status }: { status: VulnStatus }) {
  const cls = {
    Open:     "bg-red-950/50 text-red-400 border border-red-500/30",
    Fixed:    "bg-green-950/50 text-green-400 border border-green-500/30",
    Accepted: "bg-zinc-900 text-zinc-400 border border-zinc-600/30",
  }[status];
  return <span className={`${cls} px-2 py-0.5 rounded text-xs`}>{status}</span>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const cls = {
    "In Progress": "bg-yellow-950/50 text-yellow-400 border border-yellow-500/30",
    Completed:     "bg-green-950/50 text-green-400 border border-green-500/30",
    Draft:         "bg-zinc-900 text-zinc-400 border border-zinc-600/30",
  }[status];
  return <span className={`${cls} px-2 py-0.5 rounded text-xs`}>{status}</span>;
}

// ── Buttons ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "muted";
  size?: "sm" | "md" | "lg";
}
export function Btn({ variant = "muted", size = "md", className = "", children, ...props }: BtnProps) {
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-[0_0_12px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]",
    ghost:   "border border-[#dc2626] text-[#dc2626] hover:bg-[rgba(220,38,38,0.1)]",
    danger:  "bg-red-900/30 border border-red-500/40 text-red-400 hover:bg-red-900/50",
    muted:   "bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] hover:text-[#f5f5f5] hover:border-[#3a3a3a]",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  return (
    <button {...props} className={`${variants[variant]} ${sizes[size]} font-medium rounded-lg transition-all duration-150 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.2)] placeholder:text-[#52525b] transition-all ${className}`} />
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.2)] placeholder:text-[#52525b] transition-all resize-y ${className}`} />
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`w-full bg-[#111] border border-[#1f1f1f] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[rgba(220,38,38,0.2)] transition-all ${className}`}>
      {children}
    </select>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 ${className}`}>{children}</div>;
}

// ── Label ──────────────────────────────────────────────────────────────────────
export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-[#dc2626] ml-1">*</span>}
    </label>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = "max-w-xl" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto animate-slide-up`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>
          <button onClick={onClose} className="text-[#71717a] hover:text-[#f5f5f5] transition-colors p-1 rounded-lg hover:bg-[#1a1a1a]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-[#a1a1aa] text-sm mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <Btn variant="muted" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>Delete</Btn>
      </div>
    </Modal>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }: {
  icon: React.ReactNode; title: string; message: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[#2a2a2a] mb-4">{icon}</div>
      <h3 className="text-[#f5f5f5] font-semibold text-lg mb-2">{title}</h3>
      <p className="text-[#71717a] text-sm max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}

// ── Tag Input ─────────────────────────────────────────────────────────────────
export function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onChange([...tags, v]); }
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder ?? "Add tag..."} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Btn variant="ghost" size="sm" onClick={add}>Add</Btn>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] px-2 py-0.5 rounded text-xs flex items-center gap-1">
              {t}
              <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-[#52525b] hover:text-[#dc2626]">×</button>
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
    <div className="text-center text-xs text-[#3f3f46] py-3 mt-auto border-t border-[#1f1f1f]">
      Made with ❤️ by Perchant
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(ellipse at top left, ${color}, transparent)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#71717a] uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${color}20`, color }}>{icon}</div>
      </div>
    </div>
  );
}
