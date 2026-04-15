import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Globe, Calendar, Clock } from "lucide-react"
import { getPostsByCategory } from "@/lib/posts"
import { Navbar } from "@/components/Navbar"
import { isTauriBuild } from "@/lib/tauriDetect"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Remote Access - SSH Alternatives & Browser-Based Terminal",
  description: "Discover browser-based remote terminal access solutions. Learn about SSH alternatives, bypassing firewalls, and accessing your PC from anywhere without VPN.",
  keywords: ["remote access", "ssh alternatives", "browser terminal", "access PC remotely", "no VPN remote access"],
  openGraph: {
    title: "Remote Access - SSH Alternatives & Guides",
    description: "The best guides for remote terminal access without SSH or VPN.",
  },
}

export default function RemoteAccessIndex() {
  if (isTauriBuild()) redirect("/")
  const posts = getPostsByCategory("remote-access")

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16 pb-24">
        {/* Back Button */}
        <div className="px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Remote Access</h1>
            <p className="text-xl text-zinc-400">Guides for accessing your terminal without SSH, VPN, or port forwarding.</p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="space-y-10">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <article className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-2">
                      remote access
                    </div>
                    <h2 className="text-lg font-medium text-zinc-100 mb-2">
                      {post.title}
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
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
