"use client"

import { useEffect, useRef, useCallback } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneControls } from "./PaneControls"
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
  scrollback: 10000,
}

export function XtermPane({ pane }: XtermPaneProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const { sendInput, sendResize, killPane } = usePaneStore()

  const handleData = useCallback(
    (data: string) => {
      sendInput(pane.id, data)
    },
    [pane.id, sendInput]
  )

  const handleResize = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit()
      const { cols, rows } = fitAddonRef.current.proposeDimensions() || {
        cols: pane.cols,
        rows: pane.rows,
      }
      sendResize(pane.id, cols, rows)
    }
  }, [pane.id, pane.cols, pane.rows, sendResize])

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return

    const terminal = new Terminal({
      ...terminalOptions,
      cols: pane.cols,
      rows: pane.rows,
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
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

    // Send initial resize
    sendResize(pane.id, terminal.cols, terminal.rows)

    return () => {
      terminal.dispose()
      resizeObserverRef.current?.disconnect()
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

  return (
    <div className="relative h-full w-full bg-[#0C0C0C]">
      <div
        ref={terminalRef}
        className="h-full w-full"
        style={{ padding: "8px" }}
      />
      <PaneControls onClose={handleClose} />
    </div>
  )
}
