"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useState, useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
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
    setLazygitTerminal,
    removeLazygitTerminal,
    spawnLazygit,
  } = usePaneStore()

  const [isScanning, setIsScanning] = useState(false)
  // Sidebar mode: "list" or "lazygit"
  const [sidebarMode, setSidebarMode] = useState<"list" | "lazygit">("list")
  // Which pane/label is selected to show in lazygit view
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  // Ref for the embedded xterm container in the sidebar
  const xtermRef = useRef<HTMLDivElement>(null)
  // The sentinel key used for the sidebar embedded lazygit terminal
  const sidebarTerminalPaneRef = useRef<string | null>(null)

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
        branch: repoInfo?.branch || null,
      }
    })

  const visibleItems = gitPaneItems.filter(i => i.isRepo)

  const handleSelectItem = (item: GitPaneItem) => {
    if (!item.isRepo) return
    setSelectedLabel(item.cwd)
    setSidebarMode("lazygit")

    // Clear previous xterm content
    if (xtermRef.current) {
      xtermRef.current.innerHTML = ""
    }

    // Spawn lazygit — backend creates a new pane with a fresh UUID
    // We use item.paneId as a sentinel; the backend ignores it
    console.log("[SourceControlPane] Spawning lazygit for:", item.cwd)
    spawnLazygit(item.paneId, item.cwd)

    // Create an embedded xterm terminal for the lazygit output
    // The backend will send output from a pane whose ID we don't know yet,
    // so we'll match by listening for ALL pane output and routing to our terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 11,
      fontFamily: "monospace",
      theme: {
        background: "#0d0d0d",
        foreground: "#cccccc",
        cursor: "#cccccc",
      },
      scrollback: 1000,
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    // Store with a sentinel key — the event listener will route all output here
    setLazygitTerminal("lazygit", terminal)
    sidebarTerminalPaneRef.current = "lazygit"

    // Open terminal in the ref element after paint
    requestAnimationFrame(() => {
      if (xtermRef.current) {
        terminal.open(xtermRef.current)
        fitAddon.fit()
      }
    })
  }

  const handleBack = () => {
    removeLazygitTerminal("lazygit")
    if (xtermRef.current) {
      xtermRef.current.innerHTML = ""
    }
    sidebarTerminalPaneRef.current = null
    setSidebarMode("list")
    setSelectedLabel(null)
  }

  // Listen for PTY output from ALL panes and route to the embedded lazygit terminal.
  // The backend's spawn_lazygit creates a new pane with a fresh UUID we can't predict,
  // so we capture ALL output and display it in the embedded sidebar terminal.
  useEffect(() => {
    if (sidebarMode !== "lazygit") return

    const handleOutput = (e: Event) => {
      const customEvent = e as CustomEvent<{ paneId: string; data: string }>
      const instance = usePaneStore.getState().lazygitTerminals["lazygit"]
      if (instance) {
        instance.terminal.write(customEvent.detail.data)
      }
    }

    window.addEventListener("terminal-output", handleOutput)
    return () => window.removeEventListener("terminal-output", handleOutput)
  }, [sidebarMode])

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

        {/* Lazygit view — embedded xterm terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedLabel && (
            <div className="px-3 py-2 border-b border-[#252525]">
              <div className="text-[10px] text-[#CCCCCC] truncate" title={selectedLabel}>
                {selectedLabel.split(/[/\\]/).pop()}
              </div>
              <div className="text-[9px] text-[#666]">Lazygit</div>
            </div>
          )}
          {/* Embedded xterm for lazygit output */}
          <div ref={xtermRef} className="flex-1 overflow-hidden p-1" />
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