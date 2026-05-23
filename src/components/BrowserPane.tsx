"use client"

import { useState, useEffect, useRef } from "react"
import { Monitor, Globe, RefreshCw } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import { DevicePreviewModal } from "./DevicePreviewModal"
import { buildBrowserFrameSrc, isLocalOrPrivateUrl, normalizeUrl } from "@/lib/browserFrame"
import type { Pane } from "@/lib/types"

interface BrowserPaneProps {
  pane: Pane
}

export function BrowserPane({ pane }: BrowserPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [showPreview, setShowPreview] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Resolved frame src - computed async when pane.url changes
  const [frameSrc, setFrameSrc] = useState<string | null>(null)
  const [frameError, setFrameError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const pendingKeyRef = useRef(0)

  // Resolve iframe src whenever pane.url or iframeKey changes
  useEffect(() => {
    let cancelled = false

    async function resolveSrc() {
      if (!pane.url) {
        setFrameSrc(null)
        setFrameError(null)
        setIsResolving(false)
        return
      }

      setIsResolving(true)
      setFrameError(null)

      try {
        const src = await buildBrowserFrameSrc(pane.url, pane.id)

        const isLocal = isLocalOrPrivateUrl(normalizeUrl(pane.url))

        console.log("[BROWSER PANE DEBUG]", {
          paneId: pane.id,
          paneUrl: pane.url,
          frameSrc: src,
          currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
          isLocal,
          isPreviewFormat: src && src.includes('/preview/'),
          isProxyFormat: src && src.includes('/proxy?url='),
        })

        if (!cancelled) {
          setFrameSrc(src)
          setIsResolving(false)
        }
      } catch (error) {
        console.error("[BROWSER PANE] failed to resolve frame src", error)
        if (!cancelled) {
          setFrameError(error instanceof Error ? error.message : "Failed to load URL")
          setFrameSrc(null)
          setIsResolving(false)
        }
      }
    }

    resolveSrc()

    return () => {
      cancelled = true
    }
  }, [pane.url, iframeKey])

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    let url = urlInput.trim()
    // Add http:// if no protocol is specified
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "http://" + url
    }

    usePaneStore.getState().openBrowser(url)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setIframeKey(prev => prev + 1)
    pendingKeyRef.current = iframeKey + 1
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Show URL input when no URL is set
  if (!pane.url) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-[#0C0C0C]">
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
        <form onSubmit={handleUrlSubmit} className="flex shrink-0 items-center gap-2 border-b border-[#252525] bg-[#161616] px-3 py-2">
          <Globe className="h-4 w-4 shrink-0 text-[#808080]" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL and press Enter..."
            className="flex-1 bg-transparent text-sm text-[#CCCCCC] placeholder-[#555] outline-none"
          />
        </form>
        <div className="flex flex-1 items-center justify-center text-[#808080]">
          Enter a URL above to browse
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col bg-[#0C0C0C]">
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
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] text-[#808080] hover:text-white transition-colors"
              title="Device preview"
            >
              <Monitor className="h-4 w-4" />
            </button>
          }
        />
        {/* URL bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#252525] bg-[#161616] px-3 py-2">
          <Globe className="h-4 w-4 shrink-0 text-[#808080]" />
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
          <button
            onClick={handleRefresh}
            className={`shrink-0 rounded p-1.5 text-[#808080] hover:bg-white/10 hover:text-white transition-colors ${isRefreshing ? "animate-spin" : ""}`}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Frame container - takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {frameError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <div className="text-sm text-red-400">
                Failed to load: {frameError}
              </div>
              <div className="text-xs text-[#666]">
                Original URL: {pane.url}
              </div>
              <button
                onClick={handleRefresh}
                className="mt-2 rounded bg-[#27272A] px-3 py-1.5 text-sm text-[#CCCCCC] hover:bg-[#333333]"
              >
                Retry
              </button>
            </div>
          ) : isResolving ? (
            <div className="flex h-full items-center justify-center text-[#666]">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Resolving URL...</span>
              </div>
            </div>
          ) : frameSrc ? (
            <div className="relative h-full w-full">
              {/* Debug indicator - shows frameSrc in dev */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-1 left-1 z-50 max-w-[calc(100%-8px)] overflow-hidden text-ellipsis whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] text-[#888]">
                  {frameSrc.length > 80 ? '...' + frameSrc.slice(-77) : frameSrc}
                </div>
              )}
              <iframe
                key={iframeKey}
                src={frameSrc}
                className="h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                title={pane.name}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[#666]">
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <DevicePreviewModal
          url={pane.url}
          proxyUrl={frameSrc}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}