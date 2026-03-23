"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"

interface TabBarProps {
  searchQuery?: string
}

export function TabBar({ searchQuery }: TabBarProps) {
  const { panes, activePanes, floatingPanes, selectedTab, selectTab, moveToActive } =
    usePaneStore()

  // Show ALL panes (both active and floating) as tabs, sorted with pinned first
  const allPanesData = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Sort: pinned panes first, then by original order
  const sortedPanes = [...allPanesData].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })
  const selectedPane = panes.find((p) => p.id === selectedTab)

  const handleTabClick = (paneId: string) => {
    selectTab(paneId)
  }

  const handleMoveToGrid = (paneId: string) => {
    moveToActive(paneId)
  }

  if (allPanesData.length === 0) {
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

        {sortedPanes.map((pane) => (
          <div
            key={pane.id}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm border border-[#333333] ${
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

      {/* Active pane content */}
      <div className="flex-1 overflow-hidden">
        {selectedPane && <XtermPane pane={selectedPane} />}
      </div>
    </div>
  )
}
