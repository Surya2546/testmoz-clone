// src/components/ui.tsx
"use client";
import React from "react";

export const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryDark: "#3730A3",
  success: "#10B981",
  successLight: "#ECFDF5",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
};

export const Badge = ({ children, color = "default" }: { children: React.ReactNode; color?: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    default: { bg: "var(--bg-secondary)", color: "var(--text-secondary)" },
    success: { bg: "#ECFDF5", color: "#065F46" },
    warning: { bg: "#FFFBEB", color: "#92400E" },
    primary: { bg: "#EEF2FF", color: "#3730A3" },
    danger: { bg: "#FEF2F2", color: "#991B1B" },
  };
  const s = map[color] || map.default;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, display: "inline-block", whiteSpace: "nowrap" }}>{children}</span>
  );
};

export const Btn = ({
  children, onClick, variant = "default", size = "md", disabled, style = {}, type = "button",
}: {
  children: React.ReactNode; onClick?: () => void; variant?: string; size?: string;
  disabled?: boolean; style?: React.CSSProperties; type?: "button" | "submit";
}) => {
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: "4px 10px", fontSize: 12 },
    md: { padding: "7px 14px", fontSize: 13 },
    lg: { padding: "10px 20px", fontSize: 14 },
  };
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "var(--bg)", color: "var(--text)", borderColor: "var(--border)" },
    primary: { background: "#4F46E5", color: "#fff", borderColor: "#4F46E5" },
    danger: { background: "#FEF2F2", color: "#991B1B", borderColor: "#FECACA" },
    ghost: { background: "transparent", color: "var(--text-secondary)", borderColor: "transparent" },
    success: { background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        border: "0.5px solid",
        borderRadius: "var(--radius-md)",
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export const Input = ({
  value, onChange, placeholder, type = "text", style = {},
}: {
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: "100%", padding: "7px 10px", fontSize: 13,
      border: "0.5px solid var(--border)", borderRadius: "var(--radius-md)",
      background: "var(--bg)", color: "var(--text)", outline: "none", boxSizing: "border-box",
      ...style,
    }}
  />
);

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 32, height: 18, borderRadius: 9, background: checked ? "#4F46E5" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0, cursor: "pointer" }}
    >
      <div style={{ position: "absolute", top: 2, left: checked ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
    <span>{label}</span>
  </label>
);

export const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", ...style }}>
    {children}
  </div>
);

export const Spinner = () => (
  <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTop: "2px solid #4F46E5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
