import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export const metadata: Metadata = {
  title: "How I Fixed My Server From a Restaurant Using My Phone - Termote Blog",
  description: "A real story about diagnosing and fixing a production issue from a coffee shop using browser-based terminal access.",
  keywords: ["fix server remotely", "restaurant coding", "mobile server fix", "real world remote access", "phone emergency fix"],
  openGraph: {
    title: "How I Fixed My Server From a Restaurant Using My Phone",
    description: "A real story of remote debugging using only a phone.",
  },
}

export default function FixedServerFromRestaurantUsingPhonePost() {
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
                January 16, 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                6 min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              How I Fixed My Server From a Restaurant Using My Phone
            </h1>
            <p className="text-lg text-zinc-400">
              A real story about diagnosing and fixing a production issue while eating dinner, with nothing but my phone.
            </p>
          </header>

          <div className="prose prose-invert prose-zinc max-w-none">
            <div className="text-zinc-300 leading-relaxed space-y-6">
              <p>
                It was 7 PM on a Friday. I was at a restaurant with friends when my phone buzzed: an alert that my production server was down. The entire application was returning 503 errors.
              </p>

              <p>
                In the old days, this would have meant excusing myself, driving home (or to the office), and fixing it in person. Instead, I pulled out my phone and opened Termote.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Setup</h2>

              <p>
                Earlier that week, I had installed Termote on my Windows server at home. It was running in the background, connected via Microsoft Dev Tunnels. I had bookmarked the URL on my phone.
              </p>

              <p>
                When I opened the bookmark, there was my server&apos;s terminal, right in my phone&apos;s browser.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Diagnosis</h2>

              <p>
                First, I checked what was actually failing:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                $ systemctl status nginx
                nginx is running but upstream connection failed
              </pre>

              <p>
                The web server was fine, but it could not reach the backend. I checked the backend service:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                $ systemctl status api-server
                api-server is stopped
                $ journalctl -u api-server --since "30 minutes ago"
                Out of memory: process killed
              </pre>

              <p>
                The API server had run out of memory and been killed. Simple enough.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Fix</h2>

              <p>
                I could have just restarted the service:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                $ systemctl restart api-server
                $ systemctl status api-server
                api-server is running
              </pre>

              <p>
                But I was curious why it ran out of memory. A quick check of the logs showed a memory leak in a recent deployment. I rolled back to the previous version while I investigated further.
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                $ /opt/app/rollback.sh
                Rolling back to version 2.4.1
                Done
              </pre>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Verification</h2>

              <p>
                A quick curl to check the endpoint:
              </p>

              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300">
                $ curl -s localhost/health | jq
                {`{"status": "ok", "version": "2.4.1"}`}
              </pre>

              <p>
                The server was healthy again. I checked the monitoring dashboard (which was also accessible through the browser) to confirm all systems were green.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Timeline</h2>

              <p>
                From alert to fully fixed:
              </p>

              <ul className="list-disc list-inside space-y-2 text-zinc-400">
                <li><strong>7:02 PM</strong> - Alert received</li>
                <li><strong>7:03 PM</strong> - Opened Termote, connected to server</li>
                <li><strong>7:05 PM</strong> - Diagnosed the problem</li>
                <li><strong>7:08 PM</strong> - Restarted service and rolled back bad deployment</li>
                <li><strong>7:10 PM</strong> - Verified fix, confirmed with monitoring</li>
                <li><strong>7:11 PM</strong> - Back to dinner</li>
              </ul>

              <p>
                Total time spent: about 10 minutes. No one even noticed I had stepped away from the table.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">What Made This Possible</h2>

              <p>
                <strong>Browser-based access.</strong> I did not need an SSH app or any special software. Just my phone&apos;s browser.
              </p>

              <p>
                <strong>No firewall issues.</strong> The restaurant WiFi allowed web browsing, which meant it allowed Termote. No port 22 needed.
              </p>

              <p>
                <strong>Multi-pane support.</strong> I had multiple panes open: the main terminal, monitoring output, and logs.
              </p>

              <p>
                <strong>Proactive setup.</strong> I had set this up days earlier, tested it worked, and bookmarked the URL. If I had waited until the emergency to set it up, I would have been out of luck.
              </p>

              <h2 className="text-xl font-semibold text-white mt-10 mb-4">The Lesson</h2>

              <p>
                Remote access is not just for remote workers or digital nomads. It is for anyone who has ever been away from their desk when something broke.
              </p>

              <p>
                The 5 minutes I spent setting up Termote saved me a 45-minute round trip and meant I could fix the issue while it was still fresh in my mind.
              </p>

              <p>
                Setup once. Access forever. That is the deal.
              </p>

              <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                <p className="text-zinc-400 mb-4">
                  Be prepared for emergencies. Termote lets you fix production issues from anywhere using just a browser.
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
