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
import { parseSyncEnvelope, createSyncEnvelope, type SyncEnvelope } from "@/lib/syncEnvelope"

interface WhiteboardPaneProps {
  pane: Pane
}

const WB_KEY = (id: string) => `wb-excalidraw-${id}`
const SYNC_DEBOUNCE_MS = 300

function parseWhiteboardElements(raw: string | null | undefined): readonly ExcalidrawElement[] {
  if (!raw) return []

  const envelope = parseSyncEnvelope<readonly ExcalidrawElement[]>(raw)
  if (envelope) return envelope.content

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed?.elements) return parsed.elements
  } catch {}

  return []
}

function loadInitialData(pane: Pane): { elements: readonly ExcalidrawElement[] } {
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
  const isDrawingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRemoteRef = useRef<SyncEnvelope<readonly ExcalidrawElement[]> | null>(null)
  const clientIdRef = useRef(getSyncClientId())
  const clientSeqRef = useRef(0)
  const lastSeenByClientRef = useRef<Record<string, number>>({})
  const initialDataRef = useRef(loadInitialData(pane))

  const applyWhiteboardRemote = (incoming: SyncEnvelope<readonly ExcalidrawElement[]>) => {
    applyingRemoteRef.current = true
    try {
      console.log("[WHITEBOARD SYNC] Applying remote", {
        paneId: pane.id,
        fromClient: incoming.clientId,
        toClient: clientIdRef.current,
      })
      excalidrawApiRef.current?.updateScene({
        elements: incoming.content,
      })
      localStorage.setItem(WB_KEY(pane.id), JSON.stringify(incoming))
    } catch (e) {
      console.error("[WHITEBOARD SYNC] Apply failed:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }

  const flushPendingRemote = () => {
    if (isDrawingRef.current) return
    const incoming = pendingRemoteRef.current
    if (!incoming) return
    pendingRemoteRef.current = null
    applyWhiteboardRemote(incoming)
  }

  const scheduleWhiteboardSave = useCallback((elements: readonly ExcalidrawElement[], immediate = false) => {
    if (applyingRemoteRef.current) return

    const save = () => {
      clientSeqRef.current += 1

      const envelope = createSyncEnvelope(
        elements,
        clientIdRef.current,
        clientSeqRef.current
      )

      const raw = JSON.stringify(envelope)

      console.log("[WHITEBOARD SYNC LOCAL SAVE]", {
        paneId: pane.id,
        clientId: clientIdRef.current,
        clientSeq: clientSeqRef.current,
        elementCount: elements.length,
      })

      localStorage.setItem(WB_KEY(pane.id), raw)
      usePaneStore.getState().updatePaneContent(pane.id, undefined, raw, undefined)
    }

    if (immediate) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      save()
    } else {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(save, SYNC_DEBOUNCE_MS)
    }
  }, [pane.id])

  const onChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    try {
      if (applyingRemoteRef.current) return
      scheduleWhiteboardSave(elements, false)
    } catch (e) {
      console.error("[WHITEBOARD SYNC] onChange error:", e)
    }
  }, [scheduleWhiteboardSave])

  const onPointerDown = useCallback(() => {
    isDrawingRef.current = true
  }, [])

  const onPointerUp = useCallback(() => {
    isDrawingRef.current = false
    const elements = excalidrawApiRef.current?.getSceneElements() ?? []
    scheduleWhiteboardSave([...elements] as readonly ExcalidrawElement[], true)
    flushPendingRemote()
  }, [scheduleWhiteboardSave])

  useEffect(() => {
    const incomingRaw = pane.whiteboardData
    if (!incomingRaw) return

    const incoming = parseSyncEnvelope<readonly ExcalidrawElement[]>(incomingRaw)
    if (!incoming) return

    const sameClient = incoming.clientId === clientIdRef.current
    const lastSeenSeq = lastSeenByClientRef.current[incoming.clientId] ?? -1

    console.log("[WHITEBOARD SYNC REMOTE RECEIVE]", {
      paneId: pane.id,
      incomingClientId: incoming.clientId,
      myClientId: clientIdRef.current,
      incomingClientSeq: incoming.clientSeq,
      lastSeenForClient: lastSeenSeq,
      sameClient,
      isDrawing: isDrawingRef.current,
    })

    if (incoming.clientSeq <= lastSeenSeq) return

    lastSeenByClientRef.current[incoming.clientId] = incoming.clientSeq

    if (sameClient) return

    if (isDrawingRef.current) {
      pendingRemoteRef.current = incoming
      return
    }

    applyWhiteboardRemote(incoming)
  }, [pane.whiteboardData])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

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