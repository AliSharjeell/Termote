"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SplitPane } from "@/components/SplitPane"
import { TabBar } from "@/components/TabBar"
import { ProfileSidebar } from "@/components/ProfileSidebar"
import { SecurityModal } from "@/components/SecurityModal"
import { DirectoryPickerModal } from "@/components/DirectoryPickerModal"
import { BrowserPickerModal } from "@/components/BrowserPickerModal"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useIsMobile, useIsLandscape } from "@/hooks/useMediaQuery"
import { usePaneStore } from "@/hooks/usePaneStore"
import { User, RefreshCw, Search } from "lucide-react"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()
  const [isReady, setIsReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { isConnected, isAuthenticated, viewMode, setViewMode, panes, activePanes, sendRefocus } = usePaneStore()

  // Set default view based on orientation on first load only if no explicit preference saved
  const initialLoadRef = useRef(false)
  useEffect(() => {
    if (!initialLoadRef.current && isReady) {
      initialLoadRef.current = true
      // Only apply orientation-based default if viewMode is still "auto" (no user preference saved)
      if (viewMode === "auto") {
        setViewMode(isLandscape ? "panes" : "tabs")
      }
      // If viewMode is "tabs" or "panes", user already has an explicit preference - do nothing
    }
  }, [isReady, isLandscape, setViewMode, viewMode])

  // Determine which view to show based on viewMode
  const showTabs = viewMode === "tabs"
  const showPanes = viewMode === "panes"

  // Get connection info from sessionStorage or URL params
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    // First check URL params (from QR code /launch link)
    const urlParam = searchParams.get("tunnel")
    const tokenParam = searchParams.get("token")

    let url = urlParam
    let token = tokenParam

    // Fall back to localStorage for persistence across reloads
    if (!url || !token) {
      url = localStorage.getItem("tunnelUrl")
      token = localStorage.getItem("authToken")
    }

    // If we have URL params, save to localStorage for future reloads
    // Decode the tunnel URL since it's sent URL-encoded from the landing page
    if (urlParam && tokenParam) {
      const decodedUrl = decodeURIComponent(urlParam)
      localStorage.setItem("tunnelUrl", decodedUrl)
      localStorage.setItem("authToken", tokenParam)
      // Clear URL params for security - don't expose token in address bar
      window.history.replaceState({}, "", "/dashboard")
    }

    if (!url || !token) {
      router.push("/")
      return
    }

    setTunnelUrl(url)
    setAuthToken(token)
    setIsReady(true)
  }, [router, searchParams])

  // Connect to WebSocket
  const { disconnect, tunnelStatus } = useWebSocket({
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
    localStorage.removeItem("tunnelUrl")
    localStorage.removeItem("authToken")
    disconnect()
    router.push("/")
  }

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080808]">
        <div className="text-[#CCCCCC]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#080808]">
      {/* Connection status bar */}
      <div className="relative flex shrink-0 items-center border-b border-[#252525] bg-[#0d0d0d] px-4 py-2">
        {/* Status + Focus - left side */}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full shrink-0 ${
              isConnected
                ? isAuthenticated
                  ? "bg-[#16C60C]"
                  : "bg-[#DCDCAA]"
                : tunnelStatus === "connecting"
                  ? "bg-[#DCDCAA] animate-pulse"
                  : "bg-[#E74856]"
            }`}
            style={{
              boxShadow: isConnected
                ? isAuthenticated
                  ? "0 0 6px #16C60C"
                  : "0 0 6px #DCDCAA"
                : tunnelStatus === "connecting"
                  ? "0 0 6px #DCDCAA"
                  : "0 0 6px #E74856"
            }}
          />
          <span className="text-base font-medium text-[#CCCCCC] tracking-wide">Termote</span>
          />
          {tunnelStatus === "connecting" && !isConnected && (
            <span className="text-xs text-[#DCDCAA]">Connecting...</span>
          )}
          {tunnelStatus === "failed" && (
            <span className="text-xs text-[#E74856]">Connection failed - retrying...</span>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 rounded-full bg-[#27272A] px-2 py-1 text-xs text-[#A1A1AA] hover:bg-[#252525] hover:text-white transition-colors ml-1"
            title="Focus - reset terminal size to this device"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        {/* View mode toggle - centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-[#27272A] p-1">
          <button
            onClick={() => {
              setViewMode("tabs")
              // Reload to reinitialize terminals fresh in new mode
              window.location.reload()
            }}
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
            onClick={() => {
              setViewMode("panes")
              // Reload to reinitialize terminals fresh in new mode
              window.location.reload()
            }}
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

        {/* Search + Profile - right side */}
        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#808080]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-8 w-48 rounded-full bg-[#27272A] pl-8 pr-3 text-xs text-white placeholder-[#808080] outline-none focus:ring-1 focus:ring-[#52525B]"
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false)
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] text-[#A1A1AA] hover:bg-[#252525] hover:text-white transition-colors"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] text-white hover:bg-[#252525] transition-colors"
            title="Profile"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {showTabs ? <TabBar searchQuery={searchQuery} /> : <SplitPane searchQuery={searchQuery} />}
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

      {/* Security Modal */}
      <SecurityModal />

      {/* Directory Picker Modal */}
      <DirectoryPickerModal />

      {/* Browser Picker Modal */}
      <BrowserPickerModal />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#080808]">
        <div className="text-[#CCCCCC]">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
