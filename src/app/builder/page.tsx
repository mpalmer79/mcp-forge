"use client";

import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  MCPServer, MCPPrimitive, ToolParameter, PlaygroundLog,
  PrimitiveType, Toast, ParamType,
} from "@/types";
import { PRIMITIVE_TYPES, TRANSPORTS, PARAM_TYPES, REGISTRY_SERVERS, SERVER_TEMPLATES } from "@/lib/registry";
import {
  generateServerCode, generateConfig, generatePackageJson,
  generateTsConfig, exportServerAsJson, importServerFromJson,
} from "@/lib/codegen";
import {
  loadProjects, saveProject, deleteProject, loadCurrentProjectId,
  saveCurrentProjectId, autoSave, formatTimeAgo,
  type SavedProject,
} from "@/lib/storage";
import { downloadProjectZip } from "@/lib/zipgen";

/* ── Shared UI ───────────────────────── */
function Badge({ children, color = "#22c55e" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono tracking-wide"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}
function TextInput({ value, onChange, placeholder, className = "", style = {} }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; style?: React.CSSProperties;
}) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full px-3 py-2 bg-[#0c1222] border border-white/[0.08] rounded-md text-slate-200 text-[13px] font-mono outline-none focus:border-forge-500/40 transition-colors ${className}`} style={style} />;
}
function SelectInput({ value, onChange, options, style = {} }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; style?: React.CSSProperties;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={style}
      className="px-3 py-2 bg-[#0c1222] border border-white/[0.08] rounded-md text-slate-200 text-[13px] font-mono outline-none focus:border-forge-500/40 transition-colors">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] font-bold text-slate-500 tracking-[0.15em] uppercase mb-2 font-mono">{children}</div>;
}

/* ── Toast System ────────────────────── */
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className="px-4 py-2.5 rounded-lg font-mono text-xs shadow-xl border animate-fade-in flex items-center gap-2 max-w-xs cursor-pointer"
          style={{
            background: t.type === "success" ? "#0c1a12" : t.type === "error" ? "#1a0c0c" : "#0c1222",
            borderColor: t.type === "success" ? "rgba(34,197,94,0.3)" : t.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)",
            color: t.type === "success" ? "#22c55e" : t.type === "error" ? "#ef4444" : "#3b82f6",
          }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = `t_${Date.now()}`;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  const removeToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

