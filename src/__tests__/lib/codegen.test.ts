import { generateServerCode, generateConfig, generatePackageJson } from '@/lib/codegen';
import type { MCPServer, MCPPrimitive } from '@/types';

// -- helpers to build test data without repeating ourselves --
function makeServer(overrides: Partial<MCPServer> = {}): MCPServer {
  return {
    name: 'test-server',
    description: 'A test server',
    transport: 'stdio',
    primitives: [],
    ...overrides,
  };
}

function makeTool(overrides: Partial<MCPPrimitive> = {}): MCPPrimitive {
  return {
    id: 'tool_1',
    type: 'tool',
    name: 'get_data',
    description: 'Fetches some data',
    parameters: [],
    returnType: 'string',
    ...overrides,
  };
}

function makeResource(overrides: Partial<MCPPrimitive> = {}): MCPPrimitive {
  return {
    id: 'res_1',
    type: 'resource',
    name: 'config_file',
    description: 'Config resource',
    uri: 'file:///config.json',
    mimeType: 'application/json',
    ...overrides,
  };
}

function makePrompt(overrides: Partial<MCPPrimitive> = {}): MCPPrimitive {
  return {
    id: 'prompt_1',
    type: 'prompt',
    name: 'code_review',
    description: 'Reviews code',
    template: 'Review this code: {{code}}',
    arguments: [{ name: 'code', description: 'The code to review' }],
    ...overrides,
  };
}

