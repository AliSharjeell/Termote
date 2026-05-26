'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { isTauriBuild } from '@/lib/tauriDetect'
import dynamic from 'next/dynamic'

const SplitPane = dynamic(() => import('@/components/SplitPane').then(m => ({ default: m.SplitPane })), { ssr: false })
const TabBar = dynamic(() => import('@/components/TabBar').then(m => ({ default: m.TabBar })), { ssr: false })
const TauriTitlebar = dynamic(() => import('@/components/TauriTitlebar').then(m => ({ default: m.TauriTitlebar })), { ssr: false })
const ProfilePane = dynamic(() => import('@/components/ProfilePane').then(m => ({ default: m.ProfilePane })), { ssr: false })
const SecurityModal = dynamic(() => import('@/components/SecurityModal').then(m => ({ default: m.SecurityModal })), { ssr: false })
const DirectoryPickerModal = dynamic(() => import('@/components/DirectoryPickerModal').then(m => ({ default: m.DirectoryPickerModal })), { ssr: false })
const BrowserPickerModal = dynamic(() => import('@/components/BrowserPickerModal').then(m => ({ default: m.BrowserPickerModal })), { ssr: false })

import { Suspense } from "react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useIsTauri } from "@/hooks/useIsTauri"
import { MobileAccessButton } from "@/components/MobileAccessButton"
import { useFocusDevice } from "@/hooks/useFocusDevice"
import { usePaneStore } from "@/hooks/usePaneStore"
import { fitAllTerminals } from "@/lib/terminalRegistry"
import { clearSystemActivity, notifySystemActivity } from "@/lib/activityHeuristics"
import { Loader2, Search, ExternalLink, Crosshair, Zap, Play, AlertTriangle, PanelRight } from "lucide-react"
import { NotificationDropdown } from "@/components/NotificationDropdown"

// Tauri backend check interval
const BACKEND_CHECK_INTERVAL = 5000
const LOCAL_WS_URL = 'ws://127.0.0.1:9090/ws'
type RuntimeSnapshot = {
  backendRunning: boolean
  tunnelRunning: boolean
  backendUrl: string
  wsUrl: string
  authToken: string
  tunnelUrl: string | null
  mobileUrl: string
}

