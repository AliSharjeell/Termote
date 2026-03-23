import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    template: "%s | Termote",
  },
  description: "Turn any browser into a full-powered, multi-pane terminal for your Windows PC. No SSH, no tmux, no setup. Termote punches through NATs and firewalls using encrypted WebSockets.",
  keywords: ["terminal", "web terminal", "remote access", "CLI", "multi-pane terminal", "tmux alternative", "browser terminal", "Windows terminal", "mobile terminal", "remote CLI", "WebSocket terminal", "NAT traversal", "firewall bypass", "Microsoft Dev Tunnels"],
  authors: [{ name: "Ali Sharjeel", url: "https://github.com/AliSharjeell" }],
  creator: "Ali Sharjeel",
  publisher: "Ali Sharjeel",
  metadataBase: new URL("https://termote.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://termote.vercel.app",
    siteName: "Termote",
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    description: "Turn any browser into a full-powered, multi-pane terminal for your PC. No SSH, no tmux, no setup.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Termote - Web Terminal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    description: "Turn any browser into a full-powered, multi-pane terminal for your PC. No SSH, no tmux, no setup.",
    creator: "@AliSharjeell",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${poppins.variable} h-full antialiased font-[family-name:var(--font-poppins)]`}>
        {children}
      </body>
    </html>
  )
}
