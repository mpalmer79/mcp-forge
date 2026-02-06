import type { MCPServer, MCPPrimitive } from "@/types";

function zodType(type: string): string {
  switch (type) {
    case "number": return "z.number()";
    case "boolean": return "z.boolean()";
    case "array": return "z.array(z.string())";
    case "object": return "z.object({})";
    default: return "z.string()";
  }
}

function pythonType(type: string): string {
  switch (type) {
    case "number": return "float";
    case "boolean": return "bool";
    case "array": return "list[str]";
    case "object": return "dict";
    default: return "str";
  }
}

export function generateServerCode(server: MCPServer, language: "typescript" | "python" = "typescript"): string {
  if (language === "python") return generatePythonCode(server);
  return generateTypeScriptCode(server);
}

function generateTypeScriptCode(server: MCPServer): string {
  const tools = server.primitives.filter((p) => p.type === "tool");
  const resources = server.primitives.filter((p) => p.type === "resource");
  const prompts = server.primitives.filter((p) => p.type === "prompt");

  let code = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${server.name || "my-server"}",
  version: "${server.version || "1.0.0"}",
});
`;

  for (const t of tools) {
    const params = (t.parameters || []).map((p) => {
      const opt = p.required ? "" : ".optional()";
      return `    ${p.name || "param"}: ${zodType(p.type)}${opt}.describe("${p.description || ""}")`;
    });
    const paramNames = (t.parameters || []).map((p) => p.name || "param").join(", ");

    code += `
server.tool(
  "${t.name || "unnamed_tool"}",
  "${t.description || ""}",
  {
${params.join(",\n")}
  },
  async ({ ${paramNames} }) => {
    // TODO: implement ${t.name || "tool"} logic
    return { content: [{ type: "text", text: JSON.stringify({ ${paramNames} }) }] };
  }
);
`;
  }

  for (const r of resources) {
    code += `
server.resource(
  "${r.name || "unnamed_resource"}",
  "${r.uri || "file:///path"}",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "${r.mimeType || "text/plain"}",
      text: "resource content"
    }]
  })
);
`;
  }

  for (const p of prompts) {
    const args = (p.arguments || []);
    if (args.length > 0) {
      const argDefs = args.map((a) =>
        `    ${a.name}: z.string().describe("${a.description || ""}")`
      ).join(",\n");

      code += `
server.prompt(
  "${p.name || "unnamed_prompt"}",
  "${p.description || ""}",
  {
${argDefs}
  },
  ({ ${args.map(a => a.name).join(", ")} }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: \`${p.template || "prompt template"}\` }
    }]
  })
);
`;
    } else {
      code += `
server.prompt(
  "${p.name || "unnamed_prompt"}",
  "${p.description || ""}",
  () => ({
    messages: [{
      role: "user",
      content: { type: "text", text: \`${p.template || "prompt template"}\` }
    }]
  })
);
`;
    }
  }

  code += `
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("${server.name || "my-server"} running on stdio");
`;

  return code;
}

function generatePythonCode(server: MCPServer): string {
  const tools = server.primitives.filter((p) => p.type === "tool");
  const resources = server.primitives.filter((p) => p.type === "resource");
  const prompts = server.primitives.filter((p) => p.type === "prompt");

  let code = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("${server.name || "my-server"}")
`;

  for (const t of tools) {
    const params = (t.parameters || []).map((p) => {
      return `    ${p.name || "param"}: ${pythonType(p.type)}`;
    });
    const docParams = (t.parameters || []).map((p) => {
      return `        ${p.name}: ${p.description || "Parameter description"}`;
    });

    code += `

@mcp.tool()
def ${t.name || "unnamed_tool"}(
${params.join(",\n")}
) -> str:
    """${t.description || "Tool description"}

    Args:
${docParams.join("\n")}
    """
    # TODO: implement
    return f"Result: {${(t.parameters || [])[0]?.name || "'ok'"}}"
`;
  }

  for (const r of resources) {
    code += `

@mcp.resource("${r.uri || "file:///path"}")
def ${r.name || "unnamed_resource"}() -> str:
    """${r.description || "Resource description"}"""
    return "resource content"
`;
  }

  for (const p of prompts) {
    code += `

@mcp.prompt()
def ${p.name || "unnamed_prompt"}() -> str:
    """${p.description || "Prompt description"}"""
    return "${p.template || "prompt template"}"
`;
  }

  code += `

if __name__ == "__main__":
    mcp.run()
`;

  return code;
}

export function generateConfig(server: MCPServer): object {
  const base: Record<string, unknown> = {
    command: "npx",
    args: ["-y", `@mcpforge/${server.name || "my-server"}`],
  };

  if (server.transport === "http") {
    base.url = `https://mcp.example.com/${server.name || "my-server"}`;
    delete base.command;
    delete base.args;
  }

  if (server.auth && server.auth.type !== "none") {
    base.env = {
      [server.auth.envVar || "API_KEY"]: "your-key-here",
    };
  }

  return {
    mcpServers: {
      [server.name || "my-server"]: base,
    },
  };
}

export function generatePackageJson(server: MCPServer): object {
  return {
    name: `@mcpforge/${server.name || "my-server"}`,
    version: server.version || "1.0.0",
    description: server.description || "MCP Server built with MCP Forge",
    main: "dist/index.js",
    type: "module",
    bin: { [server.name || "my-server"]: "dist/index.js" },
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsx src/index.ts",
      inspect: "npx @modelcontextprotocol/inspector tsx src/index.ts",
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.12.0",
      zod: "^3.23.0",
    },
    devDependencies: {
      typescript: "^5.7.0",
      tsx: "^4.19.0",
      "@types/node": "^22.0.0",
    },
  };
}

export function generateTsConfig(): object {
  return {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "Node16",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };
}

export function exportServerAsJson(server: MCPServer): string {
  return JSON.stringify({
    _mcpForgeVersion: "2.0.0",
    _exportedAt: new Date().toISOString(),
    server,
  }, null, 2);
}

export function importServerFromJson(json: string): MCPServer | null {
  try {
    const data = JSON.parse(json);
    if (data.server && data.server.name && data.server.primitives) {
      return data.server as MCPServer;
    }
    if (data.name && data.primitives) {
      return data as MCPServer;
    }
    return null;
  } catch {
    return null;
  }
}
