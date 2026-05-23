"use client"

import { useState } from "react"
import { Monitor, Globe, RefreshCw, ExternalLink } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import { DevicePreviewModal } from "./DevicePreviewModal"
import type { Pane } from "@/lib/types"

interface BrowserPaneProps {
  pane: Pane
}

export function BrowserPane({ pane }: BrowserPaneProps) {
  const { killPane, renamePane, togglePin, openBrowser } = usePaneStore()
  const [showPreview, setShowPreview] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    let url = urlInput.trim()
    // Add https:// if no protocol is specified
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    openBrowser(url)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setIframeKey(prev => prev + 1)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleOpenExternal = () => {
    if (pane.url) {
      window.open(pane.url, "_blank", "noopener,noreferrer")
    }
  }

  if (!pane.url) {
    return (
      <div className="flex flex-col h-full bg-[#0C0C0C]">
        <PaneTitleBar
          title={pane.name}
          paneId={pane.id}
          pinned={pane.pinned}
          groupId={pane.groupId}
          onClose={() => killPane(pane.id)}
          onRename={handleRename}
          onPin={() => togglePin(pane.id)}
        />
        {/* URL input bar when no URL is set */}
        <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 px-3 py-2 border-b border-[#252525] bg-[#161616]">
          <Globe className="h-4 w-4 text-[#808080] shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL and press Enter..."
            className="flex-1 bg-transparent text-sm text-[#CCCCCC] placeholder-[#555] outline-none"
          />
        </form>
        <div className="flex-1 flex items-center justify-center text-[#808080]">
          Enter a URL above to browse
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#0C0C0C]">
        <PaneTitleBar
          title={pane.name}
          paneId={pane.id}
          pinned={pane.pinned}
          groupId={pane.groupId}
          onClose={() => killPane(pane.id)}
          onRename={handleRename}
          onPin={() => togglePin(pane.id)}
          actions={
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[#CCCCCC] hover:bg-white/10 transition-colors"
              title="Device preview"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          }
        />
        {/* URL bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#252525] bg-[#161616]">
          <Globe className="h-4 w-4 text-[#808080] shrink-0" />
          <input
            type="text"
            defaultValue={pane.url}
            placeholder="Enter URL and press Enter..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const form = e.currentTarget.form
                if (form) form.requestSubmit()
              }
            }}
            onSubmit={handleUrlSubmit}
            className="flex-1 bg-transparent text-sm text-[#CCCCCC] placeholder-[#555] outline-none"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded text-[#808080] hover:text-white hover:bg-white/10 transition-colors ${isRefreshing ? "animate-spin" : ""}`}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleOpenExternal}
              className="p-1.5 rounded text-[#808080] hover:text-white hover:bg-white/10 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <iframe
            key={iframeKey}
            src={pane.proxyUrl ?? pane.url!}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={pane.name}
          />
        </div>
      </div>

      {showPreview && (
        <DevicePreviewModal
          url={pane.url}
          proxyUrl={pane.proxyUrl ?? null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