function DashboardContent() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [serverRunning, setServerRunning] = useState(false)
  const [checkingServer, setCheckingServer] = useState(false)
  const [runtime, setRuntime] = useState<RuntimeSnapshot | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [copiedMobileUrl, setCopiedMobileUrl] = useState(false)
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [bootStatus, setBootStatus] = useState<'init' | 'checking' | 'starting' | 'connecting' | 'done'>('init')
  const [devtunnelLoginStatus, setDevtunnelLoginStatus] = useState<{
    status: string
    message: string
    url: string | null
  } | null>(null)

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const backendRunningRef = useRef(false)
  const hasBackendSnapshotRef = useRef(false)

  const { isConnected, isAuthenticated, viewMode, setViewMode, profileSidebarCollapsed, tabsSidebarCollapsed, tabsProfileSidebarCollapsed, hasHydrated, setProfileSidebarCollapsed, setTabsSidebarCollapsed, setTabsProfileSidebarCollapsed, toggleProfileSidebar, toggleTabsSidebar, toggleTabsProfileSidebar } = usePaneStore()
  const { isTauri: isTauriApp, checked: tauriChecked } = useIsTauri()

  const focusThisDevice = useFocusDevice()

  const applyRuntimeSnapshot = useCallback((snapshot: RuntimeSnapshot) => {
    if (hasBackendSnapshotRef.current && backendRunningRef.current && !snapshot.backendRunning) {
      notifySystemActivity(
        "termote-backend",
        "Termote backend",
        "crashed",
        "Local backend stopped"
      )
    }

    if (snapshot.backendRunning) {
      clearSystemActivity("termote-backend")
    }

    backendRunningRef.current = snapshot.backendRunning
    hasBackendSnapshotRef.current = true

    setRuntime(snapshot)
    setServerRunning(snapshot.backendRunning)
    // In Tauri mode, ALWAYS connect locally - the snapshot.wsUrl changes to the
    // devtunnel WSS URL when remote access is active, which would break our local connection.
    // Only browser/mobile clients use the tunnel URL for WebSocket.
    setTunnelUrl(snapshot.backendRunning ? LOCAL_WS_URL : null)
    setShareUrl(snapshot.tunnelUrl || snapshot.backendUrl)
    setAuthToken(snapshot.authToken)
  }, [])

  // Auto-start backend and check status in Tauri mode
  useEffect(() => {
    if (!isTauriBuild()) return

    // Listen for devtunnel login status events from Rust backend
    let unlistenLogin: (() => void) | null = null
    listen<{ status: string; message: string; url: string | null }>('devtunnel-login-status', (event) => {
      console.log('[DevTunnel] Login status:', event.payload)
      setDevtunnelLoginStatus(event.payload)
      // Auto-dismiss success messages after 4 seconds
      if (event.payload.status === 'login_success') {
        setTimeout(() => setDevtunnelLoginStatus(null), 4000)
      }
    }).then(unlisten => {
      unlistenLogin = unlisten
    })

    // Periodic check
    checkIntervalRef.current = setInterval(async () => {
      try {
        const running = await invoke<boolean>('check_status')
        const snapshot = await invoke<RuntimeSnapshot>('get_runtime_state')
        applyRuntimeSnapshot({ ...snapshot, backendRunning: running })
        if (running) setServerError(null)
      } catch (err) {
        console.error('Server check failed:', err)
      }
    }, BACKEND_CHECK_INTERVAL)

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      if (unlistenLogin) unlistenLogin()
    }
  }, [applyRuntimeSnapshot])

  const handleServerStart = async () => {
    setCheckingServer(true)
    setServerError(null)
    try {
      const snapshot = await invoke<RuntimeSnapshot>('start_server')
      applyRuntimeSnapshot(snapshot)
    } catch (err) {
      console.error('Start failed:', err)
      setServerError(`Start failed: ${String(err)}`)
    } finally {
      setCheckingServer(false)
    }
  }

  const handleServerStop = async () => {
    setCheckingServer(true)
    setServerError(null)
    try {
      const snapshot = await invoke<RuntimeSnapshot>('stop_server')
      applyRuntimeSnapshot(snapshot)
    } catch (err) {
      console.error('Stop failed:', err)
      setServerError(`Stop failed: ${String(err)}`)
    } finally {
      setCheckingServer(false)
    }
  }

  const handleServerRestart = async () => {
    setCheckingServer(true)
    setServerError(null)
    try {
      const snapshot = await invoke<RuntimeSnapshot>('restart_server')
      applyRuntimeSnapshot(snapshot)
    } catch (err) {
      console.error('Restart failed:', err)
      setServerError(`Restart failed: ${String(err)}`)
    } finally {
      setCheckingServer(false)
    }
  }

  const handleRemoteStart = async () => {
    setRemoteLoading(true)
    setRemoteError(null)
    try {
      const snapshot = await invoke<RuntimeSnapshot>('start_remote_access')
      applyRuntimeSnapshot(snapshot)
    } catch (err) {
      setRemoteError(String(err))
    } finally {
      setRemoteLoading(false)
    }
  }

  const handleRemoteStop = async () => {
    setRemoteLoading(true)
    setRemoteError(null)
    try {
      const snapshot = await invoke<RuntimeSnapshot>('stop_remote_access')
      applyRuntimeSnapshot(snapshot)
    } catch (err) {
      setRemoteError(String(err))
    } finally {
      setRemoteLoading(false)
    }
  }

  const handleCopyMobileUrl = async () => {
    if (!runtime?.mobileUrl) return
    try {
      await navigator.clipboard.writeText(runtime.mobileUrl)
      setCopiedMobileUrl(true)
      setTimeout(() => setCopiedMobileUrl(false), 2000)
    } catch (err) {
      setRemoteError(String(err))
    }
  }

  // Set platform-specific UI defaults on startup (runs once after hydration + platform detection)
  const initializedRef = useRef(false)
  useEffect(() => {
    // Wait for hydration and platform detection
    if (!hasHydrated) return
    if (!tauriChecked) return
    if (initializedRef.current) return

    initializedRef.current = true

    console.log("[STARTUP UI DEFAULTS]", {
      tauriChecked,
      isTauri: isTauriApp,
      selectedMode: isTauriApp ? "panes" : "tabs",
      profileSidebarCollapsed: isTauriApp ? true : "n/a",
      tabsSidebarCollapsed: !isTauriApp ? true : "n/a",
      tabsProfileSidebarCollapsed: !isTauriApp ? true : "n/a",
    })

    if (isTauriApp) {
      // Tauri desktop: panes mode + right profile sidebar collapsed
      setViewMode("panes")
      setProfileSidebarCollapsed(true)
    } else {
      // Web browser: tabs mode + both sidebars collapsed
      setViewMode("tabs")
      setProfileSidebarCollapsed(true)
      setTabsSidebarCollapsed(true)
      setTabsProfileSidebarCollapsed(true)
    }

    console.log("[CURRENT UI STATE after init]", {
      viewMode,
      profileSidebarCollapsed,
      tabsSidebarCollapsed,
      tabsProfileSidebarCollapsed,
    })
  }, [
    hasHydrated,
    tauriChecked,
    isTauriApp,
    setViewMode,
    setProfileSidebarCollapsed,
    setTabsSidebarCollapsed,
    setTabsProfileSidebarCollapsed,
    viewMode,
    profileSidebarCollapsed,
    tabsSidebarCollapsed,
    tabsProfileSidebarCollapsed,
  ])

  // Fit all terminals when view mode changes
  useEffect(() => {
    setTimeout(() => fitAllTerminals("viewMode-change"), 100)
  }, [viewMode])

  // Fit all terminals when sidebar states change
  useEffect(() => {
    setTimeout(() => fitAllTerminals("layout-change"), 100)
  }, [
    profileSidebarCollapsed,
    tabsSidebarCollapsed,
    tabsProfileSidebarCollapsed,
  ])

  const showTabs = viewMode === "tabs"

  useEffect(() => {
    console.log('[Boot] Starting initialization')

    // Fallback timeout - ensure dashboard shows even if Tauri commands hang
    const timeout = setTimeout(() => {
      console.warn('[Boot] Timeout hit - forcing isReady=true')
      setIsReady(true)
      setBootStatus('done')
    }, 5000)

    const init = async () => {
      try {
        const isTauri = isTauriBuild()
        console.log('[Boot] isTauri:', isTauri)

        if (!isTauri) {
          const params = new URLSearchParams(window.location.search)
          const queryTunnel = params.get("tunnel")
          const queryToken = params.get("token")
          const storedUrl = localStorage.getItem("tunnelUrl")
          const storedToken = localStorage.getItem("authToken")
          const nextTunnel = queryTunnel || storedUrl
          const nextToken = queryToken || storedToken

          if (queryTunnel) {
            localStorage.setItem("tunnelUrl", queryTunnel)
          }
          if (queryToken) {
            localStorage.setItem("authToken", queryToken)
          }
          if (nextTunnel && nextToken) {
            setTunnelUrl(nextTunnel)
            setShareUrl(nextTunnel)
            setAuthToken(nextToken)
          }
          setIsReady(true)
          clearTimeout(timeout)
          return
        }

        setBootStatus('checking')
        const initialSnapshot = await invoke<RuntimeSnapshot>('get_runtime_state')
        applyRuntimeSnapshot(initialSnapshot)
        console.log('[Boot] runtime state:', initialSnapshot)

        if (!initialSnapshot.backendRunning) {
          console.log('[Boot] Starting server...')
          setBootStatus('starting')
          const startedSnapshot = await invoke<RuntimeSnapshot>('start_server')
          applyRuntimeSnapshot(startedSnapshot)
          console.log('[Boot] Server started:', startedSnapshot)
        }

        setBootStatus('connecting')
        setIsReady(true)
        clearTimeout(timeout)
      } catch (err) {
        console.error('[Boot] Init error:', err)
        setServerError(`Backend init failed: ${String(err)}`)
        setIsReady(true)
        setBootStatus('done')
        clearTimeout(timeout)
      }
    }

    init()
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Connect to WebSocket
  const { disconnect, tunnelStatus } = useWebSocket({
    url: tunnelUrl,
    token: authToken,
  })

  useEffect(() => {
    return () => {
      if (disconnect) disconnect()
    }
  }, [disconnect])

  // Tauri Mica - toggle class on html element for CSS targeting
  // Must be after useWebSocket but before any early returns
  useEffect(() => {
    if (!tauriChecked) return
    document.documentElement.classList.toggle("tauri-mica", isTauriApp)
    return () => {
      document.documentElement.classList.remove("tauri-mica")
    }
  }, [tauriChecked, isTauriApp])

  if (!isReady) {
    const statusMessages = {
      init: { text: 'Initializing...', icon: Zap },
      checking: { text: 'Checking server status...', icon: Zap },
      starting: { text: 'Starting backend server...', icon: Play },
      connecting: { text: 'Connecting to server...', icon: Zap },
      done: { text: 'Ready!', icon: Zap },
    }
    const status = statusMessages[bootStatus]
    const StatusIcon = status.icon

    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#080808]">
        <div className="mb-8 flex items-center gap-3">
          <StatusIcon className="h-6 w-6 animate-pulse text-white" />
          <span className="text-xl font-medium text-[#CCCCCC]">Termote</span>
        </div>
        <div className="flex items-center gap-2 text-[#A1A1AA]">
          <StatusIcon className="h-4 w-4 animate-pulse" />
          <span className="text-sm">{status.text}</span>
        </div>
        <div className="mt-4 flex items-center gap-1">
          <div className="h-1 w-2 rounded-full bg-white animate-pulse" />
          <div className="h-1 w-2 rounded-full bg-white animate-pulse [animation-delay:150ms]" />
          <div className="h-1 w-2 rounded-full bg-white animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  // Tauri mode - show connection status (connected to local backend)
  const isTauri = isTauriBuild()
  const shellClass = tauriChecked && isTauriApp ? "tauri-mica-shell" : "web-shell"

  return (
    <div className={`flex w-full flex-col overflow-hidden h-[var(--visual-viewport-height,100dvh)] ${shellClass}`}>
      {/* Tauri custom titlebar */}
      <div data-mica-surface>
        <TauriTitlebar
          left={
            <div data-tauri-drag-region className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full shrink-0 ${
                  serverRunning ? "bg-[#16C60C]" : "bg-[#E74856]"
                }`}
                style={{
                  boxShadow: serverRunning ? "0 0 6px #16C60C" : "0 0 6px #E74856"
                }}
              />
              <span className="text-sm text-[#CCCCCC]">Termote</span>
              <button
                onClick={focusThisDevice}
                title="Focus"
                className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-[#333333] hover:text-white transition-colors gap-1.5"
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Focus</span>
              </button>
              <MobileAccessButton />
              {serverError && (
                <div data-tauri-no-drag className="flex min-w-0 max-w-80 items-center gap-2 rounded-full bg-[#3b1117] px-3 py-1 text-xs text-[#FCA5A5]" title={serverError}>
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span className="truncate">{serverError}</span>
                </div>
              )}
              {/* DevTunnel login status banner */}
              {devtunnelLoginStatus && devtunnelLoginStatus.status !== 'login_success' && devtunnelLoginStatus.status !== 'checking' && (
                <div data-tauri-no-drag className="flex items-center gap-2 rounded-full bg-[#44380A] px-3 py-1 text-xs text-[#DCDCAA]">
                  {devtunnelLoginStatus.status === 'login_url' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{devtunnelLoginStatus.message}</span>
                      {devtunnelLoginStatus.url && (
                        <a
                          href={devtunnelLoginStatus.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#58A6FF] hover:underline shrink-0"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </>
                  ) : devtunnelLoginStatus.status === 'login_failed' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 shrink-0 text-[#E74856]" />
                      <span className="truncate text-[#E74856]">{devtunnelLoginStatus.message}</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span className="truncate">{devtunnelLoginStatus.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          }
          center={
            <div data-tauri-no-drag className="flex items-center gap-2 p-0.5 rounded-full bg-[#1a1a1a]/60 backdrop-blur-md">
              <button
                onClick={() => setViewMode("tabs")}
                className={`rounded-full px-3.5 py-1 text-[11px] font-normal transition-all duration-150 cursor-pointer ${
                  viewMode === "tabs"
                    ? "bg-white/10 text-white"
                    : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                }`}
              >
                Tabs
              </button>
              <button
                onClick={() => setViewMode("panes")}
                className={`rounded-full px-3.5 py-1 text-[11px] font-normal transition-all duration-150 cursor-pointer ${
                  viewMode === "panes"
                    ? "bg-white/10 text-white"
                    : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                }`}
              >
                Panes
              </button>
            </div>
          }
          right={
            <div data-tauri-no-drag className="flex items-center mr-2 gap-1">
              <NotificationDropdown compact />
              {searchOpen ? (
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-7 w-48 rounded-full bg-white/5 backdrop-blur-md border border-white/10 pl-8 pr-3 text-xs text-white placeholder-zinc-400 outline-none transition-all focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false)
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-[#A1A1AA] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Connection status bar / Topbar (Only rendered in web version) */}
      {!isTauri && (
        <div
          data-mica-surface
          className="app-topbar relative flex flex-col shrink-0 border-b border-[#252525] bg-[#0d0d0d]"
        >
          {/* Row 1 */}
          <div className="relative flex items-center px-4 py-3">
            {/* Status + Server Controls */}
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full shrink-0 ${
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
                    ? isAuthenticated ? "0 0 6px #16C60C" : "0 0 6px #DCDCAA"
                    : tunnelStatus === "connecting" ? "0 0 6px #DCDCAA" : "0 0 6px #E74856"
                }}
              />
               <span className="text-lg font-normal text-[#CCCCCC] tracking-wide">Termote</span>
            </div>

            {/* View mode toggle - centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 p-1 rounded-full bg-[#1a1a1a]/60 backdrop-blur-md">
              <button
                onClick={() => setViewMode("tabs")}
                className={`rounded-full px-5 py-2.5 text-sm font-normal transition-all duration-150 cursor-pointer ${
                  viewMode === "tabs"
                    ? "bg-white/10 text-white"
                    : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                }`}
              >
                Tabs
              </button>
              <button
                onClick={() => setViewMode("panes")}
                className={`rounded-full px-5 py-2.5 text-sm font-normal transition-all duration-150 cursor-pointer ${
                  viewMode === "panes"
                    ? "bg-white/10 text-white"
                    : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                }`}
              >
                Panes
              </button>
            </div>

            {/* Search */}
            <div className="ml-auto flex items-center">
              {searchOpen ? (
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-10 w-44 sm:w-56 rounded-full bg-white/5 backdrop-blur-md border border-white/10 pl-10 pr-4 text-sm text-white placeholder-zinc-400 outline-none transition-all focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20"
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false)
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-[#A1A1AA] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="relative flex items-center justify-center px-4 pb-3 gap-2">
            {/* Left side: Notification */}
            <div className="absolute left-4">
              <NotificationDropdown />
            </div>
            {/* Center: Focus button */}
            <button
              onClick={focusThisDevice}
              title="Focus"
              className="flex items-center justify-center rounded-md p-2.5 px-4 text-gray-400 hover:bg-[#333333] hover:text-white transition-colors gap-2"
            >
              <Crosshair className="h-5 w-5" />
              <span className="text-sm font-medium">Focus</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content with sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area with left sidebar + panes */}
        <div className="main-column flex flex-1 flex-col overflow-hidden">
          {/* Main panes area */}
          <div className="flex-1 overflow-hidden">
            {showTabs ? <TabBar searchQuery={searchQuery} /> : <SplitPane searchQuery={searchQuery} />}
          </div>
        </div>

      {/* Profile sidebar - on RIGHT (both panes and tabs mode) */}
      {profileSidebarCollapsed
        ? (
          <div className="profile-sidebar-collapsed shrink-0 flex flex-col items-center gap-1 p-1 w-10 h-full">
            <button
              onClick={toggleProfileSidebar}
              title="Expand profile sidebar"
              className="w-10 h-10 sm:w-8 sm:h-8 mt-2 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white cursor-pointer"
            >
              <PanelRight size={18} className="rotate-180" />
            </button>
          </div>
        ) : (
          <div className="profile-sidebar shrink-0 h-full">
            <ProfilePane tunnelUrl={tunnelUrl || ""} authToken={authToken || ""} shareUrl={shareUrl || undefined} />
          </div>
        )
      }
      </div>

      {/* Modals */}
      <SecurityModal />
      <DirectoryPickerModal />
      <BrowserPickerModal />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-[var(--visual-viewport-height,100dvh)] w-full items-center justify-center bg-[#080808]">
        <div className="text-[#CCCCCC]">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
