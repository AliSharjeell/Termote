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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-black hover:bg-gray-200 font-bold text-lg"
        >
          +
        </button>

        {allPanesData.map((pane) => (
          <div
            key={pane.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm border border-[#333333] ${
              selectedTab === pane.id
                ? "bg-[#0C0C0C] text-[#CCCCCC] border-[#0C0C0C]"
                : "text-[#808080] hover:bg-[#333333] hover:border-[#444444]"
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
              className="ml-2 rounded-full bg-[#333333] px-2 py-0.5 text-xs text-[#808080] hover:text-[#CCCCCC] hover:bg-[#444444]"
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
