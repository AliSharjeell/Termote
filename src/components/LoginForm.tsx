"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic validation
    if (!url.trim()) {
      setError("Tunnel URL is required")
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Password is required")
      setIsLoading(false)
      return
    }

    // Store connection info in sessionStorage
    sessionStorage.setItem("tunnelUrl", url)
    sessionStorage.setItem("authToken", password)

    setIsLoading(false)
    onSuccess?.()
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-[#CCCCCC]"
          >
            Tunnel URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://your-tunnel-url.com"
            className="mt-1 block w-full rounded-md border border-[#333333] bg-[#0C0C0C] px-3 py-2 text-[#CCCCCC] placeholder-[#808080] focus:border-[#3B78FF] focus:outline-none focus:ring-1 focus:ring-[#3B78FF]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#CCCCCC]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="mt-1 block w-full rounded-md border border-[#333333] bg-[#0C0C0C] px-3 py-2 text-[#CCCCCC] placeholder-[#808080] focus:border-[#3B78FF] focus:outline-none focus:ring-1 focus:ring-[#3B78FF]"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-[#E74856]/10 p-3 text-sm text-[#E74856]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-[#0037DA] px-4 py-2 text-sm font-medium text-white hover:bg-[#0037DA]/90 focus:outline-none focus:ring-2 focus:ring-[#3B78FF] focus:ring-offset-2 focus:ring-offset-[#0C0C0C] disabled:opacity-50"
      >
        {isLoading ? "Connecting..." : "Connect"}
      </button>
    </form>
  )
}
