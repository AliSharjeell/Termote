"use client"

import { useState, useEffect } from "react"
import { Copy, Check, X, QrCode, Bot, RefreshCw, Square, Link2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { invoke } from "@tauri-apps/api/core"

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  tunnelUrl: string
  authToken: string
  mobileUrl?: string
  onSignOut: () => void
}

function toWebSocketUrl(url: string): string {
  const parsed = new URL(url)
  if (parsed.protocol === "https:") {
    parsed.protocol = "wss:"
  } else if (parsed.protocol === "http:") {
    parsed.protocol = "ws:"
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "")
  if (!parsed.pathname.endsWith("/ws")) {
    parsed.pathname = `${parsed.pathname}/ws`.replace(/\/{2,}/g, "/")
  }
  parsed.search = ""
  parsed.hash = ""
  return parsed.toString()
}

function buildMobileUrl(tunnelUrl: string, authToken: string): string {
  try {
    const wsUrl = toWebSocketUrl(tunnelUrl)
    const dashboardUrl = new URL(wsUrl)
    dashboardUrl.protocol = dashboardUrl.protocol === "wss:" ? "https:" : "http:"
    dashboardUrl.pathname = "/dashboard/"
    dashboardUrl.search = ""
    dashboardUrl.hash = ""

    dashboardUrl.searchParams.set("tunnel", wsUrl)
    dashboardUrl.searchParams.set("token", authToken)
    return dashboardUrl.toString()
  } catch {
    return `${tunnelUrl.replace(/\/+$/, "")}/dashboard/?tunnel=${encodeURIComponent(tunnelUrl)}&token=${encodeURIComponent(authToken)}`
  }
}

function detectTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window
}

