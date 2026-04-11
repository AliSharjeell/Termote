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
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onClose={() => killPane(pane.id)}
        onRename={handleRename}
        onPin={() => togglePin(pane.id)}
      />
      <div className="flex-1 overflow-hidden [&_.bn-editor]:bg-transparent [&_.bn-editor]:text-white [&_.bn-editor_.ProseMirror]:outline-none [&_.bn-editor_.ProseMirror]:px-4 [&_.bn-editor_.ProseMirror]:py-3">
        <BlockNoteView editor={editor} onChange={() => {
          // Save to localStorage when content changes
          try {
            localStorage.setItem(NOTE_KEY(pane.id), JSON.stringify(editor.document))
          } catch {}
        }} />
      </div>
    </div>
  )
}
