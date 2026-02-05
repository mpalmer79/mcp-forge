"use client";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}

export default function Badge({ children, color = "#22c55e", style = {} }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
        background: `${color}15`, color, border: `1px solid ${color}30`,
        letterSpacing: "0.04em", fontFamily: "'IBM Plex Mono', monospace",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
