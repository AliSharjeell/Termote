"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCallback, useEffect, useRef } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import "@excalidraw/excalidraw/index.css"
import { getSyncClientId } from "@/lib/syncClient"
import { parseSyncEnvelope, type SyncEnvelope } from "@/lib/syncEnvelope"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-excalidraw-${id}`
const SYNC_DEBOUNCE_MS = 400

interface PendingRemote {
  content: readonly ExcalidrawElement[]
  clientId: string
  revision: number
  updatedAt: number
}

interface WhiteboardEnvelope {
  content: readonly ExcalidrawElement[]
  clientId: string
  revision: number
  updatedAt: number
}

function parseWhiteboardData(raw: string | null | undefined): WhiteboardEnvelope | null {
  return parseSyncEnvelope<readonly ExcalidrawElement[]>(raw)
}

function parseWhiteboardElements(raw: string | null | undefined): readonly ExcalidrawElement[] {
  if (!raw) return []

  const envelope = parseWhiteboardData(raw)
  if (envelope) return envelope.content

  // Fallback: try parsing as raw elements array (old format)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed?.elements) return parsed.elements
  } catch {}

  return []
}

function loadInitialData(pane: Pane): { elements: readonly ExcalidrawElement[] } {
  // Backend-persisted content takes priority
  if (pane.whiteboardData) {
    const elements = parseWhiteboardElements(pane.whiteboardData)
    if (elements.length > 0) return { elements }
  }

  try {
    const raw = localStorage.getItem(WB_KEY(pane.id))
    if (raw) {
      const elements = parseWhiteboardElements(raw)
      if (elements.length > 0) return { elements }
    }
  } catch {}

  return { elements: [] }
}

export function WhiteboardPane({ pane }: WhiteboardPaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const applyingRemoteRef = useRef(false)
  const lastRemoteRevisionRef = useRef(0)
  const lastLocalUpdatedAtRef = useRef(0)
  const localRevisionRef = useRef(0)
  const isDrawingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRemoteRef = useRef<PendingRemote | null>(null)
  const clientIdRef = useRef(getSyncClientId())
  const initialDataRef = useRef(loadInitialData(pane))
  const lastAppliedRawRef = useRef<string | null>(null)

  // Schedule sync with optional immediate save
  const scheduleWhiteboardSync = useCallback((elements: readonly ExcalidrawElement[], immediate = false) => {
    if (applyingRemoteRef.current) return

    const save = () => {
      const revision = localRevisionRef.current + 1
      localRevisionRef.current = revision

      const envelope = {
        content: elements,
        clientId: clientIdRef.current,
        revision,
        updatedAt: Date.now(),
      }

      const data = JSON.stringify(envelope)
      lastLocalUpdatedAtRef.current = envelope.updatedAt

      console.log("[WHITEBOARD SYNC LOCAL]", {
        paneId: pane.id,
        revision,
        updatedAt: envelope.updatedAt,
        clientId: clientIdRef.current,
        elementCount: elements.length,
      })

      localStorage.setItem(WB_KEY(pane.id), data)
      usePaneStore.getState().updatePaneContent(pane.id, undefined, data, undefined)
    }

    if (immediate) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      save()
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(save, SYNC_DEBOUNCE_MS)
  }, [pane.id])

  // Handle remote changes
  useEffect(() => {
    const incomingRaw = pane.whiteboardData
    if (!incomingRaw) return
    if (incomingRaw === lastAppliedRawRef.current) return

    const envelope = parseWhiteboardData(incomingRaw)
    if (!envelope) return

    console.log("[WHITEBOARD SYNC REMOTE]", {
      paneId: pane.id,
      incomingRevision: envelope.revision,
      lastRemoteRevision: lastRemoteRevisionRef.current,
      incomingUpdatedAt: envelope.updatedAt,
      lastLocalUpdatedAt: lastLocalUpdatedAtRef.current,
      sameClient: envelope.clientId === clientIdRef.current,
      isDrawing: isDrawingRef.current,
    })

    // Ignore our own backend echo
    if (envelope.clientId === clientIdRef.current) return

    // Ignore stale remote
    if (envelope.revision <= lastRemoteRevisionRef.current) return
    if (envelope.updatedAt <= lastLocalUpdatedAtRef.current) return

    // Queue for later if user is actively drawing
    if (isDrawingRef.current) {
      pendingRemoteRef.current = envelope
      return
    }

    // Also queue if we have a pending save (to avoid race)
    if (saveTimeoutRef.current) {
      pendingRemoteRef.current = envelope
      return
    }

    applyingRemoteRef.current = true
    lastAppliedRawRef.current = incomingRaw

    try {
      excalidrawApiRef.current?.updateScene({
        elements: envelope.content,
      })
      lastRemoteRevisionRef.current = envelope.revision
      localStorage.setItem(WB_KEY(pane.id), incomingRaw)
    } catch (e) {
      console.error("[WHITEBOARD SYNC] Remote apply error:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }, [pane.whiteboardData])

  // Apply queued remote after drawing stops
  useEffect(() => {
    if (isDrawingRef.current) return
    if (!pendingRemoteRef.current) return

    const pending = pendingRemoteRef.current
    pendingRemoteRef.current = null

    // Only apply if still newer than local
    if (pending.updatedAt <= lastLocalUpdatedAtRef.current) return

    applyingRemoteRef.current = true
    try {
      console.log("[WHITEBOARD SYNC] Applying queued remote after drawing pause", {
        paneId: pane.id,
        pendingRevision: pending.revision,
      })
      excalidrawApiRef.current?.updateScene({
        elements: pending.content,
      })
      lastRemoteRevisionRef.current = pending.revision
    } catch (e) {
      console.error("[WHITEBOARD SYNC] Failed to apply queued remote:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }, [pane.id])

  const onChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    try {
      if (applyingRemoteRef.current) return
      scheduleWhiteboardSync(elements, false)
    } catch (e) {
      console.error("[WHITEBOARD SYNC] onChange error:", e)
    }
  }, [scheduleWhiteboardSync])

  const onPointerDown = useCallback(() => {
    isDrawingRef.current = true
  }, [])

  const onPointerUp = useCallback(() => {
    isDrawingRef.current = false
    // Force immediate save when drawing ends
    const elements = excalidrawApiRef.current?.getSceneElements() ?? []
    scheduleWhiteboardSync([...elements] as readonly ExcalidrawElement[], true)
  }, [scheduleWhiteboardSync])

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
          initialData={initialDataRef.current}
          excalidrawAPI={(api) => {
            excalidrawApiRef.current = api
          }}
          onChange={onChange}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          theme="dark"
        />
      </div>
    </div>
  )
}