import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Frontend, Backend, and AI Agents — All in One Terminal Workspace - Termote Blog",
  description: "Full-stack development means managing multiple services. Learn how to organize your terminal workspace for full-stack development.",
  keywords: ["full-stack terminal setup", "frontend backend workspace", "AI agent workspace", "development terminal setup", "multi-service development"],
  openGraph: {
    title: "Frontend, Backend, and AI Agents — All in One Terminal Workspace",
    description: "Organize your terminal workspace for full-stack development with AI agents.",
  },
}

export default function FrontendBackendAIAgentsOneTerminalWorkspacePost() {
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
                March 8, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                7 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Frontend, Backend, and AI Agents — All in One Terminal Workspace
            </h1>
            <p className="text-lg text-zinc-400">
              Full-stack development requires multiple services. Here is how to manage them in one terminal workspace.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                Full-stack development is inherently multi-terminal. Your frontend needs a dev server, your backend needs another, your database another, and now you also want to run an AI coding agent to assist. That is four or five terminals just to start working.
              </p>

              <p>
                Managing this chaos is a skill. Done right, you have a clean workspace where everything has its place. Done wrong, you spend more time managing terminals than writing code.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Grid Layout Approach</h2>

              <p>
                For full-stack development, a grid layout works well:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                {`+------------------+------------------+
|    Frontend      |     Backend      |
|   (npm start)    |   (npm run dev)  |
+------------------+------------------+
|    Database      |   AI Agent       |
|   (postgres)     |  (Claude Code)   |
+------------------+------------------+`}
              </pre>

              <p>
                Each pane has a purpose. You see everything at once. When you need to focus, you expand one pane to fullscreen.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Pane-by-Pane Breakdown</h2>

              <p>
                <strong>Frontend pane:</strong> Your React/Vue/Svelte dev server. You watch for compilation errors and test your changes here.
              </p>

              <p>
                <strong>Backend pane:</strong> Your API server. You watch request logs, error traces, and restart it when needed.
              </p>

              <p>
                <strong>Database pane:</strong> Database shell or admin interface. Useful for checking data, running migrations, or debugging query issues.
              </p>

              <p>
                <strong>AI Agent pane:</strong> Claude Code or Codex CLI. You consult it for tricky problems, code reviews, or generating boilerplate.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Starting Your Workspace</h2>

              <p>
                Instead of starting each service manually, create a workspace startup script:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                #!/bin/bash
                cd ~/projects/myapp

                # Start all services in background
                npm run dev:frontend &
                npm run dev:backend &
                docker-compose up -d db

                # Wait for services
                echo "Waiting for services..."
                sleep 5

                # Start AI agent
                claude-code &
              </pre>

              <p>
                One command starts your entire workspace. One command stops it.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Monitoring Across Panes</h2>

              <p>
                The benefit of visual panes is monitoring. You can see:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Frontend compilation errors as they happen</li>
                <li>Backend API errors in real-time</li>
                <li>AI agent progress on its current task</li>
                <li>Database connection status</li>
              </ul>

              <p>
                This is better than tabbed terminals where errors in background tabs are invisible until you switch to them.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Termote for This Workflow</h2>

              <p>
                Termote&apos;s multi-pane support is purpose-built for this workflow:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Visual grid layout</strong> - See all panes at once</li>
                <li><strong>Easy pane management</strong> - Create, resize, close panes with simple controls</li>
                <li><strong>Pane persistence</strong> - Layout survives reconnections</li>
                <li><strong>Remote access</strong> - Work from anywhere with the same workspace</li>
              </ul>

              <p>
                With Termote, your full-stack workspace is accessible from any device.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Scaling Up</h2>

              <p>
                For larger projects, consider additional panes:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Log aggregator</strong> - Centralized logging from all services</li>
                <li><strong>Test runner</strong> - Watch tests as you code</li>
                <li><strong>Docker monitoring</strong> - Container status and resource usage</li>
                <li><strong>Redis/memcached</strong> - Cache and session stores</li>
              </ul>

              <p>
                The key is not having all these open at once, but having them available when needed without disrupting your main workspace.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Termote&apos;s multi-pane workspace is designed for full-stack development workflows.
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
