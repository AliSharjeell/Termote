"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCallback, useState, useEffect } from "react"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-excalidraw-${id}`

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null)

  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidrawComponent(() => mod.Excalidraw)
    })
  }, [])

  const initialData = useCallback(() => {
    try {
      const raw = localStorage.getItem(WB_KEY(pane.id))
      if (raw) {
        const data = JSON.parse(raw)
        // Ensure proper format for excalidraw
        if (data.elements || data.appState) {
          return data
        }
        // If it's just elements wrapped, return properly
        return data
      }
    } catch {}
    return {}
  }, [pane.id])

  const onChange = useCallback((elements: any[], _state: any) => {
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
      <div className="flex-1 overflow-hidden" style={{ height: "100%", minHeight: 0 }}>
        {ExcalidrawComponent ? (
          <div style={{ width: "100%", height: "100%" }}>
            <ExcalidrawComponent
              initialData={initialData()}
              onChange={onChange}
              theme="dark"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#CCCCCC]">Loading...</div>
        )}
      </div>
    </div>
  )
}