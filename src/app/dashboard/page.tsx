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
import { useIsLandscape } from "@/hooks/useMediaQuery"
import { useIsTauri } from "@/hooks/useIsTauri"
import { usePaneStore } from "@/hooks/usePaneStore"
import { Search, Play, Zap, AlertTriangle, ExternalLink, Loader2, PanelRight, X } from "lucide-react"

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
  const isLandscape = useIsLandscape()
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

  const { isConnected, isAuthenticated, viewMode, setViewMode, profileSidebarCollapsed, toggleProfileSidebar } = usePaneStore()
  const { isTauri: isTauriApp, checked: tauriChecked } = useIsTauri()

  const applyRuntimeSnapshot = useCallback((snapshot: RuntimeSnapshot) => {
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

  // Set default view based on orientation on first load
  const initialLoadRef = useRef(false)
  useEffect(() => {
    if (!initialLoadRef.current && viewMode === "auto") {
      initialLoadRef.current = true
      setViewMode(isLandscape ? "panes" : "tabs")
    }
  }, [isLandscape, setViewMode, viewMode])

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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#080808]">
        <div className="mb-8 flex items-center gap-3">
          <StatusIcon className="h-6 w-6 animate-pulse text-[#16C60C]" />
          <span className="text-xl font-medium text-[#CCCCCC]">Termote</span>
        </div>
        <div className="flex items-center gap-2 text-[#A1A1AA]">
          <StatusIcon className="h-4 w-4 animate-pulse" />
          <span className="text-sm">{status.text}</span>
        </div>
        <div className="mt-4 flex items-center gap-1">
          <div className="h-1 w-2 rounded-full bg-[#16C60C] animate-pulse" />
          <div className="h-1 w-2 rounded-full bg-[#16C60C] animate-pulse [animation-delay:150ms]" />
          <div className="h-1 w-2 rounded-full bg-[#16C60C] animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  // Tauri mode - show connection status (connected to local backend)
  const isTauri = isTauriBuild()

  const shellClass = tauriChecked && isTauriApp ? "tauri-mica-shell" : "web-shell"

  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden ${shellClass}`}>
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
            <div data-tauri-no-drag className="flex items-center p-0.5 rounded-full bg-[#1a1a1a]/60 backdrop-blur-md">
              <button
                onClick={() => setViewMode("tabs")}
                className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                  viewMode === "tabs"
                    ? "bg-white/10 text-white"
                    : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                }`}
              >
                Tabs
              </button>
              <button
                onClick={() => setViewMode("panes")}
                className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer ${
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
            <div data-tauri-no-drag className="flex items-center mr-2">
              {searchOpen ? (
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-7 w-56 rounded-md bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 pl-8 pr-7 text-xs text-white placeholder-zinc-400 outline-none transition-all duration-150 focus:bg-[#1a1a1a]/95 focus:border-white/20 focus:ring-1 focus:ring-zinc-700 shadow-sm"
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false)
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear"
                    >
                      <X size={10} />
                    </button>
                  )}
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

      {/* Main content with sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area with left sidebar + topbar + panes */}
        <div className="main-column flex flex-1 flex-col overflow-hidden">
          {/* Connection status bar / Topbar (Only rendered in web version) */}
          {!isTauri && (
            <div
              data-mica-surface
              className="app-topbar relative flex shrink-0 items-center px-4 py-2 border-b border-[#252525] bg-[#0d0d0d]"
            >
              {/* Status + Server Controls - left side */}
              <div className="flex items-center gap-4">
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
                      ? isAuthenticated ? "0 0 6px #16C60C" : "0 0 6px #DCDCAA"
                      : tunnelStatus === "connecting" ? "0 0 6px #DCDCAA" : "0 0 6px #E74856"
                  }}
                />
                <span className="text-base font-medium text-[#CCCCCC] tracking-wide">Termote</span>
              </div>

              {/* View mode toggle - centered */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center p-0.5 rounded-full bg-[#1a1a1a]/60 backdrop-blur-md">
                <button
                  onClick={() => setViewMode("tabs")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                    viewMode === "tabs"
                      ? "bg-white/10 text-white"
                      : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                  }`}
                >
                  Tabs
                </button>
                <button
                  onClick={() => setViewMode("panes")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${
                    viewMode === "panes"
                      ? "bg-white/10 text-white"
                      : "text-[#9A9A9A] hover:text-white hover:bg-white/5"
                  }`}
                >
                  Panes
                </button>
              </div>

              {/* Search + Profile - right side */}
              <div className="ml-auto flex items-center gap-2">
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="h-8 w-56 rounded-md bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 pl-8 pr-7 text-xs text-white placeholder-zinc-400 outline-none transition-all duration-150 focus:bg-[#1a1a1a]/95 focus:border-white/20 focus:ring-1 focus:ring-zinc-700 shadow-sm"
                      onBlur={() => {
                        if (!searchQuery) setSearchOpen(false)
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Clear"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[#A1A1AA] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    title="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main panes area */}
          <div className={`flex-1 overflow-hidden ${
            tauriChecked && isTauriApp
              ? "rounded-tl-xl border-t border-l border-[#252525]/40 bg-[#080808]"
              : ""
          }`}>
            {showTabs ? <TabBar searchQuery={searchQuery} /> : <SplitPane searchQuery={searchQuery} />}
          </div>
        </div>

        {/* Profile sidebar - Tauri only, on RIGHT */}
        {tauriChecked && isTauriApp && (
          profileSidebarCollapsed ? (
            <div className="shrink-0 flex flex-col items-center gap-1 border-l border-[#353535] p-1 w-10 h-full bg-[#0d0d0d]">
              <button
                onClick={toggleProfileSidebar}
                title="Expand profile sidebar"
                className="w-8 h-8 mt-2 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white cursor-pointer"
              >
                <PanelRight size={14} className="rotate-180" />
              </button>
            </div>
          ) : (
            <div className="profile-sidebar shrink-0 h-full" data-mica-surface>
              <ProfilePane tunnelUrl={tunnelUrl || ""} authToken={authToken || ""} />
            </div>
          )
        )}
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
      <div className="flex h-screen w-full items-center justify-center bg-[#080808]">
        <div className="text-[#CCCCCC]">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
