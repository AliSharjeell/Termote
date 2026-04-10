"use client"

import { usePaneStore } from "@/hooks/usePaneStore"

export function GitPane() {
  const { panes, activePanes, selectedGroupId, selectTab } = usePaneStore()

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

  if (gitDirs.length === 0) return null

  return (
    <div className="flex shrink-0 flex-col gap-1 border-l border-[#353535] bg-[#161616] p-2 w-48">
      <span className="text-[10px] text-[#808080] px-2 uppercase tracking-wider">Git</span>
      {gitDirs.map((dir) => {
        const repoName = dir.split(/[/\\]/).pop() || dir
        const paneWithDir = viewPanes.find(p => p.cwd === dir)
        return (
          <button
            key={dir}
            onClick={() => paneWithDir && selectTab(paneWithDir.id)}
            className="w-full rounded-lg px-3 py-2 text-sm border border-[#333333] text-left flex items-center gap-2 text-white hover:bg-[#333333] hover:border-[#444444]"
            title={dir}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0C674] shrink-0">
              <circle cx="12" cy="12" r="4"/>
              <line x1="1.05" y1="12" x2="7" y2="12"/>
              <line x1="17.01" y1="12" x2="22.96" y2="12"/>
            </svg>
            <span className="truncate">{repoName}</span>
          </button>
        )
      })}
    </div>
  )
}