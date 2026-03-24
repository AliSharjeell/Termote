"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Terminal, Zap, Shield, Smartphone, LayoutGrid, CheckCircle2, Star, QrCode, Link2, Server, Lock, Globe, Github, X, Loader2, TerminalSquare, ZapOff, Users } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { InstallButton } from "@/components/InstallButton"

function ConnectForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Tunnel URL is required")
      return
    }
    if (!token.trim()) {
      setError("Token is required")
      return
    }

    setIsLoading(true)

    try {
      let tunnelUrl = url.trim()
      try {
        tunnelUrl = decodeURIComponent(tunnelUrl)
      } catch {
        // Already decoded, use as-is
      }

      const encodedUrl = encodeURIComponent(tunnelUrl)
      router.push(`/dashboard?tunnel=${encodedUrl}&token=${encodeURIComponent(token.trim())}`)
    } catch {
      setError("Failed to connect. Please check your URL and token.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 w-full max-w-md mx-auto transition-all duration-300 ease-out">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="tunnel-url" className="block text-sm font-medium text-zinc-300 text-left pl-1">
            Tunnel URL
          </label>
          <input
            id="tunnel-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://xxxxx-xxxx.devtunnels.ms"
            autoFocus
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all text-sm font-mono"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="token" className="block text-sm font-medium text-zinc-300 text-left pl-1">
            Access Token
          </label>
          <div className="relative">
            <input
              id="token"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all text-sm font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showToken ? <Lock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            onClick={handleConnect}
            className="flex-1 py-2.5 px-4 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <TerminalSquare className="h-4 w-4" />
                Establish Connection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Card({ className = "", children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 ${className}`}>
      {children}
    </div>
  )
}

function BentoCard({ title, description, icon: Icon, span = "" }: {
  title: string
  description: string
  icon: typeof Globe
  span?: string
}) {
  return (
    <div className={`group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 ${span}`}>
      <div className="flex flex-col h-full">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 group-hover:border-zinc-600 transition-colors">
          <Icon className="h-5 w-5 text-zinc-400" />
        </div>
        <h3 className="text-base font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function UseCaseItem({ title, description, reverse = false, emoji }: {
  title: string
  description: string
  reverse?: boolean
  emoji: string
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 items-center ${reverse ? "md:flex-row-reverse" : ""}`}>
      <div className={reverse ? "md:order-2" : ""}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{emoji}</span>
          <h3 className="text-xl font-semibold text-zinc-100">{title}</h3>
        </div>
        <p className="text-zinc-400 leading-relaxed">{description}</p>
      </div>
      <div className={`bg-zinc-800/50 border border-zinc-800 rounded-2xl aspect-video flex items-center justify-center ${reverse ? "md:order-1" : ""}`}>
        <span className="text-xs text-zinc-500">Demo coming soon</span>
      </div>
    </div>
  )
}

export function LandingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showConnectForm, setShowConnectForm] = useState(false)

  useEffect(() => {
    const tunnelParam = searchParams.get("tunnel")
    const tokenParam = searchParams.get("token")

    if (tunnelParam && tokenParam) {
      const decodedUrl = decodeURIComponent(tunnelParam)
      const encodedUrl = encodeURIComponent(decodedUrl)
      router.push(`/dashboard?tunnel=${encodedUrl}&token=${encodeURIComponent(tokenParam)}`)
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 px-4">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Your Entire Dev Environment.<br />In a Browser. Anywhere.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-200 max-w-2xl mx-auto leading-relaxed">
              Turn any browser into a multi-pane command center for your PC. Manage full-stack apps and AI agents in one clean workspace — no SSH, no VPN, no setup.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <InstallButton />
              <button
                onClick={() => setShowConnectForm(!showConnectForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-zinc-100 transition-colors"
              >
                <Link2 className="h-4 w-4" />
                Connect to Terminal
              </button>
            </div>

            {/* Killer line */}
            <p className="mt-6 text-sm text-zinc-500 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Works on restricted networks — even when SSH is blocked
            </p>

            {/* Inline Connect Form */}
            <div className={`grid transition-all duration-300 ease-out ${showConnectForm ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <ConnectForm onCancel={() => setShowConnectForm(false)} />
              </div>
            </div>

            {/* Hero Visual */}
            <div className="mt-16 mx-auto max-w-4xl">
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 aspect-video shadow-2xl shadow-zinc-950/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="flex h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="flex h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-sm text-zinc-500">Termote Web UI Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-8 px-4 border-t border-zinc-900/50">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm text-zinc-500 mb-4">Built for developers who run AI coding agents</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No account required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Free & open source
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                60-second setup
              </span>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-4 border-t border-zinc-900">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Your terminal setup is a mess.
              </h2>
              <p className="text-lg text-zinc-400">Building modern apps is hard enough without fighting your tools.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: LayoutGrid, text: "8 terminal windows fighting for space" },
                { icon: Server, text: "Frontend, backend, logs scattered everywhere" },
                { icon: Zap, text: "AI agents running… but you can't monitor them remotely" },
                { icon: ZapOff, text: "SSH blocked exactly when you need it most" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <item.icon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-900">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-medium text-yellow-500 uppercase tracking-wider mb-4">The Solution</p>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              One workspace. Zero chaos.
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-12">
              Turn chaos into a beautifully designed, streamlined command center. Termote is a browser-native workspace built to give you total control.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <LayoutGrid className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Organized Workspace</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Multi-pane terminal (no tmux needed)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Group tabs by project
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Rename & search sessions
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <Globe className="h-8 w-8 text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Access Anywhere</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Works over HTTPS (port 443)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    No firewall or NAT issues
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    QR code mobile access
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <Terminal className="h-8 w-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Built for AI Agents</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Run Claude Code / Codex CLI
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Monitor logs in real-time
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    Control agents from your phone
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section id="use-cases" className="py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Real-World Use Cases
            </h2>
            <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
              See how developers actually use Termote in the wild.
            </p>

            <div className="space-y-16">
              <UseCaseItem
                emoji="🍽️"
                title="Fix production in 30 seconds — from your phone"
                description="Your dev server crashes while you're out grabbing dinner. Instead of rushing home, pull out your phone, open Termote, run docker restart, and get right back to your meal."
              />
              <UseCaseItem
                emoji="🧠"
                title="Control AI agents while you're outside"
                description="Kick off a heavy Claude Code refactor on your home rig. Head out, monitor the agent's thought process in real-time, give corrections and approve commands from your mobile browser."
                reverse
              />
              <UseCaseItem
                emoji="🛋️"
                title="Monitor builds without sitting at your desk"
                description="Kicked off a massive build or a 4-hour compilation? Grab your tablet, head to the couch, and watch progress in a live pane right next to your Netflix stream."
              />
            </div>
          </div>
        </section>

        {/* 60-Second Setup */}
        <section id="setup" className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-900">
          <div className="mx-auto max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  60-Second Setup
                </h2>
                <p className="text-lg text-zinc-400 mb-8">
                  From install → remote access in under 60 seconds.
                </p>

                <div className="space-y-4">
                  {[
                    { step: 1, text: "Run the install command in PowerShell" },
                    { step: 2, text: "Termote UI launches automatically" },
                    { step: 3, text: "Scan the QR code for mobile access" },
                    { step: 4, text: "Control your PC from anywhere" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-sm font-semibold text-white">
                        {item.step}
                      </div>
                      <span className="text-zinc-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 text-xs text-zinc-500">powershell</span>
                </div>
                <div className="p-4">
                  <code className="text-sm text-zinc-300 font-mono block">
                    powershell -c "irm https://raw.githubusercontent.com/AliSharjeell/Termote/master/install.ps1 | iex"
                  </code>
                  <div className="mt-4">
                    <InstallButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Not SSH */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                SSH wasn't built for today's workflows.
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Termote solves problems SSH never could — without the headache.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-800 mb-12">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-500">SSH</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Termote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-sm text-zinc-300">Works on restricted networks</td>
                    <td className="px-6 py-4 text-center text-lg">❌</td>
                    <td className="px-6 py-4 text-center text-lg">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-zinc-300">Mobile friendly</td>
                    <td className="px-6 py-4 text-center text-lg">❌</td>
                    <td className="px-6 py-4 text-center text-lg">✅</td>
                  </tr>
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-sm text-zinc-300">Multi-pane UI built-in</td>
                    <td className="px-6 py-4 text-center text-lg">❌</td>
                    <td className="px-6 py-4 text-center text-lg">✅</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-zinc-300">Setup time</td>
                    <td className="px-6 py-4 text-center text-sm text-zinc-500">Painful</td>
                    <td className="px-6 py-4 text-center text-sm text-green-400">60 sec</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <Shield className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Bypass Firewalls</h3>
                <p className="text-sm text-zinc-400">Runs over Port 443 (HTTPS/WSS). Slices through aggressive networks undetected.</p>
              </Card>
              <Card className="p-6 text-center">
                <Lock className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">End-to-End Encrypted</h3>
                <p className="text-sm text-zinc-400">Auth via Microsoft Dev Tunnels. Your commands never leave your local environment.</p>
              </Card>
              <Card className="p-6 text-center">
                <Zap className="h-10 w-10 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Smart Single-Instance</h3>
                <p className="text-sm text-zinc-400">Running in a new folder? Connects to your existing session automatically.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="py-20 px-4 bg-zinc-900/50">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white mb-12">Secure by default</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-sm text-zinc-300">End-to-end encrypted</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-sm text-zinc-300">Auth via MS Dev Tunnels</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-sm text-zinc-300">No command logging</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-sm text-zinc-300">Runs strictly locally</span>
              </div>
            </div>
          </div>
        </section>

        {/* Connecting Devices */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-white mb-12">Connecting Devices</h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                  <QrCode className="h-7 w-7 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">QR Code</h3>
                <p className="text-sm text-zinc-400">Scan the QR code with your phone camera to instantly connect.</p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                  <Link2 className="h-7 w-7 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Share Link</h3>
                <p className="text-sm text-zinc-400">Copy your tunnel URL and password to share with any device.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 border-t border-zinc-900">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stop juggling terminals.<br />Start controlling them.
            </h2>
            <p className="text-zinc-400 mb-8">
              Install Termote and access your terminal from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <InstallButton />
              <a href="https://github.com/AliSharjeell/Termote" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-100 text-zinc-900 text-sm hover:bg-zinc-200 transition-colors">
                <Star className="h-4 w-4" />
                Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="text-sm font-medium text-zinc-400">Termote</span>

            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://github.com/AliSharjeell/Termote/issues" target="_blank" rel="noopener noreferrer"
                 className="hover:text-zinc-300 transition-colors">Issues</a>
              <a href="mailto:alisharjeelofficial@gmail.com" className="hover:text-zinc-300 transition-colors">Contact</a>
              <a href="https://termote.vercel.app" target="_blank" rel="noopener noreferrer"
                 className="hover:text-zinc-300 transition-colors">Web Client</a>
            </div>

            <p className="text-sm text-zinc-600">Licensed under MIT</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}
