"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect, useCallback } from "react"
import { PanelRight, FolderGit2, RefreshCw, ArrowLeft } from "lucide-react"

interface GitPaneItem {
  paneId: string
  name: string
  cwd: string
  isRepo: boolean
  branch: string | null
}

function normalizePath(s: string) {
  return s.replace(/\\/g, "/").replace(/\/+$/, "")
}

export function SourceControlPane() {
  const {
    panes,
    activePanes,
    sourceControlRepos,
    toggleGitSidebar,
    findGitRepos,
    gitStatuses,
    getGitStatus,
  } = usePaneStore()

  const [isScanning, setIsScanning] = useState(false)
  // Sidebar mode: "list" or "lazygit"
  const [sidebarMode, setSidebarMode] = useState<"list" | "lazygit">("list")
  // Which pane/label is selected to show in lazygit view
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  // Kick off git repo discovery on mount — also re-scan if panes exist but repos are empty
  useEffect(() => {
    const hasPanesWithCwds = panes.some(p =>
      activePanes.includes(p.id) &&
      p.cwd &&
      (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd)) &&
      !["note", "image", "whiteboard"].includes(p.shell) &&
      !p.url
    )
    if (sourceControlRepos.length === 0 || hasPanesWithCwds) {
      setIsScanning(true)
      // Re-discover repos for common locations
      findGitRepos("C:/Users/alish")
      findGitRepos("C:/AppsNew")
      // Also scan each open pane's cwd
      panes.forEach(p => {
        if (p.cwd && (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd))) {
          findGitRepos(p.cwd)
        }
      })
    }
    const timer = setTimeout(() => setIsScanning(false), 3000)
    return () => clearTimeout(timer)
  }, [panes.length])

  // Get open terminal panes that are in git repos
  const gitPaneItems: GitPaneItem[] = panes
    .filter(p => {
      const isActive = activePanes.includes(p.id)
      const hasCwd = p.cwd && (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd))
      const isRealShell = p.shell !== "note" && p.shell !== "image" && p.shell !== "whiteboard" && !p.url
      return isActive && hasCwd && isRealShell
    })
    .map(p => {
      const cwd = normalizePath(p.cwd || "")
      const repoInfo = sourceControlRepos.find(r => {
        const repoPath = normalizePath(r.path)
        return cwd === repoPath || cwd.startsWith(repoPath + "/")
      })
      return {
        paneId: p.id,
        name: p.name,
        cwd: p.cwd || "",
        isRepo: !!repoInfo,
        branch: repoInfo?.branch || null,
      }
    })

  const visibleItems = gitPaneItems.filter(i => i.isRepo)

  const handleSelectItem = (item: GitPaneItem) => {
    if (!item.isRepo) return
    // Switch sidebar to lazygit mode for this item
    setSelectedLabel(item.cwd)
    setSidebarMode("lazygit")
    // NOTE: we do NOT spawn lazygit here — we just show git status in the sidebar.
    // The existing terminal pane stays open. User can run lazygit themselves
    // in the terminal, or we can spawn a separate lazygit pane if needed.
    // Fetch git status for all open panes in this repo
    panes.forEach(p => {
      if (activePanes.includes(p.id) && p.cwd) {
        const pCwd = normalizePath(p.cwd)
        const sel = normalizePath(item.cwd)
        if (pCwd === sel || pCwd.startsWith(sel + "/")) {
          console.log("[SourceControlPane] Fetching git status for pane:", p.id, "cwd:", p.cwd)
          getGitStatus(p.id)
        }
      }
    })
  }

  const handleBack = () => {
    setSidebarMode("list")
    setSelectedLabel(null)
  }

  // Helper to trigger git status fetch for a pane
  const fetchStatusForPane = useCallback((paneId: string) => {
    getGitStatus(paneId)
  }, [getGitStatus])

  // === LazyGit mode ===
  if (sidebarMode === "lazygit") {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#0d0d0d] w-64 overflow-hidden">
        {/* Back button row */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-[#1a1a1a]">
          <button
            onClick={handleBack}
            title="Back to repo list"
            className="flex items-center gap-1 text-[#CCCCCC] hover:text-white text-[10px]"
          >
            <ArrowLeft size={12} />
            <span>Back</span>
          </button>
          <button
            onClick={toggleGitSidebar}
            title="Collapse git sidebar"
            className="text-[#CCCCCC] hover:text-white"
          >
            <PanelRight size={14} />
          </button>
        </div>

        {/* Lazygit view — shows git status for the selected repo */}
        <div className="flex-1 overflow-y-auto">
          {selectedLabel && (
            <div className="px-3 py-2 border-b border-[#252525]">
              <div className="text-[10px] text-[#CCCCCC] truncate" title={selectedLabel}>
                {selectedLabel.split(/[/\\]/).pop()}
              </div>
              <div className="text-[9px] text-[#666]">Git Status</div>
            </div>
          )}
          {/* Show git status for all open panes that match selected repo dir */}
          {panes
            .filter(p => {
              const isActive = activePanes.includes(p.id)
              const hasCwd = p.cwd && (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd))
              const isRealShell = p.shell !== "note" && p.shell !== "image" && p.shell !== "whiteboard" && !p.url
              if (!isActive || !hasCwd || !isRealShell) return false
              const cwd = normalizePath(p.cwd || "")
              return selectedLabel && (cwd === normalizePath(selectedLabel) || cwd.startsWith(normalizePath(selectedLabel) + "/"))
            })
            .map(pane => {
              const status = gitStatuses[pane.id]
              if (!status) {
                return (
                  <div key={pane.id} className="px-3 py-4 text-xs text-[#666]">
                    Loading git status for {pane.cwd}...
                  </div>
                )
              }
              return (
                <div key={pane.id} className="border-b border-[#222]">
                  {/* Staged */}
                  {status.staged.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[9px] text-[#3FB950] uppercase tracking-wider bg-[#0f1a0f] sticky top-0">
                        Staged ({status.staged.length})
                      </div>
                      {status.staged.map(f => (
                        <div key={f} className="px-3 py-0.5 text-[10px] text-[#CCCCCC] font-mono truncate hover:bg-[#1a1a1a]">
                          + {f}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Unstaged */}
                  {status.unstaged.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[9px] text-[#F85149] uppercase tracking-wider bg-[#1a0f0f] sticky top-0">
                        Modified ({status.unstaged.length})
                      </div>
                      {status.unstaged.map(f => (
                        <div key={f} className="px-3 py-0.5 text-[10px] text-[#CCCCCC] font-mono truncate hover:bg-[#1a1a1a]">
                          ~ {f}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Untracked */}
                  {status.untracked.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[9px] text-[#D29922] uppercase tracking-wider bg-[#1a1508] sticky top-0">
                        Untracked ({status.untracked.length})
                      </div>
                      {status.untracked.map(f => (
                        <div key={f} className="px-3 py-0.5 text-[10px] text-[#CCCCCC] font-mono truncate hover:bg-[#1a1a1a]">
                          ? {f}
                        </div>
                      ))}
                    </div>
                  )}
                  {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
                    <div className="px-3 py-4 text-xs text-[#666]">No changes</div>
                  )}
                </div>
              )
            })}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-[#252525]">
          <p className="text-[9px] text-[#666]">Click Back to return to repo list</p>
        </div>
      </div>
    )
  }

  // === List mode ===
  return (
    <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#0d0d0d] w-64 overflow-hidden">
      {/* Collapse button row */}
      <div className="flex justify-start px-2 py-1 border-b border-[#1a1a1a]">
        <button
          onClick={toggleGitSidebar}
          title="Collapse git sidebar"
          className="text-[#CCCCCC] hover:text-white"
        >
          <PanelRight size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#252525]">
        <div className="flex items-center gap-2">
          {isScanning && <RefreshCw size={12} className="text-[#58A6FF] animate-spin" />}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC]">
            <circle cx="12" cy="12" r="4"/>
            <line x1="1.05" y1="12" x2="7" y2="12"/>
            <line x1="17.01" y1="12" x2="22.96" y2="12"/>
          </svg>
          <span className="text-[10px] text-[#CCCCCC] uppercase tracking-wider">Git</span>
        </div>
        <button
          onClick={() => { setIsScanning(true); findGitRepos("C:/AppsNew"); findGitRepos("C:/Users/alish"); setTimeout(() => setIsScanning(false), 3000) }}
          title="Refresh repos"
          className="text-[#666] hover:text-[#CCCCCC]"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Repo list */}
      <div className="flex-1 overflow-y-auto py-2">
        {visibleItems.length === 0 ? (
          <div className="px-3 py-4 text-xs text-[#666] text-center">
            No open terminals in git repos.
            <br />
            Open a terminal in a git repo to see it here.
          </div>
        ) : (
          visibleItems.map((item) => (
            <button
              key={item.paneId}
              onClick={() => handleSelectItem(item)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-[#1f1f1f] text-left mb-0.5 transition-colors"
              title={`Open git view: ${item.cwd}`}
            >
              <FolderGit2 size={13} className="text-[#16C60C] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#CCCCCC] truncate">{item.name}</div>
                <div className="text-[9px] text-[#666] truncate" title={item.cwd}>{item.cwd}</div>
              </div>
              <span className="shrink-0 text-[9px] text-[#16C60C] bg-[#1a2a1a] px-1.5 py-0.5 rounded">
                {item.branch || "main"}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Hint footer */}
      <div className="px-3 py-2 border-t border-[#252525]">
        <p className="text-[9px] text-[#666]">
          Click a terminal to view git status
        </p>
      </div>
    </div>
  )
}