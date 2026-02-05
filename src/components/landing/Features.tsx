"use client";

const FEATURES = [
  { icon: "🔧", title: "Visual Builder", desc: "Design MCP servers by clicking, not coding. Add tools with typed parameters, resources with URI patterns, and prompt templates.", color: "#22c55e" },
  { icon: "📦", title: "Server Registry", desc: "Browse 1,000+ MCP servers. Search by name, tags, or capability. One-click install commands for Claude Desktop.", color: "#f59e0b" },
  { icon: "▶", title: "Live Playground", desc: "Simulate JSON-RPC calls against your server. See formatted request/response logs before you deploy.", color: "#a78bfa" },
  { icon: "⚙", title: "Config Generator", desc: "Auto-generates claude_desktop_config.json, package.json, and production-ready TypeScript following the official SDK.", color: "#3b82f6" },
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
            <div key={f.title} className="p-6 rounded-xl bg-[#0a0f1a] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-4" style={{ background: `${f.color}10`, border: `1px solid ${f.color}30` }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-[15px] mb-2 group-hover:text-forge-400 transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-mono">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
