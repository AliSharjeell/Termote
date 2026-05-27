"use client"

import { useState, useCallback, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { X, Loader2, AlertTriangle, ExternalLink, Check, Copy, Smartphone } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"

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

interface RuntimeStatePayload {
  tunnel_url?: unknown
  tunnelUrl?: unknown
  tunnel_running?: unknown
  tunnelRunning?: unknown
  auth_token?: unknown
  authToken?: unknown
}

function normalizeDevTunnelBaseUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  let url = rawUrl.trim()

  if (url.startsWith("wss://")) {
    url = url.replace("wss://", "https://")
  }
  if (url.startsWith("ws://")) {
    url = url.replace("ws://", "http://")
  }

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

function normalizeRuntimeState(state: unknown): RuntimeState {
  const payload: RuntimeStatePayload =
    state && typeof state === "object" ? state as RuntimeStatePayload : {}
  const tunnelUrl = payload.tunnel_url ?? payload.tunnelUrl
  const tunnelRunning = payload.tunnel_running ?? payload.tunnelRunning
  const authToken = payload.auth_token ?? payload.authToken

  return {
    tunnel_url: typeof tunnelUrl === "string" ? tunnelUrl : null,
    tunnel_running: typeof tunnelRunning === "boolean" ? tunnelRunning : false,
    auth_token: typeof authToken === "string" ? authToken : null,
  }
}

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

export function MobileAccessButton() {
  const { setMobileAccessModalOpen } = usePaneStore()
  const [showQRModal, setShowQRModal] = useState(false)

  // Sync state to store whenever it changes
  useEffect(() => {
    setMobileAccessModalOpen(showQRModal)
    return () => setMobileAccessModalOpen(false)
  }, [showQRModal, setMobileAccessModalOpen])

  const [qrBlurred, setQrBlurred] = useState(true)
  const [devtunnelStatus, setDevtunnelStatus] = useState<DevtunnelAuthStatus | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [mobileUrl, setMobileUrl] = useState<string | null>(null)
  const [mobileAccessError, setMobileAccessError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleTapQR = useCallback(() => {
    if (qrBlurred) {
      setQrBlurred(false)
    }
  }, [qrBlurred])

  const handleCopyLink = async () => {
    if (!mobileUrl) return
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {}
  }

  const handleMobileAccessClick = async () => {
    setMobileAccessError(null)
    setMobileUrl(null)
    setShowQRModal(true)
    setQrBlurred(true)
    setIsCheckingAuth(true)
    setDevtunnelStatus(null)

    const unlistenRef: { current: (() => void) | null } = { current: null }

    try {
      console.log("[MOBILE ACCESS] clicked")

      const authEventPromise = new Promise<DevtunnelAuthStatus>((resolve) => {
        listen<DevtunnelAuthStatus>('devtunnel-login-status', (event) => {
          console.log('[DevTunnel] Auth status update:', event.payload)
          setDevtunnelStatus(event.payload)

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

      await new Promise(r => setTimeout(r, 100))

      const rawState = await invoke("get_runtime_state")
      const state = normalizeRuntimeState(rawState)

      if (state.tunnel_running && state.tunnel_url && state.auth_token) {
        const url = buildMobileUrl(state.tunnel_url, state.auth_token)
        setMobileUrl(url)
        setDevtunnelStatus({ status: 'login_success', message: 'Dev Tunnel ready', url: null })
        setIsCheckingAuth(false)
        return
      }

      setDevtunnelStatus({ status: 'checking', message: 'Starting Dev Tunnel...', url: null })
      await invoke('start_remote_access')

      const authResult = await authEventPromise

      if (authResult.status !== 'login_success') {
        setIsCheckingAuth(false)
        return
      }

      setDevtunnelStatus({ status: 'checking', message: 'Waiting for tunnel URL...', url: null })
      const finalState = await waitForDevTunnelReady(120000, 1000, setDevtunnelStatus)

      if (!finalState.tunnel_url || !finalState.auth_token) {
        throw new Error("Dev Tunnel started but tunnel_url or auth_token is missing")
      }

      const url = buildMobileUrl(finalState.tunnel_url, finalState.auth_token)

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
      <button
        onClick={handleMobileAccessClick}
        title="Mobile Access"
        className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-[#333333] hover:text-white transition-colors gap-1.5"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Mobile Access</span>
      </button>

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
    </>
  )
}
