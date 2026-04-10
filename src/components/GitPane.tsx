"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect } from "react"

export function GitPane() {
  const { panes, activePanes, selectedGroupId, selectTab, gitStatuses, getGitStatus, gitCommit } = usePaneStore()
  const [commitMessage, setCommitMessage] = useState("")
  const [showCommitForm, setShowCommitForm] = useState<string | null>(null)

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
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatuses, 30000)
    return () => clearInterval(interval)
  }, [viewPanes, getGitStatus])

  if (gitDirs.length === 0) return null

  // Get unique repos (by directory) with their pane info
  const repos = gitDirs.map(dir => {
    const paneWithDir = viewPanes.find(p => p.cwd === dir)
    const status = paneWithDir ? gitStatuses[paneWithDir.id] : null
    return { dir, paneWithDir, status }
  }).filter(r => r.paneWithDir)

  // Check if any repo is a git repo
  const hasGitRepos = repos.some(r => r.status?.is_repo)

  if (!hasGitRepos) {
    return (
      <div className="flex shrink-0 flex-col gap-1 border-l border-[#353535] bg-[#161616] p-2 w-56 overflow-y-auto">
        <span className="text-[10px] text-[#808080] px-2 uppercase tracking-wider">Git</span>
        {repos.map(({ dir, paneWithDir }) => {
          const repoName = dir.split(/[/\\]/).pop() || dir
          return (
            <div key={dir} className="rounded-lg px-3 py-2 border border-[#333333] bg-[#0C0C0C]">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#F0C674] shrink-0">
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="1.05" y1="12" x2="7" y2="12"/>
                  <line x1="17.01" y1="12" x2="22.96" y2="12"/>
                </svg>
                <span className="text-sm text-white truncate">{repoName}</span>
              </div>
              <span className="text-xs text-[#808080]">Not a git repository</span>
            </div>
          )
        })}
      </div>
    )
  }

  const handleCommit = (paneId: string) => {
    if (commitMessage.trim()) {
      gitCommit(paneId, commitMessage.trim())
      setCommitMessage("")
      setShowCommitForm(null)
    }
  }

  return (
    <div className="flex shrink-0 flex-col gap-1 border-l border-[#353535] bg-[#161616] p-2 w-56 overflow-y-auto">
      <span className="text-[10px] text-[#808080] px-2 uppercase tracking-wider">Git</span>

      {repos.map(({ dir, paneWithDir, status }) => {
        if (!status?.is_repo) return null
        const repoName = dir.split(/[/\\]/).pop() || dir

        return (
          <div key={dir} className="rounded-lg border border-[#333333] bg-[#0C0C0C] overflow-hidden">
            {/* Repo header */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#1a1a1a]"
              onClick={() => paneWithDir && selectTab(paneWithDir.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#F0C674] shrink-0">
                <circle cx="12" cy="12" r="4"/>
                <line x1="1.05" y1="12" x2="7" y2="12"/>
                <line x1="17.01" y1="12" x2="22.96" y2="12"/>
              </svg>
              <span className="text-sm text-white truncate flex-1">{repoName}</span>
              <span className="text-xs text-[#58A6FF]">{status.branch || "no branch"}</span>
              {status.ahead !== null && status.behind !== null && (status.ahead > 0 || status.behind > 0) && (
                <span className="text-xs text-[#808080]">
                  {status.ahead > 0 && <span className="text-[#3FB950]">↑{status.ahead}</span>}
                  {status.behind > 0 && <span className="text-[#F85149]">↓{status.behind}</span>}
                </span>
              )}
            </div>

            {/* Staged changes */}
            {status.staged.length > 0 && (
              <div className="border-t border-[#333333]">
                <div className="px-3 py-1 text-[10px] text-[#3FB950] uppercase tracking-wider bg-[#0f1a0f]">
                  Staged ({status.staged.length})
                </div>
                {status.staged.slice(0, 5).map((file, i) => (
                  <div key={i} className="px-3 py-0.5 text-xs text-[#3FB950] truncate font-mono" title={file}>
                    + {file}
                  </div>
                ))}
                {status.staged.length > 5 && (
                  <div className="px-3 py-0.5 text-xs text-[#808080]">... and {status.staged.length - 5} more</div>
                )}
              </div>
            )}

            {/* Unstaged changes */}
            {status.unstaged.length > 0 && (
              <div className="border-t border-[#333333]">
                <div className="px-3 py-1 text-[10px] text-[#F85149] uppercase tracking-wider bg-[#1a0f0f]">
                  Modified ({status.unstaged.length})
                </div>
                {status.unstaged.slice(0, 5).map((file, i) => (
                  <div key={i} className="px-3 py-0.5 text-xs text-[#F85149] truncate font-mono" title={file}>
                    ~ {file}
                  </div>
                ))}
                {status.unstaged.length > 5 && (
                  <div className="px-3 py-0.5 text-xs text-[#808080]">... and {status.unstaged.length - 5} more</div>
                )}
              </div>
            )}

            {/* Untracked files */}
            {status.untracked.length > 0 && (
              <div className="border-t border-[#333333]">
                <div className="px-3 py-1 text-[10px] text-[#D29922] uppercase tracking-wider bg-[#1a1508]">
                  Untracked ({status.untracked.length})
                </div>
                {status.untracked.slice(0, 5).map((file, i) => (
                  <div key={i} className="px-3 py-0.5 text-xs text-[#D29922] truncate font-mono" title={file}>
                    ? {file}
                  </div>
                ))}
                {status.untracked.length > 5 && (
                  <div className="px-3 py-0.5 text-xs text-[#808080]">... and {status.untracked.length - 5} more</div>
                )}
              </div>
            )}

            {/* Commit form */}
            {showCommitForm === paneWithDir?.id ? (
              <div className="border-t border-[#333333] p-2">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message..."
                  className="w-full h-16 bg-[#0C0C0C] text-xs text-white placeholder-[#666] rounded px-2 py-1 resize-none outline-none focus:ring-1 focus:ring-[#52525B] border border-[#333333]"
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => handleCommit(paneWithDir.id)}
                    disabled={!commitMessage.trim()}
                    className="flex-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Commit
                  </button>
                  <button
                    onClick={() => { setShowCommitForm(null); setCommitMessage("") }}
                    className="flex-1 rounded bg-[#333333] hover:bg-[#444444] text-white text-xs py-1 px-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : status.staged.length > 0 ? (
              <div className="border-t border-[#333333] p-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCommitForm(paneWithDir?.id || null) }}
                  className="w-full rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs py-1.5 font-medium"
                >
                  Commit ({status.staged.length})
                </button>
              </div>
            ) : (
              <div className="border-t border-[#333333] px-3 py-2">
                <span className="text-xs text-[#808080]">No staged changes</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
