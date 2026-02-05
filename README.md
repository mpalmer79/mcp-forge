# ⚡ MCP Forge

**Visual MCP Server Builder & Registry**

Build, test, and ship Model Context Protocol servers without writing boilerplate. MCP Forge provides a visual interface for creating MCP servers with tools, resources, and prompts — generating production-ready TypeScript code that follows the official MCP SDK patterns.

[![Live Demo](https://img.shields.io/badge/demo-live-22c55e?style=for-the-badge&logo=vercel)](https://mcp-forge.vercel.app)
[![MCP Spec](https://img.shields.io/badge/MCP-2025--11--25-f59e0b?style=for-the-badge)](https://modelcontextprotocol.io/specification/2025-11-25)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000?style=for-the-badge&logo=next.js)](https://nextjs.org)

---

## What is MCP?

The **Model Context Protocol** is an open standard created by Anthropic that enables AI applications (like Claude Desktop, Cursor, VS Code Copilot) to connect to external data sources and tools through a unified interface. Think of it as **USB-C for AI integrations** — one protocol to connect any tool to any AI client.

MCP servers expose three primitives:
- **Tools** — Functions the LLM can call (e.g., `get_weather`, `query_database`)
- **Resources** — Data the application can read (e.g., file contents, API responses)
- **Prompts** — Pre-written templates for common tasks

MCP Forge makes building these servers visual and fast.

---

## Features

### 🔧 Visual Server Builder
Design MCP servers by clicking — not coding. Add tools with typed parameters, resources with URI patterns, and prompt templates. The three-panel layout shows your primitive list, property editor, and live code output simultaneously.

### 📦 Server Registry
Browse and search existing MCP servers from the Anthropic ecosystem and community. Filter by official/community, search by tags, and get instant install commands for any server.

### ▶️ Testing Playground
Simulate JSON-RPC calls against your server definition. See formatted request/response logs, test `tools/list` and `tools/call` methods, and verify your server behavior before deployment.

### ⚙️ Config Generator
Auto-generates your `claude_desktop_config.json`, `package.json`, and complete TypeScript server code. Copy and deploy — everything follows the official `@modelcontextprotocol/sdk` patterns.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 + CSS Variables |
| State | React hooks (useState, useCallback, useRef) |
| Code Gen | AST-based TypeScript generation |
| Font | IBM Plex Mono |
| Deploy | Vercel / Netlify / GitHub Pages |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/mcp-forge.git
cd mcp-forge

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
mcp-forge/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── builder/
│   │   │   └── page.tsx          # Main builder application
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.tsx          # Landing hero section
│   │   │   ├── Features.tsx      # Feature showcase
│   │   │   └── CTA.tsx           # Call-to-action
│   │   ├── builder/
│   │   │   ├── BuilderTab.tsx    # Server builder interface
│   │   │   ├── RegistryTab.tsx   # Server registry/marketplace
│   │   │   ├── PlaygroundTab.tsx # JSON-RPC testing
│   │   │   ├── ConfigTab.tsx     # Config file generator
│   │   │   ├── CodePreview.tsx   # Live TypeScript output
│   │   │   └── PrimitiveEditor.tsx # Tool/Resource/Prompt editor
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── TextInput.tsx
│   │       └── SelectInput.tsx
│   ├── lib/
│   │   ├── codegen.ts            # TypeScript code generation
│   │   ├── registry.ts           # Server registry data
│   │   └── types.ts              # MCP primitive types
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── public/
│   └── og-image.png              # Social preview image
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## How It Works

### 1. Define Your Server
Name your server, choose a transport type (stdio, HTTP, or SSE), and start adding primitives.

### 2. Add Primitives
Click to add tools, resources, or prompts. Each gets a full property editor:
- **Tools**: Name, description, typed parameters (string/number/boolean/array/object), required flags
- **Resources**: URI patterns, MIME types
- **Prompts**: Template strings with variable interpolation

### 3. Preview Code
The right panel generates valid TypeScript in real-time using `@modelcontextprotocol/sdk`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

server.tool(
  "get_inventory",
  "Fetch current vehicle inventory",
  {
    make: { type: z.string(), description: "Vehicle make" },
    year: { type: z.number(), description: "Model year" },
  },
  async ({ make, year }) => {
    // TODO: implement
    return { content: [{ type: "text", text: "result" }] };
  }
);
```

### 4. Test & Deploy
Use the Playground to simulate JSON-RPC calls, then grab your generated `claude_desktop_config.json` and deploy.

---

## MCP Specification Compliance

MCP Forge generates code targeting the **2025-11-25 MCP specification**, including:

- ✅ JSON-RPC 2.0 message format
- ✅ `tools/list` and `tools/call` methods
- ✅ `resources/read` with URI patterns
- ✅ `prompts/get` with argument schemas
- ✅ Zod-based parameter validation
- ✅ Stdio and HTTP transport support
- ✅ Proper error handling patterns

---

## Roadmap

- [ ] **Import from OpenAPI** — Auto-generate MCP servers from OpenAPI/Swagger specs
- [ ] **Python code generation** — Output Python SDK code alongside TypeScript
- [ ] **MCP Inspector integration** — Connect directly to the official MCP Inspector for live testing
- [ ] **One-click publish** — Push to npm registry with proper package configuration
- [ ] **Server templates** — Pre-built starter templates for common integrations (database, API wrapper, file system)
- [ ] **Auth configuration** — OAuth 2.0 Resource Server setup per June 2025 spec update

---

## Why MCP Forge?

The MCP ecosystem is growing fast — adopted by OpenAI, Google DeepMind, Microsoft, and thousands of developers. But building MCP servers still requires manually writing boilerplate code, understanding the JSON-RPC protocol, and configuring transport layers.

MCP Forge bridges the gap between **understanding what MCP can do** and **shipping a working server**. It's the tool I wished existed when I started building MCP integrations for production automotive AI systems.

---

## Related Projects

- [AgentForge](https://github.com/YOUR_USERNAME/agent-forge) — TypeScript framework for AI agents
- [FlowForge](https://github.com/YOUR_USERNAME/flowforge) — Visual AI workflow builder
- [QUIRK AI Kiosk](https://github.com/YOUR_USERNAME/quirk-ai-kiosk) — Full-stack showroom AI assistant

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ⚡ by <a href="https://github.com/YOUR_USERNAME">Michael</a>
  <br/>
  <sub>Targeting MCP Spec 2025-11-25 · Powered by Next.js + TypeScript</sub>
</p>
