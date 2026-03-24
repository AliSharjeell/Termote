import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog - Termote News, Tips & Tutorials",
  description: "Read the latest Termote news, tutorials, and tips. Learn how to get the most out of your remote terminal, security best practices, and productivity tips.",
  keywords: ["termote blog", "terminal tips", "remote access tips", "web terminal tutorial", "SSH alternative", "terminal productivity"],
  openGraph: {
    title: "Termote Blog - Terminal Tips & News",
    description: "Tutorials, tips, and news about Termote and remote terminal access.",
  },
}

const posts = [
  {
    slug: "why-termote",
    title: "Why I Built Termote: An SSH Alternative",
    excerpt: "After years of dealing with SSH configuration, port forwarding, and VPN setup, I decided there had to be a better way to access my terminal from anywhere.",
    date: "2024-03-15",
    readTime: "5 min read",
    featured: true,
  },
  {
    slug: "2024/terminal-productivity-tips",
    title: "10 Terminal Productivity Tips",
    excerpt: "Whether you're using Termote or traditional SSH, these tips will help you get more done in less time at the command line.",
    date: "2024-03-10",
    readTime: "8 min read",
    featured: false,
  },
  {
    slug: "2024/security-best-practices",
    title: "Security Best Practices for Remote Terminal Access",
    excerpt: "Using a web-based terminal? Here's how to keep your sessions secure without sacrificing convenience.",
    date: "2024-03-05",
    readTime: "6 min read",
    featured: false,
  },
]

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link href="/" className="text-lg font-semibold text-white">Termote</Link>
        </div>
      </header>

      <main className="pt-16 pb-20">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Blog</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Tutorials, tips, and news about Termote and remote terminal access.
            </p>
          </div>
        </section>

        {/* Posts */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className={`p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all ${
                    post.featured ? "ring-1 ring-zinc-700" : ""
                  }`}
                >
                  {post.featured && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 mb-3">
                      Featured
                    </span>
                  )}
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2 hover:text-white transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-zinc-400 mb-4 leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span>Termote - Your Local CLI, Anywhere</span>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-zinc-300">Home</Link>
            <Link href="/features" className="hover:text-zinc-300">Features</Link>
            <Link href="/setup" className="hover:text-zinc-300">Setup</Link>
            <Link href="/blog" className="hover:text-zinc-300">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
