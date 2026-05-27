"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Globe, Monitor, RefreshCw } from "lucide-react"
import { useBrowserMirrorHost } from "@/hooks/useBrowserMirrorHost"
import { useIsTauri } from "@/hooks/useIsTauri"
import { useNativeBrowserWebview } from "@/hooks/useNativeBrowserWebview"
import { usePaneStore } from "@/hooks/usePaneStore"
import { normalizeUrl } from "@/lib/browserFrame"
import type { BrowserPhysicalRect } from "@/lib/nativeBrowserWebview"
import type { Pane } from "@/lib/types"
import { BrowserMirrorView } from "./BrowserMirrorView"
import { DevicePreviewModal } from "./DevicePreviewModal"
import { PaneTitleBar } from "./PaneTitleBar"

interface BrowserPaneProps {
  pane: Pane
}

function normalizeUrlInput(value: string) {
  return normalizeUrl(value.trim())
}

export function BrowserPane({ pane }: BrowserPaneProps) {
  const {
    killPane,
    renamePane,
    togglePin,
    updateBrowserPaneUrl,
    explorerOpen,
    imagePickerOpen,
    showSecurityModal,
    mobileAccessModalOpen,
  } = usePaneStore()
  const { isTauri, checked } = useIsTauri()
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [urlInput, setUrlInput] = useState(pane.url ?? "")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [physicalRect, setPhysicalRect] = useState<BrowserPhysicalRect | null>(null)

  const isAnyModalOpen =
    explorerOpen || imagePickerOpen || showSecurityModal || mobileAccessModalOpen || showPreview

  useEffect(() => {
    setUrlInput(pane.url ?? "")
  }, [pane.url])

  const handlePhysicalRect = useCallback((rect: BrowserPhysicalRect | null) => {
    setPhysicalRect(rect)
  }, [])

  useNativeBrowserWebview({
    paneId: pane.id,
    url: pane.url,
    enabled: checked && isTauri && Boolean(pane.url) && !isAnyModalOpen,
    viewportRef,
    refreshKey,
    onPhysicalRect: handlePhysicalRect,
  })

  useBrowserMirrorHost({
    paneId: pane.id,
    enabled: checked && isTauri && Boolean(pane.url) && !isAnyModalOpen,
    physicalRect,
  })

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  const handleUrlSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!urlInput.trim()) return

    const url = normalizeUrlInput(urlInput)
    updateBrowserPaneUrl(pane.id, url)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshKey(prev => prev + 1)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const titleBar = (
    <PaneTitleBar
      title={pane.name}
      paneId={pane.id}
      pinned={pane.pinned}
      groupId={pane.groupId}
      onClose={() => killPane(pane.id)}
      onRename={handleRename}
      onPin={() => togglePin(pane.id)}
      actions={pane.url ? (
        <button
          onClick={() => setShowPreview(true)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#27272A] text-[#808080] transition-colors hover:bg-[#333333] hover:text-white"
          title="Responsive device preview"
        >
          <Monitor className="h-4 w-4" />
        </button>
      ) : undefined}
    />
  )

  const urlBar = (
    <form onSubmit={handleUrlSubmit} className="flex shrink-0 items-center gap-2 border-b border-[#252525] bg-[#161616] px-3 py-2">
      <Globe className="h-4 w-4 shrink-0 text-[#808080]" />
      <input
        type="text"
        value={urlInput}
        onChange={(event) => setUrlInput(event.target.value)}
        placeholder="Enter URL and press Enter..."
        className="flex-1 bg-transparent text-sm text-[#CCCCCC] outline-none placeholder-[#555]"
      />
      {pane.url ? (
        <button
          type="button"
          onClick={handleRefresh}
          className={`shrink-0 rounded p-1.5 text-[#808080] transition-colors hover:bg-white/10 hover:text-white ${isRefreshing ? "animate-spin" : ""}`}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  )

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col bg-[#0C0C0C]">
        {titleBar}
        {urlBar}

        <div className="min-h-0 flex-1 overflow-hidden">
          {!pane.url ? (
            <div className="flex h-full items-center justify-center text-[#808080]">
              Enter a URL above to browse
            </div>
          ) : !checked ? (
            <div className="flex h-full items-center justify-center text-[#666]">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Preparing browser...</span>
              </div>
            </div>
          ) : isTauri ? (
            <div ref={viewportRef} className="relative h-full w-full overflow-hidden bg-white">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white text-xs text-black/35">
                Native Tauri browser webview
              </div>
            </div>
          ) : (
            <BrowserMirrorView key={refreshKey} paneId={pane.id} title={pane.name} />
          )}
        </div>
      </div>

      {showPreview && pane.url ? (
        <DevicePreviewModal
          paneId={pane.id}
          title={pane.name}
          url={pane.url}
          isTauri={isTauri}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </>
  )
}
