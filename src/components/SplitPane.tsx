"use client"

import { useRef, useEffect, useState } from "react"
import { XtermPane } from "./XtermPane"
import { usePaneStore } from "@/hooks/usePaneStore"

export function SplitPane() {
  // ALL hooks must be at the top - never inside conditionals!
  const { panes, activePanes, isAuthenticated } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const activePanesData = panes.filter((p) => activePanes.includes(p.id))

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (activePanesData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0C0C0C]">
        <div className="text-center text-[#CCCCCC]">
          <p className="text-lg">No active panes</p>
          <button
            onClick={() => {
              console.log("New Terminal clicked, isAuthenticated:", isAuthenticated)
              usePaneStore.getState().spawnPane("powershell")
            }}
            className="mt-4 rounded-full bg-[#0037DA] px-6 py-2.5 text-sm text-white hover:bg-[#0037DA]/90"
          >
            + New Terminal
          </button>
        </div>
      </div>
    )
  }

  const handleAddPane = () => {
    usePaneStore.getState().spawnPane("powershell")
  }

  // Auto-balancing 2D grid: optimal square-ish layout
  const count = activePanesData.length
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 bg-[#1E1E1E] px-4 py-2">
        <button
          onClick={handleAddPane}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 font-bold text-lg"
        >
          +
        </button>
        <span className="text-xs text-[#808080]">
          {activePanesData.length} pane{activePanesData.length !== 1 ? "s" : ""} ({cols}x{rows})
        </span>
      </div>

      {/* Auto-balancing grid */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "6px",
          background: "#1E1E1E",
          padding: "6px",
        }}
      >
        {activePanesData.map((pane) => (
          <div
            key={pane.id}
            className="overflow-hidden rounded-lg bg-[#0C0C0C]"
          >
            <XtermPane pane={pane} />
          </div>
        ))}
      </div>
    </div>
  )
}
