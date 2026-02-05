"use client";

import { useState } from "react";
import type { RegistryServer } from "@/types";
import { REGISTRY_SERVERS } from "@/lib/registry";

function Badge({ children, color = "#22c55e", style = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}30`, letterSpacing: "0.04em", fontFamily: "'IBM Plex Mono', monospace", ...style }}>
      {children}
    </span>
  );
}

function TextInput({ value, onChange, placeholder, style = {} }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", background: "#0c1222", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", outline: "none", boxSizing: "border-box" as const, ...style }} />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </div>
  );
}

export default function RegistryTab() {
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
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 12px", background: filter === f ? "rgba(34,197,94,0.1)" : "transparent", border: `1px solid ${filter === f ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 6, color: filter === f ? "#22c55e" : "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>
              {f === "all" ? "All" : f === "official" ? "⚙ Official" : "👥 Community"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map((s) => (
          <div key={s.id} onClick={() => setSelectedServer(selectedServer === s.id ? null : s.id)}
            style={{ padding: 16, background: selectedServer === s.id ? "rgba(34,197,94,0.04)" : "#0a0f1a", border: `1px solid ${selectedServer === s.id ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace" }}>{s.name}</span>
                  {s.official && <Badge color="#3b82f6">Official</Badge>}
                </div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>by {s.author}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b", fontFamily: "'IBM Plex Mono', monospace" }}>
                ★ {s.stars >= 1000 ? `${(s.stars / 1000).toFixed(1)}k` : s.stars}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 10px", fontFamily: "'IBM Plex Mono', monospace" }}>{s.desc}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <Badge color="#22c55e">⚡ {s.primitives.tools} tools</Badge>
              <Badge color="#f59e0b">📄 {s.primitives.resources} resources</Badge>
              {s.primitives.prompts > 0 && <Badge color="#a78bfa">💬 {s.primitives.prompts} prompts</Badge>}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {s.tags.map((t) => (
                <span key={t} style={{ fontSize: 9, padding: "1px 6px", background: "rgba(255,255,255,0.03)", borderRadius: 3, color: "#475569", fontFamily: "'IBM Plex Mono', monospace" }}>#{t}</span>
              ))}
            </div>
            {selectedServer === s.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionLabel>Quick Install</SectionLabel>
                <div style={{ padding: "8px 12px", background: "#060a14", borderRadius: 6, fontSize: 11, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", border: "1px solid rgba(34,197,94,0.1)" }}>
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
