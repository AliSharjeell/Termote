"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCallback, useEffect, useRef } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import "@excalidraw/excalidraw/index.css"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-excalidraw-${id}`

interface WhiteboardData {
  elements: readonly ExcalidrawElement[]
}

function parseWhiteboardData(raw: string | null | undefined): WhiteboardData {
  if (!raw) return { elements: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<WhiteboardData>
    return {
      ...parsed,
      elements: Array.isArray(parsed?.elements) ? parsed.elements : [],
    }
  } catch {
    return { elements: [] }
  }
}

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const applyingRemoteRef = useRef(false)
  const lastAppliedDataRef = useRef<string | null>(pane.whiteboardData ?? null)

  const initialData = useCallback(() => {
    // Backend-persisted content takes priority
    if (pane.whiteboardData) {
      return parseWhiteboardData(pane.whiteboardData)
    }
    try {
      const raw = localStorage.getItem(WB_KEY(pane.id))
      if (raw) {
        return parseWhiteboardData(raw)
      }
    } catch {}
    return { elements: [] }
  }, [pane.id, pane.whiteboardData])

  useEffect(() => {
    const incoming = pane.whiteboardData ?? null
    if (!incoming || incoming === lastAppliedDataRef.current) return

    const data = parseWhiteboardData(incoming)
    try {
      applyingRemoteRef.current = true
      excalidrawApiRef.current?.updateScene({
        elements: data.elements,
      })
      localStorage.setItem(WB_KEY(pane.id), incoming)
      lastAppliedDataRef.current = incoming
      setTimeout(() => {
        applyingRemoteRef.current = false
      }, 0)
    } catch {
      applyingRemoteRef.current = false
    }
  }, [pane.id, pane.whiteboardData])

  const onChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    try {
      if (applyingRemoteRef.current) return
      const data = JSON.stringify({ elements: [...elements] })
      if (data === lastAppliedDataRef.current) return
      lastAppliedDataRef.current = data
      localStorage.setItem(WB_KEY(pane.id), data)
      usePaneStore.getState().updatePaneContent(pane.id, undefined, data, undefined)
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
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ position: "relative" }}>
        <Excalidraw
          initialData={initialData()}
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api
          }}
          onChange={onChange}
          theme="dark"
        />
      </div>
    </div>
  )
}
