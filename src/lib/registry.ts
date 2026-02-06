import { RegistryServer, PrimitiveTypeInfo, ServerTemplate } from "@/types";

export const PRIMITIVE_TYPES: Record<string, PrimitiveTypeInfo> = {
  tool: { label: "Tool", icon: "⚡", color: "#22c55e", desc: "Functions the LLM can call" },
  resource: { label: "Resource", icon: "📄", color: "#f59e0b", desc: "Data the app can read" },
  prompt: { label: "Prompt", icon: "💬", color: "#a78bfa", desc: "Templates for users" },
};

export const TRANSPORTS = ["stdio", "http", "sse"] as const;
export const PARAM_TYPES = ["string", "number", "boolean", "array", "object"] as const;

export const SERVER_TEMPLATES: ServerTemplate[] = [
  {
    id: "rest-api",
    name: "REST API Wrapper",
    description: "Expose any REST API as MCP tools with authentication",
    icon: "🌐",
    category: "api",
    server: {
      name: "rest-api-server",
      description: "REST API integration server",
      transport: "stdio",
      primitives: [
        {
          id: "tool_get", type: "tool", name: "api_get",
          description: "GET request to the API",
          parameters: [
            { name: "endpoint", type: "string", description: "API endpoint path", required: true },
            { name: "params", type: "object", description: "Query parameters", required: false },
          ],
        },
        {
          id: "tool_post", type: "tool", name: "api_post",
          description: "POST request to the API",
          parameters: [
            { name: "endpoint", type: "string", description: "API endpoint path", required: true },
            { name: "body", type: "object", description: "Request body", required: true },
          ],
        },
        {
          id: "res_schema", type: "resource", name: "api_schema",
          description: "OpenAPI schema for the API", uri: "schema://openapi.json", mimeType: "application/json",
        },
      ],
    },
  },
  {
    id: "database",
    name: "Database Connector",
    description: "Query databases with read-only or full access controls",
    icon: "🗄️",
    category: "database",
    server: {
      name: "db-connector",
      description: "Database query and schema inspection server",
      transport: "stdio",
      primitives: [
        {
          id: "tool_query", type: "tool", name: "run_query",
          description: "Execute a SQL query against the database",
          parameters: [
            { name: "sql", type: "string", description: "SQL query to execute", required: true },
            { name: "params", type: "array", description: "Query parameters for prepared statements", required: false },
          ],
        },
        {
          id: "tool_tables", type: "tool", name: "list_tables",
          description: "List all tables in the database",
          parameters: [],
        },
        {
          id: "tool_describe", type: "tool", name: "describe_table",
          description: "Get column info for a specific table",
          parameters: [
            { name: "table_name", type: "string", description: "Name of the table", required: true },
          ],
        },
        {
          id: "res_schema", type: "resource", name: "db_schema",
          description: "Complete database schema", uri: "db://schema", mimeType: "application/json",
        },
      ],
    },
  },
  {
    id: "file-processor",
    name: "File Processor",
    description: "Read, write, search, and transform files on disk",
    icon: "📁",
    category: "utility",
    server: {
      name: "file-processor",
      description: "Local file system operations server",
      transport: "stdio",
      primitives: [
        {
          id: "tool_read", type: "tool", name: "read_file",
          description: "Read contents of a file",
          parameters: [
            { name: "path", type: "string", description: "File path to read", required: true },
          ],
        },
        {
          id: "tool_write", type: "tool", name: "write_file",
          description: "Write content to a file",
          parameters: [
            { name: "path", type: "string", description: "File path to write", required: true },
            { name: "content", type: "string", description: "Content to write", required: true },
          ],
        },
        {
          id: "tool_search", type: "tool", name: "search_files",
          description: "Search for files matching a pattern",
          parameters: [
            { name: "pattern", type: "string", description: "Glob pattern to match", required: true },
            { name: "directory", type: "string", description: "Directory to search in", required: false },
          ],
        },
        {
          id: "res_dir", type: "resource", name: "directory_listing",
          description: "List directory contents", uri: "file:///{path}", mimeType: "application/json",
        },
      ],
    },
  },
  {
    id: "ai-agent",
    name: "AI Agent Toolkit",
    description: "Tools for building AI agent workflows with memory and reasoning",
    icon: "🤖",
    category: "ai",
    server: {
      name: "ai-agent-toolkit",
      description: "AI agent workflow tools with memory and reasoning",
      transport: "stdio",
      primitives: [
        {
          id: "tool_think", type: "tool", name: "think",
          description: "Structured reasoning step — think through a problem",
          parameters: [
            { name: "question", type: "string", description: "The question to reason about", required: true },
            { name: "context", type: "string", description: "Relevant context for reasoning", required: false },
          ],
        },
        {
          id: "tool_remember", type: "tool", name: "store_memory",
          description: "Store a fact in long-term memory",
          parameters: [
            { name: "key", type: "string", description: "Memory key", required: true },
            { name: "value", type: "string", description: "Information to remember", required: true },
          ],
        },
        {
          id: "tool_recall", type: "tool", name: "recall_memory",
          description: "Retrieve stored memories by key or semantic search",
          parameters: [
            { name: "query", type: "string", description: "Search query for memories", required: true },
          ],
        },
        {
          id: "prompt_agent", type: "prompt", name: "agent_system",
          description: "System prompt for the AI agent",
          template: "You are a helpful AI agent with access to tools. Think step by step, use your tools when needed, and store important findings in memory for future reference.",
        },
      ],
    },
  },
  {
    id: "dealership",
    name: "Dealership Integration",
    description: "Automotive DMS, inventory, and CRM integration tools",
    icon: "🚗",
    category: "automotive",
    server: {
      name: "dealership-server",
      description: "Automotive dealership management integration server",
      transport: "http",
      primitives: [
        {
          id: "tool_inventory", type: "tool", name: "search_inventory",
          description: "Search vehicle inventory by make, model, year, or stock number",
          parameters: [
            { name: "make", type: "string", description: "Vehicle make (e.g., Toyota)", required: false },
            { name: "model", type: "string", description: "Vehicle model (e.g., Camry)", required: false },
            { name: "year", type: "number", description: "Model year", required: false },
            { name: "stock_number", type: "string", description: "Dealer stock number", required: false },
          ],
        },
        {
          id: "tool_valuation", type: "tool", name: "get_vehicle_value",
          description: "Get trade-in and retail values from multiple data sources",
          parameters: [
            { name: "vin", type: "string", description: "Vehicle Identification Number", required: true },
            { name: "mileage", type: "number", description: "Current odometer reading", required: true },
            { name: "condition", type: "string", description: "Vehicle condition: excellent, good, fair, poor", required: false },
          ],
        },
        {
          id: "tool_customer", type: "tool", name: "lookup_customer",
          description: "Look up customer records in the CRM",
          parameters: [
            { name: "name", type: "string", description: "Customer name", required: false },
            { name: "phone", type: "string", description: "Phone number", required: false },
            { name: "email", type: "string", description: "Email address", required: false },
          ],
        },
        {
          id: "res_inventory", type: "resource", name: "live_inventory",
          description: "Real-time inventory feed", uri: "dealer://inventory", mimeType: "application/json",
        },
        {
          id: "prompt_sales", type: "prompt", name: "sales_assistant",
          description: "Sales assistant system prompt",
          template: "You are a knowledgeable automotive sales assistant for {{dealership_name}}. Help customers find vehicles, provide valuations, and answer questions about inventory. Always be professional and transparent about pricing.",
        },
      ],
    },
  },
];

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
  { id: "google-maps", name: "Google Maps", author: "Anthropic", stars: 1400, desc: "Geocoding, directions, place search, and distance calculations", primitives: { tools: 6, resources: 0, prompts: 0 }, transport: "stdio", official: true, tags: ["maps", "geo", "location"] },
  { id: "dealership-dms", name: "Dealership DMS", author: "quirk-auto", stars: 48, desc: "PBS/VIN Solutions integration for inventory and deals", primitives: { tools: 12, resources: 6, prompts: 3 }, transport: "http", official: false, tags: ["automotive", "inventory", "crm"] },
  { id: "supabase", name: "Supabase", author: "community", stars: 890, desc: "Auth, database, storage, and edge functions", primitives: { tools: 14, resources: 4, prompts: 2 }, transport: "http", official: false, tags: ["database", "auth", "baas"] },
  { id: "notion", name: "Notion", author: "community", stars: 760, desc: "Pages, databases, blocks, and search", primitives: { tools: 10, resources: 6, prompts: 1 }, transport: "http", official: false, tags: ["docs", "wiki", "productivity"] },
  { id: "linear", name: "Linear", author: "community", stars: 620, desc: "Issues, projects, cycles, and team management", primitives: { tools: 8, resources: 3, prompts: 2 }, transport: "http", official: false, tags: ["project", "issues", "devops"] },
  { id: "stripe", name: "Stripe", author: "community", stars: 540, desc: "Payments, customers, invoices, and subscriptions", primitives: { tools: 15, resources: 4, prompts: 0 }, transport: "http", official: false, tags: ["payments", "billing", "finance"] },
  { id: "sentry", name: "Sentry", author: "community", stars: 480, desc: "Error tracking, issue management, and performance monitoring", primitives: { tools: 6, resources: 2, prompts: 1 }, transport: "http", official: false, tags: ["errors", "monitoring", "devops"] },
  { id: "vercel", name: "Vercel", author: "community", stars: 420, desc: "Deploy previews, manage projects, and view logs", primitives: { tools: 7, resources: 2, prompts: 0 }, transport: "http", official: false, tags: ["deploy", "hosting", "devops"] },
  { id: "openai", name: "OpenAI", author: "community", stars: 380, desc: "Chat completions, embeddings, and image generation", primitives: { tools: 4, resources: 0, prompts: 3 }, transport: "http", official: false, tags: ["ai", "llm", "embeddings"] },
];
