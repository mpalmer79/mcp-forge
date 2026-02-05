// MCP Forge - TypeScript Interfaces
// Based on MCP Specification 2025-11-25

export type TransportType = "stdio" | "http" | "sse";
export type PrimitiveType = "tool" | "resource" | "prompt";
export type ParamType = "string" | "number" | "boolean" | "array" | "object";

export interface ToolParameter {
  name: string;
  type: ParamType;
  description: string;
  required: boolean;
}

export interface MCPPrimitive {
  id: string;
  type: PrimitiveType;
  name: string;
  description: string;
  // tool-specific
  parameters?: ToolParameter[];
  returnType?: string;
  // resource-specific
  uri?: string;
  mimeType?: string;
  // prompt-specific
  template?: string;
  arguments?: { name: string; description: string }[];
}

export interface MCPServer {
  name: string;
  description: string;
  transport: TransportType;
  primitives: MCPPrimitive[];
}

export interface RegistryServer {
  id: string;
  name: string;
  author: string;
  stars: number;
  desc: string;
  primitives: {
    tools: number;
    resources: number;
    prompts: number;
  };
  transport: TransportType;
  official: boolean;
  tags: string[];
}

export interface PlaygroundLog {
  type: "request" | "response";
  time: string;
  method: string;
  data: Record<string, unknown>;
}

export interface PrimitiveTypeInfo {
  label: string;
  icon: string;
  color: string;
  desc: string;
}
