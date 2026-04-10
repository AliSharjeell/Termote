"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"

interface BrowserPaneProps {
  pane: Pane
}

export function BrowserPane({ pane }: BrowserPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  if (!pane.url) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C0C0C] text-[#808080]">
        No URL configured
      </div>
    )
  }

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
      <div className="flex-1 relative">
        <iframe
          src={pane.proxyUrl ?? pane.url!}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={pane.name}
        />
      </div>
    </div>
  )
}