export function ProfileSidebar({ isOpen, onClose, tunnelUrl, authToken, mobileUrl: providedMobileUrl, onSignOut }: ProfileSidebarProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrBlurred, setQrBlurred] = useState(true)
  const [customCommand, setCustomCommand] = useState("")
  const [serverRunning, setServerRunning] = useState(true)
  const [serverAction, setServerAction] = useState<string | null>(null)
  const setShowSecurityModal = usePaneStore((state) => state.setShowSecurityModal)

  const isTauri = detectTauri()
  const mobileUrl = providedMobileUrl || buildMobileUrl(tunnelUrl, authToken)
  const aiCommand = usePaneStore((state) => state.aiCommand)
  const setAiCommand = usePaneStore((state) => state.setAiCommand)

  const aiOptions = [
    { value: "claude", label: "Claude" },
    { value: "claude-codex", label: "Claude CodeX" },
    { value: "custom", label: "Custom..." },
  ]

  const isCustomCommand = !!aiCommand && !aiOptions.slice(0, -1).some(o => o.value === aiCommand)

  useEffect(() => {
    if (isOpen && qrBlurred) {
      const timer = setTimeout(() => setQrBlurred(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, qrBlurred])

  useEffect(() => {
    const isCustom = !aiOptions.slice(0, -1).some(o => o.value === aiCommand)
    if (isCustom && aiCommand) {
      setCustomCommand(aiCommand)
    }
  }, [aiCommand])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  const handleRestartServer = async () => {
    if (!isTauri) return
    setServerAction("restarting")
    try {
      await invoke("restart_server")
      setServerRunning(true)
    } catch (err) {
      console.error("Restart failed:", err)
    } finally {
      setTimeout(() => setServerAction(null), 1000)
    }
  }

  const handleStopServer = async () => {
    if (!isTauri) return
    setServerAction("stopping")
    try {
      await invoke("stop_server")
      setServerRunning(false)
    } catch (err) {
      console.error("Stop failed:", err)
    } finally {
      setTimeout(() => setServerAction(null), 1000)
    }
  }

  const handleStartServer = async () => {
    if (!isTauri) return
    setServerAction("starting")
    try {
      await invoke("start_server")
      setServerRunning(true)
    } catch (err) {
      console.error("Start failed:", err)
    } finally {
      setTimeout(() => setServerAction(null), 1000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center rounded-2xl bg-[#161616] p-6 shadow-xl">
            <div className="mb-4 flex w-full items-center justify-between">
              <span className="text-sm font-medium text-white">Mobile Access</span>
              <button
                onClick={() => {
                  setShowQRModal(false)
                  setQrBlurred(true)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative rounded-xl bg-white p-4">
              {qrBlurred && (
                <div className="absolute inset-4 z-10 flex items-center justify-center">
                  <div className="h-4 w-4 animate-ping rounded-full bg-gray-400 opacity-75" />
                </div>
              )}
              <div className={`transition-all duration-500 ${qrBlurred ? "blur-md" : "blur-0"}`}>
                <QRCodeSVG
                  value={mobileUrl}
                  size={200}
                  level="M"
                />
              </div>
            </div>
            <p className="mt-4 max-w-[220px] text-center text-xs text-[#808080]">
              Scan this QR code with your mobile device to instantly connect and auto-login
            </p>
            <button
              onClick={handleCopyLink}
              className="mt-3 flex items-center gap-2 rounded-lg bg-[#27272A] px-4 py-2 text-sm text-white hover:bg-[#333333] transition-colors"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-[#161616] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-4">
          <span className="text-sm font-medium text-white">Profile</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Server Controls - Tauri only */}
          {isTauri && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#808080]">
                <RefreshCw className="h-4 w-4" />
                Server Controls
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#0C0C0C] p-3">
                <button
                  onClick={handleRestartServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center justify-center gap-2 rounded bg-[#27272A] px-3 py-2 text-xs font-medium text-white hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${serverAction === "restarting" ? "animate-spin" : ""}`} />
                  Restart
                </button>
                <button
                  onClick={handleStopServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center justify-center gap-2 rounded bg-[#27272A] px-3 py-2 text-xs font-medium text-white hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </button>
                <button
                  onClick={() => {
                    setShowQRModal(true)
                    setQrBlurred(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded bg-[#27272A] px-3 py-2 text-xs font-medium text-white hover:bg-[#333333] transition-colors"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Mobile Access
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 rounded bg-[#27272A] px-3 py-2 text-xs font-medium text-white hover:bg-[#333333] transition-colors"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-[#16C60C]" /> : <Link2 className="h-3.5 w-3.5" />}
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* AI CLI Settings */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#808080]">
              <Bot className="h-4 w-4" />
              Default AI CLI
            </label>
            <div className="flex flex-col gap-1.5 rounded-lg bg-[#0C0C0C] p-3">
              {aiOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    aiCommand === option.value || (option.value === "custom" && isCustomCommand)
                      ? "bg-[#27272A] text-white"
                      : "hover:bg-[#27272A]/50 text-[#808080]"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-cli"
                    value={option.value}
                    checked={aiCommand === option.value || (option.value === "custom" && isCustomCommand)}
                    onChange={() => {
                      if (option.value === "custom") {
                        if (customCommand) {
                          setAiCommand(customCommand)
                        }
                      } else {
                        setAiCommand(option.value)
                        setCustomCommand("")
                      }
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`h-3 w-3 rounded-full border ${
                      aiCommand === option.value || (option.value === "custom" && isCustomCommand)
                        ? "border-white bg-white"
                        : "border-[#808080]"
                    }`}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
              {isCustomCommand && (
                <div className="mt-1 pl-6">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => {
                      setCustomCommand(e.target.value)
                      setAiCommand(e.target.value)
                    }}
                    onBlur={() => {
                      if (customCommand) {
                        setAiCommand(customCommand)
                      }
                    }}
                    placeholder="Enter custom CLI command..."
                    className="w-full bg-[#1a1a1a] px-2 py-1.5 text-xs text-[#CCCCCC] outline-none border border-[#3B3B3B] rounded focus:border-white"
                  />
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#808080]">
              Quick-launch button in terminal header sends: {aiCommand || "claude"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-[#333333] p-4">
          <button
            onClick={() => setShowSecurityModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#27272A] px-4 py-3 text-sm font-medium text-white hover:bg-[#333333] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Security & Devices
          </button>
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E74856] px-4 py-3 text-sm font-medium text-white hover:bg-[#ff3b30] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}