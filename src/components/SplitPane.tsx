"use client"

import { useRef, useEffect, useState } from "react"
import { Allotment } from "allotment"
import "allotment/dist/style.css"
import { XtermPane } from "./XtermPane"
import { usePaneStore } from "@/hooks/usePaneStore"

export function SplitPane() {
  const { panes, activePanes } = usePaneStore()
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
          <p className="text-sm text-[#808080]">Connect to a server to start</p>
        </div>
      </div>
    )
  }

  // Simple layout: if 1 pane, full size. If 2 panes, horizontal split.
  // For more complex layouts, we'd need to track pane positions in the store
  return (
    <div ref={containerRef} className="h-full w-full">
      <Allotment>
        {activePanesData.slice(0, 2).map((pane) => (
          <Allotment.Pane key={pane.id} minSize={200}>
            <XtermPane pane={pane} />
          </Allotment.Pane>
        ))}
      </Allotment>
    </div>
  )
}
