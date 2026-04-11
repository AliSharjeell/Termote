"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"

interface NotePaneProps {
  pane: Pane
}

const NOTE_KEY = (id: string) => `note-${id}-bn`

export function NotePane({ pane }: NotePaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()

  const editor = useCreateBlockNote({
    initialContent: (() => {
      try {
        const raw = localStorage.getItem(NOTE_KEY(pane.id))
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.content) return parsed.content
          if (parsed.document) return parsed.document
          return parsed
        }
      } catch {}
      return undefined
    })(),
  })

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
          theme={{
            colors: {
              background: "transparent",
              surface: "transparent",
              border: "#252525",
              text: "#CCCCCC",
              textHover: "#FFFFFF",
              textSelected: "#FFFFFF",
              placeholder: "#555555",
              highlightedText: "#2a2a2a",
              tooltip: "#1a1a1a",
              tooltipText: "#CCCCCC",
              inlinePrompt: "#252525",
              inlinePromptText: "#CCCCCC",
              shadow: "rgba(0,0,0,0.5)",
              glow: "transparent",
            },
            cursor: {
              color: "#58A6FF",
            },
            selection: {
              background: "#264f78",
            },
            sideMenu: {
              background: "#1a1a1a",
              text: "#CCCCCC",
              border: "#333333",
              hover: "#252525",
              active: "#333333",
            },
            filePanel: {
              background: "#0C0C0C",
              border: "#252525",
              text: "#CCCCCC",
            },
            suggestionMenu: {
              background: "#1a1a1a",
              border: "#333333",
              text: "#CCCCCC",
              hover: "#252525",
              hoverText: "#FFFFFF",
            },
            table: {
              background: "transparent",
              border: "#333333",
              hover: "#252525",
            },
          } as any}
          onChange={() => {
            try {
              const doc = editor.document
              localStorage.setItem(NOTE_KEY(pane.id), JSON.stringify({ content: doc }))
            } catch (e) {
              console.error("[NotePane] save error:", e)
            }
          }}
        />
      </div>
    </div>
  )
}
