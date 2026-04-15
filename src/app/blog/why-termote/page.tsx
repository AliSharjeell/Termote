import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { isTauriBuild } from "@/lib/tauriDetect"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Why I Built Termote: An SSH Alternative - Termote Blog",
  description: "After years of dealing with SSH configuration, port forwarding, and VPN setup, I decided there had to be a better way to access my terminal from anywhere. Here's why I built Termote.",
  keywords: ["SSH alternative", "terminal access", "remote work", "web terminal", "developer tools", "port forwarding problems"],
  openGraph: {
    title: "Why I Built Termote: An SSH Alternative",
    description: "The story behind Termote and why traditional SSH solutions fall short.",
  },
}

export default function WhyTermotePost() {
  if (isTauriBuild()) redirect("/")
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16 pb-24">
        {/* Back Button */}
        <div className="px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
        <article className="mx-auto max-w-3xl px-4">
          {/* Post Header */}
          <header className="py-12 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                March 15, 2024
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                5 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Why I Built Termote: An SSH Alternative
            </h1>
            <p className="text-lg text-zinc-400">
              After years of dealing with SSH configuration, port forwarding, and VPN setup, I decided there had to be a better way.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                It was a Friday evening. I was at a restaurant with friends when my phone buzzed — an alert that my home server was down. No big deal, I thought. I'll just SSH in and fix it.
              </p>

              <p>
                Except I couldn't. I was on a restaurant's WiFi that blocked outbound SSH (port 22). I tried my phone's hotspot, but my home network's NAT was preventing me from connecting. No port forwarding, no VPN running. I was stuck.
              </p>

              <p>
                I ended up driving home, fixing the server manually, and driving back. That 45-minute round trip got me thinking: <em>why is this so hard?</em>
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Problem with SSH</h2>

              <p>
                SSH is over 25 years old. It's reliable, secure, and powerful — but it's not designed for the modern world where:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Corporate firewalls aggressively block port 22</li>
                <li>Home internet connections often lack static IPs</li>
                <li>Port forwarding is a security risk and a configuration headache</li>
                <li>Mobile SSH clients are clunky and touch-unfriendly</li>
                <li>Multiple terminal panes require additional tools like tmux</li>
              </ul>

              <p>
                And don't get me started on VPN setup. Between configuring servers, clients, certificates, and routing tables, you're looking at an afternoon just to access your own machine.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Realization</h2>

              <p>
                Here's what I realized: the browser is the universal UI. It works on phones, tablets, laptops — anything with a screen and an internet connection. And browsers don't have issues with firewalls because they use standard HTTPS (port 443).
              </p>

              <p>
                So why not wrap terminal sessions in WebSockets over HTTPS? The terminal experience I wanted, accessible from any device, through any network.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Building Termote</h2>

              <p>
                Termote started as a weekend project. The core idea was simple:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Run a local server on your Windows machine</li>
                <li>Create an encrypted tunnel using Microsoft Dev Tunnels</li>
                <li>Serve a web-based terminal UI over HTTPS</li>
                <li>Support multiple panes natively (no tmux required)</li>
              </ul>

              <p>
                The tricky part was making it zero-configuration. I didn't want users to have to configure firewalls, set up port forwarding, or manage certificates. Microsoft Dev Tunnels handled the tunnel creation and authentication — I just had to build the terminal interface.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What Makes Termote Different</h2>

              <p>
                Unlike other solutions, Termote:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Works immediately</strong> — No account creation, no server setup</li>
                <li><strong>Uses standard HTTPS</strong> — No firewall configuration needed</li>
                <li><strong>Has a modern UI</strong> — Multi-pane support built-in, mobile-friendly</li>
                <li><strong>Runs locally</strong> — Your data never touches the cloud</li>
                <li><strong>Authenticates via Microsoft</strong> — Leverages their security infrastructure</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Future</h2>

              <p>
                Termote is now my daily driver. Whether I'm at a coffee shop, traveling, or just too lazy to walk to my desk, I can access my terminal from any device.
              </p>

              <p>
                I'm excited to see how others use it. If you've ever been stuck without terminal access, you understand the value. And if you haven't — well, I hope you never have to drive 45 minutes to fix a server.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Ready to experience the difference? Termote is free and open source.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 mt-20">
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
