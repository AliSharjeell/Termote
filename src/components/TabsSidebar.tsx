"use client"

import { PanelLeft, Plus } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"

export function TabsSidebar() {
  const { panes, activePanes, selectedTab, selectTab, groups, toggleTabsSidebar, spawnPane } =
    usePaneStore()

  const handleAddPane = () => {
    spawnPane("powershell")
  }

  return (
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
          onClick={handleAddPane}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
        >
          <span>+</span>
          <span>New Terminal</span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-[#252525] mb-1" />

      {/* All panes list */}
      <div className="flex-1 overflow-y-auto">
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
      </div>

      {/* Groups section */}
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
  )
}
