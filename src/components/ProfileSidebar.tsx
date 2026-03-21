"use client"

import { useState } from "react"
import { Eye, EyeOff, Copy, Check, X, User, Link, Key, LogOut } from "lucide-react"

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

  const maskValue = (value: string) => "\u2022".repeat(Math.min(value.length, 20))

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(tunnelUrl)
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

      {/* Sidebar */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-[#1E1E1E] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#27272A]">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white">Profile</span>
          </div>
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
        <div className="border-t border-[#333333] p-4">
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
