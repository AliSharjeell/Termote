import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Remote Access - SSH Alternatives & Browser-Based Terminal",
  description: "Discover browser-based remote terminal access solutions. Learn about SSH alternatives, bypassing firewalls, and accessing your PC from anywhere without VPN.",
  keywords: ["remote access", "ssh alternatives", "browser terminal", "access PC remotely", "no VPN remote access"],
  openGraph: {
    title: "Remote Access - SSH Alternatives & Guides",
    description: "The best guides for remote terminal access without SSH or VPN.",
  },
}

const posts = [
  { slug: "access-computer-remotely-without-ssh-vpn", title: "How to Access Your Computer Remotely Without SSH or VPN" },
  { slug: "port-22-blocked-ways-to-access-server", title: "Port 22 Blocked? 7 Ways to Access Your Server Anyway" },
  { slug: "best-ssh-alternatives-2026", title: "Best SSH Alternatives in 2026 (Tested & Compared)" },
  { slug: "access-pc-from-phone-no-apps", title: "How to Access Your PC From Your Phone (No Apps Required)" },
  { slug: "why-ssh-fails-corporate-networks", title: "Why SSH Fails on Corporate Networks (And How to Fix It)" },
  { slug: "remote-terminal-access-without-port-forwarding", title: "Remote Terminal Access Without Port Forwarding (Beginner Guide)" },
  { slug: "use-browser-as-full-terminal", title: "How to Use Your Browser as a Full Terminal (Step-by-Step)" },
  { slug: "tmux-vs-modern-web-terminals", title: "tmux vs Modern Web Terminals: Do You Still Need tmux?" },
  { slug: "access-localhost-from-anywhere-without-ngrok", title: "Access Your Localhost From Anywhere (Without Ngrok)" },
  { slug: "best-remote-development-tools-2026", title: "Best Remote Development Tools for Developers (2026)" },
  { slug: "bypass-firewalls-legally-development-work", title: "How to Bypass Firewalls Legally for Development Work" },
  { slug: "ssh-vs-https-tunnels-reliability", title: "SSH vs HTTPS Tunnels: What's More Reliable?" },
  { slug: "run-terminal-commands-on-pc-from-anywhere", title: "Run Terminal Commands on Your PC From Anywhere" },
  { slug: "monitor-long-running-jobs-remotely", title: "How to Monitor Long-Running Jobs Remotely" },
  { slug: "no-vpn-no-ssh-simplest-remote-access", title: "No VPN, No SSH: The Simplest Remote Access Setup Ever" },
  { slug: "why-mobile-ssh-clients-are-terrible", title: "Why Mobile SSH Clients Are Terrible (And What to Use Instead)" },
  { slug: "secure-remote-access-without-opening-ports", title: "How to Secure Remote Access Without Opening Ports" },
  { slug: "access-home-server-from-anywhere-behind-nat", title: "Access Your Home Server From Anywhere (Even Behind NAT)" },
  { slug: "best-tools-control-pc-from-anywhere", title: "Best Tools to Control Your PC From Anywhere" },
  { slug: "fixed-server-from-restaurant-using-phone", title: "How I Fixed My Server From a Restaurant Using My Phone" },
]

export default function RemoteAccessIndex() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>
          <Link href="/" className="text-lg font-semibold text-white">Termote</Link>
        </div>
      </header>

      <main className="pt-16 pb-20">
        <section className="py-20 px-4">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Remote Access</h1>
            <p className="text-xl text-zinc-400">Guides for accessing your terminal without SSH, VPN, or port forwarding.</p>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.slug} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all">
                <h2 className="text-lg font-medium text-zinc-100 hover:text-white">
                  <Link href={`/blog/remote-access/${post.slug}`}>{post.title}</Link>
                </h2>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
