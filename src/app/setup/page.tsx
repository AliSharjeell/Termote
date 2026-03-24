import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Download, RefreshCw, QrCode, Link2, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Setup Guide - Install Termote in 60 Seconds",
  description: "Complete setup guide for Termote. Install on Windows, connect devices via QR code or share link, and access your terminal from anywhere. No SSH or port forwarding required.",
  keywords: ["termote setup", "install termote", "web terminal setup", "remote terminal windows", "terminal anywhere setup", "termote installation guide"],
  openGraph: {
    title: "Termote Setup - 60 Second Installation",
    description: "Zero friction. Go from zero to remote terminal in under a minute.",
  },
}

export default function SetupPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              60-Second Setup
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Zero friction. Go from zero to remote terminal in under a minute.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-semibold">
                  1
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Run the install command</h2>
                  <p className="text-zinc-400 mb-4">Open PowerShell on your Windows machine and run:</p>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 overflow-x-auto">
                    <code className="text-sm text-green-400 font-mono whitespace-pre">
powershell -c "irm https://raw.githubusercontent.com/AliSharjeell/Termote/master/install.ps1 | iex"
                    </code>
                  </div>
                  <p className="text-sm text-zinc-500 mt-3">
                    This will install Rust (if needed), Microsoft Dev Tunnels CLI, and Termote.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-semibold">
                  2
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Authenticate with Microsoft</h2>
                  <p className="text-zinc-400">
                    On your first run, a browser window will open asking you to sign in with your Microsoft account.
                    This is required by Microsoft Dev Tunnels to create secure tunnels. It's a one-time setup.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-semibold">
                  3
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Termote UI launches</h2>
                  <p className="text-zinc-400">
                    The Termote dashboard opens automatically in your browser. You'll see your tunnel URL and access token.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-semibold">
                  4
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">Connect devices</h2>
                  <p className="text-zinc-400 mb-4">
                    Scan the QR code with your phone or share the link with other devices to access your terminal from anywhere.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-5 w-5 text-zinc-400" />
                        <h3 className="font-medium text-zinc-200">QR Code</h3>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Scan with your phone camera to instantly connect.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-5 w-5 text-zinc-400" />
                        <h3 className="font-medium text-zinc-200">Share Link</h3>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Copy the tunnel URL and password to share with any device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prerequisites */}
        <section className="py-16 px-4 bg-zinc-900/30 border-y border-zinc-800">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Prerequisites</h2>
            <ul className="space-y-3">
              {[
                "Windows 10 or Windows 11",
                "PowerShell 5.1 or later",
                "Internet connection",
                "Microsoft account (for Dev Tunnels authentication)",
              ].map((req) => (
                <li key={req} className="flex items-center gap-3 text-zinc-400">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Troubleshooting</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <h3 className="font-medium text-zinc-200 mb-2 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Command not found after installation
                </h3>
                <p className="text-sm text-zinc-400 mb-2">
                  Restart your terminal or run:
                </p>
                <code className="text-sm text-green-400 font-mono">
                  $env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                </code>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <h3 className="font-medium text-zinc-200 mb-2">Dev Tunnels authentication failed</h3>
                <p className="text-sm text-zinc-400">
                  Run <code className="text-green-400">devtunnel user login -g</code> in your terminal to re-authenticate.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <h3 className="font-medium text-zinc-200 mb-2">Tunnel URL not accessible</h3>
                <p className="text-sm text-zinc-400">
                  Make sure your firewall allows outbound HTTPS (port 443). Corporate networks may block some tunnel types.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">Ready to get started?</h2>
            <p className="text-zinc-400 mb-8">
              Install Termote and access your terminal from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                Install Termote
              </Link>
              <a
                href="https://github.com/AliSharjeell/Termote"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </a>
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