// ========================================================
// generateServerCode
// ========================================================
describe('generateServerCode', () => {
  test('produces valid import statements for an empty server', () => {
    const server = makeServer();
    const code = generateServerCode(server);

    expect(code).toContain('import { McpServer }');
    expect(code).toContain('import { StdioServerTransport }');
    expect(code).toContain('import { z } from "zod"');
  });

  test('includes server name in McpServer constructor', () => {
    const server = makeServer({ name: 'weather-api' });
    const code = generateServerCode(server);

    expect(code).toContain('"weather-api"');
  });

  test('uses default name when server name is empty', () => {
    const server = makeServer({ name: '' });
    const code = generateServerCode(server);

    expect(code).toContain('"my-server"');
  });

  test('generates a tool with no parameters', () => {
    const tool = makeTool({ name: 'ping', description: 'Pings the service', parameters: [] });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('server.tool(');
    expect(code).toContain('"ping"');
    expect(code).toContain('"Pings the service"');
  });

  test('generates a tool with string parameter', () => {
    const tool = makeTool({
      name: 'search',
      parameters: [{ name: 'query', type: 'string', description: 'Search term', required: true }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('query');
    expect(code).toContain('z.string()');
    expect(code).toContain('"Search term"');
  });

  test('generates correct zod types for number params', () => {
    const tool = makeTool({
      parameters: [{ name: 'count', type: 'number', description: 'How many', required: true }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('z.number()');
  });

  test('generates correct zod types for boolean params', () => {
    const tool = makeTool({
      parameters: [{ name: 'verbose', type: 'boolean', description: 'Verbose mode', required: false }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('z.boolean()');
  });

  test('generates correct zod types for array params', () => {
    const tool = makeTool({
      parameters: [{ name: 'tags', type: 'array', description: 'Tag list', required: true }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('z.array(z.string())');
  });

  test('generates correct zod types for object params', () => {
    const tool = makeTool({
      parameters: [{ name: 'config', type: 'object', description: 'Config obj', required: true }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('z.object({})');
  });

  test('generates multiple parameters on a single tool', () => {
    const tool = makeTool({
      name: 'create_item',
      parameters: [
        { name: 'title', type: 'string', description: 'Item title', required: true },
        { name: 'count', type: 'number', description: 'Quantity', required: true },
        { name: 'active', type: 'boolean', description: 'Is active', required: false },
      ],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('title');
    expect(code).toContain('count');
    expect(code).toContain('active');
    expect(code).toContain('z.string()');
    expect(code).toContain('z.number()');
    expect(code).toContain('z.boolean()');
  });

  test('generates resource block with uri and mimeType', () => {
    const resource = makeResource();
    const server = makeServer({ primitives: [resource] });
    const code = generateServerCode(server);

    expect(code).toContain('server.resource(');
    expect(code).toContain('"config_file"');
    expect(code).toContain('"file:///config.json"');
    expect(code).toContain('"application/json"');
  });

  test('uses defaults when resource fields are empty', () => {
    const resource = makeResource({ name: '', uri: '', mimeType: '' });
    const server = makeServer({ primitives: [resource] });
    const code = generateServerCode(server);

    expect(code).toContain('"unnamed_resource"');
    expect(code).toContain('"file:///path"');
    expect(code).toContain('"text/plain"');
  });

  test('generates prompt block with template', () => {
    const prompt = makePrompt();
    const server = makeServer({ primitives: [prompt] });
    const code = generateServerCode(server);

    expect(code).toContain('server.prompt(');
    expect(code).toContain('"code_review"');
    expect(code).toContain('Review this code: {{code}}');
  });

  test('uses defaults when prompt fields are empty', () => {
    const prompt = makePrompt({ name: '', template: '' });
    const server = makeServer({ primitives: [prompt] });
    const code = generateServerCode(server);

    expect(code).toContain('"unnamed_prompt"');
    expect(code).toContain('prompt template');
  });

  test('handles a server with mixed primitive types', () => {
    const server = makeServer({
      primitives: [makeTool(), makeResource(), makePrompt()],
    });
    const code = generateServerCode(server);

    expect(code).toContain('server.tool(');
    expect(code).toContain('server.resource(');
    expect(code).toContain('server.prompt(');
  });

  test('always ends with transport connection code', () => {
    const server = makeServer({ primitives: [makeTool()] });
    const code = generateServerCode(server);

    expect(code).toContain('const transport = new StdioServerTransport()');
    expect(code).toContain('await server.connect(transport)');
  });

  test('handles tool with no name gracefully', () => {
    const tool = makeTool({ name: '' });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('"unnamed_tool"');
  });

  test('handles parameter with no name gracefully', () => {
    const tool = makeTool({
      parameters: [{ name: '', type: 'string', description: '', required: true }],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server);

    expect(code).toContain('param');
  });
});

// ========================================================
// generateConfig
// ========================================================
describe('generateConfig', () => {
  test('returns object with mcpServers key', () => {
    const server = makeServer({ name: 'my-tool' });
    const config = generateConfig(server);

    expect(config).toHaveProperty('mcpServers');
  });

  test('uses server name as the config key', () => {
    const server = makeServer({ name: 'weather-mcp' });
    const config = generateConfig(server) as any;

    expect(config.mcpServers).toHaveProperty('weather-mcp');
  });

  test('falls back to my-server when name is empty', () => {
    const server = makeServer({ name: '' });
    const config = generateConfig(server) as any;

    expect(config.mcpServers).toHaveProperty('my-server');
  });

  test('includes command npx with args', () => {
    const server = makeServer({ name: 'test-srv' });
    const config = generateConfig(server) as any;
    const entry = config.mcpServers['test-srv'];

    expect(entry.command).toBe('npx');
    expect(entry.args).toEqual(['-y', '@mcpforge/test-srv']);
  });

  test('adds url field for http transport', () => {
    const server = makeServer({ name: 'api-srv', transport: 'http' });
    const config = generateConfig(server) as any;
    const entry = config.mcpServers['api-srv'];

    expect(entry.url).toContain('api-srv');
  });

  test('does not add url field for stdio transport', () => {
    const server = makeServer({ name: 'std-srv', transport: 'stdio' });
    const config = generateConfig(server) as any;
    const entry = config.mcpServers['std-srv'];

    expect(entry).not.toHaveProperty('url');
  });

  test('does not add url field for sse transport', () => {
    const server = makeServer({ name: 'sse-srv', transport: 'sse' });
    const config = generateConfig(server) as any;
    const entry = config.mcpServers['sse-srv'];

    expect(entry).not.toHaveProperty('url');
  });
});

// ========================================================
// generatePackageJson
// ========================================================
describe('generatePackageJson', () => {
  test('uses scoped package name', () => {
    const server = makeServer({ name: 'my-tool' });
    const pkg = generatePackageJson(server) as any;

    expect(pkg.name).toBe('@mcpforge/my-tool');
  });

  test('falls back to my-server when name is empty', () => {
    const server = makeServer({ name: '' });
    const pkg = generatePackageJson(server) as any;

    expect(pkg.name).toBe('@mcpforge/my-server');
  });

  test('includes server description', () => {
    const server = makeServer({ description: 'Does cool stuff' });
    const pkg = generatePackageJson(server) as any;

    expect(pkg.description).toBe('Does cool stuff');
  });

  test('falls back to default description when empty', () => {
    const server = makeServer({ description: '' });
    const pkg = generatePackageJson(server) as any;

    expect(pkg.description).toBe('MCP Server built with MCP Forge');
  });

  test('has correct structure fields', () => {
    const server = makeServer();
    const pkg = generatePackageJson(server) as any;

    expect(pkg.version).toBe('1.0.0');
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.type).toBe('module');
  });

  test('includes required dependencies', () => {
    const server = makeServer();
    const pkg = generatePackageJson(server) as any;

    expect(pkg.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
    expect(pkg.dependencies).toHaveProperty('zod');
  });

  test('includes dev dependencies', () => {
    const server = makeServer();
    const pkg = generatePackageJson(server) as any;

    expect(pkg.devDependencies).toHaveProperty('typescript');
    expect(pkg.devDependencies).toHaveProperty('tsx');
    expect(pkg.devDependencies).toHaveProperty('@types/node');
  });

  test('includes build and start scripts', () => {
    const server = makeServer();
    const pkg = generatePackageJson(server) as any;

    expect(pkg.scripts.build).toBe('tsc');
    expect(pkg.scripts.start).toBe('node dist/index.js');
    expect(pkg.scripts.dev).toBe('tsx src/index.ts');
  });

  test('bin entry matches server name', () => {
    const server = makeServer({ name: 'quirk-mcp' });
    const pkg = generatePackageJson(server) as any;

    expect(pkg.bin).toHaveProperty('quirk-mcp', 'dist/index.js');
  });
});

// ========================================================
// generateServerCode (Python)
// ========================================================
describe('generateServerCode — Python', () => {
  test('produces Python imports for FastMCP', () => {
    const server = makeServer();
    const code = generateServerCode(server, 'python');
    expect(code).toContain('from mcp.server.fastmcp import FastMCP');
  });

  test('generates Python tool with decorator', () => {
    const tool = makeTool({ name: 'search' });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server, 'python');
    expect(code).toContain('@mcp.tool()');
    expect(code).toContain('def search(');
  });

  test('generates Python resource with decorator', () => {
    const resource = makeResource();
    const server = makeServer({ primitives: [resource] });
    const code = generateServerCode(server, 'python');
    expect(code).toContain('@mcp.resource(');
  });

  test('generates Python prompt with decorator', () => {
    const prompt = makePrompt();
    const server = makeServer({ primitives: [prompt] });
    const code = generateServerCode(server, 'python');
    expect(code).toContain('@mcp.prompt()');
  });

  test('ends with mcp.run()', () => {
    const server = makeServer();
    const code = generateServerCode(server, 'python');
    expect(code).toContain('mcp.run()');
  });

  test('uses correct Python types', () => {
    const tool = makeTool({
      parameters: [
        { name: 'count', type: 'number', description: 'Count', required: true },
        { name: 'active', type: 'boolean', description: 'Active', required: true },
      ],
    });
    const server = makeServer({ primitives: [tool] });
    const code = generateServerCode(server, 'python');
    expect(code).toContain('float');
    expect(code).toContain('bool');
  });
});

// ========================================================
// generateTsConfig
// ========================================================
import { generateTsConfig, exportServerAsJson, importServerFromJson } from '@/lib/codegen';

describe('generateTsConfig', () => {
  test('returns valid tsconfig structure', () => {
    const conf = generateTsConfig() as any;
    expect(conf.compilerOptions).toBeDefined();
    expect(conf.compilerOptions.target).toBe('ES2022');
    expect(conf.compilerOptions.strict).toBe(true);
  });
});

// ========================================================
// exportServerAsJson / importServerFromJson
// ========================================================
describe('exportServerAsJson / importServerFromJson', () => {
  test('round-trips a server config', () => {
    const server = makeServer({ name: 'round-trip', primitives: [makeTool()] });
    const json = exportServerAsJson(server);
    const imported = importServerFromJson(json);
    expect(imported).not.toBeNull();
    expect(imported!.name).toBe('round-trip');
    expect(imported!.primitives).toHaveLength(1);
  });

  test('includes forge version in export', () => {
    const json = exportServerAsJson(makeServer());
    expect(json).toContain('_mcpForgeVersion');
  });

  test('returns null for invalid JSON', () => {
    expect(importServerFromJson('not json')).toBeNull();
  });

  test('returns null for JSON without server data', () => {
    expect(importServerFromJson('{"foo":"bar"}')).toBeNull();
  });

  test('imports raw server object (no wrapper)', () => {
    const raw = JSON.stringify(makeServer({ name: 'raw' }));
    const imported = importServerFromJson(raw);
    expect(imported).not.toBeNull();
    expect(imported!.name).toBe('raw');
  });
});
