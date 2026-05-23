"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCallback, useEffect, useRef, useState } from "react"
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
const SYNC_DEBOUNCE_MS = 250

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

  // Drawing state tracking
  const isDrawingRef = useRef(false)
  const applyingRemoteRef = useRef(false)
  const pendingRemoteRef = useRef<SyncEnvelope<readonly ExcalidrawElement[]> | null>(null)

  // Latest state tracking - NEVER stale
  const latestElementsRef = useRef<readonly ExcalidrawElement[]>([])
  const pendingLocalElementsRef = useRef<readonly ExcalidrawElement[] | null>(null)

  // Sync scheduling
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSaveRef = useRef(false)

  // Client sync tracking
  const clientIdRef = useRef(getSyncClientId())
  const clientSeqRef = useRef(0)
  const lastSeenByClientRef = useRef<Record<string, number>>({})
  const initialDataRef = useRef(loadInitialData(pane))

  // Initialize latest elements from initial data
  latestElementsRef.current = initialDataRef.current.elements

  // Save to backend - only saves what's in latestElementsRef
  const saveToBackend = useCallback((paneId: string) => {
    if (applyingRemoteRef.current) return

    const elements = latestElementsRef.current
    if (!elements || elements.length === 0) return

    clientSeqRef.current += 1

    const envelope = createSyncEnvelope(
      elements,
      clientIdRef.current,
      clientSeqRef.current
    )

    const raw = JSON.stringify(envelope)

    console.log("[WB SYNC SAVE]", {
      paneId,
      clientId: clientIdRef.current,
      clientSeq: clientSeqRef.current,
      elementCount: elements.length,
    })

    localStorage.setItem(WB_KEY(paneId), raw)
    usePaneStore.getState().updatePaneContent(paneId, undefined, raw, undefined)
  }, [])

  // Schedule debounced save - does NOT capture state at call time
  const scheduleDebouncedSave = useCallback((paneId: string) => {
    if (applyingRemoteRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    pendingSaveRef.current = true

    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = false
      saveToBackend(paneId)
    }, SYNC_DEBOUNCE_MS)
  }, [saveToBackend])

  // Force immediate save using latestElementsRef - NOT capturing from closure
  const forceImmediateSave = useCallback((paneId: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    pendingSaveRef.current = false

    // Always use the latest ref, not a captured value
    saveToBackend(paneId)
  }, [saveToBackend])

  // Apply remote state to Excalidraw canvas
  const applyRemoteToCanvas = useCallback((elements: readonly ExcalidrawElement[]) => {
    applyingRemoteRef.current = true
    try {
      console.log("[WB SYNC] Applying remote to canvas", {
        paneId: pane.id,
        elementCount: elements.length,
      })
      excalidrawApiRef.current?.updateScene({
        elements,
      })
    } catch (e) {
      console.error("[WB SYNC] Canvas apply failed:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }, [pane.id])

  // Flush queued remote update when drawing ends
  const flushPendingRemote = useCallback(() => {
    if (isDrawingRef.current) return
    const incoming = pendingRemoteRef.current
    if (!incoming) return

    pendingRemoteRef.current = null
    applyRemoteToCanvas(incoming.content)
  }, [applyRemoteToCanvas])

  // Handle local drawing changes
  const onChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    try {
      // ALWAYS update the latest ref immediately - no debounce for local state
      latestElementsRef.current = elements

      if (applyingRemoteRef.current) return

      // Skip sync save if this came from remote (applyingRemoteRef is false here anyway)
      // But check if same-client echo - only happens via useEffect, not onChange

      // Schedule debounced sync save
      scheduleDebouncedSave(pane.id)
    } catch (e) {
      console.error("[WB SYNC] onChange error:", e)
    }
  }, [pane.id, scheduleDebouncedSave])

  // Pointer down - start drawing
  const onPointerDown = useCallback(() => {
    isDrawingRef.current = true
  }, [])

  // Pointer up - end stroke, force immediate save
  const onPointerUp = useCallback(() => {
    isDrawingRef.current = false

    // Force immediate save of complete state
    forceImmediateSave(pane.id)

    // Flush any queued remote update
    flushPendingRemote()
  }, [pane.id, forceImmediateSave, flushPendingRemote])

  // Handle remote updates from backend
  useEffect(() => {
    const incomingRaw = pane.whiteboardData
    if (!incomingRaw) return

    const incoming = parseSyncEnvelope<readonly ExcalidrawElement[]>(incomingRaw)
    if (!incoming) return

    // Ignore same-client echoes - this is OUR own state echoed back from backend
    if (incoming.clientId === clientIdRef.current) {
      return
    }

    const lastSeenSeq = lastSeenByClientRef.current[incoming.clientId] ?? -1

    // Only accept newer sequence from same remote client
    if (incoming.clientSeq <= lastSeenSeq) {
      return
    }

    lastSeenByClientRef.current[incoming.clientId] = incoming.clientSeq

    console.log("[WB SYNC REMOTE RECEIVE]", {
      paneId: pane.id,
      incomingClientId: incoming.clientId,
      myClientId: clientIdRef.current,
      incomingClientSeq: incoming.clientSeq,
      lastSeenForClient: lastSeenSeq,
      isDrawing: isDrawingRef.current,
      pendingRemote: !!pendingRemoteRef.current,
    })

    // If user is drawing, queue the remote update
    if (isDrawingRef.current) {
      pendingRemoteRef.current = incoming
      return
    }

    // Apply immediately when idle
    applyRemoteToCanvas(incoming.content)
  }, [pane.whiteboardData, pane.id, applyRemoteToCanvas])

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
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