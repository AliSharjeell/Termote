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
import { parseSyncEnvelope, createSyncEnvelope, type SyncEnvelope } from "@/lib/syncEnvelope"

interface NotePaneProps {
  pane: Pane
}

const NOTE_KEY = (id: string) => `note-${id}-bn`
const SYNC_DEBOUNCE_MS = 400
const EDITING_PAUSE_MS = 900

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
  const isUserEditingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editingPauseRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRemoteRef = useRef<SyncEnvelope<PartialBlock[]> | null>(null)
  const clientIdRef = useRef(getSyncClientId())
  const clientSeqRef = useRef(0)
  const lastSeenByClientRef = useRef<Record<string, number>>({})
  const [initialContent] = useState(() => loadInitialContent(pane))

  const editor = useCreateBlockNote({
    initialContent,
  })

  const applyNoteRemote = (incoming: SyncEnvelope<PartialBlock[]>) => {
    applyingRemoteRef.current = true
    try {
      console.log("[NOTE SYNC] Applying remote", {
        paneId: pane.id,
        fromClient: incoming.clientId,
        toClient: clientIdRef.current,
      })
      editor.replaceBlocks(editor.document, incoming.content)
      localStorage.setItem(NOTE_KEY(pane.id), JSON.stringify(incoming))
    } catch (e) {
      console.error("[NOTE SYNC] Apply failed:", e)
    } finally {
      queueMicrotask(() => {
        applyingRemoteRef.current = false
      })
    }
  }

  const flushPendingRemote = () => {
    if (isUserEditingRef.current) return
    const incoming = pendingRemoteRef.current
    if (!incoming) return
    pendingRemoteRef.current = null
    applyNoteRemote(incoming)
  }

  const scheduleNoteSave = (doc: PartialBlock[]) => {
    if (applyingRemoteRef.current) return

    isUserEditingRef.current = true

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      clientSeqRef.current += 1

      const envelope = createSyncEnvelope(
        doc,
        clientIdRef.current,
        clientSeqRef.current
      )

      const raw = JSON.stringify(envelope)

      console.log("[NOTE SYNC LOCAL SAVE]", {
        paneId: pane.id,
        clientId: clientIdRef.current,
        clientSeq: clientSeqRef.current,
      })

      localStorage.setItem(NOTE_KEY(pane.id), raw)
      usePaneStore.getState().updatePaneContent(pane.id, raw, undefined, undefined)
    }, SYNC_DEBOUNCE_MS)

    if (editingPauseRef.current) {
      clearTimeout(editingPauseRef.current)
    }

    editingPauseRef.current = setTimeout(() => {
      isUserEditingRef.current = false
      flushPendingRemote()
    }, EDITING_PAUSE_MS)
  }

  useEffect(() => {
    const incomingRaw = pane.noteContent
    if (!incomingRaw) return

    const incoming = parseSyncEnvelope<PartialBlock[]>(incomingRaw)
    if (!incoming) return

    const sameClient = incoming.clientId === clientIdRef.current
    const lastSeenSeq = lastSeenByClientRef.current[incoming.clientId] ?? -1

    console.log("[NOTE SYNC REMOTE RECEIVE]", {
      paneId: pane.id,
      incomingClientId: incoming.clientId,
      myClientId: clientIdRef.current,
      incomingClientSeq: incoming.clientSeq,
      lastSeenForClient: lastSeenSeq,
      sameClient,
      isEditing: isUserEditingRef.current,
    })

    if (incoming.clientSeq <= lastSeenSeq) return

    lastSeenByClientRef.current[incoming.clientId] = incoming.clientSeq

    if (sameClient) return

    if (isUserEditingRef.current) {
      pendingRemoteRef.current = incoming
      return
    }

    applyNoteRemote(incoming)
  }, [pane.noteContent])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (editingPauseRef.current) clearTimeout(editingPauseRef.current)
    }
  }, [])

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
              scheduleNoteSave(doc)
            } catch (e) {
              console.error("[NOTE SYNC] onChange error:", e)
            }
          }}
        />
      </div>
    </div>
  )
}