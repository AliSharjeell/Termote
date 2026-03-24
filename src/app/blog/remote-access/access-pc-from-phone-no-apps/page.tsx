import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "How to Access Your PC From Your Phone (No Apps Required) - Termote Blog",
  description: "Access your Windows PC terminal from your phone browser with no apps to install. Just open a URL and go.",
  keywords: ["access PC from phone", "phone remote access", "no app remote access", "browser PC access", "mobile terminal"],
  openGraph: {
    title: "Access Your PC From Your Phone (No Apps Required)",
    description: "Access your Windows PC terminal from your phone browser.",
  },
}

export default function AccessPCFromPhoneNoAppsPost() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16 pb-24">
        <div className="px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog/remote-access" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Remote Access
            </Link>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4">
          <header className="py-12 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                March 3, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                6 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              How to Access Your PC From Your Phone (No Apps Required)
            </h1>
            <p className="text-lg text-zinc-400">
              You are away from your desk and need your PC. Your phone is all you have. Here is how to access it without installing anything.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                You are at a friend&apos;s house and someone asks a question about that project you are working on. You know the answer is on your PC back home, in a terminal window you left open. But all you have is your phone.
              </p>

              <p>
                Traditional remote access solutions require apps: RDP clients, SSH apps, VNC viewers. But there is a simpler way that requires nothing on your phone except a browser.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Browser-Based Approach</h2>

              <p>
                Instead of installing remote access apps, you access your PC through a browser. The concept:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Your PC runs special software</strong> - This creates an encrypted tunnel to the internet</li>
                <li><strong>The software provides a URL</strong> - Like https://xyz123.task Termote.dev</li>
                <li><strong>You open that URL in your phone browser</strong> - And see your PC&apos;s terminal</li>
              </ul>

              <p>
                No apps. No configuration. Just a URL that works.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What You Need on Your PC</h2>

              <p>
                Install Termote on your Windows PC. When you run it, it:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                <li>Creates a secure tunnel from your PC to Microsoft&apos;s infrastructure</li>
                <li>Generates a unique HTTPS URL</li>
                <li>Serves your terminal through that URL</li>
              </ol>

              <p>
                The process takes about 30 seconds after installation.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What You Can Do From Your Phone</h2>

              <p>
                Through your phone browser you can:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Run terminal commands</strong> - Execute anything you could from your keyboard</li>
                <li><strong>Check running processes</strong> - See what is active on your machine</li>
                <li><strong>View logs and output</strong> - Scroll through terminal history</li>
                <li><strong>Start or stop services</strong> - Control your running applications</li>
                <li><strong>Access AI coding agents</strong> - Claude Code, Codex CLI, anything terminal-based</li>
              </ul>

              <p>
                The browser interface is touch-friendly, with buttons for common actions and a keyboard that appears when you tap input areas.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What You Cannot Do</h2>

              <p>
                Being honest about limitations:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>No graphical applications</strong> - This is terminal access, not desktop view</li>
                <li><strong>Typing is slower</strong> - Mobile keyboards are not ideal for coding</li>
                <li><strong>No drag and drop</strong> - File operations are command-line only</li>
                <li><strong>No clipboard integration</strong> - Copy-paste works but is more cumbersome</li>
              </ul>

              <p>
                This is for terminal tasks, not replacing your desktop workflow.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Quick Access Tips</h2>

              <p>
                <strong>Bookmark the URL.</strong> Once Termote gives you a URL, bookmark it in your phone&apos;s browser. You can return to your session instantly.
              </p>

              <p>
                <strong>Generate a QR code.</strong> Termote can show a QR code. Scan it with your phone camera to open the URL without typing.
              </p>

              <p>
                <strong>Keep Termote running.</strong> If you close Termote on your PC, the URL stops working. Keep it running in the background.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Security</h2>

              <p>
                The tunnel is encrypted end-to-end. Only you can access your session because:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>The URL is unique and cryptographically random</li>
                <li>Microsoft manages the authentication</li>
                <li>No ports are opened on your firewall</li>
                <li>Your PC is not directly reachable from the internet</li>
              </ul>

              <p>
                This is actually more secure than traditional port forwarding.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Access your PC from anywhere using just your browser. No apps required.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors">
                  Get Started with Termote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
