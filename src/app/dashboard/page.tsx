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

  const { isConnected, isAuthenticated, viewMode, setViewMode } = usePaneStore()

  // Determine which view to show based on viewMode and screen size
  const showTabs = viewMode === "tabs" || (viewMode === "auto" && isMobile)
  const showPanes = viewMode === "panes" || (viewMode === "auto" && !isMobile)

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

  const handleSignOut = () => {
    sessionStorage.removeItem("tunnelUrl")
    sessionStorage.removeItem("authToken")
    disconnect()
    router.push("/")
  }

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

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("tabs")}
            className={`rounded px-2 py-1 text-xs ${
              viewMode === "tabs" || (viewMode === "auto" && isMobile)
                ? "bg-[#0037DA] text-white"
                : "text-[#808080] hover:text-[#CCCCCC]"
            }`}
            title="Tabs view"
          >
            Tabs
          </button>
          <button
            onClick={() => setViewMode("panes")}
            className={`rounded px-2 py-1 text-xs ${
              viewMode === "panes" || (viewMode === "auto" && !isMobile)
                ? "bg-[#0037DA] text-white"
                : "text-[#808080] hover:text-[#CCCCCC]"
            }`}
            title="Panes view"
          >
            Panes
          </button>
          <button
            onClick={() => setViewMode("auto")}
            className={`rounded px-2 py-1 text-xs ${
              viewMode === "auto"
                ? "bg-[#0037DA] text-white"
                : "text-[#808080] hover:text-[#CCCCCC]"
            }`}
            title="Auto (follow screen)"
          >
            Auto
          </button>
          <button
            onClick={handleSignOut}
            className="ml-2 rounded bg-[#E74856] px-2 py-1 text-xs text-white hover:bg-[#ff3b30]"
            title="Sign out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {showTabs ? <TabBar /> : <SplitPane />}
      </div>
    </div>
  )
}
