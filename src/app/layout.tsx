import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Termote",
  description: "Turn any browser into a full-powered, multi-pane terminal for your Windows PC. No SSH, no tmux, no setup.",
  url: "https://termote.vercel.app",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/OnlineOnly",
  },
  author: {
    "@type": "Person",
    name: "Ali Sharjeel",
    url: "https://github.com/AliSharjeell",
  },
  repository: {
    "@type": "URL",
    value: "https://github.com/AliSharjeell/Termote",
  },
  keywords: "terminal, web terminal, remote access, CLI, multi-pane terminal, tmux alternative, browser terminal",
  softwareVersion: "0.1.0",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "42",
  },
}

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
  keywords: [
    "terminal",
    "web terminal",
    "remote access",
    "CLI",
    "multi-pane terminal",
    "tmux alternative",
    "browser terminal",
    "Windows terminal",
    "mobile terminal",
    "remote CLI",
    "WebSocket terminal",
    "NAT traversal",
    "firewall bypass",
    "Microsoft Dev Tunnels",
    "remote desktop",
    "SSH alternative",
    "cloud terminal",
    "browser-based terminal",
  ],
  authors: [{ name: "Ali Sharjeel", url: "https://github.com/AliSharjeell" }],
  creator: "Ali Sharjeel",
  publisher: "Ali Sharjeel",
  metadataBase: new URL("https://termote.vercel.app"),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
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
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Termote - Web Terminal",
      },
    ],
    siteAliases: {
      "en-US": "https://termote.vercel.app",
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Termote - Your Local CLI Terminal, Accessible Anywhere",
    description: "Turn any browser into a full-powered, multi-pane terminal for your PC. No SSH, no tmux, no setup.",
    creator: "@AliSharjeell",
    images: ["/og-image.svg"],
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
  verification: {
    google: "google20d370399c9772c8",
    yandex: "yandex-site-verification-code", // Replace with actual code if using Yandex
  },
  category: "software",
  classification: "Developer Tools",
  other: {
    "product:product_id": "termote",
    "product:category": "Software/Developer Tools",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${poppins.variable} h-full antialiased font-[family-name:var(--font-poppins)]`}>
        {children}
      </body>
    </html>
  )
}
