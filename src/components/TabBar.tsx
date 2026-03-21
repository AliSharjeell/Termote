"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"

export function TabBar() {
  const { panes, activePanes, floatingPanes, selectedTab, selectTab, moveToActive } =
    usePaneStore()

  // Show ALL panes (both active and floating) as tabs
  const allPanesData = panes
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
            className="mt-4 rounded bg-[#0037DA] px-4 py-2 text-sm text-white hover:bg-[#0037DA]/90"
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
      <div className="flex shrink-0 items-center overflow-x-auto bg-[#1E1E1E]">
        {/* Add button */}
        <button
          onClick={() => usePaneStore.getState().spawnPane("powershell")}
          className="shrink-0 rounded bg-[#0037DA] px-3 py-2 text-sm text-white hover:bg-[#0037DA]/90"
        >
          + Add
        </button>

        {allPanesData.map((pane) => (
          <div
            key={pane.id}
            className={`flex cursor-pointer items-center gap-2 border-r border-[#333333] px-4 py-2 text-sm ${
              selectedTab === pane.id
                ? "bg-[#0C0C0C] text-[#CCCCCC]"
                : "text-[#808080] hover:bg-[#252525]"
            }`}
            onClick={() => handleTabClick(pane.id)}
          >
            <span className="truncate max-w-[100px]">
              {pane.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleMoveToGrid(pane.id)
              }}
              className="ml-2 text-xs text-[#808080] hover:text-[#CCCCCC]"
              title="Move to grid"
            >
              Grid
            </button>
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
