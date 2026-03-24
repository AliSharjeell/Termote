import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, Clock, Terminal, Globe, LayoutGrid } from "lucide-react"
import { posts, categories, getFeaturedPost, getNonFeaturedPosts } from "@/lib/posts"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Blog - Termote News, Tips & Tutorials",
  description: "Read the latest Termote news, tutorials, and tips. Learn how to get the most out of your remote terminal, security best practices, and productivity tips.",
  keywords: ["termote blog", "terminal tips", "remote access tips", "web terminal tutorial", "SSH alternative", "terminal productivity"],
  openGraph: {
    title: "Termote Blog - Terminal Tips & News",
    description: "Tutorials, tips, and news about Termote and remote terminal access.",
  },
}

export default function BlogIndexPage() {
  const featuredPost = getFeaturedPost()
  const allPosts = getNonFeaturedPosts()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

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

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-10 px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Featured</h2>
              <Link href={`/blog/${featuredPost.slug}`}>
                <article className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all ring-1 ring-zinc-700 cursor-pointer">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 mb-3">
                    Featured
                  </span>
                  <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                    {featuredPost.title}
                  </h3>
                  <p className="text-zinc-400 mb-4 leading-relaxed">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date && new Date(featuredPost.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Categories</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {categories.map((category) => {
                const Icon = category.slug === "ai-coding-agents" ? Terminal
                  : category.slug === "remote-access" ? Globe
                  : LayoutGrid
                const postCount = posts.filter((p) => p.category === category.slug).length
                return (
                  <Link
                    key={category.slug}
                    href={category.href}
                    className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                        <Icon className="h-5 w-5 text-zinc-400" />
                      </div>
                      <span className="text-xs text-zinc-500">{postCount} posts</span>
                    </div>
                    <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">{category.description}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* All Posts */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">All Posts</h2>
            <div className="space-y-6">
              {allPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <article className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                      {post.category.replace("-", " ")}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100 mb-2">
                      {post.title}
                    </h3>
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
                </Link>
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
