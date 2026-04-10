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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Filter by group if a group is selected
  const filteredPanes = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Filter by selected group
  const groupFilteredPanes = selectedGroupId
    ? selectedGroupId === "__ungrouped__"
      ? filteredPanes.filter((p) => p.groupId === null)
      : filteredPanes.filter((p) => {
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
    // Always add new pane to "All Panes" (null group), not current group
    if (selectedGroupId !== null) {
      selectGroup(null)
    }
    usePaneStore.getState().spawnPane("powershell")
  }

  const handleSpawnFromDirectory = () => {
    // Always add new pane to "All Panes" (null group), not current group
    if (selectedGroupId !== null) {
      selectGroup(null)
    }
    usePaneStore.getState().openExplorer()
  }

  // Auto-balancing 2D grid: optimal square-ish layout
  const count = sortedActivePanes.length
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  return (
    <div ref={containerRef} className="flex h-full w-full flex-row">
      {/* Vertical sidebar with group tabs */}
      <div className="flex shrink-0 flex-col gap-1 border-r border-[#353535] bg-[#161616] p-2 w-48">
        <div className="flex flex-col gap-1 mb-2">
          <button
            onClick={handleAddPane}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm text-black hover:bg-gray-200 font-medium shrink-0"
          >
            <span>+</span>
            <span>New Terminal</span>
          </button>
          <button
            onClick={handleSpawnFromDirectory}
            title="Open terminal in folder..."
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#333333] px-3 py-2 text-sm text-[#CCCCCC] hover:bg-[#444444] font-medium shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Open Folder...</span>
          </button>
        </div>
        {/* Separator */}
        <div className="h-px bg-[#353535] mb-1" />
        {/* Group label */}
        <span className="text-[10px] text-[#808080] px-2 uppercase tracking-wider mb-1">Groups</span>

        {/* All Panes */}
        <button
          onClick={() => { selectGroup(null); window.location.reload() }}
          className={`w-full rounded-lg px-3 py-2 text-sm border border-[#333333] text-left flex items-center gap-2 ${
            selectedGroupId === null
              ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
              : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
          }`}
        >
          <span>All Panes</span>
          <span className="ml-auto text-xs text-[#666]">{panes.filter(p => activePanes.includes(p.id)).length}</span>
        </button>

        {/* Ungrouped */}
        <button
          onClick={() => { selectGroup("__ungroup__"); window.location.reload() }}
          className={`w-full rounded-lg px-3 py-2 text-sm border border-[#333333] text-left flex items-center gap-2 ${
            selectedGroupId === "__ungrouped__"
              ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
              : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
          }`}
        >
          <span>Ungrouped</span>
          <span className="ml-auto text-xs text-[#666]">{panes.filter(p => p.groupId === null && activePanes.includes(p.id)).length}</span>
        </button>

        {/* Group rows with inline expand chevron */}
        {groups.map((group) => {
          const groupPanes = panes.filter(p => p.groupId === group.id && activePanes.includes(p.id))
          const isExpanded = expandedGroups.has(group.id)
          return (
            <div key={group.id} className="group/row">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { selectGroup(group.id); window.location.reload() }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm border border-[#333333] text-left flex items-center gap-2 ${
                    selectedGroupId === group.id
                      ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                      : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs text-[#666]">{groupPanes.length}</span>
                </button>
                {groupPanes.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const newSet = new Set(expandedGroups)
                      if (isExpanded) newSet.delete(group.id)
                      else newSet.add(group.id)
                      setExpandedGroups(newSet)
                    }}
                    className="h-8 w-6 flex items-center justify-center rounded border border-[#333333] text-[#808080] hover:bg-[#333333] hover:text-white shrink-0"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    <span className="text-xs">{isExpanded ? "▾" : "▸"}</span>
                  </button>
                )}
                {hoveredGroupId === group.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                    className="h-8 w-6 rounded bg-[#E44] hover:bg-[#C33] flex items-center justify-center text-white text-xs font-bold leading-none shrink-0"
                    title="Delete group"
                  >
                    ×
                  </button>
                )}
              </div>
              {isExpanded && groupPanes.length > 0 && (
                <div className="ml-3 mt-1 mb-1 flex flex-col gap-0.5 rounded border border-[#2a2a2a] bg-[#0C0C0C] p-1.5">
                  {groupPanes.map((pane) => (
                    <div
                      key={pane.id}
                      className="flex items-center gap-2 rounded px-2 py-1 text-xs text-[#808080] hover:bg-[#27272A] cursor-pointer"
                      onClick={() => usePaneStore.getState().setActivePane(pane.id)}
                    >
                      <span className="truncate">{pane.name}</span>
                      {pane.pinned && <span className="text-[#666] shrink-0">★</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {/* Spacer */}
        <div className="flex-1" />
        {/* Pane count */}
        <span className="text-xs text-[#808080] px-2 text-center">
          {sortedActivePanes.length} pane{sortedActivePanes.length !== 1 ? "s" : ""}
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
          sortedActivePanes.map((pane) => (
            <div
              key={pane.id}
              className="relative overflow-hidden bg-[#0C0C0C]"
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
