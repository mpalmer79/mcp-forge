import {
  loadProjects, saveProject, deleteProject,
  loadCurrentProjectId, saveCurrentProjectId,
  autoSave, formatTimeAgo,
  type SavedProject,
} from "@/lib/storage";
import type { MCPServer } from "@/types";

// Mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => store[key] || null),
  setItem: jest.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

function makeServer(overrides: Partial<MCPServer> = {}): MCPServer {
  return {
    name: "test-server",
    description: "A test server",
    transport: "stdio",
    primitives: [],
    ...overrides,
  };
}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
});

describe("loadProjects", () => {
  test("returns empty array when no data", () => {
    expect(loadProjects()).toEqual([]);
  });

  test("returns parsed projects from localStorage", () => {
    const projects = [{ id: "p1", name: "test", server: makeServer(), savedAt: "2025-01-01", updatedAt: "2025-01-01", description: "", primitiveCount: 0 }];
    store["mcpforge_projects"] = JSON.stringify(projects);
    const result = loadProjects();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });

  test("returns empty array on invalid JSON", () => {
    store["mcpforge_projects"] = "not json";
    expect(loadProjects()).toEqual([]);
  });
});

describe("saveProject", () => {
  test("creates a new project", () => {
    const server = makeServer({ name: "my-tool" });
    const saved = saveProject(server);
    expect(saved.name).toBe("my-tool");
    expect(saved.id).toMatch(/^proj_/);
    expect(saved.primitiveCount).toBe(0);
  });

  test("updates existing project by ID", () => {
    const server = makeServer({ name: "v1" });
    const first = saveProject(server);
    const updated = saveProject(makeServer({ name: "v2" }), first.id);
    expect(updated.id).toBe(first.id);
    expect(updated.name).toBe("v2");
  });

  test("limits to 20 projects max", () => {
    for (let i = 0; i < 25; i++) {
      saveProject(makeServer({ name: `proj-${i}` }));
    }
    const projects = loadProjects();
    expect(projects.length).toBeLessThanOrEqual(20);
  });
});

describe("deleteProject", () => {
  test("removes project by ID", () => {
    const saved = saveProject(makeServer());
    expect(loadProjects()).toHaveLength(1);
    deleteProject(saved.id);
    expect(loadProjects()).toHaveLength(0);
  });
});

describe("currentProjectId", () => {
  test("saves and loads current project ID", () => {
    saveCurrentProjectId("proj_123");
    expect(loadCurrentProjectId()).toBe("proj_123");
  });

  test("clears current project ID with null", () => {
    saveCurrentProjectId("proj_123");
    saveCurrentProjectId(null);
    expect(loadCurrentProjectId()).toBeNull();
  });
});

describe("autoSave", () => {
  test("does not create project for default server", () => {
    const server = makeServer({ name: "my-server" });
    const id = autoSave(server, null);
    expect(id).toBe("");
  });

  test("creates project for named server with primitives", () => {
    const server = makeServer({
      name: "real-server",
      primitives: [{ id: "t1", type: "tool", name: "test", description: "", parameters: [] }],
    });
    const id = autoSave(server, null);
    expect(id).toMatch(/^proj_/);
  });

  test("updates existing project when ID provided", () => {
    const saved = saveProject(makeServer({ name: "first" }));
    autoSave(makeServer({ name: "updated" }), saved.id);
    const projects = loadProjects();
    expect(projects[0].name).toBe("updated");
  });
});

describe("formatTimeAgo", () => {
  test("returns 'just now' for recent time", () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe("just now");
  });

  test("returns minutes for recent past", () => {
    const past = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatTimeAgo(past)).toBe("5m ago");
  });

  test("returns hours for older past", () => {
    const past = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatTimeAgo(past)).toBe("3h ago");
  });

  test("returns days for multi-day past", () => {
    const past = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatTimeAgo(past)).toBe("2d ago");
  });
});
