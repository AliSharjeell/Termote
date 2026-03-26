"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Check, X, Link, Key, LogOut, QrCode, Shield } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { usePaneStore } from "@/hooks/usePaneStore"

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  tunnelUrl: string
  authToken: string
  onSignOut: () => void
}

export function ProfileSidebar({ isOpen, onClose, tunnelUrl, authToken, onSignOut }: ProfileSidebarProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const setShowSecurityModal = usePaneStore((state) => state.setShowSecurityModal)

  const mobileUrl = `https://termote.vercel.app/?tunnel=${encodeURIComponent(tunnelUrl)}&token=${encodeURIComponent(authToken)}`

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
        </div>

        {/* Footer */}
        <div className="border-t border-[#333333] p-4 space-y-2">
          <button
            onClick={() => {
              onClose()
              setShowSecurityModal(true)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#27272A] px-4 py-3 text-sm font-medium text-white hover:bg-[#333333] transition-colors"
          >
            <Shield className="h-4 w-4" />
            Security & Devices
          </button>
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
