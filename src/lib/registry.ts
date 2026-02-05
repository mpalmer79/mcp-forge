import { RegistryServer, PrimitiveTypeInfo } from "@/types";

export const PRIMITIVE_TYPES: Record<string, PrimitiveTypeInfo> = {
  tool: { label: "Tool", icon: "⚡", color: "#22c55e", desc: "Functions the LLM can call" },
  resource: { label: "Resource", icon: "📄", color: "#f59e0b", desc: "Data the app can read" },
  prompt: { label: "Prompt", icon: "💬", color: "#a78bfa", desc: "Templates for users" },
};

export const TRANSPORTS = ["stdio", "http", "sse"] as const;
export const PARAM_TYPES = ["string", "number", "boolean", "array", "object"] as const;

export const REGISTRY_SERVERS: RegistryServer[] = [
  { id: "filesystem", name: "Filesystem", author: "Anthropic", stars: 4200, desc: "Read/write files, list directories, search files", primitives: { tools: 11, resources: 2, prompts: 0 }, transport: "stdio", official: true, tags: ["files", "local", "core"] },
  { id: "github", name: "GitHub", author: "Anthropic", stars: 3800, desc: "Repos, issues, PRs, commits, branches, and search", primitives: { tools: 18, resources: 5, prompts: 2 }, transport: "stdio", official: true, tags: ["git", "code", "devops"] },
  { id: "postgres", name: "PostgreSQL", author: "Anthropic", stars: 3100, desc: "Query databases, inspect schemas, run SQL", primitives: { tools: 6, resources: 8, prompts: 1 }, transport: "stdio", official: true, tags: ["database", "sql", "data"] },
  { id: "slack", name: "Slack", author: "Anthropic", stars: 2900, desc: "Read channels, send messages, search conversations", primitives: { tools: 9, resources: 3, prompts: 1 }, transport: "http", official: true, tags: ["chat", "messaging", "team"] },
  { id: "brave-search", name: "Brave Search", author: "Anthropic", stars: 2400, desc: "Web and local search via Brave Search API", primitives: { tools: 2, resources: 0, prompts: 0 }, transport: "stdio", official: true, tags: ["search", "web", "api"] },
  { id: "memory", name: "Memory", author: "Anthropic", stars: 2200, desc: "Knowledge graph memory for persistent context", primitives: { tools: 5, resources: 1, prompts: 0 }, transport: "stdio", official: true, tags: ["memory", "graph", "context"] },
  { id: "puppeteer", name: "Puppeteer", author: "Anthropic", stars: 2100, desc: "Browser automation, screenshots, web scraping", primitives: { tools: 8, resources: 0, prompts: 0 }, transport: "stdio", official: true, tags: ["browser", "scraping", "automation"] },
  { id: "fetch", name: "Fetch", author: "Anthropic", stars: 1800, desc: "Pull web content, clean it up, return LLM-friendly formats", primitives: { tools: 1, resources: 0, prompts: 0 }, transport: "stdio", official: true, tags: ["web", "scraping", "content"] },
  { id: "google-drive", name: "Google Drive", author: "Anthropic", stars: 1600, desc: "Search, read, and manage Google Drive files", primitives: { tools: 4, resources: 3, prompts: 0 }, transport: "stdio", official: true, tags: ["google", "files", "cloud"] },
  { id: "dealership-dms", name: "Dealership DMS", author: "quirk-auto", stars: 48, desc: "PBS/VIN Solutions integration for inventory and deals", primitives: { tools: 12, resources: 6, prompts: 3 }, transport: "http", official: false, tags: ["automotive", "inventory", "crm"] },
  { id: "supabase", name: "Supabase", author: "community", stars: 890, desc: "Auth, database, storage, and edge functions", primitives: { tools: 14, resources: 4, prompts: 2 }, transport: "http", official: false, tags: ["database", "auth", "baas"] },
  { id: "notion", name: "Notion", author: "community", stars: 760, desc: "Pages, databases, blocks, and search", primitives: { tools: 10, resources: 6, prompts: 1 }, transport: "http", official: false, tags: ["docs", "wiki", "productivity"] },
  { id: "linear", name: "Linear", author: "community", stars: 620, desc: "Issues, projects, cycles, and team management", primitives: { tools: 8, resources: 3, prompts: 2 }, transport: "http", official: false, tags: ["project", "issues", "devops"] },
  { id: "stripe", name: "Stripe", author: "community", stars: 540, desc: "Payments, customers, invoices, and subscriptions", primitives: { tools: 15, resources: 4, prompts: 0 }, transport: "http", official: false, tags: ["payments", "billing", "finance"] },
  { id: "sentry", name: "Sentry", author: "community", stars: 480, desc: "Error tracking, issue management, and performance monitoring", primitives: { tools: 6, resources: 2, prompts: 1 }, transport: "http", official: false, tags: ["errors", "monitoring", "devops"] },
];
