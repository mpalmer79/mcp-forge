import { MCPServer, MCPPrimitive } from "@/types";

// map our param types to Zod schema calls
function zodType(type: string): string {
  switch (type) {
    case "number": return "z.number()";
    case "boolean": return "z.boolean()";
    case "array": return "z.array(z.string())";
    case "object": return "z.object({})";
    default: return "z.string()";
  }
}

export function generateServerCode(server: MCPServer): string {
  const tools = server.primitives.filter((p) => p.type === "tool");
  const resources = server.primitives.filter((p) => p.type === "resource");
  const prompts = server.primitives.filter((p) => p.type === "prompt");

  let code = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "${server.name || "my-server"}",
  version: "1.0.0",
});
`;

  for (const t of tools) {
    const params = (t.parameters || []).map((p) => {
      return `    ${p.name || "param"}: { type: ${zodType(p.type)}, description: "${p.description || ""}" }`;
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
    // TODO: implement
    return { content: [{ type: "text", text: "result" }] };
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

  code += `
const transport = new StdioServerTransport();
await server.connect(transport);
`;

  return code;
}

export function generateConfig(server: MCPServer): object {
  return {
    mcpServers: {
      [server.name || "my-server"]: {
        command: "npx",
        args: ["-y", `@mcpforge/${server.name || "my-server"}`],
        ...(server.transport === "http"
          ? { url: `https://mcp.example.com/${server.name || "my-server"}` }
          : {}),
      },
    },
  };
}

export function generatePackageJson(server: MCPServer): object {
  return {
    name: `@mcpforge/${server.name || "my-server"}`,
    version: "1.0.0",
    description: server.description || "MCP Server built with MCP Forge",
    main: "dist/index.js",
    type: "module",
    bin: { [server.name || "my-server"]: "dist/index.js" },
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsx src/index.ts",
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.2.0",
      zod: "^3.22.0",
    },
    devDependencies: {
      typescript: "^5.3.0",
      tsx: "^4.7.0",
      "@types/node": "^20.0.0",
    },
  };
}
