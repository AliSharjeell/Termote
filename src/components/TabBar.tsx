"use client"

import { useState, useEffect } from "react"
import { PanelLeft } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { refitTerminal, fitAllTerminals, setupVisualViewport, setupWindowResizeHandler } from "@/lib/terminalRegistry"
import { XtermPane } from "./XtermPane"
import { PortManager } from "./PortManager"
import { BrowserPane } from "./BrowserPane"
import { NotePane } from "./NotePane"
import { ImagePane } from "./ImagePane"
import { WhiteboardPane } from "./WhiteboardPane"
import { useIsTauri } from "@/hooks/useIsTauri"
import { ActivityIndicator } from "./ActivityIndicator"
import { getHighestActivityStatus } from "@/lib/activityStatus"

interface TabBarProps {
  searchQuery?: string
}

export function TabBar({ searchQuery }: TabBarProps) {
  const {
    panes,
    groups,
    activePanes,
    selectedTab,
    selectTab,
    tabsSidebarCollapsed,
    tabsGitSidebarCollapsed,
    toggleTabsSidebar,
    paneActivities,
  } = usePaneStore()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [sidebarWidth, setSidebarWidth] = useState(224)
  const [isResizing, setIsResizing] = useState(false)
  const { isTauri: isTauriApp, checked: tauriChecked } = useIsTauri()

  // Determine Mica-transparent styling for Tauri
  const isMica = tauriChecked && isTauriApp

  console.log('[TabBar] Mica detection:', { tauriChecked, isTauriApp, isMica })

  // Setup global terminal fitting handlers
  useEffect(() => {
    const cleanupViewport = setupVisualViewport()
    const cleanupResize = setupWindowResizeHandler()
    return () => {
      cleanupViewport()
      cleanupResize()
    }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault()
        toggleTabsSidebar()
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
  }, [toggleTabsSidebar, selectedTab])

  // Search filter
  const searchFiltered = searchQuery
    ? panes.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : panes

  // Refit terminal when selected tab changes
  useEffect(() => {
    if (selectedTab) {
      refitTerminal(selectedTab)
    }
  }, [selectedTab])

  // Fit all terminals after layout changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      fitAllTerminals("tabs-layout-change")
    }, 50)
    return () => clearTimeout(timeout)
  }, [tabsSidebarCollapsed, tabsGitSidebarCollapsed])

  // Auto-expand parent group when selected tab belongs to a group
  useEffect(() => {
    if (!selectedTab) return
    const pane = panes.find(p => p.id === selectedTab)
    if (pane?.groupId) {
      setExpandedGroups(prev => {
        if (prev.has(pane.groupId!)) return prev
        return new Set([...prev, pane.groupId!])
      })
    }
  }, [selectedTab, panes])


  return (
    <div className={`flex h-full w-full flex-row ${isMica ? "bg-transparent" : "bg-[#0C0C0C]"}`}>
      {/* Left sidebar */}
      {tabsSidebarCollapsed ? (
        <div data-mica-surface className={`shrink-0 flex flex-col items-center gap-1 border-r border-[#252525] p-1 w-10 ${isMica ? "bg-transparent border-r-transparent" : "bg-[#0d0d0d]"}`}>
          <button
            onClick={toggleTabsSidebar}
            title="Expand sidebar (Alt+1)"
            className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
          >
            <PanelLeft size={18} />
          </button>
        </div>
      ) : (
        <div data-mica-surface className={`flex shrink-0 flex-col gap-1 border-r border-[#252525] p-2 relative ${isMica ? "bg-transparent border-r-transparent" : "bg-[#0d0d0d]"}`} style={{ width: sidebarWidth }}>
          {/* Resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#CCCCCC] transition-colors"
            style={{ left: sidebarWidth - 4 }}
            onMouseDown={() => setIsResizing(true)}
          />
          {/* Header buttons - fixed at top */}
          <div className="flex flex-col gap-1 mb-2 shrink-0">
            <div className="flex items-center justify-start px-1 mb-1">
              <button
                onClick={toggleTabsSidebar}
                title="Collapse sidebar (Alt+1)"
                className="text-[#CCCCCC] hover:text-white"
              >
                <PanelLeft size={18} />
              </button>
            </div>
            <button
              onClick={() => usePaneStore.getState().spawnPane("powershell")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
            >
              <span>+</span>
              <span>New Terminal</span>
            </button>
            <button
              onClick={() => usePaneStore.getState().openExplorer()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Open Folder</span>
            </button>
            <button
              onClick={() => usePaneStore.getState().spawnBrowserPane("")}
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] hover:rounded font-normal shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>New Note</span>
            </button>
            <button
              onClick={() => usePaneStore.getState().spawnImagePane()}
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

          <div className="h-px bg-[#252525] mb-1 shrink-0" />

          {/* Scrollable pane list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Group rows */}
            {groups.map((group) => {
              const groupPanes = panes.filter(p => p.groupId === group.id && activePanes.includes(p.id))
              const isExpanded = expandedGroups.has(group.id)
              const groupStatus = getHighestActivityStatus(groupPanes.map(p => paneActivities[p.id]))
              return (
                <div key={group.id} className="group/row">
                  <div className={`flex items-center gap-2 px-3 cursor-pointer ${isTauriApp ? 'py-1.5' : 'py-3'}`} onClick={() => {
                    const newSet = new Set(expandedGroups)
                    if (isExpanded) newSet.delete(group.id)
                    else newSet.add(group.id)
                    setExpandedGroups(newSet)
                  }}>
                    <span className="text-xs text-[#CCCCCC] shrink-0 w-5 h-5 flex items-center justify-center rounded border border-[#444]">{isExpanded ? "▾" : "▸"}</span>
                    <span className="truncate text-sm text-[#CCCCCC]">{group.name}</span>
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <ActivityIndicator status={groupStatus} />
                      <span className="text-xs text-[#CCCCCC]">{groupPanes.length}</span>
                    </div>
                  </div>
                  {isExpanded && groupPanes.map((pane) => (
                    <div
                      key={pane.id}
                      className={`flex items-center gap-2 px-3 text-sm cursor-pointer rounded ml-2 ${isTauriApp ? 'py-1.5' : 'py-3'} ${
                        selectedTab === pane.id
                          ? "text-[#CCCCCC] bg-white/[0.08]"
                          : "text-[#CCCCCC] hover:bg-white/[0.06] hover:rounded"
                      }`}
                      onClick={() => selectTab(pane.id)}
                    >
                      {pane.paneType === "browser" || pane.url ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      ) : pane.shell === "note" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      ) : pane.shell === "image" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      ) : pane.shell === "whiteboard" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                      )}
                      <span className="truncate text-[#CCCCCC]">{pane.name}</span>
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <ActivityIndicator status={paneActivities[pane.id]} />
                        {pane.pinned && <span className="text-[#CCCCCC]">★</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Ungrouped panes */}
            {panes.filter(p => p.groupId === null && activePanes.includes(p.id)).map((pane) => (
              <div
                key={pane.id}
                className={`flex items-center gap-2 px-3 text-sm cursor-pointer rounded ${isTauriApp ? 'py-1.5' : 'py-3'} ${
                  selectedTab === pane.id
                    ? "text-[#CCCCCC] bg-white/[0.08]"
                    : "text-[#CCCCCC] hover:bg-white/[0.06] hover:rounded"
                }`}
                onClick={() => selectTab(pane.id)}
              >
                {pane.paneType === "browser" || pane.url ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ) : pane.shell === "note" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                ) : pane.shell === "image" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                ) : pane.shell === "whiteboard" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC] shrink-0"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                )}
                <span className="truncate text-[#CCCCCC]">{pane.name}</span>
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  <ActivityIndicator status={paneActivities[pane.id]} />
                  {pane.pinned && <span className="text-[#CCCCCC]">★</span>}
                </div>
              </div>
            ))}
          </div>

          {/* PortManager - sticky at bottom */}
          <div className="shrink-0 pt-2 border-t border-[#252525]">
            <PortManager />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className={`flex flex-1 flex-col overflow-hidden ${isMica ? "mica-terminal-container" : ""}`}>
        {/* Active pane content */}
        <div className="flex-1 overflow-hidden relative">
          {panes.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center bg-[#080808]">
              <div className="text-center text-[#CCCCCC]">
                <p className="text-sm">No active panes</p>
                <button
                  onClick={() => {
                    usePaneStore.getState().spawnPane("powershell")
                  }}
                  className="mt-4 rounded-lg bg-white px-6 py-2.5 text-sm text-black hover:bg-gray-200 font-medium"
                >
                  + New Terminal
                </button>
              </div>
            </div>
          ) : searchFiltered.map((pane) => (
            <div
              key={pane.id}
              className="absolute inset-0"
              style={{ opacity: pane.id === selectedTab ? 1 : 0, pointerEvents: pane.id === selectedTab ? "auto" : "none" }}
            >
              {pane.paneType === "browser" || pane.url ? (
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
          ))}
        </div>
      </div>
    </div>
  )
}
