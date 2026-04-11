"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"

type TabId = "changes" | "commit" | "tree"

interface FileItemProps {
  file: string
  type: "staged" | "unstaged" | "untracked"
  paneId: string
  dir: string
  onStage: () => void
  onUnstage: () => void
}

function FileItem({ file, type, paneId, onStage, onUnstage }: FileItemProps) {
  const color = type === "staged" ? "#3FB950" : type === "unstaged" ? "#F85149" : "#D29922"
  const prefix = type === "staged" ? "+" : type === "unstaged" ? "~" : "?"
  const action = type === "staged" ? "unstage" : "stage"

  return (
    <div className="group flex items-center gap-1 px-3 py-0.5 hover:bg-[#1a1a1a]">
      <span className="text-xs" style={{ color }}>{prefix}</span>
      <span className="text-xs text-white truncate flex-1 font-mono" title={file}>{file}</span>
      <button
        onClick={type === "staged" ? onUnstage : onStage}
        className="text-[10px] text-[#666] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title={action}
      >
        {type === "staged" ? "−" : "+"}
      </button>
    </div>
  )
}

export function GitPane() {
  const { panes, activePanes, selectedGroupId, selectTab, gitStatuses, gitLogs, getGitStatus, gitCommit, gitStage, gitLog } = usePaneStore()
  const [activeTab, setActiveTab] = useState<Record<string, TabId>>({})
  const [commitMessage, setCommitMessage] = useState("")
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())

  // Get panes for current view
  const viewPanes = selectedGroupId
    ? selectedGroupId === "__ungrouped__"
      ? panes.filter(p => p.groupId === null && activePanes.includes(p.id))
      : panes.filter(p => p.groupId === selectedGroupId && activePanes.includes(p.id))
    : panes.filter(p => activePanes.includes(p.id))

  // Extract unique git directories from visible panes
  const gitDirs = viewPanes
    .map(p => p.cwd)
    .filter((cwd): cwd is string => !!cwd && cwd.trim() !== "" && cwd !== ".")
    .filter((cwd, idx, arr) => arr.indexOf(cwd) === idx)
    .sort()

  // Fetch git status for all panes on mount and periodically
  useEffect(() => {
    const fetchStatuses = () => {
      viewPanes.forEach(pane => {
        if (pane.cwd) {
          getGitStatus(pane.id)
        }
      })
    }
    fetchStatuses()
    const interval = setInterval(fetchStatuses, 30000)
    return () => clearInterval(interval)
  }, [viewPanes, getGitStatus])

  if (gitDirs.length === 0) return null

  // Get unique repos with their pane info and status
  const repos = gitDirs.map(dir => {
    const paneWithDir = viewPanes.find(p => p.cwd === dir)
    const status = paneWithDir ? gitStatuses[paneWithDir.id] : null
    const log = paneWithDir ? gitLogs[paneWithDir.id] : null
    return { dir, paneWithDir, status, log }
  }).filter(r => r.paneWithDir)

  const hasGitRepos = repos.some(r => r.status?.is_repo)

  if (!hasGitRepos) {
    return (
      <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#161616] p-2 w-64 overflow-y-auto">
        <span className="text-[10px] text-[#808080] px-2 uppercase tracking-wider mb-2">Git</span>
        {repos.map(({ dir }) => {
          const repoName = dir.split(/[/\\]/).pop() || dir
          return (
            <div key={dir} className="rounded-lg px-3 py-2 border border-[#333333] bg-[#0C0C0C] mb-1">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#F0C674] shrink-0">
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="1.05" y1="12" x2="7" y2="12"/>
                  <line x1="17.01" y1="12" x2="22.96" y2="12"/>
                </svg>
                <span className="text-sm text-white">{repoName}</span>
              </div>
              <span className="text-xs text-[#808080]">Not a git repository</span>
            </div>
          )
        })}
      </div>
    )
  }

  const handleStage = (paneId: string, files: string[]) => {
    gitStage(paneId, files, false)
  }

  const handleUnstage = (paneId: string, files: string[]) => {
    gitStage(paneId, files, true)
  }

  const handleCommit = (paneId: string) => {
    if (commitMessage.trim()) {
      gitCommit(paneId, commitMessage.trim())
      setCommitMessage("")
    }
  }

  const handleViewTree = (paneId: string, dir: string) => {
    gitLog(paneId, dir)
  }

  const toggleRepoExpanded = (dir: string) => {
    const newSet = new Set(expandedRepos)
    if (newSet.has(dir)) {
      newSet.delete(dir)
    } else {
      newSet.add(dir)
    }
    setExpandedRepos(newSet)
  }

  return (
    <div className="flex shrink-0 flex-col border-l border-[#353535] bg-[#161616] w-64 overflow-hidden">
      <span className="text-[10px] text-[#808080] px-3 pt-2 uppercase tracking-wider">Git</span>

      <div className="flex-1 overflow-y-auto">
        {repos.map(({ dir, paneWithDir, status, log }) => {
          if (!status?.is_repo || !paneWithDir) return null
          const repoName = dir.split(/[/\\]/).pop() || dir
          const paneId = paneWithDir.id
          const tab = activeTab[paneId] || "changes"
          const isExpanded = expandedRepos.has(dir)

          return (
            <div key={dir} className="border-b border-[#333333]">
              {/* Repo header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#1a1a1a]"
                onClick={() => { selectTab(paneId); toggleRepoExpanded(dir) }}
              >
                <span className="text-xs text-[#808080]">{isExpanded ? "▾" : "▸"}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#F0C674] shrink-0">
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="1.05" y1="12" x2="7" y2="12"/>
                  <line x1="17.01" y1="12" x2="22.96" y2="12"/>
                </svg>
                <span className="text-sm text-white truncate flex-1">{repoName}</span>
                <span className="text-xs text-[#58A6FF]">{status.branch || "main"}</span>
              </div>

              {isExpanded && (
                <>
                  {/* Tab buttons */}
                  <div className="flex border-b border-[#333333]">
                    {(["changes", "commit", "tree"] as TabId[]).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => { e.stopPropagation(); setActiveTab(prev => ({ ...prev, [paneId]: t })) }}
                        className={`flex-1 px-3 py-1.5 text-xs capitalize ${tab === t ? "bg-[#0C0C0C] text-white border-b-2 border-[#58A6FF]" : "text-[#808080] hover:text-white"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {tab === "changes" && (
                    <div className="bg-[#0C0C0C]">
                      {/* Staged */}
                      {status.staged.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[10px] text-[#3FB950] uppercase tracking-wider bg-[#0f1a0f]">
                            Staged ({status.staged.length}) −
                          </div>
                          {status.staged.map((file) => (
                            <FileItem
                              key={file}
                              file={file}
                              type="staged"
                              paneId={paneId}
                              dir={dir}
                              onStage={() => {}}
                              onUnstage={() => handleUnstage(paneId, [file])}
                            />
                          ))}
                        </div>
                      )}

                      {/* Unstaged */}
                      {status.unstaged.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[10px] text-[#F85149] uppercase tracking-wider bg-[#1a0f0f]">
                            Modified ({status.unstaged.length}) +
                          </div>
                          {status.unstaged.map((file) => (
                            <FileItem
                              key={file}
                              file={file}
                              type="unstaged"
                              paneId={paneId}
                              dir={dir}
                              onStage={() => handleStage(paneId, [file])}
                              onUnstage={() => {}}
                            />
                          ))}
                        </div>
                      )}

                      {/* Untracked */}
                      {status.untracked.length > 0 && (
                        <div>
                          <div className="px-3 py-1 text-[10px] text-[#D29922] uppercase tracking-wider bg-[#1a1508]">
                            Untracked ({status.untracked.length}) +
                          </div>
                          {status.untracked.map((file) => (
                            <FileItem
                              key={file}
                              file={file}
                              type="untracked"
                              paneId={paneId}
                              dir={dir}
                              onStage={() => handleStage(paneId, [file])}
                              onUnstage={() => {}}
                            />
                          ))}
                        </div>
                      )}

                      {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
                        <div className="px-3 py-4 text-xs text-[#808080] text-center">
                          No changes
                        </div>
                      )}
                    </div>
                  )}

                  {tab === "commit" && (
                    <div className="p-2 bg-[#0C0C0C]">
                      <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Commit message..."
                        className="w-full h-20 bg-[#0C0C0C] text-xs text-white placeholder-[#666] rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-[#52525B] border border-[#333333]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCommit(paneId) }}
                        disabled={!commitMessage.trim() || status.staged.length === 0}
                        className="mt-2 w-full rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Commit ({status.staged.length})
                      </button>
                    </div>
                  )}

                  {tab === "tree" && (
                    <div className="bg-[#0C0C0C]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewTree(paneWithDir?.id, dir) }}
                        className="w-full px-3 py-2 text-xs text-[#58A6FF] hover:bg-[#1a1a1a] text-left"
                      >
                        {log ? "Refresh" : "View commits"}
                      </button>
                      {log?.commits.map((commit) => (
                        <div key={commit.hash} className="px-3 py-2 border-b border-[#222] hover:bg-[#1a1a1a]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-[#58A6FF] font-mono">{commit.short_hash}</span>
                            <span className="text-[10px] text-[#808080] truncate">{commit.author}</span>
                          </div>
                          <div className="text-xs text-white truncate" title={commit.message}>{commit.message}</div>
                          <div className="text-[10px] text-[#666] mt-0.5">{commit.date}</div>
                        </div>
                      ))}
                      {!log && (
                        <div className="px-3 py-4 text-xs text-[#808080] text-center">
                          Click "View commits" to load
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
