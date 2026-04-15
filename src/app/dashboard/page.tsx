'use client'

import { useEffect, useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { isTauriBuild } from '@/lib/tauriDetect'
import dynamic from 'next/dynamic'

const SplitPane = dynamic(() => import('@/components/SplitPane').then(m => ({ default: m.SplitPane })), { ssr: false })
const TabBar = dynamic(() => import('@/components/TabBar').then(m => ({ default: m.TabBar })), { ssr: false })
const ProfileSidebar = dynamic(() => import('@/components/ProfileSidebar').then(m => ({ default: m.ProfileSidebar })), { ssr: false })
const SecurityModal = dynamic(() => import('@/components/SecurityModal').then(m => ({ default: m.SecurityModal })), { ssr: false })
const DirectoryPickerModal = dynamic(() => import('@/components/DirectoryPickerModal').then(m => ({ default: m.DirectoryPickerModal })), { ssr: false })
const BrowserPickerModal = dynamic(() => import('@/components/BrowserPickerModal').then(m => ({ default: m.BrowserPickerModal })), { ssr: false })

import { Suspense } from "react"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useIsMobile, useIsLandscape } from "@/hooks/useMediaQuery"
import { usePaneStore } from "@/hooks/usePaneStore"
import { User, Search, Play, Square, RotateCw, Zap } from "lucide-react"

// Tauri backend check interval
const BACKEND_CHECK_INTERVAL = 5000
const WEBSOCKET_URL = 'ws://localhost:8080'

function ServerControls({ serverRunning, onStart, onStop, onRestart, loading }: {
  serverRunning: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <span className="text-xs text-[#A1A1AA]">Checking...</span>
      ) : serverRunning ? (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#16C60C]" style={{ boxShadow: '0 0 6px #16C60C' }} />
            <span className="text-xs text-[#16C60C]">Server Running</span>
          </div>
          <button
            onClick={onRestart}
            className="flex items-center gap-1 rounded-full bg-[#27272A] px-2.5 py-1 text-xs text-[#A1A1AA] hover:bg-[#353535] hover:text-white transition-colors"
            title="Restart Server"
          >
            <RotateCw className="h-3 w-3" />
            Restart
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-1 rounded-full bg-red-900/50 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900 transition-colors"
            title="Stop Server"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E74856]" style={{ boxShadow: '0 0 6px #E74856' }} />
            <span className="text-xs text-[#E74856]">Server Stopped</span>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-1 rounded-full bg-green-900/50 px-2.5 py-1 text-xs text-green-400 hover:bg-green-900 transition-colors"
            title="Start Server"
          >
            <Play className="h-3 w-3 fill-current" />
            Start
          </button>
        </>
      )}
    </div>
  )
}

function DashboardContent() {
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscape()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [serverRunning, setServerRunning] = useState(false)
  const [checkingServer, setCheckingServer] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { isConnected, isAuthenticated, viewMode, setViewMode, panes, activePanes, sendRefocus } = usePaneStore()

  // Auto-start backend and check status in Tauri mode
  useEffect(() => {
    if (!isTauriBuild()) return

    // Periodic check
    checkIntervalRef.current = setInterval(async () => {
      try {
        const running = await invoke<boolean>('check_status')
        setServerRunning(running)
      } catch (err) {
        console.error('Server check failed:', err)
      }
    }, BACKEND_CHECK_INTERVAL)

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
    }
  }, [])

  const handleServerStart = async () => {
    setCheckingServer(true)
    try {
      await invoke('start_server')
      setServerRunning(true)
    } catch (err) {
      console.error('Start failed:', err)
    } finally {
      setCheckingServer(false)
    }
  }

  const handleServerStop = async () => {
    setCheckingServer(true)
    try {
      await invoke('stop_server')
      setServerRunning(false)
    } catch (err) {
      console.error('Stop failed:', err)
    } finally {
      setCheckingServer(false)
    }
  }

  const handleServerRestart = async () => {
    setCheckingServer(true)
    try {
      await invoke('restart_server')
      setServerRunning(true)
    } catch (err) {
      console.error('Restart failed:', err)
    } finally {
      setCheckingServer(false)
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

  // Get connection info from localStorage (set by backend on startup)
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [bootStatus, setBootStatus] = useState<'init' | 'checking' | 'starting' | 'connecting' | 'done'>('init')

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
          const storedUrl = localStorage.getItem("tunnelUrl")
          const storedToken = localStorage.getItem("authToken")
          if (storedUrl && storedToken) {
            setTunnelUrl(storedUrl)
            setAuthToken(storedToken)
          }
          setIsReady(true)
          clearTimeout(timeout)
          return
        }

        // In Tauri mode, use default local WebSocket
        setTunnelUrl(WEBSOCKET_URL)
        setAuthToken('termote-local')

        console.log('[Boot] Calling check_status...')
        const running = await invoke<boolean>('check_status')
        console.log('[Boot] check_status returned:', running)
        setServerRunning(running)

        if (!running) {
          console.log('[Boot] Starting server...')
          setBootStatus('starting')
          await invoke('start_server')
          console.log('[Boot] Server started')
          setServerRunning(true)
        }

        setBootStatus('connecting')
        setIsReady(true)
        clearTimeout(timeout)
      } catch (err) {
        console.error('[Boot] Init error:', err)
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
    if (isConnected) setWsConnected(true)
  }, [isConnected])

  useEffect(() => {
    return () => {
      if (disconnect) disconnect()
    }
  }, [disconnect])

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

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#080808]">
      {/* Connection status bar */}
      <div className="relative flex shrink-0 items-center border-b border-[#252525] bg-[#0d0d0d] px-4 py-2">
        {/* Status + Server Controls - left side */}
        <div className="flex items-center gap-4">
          {isTauri ? (
            <ServerControls
              serverRunning={serverRunning}
              onStart={handleServerStart}
              onStop={handleServerStop}
              onRestart={handleServerRestart}
              loading={checkingServer}
            />
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* View mode toggle - centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-[#27272A] p-1">
          <button
            onClick={() => {
              setViewMode("tabs")
              window.location.reload()
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              viewMode === "tabs"
                ? "bg-[#CCCCCC] text-black border border-[#CCCCCC]"
                : "text-[#CCCCCC] hover:text-white"
            }`}
          >
            Tabs
          </button>
          <button
            onClick={() => {
              setViewMode("panes")
              window.location.reload()
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition-all ${
              viewMode === "panes"
                ? "bg-[#CCCCCC] text-black border border-[#CCCCCC]"
                : "text-[#CCCCCC] hover:text-white"
            }`}
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
          onSignOut={() => {
            localStorage.removeItem("tunnelUrl")
            localStorage.removeItem("authToken")
            window.location.reload()
          }}
        />
      )}

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