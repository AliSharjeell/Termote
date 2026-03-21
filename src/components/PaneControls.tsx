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
      <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-[#E74856] transition-all duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={onClose}
          className="flex h-full w-full items-center justify-center rounded-full hover:bg-[#ff3b30]"
          title="Close terminal"
        >
          <span className="text-white opacity-80 hover:opacity-100" style={{ fontSize: "10px", lineHeight: 1 }}>×</span>
        </button>
      </div>
    </div>
  )
}
