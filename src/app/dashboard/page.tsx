"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SplitPane } from "@/components/SplitPane"
import { TabBar } from "@/components/TabBar"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { usePaneStore } from "@/hooks/usePaneStore"

export default function Dashboard() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isReady, setIsReady] = useState(false)

  const { isConnected, isAuthenticated } = usePaneStore()

  // Get connection info from sessionStorage
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    const url = sessionStorage.getItem("tunnelUrl")
    const token = sessionStorage.getItem("authToken")

    if (!url || !token) {
      router.push("/")
      return
    }

    setTunnelUrl(url)
    setAuthToken(token)
    setIsReady(true)
  }, [router])

  // Connect to WebSocket
  const { disconnect } = useWebSocket({
    url: tunnelUrl,
    token: authToken,
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0C0C0C]">
        <div className="text-[#CCCCCC]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0C0C0C]">
      {/* Connection status bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#333333] bg-[#1E1E1E] px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? isAuthenticated
                  ? "bg-[#16C60C]"
                  : "bg-[#DCDCAA]"
                : "bg-[#E74856]"
            }`}
          />
          <span className="text-xs text-[#808080]">
            {isConnected
              ? isAuthenticated
                ? "Connected"
                : "Authenticating..."
              : "Disconnected"}
          </span>
        </div>
        <div className="text-xs text-[#808080]">Termux Web</div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? <TabBar /> : <SplitPane />}
      </div>
    </div>
  )
}
