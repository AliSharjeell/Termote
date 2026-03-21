"use client"

import { useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import type { Shell } from "@/lib/types"

interface PaneControlsProps {
  paneId: string
  shell: Shell
  onClose: () => void
}

export function PaneControls({ paneId, shell, onClose }: PaneControlsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { spawnPane, moveToFloating, moveToActive, activePanes, floatingPanes } =
    usePaneStore()

  const isInFloating = floatingPanes.includes(paneId)
  const isInActive = activePanes.includes(paneId)

  const handleSplitRight = () => {
    spawnPane(shell)
  }

  const handleSplitDown = () => {
    spawnPane(shell)
  }

  const handleToggleFloating = () => {
    if (isInFloating) {
      moveToActive(paneId)
    } else {
      moveToFloating(paneId)
    }
  }

  return (
    <div
      className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 transition-opacity duration-200 hover:opacity-100"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex gap-1 rounded bg-[#1E1E1E] p-1">
        <button
          onClick={handleSplitRight}
          className="rounded px-2 py-1 text-xs text-[#CCCCCC] hover:bg-[#333333]"
          title="Split Right"
        >
          Split R
        </button>
        <button
          onClick={handleSplitDown}
          className="rounded px-2 py-1 text-xs text-[#CCCCCC] hover:bg-[#333333]"
          title="Split Down"
        >
          Split D
        </button>
        <button
          onClick={handleToggleFloating}
          className="rounded px-2 py-1 text-xs text-[#CCCCCC] hover:bg-[#333333]"
          title={isInFloating ? "Move to Grid" : "Move to Tabs"}
        >
          {isInFloating ? "Grid" : "Tab"}
        </button>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-[#E74856] hover:bg-[#333333]"
          title="Close"
        >
          Close
        </button>
      </div>
    </div>
  )
}
