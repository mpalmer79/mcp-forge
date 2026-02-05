"use client";

import { useState, useCallback } from "react";
import type { MCPServer, MCPPrimitive, ToolParameter, PrimitiveType } from "@/types";
import { PRIMITIVE_TYPES, TRANSPORTS, PARAM_TYPES } from "@/lib/registry";
import { generateServerCode } from "@/lib/codegen";

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

function PrimitiveEditor({ primitive, onUpdate, onAddParam, onUpdateParam, onRemoveParam }: {
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
        <div><SectionLabel>Name</SectionLabel><TextInput value={primitive.name} onChange={(v) => onUpdate({ name: v })} placeholder="get_weather" /></div>
        <div><SectionLabel>Description</SectionLabel><TextInput value={primitive.description} onChange={(v) => onUpdate({ description: v })} placeholder="What this does..." /></div>
        {primitive.type === "tool" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionLabel>Parameters ({primitive.parameters?.length || 0})</SectionLabel>
              <button onClick={onAddParam} style={{ padding: "3px 10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4, color: "#22c55e", fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>+ Add</button>
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
                    <button onClick={() => onRemoveParam(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                  </div>
                  <TextInput value={param.description} onChange={(v) => onUpdateParam(idx, { description: v })} placeholder="Parameter description" style={{ fontSize: 11 }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {primitive.type === "resource" && (
          <>
            <div><SectionLabel>URI Pattern</SectionLabel><TextInput value={primitive.uri || ""} onChange={(v) => onUpdate({ uri: v })} placeholder="file:///{path}" /></div>
            <div><SectionLabel>MIME Type</SectionLabel><SelectInput value={primitive.mimeType || "text/plain"} onChange={(v) => onUpdate({ mimeType: v })} options={["text/plain", "application/json", "text/html", "text/csv", "image/png"]} /></div>
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

function CodePreview({ server }: { server: MCPServer }) {
  const code = generateServerCode(server);
  return (
    <pre style={{ background: "#060a14", padding: 16, borderRadius: 8, border: "1px solid rgba(34,197,94,0.1)", fontSize: 10.5, lineHeight: 1.7, color: "#94a3b8", overflow: "auto", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {code.split("\n").map((line, i) => {
        let color = "#94a3b8";
        if (line.includes("import") || line.includes("from") || line.includes("const") || line.includes("async") || line.includes("await") || line.includes("return")) color = "#c084fc";
        if (line.includes("//")) color = "#334155";
        if (line.includes('"') || line.includes("'") || line.includes("`")) color = "#22c55e";
        if (line.includes("server.tool") || line.includes("server.resource") || line.includes("server.prompt")) color = "#f59e0b";
        return (<div key={i} style={{ color }}>{line || " "}</div>);
      })}
    </pre>
  );
}

export default function BuilderTab({ server, setServer }: { server: MCPServer; setServer: React.Dispatch<React.SetStateAction<MCPServer>> }) {
  const [selectedPrimitive, setSelectedPrimitive] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<MCPPrimitive | null>(null);

  const addPrimitive = useCallback((type: PrimitiveType) => {
    const id = `${type}_${Date.now()}`;
    const base: MCPPrimitive = { id, type, name: "", description: "" };
    if (type === "tool") { base.parameters = []; base.returnType = "string"; }
    else if (type === "resource") { base.uri = ""; base.mimeType = "text/plain"; }
    else { base.template = ""; base.arguments = []; }
    setServer((s) => ({ ...s, primitives: [...s.primitives, base] }));
    setSelectedPrimitive(id);
    setEditingTool(base);
  }, [setServer]);

  const updatePrimitive = useCallback((id: string, updates: Partial<MCPPrimitive>) => {
    setServer((s) => ({ ...s, primitives: s.primitives.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
    setEditingTool((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  }, [setServer]);

  const removePrimitive = useCallback((id: string) => {
    setServer((s) => ({ ...s, primitives: s.primitives.filter((p) => p.id !== id) }));
    if (selectedPrimitive === id) { setSelectedPrimitive(null); setEditingTool(null); }
  }, [selectedPrimitive, setServer]);

  const addParam = useCallback((toolId: string) => {
    const param: ToolParameter = { name: "", type: "string", description: "", required: true };
    updatePrimitive(toolId, { parameters: [...(editingTool?.parameters || []), param] });
  }, [editingTool, updatePrimitive]);

  const updateParam = useCallback((toolId: string, idx: number, updates: Partial<ToolParameter>) => {
    const params = [...(editingTool?.parameters || [])];
    params[idx] = { ...params[idx], ...updates };
    updatePrimitive(toolId, { parameters: params });
  }, [editingTool, updatePrimitive]);

  const removeParam = useCallback((toolId: string, idx: number) => {
    const params = (editingTool?.parameters || []).filter((_, i) => i !== idx);
    updatePrimitive(toolId, { parameters: params });
  }, [editingTool, updatePrimitive]);

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      {/* Left: server config + primitive list */}
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,0.04)", padding: 16, overflowY: "auto", flexShrink: 0 }}>
        <SectionLabel>Server Info</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <TextInput value={server.name} onChange={(v) => setServer((s) => ({ ...s, name: v }))} placeholder="server-name" />
          <TextInput value={server.description} onChange={(v) => setServer((s) => ({ ...s, description: v }))} placeholder="Description..." />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <SectionLabel>Transport</SectionLabel>
            <SelectInput value={server.transport} onChange={(v) => setServer((s) => ({ ...s, transport: v as any }))} options={TRANSPORTS} />
          </div>
        </div>
        <SectionLabel>Primitives ({server.primitives.length})</SectionLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(Object.entries(PRIMITIVE_TYPES) as [PrimitiveType, typeof PRIMITIVE_TYPES[string]][]).map(([type, info]) => (
            <button key={type} onClick={() => addPrimitive(type)}
              style={{ flex: 1, padding: "6px 4px", background: `${info.color}08`, border: `1px dashed ${info.color}40`, borderRadius: 6, color: info.color, fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: "0.03em", transition: "all 0.15s" }}>
              {info.icon} {info.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {server.primitives.map((p) => {
            const info = PRIMITIVE_TYPES[p.type];
            const isSelected = selectedPrimitive === p.id;
            return (
              <div key={p.id} onClick={() => { setSelectedPrimitive(p.id); setEditingTool(p); }}
                style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: isSelected ? `${info.color}10` : "transparent", border: `1px solid ${isSelected ? `${info.color}30` : "rgba(255,255,255,0.04)"}`, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{info.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>{p.name || `untitled_${p.type}`}</div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {info.label}{p.type === "tool" && p.parameters && p.parameters.length > 0 && ` · ${p.parameters.length} params`}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removePrimitive(p.id); }}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: 2 }}>×</button>
              </div>
            );
          })}
          {server.primitives.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#334155", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
              Add tools, resources, or prompts<br />using the buttons above
            </div>
          )}
        </div>
      </div>

      {/* Center: editor */}
      <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
        {editingTool ? (
          <PrimitiveEditor primitive={editingTool} onUpdate={(updates) => updatePrimitive(editingTool.id, updates)} onAddParam={() => addParam(editingTool.id)} onUpdateParam={(idx, updates) => updateParam(editingTool.id, idx, updates)} onRemoveParam={(idx) => removeParam(editingTool.id, idx)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔧</div>
            <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>Select a primitive to edit</div>
            <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4, color: "#1e293b" }}>or add a new tool, resource, or prompt</div>
          </div>
        )}
      </div>

      {/* Right: code preview */}
      <div style={{ width: 320, borderLeft: "1px solid rgba(255,255,255,0.04)", padding: 16, overflowY: "auto", flexShrink: 0 }}>
        <SectionLabel>Generated Code (TypeScript)</SectionLabel>
        <CodePreview server={server} />
      </div>
    </div>
  );
}
