"use client";

interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  style?: React.CSSProperties;
}

export default function SelectInput({ value, onChange, options, style = {} }: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px", background: "#0c1222",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
        color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
        outline: "none", ...style,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
