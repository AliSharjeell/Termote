"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"
import { PanelRight } from "lucide-react"

export function SourceControlPane() {
  const { panes, activePanes, sourceControlStates, sourceControlRepos, selectedSourceControlRepo, setSelectedSourceControlRepo, getSourceControlState, gitStage, gitCommit, gitPush, gitPull, gitLog, findGitRepos, toggleGitSidebar } = usePaneStore()
  const [commitMessage, setCommitMessage] = useState("")
  const [activePaneId, setActivePaneId] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{hash: string; short_hash: string; message: string; author: string; date: string}>>([])

  // Find all panes with a cwd for repo discovery
  const allPaneCwds = panes
    .filter(p => activePanes.includes(p.id) && p.cwd && (p.cwd.startsWith("/") || /^[A-Z]:/i.test(p.cwd)))
    .map(p => p.cwd)

  // Deduplicate cwds
  const uniqueCwds = [...new Set(allPaneCwds)]

  // Find the focused pane - prefer active pane that has a cwd
  useEffect(() => {
    const focusedPane = panes.find(p => activePanes.includes(p.id) && p.cwd)
    if (focusedPane) {
      setActivePaneId(focusedPane.id)
    }
  }, [panes, activePanes])

  const activePane = panes.find(p => p.id === activePaneId)
  const cwd = activePane?.cwd

  // Fetch repos for all open pane directories
  useEffect(() => {
    uniqueCwds.forEach(dir => {
      if (dir && (dir.startsWith("/") || /^[A-Z]:/i.test(dir))) {
        findGitRepos(dir)
      }
    })
  }, [uniqueCwds.length])

  // Fetch source control state when selected repo changes
  useEffect(() => {
    // Only call if selectedSourceControlRepo looks like a real path
    if (selectedSourceControlRepo && (selectedSourceControlRepo.startsWith("/") || /^[A-Z]:/i.test(selectedSourceControlRepo))) {
      getSourceControlState(selectedSourceControlRepo)
    }
  }, [selectedSourceControlRepo, getSourceControlState])

  // Refresh periodically
  useEffect(() => {
    if (!selectedSourceControlRepo) return
    const interval = setInterval(() => {
      getSourceControlState(selectedSourceControlRepo)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedSourceControlRepo, getSourceControlState])

  // Fetch git log when selected repo or active pane changes
  useEffect(() => {
    if (selectedSourceControlRepo && activePaneId) {
      gitLog(activePaneId, selectedSourceControlRepo)
    }
  }, [activePaneId, selectedSourceControlRepo, gitLog])

  // Listen for git log events
  useEffect(() => {
    const outputHandler = (e: CustomEvent) => {
      const msg = e.detail
      if (msg.event === "git_log" && msg.pane_id === activePaneId) {
        setHistory(msg.commits || [])
      }
    }
    const storeHandler = (e: CustomEvent) => {
      if (e.detail.pane_id === activePaneId) {
        setHistory(e.detail.commits || [])
      }
    }
    window.addEventListener("terminal-output" as any, outputHandler)
    window.addEventListener("git-log-received" as any, storeHandler)
    return () => {
      window.removeEventListener("terminal-output" as any, outputHandler)
      window.removeEventListener("git-log-received" as any, storeHandler)
    }
  }, [activePaneId])

  if (!cwd) {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#0d0d0d] w-64 overflow-hidden">
        <div className="flex items-center justify-center h-full text-xs text-[#808080] p-4 text-center">
          Focus a terminal pane with a git repository to see source control
        </div>
      </div>
    )
  }

  const currentRepoPath = selectedSourceControlRepo || cwd
  const state = sourceControlStates[currentRepoPath]
  const isRepo = state?.is_repo || sourceControlRepos.length > 0

  if (!isRepo) {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#0d0d0d] w-64 overflow-hidden">
        <div className="flex items-center justify-center h-full text-xs text-[#808080] p-4 text-center">
          Not a git repository: {cwd}
        </div>
      </div>
    )
  }

  const handleStage = (files: string[], unstage: boolean) => {
    if (activePaneId) {
      gitStage(activePaneId, files, unstage)
      setTimeout(() => getSourceControlState(currentRepoPath), 500)
    }
  }

  const handleCommit = () => {
    if (activePaneId && commitMessage.trim()) {
      gitCommit(activePaneId, commitMessage.trim())
      setCommitMessage("")
      setTimeout(() => getSourceControlState(currentRepoPath), 500)
    }
  }

  const handlePush = () => {
    if (activePaneId) {
      gitPush(activePaneId)
      setTimeout(() => getSourceControlState(currentRepoPath), 1000)
    }
  }

  const handlePull = () => {
    if (activePaneId) {
      gitPull(activePaneId)
      setTimeout(() => getSourceControlState(currentRepoPath), 1000)
    }
  }

  const totalChanges = (state?.staged.length || 0) + (state?.unstaged.length || 0) + (state?.untracked.length || 0)

  // Determine display path (relative to cwd for sub-repos)
  const displayName = (() => {
    if (!selectedSourceControlRepo || selectedSourceControlRepo === cwd) return "."
    const rel = selectedSourceControlRepo.replace(cwd + "\\", "").replace(cwd + "/", "")
    return rel || selectedSourceControlRepo.split(/[/\\]/).pop() || selectedSourceControlRepo
  })()

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
        <span className="text-[10px] text-[#CCCCCC] uppercase tracking-wider">Source Control</span>
        <span className="text-[10px] text-[#CCCCCC]">{state?.branch || sourceControlRepos.find(r => r.path === currentRepoPath)?.branch || "main"}</span>
        {/* Ahead/Behind counts */}
        <div className="ml-auto flex items-center gap-2 text-[10px]">
          {(state?.ahead ?? 0) > 0 && (
            <span className="text-[#CCCCCC]" title="Push pending">
              <span className="text-[#CCCCCC]">↑</span> {state.ahead}
            </span>
          )}
          {(state?.behind ?? 0) > 0 && (
            <span className="text-[#CCCCCC]" title="Pull available">
              <span className="text-[#CCCCCC]">↓</span> {state.behind}
            </span>
          )}
        </div>
        {/* Push/Pull buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePull}
            title="Pull"
            className="p-1 rounded hover:bg-[#333] text-[#CCCCCC] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
          <button
            onClick={handlePush}
            title="Push"
            className="p-1 rounded hover:bg-[#333] text-[#CCCCCC] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Current directory path */}
      {selectedSourceControlRepo && (
        <div className="px-3 py-1 text-[9px] text-[#555555] border-b border-[#1a1a1a] truncate" title={selectedSourceControlRepo}>
          {selectedSourceControlRepo}
        </div>
      )}

      {/* Repo selector (if multiple repos) */}
      {sourceControlRepos.length > 1 && (
        <div className="px-3 py-1.5 border-b border-[#252525] bg-[#0d0d0d]">
          <select
            value={currentRepoPath}
            onChange={(e) => setSelectedSourceControlRepo(e.target.value || null)}
            className="w-full bg-[#080808] text-[10px] text-[#cccccc] border border-[#252525] rounded px-2 py-1 outline-none"
          >
            {sourceControlRepos.map(repo => (
              <option key={repo.path} value={repo.path}>
                {repo.path === cwd ? "./" : repo.name} {repo.branch ? `(${repo.branch})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sync Changes button (only when ahead > 0) */}
      {state?.ahead > 0 && (
        <div className="px-3 py-2 border-b border-[#252525]">
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
      <div className="border-b border-[#252525]">
        {/* Section header */}
        <div className="px-3 py-1.5 text-[10px] text-[#888888] uppercase tracking-wider bg-[#111111] flex items-center justify-between">
          <span>Changes ({totalChanges})</span>
        </div>

        {/* Commit message input */}
        <div className="p-2 border-b border-[#252525]">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit...)"
            className="w-full h-14 bg-[#080808] text-xs text-white placeholder-[#555555] rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-[#555555] border border-[#252525]"
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || (state?.staged.length || 0) === 0}
            className="mt-2 w-full rounded bg-[#444444] hover:bg-[#555555] text-white text-xs py-1.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Commit ({state?.staged.length || 0})
          </button>
        </div>

        {/* Staged changes */}
        {state?.staged && state.staged.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#cccccc] uppercase tracking-wider bg-[#1f1f1f] flex items-center gap-2">
              <span>Staged</span>
              <span className="ml-auto">({state.staged.length})</span>
            </div>
            {state.staged.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#111111]">
                <button
                  onClick={() => handleStage([file.path], true)}
                  className="text-[10px] text-[#CCCCCC] opacity-0 group-hover:opacity-100 hover:text-white"
                  title="Unstage"
                >
                  −
                </button>
                <span className="text-xs text-[#cccccc] truncate font-mono flex-1" title={file.path}>
                  {file.path.split("/").pop() || file.path}
                </span>
                {(file.added ?? 0) > 0 && (
                  <span className="text-[10px] text-[#16C60C]">+{file.added}</span>
                )}
                {(file.deleted ?? 0) > 0 && (
                  <span className="text-[10px] text-[#E74856]">-{file.deleted}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modified/Unstaged */}
        {state?.unstaged && state.unstaged.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#CCCCCC] uppercase tracking-wider bg-[#111111] flex items-center gap-2">
              <span>Modified</span>
              <span className="ml-auto">({state.unstaged.length})</span>
            </div>
            {state.unstaged.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#111111]">
                <button
                  onClick={() => handleStage([file.path], false)}
                  className="text-[10px] text-[#CCCCCC] opacity-0 group-hover:opacity-100 hover:text-white"
                  title="Stage"
                >
                  +
                </button>
                <span className="text-xs text-[#aaaaaa] truncate font-mono flex-1" title={file.path}>
                  {file.path.split("/").pop() || file.path}
                </span>
                {(file.added ?? 0) > 0 && (
                  <span className="text-[10px] text-[#16C60C]">+{file.added}</span>
                )}
                {(file.deleted ?? 0) > 0 && (
                  <span className="text-[10px] text-[#E74856]">-{file.deleted}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Untracked */}
        {state?.untracked && state.untracked.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] text-[#999999] uppercase tracking-wider bg-[#0d0d0d] flex items-center gap-2">
              <span>Untracked</span>
              <span className="ml-auto">({state.untracked.length})</span>
            </div>
            {state.untracked.map((file) => (
              <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#111111]">
                <button
                  onClick={() => handleStage([file.path], false)}
                  className="text-[10px] text-[#CCCCCC] opacity-0 group-hover:opacity-100 hover:text-white"
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

      {/* Bottom section - History + Outgoing, compact */}
      <div className="border-t border-[#252525] flex-1 flex flex-col min-h-0 overflow-hidden mt-4">
        {/* History compact */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="px-3 py-2 text-[10px] text-[#888888] uppercase tracking-wider bg-[#111111] flex items-center justify-between shrink-0 border-b border-[#1a1a1a]">
            <span>History ({history.length})</span>
            <div className="flex items-center gap-2 text-[#555555]">
              <span>↑ {state?.ahead || 0}</span>
              <span>↓ {state?.behind || 0}</span>
            </div>
          </div>
          {history.length > 0 ? (
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="px-2 py-2">
                {history.map((commit, i) => {
                  const isFirst = i === 0;
                  const hasNext = i < history.length - 1;
                  return (
                    <div key={commit.hash} className="flex gap-0 items-start py-1.5 relative">
                      {/* Graph line */}
                      <div className="flex flex-col items-center shrink-0 w-5">
                        {hasNext && <div className="w-px h-3 bg-[#2a2a2a]"></div>}
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isFirst ? 'bg-[#16C60C]' : 'bg-[#333333]'}`}></div>
                        {hasNext && <div className="w-px h-3 bg-[#2a2a2a]"></div>}
                      </div>
                      <span className="text-[10px] text-[#666666] font-mono shrink-0 ml-2 w-16 truncate">{commit.short_hash}</span>
                      <span className="text-[10px] text-[#888888] truncate flex-1 leading-tight">{commit.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 text-[10px] text-[#666666]">
              No history
            </div>
          )}
        </div>

        {/* Outgoing compact */}
        {state?.outgoing_commits && state.outgoing_commits.length > 0 && (
          <div className="border-t border-[#1a1a1a] shrink-0">
            <div className="px-3 py-1 text-[10px] text-[#888888] uppercase tracking-wider bg-[#111111] flex items-center justify-between">
              <span>Outgoing ({state.outgoing_commits.length})</span>
              <span className="text-[#555555]">{state.remote || "origin"}</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "60px" }}>
              {state.outgoing_commits.map((commit, i) => (
                <div key={commit.hash} className="px-3 py-1 hover:bg-[#111111]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888888] font-mono">{commit.short_hash}</span>
                    <span className="text-[10px] text-[#555555]">·</span>
                    <span className="text-[10px] text-[#666666] truncate">{commit.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
