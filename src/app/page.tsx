import type { Metadata } from "next"
import { LandingPage } from "./LandingPage"

export const metadata: Metadata = {
  title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
  description: "Turn any browser into a full-powered, multi-pane terminal for your Windows PC. No SSH, no tmux, no setup. Termote punches through NATs and firewalls using encrypted WebSockets.",
  keywords: ["terminal", "web terminal", "remote access", "CLI", "multi-pane terminal", "tmux alternative", "browser terminal", "Windows terminal", "mobile terminal"],
  authors: [{ name: "Ali Sharjeel" }],
  openGraph: {
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    description: "Turn any browser into a full-powered, multi-pane terminal for your PC. No SSH, no tmux, no setup.",
    url: "https://termote.vercel.app",
    siteName: "Termote",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    creator: "@AliSharjeell",
  },
}

export default function Home() {
  return <LandingPage />
}
