"use client"

import { useState } from "react"
import { Monitor } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import { DevicePreviewModal } from "./DevicePreviewModal"
import type { Pane } from "@/lib/types"

interface BrowserPaneProps {
  pane: Pane
}

export function BrowserPane({ pane }: BrowserPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [showPreview, setShowPreview] = useState(false)

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  if (!pane.url) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C0C0C] text-[#808080]">
        No URL configured
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
        />
        <div className="flex-1 relative">
          <iframe
            src={pane.proxyUrl ?? pane.url!}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={pane.name}
          />
          {/* Device preview button */}
          <button
            onClick={() => setShowPreview(true)}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-[#161616]/90 border border-[#333333] px-2 py-1.5 text-xs text-[#CCCCCC] hover:bg-[#27272A] hover:text-white transition-colors shadow-lg"
            title="Device preview"
          >
            <Monitor className="h-4 w-4" />
            <span>Preview</span>
          </button>
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
