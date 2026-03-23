"use client"

import { useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"

interface TabBarProps {
  searchQuery?: string
}

export function TabBar({ searchQuery }: TabBarProps) {
  const { panes, activePanes, floatingPanes, selectedTab, selectTab, groups, deleteGroup } =
    usePaneStore()
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

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
    <div className="flex h-full w-full flex-col bg-[#0C0C0C]">
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
              style={{ visibility: pane.id === selectedTab ? "visible" : "hidden" }}
            >
              <XtermPane pane={pane} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
