import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Forge — Visual MCP Server Builder & Registry",
  description:
    "Build, test, and ship Model Context Protocol servers without writing boilerplate. Visual interface for creating MCP tools, resources, and prompts with production-ready TypeScript output.",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "Anthropic",
    "AI agents",
    "developer tools",
    "TypeScript",
    "code generation",
  ],
  authors: [{ name: "Michael" }],
  openGraph: {
    title: "MCP Forge — Visual MCP Server Builder",
    description:
      "Build, test, and ship MCP servers visually. Generate production-ready TypeScript code.",
    type: "website",
    siteName: "MCP Forge",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCP Forge — Visual MCP Server Builder",
    description:
      "Build, test, and ship MCP servers visually.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