/* ── Copy Button ─────────────────────── */
function CopyButton({ text, label = "Copy", onCopy }: { text: string; label?: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement("textarea"); el.value = text;
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); onCopy?.(); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all"
      style={{
        background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
        color: copied ? "#22c55e" : "#64748b",
        border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}

/* ── Template Modal ──────────────────── */
function TemplateModal({ isOpen, onClose, onSelect }: {
  isOpen: boolean; onClose: () => void; onSelect: (s: MCPServer) => void;
}) {
  const [filter, setFilter] = useState("all");
  if (!isOpen) return null;
  const cats = ["all", "api", "database", "utility", "ai", "automotive"];
  const filtered = filter === "all" ? SERVER_TEMPLATES : SERVER_TEMPLATES.filter((t) => t.category === filter);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c1222] border border-white/[0.08] rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-200 font-mono">🚀 Starter Templates</h2>
            <p className="text-[11px] text-slate-500 font-mono mt-1">Pick a template to jumpstart your MCP server</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg p-1">✕</button>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className="px-3 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all"
              style={{ background: filter === c ? "rgba(34,197,94,0.1)" : "transparent", border: `1px solid ${filter === c ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`, color: filter === c ? "#22c55e" : "#64748b" }}>
              {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => { onSelect(t.server); onClose(); }}
              className="text-left p-4 rounded-xl border border-white/[0.06] bg-[#0a0f1a] hover:border-forge-500/20 hover:bg-forge-500/[0.03] transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{t.icon}</span>
                <span className="text-sm font-bold text-slate-200 font-mono group-hover:text-forge-400 transition-colors">{t.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-3">{t.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge color="#22c55e">{t.server.primitives.filter((p) => p.type === "tool").length} tools</Badge>
                <Badge color="#f59e0b">{t.server.primitives.filter((p) => p.type === "resource").length} resources</Badge>
                <Badge color="#a78bfa">{t.server.primitives.filter((p) => p.type === "prompt").length} prompts</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Projects Modal (LocalStorage) ───── */
function ProjectsModal({ isOpen, onClose, onLoad, onDelete, currentId }: {
  isOpen: boolean; onClose: () => void; onLoad: (p: SavedProject) => void; onDelete: (id: string) => void; currentId: string | null;
}) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  useEffect(() => { if (isOpen) setProjects(loadProjects()); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c1222] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-200 font-mono">💾 Saved Projects</h2>
            <p className="text-[11px] text-slate-500 font-mono mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""} saved locally</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg p-1">✕</button>
        </div>
        {projects.length === 0 ? (
          <div className="py-10 text-center text-slate-600 font-mono text-sm">
            <div className="text-3xl mb-3 opacity-40">💾</div>
            No saved projects yet.<br />Use the Save button to persist your work.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border transition-all group"
                style={{ background: p.id === currentId ? "rgba(34,197,94,0.06)" : "#0a0f1a", borderColor: p.id === currentId ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)" }}>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoad(p); onClose(); }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 font-mono truncate">{p.name}</span>
                    {p.id === currentId && <Badge color="#22c55e">Active</Badge>}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">{p.primitiveCount} primitives · {formatTimeAgo(p.updatedAt)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); setProjects((prev) => prev.filter((x) => x.id !== p.id)); }}
                  className="text-slate-700 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mobile Code Drawer ──────────────── */
function MobileCodeDrawer({ isOpen, onClose, server, language, addToast }: {
  isOpen: boolean; onClose: () => void; server: MCPServer; language: "typescript" | "python"; addToast: (m: string) => void;
}) {
  const code = useMemo(() => generateServerCode(server, language), [server, language]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#070b14] lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <SectionLabel>Generated Code ({language === "typescript" ? "TS" : "Python"})</SectionLabel>
        <div className="flex gap-2">
          <CopyButton text={code} label="Copy" onCopy={() => addToast("Code copied")} />
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg px-1">✕</button>
        </div>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-[10.5px] leading-[1.7] font-mono whitespace-pre-wrap break-words">
        {code.split("\n").map((line, i) => {
          let c = "#94a3b8";
          if (/^\s*(import|from|const|let|var|async|await|return|export|def|class)\b/.test(line)) c = "#c084fc";
          if (/^\s*(\/\/|#)/.test(line)) c = "#334155";
          if (/["'`]/.test(line) && !/import|from/.test(line)) c = "#22c55e";
          if (/server\.(tool|resource|prompt)|@mcp\.(tool|resource|prompt)/.test(line)) c = "#f59e0b";
          return <div key={i} className="flex"><span className="text-slate-700 w-6 text-right mr-3 select-none text-[9px]">{i + 1}</span><span style={{ color: c }}>{line || " "}</span></div>;
        })}
      </pre>
    </div>
  );
}

/* ── Primitive Editor ────────────────── */
function PrimitiveEditor({ primitive, onUpdate, onAddParam, onUpdateParam, onRemoveParam }: {
  primitive: MCPPrimitive; onUpdate: (u: Partial<MCPPrimitive>) => void;
  onAddParam: () => void; onUpdateParam: (i: number, u: Partial<ToolParameter>) => void; onRemoveParam: (i: number) => void;
}) {
  const info = PRIMITIVE_TYPES[primitive.type];
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xl">{info.icon}</span>
        <div>
          <div className="text-[15px] font-semibold text-slate-200 font-mono">Edit {info.label}</div>
          <div className="text-[10px] text-slate-500 font-mono">{info.desc}</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div><SectionLabel>Name</SectionLabel><TextInput value={primitive.name} onChange={(v) => onUpdate({ name: v })} placeholder="get_weather" /></div>
        <div><SectionLabel>Description</SectionLabel><TextInput value={primitive.description} onChange={(v) => onUpdate({ description: v })} placeholder="What this does..." /></div>
        {primitive.type === "tool" && (
          <div>
            <div className="flex justify-between items-center">
              <SectionLabel>Parameters ({primitive.parameters?.length || 0})</SectionLabel>
              <button onClick={onAddParam} className="px-2.5 py-1 bg-forge-500/[0.08] border border-forge-500/20 rounded text-forge-500 text-[10px] font-mono font-semibold hover:bg-forge-500/15 transition-all">+ Add Param</button>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {(primitive.parameters || []).map((param, idx) => (
                <div key={idx} className="p-3 bg-[#0c1222] rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                  <div className="flex gap-2 mb-2 items-center">
                    <TextInput value={param.name} onChange={(v) => onUpdateParam(idx, { name: v })} placeholder="param_name" className="flex-1" />
                    <SelectInput value={param.type} onChange={(v) => onUpdateParam(idx, { type: v as ParamType })} options={PARAM_TYPES} style={{ width: 100 }} />
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono cursor-pointer whitespace-nowrap">
                      <input type="checkbox" checked={param.required} onChange={(e) => onUpdateParam(idx, { required: e.target.checked })} className="accent-forge-500" />req
                    </label>
                    <button onClick={() => onRemoveParam(idx)} className="text-red-500/60 hover:text-red-400 text-sm px-1">×</button>
                  </div>
                  <TextInput value={param.description} onChange={(v) => onUpdateParam(idx, { description: v })} placeholder="Parameter description" style={{ fontSize: 11 }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {primitive.type === "resource" && (<>
          <div><SectionLabel>URI Pattern</SectionLabel><TextInput value={primitive.uri || ""} onChange={(v) => onUpdate({ uri: v })} placeholder="file:///{path}" /></div>
          <div><SectionLabel>MIME Type</SectionLabel><SelectInput value={primitive.mimeType || "text/plain"} onChange={(v) => onUpdate({ mimeType: v })} options={["text/plain", "application/json", "text/html", "text/csv", "text/markdown", "image/png"]} /></div>
        </>)}
        {primitive.type === "prompt" && (
          <div><SectionLabel>Template</SectionLabel>
            <textarea value={primitive.template || ""} onChange={(e) => onUpdate({ template: e.target.value })} placeholder={"You are a helpful assistant that {{role}}..."}
              className="w-full min-h-[120px] px-3 py-2 bg-[#0c1222] border border-white/[0.08] rounded-md text-slate-200 text-[13px] font-mono outline-none resize-y focus:border-forge-500/40 transition-colors" />
            <p className="text-[9px] text-slate-600 font-mono mt-1">{"Use {{variable}} for template arguments"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Code Preview ────────────────────── */
function CodePreview({ server, language, addToast }: { server: MCPServer; language: "typescript" | "python"; addToast: (m: string) => void }) {
  const code = useMemo(() => generateServerCode(server, language), [server, language]);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Generated ({language === "typescript" ? "TS" : "Python"})</SectionLabel>
        <CopyButton text={code} label="Copy" onCopy={() => addToast("Code copied")} />
      </div>
      <pre className="flex-1 overflow-auto bg-[#060a14] p-4 rounded-lg border border-forge-500/10 text-[10.5px] leading-[1.7] font-mono whitespace-pre-wrap break-words">
        {code.split("\n").map((line, i) => {
          let c = "#94a3b8";
          if (/^\s*(import|from|const|let|var|async|await|return|export|def|class)\b/.test(line)) c = "#c084fc";
          if (/^\s*(\/\/|#)/.test(line)) c = "#334155";
          if (/["'`]/.test(line) && !/import|from/.test(line)) c = "#22c55e";
          if (/server\.(tool|resource|prompt)|@mcp\.(tool|resource|prompt)/.test(line)) c = "#f59e0b";
          return <div key={i} className="flex"><span className="text-slate-700 w-6 text-right mr-3 select-none text-[9px]">{i + 1}</span><span style={{ color: c }}>{line || " "}</span></div>;
        })}
      </pre>
    </div>
  );
}

/* ── Builder Tab ─────────────────────── */
function BuilderTab({ server, setServer, language, addToast, onShowCode }: {
  server: MCPServer; setServer: React.Dispatch<React.SetStateAction<MCPServer>>; language: "typescript" | "python";
  addToast: (m: string, t?: Toast["type"]) => void; onShowCode: () => void;
}) {
  const [selectedPrimitive, setSelectedPrimitive] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<MCPPrimitive | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const addPrimitive = useCallback((type: PrimitiveType) => {
    const id = `${type}_${Date.now()}`;
    const base: MCPPrimitive = { id, type, name: "", description: "" };
    if (type === "tool") { base.parameters = []; base.returnType = "string"; }
    else if (type === "resource") { base.uri = ""; base.mimeType = "text/plain"; }
    else { base.template = ""; base.arguments = []; }
    setServer((s) => ({ ...s, primitives: [...s.primitives, base] }));
    setSelectedPrimitive(id); setEditingTool(base); addToast(`Added new ${type}`);
  }, [setServer, addToast]);
  const updatePrimitive = useCallback((id: string, updates: Partial<MCPPrimitive>) => {
    setServer((s) => ({ ...s, primitives: s.primitives.map((p) => (p.id === id ? { ...p, ...updates } : p)) }));
    setEditingTool((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  }, [setServer]);
  const removePrimitive = useCallback((id: string) => {
    const p = server.primitives.find((x) => x.id === id);
    setServer((s) => ({ ...s, primitives: s.primitives.filter((x) => x.id !== id) }));
    if (selectedPrimitive === id) { setSelectedPrimitive(null); setEditingTool(null); }
    addToast(`Removed ${p?.name || "primitive"}`, "info");
  }, [selectedPrimitive, setServer, server.primitives, addToast]);
  const duplicatePrimitive = useCallback((id: string) => {
    const orig = server.primitives.find((p) => p.id === id); if (!orig) return;
    const np = { ...orig, id: `${orig.type}_${Date.now()}`, name: `${orig.name}_copy`, parameters: orig.parameters?.map((p) => ({ ...p })) };
    setServer((s) => ({ ...s, primitives: [...s.primitives, np] }));
    setSelectedPrimitive(np.id); setEditingTool(np); addToast(`Duplicated ${orig.name}`);
  }, [server.primitives, setServer, addToast]);
  const movePrimitive = useCallback((id: string, dir: "up" | "down") => {
    setServer((s) => {
      const idx = s.primitives.findIndex((p) => p.id === id); if (idx < 0) return s;
      const ni = dir === "up" ? idx - 1 : idx + 1; if (ni < 0 || ni >= s.primitives.length) return s;
      const arr = [...s.primitives]; [arr[idx], arr[ni]] = [arr[ni], arr[idx]]; return { ...s, primitives: arr };
    });
  }, [setServer]);
  const addParam = useCallback((tid: string) => {
    const p: ToolParameter = { name: "", type: "string", description: "", required: true };
    updatePrimitive(tid, { parameters: [...(editingTool?.parameters || []), p] });
  }, [editingTool, updatePrimitive]);
  const updateParam = useCallback((tid: string, idx: number, u: Partial<ToolParameter>) => {
    const params = [...(editingTool?.parameters || [])]; params[idx] = { ...params[idx], ...u };
    updatePrimitive(tid, { parameters: params });
  }, [editingTool, updatePrimitive]);
  const removeParam = useCallback((tid: string, idx: number) => {
    updatePrimitive(tid, { parameters: (editingTool?.parameters || []).filter((_, i) => i !== idx) });
  }, [editingTool, updatePrimitive]);

  const filteredPrimitives = useMemo(() => {
    if (!sidebarSearch) return server.primitives;
    const q = sidebarSearch.toLowerCase();
    return server.primitives.filter((p) => p.name.toLowerCase().includes(q) || p.type.includes(q) || p.description.toLowerCase().includes(q));
  }, [server.primitives, sidebarSearch]);

  return (
    <div className="flex h-full">
      {/* Left: config + primitives */}
      <div className="w-[280px] flex-shrink-0 border-r border-white/[0.04] p-4 overflow-y-auto hidden md:block">
        <SectionLabel>Server Info</SectionLabel>
        <div className="flex flex-col gap-2 mb-5">
          <TextInput value={server.name} onChange={(v) => setServer((s) => ({ ...s, name: v }))} placeholder="server-name" />
          <TextInput value={server.description} onChange={(v) => setServer((s) => ({ ...s, description: v }))} placeholder="Description..." />
          <div className="flex gap-2 items-center"><SectionLabel>Transport</SectionLabel>
            <SelectInput value={server.transport} onChange={(v) => setServer((s) => ({ ...s, transport: v as MCPServer["transport"] }))} options={TRANSPORTS} /></div>
        </div>
        <SectionLabel>Primitives ({server.primitives.length})</SectionLabel>
        {server.primitives.length > 3 && (
          <div className="mb-2">
            <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Search primitives..."
              className="w-full px-2.5 py-1.5 bg-[#0c1222] border border-white/[0.06] rounded-md text-slate-400 text-[11px] font-mono outline-none focus:border-forge-500/30 transition-colors" />
          </div>
        )}
        <div className="flex gap-1.5 mb-3">
          {(Object.entries(PRIMITIVE_TYPES) as [PrimitiveType, typeof PRIMITIVE_TYPES[string]][]).map(([type, info]) => (
            <button key={type} onClick={() => addPrimitive(type)} className="flex-1 py-1.5 px-1 rounded-md text-[10px] font-mono font-semibold transition-all hover:opacity-80"
              style={{ background: `${info.color}08`, border: `1px dashed ${info.color}40`, color: info.color }}>
              {info.icon} {info.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {filteredPrimitives.map((p) => {
            const info = PRIMITIVE_TYPES[p.type]; const isSel = selectedPrimitive === p.id;
            return (
              <div key={p.id} className="rounded-md cursor-pointer transition-all flex items-center gap-2 px-2.5 py-2 group"
                style={{ background: isSel ? `${info.color}10` : "transparent", border: `1px solid ${isSel ? `${info.color}30` : "rgba(255,255,255,0.04)"}` }}
                onClick={() => { setSelectedPrimitive(p.id); setEditingTool(p); }}>
                <span className="text-sm">{info.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200 font-medium font-mono truncate">{p.name || `untitled_${p.type}`}</div>
                  <div className="text-[9px] text-slate-600 font-mono">{info.label}{p.type === "tool" && p.parameters?.length ? ` · ${p.parameters.length} params` : ""}</div>
                </div>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); movePrimitive(p.id, "up"); }} className="text-slate-600 hover:text-slate-300 text-[10px] p-0.5" title="Move up">↑</button>
                  <button onClick={(e) => { e.stopPropagation(); movePrimitive(p.id, "down"); }} className="text-slate-600 hover:text-slate-300 text-[10px] p-0.5" title="Move down">↓</button>
                  <button onClick={(e) => { e.stopPropagation(); duplicatePrimitive(p.id); }} className="text-slate-600 hover:text-slate-300 text-[10px] p-0.5" title="Duplicate">⊕</button>
                  <button onClick={(e) => { e.stopPropagation(); removePrimitive(p.id); }} className="text-slate-600 hover:text-red-400 text-sm p-0.5" title="Remove">×</button>
                </div>
              </div>
            );
          })}
          {server.primitives.length === 0 && <div className="p-5 text-center text-slate-600 text-[11px] font-mono">Add tools, resources, or prompts<br />using the buttons above</div>}
          {sidebarSearch && filteredPrimitives.length === 0 && server.primitives.length > 0 && (
            <div className="p-4 text-center text-slate-600 text-[11px] font-mono">No matches for &quot;{sidebarSearch}&quot;</div>
          )}
        </div>
      </div>
      {/* Center: editor */}
      <div className="flex-1 p-4 md:p-5 overflow-y-auto min-w-0">
        {/* Mobile code button */}
        <div className="lg:hidden mb-3">
          <button onClick={onShowCode} className="w-full py-2 bg-forge-500/[0.08] border border-forge-500/20 rounded-md text-forge-400 text-[11px] font-mono font-semibold">
            &lt;/&gt; View Generated Code
          </button>
        </div>
      <div className="flex-1 p-4 md:p-5 overflow-y-auto min-w-0">
        {editingTool ? (
          <PrimitiveEditor primitive={editingTool} onUpdate={(u) => updatePrimitive(editingTool.id, u)}
            onAddParam={() => addParam(editingTool.id)} onUpdateParam={(i, u) => updateParam(editingTool.id, i, u)} onRemoveParam={(i) => removeParam(editingTool.id, i)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <div className="text-4xl mb-3 opacity-40">🔧</div>
            <div className="text-sm font-mono">Select a primitive to edit</div>
            <div className="text-[11px] font-mono mt-1 text-slate-700">or add a new tool, resource, or prompt</div>
          </div>
        )}
      </div>
      {/* Right: code preview */}
      <div className="w-[340px] flex-shrink-0 border-l border-white/[0.04] p-4 overflow-hidden hidden lg:flex flex-col">
        <CodePreview server={server} language={language} addToast={addToast} />
      </div>
    </div>
  );
}

/* ── Registry Tab ────────────────────── */
function RegistryTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "official" | "community">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = REGISTRY_SERVERS.filter((s) => {
    if (filter === "official" && !s.official) return false;
    if (filter === "community" && s.official) return false;
    if (search) { const q = search.toLowerCase(); return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)); }
    return true;
  });
  return (
    <div className="p-5 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <TextInput value={search} onChange={setSearch} placeholder="Search servers..." className="flex-1" />
        <div className="flex gap-1.5">
          {(["all", "official", "community"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-2 rounded-md text-xs font-mono font-medium transition-all"
              style={{ background: filter === f ? "rgba(34,197,94,0.1)" : "transparent", border: `1px solid ${filter === f ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`, color: filter === f ? "#22c55e" : "#64748b" }}>
              {f === "all" ? "All" : f === "official" ? "⚙ Official" : "👥 Community"}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-slate-600 font-mono mb-3">{filtered.length} server{filtered.length !== 1 ? "s" : ""}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s) => (
          <div key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)} className="p-4 rounded-xl cursor-pointer transition-all"
            style={{ background: selected === s.id ? "rgba(34,197,94,0.04)" : "#0a0f1a", border: `1px solid ${selected === s.id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)"}` }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-200 font-mono">{s.name}</span>{s.official && <Badge color="#3b82f6">Official</Badge>}</div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">by {s.author}</div>
              </div>
              <div className="text-[11px] text-amber-500 font-mono">★ {s.stars >= 1000 ? `${(s.stars / 1000).toFixed(1)}k` : s.stars}</div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed mb-2.5">{s.desc}</p>
            <div className="flex gap-1.5 flex-wrap mb-2">
              <Badge color="#22c55e">⚡ {s.primitives.tools}</Badge><Badge color="#f59e0b">📄 {s.primitives.resources}</Badge>
              {s.primitives.prompts > 0 && <Badge color="#a78bfa">💬 {s.primitives.prompts}</Badge>}
            </div>
            <div className="flex gap-1 flex-wrap">
              {s.tags.map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/[0.03] rounded text-slate-600 font-mono">#{t}</span>)}
            </div>
            {selected === s.id && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <SectionLabel>Quick Install</SectionLabel>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[#060a14] rounded-md text-[11px] text-forge-400 font-mono border border-forge-500/10 overflow-x-auto">
                    {s.transport === "stdio" ? `npx -y @modelcontextprotocol/${s.id}` : `claude mcp add --transport ${s.transport} ${s.id} https://mcp.${s.id}.com`}
                  </div>
                  <CopyButton text={s.transport === "stdio" ? `npx -y @modelcontextprotocol/${s.id}` : `claude mcp add --transport ${s.transport} ${s.id} https://mcp.${s.id}.com`} label="Copy" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Playground Tab ──────────────────── */
function PlaygroundTab({ server, addToast }: { server: MCPServer; addToast: (m: string, t?: Toast["type"]) => void }) {
  const [logs, setLogs] = useState<PlaygroundLog[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const allPrims = server.primitives;
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  const simulateCall = useCallback((p: MCPPrimitive) => {
    setRunning(true);
    const method = p.type === "tool" ? "tools/call" : p.type === "resource" ? "resources/read" : "prompts/get";
    let req: Record<string, unknown> = {};
    if (p.type === "tool") req = { name: p.name || "unnamed", arguments: Object.fromEntries((p.parameters || []).map((x) => [x.name || "p", x.type === "number" ? 42 : x.type === "boolean" ? true : "example"])) };
    else if (p.type === "resource") req = { uri: p.uri || "file:///path" };
    else req = { name: p.name || "unnamed" };
    setLogs((l) => [...l, { type: "request", time: new Date().toISOString().slice(11, 23), method, data: req }]);
    setTimeout(() => {
      let res: Record<string, unknown> = {};
      if (p.type === "tool") res = { content: [{ type: "text", text: `Result from ${p.name || "tool"}: OK` }], isError: false };
      else if (p.type === "resource") res = { contents: [{ uri: p.uri, mimeType: p.mimeType || "text/plain", text: "Sample content" }] };
      else res = { messages: [{ role: "user", content: { type: "text", text: p.template || "prompt" } }] };
      setLogs((l) => [...l, { type: "response", time: new Date().toISOString().slice(11, 23), method, data: res }]);
      setRunning(false);
    }, 500 + Math.random() * 500);
  }, []);
  const simulateList = useCallback(() => {
    setRunning(true);
    setLogs((l) => [...l, { type: "request", time: new Date().toISOString().slice(11, 23), method: "server/capabilities", data: {} }]);
    setTimeout(() => {
      setLogs((l) => [...l, { type: "response", time: new Date().toISOString().slice(11, 23), method: "server/capabilities", data: {
        tools: server.primitives.filter((p) => p.type === "tool").map((t) => ({ name: t.name })),
        resources: server.primitives.filter((p) => p.type === "resource").map((r) => ({ name: r.name, uri: r.uri })),
        prompts: server.primitives.filter((p) => p.type === "prompt").map((p) => ({ name: p.name })),
      } }]);
      setRunning(false);
    }, 300);
  }, [server.primitives]);

  return (
    <div className="flex h-full">
      <div className="w-[260px] flex-shrink-0 border-r border-white/[0.04] p-4 overflow-y-auto hidden md:block">
        <SectionLabel>Primitives ({allPrims.length})</SectionLabel>
        <button onClick={simulateList} disabled={running} className="w-full py-2 mb-3 bg-purple-500/[0.08] border border-purple-500/20 rounded-md text-purple-400 text-[11px] font-mono font-semibold disabled:opacity-40">↻ Capabilities</button>
        {allPrims.map((p) => {
          const info = PRIMITIVE_TYPES[p.type];
          return (
            <button key={p.id} onClick={() => simulateCall(p)} disabled={running}
              className="w-full text-left p-2.5 bg-[#0c1222] border border-white/[0.04] rounded-md mb-1.5 disabled:opacity-40 hover:border-white/[0.1] transition-all">
              <div className="text-xs font-mono font-semibold text-slate-200">{info.icon} {p.name || "unnamed"}</div>
              <div className="text-[9px] text-slate-600 font-mono mt-0.5">{info.label}</div>
            </button>
          );
        })}
        {allPrims.length === 0 && <div className="text-center text-slate-600 text-[11px] font-mono p-5">No primitives yet.<br />Add some in Builder.</div>}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <SectionLabel>JSON-RPC Log ({logs.length})</SectionLabel>
          {logs.length > 0 && <button onClick={() => { setLogs([]); addToast("Logs cleared", "info"); }} className="text-[10px] text-slate-600 hover:text-slate-300 font-mono">Clear</button>}
        </div>
        <div ref={logRef} className="flex-1 overflow-y-auto px-4 pb-4 bg-[#050810]">
          {logs.length === 0 && <div className="text-center text-slate-700 text-[12px] font-mono p-10">Click a primitive to simulate a call.</div>}
          {logs.map((log, i) => (
            <div key={i} className="mb-2 p-3 rounded-md"
              style={{ background: log.type === "request" ? "rgba(59,130,246,0.04)" : "rgba(34,197,94,0.04)", border: `1px solid ${log.type === "request" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)"}` }}>
              <div className="flex gap-2 items-center mb-1.5">
                <Badge color={log.type === "request" ? "#3b82f6" : "#22c55e"}>{log.type === "request" ? "→ REQ" : "← RES"}</Badge>
                <span className="text-[9px] text-slate-600 font-mono">{log.time}</span>
                <span className="text-[10px] text-slate-500 font-mono">{log.method}</span>
              </div>
              <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-words">{JSON.stringify(log.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Config Tab ──────────────────────── */
function ConfigTab({ server, language, addToast }: { server: MCPServer; language: "typescript" | "python"; addToast: (m: string, t?: Toast["type"]) => void }) {
  const config = useMemo(() => JSON.stringify(generateConfig(server), null, 2), [server]);
  const pkg = useMemo(() => JSON.stringify(generatePackageJson(server), null, 2), [server]);
  const tsConf = useMemo(() => JSON.stringify(generateTsConfig(), null, 2), []);
  const exportJson = useMemo(() => exportServerAsJson(server), [server]);
  return (
    <div className="p-5 overflow-y-auto h-full max-w-3xl mx-auto">
      {/* Download ZIP */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 p-4 bg-gradient-to-r from-forge-500/[0.06] to-transparent rounded-xl border border-forge-500/15">
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-200 font-mono mb-1">📦 Download Project</div>
          <p className="text-[10px] text-slate-500 font-mono">Get a complete, ready-to-run project with src, configs, README, and .gitignore</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { downloadProjectZip(server, "typescript"); addToast("Downloaded TypeScript project"); }}
            className="px-3 py-1.5 bg-forge-500/[0.12] border border-forge-500/25 rounded-md text-forge-400 text-[10px] font-mono font-semibold hover:bg-forge-500/20 transition-all">
            ↓ TypeScript .zip
          </button>
          <button onClick={() => { downloadProjectZip(server, "python"); addToast("Downloaded Python project"); }}
            className="px-3 py-1.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-md text-amber-400 text-[10px] font-mono font-semibold hover:bg-amber-500/15 transition-all">
            ↓ Python .zip
          </button>
        </div>
      </div>

      {/* Export/Import */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 p-4 bg-[#0c1222] rounded-xl border border-white/[0.06]">
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-200 font-mono mb-1">📤 Export / Import</div>
          <p className="text-[10px] text-slate-500 font-mono">Save your server config as JSON or download the full project</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={exportJson} label="Copy JSON" onCopy={() => addToast("Config copied")} />
          <button onClick={() => {
            const blob = new Blob([exportJson], { type: "application/json" }); const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `${server.name || "mcp-server"}.forge.json`; a.click(); URL.revokeObjectURL(url);
            addToast("Downloaded config");
          }} className="px-2.5 py-1 bg-forge-500/[0.08] border border-forge-500/20 rounded-md text-forge-400 text-[10px] font-mono font-semibold hover:bg-forge-500/15 transition-all">
            ↓ Download
          </button>
        </div>
      </div>
      {[{ label: "claude_desktop_config.json", code: config, color: "#22c55e" }, { label: "package.json", code: pkg, color: "#f59e0b" }, { label: "tsconfig.json", code: tsConf, color: "#3b82f6" }].map((f) => (
        <div key={f.label} className="mb-5">
          <div className="flex items-center justify-between mb-2"><SectionLabel>{f.label}</SectionLabel><CopyButton text={f.code} label="Copy" onCopy={() => addToast(`Copied ${f.label}`)} /></div>
          <pre className="p-4 rounded-lg text-[11.5px] leading-[1.7] font-mono whitespace-pre-wrap" style={{ background: "#060a14", border: `1px solid ${f.color}15`, color: f.color }}>{f.code}</pre>
        </div>
      ))}
      <SectionLabel>Server Stats</SectionLabel>
      <div className="flex gap-4">
        {(Object.entries(PRIMITIVE_TYPES) as [string, typeof PRIMITIVE_TYPES[string]][]).map(([type, info]) => {
          const count = server.primitives.filter((p) => p.type === type).length;
          return <div key={type} className="flex-1 p-4 bg-[#0a0f1a] border border-white/[0.04] rounded-lg text-center">
            <div className="text-2xl mb-1">{info.icon}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: info.color }}>{count}</div>
            <div className="text-[10px] text-slate-500 font-mono">{info.label}s</div>
          </div>;
        })}
      </div>
    </div>
  );
}

/* ── Main Page (with Suspense for useSearchParams) ── */
const TABS = ["Builder", "Registry", "Playground", "Config"] as const;
type TabName = (typeof TABS)[number];

function BuilderPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabName) || "Builder";
  const showTemplates = searchParams.get("template") === "true";
  const [activeTab, setActiveTab] = useState<TabName>(initialTab);
  const [server, setServer] = useState<MCPServer>({ name: "my-server", description: "", transport: "stdio", primitives: [], version: "1.0.0" });
  const [language, setLanguage] = useState<"typescript" | "python">("typescript");
  const [templateModalOpen, setTemplateModalOpen] = useState(showTemplates);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [mobileCodeOpen, setMobileCodeOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const { toasts, addToast, removeToast } = useToasts();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved project on mount
  useEffect(() => {
    const savedId = loadCurrentProjectId();
    if (savedId) {
      const projects = loadProjects();
      const found = projects.find((p) => p.id === savedId);
      if (found) { setServer(found.server); setCurrentProjectId(found.id); }
    }
  }, []);

  // Auto-save (2s debounce)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const id = autoSave(server, currentProjectId);
      if (id && !currentProjectId) setCurrentProjectId(id);
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [server, currentProjectId]);

  const handleSave = useCallback(() => {
    const saved = saveProject(server, currentProjectId || undefined);
    setCurrentProjectId(saved.id); saveCurrentProjectId(saved.id);
    addToast(`Saved "${saved.name}"`);
  }, [server, currentProjectId, addToast]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = importServerFromJson(ev.target?.result as string);
        if (result) { setServer(result); setCurrentProjectId(null); saveCurrentProjectId(null); addToast(`Imported "${result.name}"`); } else { addToast("Invalid config file", "error"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [addToast]);

  const handleTemplateSelect = useCallback((ts: MCPServer) => {
    setServer({ ...ts, primitives: ts.primitives.map((p) => ({ ...p, id: `${p.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })) });
    setCurrentProjectId(null); saveCurrentProjectId(null);
    addToast(`Loaded: ${ts.name}`);
  }, [addToast]);

  const handleLoadProject = useCallback((p: SavedProject) => {
    setServer(p.server); setCurrentProjectId(p.id); saveCurrentProjectId(p.id);
    addToast(`Loaded "${p.name}"`);
  }, [addToast]);

  const handleDeleteProject = useCallback((id: string) => {
    deleteProject(id);
    if (currentProjectId === id) { setCurrentProjectId(null); saveCurrentProjectId(null); }
    addToast("Project deleted", "info");
  }, [currentProjectId, addToast]);

  const handleNewProject = useCallback(() => {
    setServer({ name: "my-server", description: "", transport: "stdio", primitives: [], version: "1.0.0" });
    setCurrentProjectId(null); saveCurrentProjectId(null);
    addToast("New project started", "info");
  }, [addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "4") { e.preventDefault(); setActiveTab(TABS[parseInt(e.key) - 1]); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [handleSave]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b14] text-slate-200 font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 h-[52px] border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-forge-400 to-forge-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-forge-500/20">⚡</div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-slate-200">MCP Forge</span>
              <span className="text-[9px] text-slate-600">v2.1</span>
            </div>
          </Link>
        </div>
        {/* Tabs */}
        <div className="flex gap-0.5">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)} title={`${tab} (⌘${i + 1})`}
              className="px-2.5 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold transition-all border-b-2"
              style={{ background: activeTab === tab ? "rgba(34,197,94,0.08)" : "transparent", borderColor: activeTab === tab ? "#22c55e" : "transparent", color: activeTab === tab ? "#22c55e" : "#64748b" }}>
              {tab === "Builder" && "🔧 "}{tab === "Registry" && "📦 "}{tab === "Playground" && "▶ "}{tab === "Config" && "⚙ "}
              <span className="hidden sm:inline">{tab}</span>
            </button>
          ))}
        </div>
        {/* Right actions */}
        <div className="flex gap-2 items-center">
          {activeTab === "Builder" && (<>
            <button onClick={handleNewProject} className="hidden sm:inline-flex px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md text-slate-500 text-[10px] font-mono font-semibold hover:text-slate-300 transition-all" title="New project">✦ New</button>
            <button onClick={() => setProjectsModalOpen(true)} className="hidden sm:inline-flex px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md text-slate-500 text-[10px] font-mono font-semibold hover:text-slate-300 transition-all" title="Saved projects">💾 Projects</button>
            <button onClick={handleSave} className="hidden sm:inline-flex px-2 py-1.5 bg-forge-500/[0.08] border border-forge-500/20 rounded-md text-forge-400 text-[10px] font-mono font-semibold hover:bg-forge-500/15 transition-all" title="Save (⌘S)">↓ Save</button>
            <button onClick={() => setTemplateModalOpen(true)} className="hidden md:inline-flex px-2 py-1.5 bg-forge-500/[0.08] border border-forge-500/20 rounded-md text-forge-400 text-[10px] font-mono font-semibold hover:bg-forge-500/15 transition-all">🚀 Templates</button>
            <button onClick={handleImport} className="hidden md:inline-flex px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md text-slate-500 text-[10px] font-mono font-semibold hover:text-slate-300 transition-all">↑ Import</button>
          </>)}
          {/* Language toggle */}
          <div className="flex rounded-md border border-white/[0.08] overflow-hidden">
            {(["typescript", "python"] as const).map((l) => (
              <button key={l} onClick={() => setLanguage(l)}
                className="px-2 py-1 text-[9px] font-mono font-semibold transition-all"
                style={{ background: language === l ? "rgba(34,197,94,0.1)" : "transparent", color: language === l ? "#22c55e" : "#475569" }}>
                {l === "typescript" ? "TS" : "PY"}
              </button>
            ))}
          </div>
          <Badge color="#22c55e">{server.primitives.length} prim</Badge>
          <Badge color="#f59e0b">{server.transport}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "Builder" && <BuilderTab server={server} setServer={setServer} language={language} addToast={addToast} onShowCode={() => setMobileCodeOpen(true)} />}
        {activeTab === "Registry" && <RegistryTab />}
        {activeTab === "Playground" && <PlaygroundTab server={server} addToast={addToast} />}
        {activeTab === "Config" && <ConfigTab server={server} language={language} addToast={addToast} />}
      </div>

      {/* Status bar */}
      <div className="h-7 px-4 flex items-center justify-between border-t border-white/[0.04] text-[10px] text-slate-600 font-mono flex-shrink-0">
        <div className="flex gap-3"><span>MCP 2025-11-25</span><span>·</span><span>JSON-RPC 2.0</span>{currentProjectId && <><span>·</span><span className="text-forge-500/60">💾 Auto-saved</span></>}</div>
        <div className="flex gap-3"><span>{server.name || "unnamed"}</span><span>·</span><span>{language === "typescript" ? "TypeScript" : "Python"}</span><span>·</span><span className="text-forge-500">● Ready</span></div>
      </div>

      {/* Modals & Toasts */}
      <TemplateModal isOpen={templateModalOpen} onClose={() => setTemplateModalOpen(false)} onSelect={handleTemplateSelect} />
      <ProjectsModal isOpen={projectsModalOpen} onClose={() => setProjectsModalOpen(false)} onLoad={handleLoadProject} onDelete={handleDeleteProject} currentId={currentProjectId} />
      <MobileCodeDrawer isOpen={mobileCodeOpen} onClose={() => setMobileCodeOpen(false)} server={server} language={language} addToast={addToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function BuilderPage() {
  return <Suspense fallback={<div className="h-screen w-screen bg-[#070b14] flex items-center justify-center text-slate-600 font-mono text-sm">Loading builder...</div>}><BuilderPageInner /></Suspense>;
}
