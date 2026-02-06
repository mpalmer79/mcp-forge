import { PRIMITIVE_TYPES, TRANSPORTS, PARAM_TYPES, REGISTRY_SERVERS } from '@/lib/registry';

// ========================================================
// PRIMITIVE_TYPES
// ========================================================
describe('PRIMITIVE_TYPES', () => {
  test('has tool, resource, and prompt entries', () => {
    expect(PRIMITIVE_TYPES).toHaveProperty('tool');
    expect(PRIMITIVE_TYPES).toHaveProperty('resource');
    expect(PRIMITIVE_TYPES).toHaveProperty('prompt');
  });

  test('each entry has required fields', () => {
    for (const [key, info] of Object.entries(PRIMITIVE_TYPES)) {
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('icon');
      expect(info).toHaveProperty('color');
      expect(info).toHaveProperty('desc');
      // labels should be non-empty
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.icon.length).toBeGreaterThan(0);
      // color should look like a hex value
      expect(info.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('tool type has correct label', () => {
    expect(PRIMITIVE_TYPES.tool.label).toBe('Tool');
  });

  test('resource type has correct label', () => {
    expect(PRIMITIVE_TYPES.resource.label).toBe('Resource');
  });

  test('prompt type has correct label', () => {
    expect(PRIMITIVE_TYPES.prompt.label).toBe('Prompt');
  });
});

// ========================================================
// TRANSPORTS
// ========================================================
describe('TRANSPORTS', () => {
  test('includes stdio, http, and sse', () => {
    expect(TRANSPORTS).toContain('stdio');
    expect(TRANSPORTS).toContain('http');
    expect(TRANSPORTS).toContain('sse');
  });

  test('has exactly 3 transport types', () => {
    expect(TRANSPORTS).toHaveLength(3);
  });
});

// ========================================================
// PARAM_TYPES
// ========================================================
describe('PARAM_TYPES', () => {
  test('includes all expected parameter types', () => {
    expect(PARAM_TYPES).toContain('string');
    expect(PARAM_TYPES).toContain('number');
    expect(PARAM_TYPES).toContain('boolean');
    expect(PARAM_TYPES).toContain('array');
    expect(PARAM_TYPES).toContain('object');
  });

  test('has exactly 5 param types', () => {
    expect(PARAM_TYPES).toHaveLength(5);
  });
});

// ========================================================
// REGISTRY_SERVERS
// ========================================================
describe('REGISTRY_SERVERS', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(REGISTRY_SERVERS)).toBe(true);
    expect(REGISTRY_SERVERS.length).toBeGreaterThan(0);
  });

  test('each server has required fields', () => {
    for (const srv of REGISTRY_SERVERS) {
      expect(srv).toHaveProperty('id');
      expect(srv).toHaveProperty('name');
      expect(srv).toHaveProperty('author');
      expect(srv).toHaveProperty('stars');
      expect(srv).toHaveProperty('desc');
      expect(srv).toHaveProperty('primitives');
      expect(srv).toHaveProperty('transport');
      expect(srv).toHaveProperty('official');
      expect(srv).toHaveProperty('tags');
    }
  });

  test('each server has valid transport type', () => {
    const validTransports = ['stdio', 'http', 'sse'];
    for (const srv of REGISTRY_SERVERS) {
      expect(validTransports).toContain(srv.transport);
    }
  });

  test('each server primitives has tools/resources/prompts counts', () => {
    for (const srv of REGISTRY_SERVERS) {
      expect(typeof srv.primitives.tools).toBe('number');
      expect(typeof srv.primitives.resources).toBe('number');
      expect(typeof srv.primitives.prompts).toBe('number');
      expect(srv.primitives.tools).toBeGreaterThanOrEqual(0);
      expect(srv.primitives.resources).toBeGreaterThanOrEqual(0);
      expect(srv.primitives.prompts).toBeGreaterThanOrEqual(0);
    }
  });

  test('all server IDs are unique', () => {
    const ids = REGISTRY_SERVERS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('tags are arrays of strings', () => {
    for (const srv of REGISTRY_SERVERS) {
      expect(Array.isArray(srv.tags)).toBe(true);
      for (const tag of srv.tags) {
        expect(typeof tag).toBe('string');
      }
    }
  });

  test('stars are non-negative numbers', () => {
    for (const srv of REGISTRY_SERVERS) {
      expect(srv.stars).toBeGreaterThanOrEqual(0);
    }
  });

  test('official servers are authored by Anthropic', () => {
    const officialServers = REGISTRY_SERVERS.filter((s) => s.official);
    expect(officialServers.length).toBeGreaterThan(0);
    for (const srv of officialServers) {
      expect(srv.author).toBe('Anthropic');
    }
  });

  test('includes the Filesystem server', () => {
    const fs = REGISTRY_SERVERS.find((s) => s.id === 'filesystem');
    expect(fs).toBeDefined();
    expect(fs!.name).toBe('Filesystem');
    expect(fs!.official).toBe(true);
  });

  test('includes the dealership-dms community server', () => {
    const dms = REGISTRY_SERVERS.find((s) => s.id === 'dealership-dms');
    expect(dms).toBeDefined();
    expect(dms!.author).toBe('quirk-auto');
    expect(dms!.official).toBe(false);
  });
});

// ========================================================
// SERVER_TEMPLATES
// ========================================================
import { SERVER_TEMPLATES } from '@/lib/registry';

describe('SERVER_TEMPLATES', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(SERVER_TEMPLATES)).toBe(true);
    expect(SERVER_TEMPLATES.length).toBeGreaterThan(0);
  });

  test('each template has required fields', () => {
    for (const tmpl of SERVER_TEMPLATES) {
      expect(tmpl).toHaveProperty('id');
      expect(tmpl).toHaveProperty('name');
      expect(tmpl).toHaveProperty('description');
      expect(tmpl).toHaveProperty('icon');
      expect(tmpl).toHaveProperty('category');
      expect(tmpl).toHaveProperty('server');
      expect(tmpl.server).toHaveProperty('name');
      expect(tmpl.server).toHaveProperty('primitives');
    }
  });

  test('all template IDs are unique', () => {
    const ids = SERVER_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('each template has valid category', () => {
    const validCategories = ['api', 'database', 'utility', 'ai', 'automotive'];
    for (const tmpl of SERVER_TEMPLATES) {
      expect(validCategories).toContain(tmpl.category);
    }
  });

  test('each template server has at least one primitive', () => {
    for (const tmpl of SERVER_TEMPLATES) {
      expect(tmpl.server.primitives.length).toBeGreaterThan(0);
    }
  });
});
