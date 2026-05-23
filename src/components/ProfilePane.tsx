"use client"

import { useState, useEffect, useCallback } from "react"
import { PanelRight, RefreshCw, Square, QrCode, Copy, Check, Bot, Link2, X, Settings, Loader2, AlertTriangle, ExternalLink } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { useIsTauri } from "@/hooks/useIsTauri"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

interface DevtunnelAuthStatus {
  status: string
  message: string
  url: string | null
}

interface RuntimeState {
  tunnel_url: string | null
  tunnel_running: boolean
  auth_token: string | null
}

interface ProfilePaneProps {
  tunnelUrl: string
  authToken: string
  shareUrl?: string
  onStartRemoteAccess?: () => Promise<void>
  onDevtunnelAuthStatusChange?: (status: DevtunnelAuthStatus | null) => void
}

// Normalize Dev Tunnel base URL to origin
function normalizeDevTunnelBaseUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  let url = rawUrl.trim()

  // If backend accidentally returns websocket URL, convert it back to HTTP base
  if (url.startsWith("wss://")) {
    url = url.replace("wss://", "https://")
  }
  if (url.startsWith("ws://")) {
    url = url.replace("ws://", "http://")
  }

  // If backend returns host only, assume HTTPS
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }

  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return null
  }
}

// Build WebSocket URL from Dev Tunnel base
function toDevTunnelWebSocketUrl(rawUrl: string | null | undefined): string | null {
  const base = normalizeDevTunnelBaseUrl(rawUrl)
  if (!base) return null

  const parsed = new URL(base)
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:"
  parsed.pathname = "/ws"
  parsed.search = ""
  parsed.hash = ""

  return parsed.toString()
}

// Build mobile dashboard URL with tunnel and token params
function buildMobileUrl(tunnelUrl: string | null | undefined, authToken: string | null | undefined): string | null {
  if (!tunnelUrl || !authToken) return null

  const base = normalizeDevTunnelBaseUrl(tunnelUrl)
  const wsUrl = toDevTunnelWebSocketUrl(tunnelUrl)

  if (!base || !wsUrl) return null

  const mobileUrl = new URL("/dashboard/", base)
  mobileUrl.searchParams.set("tunnel", wsUrl)
  mobileUrl.searchParams.set("token", authToken)

  return mobileUrl.toString()
}

// Normalize runtime state from Rust (handles snake_case/camelCase)
function normalizeRuntimeState(state: any): RuntimeState {
  return {
    tunnel_url: state?.tunnel_url ?? state?.tunnelUrl ?? null,
    tunnel_running: state?.tunnel_running ?? state?.tunnelRunning ?? false,
    auth_token: state?.auth_token ?? state?.authToken ?? null,
  }
}

