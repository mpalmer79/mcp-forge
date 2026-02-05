"use client";

import type { MCPServer } from "@/types";
import { generateServerCode } from "@/lib/codegen";

export default function CodePreview({ server }: { server: MCPServer }) {
  const code = generateServerCode(server);

  return (
    <pre
      style={{
        background: "#060a14",
        padding: 16,
        borderRadius: 8,
        border: "1px solid rgba(34,197,94,0.1)",
        fontSize: 10.5,
        lineHeight: 1.7,
        color: "#94a3b8",
        overflow: "auto",
        fontFamily: "'IBM Plex Mono', monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {code.split("\n").map((line, i) => {
        let color = "#94a3b8";
        if (
          line.includes("import") ||
          line.includes("from") ||
          line.includes("const") ||
          line.includes("async") ||
          line.includes("await") ||
          line.includes("return")
        )
          color = "#c084fc";
        if (line.includes("//")) color = "#334155";
        if (line.includes('"') || line.includes("'") || line.includes("`"))
          color = "#22c55e";
        if (
          line.includes("server.tool") ||
          line.includes("server.resource") ||
          line.includes("server.prompt")
        )
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
