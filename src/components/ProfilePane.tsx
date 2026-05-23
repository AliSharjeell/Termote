"use client"

import { useState, useEffect } from "react"
import { PanelRight, RefreshCw, Square, QrCode, Copy, Check, Bot, Link2, X } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { useIsTauri } from "@/hooks/useIsTauri"
import { invoke } from "@tauri-apps/api/core"

function toWebSocketUrl(url: string): string {
  const parsed = new URL(url)
  if (parsed.protocol === "https:") parsed.protocol = "wss:"
  else if (parsed.protocol === "http:") parsed.protocol = "ws:"
  parsed.pathname = parsed.pathname.replace(/\/+$/, "")
  if (!parsed.pathname.endsWith("/ws")) parsed.pathname = `${parsed.pathname}/ws`.replace(/\/{2,}/g, "/")
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

interface ProfilePaneProps {
  tunnelUrl: string
  authToken: string
}

export function ProfilePane({ tunnelUrl, authToken }: ProfilePaneProps) {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isMica = false // Disabled - profile sidebar should have solid backgrounds
  const mobileUrl = buildMobileUrl(tunnelUrl, authToken)

  const aiOptions = [
    { value: "claude", label: "Claude" },
    { value: "claude-codex", label: "Claude CodeX" },
  ]
  const isCustomCommand = customSelected || (!!aiCommand && !aiOptions.some(o => o.value === aiCommand) && aiCommand !== "")

  useEffect(() => {
    if (showQRModal && qrBlurred) {
      const timer = setTimeout(() => setQrBlurred(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [showQRModal, qrBlurred])

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
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {}
  }

  return (
    <>
      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center rounded-2xl bg-[#161616] p-6 shadow-xl">
            <div className="mb-4 flex w-full items-center justify-between">
              <span className="text-sm font-medium text-white">Mobile Access</span>
              <button
                onClick={() => { setShowQRModal(false); setQrBlurred(true) }}
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
                <QRCodeSVG value={mobileUrl} size={200} level="M" />
              </div>
            </div>
            <p className="mt-4 max-w-[220px] text-center text-xs text-[#808080]">
              Scan this QR code with your mobile device to instantly connect
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

      {/* Sidebar content */}
      <div className={`flex shrink-0 flex-col border-l border-[#353535] overflow-hidden ${isMica ? "bg-transparent border-transparent" : "bg-[#0d0d0d]"}`} style={{ width: 260, height: "100%" }}>
        {/* Collapse button */}
        <div className={`flex justify-start px-2 py-1 ${isMica ? "border-transparent" : "border-b border-[#1a1a1a]"}`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Collapse sidebar"
            className="text-[#CCCCCC] hover:text-white"
          >
            <PanelRight size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className={`px-3 py-3 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
            <span className="text-xs font-medium text-white uppercase tracking-wider">
              {checked ? (isTauri ? "Profile (Tauri)" : "Profile") : "Loading..."}
            </span>
          </div>

          {/* Server Controls - Tauri only */}
          {checked && isTauri && (
            <div className={`px-3 py-3 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw className="h-3 w-3 text-[#808080]" />
                <span className="text-[10px] text-[#808080] uppercase tracking-wider">Server Controls</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={handleRestartServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-2 w-full rounded bg-[#1a1a1a] px-3 py-2.5 text-xs text-white hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <RefreshCw className={`h-3 w-3 shrink-0 ${serverAction === "restarting" ? "animate-spin" : ""}`} />
                  Restart
                </button>
                <button
                  onClick={handleStopServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-2 w-full rounded bg-[#1a1a1a] px-3 py-2.5 text-xs text-white hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <Square className="h-3 w-3 shrink-0" />
                  Stop
                </button>
                <button
                  onClick={() => { setShowQRModal(true); setQrBlurred(true) }}
                  className="flex items-center gap-2 w-full rounded bg-[#1a1a1a] px-3 py-2.5 text-xs text-white hover:bg-[#27272A] transition-colors text-left"
                >
                  <QrCode className="h-3 w-3 shrink-0" />
                  Mobile Access
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full rounded bg-[#1a1a1a] px-3 py-2.5 text-xs text-white hover:bg-[#27272A] transition-colors text-left"
                >
                  {copiedLink ? <Check className="h-3 w-3 shrink-0 text-[#16C60C]" /> : <Link2 className="h-3 w-3 shrink-0" />}
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* Default AI CLI - Both versions */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Bot className="h-3 w-3 text-[#808080]" />
              <span className="text-[10px] text-[#808080] uppercase tracking-wider">Default AI CLI</span>
            </div>
            <div className="space-y-0.5">
              {aiOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    aiCommand === option.value ? "bg-[#27272A] text-white" : "hover:bg-[#1a1a1a] text-[#808080]"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-cli-profile"
                    value={option.value}
                    checked={aiCommand === option.value}
                    onChange={() => { setAiCommand(option.value); setCustomCommand(""); setCustomSelected(false) }}
                    className="sr-only"
                  />
                  <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                    aiCommand === option.value ? "border-white bg-white" : "border-[#666]"
                  }`} />
                  <span className="text-xs">{option.label}</span>
                </label>
              ))}
              {/* Custom option */}
              <label
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isCustomCommand ? "bg-[#27272A] text-white" : "hover:bg-[#1a1a1a] text-[#808080]"
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                    isCustomCommand ? "border-white bg-white" : "border-[#666]"
                  }`}
                  onClick={() => setCustomSelected(true)}
                />
                <span className="text-xs">Custom</span>
              </label>
              {/* Custom input */}
              <div className={`mt-1 pl-4 ${isCustomCommand ? "block" : "hidden"}`}>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => {
                    setCustomCommand(e.target.value)
                    if (e.target.value.trim()) { setAiCommand(e.target.value.trim()); setCustomSelected(true) }
                  }}
                  placeholder="cmd..."
                  className="w-full bg-[#1a1a1a] px-2 py-1 text-[10px] text-[#CCCCCC] placeholder-[#666] outline-none border border-[#3B3B3B] rounded focus:border-[#58A6FF]"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#666] mt-1.5">
              Sends: {aiCommand || "claude"}
            </p>
          </div>

          {/* Security & Devices - Tauri only */}
          {checked && isTauri && (
            <div className={`px-3 py-3 ${isMica ? "border-transparent" : "border-t border-[#252525]"}`}>
              <button
                onClick={() => setShowSecurityModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#1a1a1a] px-4 py-2.5 text-xs text-white hover:bg-[#27272A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Security & Devices
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}