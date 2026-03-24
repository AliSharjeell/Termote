import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Coffee, Server, Monitor, Shield, Smartphone, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Use Cases - Real-World Remote Terminal Scenarios",
  description: "Discover how developers use Termote: mobile AI agent control, remote server fixes, monitoring long-running jobs, and bypassing restrictive networks. Your terminal, anywhere.",
  keywords: ["termote use cases", "remote terminal scenarios", "terminal from phone", "SSH alternative use cases", "mobile terminal", "remote server management", "work from anywhere terminal"],
  openGraph: {
    title: "Termote Use Cases - Real-World Scenarios",
    description: "See how developers use Termote in everyday scenarios.",
  },
}

const useCases = [
  {
    icon: Zap,
    title: "The Mobile AI Agent Commander",
    description: "Out for coffee but want your home rig working? Open Termote on your phone, spin up AutoGPT, monitor its thought process and give real-time corrections from your mobile browser.",
    scenario: "You: Grabbing coffee at a cafe"
  },
  {
    icon: Server,
    title: "The 'Dinner Emergency' Server Fix",
    description: "Dev server crashed while you're out? Open Termote on your phone, run docker restart or pm2 reload, go right back to your meal.",
    scenario: "You: Out with friends when alert fires"
  },
  {
    icon: Monitor,
    title: "Monitor Heavy Jobs from the Couch",
    description: "Kicked off a 4-hour compilation? Grab your iPad, head to the couch, watch progress in a live pane next to your Netflix stream.",
    scenario: "You: Watching a long job run"
  },
  {
    icon: Shield,
    title: "Bypassing Locked-Down Networks",
    description: "On a restrictive school or corporate Wi-Fi that blocks SSH? Termote uses Port 443 (HTTPS), slicing through firewalls undetected.",
    scenario: "You: On restricted network"
  },
  {
    icon: Smartphone,
    title: "Quick Folder Navigation",
    description: "Need to run a command in a specific project directory? Right-click any folder in Explorer and select 'Open with Termote'. It instantly opens a pane in that directory.",
    scenario: "You: Managing multiple projects"
  },
  {
    icon: Coffee,
    title: "Pair Programming on the Go",
    description: "Share your tunnel link with a teammate. They can view and control your terminal session from their browser while you walk them through something.",
    scenario: "You: Helping a colleague remotely"
  },
]

export default function UseCasesPage() {
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
              Real-World Use Cases
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              See how developers use Termote in everyday scenarios — from emergency fixes to lazy Sunday coding.
            </p>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-10 px-4">
          <div className="mx-auto max-w-4xl space-y-12">
            {useCases.map((useCase, index) => (
              <div
                key={useCase.title}
                className={`flex flex-col md:flex-row gap-8 items-start ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 mb-4`}>
                    <useCase.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-100 mb-3">{useCase.title}</h2>
                  <p className="text-zinc-400 leading-relaxed mb-4">{useCase.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-400">
                    <span className="text-zinc-500">Scenario:</span>
                    {useCase.scenario}
                  </div>
                </div>
                <div className="w-full md:w-80 h-48 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm text-zinc-600">Visual coming soon</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* More Scenarios */}
        <section className="py-16 px-4 bg-zinc-900/30 border-y border-zinc-800">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-8 text-center">More Scenarios</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Remote database administration",
                "CI/CD pipeline monitoring",
                "SSH tunnel management",
                "Remote pair programming sessions",
                "Accessing home lab from anywhere",
                "Quick server health checks",
                "Managing Docker containers remotely",
                "Git operations on the go",
                "Terminal automation scripts",
              ].map((scenario) => (
                <div
                  key={scenario}
                  className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400"
                >
                  {scenario}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">Ready to work from anywhere?</h2>
            <p className="text-zinc-400 mb-8">
              Get started with Termote and experience the freedom of remote terminal access.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                View Features
              </Link>
            </div>
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
