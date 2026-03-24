"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Github } from "lucide-react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-lg font-semibold text-zinc-100 hover:text-white transition-colors">Termote</Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Features</Link>
            <Link href="/use-cases" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Use Cases</Link>
            <Link href="/setup" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Setup</Link>
            <Link href="/blog" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Blog</Link>
            <a href="https://github.com/AliSharjeell/Termote" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-zinc-100 transition-colors">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-zinc-400 hover:text-zinc-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <Link href="/features" className="block text-sm text-zinc-400 hover:text-zinc-100">Features</Link>
          <Link href="/use-cases" className="block text-sm text-zinc-400 hover:text-zinc-100">Use Cases</Link>
          <Link href="/setup" className="block text-sm text-zinc-400 hover:text-zinc-100">Setup</Link>
          <Link href="/blog" className="block text-sm text-zinc-400 hover:text-zinc-100">Blog</Link>
          <a href="https://github.com/AliSharjeell/Termote" className="block text-sm text-zinc-400 hover:text-zinc-100">GitHub</a>
        </div>
      )}
    </nav>
  )
}
