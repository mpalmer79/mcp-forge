"use client";

import type { MCPServer } from "@/types";
import { PRIMITIVE_TYPES } from "@/lib/registry";
import { generateConfig, generatePackageJson } from "@/lib/codegen";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </div>
  );
}

export default function ConfigTab({ server }: { server: MCPServer }) {
  const config = generateConfig(server);
  const packageJson = generatePackageJson(server);

  return (
    <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%", maxWidth: 800, margin: "0 auto" }}>
      <SectionLabel>claude_desktop_config.json</SectionLabel>
      <pre style={{ padding: 16, background: "#060a14", borderRadius: 8, border: "1px solid rgba(34,197,94,0.1)", fontSize: 11.5, lineHeight: 1.7, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(config, null, 2)}
      </pre>

      <SectionLabel>package.json</SectionLabel>
      <pre style={{ padding: 16, background: "#060a14", borderRadius: 8, border: "1px solid rgba(245,158,11,0.1)", fontSize: 11.5, lineHeight: 1.7, color: "#f59e0b", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 24, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(packageJson, null, 2)}
      </pre>

      <SectionLabel>Server Stats</SectionLabel>
      <div style={{ display: "flex", gap: 16 }}>
        {(Object.entries(PRIMITIVE_TYPES) as [string, typeof PRIMITIVE_TYPES[string]][]).map(([type, info]) => {
          const count = server.primitives.filter((p) => p.type === type).length;
          return (
            <div key={type} style={{ flex: 1, padding: 16, background: "#0a0f1a", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
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
