import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, LayoutGrid, Calendar, Clock } from "lucide-react"
import { getPostsByCategory } from "@/lib/posts"

export const metadata: Metadata = {
  title: "Terminal Productivity - Organize Panes, Groups & Multi-Terminal Workflows",
  description: "Master terminal productivity with multi-pane workflows, organization tips, and modern terminal management. Stop juggling tabs and build a clean dev workspace.",
  keywords: ["terminal productivity", "organize terminal", "multiple terminals", "tmux alternative", "terminal workflow"],
  openGraph: {
    title: "Terminal Productivity - Multi-Pane Workflows",
    description: "Build a clean, organized terminal workflow with multi-pane layouts.",
  },
}

export default function TerminalProductivityIndex() {
  const posts = getPostsByCategory("terminal-productivity")

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

          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                  terminal productivity
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
