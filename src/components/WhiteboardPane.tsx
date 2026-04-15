"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCallback } from "react"
import Excalidraw from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-excalidraw-${id}`

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()

  const initialData = useCallback(() => {
    try {
      const raw = localStorage.getItem(WB_KEY(pane.id))
      if (raw) {
        return JSON.parse(raw)
      }
    } catch {}
    return null
  }, [pane.id])

  const onChange = useCallback((elements: any[]) => {
    try {
      localStorage.setItem(WB_KEY(pane.id), JSON.stringify({ elements }))
    } catch {}
  }, [pane.id])

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
      <div className="flex-1 overflow-hidden">
        <Excalidraw
          initialData={initialData()}
          onChange={onChange}
          theme="dark"
        />
      </div>
    </div>
  )
}