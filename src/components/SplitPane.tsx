"use client"

import { useRef, useEffect, useState } from "react"
import { XtermPane } from "./XtermPane"
import { usePaneStore } from "@/hooks/usePaneStore"

interface SplitPaneProps {
  searchQuery?: string
}

export function SplitPane({ searchQuery }: SplitPaneProps) {
  // ALL hooks must be at the top - never inside conditionals!
  const { panes, activePanes, isAuthenticated, groups, selectedGroupId, selectGroup, deleteGroup } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  // Filter by group if a group is selected
  const filteredPanes = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Filter by selected group
  const groupFilteredPanes = selectedGroupId
    ? filteredPanes.filter((p) => {
        return p.groupId != null && p.groupId === selectedGroupId
      })
    : filteredPanes

  // Sort: pinned panes first, then by original order
  const sortedActivePanes = [...groupFilteredPanes]
    .filter((p) => activePanes.includes(p.id))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  // Keep all active panes mounted for preserving terminal state
  const allActivePanes = [...panes]
    .filter((p) => activePanes.includes(p.id))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  // Helper to check if a pane is in the current group
  const isPaneInGroup = (paneId: string) => {
    if (!selectedGroupId) return true
    const pane = panes.find(p => p.id === paneId)
    return pane?.groupId === selectedGroupId
  }

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

  // Show empty state only if there are no panes at all
  const hasAnyPanes = panes.length > 0
  const isGroupEmpty = sortedActivePanes.length === 0 && selectedGroupId !== null

  if (sortedActivePanes.length === 0 && !hasAnyPanes) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0C0C0C]">
        <div className="text-center text-[#CCCCCC]">
          <p className="text-lg">No active panes</p>
          <button
            onClick={() => {
              console.log("New Terminal clicked, isAuthenticated:", isAuthenticated)
              usePaneStore.getState().spawnPane("powershell")
            }}
            className="mt-4 rounded-lg bg-white px-6 py-2.5 text-sm text-black hover:bg-gray-200 font-medium"
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
  const count = sortedActivePanes.length
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#353535] bg-[#161616] px-4 py-2 overflow-x-auto">
        <button
          onClick={handleAddPane}
          className="flex h-7 items-center justify-center rounded-lg bg-white px-3 text-sm text-black hover:bg-gray-200 font-medium gap-1.5 shrink-0"
        >
          <span>+</span>
          <span>New Terminal</span>
        </button>
        {/* Separator */}
        <div className="h-4 w-px bg-[#353535] shrink-0" />
        {/* Group tabs */}
        <button
          onClick={() => selectGroup(null)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm border border-[#333333] ${
            selectedGroupId === null
              ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
              : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
          }`}
        >
          All Panes
        </button>
        {groups.map((group) => (
          <div
            key={group.id}
            className="group relative shrink-0"
            onMouseEnter={() => setHoveredGroupId(group.id)}
            onMouseLeave={() => setHoveredGroupId(null)}
          >
            <button
              onClick={() => selectGroup(group.id)}
              className={`rounded-lg px-4 py-2 text-sm border border-[#333333] flex items-center gap-2 ${
                selectedGroupId === group.id
                  ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                  : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
              }`}
            >
              <span
                className="h-2 w-2 rounded shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span className="truncate max-w-[120px]">{group.name}</span>
            </button>
            {hoveredGroupId === group.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteGroup(group.id)
                }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#E44] hover:bg-[#C33] flex items-center justify-center text-white text-[10px] font-bold leading-none"
                title="Delete group"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {/* Spacer */}
        <div className="flex-1" />
        <span className="text-xs text-[#808080] shrink-0">
          {sortedActivePanes.length} pane{sortedActivePanes.length !== 1 ? "s" : ""} ({cols}x{rows})
        </span>
      </div>

      {/* Auto-balancing grid */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(cols, 1)}, 1fr)`,
          gridTemplateRows: `repeat(${Math.max(rows, 1)}, 1fr)`,
          gap: "2px",
          background: "#181818",
        }}
      >
        {isGroupEmpty ? (
          <div className="flex items-center justify-center bg-[#0C0C0C]">
            <div className="text-center text-[#808080]">
              <p className="text-sm">No panes in this group</p>
              <p className="text-xs mt-1">Click the folder icon on a pane to add it</p>
            </div>
          </div>
        ) : (
          allActivePanes.map((pane) => (
            <div
              key={pane.id}
              className="relative overflow-hidden bg-[#0C0C0C]"
              style={{ visibility: isPaneInGroup(pane.id) ? "visible" : "hidden" }}
            >
              <div className="h-full w-full">
                <XtermPane pane={pane} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
