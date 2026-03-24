import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Control Multiple AI Agents From One Dashboard - Termote Blog",
  description: "Running multiple AI coding agents is powerful but chaotic. Learn how to manage them from one dashboard without losing control.",
  keywords: ["multiple AI agents", "AI agent dashboard", "Claude Code", "Codex CLI", "agent management", "terminal productivity"],
  openGraph: {
    title: "Control Multiple AI Agents From One Dashboard",
    description: "Manage multiple AI coding agents without the chaos.",
  },
}

export default function ControlMultipleAIAgentsOneDashboardPost() {
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
                March 21, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                7 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Control Multiple AI Agents From One Dashboard
            </h1>
            <p className="text-lg text-zinc-400">
              Multiple AI agents can supercharge your development. Here is how to manage them.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                AI coding agents are becoming part of the development workflow. Claude Code, Codex CLI, and other agents can write code, run tests, and debug issues while you focus on higher-level decisions.
              </p>

              <p>
                But running one agent is easy. Running multiple agents across different tasks without losing track is hard.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Why Multiple Agents?</h2>

              <p>
                Multiple agents can work in parallel:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Feature development:</strong> One agent implements a feature while another reviews it</li>
                <li><strong>Code review:</strong> One agent reviews the PR while you continue coding</li>
                <li><strong>Documentation:</strong> One agent updates docs while another refactors code</li>
                <li><strong>Testing:</strong> One agent writes tests while another fixes bugs</li>
                <li><strong>Multi-project:</strong> Different agents for different microservices</li>
              </ul>

              <p>
                The bottleneck is no longer your ability to write code. It is your ability to coordinate agents.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Chaos of Multiple Agents</h2>

              <p>
                Without organization, multiple agents become chaos:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Which agent is working on what?</strong></li>
                <li><strong>Which agent produced which output?</strong></li>
                <li><strong>Did an agent finish? Is it still running?</strong></li>
                <li><strong>Which terminal has which agent?</strong></li>
                <li><strong>How do you interrupt one without affecting others?</strong></li>
              </ul>

              <p>
                This is the same problem as managing multiple terminals, but amplified. Agents have long-running conversations, generate multiple files, and can diverge from their original task.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Dashboard Layout</h2>

              <p>
                The solution is visual organization with a dedicated dashboard:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|                  |                  |
|   Agent 1       |   Agent 2        |
|   (Feature A)  |   (Code Review)  |
|                  |                  |
+------------------+------------------+
|                  |                  |
|   Agent 3       |   Main Terminal  |
|   (Docs)        |   (you)          |
|                  |                  |
+------------------+------------------+`}
              </pre>

              <p>
                Each agent gets a pane. The main terminal is for your own work.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Pane 1: Primary Agent</h2>

              <p>
                Your main coding agent. This is the agent working on your current feature or task.
              </p>

              <p>
                Commands to run:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`claude-code --resume
# or
codex --continue`}
              </pre>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Pane 2: Code Review Agent</h2>

              <p>
                A second agent reviewing your code:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`claude-code --prompt "Review the recent commits for bugs and security issues"
# or focus on specific files
claude-code --focus src/api/`}
              </pre>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Pane 3: Documentation Agent</h2>

              <p>
                Update docs while you code:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`claude-code --prompt "Update the API documentation for any new endpoints"`}
              </pre>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Managing Agent State</h2>

              <p>
                Each agent maintains state in its terminal. You can:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Pause an agent:</strong> Ctrl+C in its pane (graceful interrupt)</li>
                <li><strong>Resume:</strong> --resume flag continues from where it left</li>
                <li><strong>New task:</strong> Clear state and start fresh</li>
                <li><strong>Compare:</strong> See outputs from different agents side by side</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Task Assignment Strategy</h2>

              <p>
                Do not just run agents randomly. Assign tasks strategically:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>One agent per task:</strong> Each agent has a clear, focused task</li>
                <li><strong>Independent tasks:</strong> Agents should not depend on each other&apos;s output</li>
                <li><strong>Explicit scope:</strong> Tell each agent exactly what to do and what to avoid</li>
                <li><strong>Time limits:</strong> Set expectations for how long a task should take</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Avoiding Agent Conflicts</h2>

              <p>
                Multiple agents can conflict:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>File conflicts:</strong> Two agents editing the same file</li>
                <li><strong>Build conflicts:</strong> One agent rebuilding while another is testing</li>
                <li><strong>State conflicts:</strong> One agent changing code another agent is reviewing</li>
              </ul>

              <p>
                Prevent conflicts by:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Assigning non-overlapping file ranges to each agent</li>
                <li>Sequencing builds and tests</li>
                <li>Having one agent own the codebase, others review separately</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">When to Use Multiple Agents</h2>

              <p>
                Multiple agents are worth it when:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>You have independent tasks that can run in parallel</li>
                <li>You have time-sensitive work that benefits from parallel processing</li>
                <li>You have review and development that can happen simultaneously</li>
              </ul>

              <p>
                Multiple agents are not worth it when:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Tasks are tightly coupled (agent B needs agent A&apos;s output)</li>
                <li>You cannot monitor them effectively (chaos ensues)</li>
                <li>The coordination overhead exceeds the time savings</li>
              </ul>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Termote gives you the multi-pane dashboard to run multiple AI agents effectively. See all agents at once, manage them visually.
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
