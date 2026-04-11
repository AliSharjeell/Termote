"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useEffect, useRef, useCallback } from "react"
import { Tldraw } from "tldraw"
import "tldraw/tldraw.css"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-${id}`

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMount = useCallback(
    (editor: any) => {
      try {
        editor.user.updateUserPreferences({ colorScheme: "dark" })
      } catch {}

      try {
        const raw = localStorage.getItem(WB_KEY(pane.id))
        if (raw) {
          const snapshot = JSON.parse(raw)
          editor.store.loadSnapshot(snapshot)
        }
      } catch {}
      editor.store.listen(
        () => {
          try {
            const snapshot = editor.store.getSnapshot()
            localStorage.setItem(WB_KEY(pane.id), JSON.stringify(snapshot))
          } catch {}
        },
        { source: "user" }
      )
    },
    [pane.id]
  )

  return (
    <div className="flex flex-col h-full bg-[#0C0C0C]">
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onClose={() => killPane(pane.id)}
        onRename={(n) => renamePane(pane.id, n)}
        onPin={() => togglePin(pane.id)}
      />
      <div className="flex-1 overflow-hidden [&_.tl-canvas]:!bg-[#1a1a1a]">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  )
}
