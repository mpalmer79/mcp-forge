"use client";

const FEATURES = [
  {
    title: "Visual Builder",
    desc: "Design MCP servers by clicking, not coding. Add tools with typed parameters, resources with URI patterns, and prompt templates.",
    color: "#22c55e",
    photo: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&q=80",
  },
  {
    title: "Server Registry",
    desc: "Browse 1,000+ MCP servers. Search by name, tags, or capability. One-click install commands for Claude Desktop.",
    color: "#f59e0b",
    photo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop&q=80",
  },
  {
    title: "Live Playground",
    desc: "Simulate JSON-RPC calls against your server. See formatted request/response logs before you deploy.",
    color: "#a78bfa",
    photo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&q=80",
  },
  {
    title: "Config Generator",
    desc: "Auto-generates claude_desktop_config.json, package.json, and production-ready TypeScript following the official SDK.",
    color: "#3b82f6",
    photo: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=400&fit=crop&q=80",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold mb-3">Everything you need to ship MCP servers</h2>
          <p className="text-sm text-slate-500 font-mono max-w-lg mx-auto">
            From visual design to production deployment — one tool for the entire MCP server lifecycle.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/[0.04] hover:border-white/[0.12] transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0">
                <img
                  src={f.photo}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/90 to-[#070b14]/60" />
              </div>
              <div className="relative p-6 pt-24">
                <h3
                  className="font-semibold text-[15px] mb-2 transition-colors"
                  style={{ color: f.color }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-mono">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
