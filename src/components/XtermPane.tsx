"use client"

import { useEffect, useRef, useCallback } from "react"
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

  const { sendInput, sendResize, killPane, renamePane, togglePin } = usePaneStore()

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
      />
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ padding: "8px" }}
      />
    </div>
  )
}
