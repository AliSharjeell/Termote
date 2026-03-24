import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "How to Use AI Coding Agents From Your Phone - Termote Blog",
  description: "Turn your phone into a powerful AI coding workstation. Learn how to access and control AI coding agents from a mobile browser with a touch-friendly interface.",
  keywords: ["mobile AI coding", "phone coding agent", "AI coding on mobile", "remote terminal phone", "Claude Code mobile"],
  openGraph: {
    title: "Use AI Coding Agents From Your Phone",
    description: "Access and control AI coding agents from your phone browser.",
  },
}

export default function UseAICodingAgentsFromPhonePost() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16 pb-24">
        <div className="px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog/ai-coding-agents" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to AI Coding Agents
            </Link>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4">
          <header className="py-12 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                March 8, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                6 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              How to Use AI Coding Agents From Your Phone
            </h1>
            <p className="text-lg text-zinc-400">
              Your phone is always with you. Here is how to turn it into a capable AI coding workstation.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                You are waiting for a coffee order when you get a notification: one of your AI coding agents found a critical bug in a pull request and is asking how you want to proceed. You could ignore it and deal with the merge conflict later, or you could handle it right here from your phone.
              </p>

              <p>
                Using AI coding agents from a phone has traditionally been painful. SSH apps are clunky, terminal emulators feel cramped, and the experience rarely compares to a proper desktop setup. That perception is changing with browser-based terminals designed mobile-first.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Mobile AI Coding Challenge</h2>

              <p>
                Phone screens are small, touch targets are imprecise, and traditional terminal interfaces were designed for physical keyboards. These constraints make traditional SSH feel like a workaround rather than a solution. Yet the ability to quickly interact with an AI coding agent from anywhere has real value:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Quick decisions when the AI needs guidance</li>
                <li>Monitoring progress on long-running tasks</li>
                <li>Emergency fixes when you are away from your computer</li>
                <li>Reviewing code suggestions while in meetings</li>
                <li>Keeping momentum on side projects during commutes</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What You Need for Mobile AI Coding</h2>

              <p>
                The good news is that modern web terminals eliminate most of the friction. You do not need to install anything on your phone. You do not need a specialized SSH client. You just need:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>A browser-based terminal</strong> - Like Termote, which runs in Chrome, Safari, or Firefox on your phone</li>
                <li><strong>Your AI coding agent running</strong> - On a machine you can access remotely (typically your home or office computer)</li>
                <li><strong>An encrypted connection</strong> - Handled automatically by the tunnel service</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Practical Tips for Mobile AI Coding Sessions</h2>

              <p>
                Once you have the setup working, these tips will help you get the most out of mobile AI coding:
              </p>

              <p>
                <strong>Keep commands short with aliases.</strong> Typing long commands on a phone is tedious. Set up shell aliases for common operations like checking git status, viewing logs, or prompting your AI agent.
              </p>

              <p>
                <strong>Use copy-paste strategically.</strong> Most browser terminals support the same copy-paste gestures as native apps. Long outputs from your AI agent can be selected and copied for reference elsewhere.
              </p>

              <p>
                <strong>Keep context minimal.</strong> Mobile sessions are better for focused interactions than deep debugging. Frame your questions to Claude Code or your agent of choice concisely.
              </p>

              <p>
                <strong>Leverage multiple panes thoughtfully.</strong> If your web terminal supports multiple panes, use them. Keep your AI agent in one pane while you run verification commands in another. This reduces the need to switch contexts.
              </p>

              <p>
                <strong>Save important sessions.</strong> If you have a productive coding session, take a screenshot or export the log. Mobile sessions may be shorter, but they can still produce valuable work.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">When Mobile AI Coding Shines</h2>

              <p>
                Mobile is not going to replace desktop for heavy coding sessions, but it excels in specific scenarios:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Status checks</strong> - Is that build still running? Did the tests pass?</li>
                <li><strong>Quick approvals</strong> - The AI found an issue and is asking whether to proceed with its proposed fix</li>
                <li><strong>Progress monitoring</strong> - Watching a refactoring task complete across a large codebase</li>
                <li><strong>Emergency interventions</strong> - Something broke in production and you need to investigate immediately</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Making It Work With Termote</h2>

              <p>
                Termote is designed with mobile in mind. The interface scales to your phone screen, the touch targets are appropriately sized, and you can even generate a QR code for quick access from your phone to your desktop terminal. No account creation, no configuration files to manage. Just run termote on your Windows machine and open the provided URL in your phone browser.
              </p>

              <p>
                The encrypted tunnel means your terminal traffic is secure even on public WiFi, and the HTTPS connection works through most corporate firewalls that would block traditional SSH.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Access your AI coding agents from anywhere, including your phone. Termote works in any browser on any device.
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
