"use client"

import { useState, useEffect } from "react"
import { PanelLeft, PanelRight } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { XtermPane } from "./XtermPane"
import { SourceControlPane } from "./SourceControlPane"
import { PortManager } from "./PortManager"

interface TabBarProps {
  searchQuery?: string
}

export function TabBar({ searchQuery }: TabBarProps) {
  const { panes, selectedTab, selectTab, tabsSidebarCollapsed, tabsGitSidebarCollapsed, toggleTabsSidebar, toggleTabsGitSidebar } =
    usePaneStore()

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
            <button
              onClick={() => usePaneStore.getState().openExplorer()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Open Folder</span>
            </button>
            <button
              onClick={() => usePaneStore.getState().openBrowserModal()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white font-medium shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>New Whiteboard</span>
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
          {/* Port manager at bottom */}
          <div className="mt-auto pt-2 border-t border-[#252525]">
            <PortManager />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sidebar toggles - right side */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#333333] bg-[#161616] px-4 py-2">
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={toggleTabsSidebar}
            title={tabsSidebarCollapsed ? "Show sidebar (Alt+1)" : "Hide sidebar (Alt+1)"}
            className={`p-1.5 rounded hover:bg-[#333] ${tabsSidebarCollapsed ? "text-[#666]" : "text-[#58A6FF]"}`}
          >
            <PanelLeft size={14} />
          </button>
          <button
            onClick={toggleTabsGitSidebar}
            title={tabsGitSidebarCollapsed ? "Show git (Alt+2)" : "Hide git (Alt+2)"}
            className={`p-1.5 rounded hover:bg-[#333] ${tabsGitSidebarCollapsed ? "text-[#666]" : "text-[#58A6FF]"}`}
          >
            <PanelRight size={14} />
          </button>
        </div>
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
