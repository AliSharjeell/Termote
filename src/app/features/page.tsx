import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Globe, Terminal, Zap, Smartphone, Server, Lock, LayoutGrid, Shield, Wifi } from "lucide-react"

export const metadata: Metadata = {
  title: "Features - Multi-Pane Web Terminal for Windows",
  description: "Discover Termote's features: anywhere access, multi-pane terminal, smart single-instance, zero-install GUI, end-to-end encryption, and firewall bypass. The ultimate SSH alternative.",
  keywords: ["terminal features", "web terminal features", "multi-pane terminal", "tmux alternative", "browser terminal", "SSH alternative", "remote terminal features"],
  openGraph: {
    title: "Termote Features - Your Terminal, Everywhere",
    description: "Powerful features: multi-pane terminal, NAT traversal, encrypted WebSockets, and more. No SSH client needed.",
  },
}

const features = [
  {
    icon: Globe,
    title: "Anywhere, Any Network",
    description: "Ditch VPNs and port forwarding. Termote securely punches through NATs and firewalls, giving you instant access to your machine whether you are on the same Wi-Fi or halfway across the world.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: LayoutGrid,
    title: "Multi-Pane Terminal",
    description: "Don't limit yourself to one screen. Split, stack, and manage multiple terminal panes simultaneously right in your browser. Like tmux, but visual.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Smart Single-Instance",
    description: "Already have Termote running? Typing 'termote' in a new local folder or clicking 'Open with Termote' won't spawn a redundant server. It intelligently connects to your active session.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Smartphone,
    title: "Zero-Install Browser GUI",
    description: "Forget downloading bulky SSH clients on your phone or tablet. Any device with a browser becomes your command center with a beautiful, responsive UI.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Server,
    title: "Runs on Your PC",
    description: "You get the full unchained power of your host machine's CLI. Whatever your host PC can do, you can do remotely with near-zero latency. No cloud, no lag.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    description: "Your terminal sessions are wrapped in encrypted WebSockets over HTTPS. Authentication via Microsoft Dev Tunnels ensures only you can access your machine.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Bypasses Firewalls",
    description: "Runs over Port 443 (HTTPS/WSS). Slices through aggressive corporate and school networks undetected. No special network configuration needed.",
    color: "from-zinc-500 to-stone-500",
  },
  {
    icon: Wifi,
    title: "No Port Forwarding",
    description: "Unlike SSH, you don't need to configure your router or firewall. Termote handles the connection through Microsoft's infrastructure.",
    color: "from-teal-500 to-cyan-500",
  },
]

export default function FeaturesPage() {
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
              Features that make SSH obsolete
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Termote is packed with everything you need for powerful remote terminal access — without the SSH headache.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-100 mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-zinc-100 mb-12">
              Termote vs SSH
            </h2>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Feature</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">SSH</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Termote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <tr>
                    <td className="px-6 py-4 text-sm text-zinc-300">Port forwarding</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">Required</td>
                    <td className="px-6 py-4 text-sm text-green-400">Not needed</td>
                  </tr>
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-sm text-zinc-300">VPN setup</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">Often needed</td>
                    <td className="px-6 py-4 text-sm text-green-400">Not needed</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-zinc-300">Mobile support</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">Poor</td>
                    <td className="px-6 py-4 text-sm text-green-400">Excellent</td>
                  </tr>
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-sm text-zinc-300">Multi-pane UI</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">tmux/screen config</td>
                    <td className="px-6 py-4 text-sm text-green-400">Built-in</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-zinc-300">Firewall bypass</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">Port 22 blocked</td>
                    <td className="px-6 py-4 text-sm text-green-400">Port 443</td>
                  </tr>
                  <tr className="bg-zinc-900/50">
                    <td className="px-6 py-4 text-sm text-zinc-300">Visual interface</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">CLI only</td>
                    <td className="px-6 py-4 text-sm text-green-400">Modern GUI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">Ready to experience the difference?</h2>
            <p className="text-zinc-400 mb-8">Get started in under 60 seconds.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
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
