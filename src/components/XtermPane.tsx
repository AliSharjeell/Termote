"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import type { Pane } from "@/lib/types"

interface XtermPaneProps {
  pane: Pane
}

const terminalOptions = {
  fontFamily: "'Cascadia Code', Consolas, monospace",
  fontSize: 14,
  theme: {
    background: "#0C0C0C",
    foreground: "#CCCCCC",
    cursor: "#CCCCCC",
    black: "#0C0C0C",
    brightBlack: "#535055",
    red: "#C50F1F",
    brightRed: "#E74856",
    green: "#13A10E",
    brightGreen: "#16C60C",
    yellow: "#C19C00",
    brightYellow: "#DCDCAA",
    blue: "#0037DA",
    brightBlue: "#3B78FF",
    magenta: "#881798",
    brightMagenta: "#B4009E",
    cyan: "#3A96DD",
    brightCyan: "#61D6D6",
    white: "#CCCCCC",
    brightWhite: "#FFFFFF",
  },
  cursorStyle: "block" as const,
  cursorBlink: true,
  scrollback: 100000,
}

export function XtermPane({ pane }: XtermPaneProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const lastSentDimsRef = useRef<{ cols: number; rows: number } | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isResizingRef = useRef<boolean>(false)

  const { sendInput, sendResize, killPane, renamePane, togglePin, uploadFile, aiCommand } = usePaneStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleData = useCallback(
    (data: string) => {
      sendInput(pane.id, data)
    },
    [pane.id, sendInput]
  )

  const handleResize = useCallback(() => {
    // Break the ResizeObserver loop: if already resizing, don't recurse
    if (isResizingRef.current) {
      return
    }

    if (fitAddonRef.current) {
      const dims = fitAddonRef.current.proposeDimensions()
      if (!dims) return

      // Only resize if dimensions actually changed
      if (lastSentDimsRef.current &&
          lastSentDimsRef.current.cols === dims.cols &&
          lastSentDimsRef.current.rows === dims.rows) {
        return
      }

      // Debounce resize requests
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      resizeTimeoutRef.current = setTimeout(() => {
        if (fitAddonRef.current) {
          // Set flag to prevent ResizeObserver feedback loop
          isResizingRef.current = true
          fitAddonRef.current.fit()
          isResizingRef.current = false

          lastSentDimsRef.current = { cols: dims.cols, rows: dims.rows }
          sendResize(pane.id, dims.cols, dims.rows)
        }
      }, 200)
    }
  }, [pane.id, sendResize])

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return

    const terminal = new Terminal({
      ...terminalOptions,
      cols: pane.cols,
      rows: pane.rows,
    })
    const fitAddon = new FitAddon()

    // Smart Clipboard: Ctrl+C = Copy if text selected, SIGINT if not
    terminal.attachCustomKeyEventHandler((arg) => {
      // Only handle keydown events
      if (arg.type !== "keydown") return true

      // Handle Ctrl+C (Copy vs SIGINT)
      if (arg.ctrlKey && arg.code === "KeyC") {
        const selection = terminal.getSelection()
        if (selection) {
          // Text is highlighted: Copy to clipboard and prevent SIGINT
          navigator.clipboard.writeText(selection)
          return false
        }
        // No text highlighted: Let it pass through to send SIGINT to the backend
        return true
      }

      // Let xterm handle Ctrl+V naturally via onData - don't intercept
      return true
    })

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(new WebLinksAddon())
    terminal.open(terminalRef.current)
    fitAddon.fit()

    terminalInstanceRef.current = terminal
    fitAddonRef.current = fitAddon

    // Handle data input
    terminal.onData(handleData)

    // Handle resize with ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserverRef.current.observe(terminalRef.current!)

    // Send initial resize with actual dimensions
    const initialDims = fitAddon.proposeDimensions() || { cols: terminal.cols, rows: terminal.rows }
    lastSentDimsRef.current = initialDims
    sendResize(pane.id, initialDims.cols, initialDims.rows)

    return () => {
      terminal.dispose()
      resizeObserverRef.current?.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      isResizingRef.current = false
    }
  }, [pane.id, handleData, handleResize, sendResize])

  // Listen for output events
  useEffect(() => {
    const handleOutput = (event: CustomEvent<{ paneId: string; data: string }>) => {
      if (event.detail.paneId === pane.id && terminalInstanceRef.current) {
        terminalInstanceRef.current.write(event.detail.data)
      }
    }

    window.addEventListener("terminal-output", handleOutput as EventListener)
    return () => {
      window.removeEventListener("terminal-output", handleOutput as EventListener)
    }
  }, [pane.id])

  const handleClose = useCallback(() => {
    killPane(pane.id)
  }, [pane.id, killPane])

  const handleRename = useCallback((newName: string) => {
    renamePane(pane.id, newName)
  }, [pane.id, renamePane])

  const handlePin = useCallback(() => {
    togglePin(pane.id)
  }, [pane.id, togglePin])

  const handleLaunchAI = useCallback(() => {
    sendInput(pane.id, `${aiCommand}\r`)
  }, [pane.id, aiCommand, sendInput])

  // Drag and drop handlers for file transfer
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set false if we're leaving the terminal div itself
    if (e.currentTarget === e.target) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        // Remove the data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64Data = base64.split(",")[1] || base64
        uploadFile(pane.id, file.name, base64Data)
      }
      reader.readAsDataURL(file)
    }
  }, [pane.id, uploadFile])

  return (
    <div className="relative flex h-full w-full flex-col bg-[#0C0C0C]">
      <PaneTitleBar
        title={pane.name}
        paneId={pane.id}
        pinned={pane.pinned}
        groupId={pane.groupId}
        onRename={handleRename}
        onClose={handleClose}
        onPin={handlePin}
        onLaunchAI={handleLaunchAI}
      />
      <div
        ref={terminalRef}
        className={`flex-1 overflow-hidden relative ${isDragOver ? "ring-2 ring-blue-500 ring-inset" : ""}`}
        style={{ padding: "8px" }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 z-50 pointer-events-none">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
              Drop file to upload
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
