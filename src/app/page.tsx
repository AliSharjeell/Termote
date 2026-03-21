"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/LoginForm"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const url = sessionStorage.getItem("tunnelUrl")
    const token = sessionStorage.getItem("authToken")
    if (url && token) {
      router.push("/dashboard")
    }
  }, [router])

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
        <div className="rounded-lg border border-[#333333] bg-[#1E1E1E] p-6">
          <LoginForm />
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#808080]">
          <p>Enter your tunnel URL and password to connect</p>
        </div>
      </div>
    </div>
  )
}
