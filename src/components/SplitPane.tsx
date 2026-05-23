"use client"

import { useRef, useEffect, useState } from "react"
import { PanelLeft, PanelRight } from "lucide-react"
import { XtermPane } from "./XtermPane"
import { BrowserPane } from "./BrowserPane"
import { NotePane } from "./NotePane"
import { ImagePane } from "./ImagePane"
import { WhiteboardPane } from "./WhiteboardPane"
import { PortManager } from "./PortManager"
import { useIsTauri } from "@/hooks/useIsTauri"
import { usePaneStore } from "@/hooks/usePaneStore"

interface SplitPaneProps {
  searchQuery?: string
}

export function SplitPane({ searchQuery }: SplitPaneProps) {
  // ALL hooks must be at the top - never inside conditionals!
  const { panes, activePanes, isAuthenticated, groups, selectedGroupId, selectedTab, selectGroup, deleteGroup, sidebarCollapsed, toggleSidebar, toggleProfileSidebar, profileSidebarCollapsed, gitSidebarCollapsed, toggleGitSidebar, portProcesses } = usePaneStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sidebarWidth, setSidebarWidth] = useState(224)
  const [isResizing, setIsResizing] = useState(false)
  const { isTauri: isTauriApp, checked: tauriChecked } = useIsTauri()

  // Determine Mica-transparent styling for Tauri
  const isMica = tauriChecked && isTauriApp

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

  // Sidebar resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.min(Math.max(e.clientX, 140), 400)
        setSidebarWidth(newWidth)
      }
    }
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  // Show empty state only if there are no panes at all
  const hasAnyPanes = panes.length > 0
  const isGroupEmpty = sortedActivePanes.length === 0 && selectedGroupId !== null

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
      {sidebarCollapsed ? (
        <div data-mica-surface className={`shrink-0 flex flex-col items-center gap-1 border-r border-[#252525] p-1 w-10 ${isMica ? "bg-transparent border-r-transparent" : "bg-[#0d0d0d]"}`}>
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <PanelLeft size={14} />
          </button>
        </div>
      ) : (
      <div data-mica-surface className={`flex shrink-0 flex-col gap-1 border-r border-[#252525] p-2 ${isMica ? "bg-transparent border-r-transparent" : "bg-[#0d0d0d]"}`} style={{ width: sidebarWidth }}>
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#CCCCCC] transition-colors"
          style={{ left: sidebarWidth - 4 }}
          onMouseDown={() => setIsResizing(true)}
        />
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex items-center justify-start px-1 mb-1">
            <button
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="text-[#CCCCCC] hover:text-white"
            >
              <PanelLeft size={14} />
            </button>
          </div>
          <button
            onClick={handleAddPane}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <span>+</span>
            <span>New Terminal</span>
          </button>
          <button
            onClick={handleSpawnFromDirectory}
            title="Open terminal in folder..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Open Folder</span>
          </button>
          <button
            onClick={() => usePaneStore.getState().openBrowserModal()}
            title="Open browser..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Open Browser</span>
          </button>
          <button
            onClick={() => usePaneStore.getState().spawnNotePane()}
            title="New note..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>New Note</span>
          </button>
          <button
            onClick={() => usePaneStore.getState().spawnImagePane()}
            title="New image pane..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>New Image</span>
          </button>
          <button
            onClick={() => usePaneStore.getState().spawnWhiteboardPane()}
            title="New whiteboard..."
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>New Whiteboard</span>
          </button>
        </div>
        {/* Separator */}
        <div className="h-px bg-[#252525] mb-1" />

        {/* All Panes */}
        <div
          className={`w-full rounded px-3 py-2 text-sm text-left flex items-center gap-2 ${
            selectedGroupId === null
              ? "text-[#CCCCCC] bg-white/[0.08]"
              : "text-[#CCCCCC] hover:bg-white/[0.06] hover:rounded"
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const newSet = new Set(expandedGroups)
              if (expandedGroups.has("__all__")) newSet.delete("__all__")
              else newSet.add("__all__")
              setExpandedGroups(newSet)
            }}
            className={`text-xs border rounded px-1 shrink-0 ${
              selectedGroupId === null
                ? "text-[#CCCCCC] border-[#555]"
                : "text-[#CCCCCC] hover:text-white border-[#252525]"
            }`}
            title="Expand"
          >
            {expandedGroups.has("__all__") ? "▾" : "▸"}
          </button>
          <button
            type="button"
            onClick={() => selectGroup(null)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span>All Panes</span>
            <span className="ml-auto text-xs text-[#CCCCCC]">{panes.filter(p => activePanes.includes(p.id)).length}</span>
          </button>
        </div>
        {expandedGroups.has("__all__") && (
          <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
            {panes.filter(p => activePanes.includes(p.id)).map((pane) => (
              <div
                key={pane.id}
                className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer ${
                  selectedTab === pane.id ? "text-[#CCCCCC] font-normal bg-white/[0.08] rounded" : "text-[#CCCCCC] hover:text-[#ccc]"
                }`}
                onClick={() => usePaneStore.getState().selectTab(pane.id)}
              >
                {pane.url ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ) : pane.shell === "note" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                ) : pane.shell === "image" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                ) : pane.shell === "whiteboard" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                )}
                <span className="truncate">{pane.name}</span>
                {pane.pinned && <span className="text-[#666] shrink-0">★</span>}
              </div>
            ))}
          </div>
        )}

        {/* Ungrouped */}
        <div
          className={`w-full rounded px-3 py-2 text-sm text-left flex items-center gap-2 ${
            selectedGroupId === "__ungrouped__"
              ? "text-[#CCCCCC] bg-white/[0.08]"
              : "text-[#CCCCCC] hover:bg-white/[0.06] hover:rounded"
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const newSet = new Set(expandedGroups)
              if (expandedGroups.has("__ungrouped__")) newSet.delete("__ungrouped__")
              else newSet.add("__ungrouped__")
              setExpandedGroups(newSet)
            }}
            className={`text-xs border rounded px-1 shrink-0 ${
              selectedGroupId === "__ungrouped__"
                ? "text-[#CCCCCC] border-[#555]"
                : "text-[#CCCCCC] hover:text-white border-[#252525]"
            }`}
            title="Expand"
          >
            {expandedGroups.has("__ungrouped__") ? "▾" : "▸"}
          </button>
          <button
            type="button"
            onClick={() => selectGroup("__ungrouped__")}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span>Ungrouped</span>
            <span className="ml-auto text-xs text-[#CCCCCC]">{panes.filter(p => p.groupId === null && activePanes.includes(p.id)).length}</span>
          </button>
        </div>
        {expandedGroups.has("__ungrouped__") && (
          <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5">
            {panes.filter(p => p.groupId === null && activePanes.includes(p.id)).map((pane) => (
              <div
                key={pane.id}
                className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer ${
                  selectedTab === pane.id ? "text-[#CCCCCC] font-normal bg-white/[0.08] rounded" : "text-[#CCCCCC] hover:text-[#ccc]"
                }`}
                onClick={() => usePaneStore.getState().selectTab(pane.id)}
              >
                {pane.url ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ) : pane.shell === "note" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                ) : pane.shell === "image" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                ) : pane.shell === "whiteboard" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                )}
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
              <div
                className={`w-full rounded px-3 py-2 text-sm text-left flex items-center gap-2 ${
                  selectedGroupId === group.id
                    ? "text-[#CCCCCC] bg-white/[0.08]"
                    : "text-[#CCCCCC] hover:bg-white/[0.06] hover:rounded"
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const newSet = new Set(expandedGroups)
                    if (isExpanded) newSet.delete(group.id)
                    else newSet.add(group.id)
                    setExpandedGroups(newSet)
                  }}
                  className={`text-xs border rounded px-1 shrink-0 ${
                    selectedGroupId === group.id
                      ? "text-[#CCCCCC] border-[#555]"
                      : "text-[#CCCCCC] hover:text-white border-[#252525]"
                  }`}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "▾" : "▸"}
                </button>
                <button
                  type="button"
                  onClick={() => selectGroup(group.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs text-[#CCCCCC]">{groupPanes.length}</span>
                </button>
              </div>
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
                      className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer ${
                        selectedTab === pane.id ? "text-[#CCCCCC] font-normal bg-white/[0.08] rounded" : "text-[#CCCCCC] hover:text-[#ccc]"
                      }`}
                      onClick={() => usePaneStore.getState().selectTab(pane.id)}
                    >
                      {pane.url ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      ) : pane.shell === "note" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      ) : pane.shell === "image" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      ) : pane.shell === "whiteboard" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                      )}
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
        <PortManager />
      </div>
      )}

      {/* Main content - left sidebar + grid */}
      <div className={`flex flex-1 overflow-hidden ${isMica ? "mica-terminal-container" : ""}`}>
        {/* Auto-balancing grid */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(cols, 1)}, 1fr)`,
            gridTemplateRows: `repeat(${Math.max(rows, 1)}, 1fr)`,
            gap: 0,
          }}
        >
        {(!hasAnyPanes || isGroupEmpty) ? (
          <div className="flex h-full w-full items-center justify-center bg-transparent border-r border-[#1a1a1a]">
            <div className="text-center text-[#CCCCCC]">
              <p className="text-sm">
                {!hasAnyPanes ? "No active panes" : "No panes in this group"}
              </p>
              {!hasAnyPanes ? (
                <button
                  onClick={() => {
                    usePaneStore.getState().spawnPane("powershell")
                  }}
                  className="mt-4 rounded-lg bg-white px-6 py-2.5 text-sm text-black hover:bg-gray-200 font-medium"
                >
                  + New Terminal
                </button>
              ) : (
                <p className="text-xs mt-1">Click the folder icon on a pane to add it</p>
              )}
            </div>
          </div>
        ) : (
          sortedActivePanes.map((pane) => (
            <div
              key={pane.id}
              className="relative overflow-hidden bg-transparent border border-[#1a1a1a]"
            >
              <div className="h-full w-full">
                {pane.url ? (
                  <BrowserPane pane={pane} />
                ) : pane.shell === "note" ? (
                  <NotePane pane={pane} />
                ) : pane.shell === "image" ? (
                  <ImagePane pane={pane} />
                ) : pane.shell === "whiteboard" ? (
                  <WhiteboardPane pane={pane} />
                ) : (
                  <XtermPane pane={pane} />
                )}
              </div>
            </div>
          ))
        )}
        </div>

        {/* Spacer where profile sidebar used to be - removed for dashboard placement */}
      </div>
    </div>
  )
}
