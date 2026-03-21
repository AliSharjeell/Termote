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
  const { spawnPane } = usePaneStore()

  const handleSplitRight = () => {
    spawnPane(shell)
  }

  return (
    <div
      className="absolute top-1 right-1 z-10 flex gap-1"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className={`flex gap-1 rounded bg-[#1E1E1E] p-1 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-60"}`}>
        <button
          onClick={handleSplitRight}
          className="rounded px-2 py-1 text-xs text-[#CCCCCC] hover:bg-[#333333]"
          title="Split Right"
        >
          + Split
        </button>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-[#E74856] hover:bg-[#E74856] hover:text-white"
          title="Close terminal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
