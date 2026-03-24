import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, LayoutGrid } from "lucide-react"

export const metadata: Metadata = {
  title: "Terminal Productivity - Organize Panes, Groups & Multi-Terminal Workflows",
  description: "Master terminal productivity with multi-pane workflows, organization tips, and modern terminal management. Stop juggling tabs and build a clean dev workspace.",
  keywords: ["terminal productivity", "organize terminal", "multiple terminals", "tmux alternative", "terminal workflow"],
  openGraph: {
    title: "Terminal Productivity - Multi-Pane Workflows",
    description: "Build a clean, organized terminal workflow with multi-pane layouts.",
  },
}

const posts = [
  { slug: "manage-multiple-terminals-without-losing-mind", title: "How to Manage Multiple Terminals Without Losing Your Mind" },
  { slug: "frontend-backend-ai-agents-one-terminal-workspace", title: "Frontend, Backend, and AI Agents — All in One Terminal Workspace" },
  { slug: "stop-using-10-terminal-tabs", title: "Stop Using 10 Terminal Tabs — Do This Instead" },
  { slug: "best-way-organize-terminal-full-stack-development", title: "Best Way to Organize Your Terminal for Full-Stack Development" },
  { slug: "tmux-is-powerful-but-also-mess", title: "tmux Is Powerful — But It's Also a Mess" },
  { slug: "better-way-handle-multiple-terminals-no-tmux", title: "A Better Way to Handle Multiple Terminals (No tmux Needed)" },
  { slug: "run-monitor-multiple-processes-at-once", title: "How to Run and Monitor Multiple Processes at Once" },
  { slug: "cleanest-terminal-setup-developers-2026", title: "The Cleanest Terminal Setup for Developers in 2026" },
  { slug: "why-terminal-workflow-feels-chaotic", title: "Why Your Terminal Workflow Feels Chaotic (And How to Fix It)" },
  { slug: "group-rename-search-missing-terminal-features", title: "Group, Rename, Search: The Missing Features in Most Terminals" },
  { slug: "track-logs-servers-builds-one-screen", title: "How to Track Logs, Servers, and Builds in One Screen" },
  { slug: "run-frontend-backend-database-one-view", title: "Run Frontend, Backend, and Database in One View" },
  { slug: "problem-with-terminal-tabs-panes-better", title: "The Problem With Terminal Tabs (And Why Panes Are Better)" },
  { slug: "stay-organized-running-ai-coding-agents", title: "How to Stay Organized While Running AI Coding Agents" },
  { slug: "control-multiple-ai-agents-one-dashboard", title: "Control Multiple AI Agents From One Dashboard" },
  { slug: "terminal-is-mess-heres-how-fix-it", title: "Your Terminal Is a Mess — Here's How to Fix It" },
  { slug: "build-unified-dev-workspace-without-heavy-ide", title: "How to Build a Unified Dev Workspace (Without a Heavy IDE)" },
  { slug: "minimalist-developer-setup-everything-one-terminal-ui", title: "Minimalist Developer Setup: Everything in One Terminal UI" },
  { slug: "switch-less-build-more-context-switching", title: "Switch Less, Build More: Fixing Context Switching in Dev Workflows" },
  { slug: "from-8-terminal-windows-to-one-clean-dashboard", title: "From 8 Terminal Windows to One Clean Dashboard" },
]

export default function TerminalProductivityIndex() {
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
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
              <LayoutGrid className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Terminal Productivity</h1>
            <p className="text-xl text-zinc-400">Organize your workflow with multi-pane layouts, groups, and clean dashboards.</p>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.slug} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
                <h2 className="text-lg font-medium text-zinc-100 hover:text-white">
                  <Link href={`/blog/terminal-productivity/${post.slug}`}>{post.title}</Link>
                </h2>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
