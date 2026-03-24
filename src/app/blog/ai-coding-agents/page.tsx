import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Terminal, Calendar, Clock } from "lucide-react"
import { getPostsByCategory } from "@/lib/posts"

export const metadata: Metadata = {
  title: "AI Coding Agents - Terminal-Based AI Tools & Remote Access",
  description: "Learn how to use AI coding agents like Claude Code remotely. Setup guides, workflows, and tips for controlling AI agents from anywhere using your browser.",
  keywords: ["ai coding agents", "claude code remote", "codex cli", "ai agent workflow", "remote ai coding"],
  openGraph: {
    title: "AI Coding Agents - Remote Access Guides",
    description: "Master remote AI coding workflows with terminal-based agents.",
  },
}

export default function AICodingAgentsIndex() {
  const posts = getPostsByCategory("ai-coding-agents")

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

          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                  ai coding agents
                </div>
                <h2 className="text-lg font-medium text-zinc-100 hover:text-white transition-colors mb-2">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                {post.excerpt && (
                  <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  {post.date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {post.readTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
