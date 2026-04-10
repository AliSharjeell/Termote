"use client"

import { useRef, useEffect, useState } from "react"
import { XtermPane } from "./XtermPane"
import { BrowserPane } from "./BrowserPane"
import { SourceControlPane } from "./SourceControlPane"
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
      <div className="flex h-full w-full items-center justify-center bg-[#080808]">
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
      <div className="flex shrink-0 flex-col gap-1 border-r border-[#252525] bg-[#0d0d0d] p-2 w-56">
        <div className="flex flex-col gap-1 mb-2">
          <button
            onClick={handleAddPane}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
          >
            <span>+</span>
            <span>New Terminal</span>
          </button>
          <button
            onClick={handleSpawnFromDirectory}
            title="Open terminal in folder..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Open Folder</span>
          </button>
          <button
            onClick={() => usePaneStore.getState().openBrowserModal()}
            title="Open browser tab..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Open URL</span>
          </button>
        </div>
        {/* Separator */}
        <div className="h-px bg-[#252525] mb-1" />

        {/* All Panes */}
        <button
          onClick={() => { selectGroup(null); window.location.reload() }}
          className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${
            selectedGroupId === null
              ? "text-white bg-[#111111]"
              : "text-[#888] hover:text-white hover:bg-[#111111]"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newSet = new Set(expandedGroups)
              if (expandedGroups.has("__all__")) newSet.delete("__all__")
              else newSet.add("__all__")
              setExpandedGroups(newSet)
            }}
            className="text-xs text-[#666] hover:text-white border border-[#252525] rounded px-1 shrink-0"
            title="Expand"
          >
            {expandedGroups.has("__all__") ? "▾" : "▸"}
          </button>
          <span>All Panes</span>
          <span className="ml-auto text-xs text-[#666]">{panes.filter(p => activePanes.includes(p.id)).length}</span>
        </button>
        {expandedGroups.has("__all__") && (
          <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
            {panes.filter(p => activePanes.includes(p.id)).map((pane) => (
              <div key={pane.id} className="flex items-center gap-2 px-3 py-1 text-sm text-white hover:text-[#ccc] cursor-pointer" onClick={() => usePaneStore.getState().selectTab(pane.id)}>
                <span className="truncate">{pane.name}</span>
                {pane.pinned && <span className="text-[#666] shrink-0">★</span>}
              </div>
            ))}
          </div>
        )}

        {/* Ungrouped */}
        <button
          onClick={() => { selectGroup("__ungrouped__"); window.location.reload() }}
          className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${
            selectedGroupId === "__ungrouped__"
              ? "text-white bg-[#111111]"
              : "text-[#888] hover:text-white hover:bg-[#111111]"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newSet = new Set(expandedGroups)
              if (expandedGroups.has("__ungrouped__")) newSet.delete("__ungrouped__")
              else newSet.add("__ungrouped__")
              setExpandedGroups(newSet)
            }}
            className="text-xs text-[#666] hover:text-white border border-[#252525] rounded px-1 shrink-0"
            title="Expand"
          >
            {expandedGroups.has("__ungrouped__") ? "▾" : "▸"}
          </button>
          <span>Ungrouped</span>
          <span className="ml-auto text-xs text-[#666]">{panes.filter(p => p.groupId === null && activePanes.includes(p.id)).length}</span>
        </button>
        {expandedGroups.has("__ungrouped__") && (
          <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
            {panes.filter(p => p.groupId === null && activePanes.includes(p.id)).map((pane) => (
              <div key={pane.id} className="flex items-center gap-2 px-3 py-1 text-sm text-white hover:text-[#ccc] cursor-pointer" onClick={() => usePaneStore.getState().selectTab(pane.id)}>
                <span className="truncate">{pane.name}</span>
                {pane.pinned && <span className="text-[#666] shrink-0">★</span>}
              </div>
            ))}
          </div>
        )}

        {/* Group rows with inline expand chevron */}
        {groups.map((group) => {
          const groupPanes = panes.filter(p => p.groupId === group.id && activePanes.includes(p.id))
          const isExpanded = expandedGroups.has(group.id)
          return (
            <div key={group.id} className="group/row">
              <button
                onClick={() => { selectGroup(group.id); window.location.reload() }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${
                  selectedGroupId === group.id
                    ? "text-white bg-[#111111]"
                    : "text-[#888] hover:text-white hover:bg-[#111111]"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newSet = new Set(expandedGroups)
                    if (isExpanded) newSet.delete(group.id)
                    else newSet.add(group.id)
                    setExpandedGroups(newSet)
                  }}
                  className="text-xs text-[#666] hover:text-white border border-[#252525] rounded px-1 shrink-0"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "▾" : "▸"}
                </button>
                <span className="truncate">{group.name}</span>
              </button>
              {hoveredGroupId === group.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                  className="absolute right-2 top-2 h-5 w-5 rounded bg-[#E44] hover:bg-[#C33] flex items-center justify-center text-white text-[10px] font-bold leading-none shrink-0"
                  title="Delete group"
                >
                  ×
                </button>
              )}
              {isExpanded && groupPanes.length > 0 && (
                <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
                  {groupPanes.map((pane) => (
                    <div
                      key={pane.id}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-white hover:text-[#ccc] cursor-pointer"
                      onClick={() => usePaneStore.getState().selectTab(pane.id)}
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
        {/* Spacer */}
        <div className="flex-1" />
        {/* Pane count */}
        <span className="text-xs text-[#808080] px-2 text-center">
          {sortedActivePanes.length} pane{sortedActivePanes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Main content - left sidebar + grid */}
      <div className="flex flex-1 overflow-hidden">
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
          <div className="flex items-center justify-center bg-[#080808]">
            <div className="text-center text-[#808080]">
              <p className="text-sm">No panes in this group</p>
              <p className="text-xs mt-1">Click the folder icon on a pane to add it</p>
            </div>
          </div>
        ) : (
          sortedActivePanes.map((pane) => (
            <div
              key={pane.id}
              className="relative overflow-hidden bg-[#080808]"
            >
              <div className="h-full w-full">
                {pane.url ? (
                  <BrowserPane pane={pane} />
                ) : (
                  <XtermPane pane={pane} />
                )}
              </div>
            </div>
          ))
        )}
        </div>

        {/* Git sidebar */}
        <SourceControlPane />
      </div>
    </div>
  )
}
