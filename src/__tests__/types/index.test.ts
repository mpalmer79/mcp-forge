import type {
  TransportType,
  PrimitiveType,
  ParamType,
  ToolParameter,
  MCPPrimitive,
  MCPServer,
  RegistryServer,
  PlaygroundLog,
  PrimitiveTypeInfo,
} from '@/types';

// These tests validate that the TypeScript interfaces are structurally correct
// by constructing objects that conform to each type. If the types change in a
// breaking way, these will fail at compile time.

describe('Type definitions', () => {
  test('TransportType accepts valid values', () => {
    const vals: TransportType[] = ['stdio', 'http', 'sse'];
    expect(vals).toHaveLength(3);
  });

  test('PrimitiveType accepts valid values', () => {
    const vals: PrimitiveType[] = ['tool', 'resource', 'prompt'];
    expect(vals).toHaveLength(3);
  });

  test('ParamType accepts valid values', () => {
    const vals: ParamType[] = ['string', 'number', 'boolean', 'array', 'object'];
    expect(vals).toHaveLength(5);
  });

  test('ToolParameter can be constructed', () => {
    const param: ToolParameter = {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    };
    expect(param.name).toBe('query');
    expect(param.required).toBe(true);
  });

  test('MCPPrimitive supports tool type with parameters', () => {
    const prim: MCPPrimitive = {
      id: 'tool_1',
      type: 'tool',
      name: 'search',
      description: 'Search stuff',
      parameters: [{ name: 'q', type: 'string', description: '', required: true }],
      returnType: 'string',
    };
    expect(prim.type).toBe('tool');
    expect(prim.parameters).toHaveLength(1);
  });

  test('MCPPrimitive supports resource type', () => {
    const prim: MCPPrimitive = {
      id: 'res_1',
      type: 'resource',
      name: 'data',
      description: 'Data file',
      uri: 'file:///data.json',
      mimeType: 'application/json',
    };
    expect(prim.type).toBe('resource');
    expect(prim.uri).toBeDefined();
  });

  test('MCPPrimitive supports prompt type', () => {
    const prim: MCPPrimitive = {
      id: 'p_1',
      type: 'prompt',
      name: 'helper',
      description: 'Helper prompt',
      template: 'You are helpful',
      arguments: [{ name: 'role', description: 'The role' }],
    };
    expect(prim.type).toBe('prompt');
    expect(prim.arguments).toHaveLength(1);
  });

  test('MCPServer can be constructed', () => {
    const server: MCPServer = {
      name: 'test',
      description: 'Test server',
      transport: 'stdio',
      primitives: [],
    };
    expect(server.name).toBe('test');
    expect(server.primitives).toHaveLength(0);
  });

  test('RegistryServer can be constructed', () => {
    const srv: RegistryServer = {
      id: 'test-reg',
      name: 'Test',
      author: 'tester',
      stars: 100,
      desc: 'A test registry server',
      primitives: { tools: 3, resources: 1, prompts: 0 },
      transport: 'stdio',
      official: false,
      tags: ['test'],
    };
    expect(srv.id).toBe('test-reg');
    expect(srv.primitives.tools).toBe(3);
  });

  test('PlaygroundLog can be constructed', () => {
    const log: PlaygroundLog = {
      type: 'request',
      time: '12:00:00.000',
      method: 'tools/call',
      data: { name: 'test_tool' },
    };
    expect(log.type).toBe('request');
    expect(log.method).toBe('tools/call');
  });

  test('PrimitiveTypeInfo can be constructed', () => {
    const info: PrimitiveTypeInfo = {
      label: 'Tool',
      icon: '⚡',
      color: '#22c55e',
      desc: 'Functions the LLM can call',
    };
    expect(info.label).toBe('Tool');
    expect(info.color).toMatch(/^#/);
  });
});
