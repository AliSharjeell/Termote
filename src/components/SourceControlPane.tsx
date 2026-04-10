"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"

export function SourceControlPane() {
  const { panes, activePanes, sourceControlStates, getSourceControlState, gitStage, gitCommit, gitPush, gitPull, gitLog } = usePaneStore()
  const [commitMessage, setCommitMessage] = useState("")
  const [activePaneId, setActivePaneId] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{hash: string; short_hash: string; message: string; author: string; date: string}>>([])

  // Find the focused pane - prefer active pane that has a cwd
  useEffect(() => {
    const focusedPane = panes.find(p => activePanes.includes(p.id) && p.cwd)
    if (focusedPane) {
      setActivePaneId(focusedPane.id)
    }
  }, [panes, activePanes])

  const activePane = panes.find(p => p.id === activePaneId)
  const cwd = activePane?.cwd

  // Fetch source control state when cwd changes
  useEffect(() => {
    if (cwd) {
      getSourceControlState(cwd)
    }
  }, [cwd, getSourceControlState])

  // Refresh periodically
  useEffect(() => {
    if (!cwd) return
    const interval = setInterval(() => {
      getSourceControlState(cwd)
    }, 5000)
    return () => clearInterval(interval)
  }, [cwd, getSourceControlState])

  // Fetch git log for history
  useEffect(() => {
    if (activePaneId) {
      gitLog(activePaneId)
    }
  }, [activePaneId, gitLog])

  // Listen for git log events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const msg = e.detail
      if (msg.event === "git_log" && msg.pane_id === activePaneId) {
        setHistory(msg.commits || [])
      }
    }
    window.addEventListener("terminal-output" as any, handler)
    return () => window.removeEventListener("terminal-output" as any, handler)
  }, [activePaneId])

  if (!cwd) {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#161616] w-64 overflow-hidden">
        <div className="flex items-center justify-center h-full text-xs text-[#808080] p-4 text-center">
          Focus a terminal pane with a git repository to see source control
        </div>
      </div>
    )
  }

  const state = sourceControlStates[cwd]
  if (!state?.is_repo) {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#161616] w-64 overflow-hidden">
        <div className="flex items-center justify-center h-full text-xs text-[#808080] p-4 text-center">
          Not a git repository: {cwd}
        </div>
      </div>
    )
  }

  const handleStage = (files: string[], unstage: boolean) => {
    if (activePaneId) {
      gitStage(activePaneId, files, unstage)
      setTimeout(() => getSourceControlState(cwd), 500)
    }
  }

  const handleCommit = () => {
    if (activePaneId && commitMessage.trim()) {
      gitCommit(activePaneId, commitMessage.trim())
      setCommitMessage("")
      setTimeout(() => getSourceControlState(cwd), 500)
    }
  }

  const handlePush = () => {
    if (activePaneId) {
      gitPush(activePaneId)
      setTimeout(() => getSourceControlState(cwd), 1000)
    }
  }

  const handlePull = () => {
    if (activePaneId) {
      gitPull(activePaneId)
      setTimeout(() => getSourceControlState(cwd), 1000)
    }
  }

  const totalChanges = state.staged.length + state.unstaged.length + state.untracked.length

  return (
    <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#161616] w-64 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333333]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#aaaaaa]">
          <circle cx="12" cy="12" r="4"/>
          <line x1="1.05" y1="12" x2="7" y2="12"/>
          <line x1="17.01" y1="12" x2="22.96" y2="12"/>
        </svg>
        <span className="text-[10px] text-[#888888] uppercase tracking-wider">Source Control</span>
        <span className="text-[10px] text-[#666666]">{state.branch || "main"}</span>
        {/* Push/Pull buttons in header */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handlePull}
            title="Pull"
            className="p-1 rounded hover:bg-[#333] text-[#666666] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
          <button
            onClick={handlePush}
            title="Push"
            className="p-1 rounded hover:bg-[#333] text-[#666666] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sync Changes button (only when ahead > 0) */}
      {state.ahead > 0 && (
        <div className="px-3 py-2 border-b border-[#333333]">
          <button
            onClick={handlePush}
            className="w-full flex items-center justify-center gap-2 rounded bg-[#444444] hover:bg-[#555555] text-white text-xs py-1.5 font-medium"
          >
            <span>↑</span>
            <span>Sync Changes ({state.ahead})</span>
          </button>
        </div>
      )}

      {/* Changes section - top */}
      <div className="border-b border-[#333333]">
        {/* Section header */}
        <div className="px-3 py-1.5 text-[10px] text-[#888888] uppercase tracking-wider bg-[#1a1a1a] flex items-center justify-between">
          <span>Changes ({totalChanges})</span>
          {state.ahead > 0 && <span className="text-[#888888]">↑ {state.ahead} outgoing</span>}
        </div>

        {/* Commit message input */}
        <div className="p-2 border-b border-[#333333]">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit...)"
            className="w-full h-14 bg-[#0C0C0C] text-xs text-white placeholder-[#555555] rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-[#555555] border border-[#333333]"
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || state.staged.length === 0}
            className="mt-2 w-full rounded bg-[#444444] hover:bg-[#555555] text-white text-xs py-1.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Commit ({state.staged.length})
          </button>
        </div>

        {/* Staged changes */}
        {state.staged.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#cccccc] uppercase tracking-wider bg-[#1f1f1f] flex items-center gap-2">
              <span>Staged</span>
              <span className="ml-auto">({state.staged.length})</span>
            </div>
            {state.staged.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                <button
                  onClick={() => handleStage([file.path], true)}
                  className="text-[10px] text-[#888888] opacity-0 group-hover:opacity-100 hover:text-white"
                  title="Unstage"
                >
                  −
                </button>
                <span className="text-xs text-[#cccccc] truncate font-mono" title={file.path}>
                  {file.path.split("/").pop() || file.path}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Modified/Unstaged */}
        {state.unstaged.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#aaaaaa] uppercase tracking-wider bg-[#1a1a1a] flex items-center gap-2">
              <span>Modified</span>
              <span className="ml-auto">({state.unstaged.length})</span>
            </div>
            {state.unstaged.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                <button
                  onClick={() => handleStage([file.path], false)}
                  className="text-[10px] text-[#888888] opacity-0 group-hover:opacity-100 hover:text-white"
                  title="Stage"
                >
                  +
                </button>
                <span className="text-xs text-[#aaaaaa] truncate font-mono" title={file.path}>
                  {file.path.split("/").pop() || file.path}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Untracked */}
        {state.untracked.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#999999] uppercase tracking-wider bg-[#161616] flex items-center gap-2">
              <span>Untracked</span>
              <span className="ml-auto">({state.untracked.length})</span>
            </div>
            {state.untracked.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                <button
                  onClick={() => handleStage([file.path], false)}
                  className="text-[10px] text-[#888888] opacity-0 group-hover:opacity-100 hover:text-white"
                  title="Add to staging"
                >
                  +
                </button>
                <span className="text-xs text-[#999999] truncate font-mono" title={file.path}>
                  {file.path.split("/").pop() || file.path}
                </span>
              </div>
            ))}
          </div>
        )}

        {totalChanges === 0 && (
          <div className="px-3 py-4 text-xs text-[#666666] text-center">
            No changes
          </div>
        )}
      </div>

      {/* History section - bottom */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Section header */}
        <div className="px-3 py-1.5 text-[10px] text-[#888888] uppercase tracking-wider bg-[#1a1a1a] flex items-center justify-between">
          <span>History ({history.length})</span>
          <div className="flex items-center gap-2 text-[#555555]">
            <span>↑ {state.ahead}</span>
            <span>↓ {state.behind}</span>
          </div>
        </div>

        {/* Branch info */}
        <div className="px-3 py-1.5 border-b border-[#333] bg-[#161616]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#888888]"></div>
            <span className="text-xs text-[#cccccc]">{state.branch || "main"}</span>
            <span className="text-[10px] text-[#555555]">/</span>
            <span className="text-[10px] text-[#666666]">{state.remote || "origin"}/{state.branch || "main"}</span>
          </div>
        </div>

        {/* Full commit history tree */}
        <div className="flex-1 overflow-y-auto">
          {history.length > 0 ? (
            <div className="px-2 py-2">
              {history.map((commit, i) => {
                const isFirst = i === 0;
                const isLast = i === history.length - 1;

                return (
                  <div key={commit.hash} className="flex gap-2 relative">
                    {/* Tree visualization column */}
                    <div className="flex flex-col items-center w-4 shrink-0">
                      {!isFirst && <div className="w-px h-3 bg-[#333]"></div>}
                      <div className={`w-2 h-2 rounded-full border-2 ${isFirst ? 'bg-[#888888] border-[#888888]' : 'bg-[#0C0C0C] border-[#666666]'}`}></div>
                      {!isLast && <div className="w-px flex-1 bg-[#333] min-h-[16px]"></div>}
                    </div>

                    {/* Commit content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#888888] font-mono">{commit.short_hash}</span>
                        {isFirst && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-[#444444] text-white">HEAD</span>
                        )}
                      </div>
                      <div className="text-xs text-[#cccccc] mt-0.5 leading-tight" title={commit.message}>
                        {commit.message}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#666666]">{commit.author}</span>
                        <span className="text-[9px] text-[#555555]">·</span>
                        <span className="text-[9px] text-[#666666]">{commit.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-4 text-xs text-[#666666] text-center">
              No commit history
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
