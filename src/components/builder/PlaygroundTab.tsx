"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { MCPServer, MCPPrimitive, PlaygroundLog } from "@/types";

function Badge({ children, color = "#22c55e", style = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}30`, letterSpacing: "0.04em", fontFamily: "'IBM Plex Mono', monospace", ...style }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </div>
  );
}

export default function PlaygroundTab({ server }: { server: MCPServer }) {
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
        <button onClick={simulateList} disabled={running}
          style={{ width: "100%", padding: 8, background: "rgba(168,139,250,0.08)", border: "1px solid rgba(168,139,250,0.2)", borderRadius: 6, color: "#a78bfa", fontSize: 11, cursor: "pointer", marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
          ↻ List All Tools
        </button>
        {tools.map((t) => (
          <button key={t.id} onClick={() => simulateCall(t)} disabled={running}
            style={{ width: "100%", padding: 10, background: "#0c1222", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, color: "#e2e8f0", fontSize: 12, cursor: "pointer", marginBottom: 6, textAlign: "left" as const, fontFamily: "'IBM Plex Mono', monospace", opacity: running ? 0.5 : 1, transition: "all 0.15s" }}>
            <div style={{ fontWeight: 600 }}>⚡ {t.name || "unnamed"}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{(t.parameters || []).length} params</div>
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
          <div key={i} style={{ marginBottom: 8, padding: "10px 12px", borderRadius: 6, background: log.type === "request" ? "rgba(59,130,246,0.04)" : "rgba(34,197,94,0.04)", border: `1px solid ${log.type === "request" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)"}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <Badge color={log.type === "request" ? "#3b82f6" : "#22c55e"}>{log.type === "request" ? "→ REQ" : "← RES"}</Badge>
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
