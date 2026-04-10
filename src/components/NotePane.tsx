"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"
import { useState, useEffect, useRef, useCallback } from "react"

interface NotePaneProps {
  pane: Pane
}

interface NoteContent {
  text: string
}

const NOTE_KEY = (id: string) => `note-${id}`

function loadNote(id: string): NoteContent {
  try {
    const raw = localStorage.getItem(NOTE_KEY(id))
    return raw ? JSON.parse(raw) : { text: "" }
  } catch {
    return { text: "" }
  }
}

function saveNote(id: string, content: NoteContent) {
  try {
    localStorage.setItem(NOTE_KEY(id), JSON.stringify(content))
  } catch {}
}

export function NotePane({ pane }: NotePaneProps) {
  const { killPane, renamePane, togglePin } = usePaneStore()
  const [text, setText] = useState<NoteContent>(() => loadNote(pane.id))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save to localStorage on text change with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(pane.id, text)
    }, 500)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [text, pane.id])

  // Toggle checkbox: replace [] with [x] or [x] with []
  const toggleCheckbox = useCallback((lineIndex: number) => {
    setText(prev => {
      const lines = prev.text.split("\n")
      const line = lines[lineIndex]
      if (!line) return prev
      if (line.includes("[ ]")) {
        lines[lineIndex] = line.replace("[ ]", "[x]")
      } else if (line.includes("[x]")) {
        lines[lineIndex] = line.replace("[x]", "[ ]")
      } else {
        return prev
      }
      const newText = { text: lines.join("\n") }
      saveNote(pane.id, newText)
      return newText
    })
  }, [pane.id])

  // Parse text and render with clickable checkboxes
  const renderContent = () => {
    const lines = text.text.split("\n")
    return lines.map((line, lineIndex) => {
      // Checkbox lines
      if (line.includes("[ ]") || line.includes("[x]")) {
        const checked = line.includes("[x]")
        return (
          <div
            key={lineIndex}
            className="flex items-start gap-2 py-0.5 cursor-pointer group"
            onClick={() => toggleCheckbox(lineIndex)}
          >
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mt-1 shrink-0 accent-white"
            />
            <span className={checked ? "text-[#666] line-through" : "text-white"}>
              {renderInline(line)}
            </span>
          </div>
        )
      }
      // Heading
      if (line.startsWith("# ")) {
        return <h1 key={lineIndex} className="text-lg font-bold text-white mt-3 mb-1">{renderInline(line.slice(2))}</h1>
      }
      if (line.startsWith("## ")) {
        return <h2 key={lineIndex} className="text-base font-semibold text-white mt-2 mb-1">{renderInline(line.slice(3))}</h2>
      }
      if (line.startsWith("### ")) {
        return <h3 key={lineIndex} className="text-sm font-semibold text-[#ccc] mt-2 mb-1">{renderInline(line.slice(4))}</h3>
      }
      // Bullet list
      if (line.startsWith("- ")) {
        return <div key={lineIndex} className="flex items-start gap-2 py-0.5"><span className="text-[#888] shrink-0">•</span><span className="text-white">{renderInline(line.slice(2))}</span></div>
      }
      // Numbered list
      const numbered = line.match(/^(\d+)\.\s/)
      if (numbered) {
        return <div key={lineIndex} className="flex items-start gap-2 py-0.5"><span className="text-[#888] shrink-0">{numbered[1]}.</span><span className="text-white">{renderInline(line.slice(numbered[0].length))}</span></div>
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={lineIndex} className="h-2" />
      }
      // Regular paragraph
      return <p key={lineIndex} className="text-white py-0.5">{renderInline(line)}</p>
    })
  }

  // Simple inline rendering for bold, italic, code
  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0
    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>)
        }
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
        continue
      }
      // Italic *text*
      const italicMatch = remaining.match(/\*(.+?)\*/)
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>)
        }
        parts.push(<em key={key++}>{italicMatch[1]}</em>)
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length)
        continue
      }
      // Inline code `code`
      const codeMatch = remaining.match(/`(.+?)`/)
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>)
        }
        parts.push(<code key={key++} className="bg-[#1f1f1f] text-[#16C60C] px-1 rounded text-xs font-mono">{codeMatch[1]}</code>)
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length)
        continue
      }
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    return parts
  }

  const handleRename = (newTitle: string) => renamePane(pane.id, newTitle)

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onClose={() => killPane(pane.id)}
        onRename={handleRename}
        onPin={() => togglePin(pane.id)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Rendered markdown */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 text-sm"
          onDoubleClick={() => textareaRef.current?.focus()}
        >
          {renderContent()}
        </div>
        {/* Raw editor textarea (hidden by default, shown on focus) */}
        <textarea
          ref={textareaRef}
          value={text.text}
          onChange={(e) => setText({ text: e.target.value })}
          className="flex-1 w-full resize-none bg-transparent text-white text-sm p-4 outline-none font-mono border-l border-[#252525] overflow-y-auto"
          placeholder="Start typing... Use # for headings, [ ] for checkboxes, - for lists"
          style={{ display: "none" }}
          onBlur={() => {
            // Switch back to rendered view on blur
            const ta = textareaRef.current
            if (ta) ta.style.display = "none"
          }}
          onFocus={() => {
            const ta = textareaRef.current
            if (ta) ta.style.display = "block"
          }}
        />
      </div>
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-t border-[#252525] bg-[#0d0d0d]">
        <span className="text-[10px] text-[#555]">Double-click content to edit raw markdown</span>
        <span className="ml-auto text-[10px] text-[#555]">Auto-saved</span>
      </div>
    </div>
  )
}
