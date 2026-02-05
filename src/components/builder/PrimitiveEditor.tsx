"use client";

import type { MCPPrimitive, ToolParameter } from "@/types";
import { PRIMITIVE_TYPES, PARAM_TYPES } from "@/lib/registry";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, style = {} }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", background: "#0c1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none", boxSizing: "border-box" as const, ...style }} />
  );
}

function SelectInput({ value, onChange, options, style = {} }: { value: string; onChange: (v: string) => void; options: readonly string[]; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 12px", background: "#0c1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none", ...style }}>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  );
}

export default function PrimitiveEditor({ primitive, onUpdate, onAddParam, onUpdateParam, onRemoveParam }: {
  primitive: MCPPrimitive;
  onUpdate: (updates: Partial<MCPPrimitive>) => void;
  onAddParam: () => void;
  onUpdateParam: (idx: number, updates: Partial<ToolParameter>) => void;
  onRemoveParam: (idx: number) => void;
}) {
  const info = PRIMITIVE_TYPES[primitive.type];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>{info.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>Edit {info.label}</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>{info.desc}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <SectionLabel>Name</SectionLabel>
          <TextInput value={primitive.name} onChange={(v) => onUpdate({ name: v })} placeholder="get_weather" />
        </div>
        <div>
          <SectionLabel>Description</SectionLabel>
          <TextInput value={primitive.description} onChange={(v) => onUpdate({ description: v })} placeholder="What this does..." />
        </div>

        {primitive.type === "tool" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionLabel>Parameters ({primitive.parameters?.length || 0})</SectionLabel>
              <button onClick={onAddParam}
                style={{ padding: "3px 10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4, color: "#22c55e", fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                + Add
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {(primitive.parameters || []).map((param, idx) => (
                <div key={idx} style={{ padding: "10px 12px", background: "#0c1222", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <TextInput value={param.name} onChange={(v) => onUpdateParam(idx, { name: v })} placeholder="param_name" style={{ flex: 1 }} />
                    <SelectInput value={param.type} onChange={(v) => onUpdateParam(idx, { type: v as any })} options={PARAM_TYPES} style={{ width: 100 }} />
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer" }}>
                      <input type="checkbox" checked={param.required} onChange={(e) => onUpdateParam(idx, { required: e.target.checked })} />req
                    </label>
                    <button onClick={() => onRemoveParam(idx)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                  </div>
                  <TextInput value={param.description} onChange={(v) => onUpdateParam(idx, { description: v })} placeholder="Parameter description" style={{ fontSize: 11 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {primitive.type === "resource" && (
          <>
            <div>
              <SectionLabel>URI Pattern</SectionLabel>
              <TextInput value={primitive.uri || ""} onChange={(v) => onUpdate({ uri: v })} placeholder="file:///{path}" />
            </div>
            <div>
              <SectionLabel>MIME Type</SectionLabel>
              <SelectInput value={primitive.mimeType || "text/plain"} onChange={(v) => onUpdate({ mimeType: v })} options={["text/plain", "application/json", "text/html", "text/csv", "image/png"]} />
            </div>
          </>
        )}

        {primitive.type === "prompt" && (
          <div>
            <SectionLabel>Template</SectionLabel>
            <textarea value={primitive.template || ""} onChange={(e) => onUpdate({ template: e.target.value })} placeholder={"You are a helpful assistant that {{role}}..."}
              style={{ width: "100%", minHeight: 100, padding: "8px 12px", background: "#0c1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        )}
      </div>
    </div>
  );
}
