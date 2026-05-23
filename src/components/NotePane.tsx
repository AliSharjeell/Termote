"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import type { PartialBlock } from "@blocknote/core"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView, type Theme } from "@blocknote/mantine"
import { useEffect, useRef, useState } from "react"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import { getSyncClientId } from "@/lib/syncClient"
import { parseSyncEnvelope, type SyncEnvelope } from "@/lib/syncEnvelope"

interface NotePaneProps {
  pane: Pane
}

const NOTE_KEY = (id: string) => `note-${id}-bn`
const SYNC_DEBOUNCE_MS = 500
const EDITING_PAUSE_MS = 1000

interface PendingRemote {
  content: PartialBlock[]
  clientId: string
  revision: number
  updatedAt: number
}

function parseNoteContent(raw: string | null | undefined): PartialBlock[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    const content = parsed?.content ?? parsed?.document ?? parsed
    return Array.isArray(content) ? content : undefined
  } catch {
    return undefined
  }
}

function parseNoteEnvelope(raw: string | null | undefined): SyncEnvelope<PartialBlock[]> | null {
  return parseSyncEnvelope<PartialBlock[]>(raw)
}

function loadInitialContent(pane: Pane): PartialBlock[] | undefined {
  const backendContent = parseNoteContent(pane.noteContent)
  if (backendContent) return backendContent

  try {
    return parseNoteContent(localStorage.getItem(NOTE_KEY(pane.id)))
  } catch {
    return undefined
  }
}

const noteTheme: Theme = {
  colors: {
    editor: {
      text: "#CCCCCC",
      background: "transparent",
    },
    menu: {
      text: "#CCCCCC",
      background: "#1a1a1a",
    },
    tooltip: {
      text: "#CCCCCC",
      background: "#1a1a1a",
    },
    hovered: {
      text: "#FFFFFF",
      background: "#252525",
    },
    selected: {
      text: "#FFFFFF",
      background: "#333333",
    },
    disabled: {
      text: "#555555",
      background: "transparent",
    },
    shadow: "rgba(0,0,0,0.5)",
    border: "#252525",
    sideMenu: "#1a1a1a",
  },
}

export function NotePane({ pane }: NotePaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const applyingRemoteRef = useRef(false)
  const lastRemoteRevisionRef = useRef(0)
  const lastLocalUpdatedAtRef = useRef(0)
  const localRevisionRef = useRef(0)
  const isUserEditingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editingPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRemoteRef = useRef<PendingRemote | null>(null)
  const lastAppliedRawRef = useRef<string | null>(null)
  const clientIdRef = useRef(getSyncClientId())
  const [initialContent] = useState(() => loadInitialContent(pane))

  const editor = useCreateBlockNote({
    initialContent,
  })

  // Schedule local change sync with debounce
  const scheduleNoteSync = (doc: PartialBlock[]) => {
    if (applyingRemoteRef.current) return

    isUserEditingRef.current = true

    // Clear any pending editing pause timer
    if (editingPauseTimeoutRef.current) {
      clearTimeout(editingPauseTimeoutRef.current)
    }

    // Set editing pause timer
    editingPauseTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false
      editingPauseTimeoutRef.current = null

      // Apply queued remote if any
      if (pendingRemoteRef.current) {
        const pending = pendingRemoteRef.current
        pendingRemoteRef.current = null

        // Only apply if still newer than local
        if (pending.updatedAt > lastLocalUpdatedAtRef.current) {
          applyingRemoteRef.current = true
          try {
            console.log("[NOTE SYNC] Applying queued remote after editing pause", {
              paneId: pane.id,
              pendingRevision: pending.revision,
              pendingUpdatedAt: pending.updatedAt,
              lastLocalUpdatedAt: lastLocalUpdatedAtRef.current,
            })
            editor.replaceBlocks(editor.document, pending.content)
            lastRemoteRevisionRef.current = pending.revision
          } catch (e) {
            console.error("[NOTE SYNC] Failed to apply queued remote:", e)
          } finally {
            queueMicrotask(() => {
              applyingRemoteRef.current = false
            })
          }
        }
      }
    }, EDITING_PAUSE_MS)

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the actual save
    saveTimeoutRef.current = setTimeout(() => {
      const revision = localRevisionRef.current + 1
      localRevisionRef.current = revision

      const envelope = {
        content: doc,
        clientId: clientIdRef.current,
        revision,
        updatedAt: Date.now(),
      }

      const data = JSON.stringify(envelope)
      lastLocalUpdatedAtRef.current = envelope.updatedAt

      console.log("[NOTE SYNC LOCAL]", {
        paneId: pane.id,
        revision,
        updatedAt: envelope.updatedAt,
        clientId: clientIdRef.current,
      })

      localStorage.setItem(NOTE_KEY(pane.id), data)
      usePaneStore.getState().updatePaneContent(pane.id, data, undefined, undefined)
    }, SYNC_DEBOUNCE_MS)
  }

  // Handle remote changes
  useEffect(() => {
    const incomingRaw = pane.noteContent
    if (!incomingRaw) return
    if (incomingRaw === lastAppliedRawRef.current) return

    const envelope = parseNoteEnvelope(incomingRaw)
    if (!envelope) return

    console.log("[NOTE SYNC REMOTE]", {
      paneId: pane.id,
      incomingRevision: envelope.revision,
      lastRemoteRevision: lastRemoteRevisionRef.current,
      incomingUpdatedAt: envelope.updatedAt,
      lastLocalUpdatedAt: lastLocalUpdatedAtRef.current,
      sameClient: envelope.clientId === clientIdRef.current,
      isUserEditing: isUserEditingRef.current,
    })

    // Ignore our own backend echo
    if (envelope.clientId === clientIdRef.current) return

    // Ignore stale remote
    if (envelope.revision <= lastRemoteRevisionRef.current) return
    if (envelope.updatedAt <= lastLocalUpdatedAtRef.current) return

    // Queue for later if user is actively editing
    if (isUserEditingRef.current) {
      pendingRemoteRef.current = envelope
      return
    }

    applyingRemoteRef.current = true
    lastAppliedRawRef.current = incomingRaw

    try {
      editor.replaceBlocks(editor.document, envelope.content)
      lastRemoteRevisionRef.current = envelope.revision
      localStorage.setItem(NOTE_KEY(pane.id), incomingRaw)
    } catch (e) {
      console.error("[NOTE SYNC] Remote apply error:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }, [pane.noteContent, editor])

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

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
      <div className="flex-1 overflow-hidden [&_.bn-editor]:!bg-transparent">
        <BlockNoteView
          editor={editor}
          theme={noteTheme}
          onChange={() => {
            try {
              if (applyingRemoteRef.current) return
              const doc = editor.document
              scheduleNoteSync(doc)
            } catch (e) {
              console.error("[NOTE SYNC] onChange error:", e)
            }
          }}
        />
      </div>
    </div>
  )
}