"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"
import { PanelRight, FolderGit2, RefreshCw } from "lucide-react"

interface GitPaneItem {
  paneId: string
  name: string
  cwd: string
  isRepo: boolean
  repoPath: string | null
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
    toggleTabsGitSidebar,
    tabsGitSidebarCollapsed,
    findGitRepos,
    getSourceControlState,
    setSelectedSourceControlRepo,
    selectedSourceControlRepo,
  } = usePaneStore()

  // Use the correct toggle based on which sidebar is active (tabs vs panes)
  const effectiveToggleGitSidebar = tabsGitSidebarCollapsed !== undefined ? toggleTabsGitSidebar : toggleGitSidebar

  const [isScanning, setIsScanning] = useState(false)

  // Kick off git repo discovery on mount — also re-scan if panes exist but repos are empty
  useEffect(() => {
    // Use get() directly to avoid stale closures
    const state = usePaneStore.getState()
    const hasPanesWithCwds = state.panes.some(p =>
      state.activePanes.includes(p.id) &&
      p.cwd &&
      (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd)) &&
      !["note", "image", "whiteboard"].includes(p.shell) &&
      !p.url
    )
    if (state.sourceControlRepos.length === 0 || hasPanesWithCwds) {
      setIsScanning(true)
      findGitRepos("C:/Users/alish")
      findGitRepos("C:/AppsNew")
      state.panes.forEach(p => {
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
        repoPath: repoInfo?.path || null,
        branch: repoInfo?.branch || null,
      }
    })

  const visibleItems = gitPaneItems.filter(i => i.isRepo)

  const handleSelectItem = (item: GitPaneItem) => {
    if (!item.isRepo) return
    const repoPath = item.repoPath || item.cwd
    setSelectedSourceControlRepo(repoPath)
    getSourceControlState(repoPath)
  }

  return (
    <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#0d0d0d] overflow-hidden" style={{ width: 280, height: "100%" }}>
      {/* Collapse button row */}
      <div className="flex justify-start px-2 py-1 border-b border-[#1a1a1a]">
        <button
          onClick={effectiveToggleGitSidebar}
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
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left mb-0.5 transition-colors ${
                selectedSourceControlRepo === (item.repoPath || item.cwd)
                  ? "bg-[#1f1f1f]"
                  : "hover:bg-[#1f1f1f]"
              }`}
              title={`Refresh git status: ${item.repoPath || item.cwd}`}
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
          Select a repo to refresh git status
        </p>
      </div>
    </div>
  )
}
