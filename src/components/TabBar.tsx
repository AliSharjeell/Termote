"use client"

import { useState, useEffect } from "react"
import { PanelLeft, PanelRight } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"
import { SourceControlPane } from "./SourceControlPane"

interface TabBarProps {
  searchQuery?: string
}

export function TabBar({ searchQuery }: TabBarProps) {
  const { panes, activePanes, floatingPanes, selectedTab, selectTab, groups, deleteGroup, tabsSidebarCollapsed, tabsGitSidebarCollapsed, toggleTabsSidebar, toggleTabsGitSidebar } =
    usePaneStore()
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

  // Keyboard shortcuts for sidebar toggles and tab close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault()
        toggleTabsSidebar()
      }
      if (e.altKey && e.key === "2") {
        e.preventDefault()
        toggleTabsGitSidebar()
      }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault()
        // Close the selected tab (kill pane)
        if (selectedTab) {
          usePaneStore.getState().killPane(selectedTab)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleTabsSidebar, toggleTabsGitSidebar, selectedTab])

  // Search filter
  const searchFiltered = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Split panes into ungrouped and grouped
  const ungroupedPanes = searchFiltered.filter((p) => !p.groupId)
  const groupedPanesByGroup = groups.reduce((acc, group) => {
    const groupPanes = searchFiltered.filter((p) => p.groupId === group.id)
    if (groupPanes.length > 0) {
      acc.push({ group, panes: groupPanes })
    }
    return acc
  }, [] as { group: typeof groups[0]; panes: typeof panes }[])

  // Sort: pinned panes first, then by original order
  const sortPanes = (paneList: typeof panes) =>
    [...paneList].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })

  const selectedPane = panes.find((p) => p.id === selectedTab)

  const handleTabClick = (paneId: string) => {
    selectTab(paneId)
  }

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId)
  }

  if (panes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0C0C0C]">
        <div className="text-center text-[#CCCCCC]">
          <p className="text-lg">No active panes</p>
          <button
            onClick={() => {
              console.log("New Terminal clicked, isAuthenticated:", usePaneStore.getState().isAuthenticated)
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

  return (
    <div className="flex h-full w-full flex-row bg-[#0C0C0C]">
      {/* Left sidebar - pane navigation */}
      {tabsSidebarCollapsed ? (
        <div className="shrink-0 flex flex-col items-center gap-1 border-r border-[#252525] bg-[#0d0d0d] p-1 w-10">
          <button
            onClick={toggleTabsSidebar}
            title="Expand sidebar"
            className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <PanelLeft size={14} />
          </button>
          <span className="text-[8px] text-[#CCCCCC]">{panes.length} panes</span>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col gap-1 border-r border-[#252525] bg-[#0d0d0d] p-2 w-56">
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-center justify-start px-1 mb-1">
              <button
                onClick={toggleTabsSidebar}
                title="Collapse sidebar"
                className="text-[#CCCCCC] hover:text-white"
              >
                <PanelLeft size={14} />
              </button>
            </div>
            <button
              onClick={() => usePaneStore.getState().spawnPane("powershell")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
            >
              <span>+</span>
              <span>New Terminal</span>
            </button>
          </div>
          <div className="h-px bg-[#252525] mb-1" />
          <div className="px-3 py-1 text-[10px] text-[#808080] uppercase tracking-wider mb-1">
            Panes ({panes.length})
          </div>
          {panes.map((pane) => (
            <div
              key={pane.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded ${
                selectedTab === pane.id
                  ? "text-white bg-[#252525]"
                  : "text-[#808080] hover:text-white hover:bg-[#1f1f1f]"
              }`}
              onClick={() => selectTab(pane.id)}
            >
              {pane.url ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              ) : pane.shell === "note" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              ) : pane.shell === "image" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              ) : pane.shell === "whiteboard" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#888] shrink-0">
                  <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
              )}
              <span className="truncate">{pane.name}</span>
              {pane.pinned && <span className="text-[#666] shrink-0">★</span>}
            </div>
          ))}
          {groups.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#252525]">
              <div className="px-3 py-1 text-[10px] text-[#808080] uppercase tracking-wider mb-1">
                Groups
              </div>
              {groups.map((group) => {
                const groupPanes = panes.filter(p => p.groupId === group.id)
                return (
                  <div key={group.id} className="mb-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <span
                        className="h-2 w-2 rounded shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="truncate text-[#CCCCCC]">{group.name}</span>
                      <span className="ml-auto text-xs text-[#666]">{groupPanes.length}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-[#333333] bg-[#161616] px-4 py-2">
        {/* Add button */}
        <button
          onClick={() => usePaneStore.getState().spawnPane("powershell")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-black hover:bg-gray-200 text-lg"
        >
          +
        </button>

        {/* Separator */}
        <div className="h-4 w-px bg-[#353535] shrink-0" />

        {/* Ungrouped pane tabs */}
        {sortPanes(ungroupedPanes).map((pane) => (
          <div
            key={pane.id}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm border border-[#333333] shrink-0 ${
              selectedTab === pane.id
                ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
            }`}
            onClick={() => handleTabClick(pane.id)}
          >
            <span className="truncate max-w-[150px]">
              {pane.name}
            </span>
          </div>
        ))}

        {/* Grouped panes as expandable groups */}
        {groupedPanesByGroup.map(({ group, panes: groupPanes }) => {
          const isExpanded = expandedGroupId === group.id
          const isSelected = groupPanes.some((p) => p.id === selectedTab)

          if (isExpanded) {
            // Expanded: show all panes in the group
            return (
              <div key={group.id} className="flex items-center gap-1 shrink-0">
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border border-[#3B78FF] bg-[#0C0C0C] text-[#CCCCCC] shrink-0 relative`}
                >
                  <span
                    className="h-2 w-2 rounded shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="truncate max-w-[100px]">{group.name}</span>
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
                </div>
                {sortPanes(groupPanes).map((pane) => (
                  <div
                    key={pane.id}
                    className={`group flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm border border-[#333333] shrink-0 ${
                      selectedTab === pane.id
                        ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                        : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
                    }`}
                    onClick={() => handleTabClick(pane.id)}
                  >
                    <span className="truncate max-w-[150px]">
                      {pane.name}
                    </span>
                  </div>
                ))}
              </div>
            )
          }

          // Collapsed: show single group tab
          return (
            <div
              key={group.id}
              className="group relative shrink-0"
              onMouseEnter={() => setHoveredGroupId(group.id)}
              onMouseLeave={() => setHoveredGroupId(null)}
            >
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm border border-[#333333] cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                    : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
                }`}
                onClick={() => toggleGroupExpand(group.id)}
              >
                <span
                  className="h-2 w-2 rounded shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate max-w-[100px]">{group.name}</span>
                <span className="text-[10px] text-[#606060]">({groupPanes.length})</span>
                {hoveredGroupId === group.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteGroup(group.id)
                    }}
                    className="ml-1 h-4 w-4 rounded-full bg-[#E44] hover:bg-[#C33] flex items-center justify-center text-white text-[10px] font-bold leading-none"
                    title="Delete group"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Active pane content - render all panes but show only selected one */}
      <div className="flex-1 overflow-hidden relative">
        {panes.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-[#808080]">
            <p className="text-sm">Select a tab to view</p>
          </div>
        ) : (
          panes.map((pane) => (
            <div
              key={pane.id}
              className="absolute inset-0"
              style={{ opacity: pane.id === selectedTab ? 1 : 0, pointerEvents: pane.id === selectedTab ? "auto" : "none" }}
            >
              <XtermPane pane={pane} />
            </div>
          ))
        )}
      </div>
      </div>

      {/* Git sidebar */}
      {tabsGitSidebarCollapsed ? (
        <div className="shrink-0 flex flex-col items-center border-l border-[#252525] bg-[#0d0d0d] w-10 py-2 gap-2">
          <button
            onClick={toggleTabsGitSidebar}
            title="Expand git sidebar"
            className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <PanelRight size={14} />
          </button>
        </div>
      ) : (
        <SourceControlPane />
      )}
    </div>
  )
}
