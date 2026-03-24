import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Switch Less, Build More: Fixing Context Switching in Dev Workflows - Termote Blog",
  description: "Context switching is a productivity killer. Learn how to design workflows that minimize switching and maximize focus.",
  keywords: ["context switching", "developer productivity", "workflow optimization", "focus", "terminal productivity"],
  openGraph: {
    title: "Switch Less, Build More: Fixing Context Switching in Dev Workflows",
    description: "Context switching destroys productivity. Here is how to fix it.",
  },
}

export default function SwitchLessBuildMoreContextSwitchingPost() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="pt-16 pb-24">
        <div className="px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog/terminal-productivity" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Terminal Productivity
            </Link>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4">
          <header className="py-12 text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                March 26, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                7 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Switch Less, Build More: Fixing Context Switching in Dev Workflows
            </h1>
            <p className="text-lg text-zinc-400">
              Context switching destroys productivity. Here is how to design workflows that minimize it.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                You are deep in a tricky bug fix. You need to check the API response. You alt-tab to Chrome, paste the request, send it, read the response, alt-tab back to your code.
              </p>

              <p>
                That 30-second interruption cost you 10 minutes of refocusing.
              </p>

              <p>
                This is context switching. And it is one of the biggest productivity killers in development.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Cost of Context Switching</h2>

              <p>
                Research on task switching shows:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>It takes an average of 23 minutes to fully regain focus after an interruption</li>
                <li>Workers are interrupted every 11 minutes on average</li>
                <li>It takes 8 minutes to return to the original task after checking email or messages</li>
              </ul>

              <p>
                For developers, context switching between windows, tabs, and applications compounds these costs.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Common Developer Context Switches</h2>

              <p>
                In a typical development session, you might switch contexts for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Terminal to browser:</strong> Checking API responses, testing UI</li>
                <li><strong>Code to terminal:</strong> Running commands, checking logs</li>
                <li><strong>Editor to documentation:</strong> Looking up APIs</li>
                <li><strong>Main project to Side project:</strong> Checking CI/CD, reviews</li>
                <li><strong>Development to communication:</strong> Slack, email, messages</li>
              </ul>

              <p>
                Each switch has a cost. The goal is not to eliminate all switches (that is impossible) but to minimize unnecessary ones.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Strategy 1: Make Everything Visible</h2>

              <p>
                The biggest context switch driver is needing to check something that is not visible. The fix: make more visible.
              </p>

              <p>
                Instead of switching to a browser to check API responses, have your API logs visible in a pane:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|                  |                  |
|   Code Editor   |   API Logs      |
|                  |   (requests &   |
|                  |   responses)    |
+------------------+------------------+
|                  |                  |
|   Dev Server    |   Shell          |
|   (output)      |                  |
+------------------+------------------+`}
              </pre>

              <p>
                Now checking API activity is just looking at a different part of the screen.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Strategy 2: Batch Similar Tasks</h2>

              <p>
                Instead of switching contexts frequently for small tasks, batch them:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Email:</strong> Check at specific times (9am, 1pm, 5pm), not continuously</li>
                <li><strong>Slack:</strong> Set status to busy, check messages in batches</li>
                <li><strong>Code reviews:</strong> Do them at dedicated times, not every notification</li>
                <li><strong>Documentation:</strong> Read in dedicated research sessions, not as you code</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Strategy 3: Keyboard-Driven Workflows</h2>

              <p>
                Every time you reach for your mouse, you are context switching from keyboard to visual processing.
              </p>

              <p>
                Keyboard-driven workflows stay in the same modality:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Terminal:</strong> Everything is already keyboard-driven</li>
                <li><strong>Editor:</strong> Learn the shortcuts for your editor</li>
                <li><strong>Browser:</strong> Vimium or similar for keyboard browsing</li>
                <li><strong>File managers:</strong> Use keyboard-driven file managers (nnn, lf)</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Strategy 4: Pane-Based Organization</h2>

              <p>
                Organize your workspace by workflow, not by tool:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`Workflow 1: Development
+------------------+------------------+
|   Code          |   Tests         |
+------------------+------------------+
|   Server        |   Shell         |
+------------------+------------------+

Workflow 2: Monitoring
(separate workspace for monitoring)`}
              </pre>

              <p>
                When doing development, everything you need is visible. When monitoring, everything for that is visible. No mixing.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Strategy 5: Reduce Decision Overhead</h2>

              <p>
                Some context switching is decision-based: "Should I switch now or continue?"
              </p>

              <p>
                Reduce this by having clear rules:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>If something needs my attention, note it and continue</li>
                <li>Check messages only at batched times</li>
                <li>If a task takes less than 2 minutes, finish it; otherwise, schedule it</li>
              </ul>

              <p>
                The goal is to reduce the number of decisions about switching.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Flow State</h2>

              <p>
                The ultimate goal is flow state: sustained focus on a challenging task without interruption.
              </p>

              <p>
                Flow state typically takes 15-30 minutes to enter. Every context switch resets that clock.
              </p>

              <p>
                To achieve flow:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                <li>Remove visible distractions (hide Slack, close email)</li>
                <li>Make everything you need visible (logs, docs in panes)</li>
                <li>Batch communication (check messages later)</li>
                <li>Protect your focus time fiercely</li>
              </ol>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Measuring Your Context Switching</h2>

              <p>
                To fix context switching, first measure it. For one day:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Every time you switch context, note it</li>
                <li>Note what triggered the switch</li>
                <li>Note how long it took to return</li>
              </ul>

              <p>
                You will find patterns. Certain triggers cause most of your switches. Remove those triggers and you reclaim hours.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Termote minimizes context switching with visible panes. See your code, logs, and commands all at once. Stay in flow.
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
