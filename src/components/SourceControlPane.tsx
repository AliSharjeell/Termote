"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"

type TabId = "changes" | "outgoing" | "graph"

export function SourceControlPane() {
  const { panes, activePanes, sourceControlStates, getSourceControlState, gitStage, gitCommit, gitPush, gitPull, gitLog } = usePaneStore()
  const [activeTab, setActiveTab] = useState<TabId>("changes")
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

  // Fetch git log when graph tab is active
  useEffect(() => {
    if (activeTab === "graph" && activePaneId) {
      gitLog(activePaneId)
    }
  }, [activeTab, activePaneId, gitLog])

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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#58A6FF]">
          <circle cx="12" cy="12" r="4"/>
          <line x1="1.05" y1="12" x2="7" y2="12"/>
          <line x1="17.01" y1="12" x2="22.96" y2="12"/>
        </svg>
        <span className="text-[10px] text-[#808080] uppercase tracking-wider">Source Control</span>
        <span className="text-[10px] text-[#808080]">{state.branch || "main"}</span>
        {/* Push/Pull buttons in header */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handlePull}
            title="Pull"
            className="p-1 rounded hover:bg-[#333] text-[#808080] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
          <button
            onClick={handlePush}
            title="Push"
            className="p-1 rounded hover:bg-[#333] text-[#808080] hover:text-white"
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
            className="w-full flex items-center justify-center gap-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1.5 font-medium"
          >
            <span>↑</span>
            <span>Sync Changes ({state.ahead})</span>
          </button>
        </div>
      )}

      {/* Tab buttons */}
      <div className="flex border-b border-[#333333]">
        {(["changes", "outgoing", "graph"] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 px-2 py-2 text-[10px] uppercase tracking-wider ${
              activeTab === t
                ? "text-white border-b-2 border-[#58A6FF] bg-[#0C0C0C]"
                : "text-[#808080] hover:text-white"
            }`}
          >
            {t === "changes" ? `Changes (${totalChanges})` : t === "outgoing" ? `Outgoing (${state.ahead})` : "Graph"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-[#0C0C0C]">
        {activeTab === "changes" && (
          <div>
            {/* Commit message input */}
            <div className="p-2 border-b border-[#333333]">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message (Ctrl+Enter to commit...)"
                className="w-full h-16 bg-[#161616] text-xs text-white placeholder-[#666] rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-[#52525B] border border-[#333333]"
              />
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || state.staged.length === 0}
                className="mt-2 w-full rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Commit ({state.staged.length})
              </button>
            </div>

            {/* Staged changes */}
            {state.staged.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] text-[#3FB950] uppercase tracking-wider bg-[#0f1a0f] flex items-center gap-2">
                  <span>Staged</span>
                  <span className="ml-auto">({state.staged.length})</span>
                </div>
                {state.staged.map((file) => (
                  <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                    <button
                      onClick={() => handleStage([file.path], true)}
                      className="text-[10px] text-[#F85149] opacity-0 group-hover:opacity-100 hover:text-[#ff6b6b]"
                      title="Unstage"
                    >
                      −
                    </button>
                    <span className="text-xs text-[#3FB950] truncate font-mono" title={file.path}>
                      {file.path.split("/").pop() || file.path}
                    </span>
                    <span className="text-[10px] text-[#666] truncate" title={file.path}>
                      {file.path}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Modified/Unstaged */}
            {state.unstaged.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] text-[#F85149] uppercase tracking-wider bg-[#1a0f0f] flex items-center gap-2">
                  <span>Modified</span>
                  <span className="ml-auto">({state.unstaged.length})</span>
                </div>
                {state.unstaged.map((file) => (
                  <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                    <button
                      onClick={() => handleStage([file.path], false)}
                      className="text-[10px] text-[#3FB950] opacity-0 group-hover:opacity-100 hover:text-[#6fdd6f]"
                      title="Stage"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#F85149] truncate font-mono" title={file.path}>
                      {file.path.split("/").pop() || file.path}
                    </span>
                    <span className="text-[10px] text-[#666] truncate" title={file.path}>
                      {file.path}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Untracked */}
            {state.untracked.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] text-[#D29922] uppercase tracking-wider bg-[#1a1508] flex items-center gap-2">
                  <span>Untracked</span>
                  <span className="ml-auto">({state.untracked.length})</span>
                </div>
                {state.untracked.map((file) => (
                  <div key={file.path} className="group flex items-center gap-2 px-3 py-1 hover:bg-[#1a1a1a]">
                    <button
                      onClick={() => handleStage([file.path], false)}
                      className="text-[10px] text-[#3FB950] opacity-0 group-hover:opacity-100 hover:text-[#6fdd6f]"
                      title="Add to staging"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#D29922] truncate font-mono" title={file.path}>
                      {file.path.split("/").pop() || file.path}
                    </span>
                    <span className="text-[10px] text-[#666] truncate" title={file.path}>
                      {file.path}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {totalChanges === 0 && (
              <div className="px-3 py-8 text-xs text-[#808080] text-center">
                No changes
              </div>
            )}
          </div>
        )}

        {activeTab === "outgoing" && (
          <div>
            {state.outgoing_commits.length > 0 ? (
              <div>
                <div className="px-3 py-1.5 text-[10px] text-[#58A6FF] uppercase tracking-wider bg-[#0a1520]">
                  Outgoing Changes [{state.branch} → {state.remote || "origin"}]
                </div>
                {state.outgoing_commits.map((commit, i) => (
                  <div key={commit.hash} className="px-3 py-2 border-b border-[#222] hover:bg-[#1a1a1a]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[#58A6FF] font-mono">{commit.short_hash}</span>
                      <span className="text-[10px] text-[#666]">●</span>
                      <span className="text-[10px] text-[#808080]">{i + 1}</span>
                    </div>
                    <div className="text-xs text-white truncate" title={commit.message}>
                      {commit.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-xs text-[#808080] text-center">
                {state.ahead === 0 ? "All commits pushed" : "No outgoing commits"}
              </div>
            )}
          </div>
        )}

        {activeTab === "graph" && (
          <div className="flex flex-col h-full">
            {/* Branch info header */}
            <div className="px-3 py-2 border-b border-[#333333]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#58A6FF]"></div>
                <span className="text-xs text-white font-medium">{state.branch || "main"}</span>
                <span className="text-[10px] text-[#666]">/</span>
                <span className="text-[10px] text-[#808080]">{state.remote || "origin"}/{state.branch || "main"}</span>
              </div>
              <div className="flex gap-4 mt-2 text-[10px]">
                <span className="text-[#3FB950]">↑ {state.ahead}</span>
                <span className="text-[#F85149]">↓ {state.behind}</span>
              </div>
            </div>

            {/* Full commit history tree */}
            <div className="flex-1 overflow-y-auto">
              {history.length > 0 ? (
                <div className="px-2 py-2">
                  {/* Tree lines */}
                  <div className="relative">
                    {history.map((commit, i) => {
                      const isFirst = i === 0;
                      const isLast = i === history.length - 1;
                      const hasNext = i < history.length - 1;

                      return (
                        <div key={commit.hash} className="flex gap-2 relative">
                          {/* Tree visualization column */}
                          <div className="flex flex-col items-center w-4 shrink-0">
                            {/* Top line */}
                            {!isFirst && (
                              <div className="w-px h-3 bg-[#333]"></div>
                            )}
                            {/* Circle node */}
                            <div className={`w-2 h-2 rounded-full border-2 ${isFirst ? 'bg-[#58A6FF] border-[#58A6FF]' : 'bg-[#0C0C0C] border-[#58A6FF]'}`}></div>
                            {/* Bottom line */}
                            {!isLast && (
                              <div className="w-px flex-1 bg-[#333] min-h-[20px]"></div>
                            )}
                          </div>

                          {/* Commit content */}
                          <div className={`flex-1 pb-3 ${isFirst ? '' : 'pt-0'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#58A6FF] font-mono">{commit.short_hash}</span>
                              {isFirst && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-[#238636] text-white">HEAD</span>
                              )}
                            </div>
                            <div className="text-xs text-white mt-0.5 leading-tight" title={commit.message}>
                              {commit.message}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-[#666]">{commit.author}</span>
                              <span className="text-[9px] text-[#555]">·</span>
                              <span className="text-[9px] text-[#666]">{commit.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-8 text-xs text-[#808080] text-center">
                  No commit history
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
