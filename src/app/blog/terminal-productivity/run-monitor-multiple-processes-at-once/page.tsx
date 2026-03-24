import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "How to Run and Monitor Multiple Processes at Once - Termote Blog",
  description: "Running multiple processes is essential for development. Learn how to monitor them all without losing track of what is running.",
  keywords: ["multiple processes", "monitor processes", "development workflow", "process management", "terminal productivity"],
  openGraph: {
    title: "How to Run and Monitor Multiple Processes at Once",
    description: "Keep track of all your development processes without losing your mind.",
  },
}

export default function RunMonitorMultipleProcessesAtOncePost() {
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
                March 15, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                6 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              How to Run and Monitor Multiple Processes at Once
            </h1>
            <p className="text-lg text-zinc-400">
              Full-stack development means multiple processes running simultaneously. Here is how to manage them.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                Your typical full-stack project has multiple processes you need running simultaneously:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Frontend dev server (Vite, webpack, Next.js)</li>
                <li>Backend API server (Node, Python, Go)</li>
                <li>Database (PostgreSQL, MongoDB)</li>
                <li>Cache layer (Redis)</li>
                <li>Queue workers</li>
              </ul>

              <p>
                That is at least five processes. Monitoring them all is a challenge. Here is how to do it effectively.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Wrong Way: Tab Overload</h2>

              <p>
                The naive approach is to open five terminal tabs, one for each process. This works until you need to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Restart one process without affecting others</li>
                <li>Check output from multiple processes simultaneously</li>
                <li>See which process is logging an error</li>
                <li>Copy output from one process to another</li>
              </ul>

              <p>
                Tabs hide processes in the background. Errors go unnoticed. Switching between tabs breaks flow.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Better Way: Visual Pane Layout</h2>

              <p>
                Instead of tabs, use a pane layout where every process is visible:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|    Frontend      |     Backend      |
|   :3000          |     :8080        |
|   npm run dev    |   npm run dev   |
+------------------+------------------+
|    Database      |     Cache        |
|   Postgres       |     Redis       |
|   :5432          |     :6379       |
+------------------+------------------+`}
              </pre>

              <p>
                Every process is visible. Every output is readable. You can watch compilation errors appear in real-time.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Starting Processes in Panes</h2>

              <p>
                The key is launching processes correctly:
              </p>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">Automatic Startup Script</h3>

              <p>
                Create a script that launches everything at once:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`# start-dev.sh
#!/bin/bash

echo "Starting infrastructure..."
docker-compose up -d postgres redis

echo "Starting development servers..."
npm run dev:frontend &
npm run dev:backend &

echo "All services started"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"`}
              </pre>

              <p>
                One command starts everything. You can run this in one pane while other panes show running services.
              </p>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">The "Watch Everything" Pane</h3>

              <p>
                Dedicate one pane to aggregated logs:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`# Watch all logs
tail -f logs/*.log

# Or use a process manager
nodemon --watch 'logs/**/*' -x "tail -n 50 logs/app.log"`}
              </pre>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Process Monitoring Strategies</h2>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">For Development</h3>

              <p>
                During active development, you want:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Real-time output from your frontend build</li>
                <li>Backend API request logs</li>
                <li>Database query logs (when debugging)</li>
                <li>Error stack traces as they happen</li>
              </ul>

              <p>
                Visual panes let you catch errors as they happen instead of discovering them hours later.
              </p>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">For Production Monitoring</h3>

              <p>
                When monitoring production:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Use proper monitoring tools (Datadog, New Relic)</li>
                <li>Terminal is for SSH access and quick diagnostics</li>
                <li>Log aggregation for long-term analysis</li>
                <li>Alerting systems for critical issues</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Managing Resource Usage</h2>

              <p>
                Multiple processes means resource contention. Watch for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Memory:</strong> Each Node.js process can use 200-500MB</li>
                <li><strong>CPU:</strong> Build processes spike CPU usage</li>
                <li><strong>Disk:</strong> Logs can fill up quickly</li>
                <li><strong>Ports:</strong> Make sure nothing conflicts</li>
              </ul>

              <p>
                Top or htop in one pane can show you resource usage in real-time.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Process Failure Handling</h2>

              <p>
                When a process dies, you need to:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                <li>Notice it died (ideally visually)</li>
                <li>Check what went wrong (read recent output)</li>
                <li>Restart it</li>
                <li>Verify it is running again</li>
              </ol>

              <p>
                With a pane layout, process death is visible immediately. The output stops, or an error message appears. With tabs, a dead process in tab 7 is invisible until you switch to it.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Practical Setup</h2>

              <p>
                For most developers, this works well:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|   Development     |   Monitoring     |
|   (your focus)    |  (htop, logs)   |
+------------------+------------------+
|   Background      |   Shell          |
|   (servers)       |   (git, etc.)   |
+------------------+------------------+`}
              </pre>

              <p>
                Top two panes: your active development and monitoring. Bottom two: background servers and utilities.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Termote makes process monitoring visual with persistent panes. See all your services at once, restart what you need, and never lose a process to a hidden tab.
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
