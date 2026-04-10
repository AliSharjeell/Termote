"use client"

import { useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { X, Globe } from "lucide-react"

export function BrowserPickerModal() {
  const [url, setUrl] = useState("http://localhost:3000")
  const browserModalOpen = usePaneStore((state) => state.browserModalOpen)
  const spawnBrowserPane = usePaneStore((state) => state.spawnBrowserPane)
  const closeBrowserModal = usePaneStore((state) => state.closeBrowserModal)

  if (!browserModalOpen) return null

  const handleSpawn = () => {
    if (url.trim()) {
      spawnBrowserPane(url.trim())
      closeBrowserModal()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSpawn()
    if (e.key === "Escape") closeBrowserModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex w-[500px] flex-col rounded-2xl bg-[#161616] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-3">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-[#4AA]" />
            <span className="text-sm font-medium text-white">Open Browser Tab</span>
          </div>
          <button
            onClick={closeBrowserModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#808080] hover:bg-[#333333] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="http://localhost:3000"
            autoFocus
            className="w-full rounded-lg bg-[#27272A] px-3 py-2 text-sm text-white placeholder-[#808080] outline-none border border-[#333333] focus:border-white"
          />
          <p className="mt-2 text-xs text-[#808080]">
            Opens the URL in your default browser on this PC.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#333333] px-4 py-3">
          <button
            onClick={closeBrowserModal}
            className="rounded-lg bg-[#27272A] px-4 py-2 text-sm text-[#CCCCCC] hover:bg-[#333333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSpawn}
            disabled={!url.trim()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  )
}