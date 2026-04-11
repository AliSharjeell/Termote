"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState } from "react"
import { PanelRight, Terminal, FolderGit2 } from "lucide-react"

interface GitPaneItem {
  paneId: string
  name: string
  cwd: string
  isRepo: boolean
  branch: string | null
}

export function SourceControlPane() {
  const {
    panes,
    activePanes,
    sourceControlRepos,
    toggleGitSidebar,
    spawnLazygit,
  } = usePaneStore()
  const [selectedPaneId, setSelectedPaneId] = useState<string | null>(null)

  // Get all panes with valid working directories
  const gitPaneItems: GitPaneItem[] = panes
    .filter(p => {
      const isActive = activePanes.includes(p.id)
      const hasCwd = p.cwd && (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd))
      const isRealShell = p.shell !== "note" && p.shell !== "image" && p.shell !== "whiteboard" && !p.url
      return isActive && hasCwd && isRealShell
    })
    .map(p => {
      // Check if this pane's cwd is a git repo
      const repoInfo = sourceControlRepos.find(r => r.path === p.cwd || (p.cwd && p.cwd.startsWith(r.path)))
      return {
        paneId: p.id,
        name: p.name,
        cwd: p.cwd || "",
        isRepo: !!repoInfo,
        branch: repoInfo?.branch || null,
      }
    })

  const handleOpenLazygit = (item: GitPaneItem) => {
    if (!item.isRepo) return
    setSelectedPaneId(item.paneId)
    spawnLazygit(item.paneId, item.cwd)
  }

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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#252525]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#CCCCCC]">
          <circle cx="12" cy="12" r="4"/>
          <line x1="1.05" y1="12" x2="7" y2="12"/>
          <line x1="17.01" y1="12" x2="22.96" y2="12"/>
        </svg>
        <span className="text-[10px] text-[#CCCCCC] uppercase tracking-wider">Git Sessions</span>
      </div>

      {/* Git pane selector */}
      <div className="flex-1 overflow-y-auto py-2">
        {gitPaneItems.length === 0 ? (
          <div className="px-3 py-4 text-xs text-[#CCCCCC] text-center">
            No terminal panes with git directories found
          </div>
        ) : (
          gitPaneItems.map((item) => (
            <button
              key={item.paneId}
              onClick={() => item.isRepo && handleOpenLazygit(item)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                item.isRepo
                  ? "hover:bg-[#1f1f1f] cursor-pointer"
                  : "opacity-50 cursor-default"
              } ${selectedPaneId === item.paneId ? "bg-[#252525]" : ""}`}
            >
              {/* Icon */}
              <div className={`shrink-0 w-7 h-7 rounded flex items-center justify-center ${
                item.isRepo ? "bg-[#1a1a1a]" : "bg-[#111]"
              }`}>
                {item.isRepo ? (
                  <FolderGit2 size={14} className="text-[#16C60C]" />
                ) : (
                  <Terminal size={14} className="text-[#888]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#CCCCCC] truncate">{item.name}</div>
                <div className="text-[9px] text-[#666] truncate" title={item.cwd}>{item.cwd}</div>
              </div>

              {/* Branch badge or "Not a repo" */}
              {item.isRepo ? (
                <span className="shrink-0 text-[9px] text-[#16C60C] bg-[#1a2a1a] px-1.5 py-0.5 rounded">
                  {item.branch || "main"}
                </span>
              ) : (
                <span className="shrink-0 text-[9px] text-[#666]">—</span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Hint footer */}
      <div className="px-3 py-2 border-t border-[#252525]">
        <p className="text-[9px] text-[#666]">
          Select a terminal with a git repo to open Lazygit
        </p>
      </div>
    </div>
  )
}
