import type { MCPServer } from "@/types";
import {
  generateServerCode,
  generatePackageJson,
  generateTsConfig,
} from "./codegen";

/**
 * Minimal ZIP file generator (no external dependencies).
 * Creates valid ZIP archives using the DEFLATE-stored method (no compression).
 * This is intentional — keeps the bundle small and avoids needing pako/fflate.
 */

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function toLittleEndian16(val: number): Uint8Array {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff]);
}

function toLittleEndian32(val: number): Uint8Array {
  return new Uint8Array([val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff]);
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUTF8(entry.name);

    // Local file header (30 bytes + name + data)
    const local = new Uint8Array(30 + nameBytes.length + entry.data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: stored
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, entry.crc, true); // crc32
    lv.setUint32(18, entry.data.length, true); // compressed size
    lv.setUint32(22, entry.data.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // name length
    lv.setUint16(28, 0, true); // extra length
    local.set(nameBytes, 30);
    local.set(entry.data, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 bytes + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, entry.crc, true); // crc32
    cv.setUint32(20, entry.data.length, true); // compressed
    cv.setUint32(24, entry.data.length, true); // uncompressed
    cv.setUint16(28, nameBytes.length, true); // name length
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk start
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // local header offset
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralDirSize = centralHeaders.reduce((s, c) => s + c.length, 0);

  // End of central directory (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // disk with central dir
  ev.setUint16(8, entries.length, true); // entries on disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, centralDirSize, true); // central dir size
  ev.setUint32(16, offset, true); // central dir offset
  ev.setUint16(20, 0, true); // comment length

  const total = offset + centralDirSize + 22;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const lh of localHeaders) { result.set(lh, pos); pos += lh.length; }
  for (const ch of centralHeaders) { result.set(ch, pos); pos += ch.length; }
  result.set(eocd, pos);

  return result;
}

function makeEntry(name: string, content: string): ZipEntry {
  const data = encodeUTF8(content);
  return { name, data, crc: crc32(data) };
}

export function generateProjectZip(server: MCPServer, language: "typescript" | "python" = "typescript"): Blob {
  const name = server.name || "my-server";
  const prefix = `${name}/`;
  const entries: ZipEntry[] = [];

  if (language === "typescript") {
    // TypeScript project
    entries.push(makeEntry(`${prefix}src/index.ts`, generateServerCode(server, "typescript")));
    entries.push(makeEntry(`${prefix}package.json`, JSON.stringify(generatePackageJson(server), null, 2)));
    entries.push(makeEntry(`${prefix}tsconfig.json`, JSON.stringify(generateTsConfig(), null, 2)));

    entries.push(makeEntry(`${prefix}.gitignore`,
`node_modules/
dist/
.env
*.log
`));

    entries.push(makeEntry(`${prefix}README.md`,
`# ${name}

${server.description || "MCP Server built with MCP Forge"}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing with MCP Inspector

\`\`\`bash
npm run inspect
\`\`\`

## Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Configuration

Add to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["-y", "@mcpforge/${name}"]
    }
  }
}
\`\`\`

## Primitives

| Type | Name | Description |
|------|------|-------------|
${server.primitives.map((p) => `| ${p.type} | ${p.name} | ${p.description} |`).join("\n")}

---

Built with [MCP Forge](https://github.com/mpalmer79/mcp-forge)
`));

    entries.push(makeEntry(`${prefix}.env.example`,
`# Add your environment variables here
# API_KEY=your-key-here
`));

  } else {
    // Python project
    entries.push(makeEntry(`${prefix}server.py`, generateServerCode(server, "python")));

    entries.push(makeEntry(`${prefix}pyproject.toml`,
`[project]
name = "${name}"
version = "${server.version || "1.0.0"}"
description = "${server.description || "MCP Server built with MCP Forge"}"
requires-python = ">=3.10"
dependencies = [
    "mcp[cli]>=1.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
`));

    entries.push(makeEntry(`${prefix}.gitignore`,
`__pycache__/
*.pyc
.env
*.egg-info/
dist/
`));

    entries.push(makeEntry(`${prefix}README.md`,
`# ${name}

${server.description || "MCP Server built with MCP Forge"}

## Quick Start

\`\`\`bash
pip install -e .
python server.py
\`\`\`

## Testing with MCP Inspector

\`\`\`bash
mcp dev server.py
\`\`\`

## Primitives

| Type | Name | Description |
|------|------|-------------|
${server.primitives.map((p) => `| ${p.type} | ${p.name} | ${p.description} |`).join("\n")}

---

Built with [MCP Forge](https://github.com/mpalmer79/mcp-forge)
`));
  }

  const zipData = buildZip(entries);
  return new Blob([zipData], { type: "application/zip" });
}

export function downloadProjectZip(server: MCPServer, language: "typescript" | "python" = "typescript"): void {
  const blob = generateProjectZip(server, language);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${server.name || "mcp-server"}-${language}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
