"use client"

import { useState } from "react"
import { Menu, Github } from "lucide-react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
              <span className="font-mono text-sm text-zinc-300">&gt;_</span>
            </div>
            <span className="text-lg font-semibold text-zinc-100">Termote</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Features</a>
            <a href="#use-cases" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Use Cases</a>
            <a href="#setup" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Setup</a>
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
          <a href="#features" className="block text-sm text-zinc-400 hover:text-zinc-100">Features</a>
          <a href="#use-cases" className="block text-sm text-zinc-400 hover:text-zinc-100">Use Cases</a>
          <a href="#setup" className="block text-sm text-zinc-400 hover:text-zinc-100">Setup</a>
          <a href="https://github.com/AliSharjeell/Termote" className="block text-sm text-zinc-400 hover:text-zinc-100">GitHub</a>
        </div>
      )}
    </nav>
  )
}
