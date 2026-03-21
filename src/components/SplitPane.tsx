"use client"

import { useRef, useEffect, useState } from "react"
import { Allotment } from "allotment"
import "allotment/dist/style.css"
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
            className="mt-4 rounded bg-[#0037DA] px-4 py-2 text-sm text-white hover:bg-[#0037DA]/90"
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

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 bg-[#1E1E1E] px-2 py-1">
        <button
          onClick={handleAddPane}
          className="rounded bg-[#0037DA] px-3 py-1 text-sm text-white hover:bg-[#0037DA]/90"
        >
          + Split
        </button>
        <span className="text-xs text-[#808080]">
          {activePanesData.length} pane{activePanesData.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Panes */}
      <div className="flex-1 overflow-hidden">
        <Allotment>
          {activePanesData.map((pane) => (
            <Allotment.Pane key={pane.id} minSize={150}>
              <XtermPane pane={pane} />
            </Allotment.Pane>
          ))}
        </Allotment>
      </div>
    </div>
  )
}
