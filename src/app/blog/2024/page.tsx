import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "2024 Archives - Termote Blog",
  description: "Browse all Termote blog posts from 2024.",
}

export default function Blog2024Page() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>
          <Link href="/" className="text-lg font-semibold text-white">Termote</Link>
        </div>
      </header>

      <main className="pt-16 pb-20">
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-white mb-6">2024 Archives</h1>
            <p className="text-zinc-400">All posts from 2024 coming soon.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