// Wait for Dev Tunnel to be ready with polling
async function waitForDevTunnelReady(
  timeoutMs: number = 120000,
  intervalMs: number = 1000,
  onStatus?: (status: DevtunnelAuthStatus) => void
): Promise<RuntimeState> {
  const startedAt = Date.now()
  let lastState: RuntimeState | null = null

  while (Date.now() - startedAt < timeoutMs) {
    const rawState = await invoke("get_runtime_state")
    const state = normalizeRuntimeState(rawState)
    lastState = state

    console.log("[MOBILE ACCESS] polling Dev Tunnel state", {
      tunnel_running: state.tunnel_running,
      has_tunnel_url: !!state.tunnel_url,
      has_auth_token: !!state.auth_token,
    })

    onStatus?.({
      status: "checking",
      message: "Waiting for Dev Tunnel...",
      url: null,
    })

    if (state.tunnel_running && state.tunnel_url && state.auth_token) {
      return state
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(
    `Timed out waiting for Dev Tunnel. Last state: ${JSON.stringify(lastState)}`
  )
}

export function ProfilePane({ tunnelUrl, authToken, shareUrl, onDevtunnelAuthStatusChange }: ProfilePaneProps) {
  const { isTauri, checked } = useIsTauri()
  const setShowSecurityModal = usePaneStore((state) => state.setShowSecurityModal)
  const aiCommand = usePaneStore((state) => state.aiCommand)
  const setAiCommand = usePaneStore((state) => state.setAiCommand)

  const [serverRunning, setServerRunning] = useState(true)
  const [serverAction, setServerAction] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrBlurred, setQrBlurred] = useState(true)
  const [customCommand, setCustomCommand] = useState("")
  const [customSelected, setCustomSelected] = useState(false)
  const [devtunnelStatus, setDevtunnelStatus] = useState<DevtunnelAuthStatus | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [mobileUrl, setMobileUrl] = useState<string | null>(null)
  const [mobileAccessError, setMobileAccessError] = useState<string | null>(null)
  const toggleProfileSidebar = usePaneStore((state) => state.toggleProfileSidebar)

  const isMica = false

  // Listen for devtunnel auth events from Rust backend
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async () => {
      try {
        unlisten = await listen<DevtunnelAuthStatus>('devtunnel-login-status', (event) => {
          console.log('[DevTunnel] Login status:', event.payload)
          setDevtunnelStatus(event.payload)
          onDevtunnelAuthStatusChange?.(event.payload)

          // Auto-dismiss success after 4s
          if (event.payload.status === 'login_success') {
            setTimeout(() => {
              setDevtunnelStatus(null)
              onDevtunnelAuthStatusChange?.(null)
            }, 4000)
          }
        })
      } catch (err) {
        console.error('[DevTunnel] Failed to listen for events:', err)
      }
    }

    setupListener()
    return () => {
      if (unlisten) unlisten()
    }
  }, [onDevtunnelAuthStatusChange])

  const aiOptions = [
    { value: "claude", label: "Claude" },
    { value: "codex", label: "Codex" },
    { value: "agy", label: "Agy" },
    { value: "opencode", label: "Opencode" },
  ]
  const isCustomCommand = customSelected || (!!aiCommand && !aiOptions.some(o => o.value === aiCommand) && aiCommand !== "")

  // Unblur QR when user taps
  const handleTapQR = useCallback(() => {
    if (qrBlurred) {
      setQrBlurred(false)
    }
  }, [qrBlurred])

  useEffect(() => {
    const isCustom = !aiOptions.some(o => o.value === aiCommand)
    if (isCustom && aiCommand) setCustomCommand(aiCommand)
  }, [aiCommand])

  const handleRestartServer = async () => {
    if (!isTauri) return
    setServerAction("restarting")
    try { await invoke("restart_server"); setServerRunning(true) }
    catch (err) { console.error("Restart failed:", err) }
    finally { setTimeout(() => setServerAction(null), 1000) }
  }

  const handleStopServer = async () => {
    if (!isTauri) return
    setServerAction("stopping")
    try { await invoke("stop_server"); setServerRunning(false) }
    catch (err) { console.error("Stop failed:", err) }
    finally { setTimeout(() => setServerAction(null), 1000) }
  }

  const handleCopyLink = async () => {
    if (!mobileUrl) return
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {}
  }

  // Main Mobile Access handler
  const handleMobileAccessClick = async () => {
    setMobileAccessError(null)
    setMobileUrl(null)
    setShowQRModal(true)
    setQrBlurred(true)
    setIsCheckingAuth(true)
    setDevtunnelStatus(null)

    // Use a ref to track the unlisten function
    const unlistenRef: { current: (() => void) | null } = { current: null }

    try {
      console.log("[MOBILE ACCESS] clicked")

      // Step 1: Set up listener for auth events
      const authEventPromise = new Promise<DevtunnelAuthStatus>((resolve) => {
        listen<DevtunnelAuthStatus>('devtunnel-login-status', (event) => {
          console.log('[DevTunnel] Auth status update:', event.payload)
          setDevtunnelStatus(event.payload)
          onDevtunnelAuthStatusChange?.(event.payload)

          if (event.payload.status === 'login_success' ||
              event.payload.status === 'login_failed' ||
              event.payload.status === 'login_url') {
            resolve(event.payload)
          }
        }).then((fn) => {
          unlistenRef.current = fn
        }).catch((err) => {
          console.error('[DevTunnel] Listener setup failed:', err)
          resolve({ status: 'login_failed', message: 'Failed to set up listener', url: null })
        })
      })

      // Small delay to ensure listener is active
      await new Promise(r => setTimeout(r, 100))

      // Step 2: Check current runtime state
      const rawState = await invoke("get_runtime_state")
      const state = normalizeRuntimeState(rawState)

      console.log("[MOBILE ACCESS] initial runtime state", {
        tunnel_url: state.tunnel_url,
        auth_token: state.auth_token ? "***" : null,
        tunnel_running: state.tunnel_running,
      })

      // Step 3: If tunnel already running with URL, we're good
      if (state.tunnel_running && state.tunnel_url && state.auth_token) {
        const url = buildMobileUrl(state.tunnel_url, state.auth_token)
        console.log("[DEV TUNNEL URL TEST]", {
          tunnelUrl: state.tunnel_url,
          authToken: state.auth_token ? "***" : null,
          websocketUrl: toDevTunnelWebSocketUrl(state.tunnel_url),
          mobileUrl: url,
        })
        setMobileUrl(url)
        setDevtunnelStatus({ status: 'login_success', message: 'Dev Tunnel ready', url: null })
        setIsCheckingAuth(false)
        return
      }

      // Step 4: Not connected, start remote access
      setDevtunnelStatus({ status: 'checking', message: 'Starting Dev Tunnel...', url: null })
      await invoke('start_remote_access')

      // Step 5: Wait for auth result
      const authResult = await authEventPromise

      if (authResult.status !== 'login_success') {
        setIsCheckingAuth(false)
        return
      }

      // Step 6: Wait for tunnel to be ready
      setDevtunnelStatus({ status: 'checking', message: 'Waiting for tunnel URL...', url: null })
      const finalState = await waitForDevTunnelReady(120000, 1000, setDevtunnelStatus)

      if (!finalState.tunnel_url || !finalState.auth_token) {
        throw new Error("Dev Tunnel started but tunnel_url or auth_token is missing")
      }

      // Step 7: Build mobile URL
      const url = buildMobileUrl(finalState.tunnel_url, finalState.auth_token)

      console.log("[DEV TUNNEL URL TEST]", {
        tunnelUrl: finalState.tunnel_url,
        authToken: finalState.auth_token ? "***" : null,
        websocketUrl: toDevTunnelWebSocketUrl(finalState.tunnel_url),
        mobileUrl: url,
      })

      if (url) {
        setMobileUrl(url)
        setDevtunnelStatus({ status: 'login_success', message: 'Dev Tunnel ready', url: null })
      } else {
        throw new Error("Failed to build mobile URL")
      }
    } catch (error) {
      console.error("[MOBILE ACCESS] failed", error)

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to generate Dev Tunnel mobile access URL"

      setMobileAccessError(message)
      setDevtunnelStatus({
        status: 'login_failed',
        message,
        url: null,
      })
    } finally {
      setIsCheckingAuth(false)
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }

  return (
    <>
      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowQRModal(false); setQrBlurred(true) }}>
          <div className="flex flex-col items-center rounded-2xl bg-[#161616] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex w-full items-center justify-between">
              <span className="text-sm font-medium text-white">Mobile Access</span>
              <button
                onClick={() => { setShowQRModal(false); setQrBlurred(true) }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading state */}
            {isCheckingAuth && !devtunnelStatus && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#27272A] px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-[#DCDCAA]" />
                <span className="text-sm text-[#CCCCCC]">Connecting to Dev Tunnel...</span>
              </div>
            )}

            {/* DevTunnel Auth Status */}
            {devtunnelStatus && devtunnelStatus.status !== 'login_success' && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#27272A] px-4 py-3 w-full max-w-[240px]">
                {devtunnelStatus.status === 'checking' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#DCDCAA] shrink-0" />
                    <span className="text-sm text-[#CCCCCC]">{devtunnelStatus.message}</span>
                  </>
                )}
                {devtunnelStatus.status === 'login_required' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-[#DCDCAA] shrink-0" />
                    <span className="text-sm text-[#CCCCCC]">{devtunnelStatus.message}</span>
                  </>
                )}
                {devtunnelStatus.status === 'login_url' && (
                  <>
                    <ExternalLink className="h-4 w-4 text-[#58A6FF] shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-[#CCCCCC]">{devtunnelStatus.message}</span>
                      {devtunnelStatus.url && (
                        <a
                          href={devtunnelStatus.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#58A6FF] hover:underline"
                        >
                          Open sign-in page
                        </a>
                      )}
                    </div>
                  </>
                )}
                {devtunnelStatus.status === 'login_failed' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-[#E74856] shrink-0" />
                    <span className="text-sm text-[#E74856]">{devtunnelStatus.message}</span>
                  </>
                )}
              </div>
            )}

            {/* Success state - show QR and link */}
            {mobileUrl ? (
              <>
                <div
                  className={`relative rounded-xl bg-white p-4 cursor-pointer transition-transform ${qrBlurred ? 'scale-95' : 'scale-100'}`}
                  onClick={handleTapQR}
                >
                  {qrBlurred && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-xl">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full border-2 border-[#DCDCAA] border-t-transparent animate-spin" />
                        <span className="text-xs text-[#CCCCCC]">Tap to reveal</span>
                      </div>
                    </div>
                  )}
                  <div className={`transition-all duration-300 ${qrBlurred ? "blur-md" : "blur-0"}`}>
                    <QRCodeSVG value={mobileUrl} size={220} level="M" />
                  </div>
                </div>

                <p className="mt-4 max-w-[260px] text-center text-xs text-[#808080]">
                  {qrBlurred ? "Tap the QR code to reveal it" : "Scan this QR code with your mobile device"}
                </p>

                <button
                  onClick={handleCopyLink}
                  disabled={!mobileUrl}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-[#27272A] px-4 py-2 text-sm text-white hover:bg-[#333333] disabled:opacity-50 transition-colors"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>

                {/* Show the actual link */}
                {!qrBlurred && (
                  <div className="mt-3 max-w-[280px] break-all text-center">
                    <code className="text-[10px] text-[#888] font-mono bg-[#1a1a1a] px-2 py-1 rounded">
                      {mobileUrl}
                    </code>
                  </div>
                )}
              </>
            ) : !isCheckingAuth && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-sm text-[#808080]">Dev Tunnel not ready</span>
                {mobileAccessError && (
                  <span className="text-xs text-[#E74856] mt-2">{mobileAccessError}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar content */}
      <div className={`flex flex-col h-full border-l border-[#353535] overflow-hidden ${isMica ? "bg-transparent border-transparent" : "bg-[#0d0d0d]"}`} style={{ width: 260 }}>
        {/* Collapse button */}
        <div className={`flex justify-start px-2 py-1 ${isMica ? "border-transparent" : "border-b border-[#1a1a1a]"}`}>
          <button
            onClick={toggleProfileSidebar}
            title="Collapse sidebar"
            className="text-[#CCCCCC] hover:text-white cursor-pointer"
          >
            <PanelRight size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Settings header */}
          <div className={`px-3 py-3 flex items-center gap-1.5 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
            <Settings className="h-3.5 w-3.5 text-[#808080] shrink-0" />
            <span className="text-xs font-normal text-white">
              Settings
            </span>
          </div>

          {/* Server Controls - Tauri only */}
          {checked && isTauri && (
            <div className={`px-1.5 py-3 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
              <div className="flex items-center gap-1.5 mb-2 px-1.5">
                <RefreshCw className="h-3 w-3 text-[#CCCCCC]" />
                <span className="text-[10px] text-[#CCCCCC]">Server Controls</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={handleRestartServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <RefreshCw className={`h-3 w-3 shrink-0 ${serverAction === "restarting" ? "animate-spin" : ""}`} />
                  Restart
                </button>
                <button
                  onClick={handleStopServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <Square className="h-3 w-3 shrink-0" />
                  Stop
                </button>
                <button
                  onClick={handleMobileAccessClick}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                >
                  <QrCode className="h-3 w-3 shrink-0" />
                  Mobile Access
                </button>
                <button
                  onClick={handleCopyLink}
                  disabled={!mobileUrl}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] disabled:opacity-50 transition-colors text-left"
                >
                  {copiedLink ? <Check className="h-3 w-3 shrink-0 text-[#16C60C]" /> : <Link2 className="h-3 w-3 shrink-0" />}
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* Default AI CLI - Both versions */}
          <div className="px-1.5 py-3">
            <div className="flex items-center gap-1.5 mb-2 px-1.5">
              <Bot className="h-3 w-3 text-[#CCCCCC]" />
              <span className="text-[10px] text-[#CCCCCC]">Default AI CLI</span>
            </div>
             <div className="space-y-0.5">
              {aiOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-1.5 px-1.5 py-2 rounded cursor-pointer transition-colors text-sm ${
                    aiCommand === option.value ? "text-[#CCCCCC] bg-white/[0.08]" : "text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-cli-profile"
                    value={option.value}
                    checked={aiCommand === option.value}
                    onChange={() => { setAiCommand(option.value); setCustomSelected(false) }}
                    className="sr-only"
                  />
                  <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                    aiCommand === option.value ? "border-[#CCCCCC] bg-[#CCCCCC]" : "border-[#555]"
                  }`} />
                  <span>{option.label}</span>
                </label>
              ))}
              {/* Custom option */}
              <label
                onClick={() => {
                  setCustomSelected(true)
                  if (customCommand.trim()) {
                    setAiCommand(customCommand.trim())
                  } else {
                    setAiCommand("")
                  }
                }}
                className={`flex items-center gap-1.5 px-1.5 py-2 rounded cursor-pointer transition-colors text-sm ${
                  isCustomCommand ? "text-[#CCCCCC] bg-white/[0.08]" : "text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <input
                  type="radio"
                  name="ai-cli-profile"
                  checked={isCustomCommand}
                  readOnly
                  className="sr-only"
                />
                <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                  isCustomCommand ? "border-[#CCCCCC] bg-[#CCCCCC]" : "border-[#555]"
                }`} />
                <span>Custom</span>
              </label>
              {/* Custom input dropdown */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCustomCommand ? "max-h-16 opacity-100 mt-1.5 mb-1" : "max-h-0 opacity-0 pointer-events-none"
              }`}>
                <div className="pl-[22px] pr-1">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => {
                      setCustomCommand(e.target.value)
                      setAiCommand(e.target.value)
                    }}
                    placeholder="Enter custom CLI command..."
                    className="w-full bg-[#1a1a1a] px-2.5 py-1.5 text-[11px] text-[#CCCCCC] placeholder-[#555] outline-none border border-[#3B3B3B] rounded-md focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/20"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#666] mt-1.5 px-1.5 mb-3">
              Sends: {aiCommand || "claude"}
            </p>
          </div>
        </div>

        {/* Security & Devices - Tauri only */}
        {checked && isTauri && (
          <div className={`px-1.5 py-3 shrink-0 ${isMica ? "border-transparent" : "border-t border-[#252525]"}`}>
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex w-full items-center justify-start gap-1.5 rounded bg-transparent px-1.5 py-2 text-sm text-white hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Security & Devices
            </button>
          </div>
        )}
      </div>
    </>
  )
}