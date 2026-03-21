"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"

export function TabBar() {
  const { panes, floatingPanes, selectedTab, selectTab, moveToActive } =
    usePaneStore()

  const floatingPanesData = panes.filter((p) => floatingPanes.includes(p.id))
  const selectedPane = panes.find((p) => p.id === selectedTab)

  const handleTabClick = (paneId: string) => {
    selectTab(paneId)
  }

  const handleMoveToGrid = (paneId: string) => {
    moveToActive(paneId)
  }

  if (floatingPanesData.length === 0) {
    return null
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0C0C0C]">
      {/* Tab bar */}
      <div className="flex shrink-0 overflow-x-auto bg-[#1E1E1E]">
        {floatingPanesData.map((pane) => (
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
              {pane.shell} ({pane.pid})
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
