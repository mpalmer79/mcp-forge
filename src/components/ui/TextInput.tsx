"use client";

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function TextInput({ value, onChange, placeholder, style = {} }: TextInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px", background: "#0c1222",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
        color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
        outline: "none", boxSizing: "border-box" as const, ...style,
      }}
    />
  );
}
