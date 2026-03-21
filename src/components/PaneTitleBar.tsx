"use client"

import { useState, useRef, useEffect } from "react"

interface PaneTitleBarProps {
  title: string
  onRename: (newTitle: string) => void
  onClose: () => void
}

export function PaneTitleBar({ title, onRename, onClose }: PaneTitleBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(title)
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleSubmit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== title) {
      onRename(trimmed)
    } else {
      setEditValue(title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    } else if (e.key === "Escape") {
      setEditValue(title)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex h-7 items-center justify-between bg-[#1E1E1E] px-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Close button */}
        <button
          onClick={onClose}
          className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3b30] hover:bg-[#ff0000] shrink-0"
          title="Close terminal"
        >
          <span className="text-white text-xs font-bold leading-none">×</span>
        </button>

        {/* Rename button */}
        <button
          onClick={handleDoubleClick}
          className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ffd700] hover:bg-[#ffaa00] shrink-0"
          title="Rename terminal"
        >
          <span className="text-white text-xs font-bold leading-none">✎</span>
        </button>

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#0C0C0C] px-1 py-0 text-xs text-[#CCCCCC] outline-none border border-[#3B78FF] rounded"
          />
        ) : (
          <span
            className="cursor-pointer truncate text-xs text-[#CCCCCC] hover:text-white"
            title="Click rename button to edit"
          >
            {title}
          </span>
        )}
      </div>
    </div>
  )
}
