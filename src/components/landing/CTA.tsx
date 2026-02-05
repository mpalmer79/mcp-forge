"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="px-6 py-20 border-t border-white/[0.04]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
        <p className="text-slate-500 font-mono text-sm mb-8">
          Open the builder and create your first MCP server in minutes.
        </p>
        <Link href="/builder" className="inline-block px-8 py-4 bg-forge-500 hover:bg-forge-600 text-white font-mono font-bold text-sm rounded-lg transition-all glow-green">
          ⚡ Launch MCP Forge
        </Link>
      </div>
    </section>
  );
}
