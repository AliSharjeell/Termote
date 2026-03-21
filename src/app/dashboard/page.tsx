"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SplitPane } from "@/components/SplitPane"
import { TabBar } from "@/components/TabBar"
import { ProfileSidebar } from "@/components/ProfileSidebar"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { usePaneStore } from "@/hooks/usePaneStore"
import { User } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isReady, setIsReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isConnected, isAuthenticated, viewMode, setViewMode } = usePaneStore()

  // Determine which view to show based on viewMode
  const showTabs = viewMode === "tabs"
  const showPanes = viewMode === "panes"

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
      <div className="flex shrink-0 items-center justify-between border-b border-[#333333] bg-[#161616] px-4 py-2 rounded-none">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? isAuthenticated
                  ? "bg-[#16C60C]"
                  : "bg-[#DCDCAA]"
                : "bg-[#E74856]"
            }`}
            style={{
              boxShadow: isConnected
                ? isAuthenticated
                  ? "0 0 6px #16C60C"
                  : "0 0 6px #DCDCAA"
                : "0 0 6px #E74856"
            }}
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
        <div className="flex items-center gap-1 rounded-full bg-[#27272A] p-1">
          <button
            onClick={() => setViewMode("tabs")}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              viewMode === "tabs"
                ? "bg-white text-black shadow-sm"
                : "text-[#A1A1AA] hover:text-white"
            }`}
            title="Tabs view"
          >
            Tabs
          </button>
          <button
            onClick={() => setViewMode("panes")}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              viewMode === "panes"
                ? "bg-white text-black shadow-sm"
                : "text-[#A1A1AA] hover:text-white"
            }`}
            title="Panes view"
          >
            Panes
          </button>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] text-white hover:bg-[#333333] transition-colors"
          title="Profile"
        >
          <User className="h-4 w-4" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {showTabs ? <TabBar /> : <SplitPane />}
      </div>

      {/* Profile Sidebar */}
      {tunnelUrl && authToken && (
        <ProfileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          tunnelUrl={tunnelUrl}
          authToken={authToken}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  )
}
