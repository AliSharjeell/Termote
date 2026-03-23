import type { Metadata } from "next"
import { Terminal, Zap, Shield, Smartphone, LayoutGrid, CheckCircle2, Star, QrCode, Link2, Server, Lock, Globe, Github } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { InstallButton } from "@/components/InstallButton"

export const metadata: Metadata = {
  title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
  description: "Turn any browser into a full-powered, multi-pane terminal for your Windows PC. No SSH, no tmux, no setup. Termote punches through NATs and firewalls using encrypted WebSockets.",
  keywords: ["terminal", "web terminal", "remote access", "CLI", "multi-pane terminal", "tmux alternative", "browser terminal", "Windows terminal", "mobile terminal"],
  authors: [{ name: "Ali Sharjeel" }],
  openGraph: {
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    description: "Turn any browser into a full-powered, multi-pane terminal for your PC. No SSH, no tmux, no setup.",
    url: "https://termote.vercel.app",
    siteName: "Termote",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    creator: "@AliSharjeell",
  },
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

function UseCaseItem({ title, description, reverse = false }: {
  title: string
  description: string
  reverse?: boolean
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-8 items-center ${reverse ? "md:flex-row-reverse" : ""}`}>
      <div className={reverse ? "md:order-2" : ""}>
        <h3 className="text-xl font-semibold text-zinc-100 mb-3">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{description}</p>
      </div>
      <div className={`bg-zinc-800/50 border border-zinc-800 rounded-2xl aspect-video flex items-center justify-center ${reverse ? "md:order-1" : ""}`}>
        <span className="text-xs text-zinc-500">Use Case Image</span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 px-4">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Your local CLI,<br />anywhere.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-200 max-w-2xl mx-auto leading-relaxed">
              Turn any browser into a full-powered, multi-pane terminal for your PC — instantly. No SSH, no tmux, no setup.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <InstallButton />
              <a href="https://github.com/AliSharjeell/Termote" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-zinc-100 transition-colors">
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>

            {/* Hero Visual Placeholder */}
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

        {/* Why Not SSH */}
        <section className="py-20 px-4 border-t border-zinc-900">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-4">Why not SSH?</h2>
            <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">Termote solves problems SSH never could — without the headache.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 mb-4">
                  <Shield className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Bypass Firewalls</h3>
                <p className="text-sm text-zinc-400">Runs over Port 443 (HTTPS/WSS). Slices through aggressive corporate and school networks undetected.</p>
              </Card>

              <Card className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 mb-4">
                  <Smartphone className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Browser-Native</h3>
                <p className="text-sm text-zinc-400">No bulky SSH clients. Control your PC from your phone, iPad, or any browser with a responsive UI.</p>
              </Card>

              <Card className="p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 mb-4">
                  <LayoutGrid className="h-6 w-6 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Built-in Multiplexing</h3>
                <p className="text-sm text-zinc-400">Split, stack, and manage multiple panes directly in the UI. No tmux configuration required.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* 60-Second Setup */}
        <section id="setup" className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-900">
          <div className="mx-auto max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4">60-Second Setup</h2>
                <p className="text-zinc-400 mb-8">Zero friction. Go from zero to remote in under a minute.</p>

                <div className="space-y-4">
                  {[
                    { step: 1, text: "Run the install command in PowerShell" },
                    { step: 2, text: "Termote UI launches automatically" },
                    { step: 3, text: "Scan the QR code for mobile access" },
                    { step: 4, text: "Control your PC from anywhere" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-300">
                        {item.step}
                      </div>
                      <span className="text-zinc-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal Block */}
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
                    powershell -c &quot;irm https://raw.githubusercontent.com/AliSharjeell/Termote/master/install.ps1 | iex&quot;
                  </code>
                  <div className="mt-4">
                    <InstallButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features - Bento Box */}
        <section id="features" className="py-20 px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-4">Core Features</h2>
            <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">Everything you need for powerful remote terminal access.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BentoCard
                title="Anywhere, Any Network"
                description="Ditch VPNs and port forwarding. Termote punches through NATs and firewalls for instant access worldwide."
                icon={Globe}
                span="sm:col-span-2 lg:row-span-2"
              />
              <BentoCard
                title="Multi-Pane Terminal"
                description="Split, stack, and manage multiple panes in your browser. Like tmux, but visual."
                icon={Terminal}
              />
              <BentoCard
                title="Smart Single-Instance"
                description="Running termote in a new folder? Connects to your existing session."
                icon={Zap}
              />
              <BentoCard
                title="Zero-Install GUI"
                description="Any device with a browser becomes your command center."
                icon={Smartphone}
              />
              <BentoCard
                title="Runs on Your PC"
                description="Full host machine power with near-zero latency."
                icon={Server}
              />
              <BentoCard
                title="End-to-End Encrypted"
                description="HTTPS/WebSockets with Microsoft Dev Tunnels auth."
                icon={Lock}
              />
            </div>
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section id="use-cases" className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-900">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-4">Real-World Use Cases</h2>
            <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">See how developers use Termote in everyday scenarios.</p>

            <div className="space-y-20">
              <UseCaseItem
                title="The Mobile AI Agent Commander"
                description="Out for coffee but want your home rig working? Open Termote on your phone, spin up AutoGPT, monitor its thought process and give real-time corrections from your mobile browser."
              />
              <UseCaseItem
                title="The 'Dinner Emergency' Server Fix"
                description="Dev server crashed while you're out? Open Termote on your phone, run docker restart or pm2 reload, go right back to your meal."
                reverse
              />
              <UseCaseItem
                title="Monitor Heavy Jobs from the Couch"
                description="Kicked off a 4-hour compilation? Grab your iPad, head to the couch, watch progress in a live pane next to your Netflix stream."
              />
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="py-20 px-4 bg-zinc-900/50">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-12">Secure by default</h2>

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
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-12">Connecting Devices</h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                  <QrCode className="h-7 w-7 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">QR Code</h3>
                <p className="text-sm text-zinc-400">Scan the QR code in the web UI with your phone camera to instantly connect.</p>
              </Card>

              <Card className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                  <Link2 className="h-7 w-7 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">Share Link</h3>
                <p className="text-sm text-zinc-400">Copy your secure tunnel URL and password to share with any device.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Star CTA */}
        <section className="py-20 px-4 border-t border-zinc-900">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4">Ready to go remote?</h2>
            <p className="text-zinc-400 mb-8">Install Termote and access your terminal from anywhere.</p>

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
