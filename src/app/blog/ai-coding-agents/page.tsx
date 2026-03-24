import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Terminal } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Coding Agents - Terminal-Based AI Tools & Remote Access",
  description: "Learn how to use AI coding agents like Claude Code remotely. Setup guides, workflows, and tips for controlling AI agents from anywhere using your browser.",
  keywords: ["ai coding agents", "claude code remote", "codex cli", "ai agent workflow", "remote ai coding"],
  openGraph: {
    title: "AI Coding Agents - Remote Access Guides",
    description: "Master remote AI coding workflows with terminal-based agents.",
  },
}

const posts = [
  { slug: "run-claude-code-from-anywhere", title: "Run Claude Code From Anywhere (Full Setup Guide)" },
  { slug: "use-ai-coding-agents-from-phone", title: "How to Use AI Coding Agents From Your Phone" },
  { slug: "best-setup-running-ai-agents-24-7", title: "Best Setup for Running AI Coding Agents 24/7" },
  { slug: "claude-code-vs-codex-cli", title: "Claude Code vs Codex CLI: Which Should You Use?" },
  { slug: "control-ai-coding-agent-from-anywhere", title: "Control Your AI Coding Agent From Anywhere" },
  { slug: "run-ai-coding-agents-while-outside", title: "How I Run AI Coding Agents While I'm Outside" },
  { slug: "ultimate-remote-dev-setup-ai-terminal-browser", title: "The Ultimate Remote Dev Setup (AI + Terminal + Browser)" },
  { slug: "run-codex-cli-on-home-pc-anywhere", title: "Run Codex CLI on Your Home PC and Access It Anywhere" },
  { slug: "why-ai-coding-tools-need-remote-access", title: "Why AI Coding Tools Need Remote Access" },
  { slug: "build-while-you-sleep-ai-agents-overnight", title: "Build While You Sleep: Running AI Agents Overnight" },
  { slug: "monitor-ai-code-generation-real-time", title: "How to Monitor AI Code Generation in Real-Time" },
  { slug: "turn-phone-into-dev-console", title: "Turn Your Phone Into a Dev Console" },
  { slug: "best-tools-ai-powered-development-2026", title: "Best Tools for AI-Powered Development (2026)" },
  { slug: "local-ai-coding-agents-beat-cloud-ides", title: "Why Local AI Coding Agents Beat Cloud IDEs" },
  { slug: "run-entire-dev-environment-in-browser", title: "Run Your Entire Dev Environment in a Browser (Without the Cloud)" },
  { slug: "multi-agent-coding-workflows", title: "Multi-Agent Coding Workflows (And How to Manage Them)" },
  { slug: "debug-code-remotely-using-ai-agents", title: "How to Debug Code Remotely Using AI Agents" },
  { slug: "future-of-coding-ai-agents-remote-terminals", title: "The Future of Coding: AI Agents + Remote Terminals" },
  { slug: "run-terminal-based-ai-tools-any-device", title: "Run Terminal-Based AI Tools on Any Device" },
  { slug: "from-terminal-to-anywhere-new-dev-workflow", title: "From Terminal to Anywhere: The New Dev Workflow" },
]

export default function AICodingAgentsIndex() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>
          <Link href="/" className="text-lg font-semibold text-white">Termote</Link>
        </div>
      </header>

      <main className="pt-16 pb-20">
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 mb-4">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">AI Coding Agents</h1>
            <p className="text-xl text-zinc-400">Learn how to use and control AI coding agents remotely from any device.</p>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.slug} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
                <h2 className="text-lg font-medium text-zinc-100 hover:text-white">
                  <Link href={`/blog/ai-coding-agents/${post.slug}`}>{post.title}</Link>
                </h2>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
