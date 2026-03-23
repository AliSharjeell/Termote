"use client"

import { useRef, useEffect, useState } from "react"
import { XtermPane } from "./XtermPane"
import { usePaneStore } from "@/hooks/usePaneStore"

interface SplitPaneProps {
  searchQuery?: string
}

export function SplitPane({ searchQuery }: SplitPaneProps) {
  // ALL hooks must be at the top - never inside conditionals!
  const { panes, activePanes, isAuthenticated, groups, selectedGroupId, selectGroup, createGroup, deleteGroup } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  // Filter by group if a group is selected
  const filteredPanes = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Filter by selected group
  const groupFilteredPanes = selectedGroupId
    ? filteredPanes.filter((p) => p.groupId === selectedGroupId)
    : filteredPanes

  // Sort: pinned panes first, then by original order
  const sortedActivePanes = [...groupFilteredPanes]
    .filter((p) => activePanes.includes(p.id))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

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

  if (sortedActivePanes.length === 0) {
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

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim())
      setNewGroupName("")
      setIsCreatingGroup(false)
    }
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
        {isCreatingGroup ? (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup()
                if (e.key === "Escape") {
                  setIsCreatingGroup(false)
                  setNewGroupName("")
                }
              }}
              placeholder="Group name"
              className="h-7 rounded bg-[#0C0C0C] px-2 text-xs text-[#CCCCCC] outline-none border border-[#3B78FF]"
              autoFocus
            />
            <button
              onClick={handleCreateGroup}
              className="h-7 rounded bg-[#3B78FF] px-2 text-xs text-white hover:bg-[#2B68FF]"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingGroup(false)
                setNewGroupName("")
              }}
              className="h-7 rounded bg-[#27272A] px-2 text-xs text-[#CCCCCC] hover:bg-[#333333]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingGroup(true)}
            className="flex h-7 items-center justify-center rounded-lg bg-[#27272A] px-3 text-sm text-[#CCCCCC] hover:bg-[#333333] font-medium gap-1.5 shrink-0"
          >
            <span>+</span>
            <span>New Group</span>
          </button>
        )}
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
                className="h-2 w-2 rounded-full shrink-0"
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
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: "2px",
          background: "#181818",
        }}
      >
        {sortedActivePanes.map((pane) => (
          <div
            key={pane.id}
            className="relative overflow-hidden bg-[#0C0C0C]"
          >
            <div className="h-full w-full">
              <XtermPane pane={pane} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
