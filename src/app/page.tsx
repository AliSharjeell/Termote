"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/LoginForm"
import { Terminal, Zap, Shield, Smartphone } from "lucide-react"

function AutoLoginHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tunnelParam = searchParams.get("tunnel")
    const tokenParam = searchParams.get("token")

    if (tunnelParam && tokenParam) {
      // Save to sessionStorage first, then redirect
      sessionStorage.setItem("tunnelUrl", tunnelParam)
      sessionStorage.setItem("authToken", tokenParam)
      // Small delay to ensure sessionStorage is persisted on iOS
      setTimeout(() => {
        router.push("/dashboard")
      }, 100)
      return
    }

    const url = sessionStorage.getItem("tunnelUrl")
    const token = sessionStorage.getItem("authToken")
    if (url && token) {
      router.push("/dashboard")
    }
  }, [router, searchParams])

  return <LoginForm />
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0C0C0C]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(#333333 1px, transparent 1px), linear-gradient(90deg, #333333 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
          {/* Terminal window header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 rounded-t-lg border border-[#333333] border-b-0 bg-[#161616] px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#E74856]" />
                <div className="h-3 w-3 rounded-full bg-[#DCDCAA]" />
                <div className="h-3 w-3 rounded-full bg-[#16C60C]" />
              </div>
              <span className="ml-3 text-xs text-[#808080]">termux@web</span>
            </div>
            <div className="rounded-b-lg border border-[#333333] bg-[#161616] p-4">
              <div className="font-mono text-sm">
                <p className="text-[#16C60C]">$ termux-web --connect</p>
                <p className="mt-1 text-[#808080]">Ready to connect</p>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Termote <span className="text-[#16C60C]">Web</span>
            </h1>
            <p className="mt-3 text-lg text-[#808080]">
              Your terminal, everywhere.
            </p>
          </div>

          {/* Login Form */}
          <div className="mx-auto max-w-md rounded-lg border border-[#333333] bg-[#161616] p-6">
            <h2 className="mb-4 text-center text-sm font-medium text-[#CCCCCC]">
              Connect to your tunnel
            </h2>
            <Suspense fallback={null}>
              <AutoLoginHandler />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t border-[#333333] bg-[#161616]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-8 text-center text-xl font-semibold text-white">
            Features
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#27272A]">
                <Terminal className="h-6 w-6 text-[#16C60C]" />
              </div>
              <h3 className="mb-2 text-sm font-medium text-white">Full Terminal</h3>
              <p className="text-xs text-[#808080]">
                Full-featured terminal emulator with xterm.js
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#27272A]">
                <Zap className="h-6 w-6 text-[#DCDCAA]" />
              </div>
              <h3 className="mb-2 text-sm font-medium text-white">Real-time</h3>
              <p className="text-xs text-[#808080]">
                WebSocket-powered instant response
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#27272A]">
                <Smartphone className="h-6 w-6 text-[#3B78FF]" />
              </div>
              <h3 className="mb-2 text-sm font-medium text-white">Mobile Ready</h3>
              <p className="text-xs text-[#808080]">
                Scan QR code to connect from phone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#333333] py-6">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs text-[#808080]">
            Termote - Web-native terminal multiplexer
          </p>
        </div>
      </div>
    </div>
  )
}
