"use client"

import { useState } from "react"

interface PaneControlsProps {
  paneId: string
  shell: string
  onClose: () => void
}

export function PaneControls({ onClose }: PaneControlsProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className="absolute top-1 right-1 z-10"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className={`rounded bg-[#1E1E1E] px-1 py-0.5 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-40"}`}>
        <button
          onClick={onClose}
          className="rounded px-1.5 py-0.5 text-xs text-[#E74856] hover:bg-[#E74856] hover:text-white"
          title="Close terminal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
