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

interface NotePaneProps {
  pane: Pane
}

const NOTE_KEY = (id: string) => `note-${id}-bn`

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
  const lastAppliedContentRef = useRef<string | null>(pane.noteContent ?? null)
  const [initialContent] = useState(() => loadInitialContent(pane))

  const editor = useCreateBlockNote({
    initialContent,
  })

  useEffect(() => {
    const incoming = pane.noteContent ?? null
    if (!incoming || incoming === lastAppliedContentRef.current) return

    const parsed = parseNoteContent(incoming)
    if (!Array.isArray(parsed)) return

    try {
      const currentSerialized = JSON.stringify({ content: editor.document })
      if (incoming === currentSerialized) {
        lastAppliedContentRef.current = incoming
        return
      }

      applyingRemoteRef.current = true
      editor.replaceBlocks(editor.document, parsed)
      localStorage.setItem(NOTE_KEY(pane.id), incoming)
      lastAppliedContentRef.current = incoming
      setTimeout(() => {
        applyingRemoteRef.current = false
      }, 0)
    } catch (e) {
      applyingRemoteRef.current = false
      console.error("[NotePane] remote sync error:", e)
    }
  }, [editor, pane.id, pane.noteContent])

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
              const data = JSON.stringify({ content: doc })
              if (data === lastAppliedContentRef.current) return
              lastAppliedContentRef.current = data
              localStorage.setItem(NOTE_KEY(pane.id), data)
              // Push content to backend for persistence and sync
              usePaneStore.getState().updatePaneContent(pane.id, data, undefined, undefined)
            } catch (e) {
              console.error("[NotePane] save error:", e)
            }
          }}
        />
      </div>
    </div>
  )
}
