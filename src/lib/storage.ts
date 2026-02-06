import type { MCPServer } from "@/types";

const STORAGE_KEY = "mcpforge_projects";
const CURRENT_KEY = "mcpforge_current";
const MAX_PROJECTS = 20;

export interface SavedProject {
  id: string;
  name: string;
  description: string;
  server: MCPServer;
  savedAt: string;
  updatedAt: string;
  primitiveCount: number;
}

function isAvailable(): boolean {
  try {
    const k = "__mcpforge_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadProjects(): SavedProject[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: SavedProject[]): void {
  if (!isAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_PROJECTS)));
  } catch {
    // storage full or unavailable
  }
}

export function saveProject(server: MCPServer, existingId?: string): SavedProject {
  const projects = loadProjects();
  const now = new Date().toISOString();

  if (existingId) {
    const idx = projects.findIndex((p) => p.id === existingId);
    if (idx >= 0) {
      projects[idx] = {
        ...projects[idx],
        name: server.name || "untitled",
        description: server.description || "",
        server,
        updatedAt: now,
        primitiveCount: server.primitives.length,
      };
      saveProjects(projects);
      return projects[idx];
    }
  }

  const project: SavedProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: server.name || "untitled",
    description: server.description || "",
    server,
    savedAt: now,
    updatedAt: now,
    primitiveCount: server.primitives.length,
  };

  projects.unshift(project);
  saveProjects(projects);
  return project;
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function loadCurrentProjectId(): string | null {
  if (!isAvailable()) return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function saveCurrentProjectId(id: string | null): void {
  if (!isAvailable()) return;
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

export function autoSave(server: MCPServer, projectId: string | null): string {
  if (projectId) {
    const saved = saveProject(server, projectId);
    return saved.id;
  }
  // Only auto-create a project if there's something meaningful
  if (server.name && server.name !== "my-server" && server.primitives.length > 0) {
    const saved = saveProject(server);
    saveCurrentProjectId(saved.id);
    return saved.id;
  }
  return "";
}

export function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
