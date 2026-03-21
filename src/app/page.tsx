"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/LoginForm"

function AutoLoginHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle auto-login from QR code scan
    const tunnelParam = searchParams.get("tunnel")
    const tokenParam = searchParams.get("token")

    if (tunnelParam && tokenParam) {
      sessionStorage.setItem("tunnelUrl", tunnelParam)
      sessionStorage.setItem("authToken", tokenParam)
      router.push("/dashboard")
      return
    }

    // If already logged in, redirect to dashboard
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0C0C0C]">
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

      <div className="relative w-full max-w-md px-4">
        {/* Header with terminal-style window */}
        <div className="mb-6">
          {/* Terminal window header */}
          <div className="flex items-center gap-2 rounded-t-lg border border-[#333333] border-b-0 bg-[#161616] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#E74856]" />
              <div className="h-3 w-3 rounded-full bg-[#DCDCAA]" />
              <div className="h-3 w-3 rounded-full bg-[#16C60C]" />
            </div>
            <span className="ml-3 text-xs text-[#808080]">termux@web</span>
          </div>
          {/* Terminal body */}
          <div className="rounded-b-lg border border-[#333333] bg-[#161616] p-4">
            <div className="font-mono text-sm">
              <p className="text-[#16C60C]">$ Connecting to tunnel...</p>
              <p className="mt-1 text-[#808080]">Ready to connect</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Termux Web</h1>
          <p className="mt-1 text-sm text-[#808080]">
            Web-native terminal multiplexer
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border border-[#333333] bg-[#161616] p-6">
          <Suspense fallback={null}>
            <AutoLoginHandler />
          </Suspense>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#808080]">
          <p>Enter your tunnel URL and password to connect</p>
        </div>
      </div>
    </div>
  )
}
