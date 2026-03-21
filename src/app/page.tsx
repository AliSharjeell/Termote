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
      <div className="w-full max-w-md px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#CCCCCC]">Termux Web</h1>
          <p className="mt-2 text-sm text-[#808080]">
            Web-native terminal multiplexer
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border border-[#252525] bg-[#161616] p-6">
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
