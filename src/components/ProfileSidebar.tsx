"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Copy, Check, X, Link, Key, LogOut, QrCode, Shield, Bot } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"

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

export function ProfileSidebar({ isOpen, onClose, tunnelUrl, authToken, mobileUrl: providedMobileUrl, onSignOut }: ProfileSidebarProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [customCommand, setCustomCommand] = useState("")
  const setShowSecurityModal = usePaneStore((state) => state.setShowSecurityModal)

  const mobileUrl = providedMobileUrl || buildMobileUrl(tunnelUrl, authToken)
  const aiCommand = usePaneStore((state) => state.aiCommand)
  const setAiCommand = usePaneStore((state) => state.setAiCommand)

  const aiOptions = [
    { value: "claude", label: "Claude Code" },
    { value: "gemini", label: "Gemini CLI" },
    { value: "aichat", label: "aichat" },
    { value: "codex", label: "Codex" },
    { value: "llm", label: "llm" },
    { value: "opencode", label: "OpenCode" },
  ]

  const isCustomCommand = !!aiCommand && !aiOptions.some(o => o.value === aiCommand)

  // Sync custom command when aiCommand loads from localStorage
  useEffect(() => {
    const isCustom = !aiOptions.some(o => o.value === aiCommand)
    if (isCustom && aiCommand) {
      setCustomCommand(aiCommand)
    }
  }, [aiCommand])

  const maskValue = (value: string) => "\u2022".repeat(Math.min(value.length, 20))

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(authToken)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    } catch {
      // clipboard not available
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
            <div className="mb-4 flex items-center justify-between w-full">
              <span className="text-sm font-medium text-white">Scan to Connect</span>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG
                value={mobileUrl}
                size={200}
                level="M"
              />
            </div>
            <p className="mt-4 text-xs text-[#808080] text-center max-w-[220px]">
              Scan this QR code with your mobile device to instantly connect and auto-login
            </p>
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
          {/* URL Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#808080]">
              <Link className="h-4 w-4" />
              URL
            </label>
            <div className="flex flex-col gap-2 rounded-lg bg-[#0C0C0C] p-3">
              <span className="break-all text-sm text-[#CCCCCC] font-mono leading-relaxed">
                {showUrl ? tunnelUrl : maskValue(tunnelUrl)}
              </span>
              <div className="flex items-center gap-1 self-end">
                <button
                  onClick={() => setShowUrl(!showUrl)}
                  className="flex h-7 w-7 items-center justify-center rounded text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
                  title={showUrl ? "Hide" : "Show"}
                >
                  {showUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex h-7 w-7 items-center justify-center rounded text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
                  title="Copy"
                >
                  {copiedUrl ? <Check className="h-4 w-4 text-[#16C60C]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#808080]">
              <Key className="h-4 w-4" />
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-[#0C0C0C] p-3">
              <span className="flex-1 truncate text-sm text-[#CCCCCC] font-mono">
                {showPassword ? authToken : maskValue(authToken)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex h-7 w-7 items-center justify-center rounded text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
                  title={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleCopyPassword}
                  className="flex h-7 w-7 items-center justify-center rounded text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
                  title="Copy"
                >
                  {copiedPassword ? <Check className="h-4 w-4 text-[#16C60C]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

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
                    aiCommand === option.value
                      ? "bg-[#27272A] text-white"
                      : "hover:bg-[#27272A]/50 text-[#808080]"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-cli"
                    value={option.value}
                    checked={aiCommand === option.value}
                    onChange={() => {
                      setAiCommand(option.value)
                      setCustomCommand("")
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`h-3 w-3 rounded-full border ${
                      aiCommand === option.value
                        ? "border-white bg-white"
                        : "border-[#808080]"
                    }`}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
              {/* Custom command option */}
              <label
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isCustomCommand
                    ? "bg-[#27272A] text-white"
                    : "hover:bg-[#27272A]/50 text-[#808080]"
                }`}
              >
                <input
                  type="radio"
                  name="ai-cli"
                  value="__custom__"
                  checked={isCustomCommand}
                  onChange={() => {
                    if (customCommand) {
                      setAiCommand(customCommand)
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={`h-3 w-3 rounded-full border ${
                    isCustomCommand
                      ? "border-white bg-white"
                      : "border-[#808080]"
                  }`}
                />
                <span className="text-sm">Custom...</span>
              </label>
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
                    className="w-full bg-[#1a1a1a] px-2 py-1.5 text-xs text-[#CCCCCC] outline-none focus:outline-none border border-[#3B3B3B] rounded focus:border-white"
                  />
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#808080]">
              Quick-launch button in terminal header sends: {aiCommand}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333333] p-4 space-y-2">
          <button
            onClick={handleCopyUrl}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#27272A] px-4 py-3 text-sm font-medium text-white hover:bg-[#333333] transition-colors"
          >
            {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedUrl ? "Link Copied!" : "Copy Link"}
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#27272A] px-4 py-3 text-sm font-medium text-white hover:bg-[#333333] transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Open in Mobile
          </button>
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E74856] px-4 py-3 text-sm font-medium text-white hover:bg-[#ff3b30] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
