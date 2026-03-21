import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Termux Web - Web Terminal Multiplexer",
  description: "A web-native terminal multiplexer with split panes and tab support",
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
