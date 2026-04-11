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
          return parsed.content || undefined
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
      <div className="flex-1 overflow-hidden">
        <BlockNoteView editor={editor} theme="dark" onChange={() => {
          try {
            localStorage.setItem(NOTE_KEY(pane.id), JSON.stringify(editor.document))
          } catch {}
        }} />
      </div>
    </div>
  )
}
