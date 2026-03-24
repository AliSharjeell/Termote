import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Run Frontend, Backend, and Database in One View - Termote Blog",
  description: "Full-stack development requires multiple services running simultaneously. See your entire stack in one view without tab switching.",
  keywords: ["full-stack development", "frontend backend database", "development stack", "terminal productivity", "multi-service development"],
  openGraph: {
    title: "Run Frontend, Backend, and Database in One View",
    description: "See your entire stack at once. No more tab switching.",
  },
}

export default function RunFrontendBackendDatabaseOneViewPost() {
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
                March 19, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                7 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Run Frontend, Backend, and Database in One View
            </h1>
            <p className="text-lg text-zinc-400">
              Full-stack development means multiple services. Here is how to see them all at once.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                Every full-stack developer knows this workflow:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                <li>Open tab 1: Frontend dev server</li>
                <li>Open tab 2: Backend API server</li>
                <li>Open tab 3: Database (Postgres)</li>
                <li>Open tab 4: Redis cache</li>
                <li>Open tab 5: Background workers</li>
                <li>Open tab 6: Logs</li>
                <li>Alt-tab between them for the rest of the day</li>
              </ol>

              <p>
                This is the standard approach. It is also a productivity nightmare.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Full-Stack Minimum</h2>

              <p>
                What is the minimum viable stack for full-stack development?
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>Frontend:</strong> React/Vue/Angular dev server (:3000)</li>
                <li><strong>Backend:</strong> API server (:8080 or similar)</li>
                <li><strong>Database:</strong> PostgreSQL, MySQL, or MongoDB (:5432, :3306, :27017)</li>
                <li><strong>Cache:</strong> Redis or Memcached (:6379)</li>
              </ul>

              <p>
                That is four minimum services, each with its own terminal. Most projects add more.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Pane Layout That Works</h2>

              <p>
                Instead of tabs, use a grid layout:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|                  |                  |
|   Frontend       |   Backend        |
|   localhost:3000 |   localhost:8080 |
|                  |                  |
+------------------+------------------+
|                  |                  |
|   Database       |   Cache          |
|   Postgres       |   Redis         |
|                  |                  |
+------------------+------------------+`}
              </pre>

              <p>
                Each pane has a purpose. Each pane is visible. No alt-tabbing.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Starting Your Stack</h2>

              <p>
                Automate the startup with docker-compose:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`# docker-compose.yml (simplified)
version: '3'
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: dev

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend`}
              </pre>

              <p>
                One command starts everything: docker-compose up.
              </p>

              <p>
                But docker-compose up -d hides the output. You need to see it.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Alternative: Direct Processes</h2>

              <p>
                For local development without Docker:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`# pane 1: postgres
pg_ctl -D /usr/local/var/postgres start

# pane 2: redis
redis-server

# pane 3: backend
cd backend && npm run dev

# pane 4: frontend
cd frontend && npm run dev`}
              </pre>

              <p>
                Each command in its own pane. All visible.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What to See in Each Pane</h2>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">Frontend Pane</h3>

              <p>
                Watch for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Compilation errors</li>
                <li>Hot module replacement messages</li>
                <li>Build warnings</li>
                <li>Port conflicts</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">Backend Pane</h3>

              <p>
                Watch for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>API request logs</li>
                <li>Database query errors</li>
                <li>Authentication issues</li>
                <li>Port conflicts</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">Database Pane</h3>

              <p>
                Watch for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Connection attempts</li>
                <li>Slow queries</li>
                <li>Error messages</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-8 mb-3">Cache Pane</h3>

              <p>
                Watch for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Connection status</li>
                <li>Memory usage</li>
                <li>Hit/miss rates (if you log them)</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Correlating Issues Across Panes</h2>

              <p>
                The real benefit of visible panes is correlation:
              </p>

              <p>
                When your frontend shows an API error, you can immediately look at your backend pane to see what request failed and why.
              </p>

              <p>
                When your backend shows a database timeout, you can check if the database pane shows high load.
              </p>

              <p>
                This is impossible with tabs. You would need to switch to the right tab at exactly the right moment to catch the correlation.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Adding More Services</h2>

              <p>
                As your project grows, add more panes:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
{`+------------------+------------------+
|                  |                  |
|   Frontend       |   Backend        |
+------------------+------------------+
|                  |                  |
|   Database       |   Cache          |
+------------------+------------------+
|                  |                  |
|   Workers       |   Logs          |
+------------------+------------------+`}
              </pre>

              <p>
                The layout scales. Each new service gets a pane.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">Remote Development</h2>

              <p>
                If you develop on a remote server (common in AI coding workflows):
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li>Browser-based terminals like Termote give you the same visual layout</li>
                <li>Your stack is accessible from any device</li>
                <li>Connections persist even when your laptop closes</li>
              </ul>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Termote gives you the full-stack view no matter where you develop. See your frontend, backend, database, and cache all at once.
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
