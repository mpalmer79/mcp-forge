"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  MCPServer,
  MCPPrimitive,
  ToolParameter,
  PlaygroundLog,
  PrimitiveType,
} from "@/types";
import { PRIMITIVE_TYPES, TRANSPORTS, PARAM_TYPES, REGISTRY_SERVERS } from "@/lib/registry";
import { generateServerCode, generateConfig, generatePackageJson } from "@/lib/codegen";

// ============================================
// Tabs
// ============================================
const TABS = ["Builder", "Registry", "Playground", "Config"] as const;
type TabName = (typeof TABS)[number];

// ============================================
// Shared UI components (inline)
// ============================================
function Badge({
  children,
  color = "#22c55e",
  style = {},
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
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

function TextInput({
  value,
  onChange,
  placeholder,
  style = {},
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
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

function SelectInput({
  value,
  onChange,
  options,
  style = {},
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  style?: React.CSSProperties;
}) {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.15em",
        textTransform: "uppercase" as const, marginBottom: 8,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// Primitive Editor
// ============================================
function PrimitiveEditor({
  primitive,
  onUpdate,
  onAddParam,
  onUpdateParam,
  onRemoveParam,
}: {
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
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>
            Edit {info.label}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
            {info.desc}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <SectionLabel>Name</SectionLabel>
          <TextInput value={primitive.name} onChange={(v) => onUpdate({ name: v })} placeholder="get_weather" />
        </div>
        <div>
          <SectionLabel>Description</SectionLabel>
          <TextInput
            value={primitive.description}
            onChange={(v) => onUpdate({ description: v })}
            placeholder="What this does..."
          />
        </div>

        {primitive.type === "tool" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionLabel>Parameters ({primitive.parameters?.length || 0})</SectionLabel>
              <button
                onClick={onAddParam}
                style={{
                  padding: "3px 10px", background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4,
                  color: "#22c55e", fontSize: 10, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                }}
              >
                + Add
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {(primitive.parameters || []).map((param, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 12px", background: "#0c1222", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <TextInput
                      value={param.name}
                      onChange={(v) => onUpdateParam(idx, { name: v })}
                      placeholder="param_name"
                      style={{ flex: 1 }}
                    />
                    <SelectInput
                      value={param.type}
                      onChange={(v) => onUpdateParam(idx, { type: v as any })}
                      options={PARAM_TYPES}
                      style={{ width: 100 }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => onUpdateParam(idx, { required: e.target.checked })}
                      />
                      req
                    </label>
                    <button
                      onClick={() => onRemoveParam(idx)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                  <TextInput
                    value={param.description}
                    onChange={(v) => onUpdateParam(idx, { description: v })}
                    placeholder="Parameter description"
                    style={{ fontSize: 11 }}
                  />
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
              <SelectInput
                value={primitive.mimeType || "text/plain"}
                onChange={(v) => onUpdate({ mimeType: v })}
                options={["text/plain", "application/json", "text/html", "text/csv", "image/png"]}
              />
            </div>
          </>
        )}

        {primitive.type === "prompt" && (
          <div>
            <SectionLabel>Template</SectionLabel>
            <textarea
              value={primitive.template || ""}
              onChange={(e) => onUpdate({ template: e.target.value })}
              placeholder={"You are a helpful assistant that {{role}}..."}
              style={{
                width: "100%", minHeight: 100, padding: "8px 12px", background: "#0c1222",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
                outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Code Preview
// ============================================
function CodePreview({ server }: { server: MCPServer }) {
  const code = generateServerCode(server);

  return (
    <pre
      style={{
        background: "#060a14", padding: 16, borderRadius: 8,
        border: "1px solid rgba(34,197,94,0.1)", fontSize: 10.5,
        lineHeight: 1.7, color: "#94a3b8", overflow: "auto",
        fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {code.split("\n").map((line, i) => {
        let color = "#94a3b8";
        if (line.includes("import") || line.includes("from") || line.includes("const") || line.includes("async") || line.includes("await") || line.includes("return"))
          color = "#c084fc";
        if (line.includes("//")) color = "#334155";
        if (line.includes('"') || line.includes("'") || line.includes("`"))
          color = "#22c55e";
        if (line.includes("server.tool") || line.includes("server.resource") || line.includes("server.prompt"))
          color = "#f59e0b";
        return (
          <div key={i} style={{ color }}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

// ============================================
// Builder Tab
// ============================================
function BuilderTab({
  server,
  setServer,
}: {
  server: MCPServer;
  setServer: React.Dispatch<React.SetStateAction<MCPServer>>;
}) {
  const [selectedPrimitive, setSelectedPrimitive] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<MCPPrimitive | null>(null);

  const addPrimitive = useCallback(
    (type: PrimitiveType) => {
      const id = `${type}_${Date.now()}`;
      const base: MCPPrimitive = { id, type, name: "", description: "" };
      if (type === "tool") { base.parameters = []; base.returnType = "string"; }
      else if (type === "resource") { base.uri = ""; base.mimeType = "text/plain"; }
      else { base.template = ""; base.arguments = []; }
      setServer((s) => ({ ...s, primitives: [...s.primitives, base] }));
      setSelectedPrimitive(id);
      setEditingTool(base);
    },
    [setServer]
  );

  const updatePrimitive = useCallback(
    (id: string, updates: Partial<MCPPrimitive>) => {
      setServer((s) => ({
        ...s,
        primitives: s.primitives.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
      setEditingTool((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
    },
    [setServer]
  );

  const removePrimitive = useCallback(
    (id: string) => {
      setServer((s) => ({ ...s, primitives: s.primitives.filter((p) => p.id !== id) }));
      if (selectedPrimitive === id) { setSelectedPrimitive(null); setEditingTool(null); }
    },
    [selectedPrimitive, setServer]
  );

  const addParam = useCallback(
    (toolId: string) => {
      const param: ToolParameter = { name: "", type: "string", description: "", required: true };
      updatePrimitive(toolId, { parameters: [...(editingTool?.parameters || []), param] });
    },
    [editingTool, updatePrimitive]
  );

  const updateParam = useCallback(
    (toolId: string, idx: number, updates: Partial<ToolParameter>) => {
      const params = [...(editingTool?.parameters || [])];
      params[idx] = { ...params[idx], ...updates };
      updatePrimitive(toolId, { parameters: params });
    },
    [editingTool, updatePrimitive]
  );

  const removeParam = useCallback(
    (toolId: string, idx: number) => {
      const params = (editingTool?.parameters || []).filter((_, i) => i !== idx);
      updatePrimitive(toolId, { parameters: params });
    },
    [editingTool, updatePrimitive]
  );

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
            <button
              key={type}
              onClick={() => addPrimitive(type)}
              style={{
                flex: 1, padding: "6px 4px", background: `${info.color}08`,
                border: `1px dashed ${info.color}40`, borderRadius: 6, color: info.color,
                fontSize: 10, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600, letterSpacing: "0.03em", transition: "all 0.15s",
              }}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {server.primitives.map((p) => {
            const info = PRIMITIVE_TYPES[p.type];
            const isSelected = selectedPrimitive === p.id;
            return (
              <div
                key={p.id}
                onClick={() => { setSelectedPrimitive(p.id); setEditingTool(p); }}
                style={{
                  padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                  background: isSelected ? `${info.color}10` : "transparent",
                  border: `1px solid ${isSelected ? `${info.color}30` : "rgba(255,255,255,0.04)"}`,
                  transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{info.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {p.name || `untitled_${p.type}`}
                  </div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {info.label}
                    {p.type === "tool" && p.parameters && p.parameters.length > 0 && ` · ${p.parameters.length} params`}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removePrimitive(p.id); }}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: 2 }}
                >
                  ×
                </button>
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
          <PrimitiveEditor
            primitive={editingTool}
            onUpdate={(updates) => updatePrimitive(editingTool.id, updates)}
            onAddParam={() => addParam(editingTool.id)}
            onUpdateParam={(idx, updates) => updateParam(editingTool.id, idx, updates)}
            onRemoveParam={(idx) => removeParam(editingTool.id, idx)}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔧</div>
            <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>Select a primitive to edit</div>
            <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4, color: "#1e293b" }}>
              or add a new tool, resource, or prompt
            </div>
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

// ============================================
// Registry Tab
// ============================================
function RegistryTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "official" | "community">("all");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const filtered = REGISTRY_SERVERS.filter((s) => {
    if (filter === "official" && !s.official) return false;
    if (filter === "community" && s.official) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q));
    }
    return true;
  });

  return (
    <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <TextInput value={search} onChange={setSearch} placeholder="Search servers..." style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "official", "community"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 12px",
                background: filter === f ? "rgba(34,197,94,0.1)" : "transparent",
                border: `1px solid ${filter === f ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 6, color: filter === f ? "#22c55e" : "#64748b",
                fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500,
              }}
            >
              {f === "all" ? "All" : f === "official" ? "⚙ Official" : "👥 Community"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedServer(selectedServer === s.id ? null : s.id)}
            style={{
              padding: 16, background: selectedServer === s.id ? "rgba(34,197,94,0.04)" : "#0a0f1a",
              border: `1px solid ${selectedServer === s.id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)"}`,
              borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {s.name}
                  </span>
                  {s.official && <Badge color="#3b82f6">Official</Badge>}
                </div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                  by {s.author}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b", fontFamily: "'IBM Plex Mono', monospace" }}>
                ★ {s.stars >= 1000 ? `${(s.stars / 1000).toFixed(1)}k` : s.stars}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 10px", fontFamily: "'IBM Plex Mono', monospace" }}>
              {s.desc}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <Badge color="#22c55e">⚡ {s.primitives.tools} tools</Badge>
              <Badge color="#f59e0b">📄 {s.primitives.resources} resources</Badge>
              {s.primitives.prompts > 0 && <Badge color="#a78bfa">💬 {s.primitives.prompts} prompts</Badge>}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {s.tags.map((t) => (
                <span key={t} style={{ fontSize: 9, padding: "1px 6px", background: "rgba(255,255,255,0.03)", borderRadius: 3, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>
                  #{t}
                </span>
              ))}
            </div>

            {selectedServer === s.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionLabel>Quick Install</SectionLabel>
                <div style={{
                  padding: "8px 12px", background: "#060a14", borderRadius: 6,
                  fontSize: 11, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace",
                  border: "1px solid rgba(34,197,94,0.1)",
                }}>
                  {s.transport === "stdio"
                    ? `npx -y @modelcontextprotocol/${s.id}`
                    : `claude mcp add --transport ${s.transport} ${s.id} https://mcp.${s.id}.com`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Playground Tab
// ============================================
function PlaygroundTab({ server }: { server: MCPServer }) {
  const [logs, setLogs] = useState<PlaygroundLog[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const tools = server.primitives.filter((p) => p.type === "tool");

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const simulateCall = useCallback((tool: MCPPrimitive) => {
    setRunning(true);
    setLogs((prev) => [
      ...prev,
      {
        type: "request",
        time: new Date().toISOString().slice(11, 23),
        method: "tools/call",
        data: {
          name: tool.name || "unnamed",
          arguments: Object.fromEntries(
            (tool.parameters || []).map((p) => [
              p.name || "param",
              p.type === "number" ? 42 : p.type === "boolean" ? true : "example_value",
            ])
          ),
        },
      },
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          type: "response",
          time: new Date().toISOString().slice(11, 23),
          method: "tools/call",
          data: {
            content: [{ type: "text", text: `Result from ${tool.name || "unnamed_tool"}: OK` }],
            isError: false,
          },
        },
      ]);
      setRunning(false);
    }, 800 + Math.random() * 400);
  }, []);

  const simulateList = useCallback(() => {
    setRunning(true);
    setLogs((prev) => [
      ...prev,
      { type: "request", time: new Date().toISOString().slice(11, 23), method: "tools/list", data: {} },
    ]);
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          type: "response",
          time: new Date().toISOString().slice(11, 23),
          method: "tools/list",
          data: { tools: tools.map((t) => ({ name: t.name, description: t.description })) },
        },
      ]);
      setRunning(false);
    }, 400);
  }, [tools]);

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      <div style={{ width: 260, borderRight: "1px solid rgba(255,255,255,0.04)", padding: 16, overflowY: "auto" }}>
        <SectionLabel>Available Tools ({tools.length})</SectionLabel>
        <button
          onClick={simulateList}
          disabled={running}
          style={{
            width: "100%", padding: 8, background: "rgba(168,139,250,0.08)",
            border: "1px solid rgba(168,139,250,0.2)", borderRadius: 6,
            color: "#a78bfa", fontSize: 11, cursor: "pointer", marginBottom: 12,
            fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
          }}
        >
          ↻ List All Tools
        </button>

        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => simulateCall(t)}
            disabled={running}
            style={{
              width: "100%", padding: 10, background: "#0c1222",
              border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6,
              color: "#e2e8f0", fontSize: 12, cursor: "pointer", marginBottom: 6,
              textAlign: "left" as const, fontFamily: "'IBM Plex Mono', monospace",
              opacity: running ? 0.5 : 1, transition: "all 0.15s",
            }}
          >
            <div style={{ fontWeight: 600 }}>⚡ {t.name || "unnamed"}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
              {(t.parameters || []).length} params
            </div>
          </button>
        ))}

        {tools.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", fontSize: 11, padding: 20, fontFamily: "'IBM Plex Mono', monospace" }}>
            No tools defined yet.<br />Add some in the Builder tab.
          </div>
        )}
      </div>

      <div ref={logRef} style={{ flex: 1, padding: 16, overflowY: "auto", background: "#050810" }}>
        <SectionLabel>JSON-RPC Log</SectionLabel>
        {logs.length === 0 && (
          <div style={{ textAlign: "center", color: "#1e293b", fontSize: 12, padding: 40, fontFamily: "'IBM Plex Mono', monospace" }}>
            Click a tool to simulate a call.<br />JSON-RPC messages will appear here.
          </div>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8, padding: "10px 12px", borderRadius: 6,
              background: log.type === "request" ? "rgba(59,130,246,0.04)" : "rgba(34,197,94,0.04)",
              border: `1px solid ${log.type === "request" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)"}`,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <Badge color={log.type === "request" ? "#3b82f6" : "#22c55e"}>
                {log.type === "request" ? "→ REQ" : "← RES"}
              </Badge>
              <span style={{ fontSize: 9, color: "#334155", fontFamily: "'IBM Plex Mono', monospace" }}>{log.time}</span>
              <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>{log.method}</span>
            </div>
            <pre style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Config Tab
// ============================================
function ConfigTab({ server }: { server: MCPServer }) {
  const config = generateConfig(server);
  const packageJson = generatePackageJson(server);

  return (
    <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%", maxWidth: 800, margin: "0 auto" }}>
      <SectionLabel>claude_desktop_config.json</SectionLabel>
      <pre style={{
        padding: 16, background: "#060a14", borderRadius: 8,
        border: "1px solid rgba(34,197,94,0.1)", fontSize: 11.5, lineHeight: 1.7,
        color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24,
        whiteSpace: "pre-wrap",
      }}>
        {JSON.stringify(config, null, 2)}
      </pre>

      <SectionLabel>package.json</SectionLabel>
      <pre style={{
        padding: 16, background: "#060a14", borderRadius: 8,
        border: "1px solid rgba(245,158,11,0.1)", fontSize: 11.5, lineHeight: 1.7,
        color: "#f59e0b", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24,
        whiteSpace: "pre-wrap",
      }}>
        {JSON.stringify(packageJson, null, 2)}
      </pre>

      <SectionLabel>Server Stats</SectionLabel>
      <div style={{ display: "flex", gap: 16 }}>
        {(Object.entries(PRIMITIVE_TYPES) as [string, typeof PRIMITIVE_TYPES[string]][]).map(([type, info]) => {
          const count = server.primitives.filter((p) => p.type === type).length;
          return (
            <div
              key={type}
              style={{
                flex: 1, padding: 16, background: "#0a0f1a",
                border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{info.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: info.color, fontFamily: "'IBM Plex Mono', monospace" }}>{count}</div>
              <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>{info.label}s</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Main Builder Page
// ============================================
export default function BuilderPage() {
  const [activeTab, setActiveTab] = useState<TabName>("Builder");
  const [server, setServer] = useState<MCPServer>({
    name: "my-server",
    description: "",
    transport: "stdio",
    primitives: [],
  });

  return (
    <div
      style={{
        height: "100vh", width: "100vw", display: "flex", flexDirection: "column",
        background: "#070b14", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800,
              }}
            >
              ⚡
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", color: "#e2e8f0" }}>
                MCP Forge
              </span>
              <span style={{ fontSize: 10, color: "#475569", marginLeft: 8 }}>v1.0.0</span>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                background: activeTab === tab ? "rgba(34,197,94,0.08)" : "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #22c55e" : "2px solid transparent",
                color: activeTab === tab ? "#22c55e" : "#64748b",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", transition: "all 0.15s",
              }}
            >
              {tab === "Builder" && "🔧 "}
              {tab === "Registry" && "📦 "}
              {tab === "Playground" && "▶ "}
              {tab === "Config" && "⚙ "}
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge color="#22c55e" style={{ fontSize: 11 }}>
            {server.primitives.length} primitives
          </Badge>
          <Badge color="#f59e0b">{server.transport}</Badge>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {activeTab === "Builder" && <BuilderTab server={server} setServer={setServer} />}
        {activeTab === "Registry" && <RegistryTab />}
        {activeTab === "Playground" && <PlaygroundTab server={server} />}
        {activeTab === "Config" && <ConfigTab server={server} />}
      </div>

      {/* Status bar */}
      <div
        style={{
          height: 28, padding: "0 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: 10, color: "#334155", fontFamily: "'IBM Plex Mono', monospace",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <span>MCP Spec 2025-11-25</span>
          <span>·</span>
          <span>JSON-RPC 2.0</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span>Server: {server.name || "unnamed"}</span>
          <span>·</span>
          <span style={{ color: "#22c55e" }}>● Ready</span>
        </div>
      </div>
    </div>
  );
}
