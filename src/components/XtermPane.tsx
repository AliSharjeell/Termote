"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { PaneTitleBar } from "./PaneTitleBar"
import {
  getOrCreateTerminal,
  openTerminal,
  removeTerminal,
  disconnectResizeObserver,
  createResizeObserverCallback,
  scheduleFitAndRefresh,
  type TerminalInstance,
} from "@/lib/terminalRegistry"
import type { Pane } from "@/lib/types"

interface XtermPaneProps {
  pane: Pane
}

export function XtermPane({ pane }: XtermPaneProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<TerminalInstance | null>(null)
  const resizeObserverCallbackRef = useRef<((element: Element) => void) | null>(null)
  const isMountedRef = useRef(false)

  // Use refs for handlers to avoid recreating callbacks on every render
  const sendInputRef = useRef(usePaneStore.getState().sendInput)
  const sendResizeRef = useRef(usePaneStore.getState().sendResize)

  // Keep refs in sync with store state
  const { killPane, renamePane, togglePin, uploadFile, aiCommand } = usePaneStore()
  const [isDragOver, setIsDragOver] = useState(false)

  // Smart Clipboard: Ctrl+C = Copy if text selected, SIGINT if not
  const getKeyHandler = useCallback(
    (terminal: import("@xterm/xterm").Terminal) => {
      return (arg: unknown) => {
        const keyEvent = arg as { type: string; ctrlKey: boolean; code: string }
        // Only handle keydown events
        if (keyEvent.type !== "keydown") return true

        // Handle Ctrl+C (Copy vs SIGINT)
        if (keyEvent.ctrlKey && keyEvent.code === "KeyC") {
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
      }
    },
    []
  )

  const handleData = useCallback(
    (data: string) => {
      sendInputRef.current(pane.id, data)
    },
    [pane.id]
  )

  const handleResize = useCallback(
    (cols: number, rows: number) => {
      sendResizeRef.current(pane.id, cols, rows)
    },
    [pane.id]
  )

  // Initialize or reuse terminal on mount
  useEffect(() => {
    if (!terminalRef.current) return
    isMountedRef.current = true

    // Get or create terminal from registry
    const instance = getOrCreateTerminal(pane.id, pane.cols, pane.rows)

    // Store ref for use in event listeners
    terminalInstanceRef.current = instance

    // Set up key handler if not already set
    if (!instance.keyHandler) {
      instance.terminal.attachCustomKeyEventHandler(getKeyHandler(instance.terminal))
    }

    // Open terminal to DOM element
    openTerminal(pane.id, terminalRef.current, {
      onData: handleData,
      onResize: handleResize,
    })

    // Create and attach ResizeObserver
    resizeObserverCallbackRef.current = createResizeObserverCallback(pane.id, handleResize)
    resizeObserverCallbackRef.current(terminalRef.current)

    // Send initial resize
    const dims = instance.fitAddon.proposeDimensions() || { cols: instance.terminal.cols, rows: instance.terminal.rows }
    sendResizeRef.current(pane.id, dims.cols, dims.rows)

    return () => {
      isMountedRef.current = false
      // DO NOT dispose the terminal on unmount!
      // Just disconnect the resize observer - the terminal stays alive in the registry
      disconnectResizeObserver(pane.id)
    }
  }, [pane.id, pane.cols, pane.rows, handleData, handleResize, getKeyHandler])

  // Listen for output events from backend
  useEffect(() => {
    const handleOutput = (event: CustomEvent<{ paneId: string; data: string }>) => {
      if (event.detail.paneId === pane.id && terminalInstanceRef.current) {
        terminalInstanceRef.current.terminal.write(event.detail.data)
      }
    }

    window.addEventListener("terminal-output", handleOutput as EventListener)
    return () => {
      window.removeEventListener("terminal-output", handleOutput as EventListener)
    }
  }, [pane.id])

  // Re-fit terminal when pane becomes visible (handles TabBar visibility toggle)
  useEffect(() => {
    if (!terminalRef.current) return

    // Use MutationObserver to detect visibility changes (opacity/class changes)
    const observer = new MutationObserver(() => {
      if (isMountedRef.current && terminalInstanceRef.current) {
        const instance = terminalInstanceRef.current
        // Directly trigger fit and refresh
        try {
          instance.fitAddon.fit()
          instance.terminal.refresh(0, instance.terminal.rows - 1)
        } catch (e) {
          // Ignore fit failures
        }
      }
    })

    observer.observe(terminalRef.current, { attributes: true, attributeFilter: ["style", "class"] })

    return () => {
      observer.disconnect()
    }
  }, [pane.id])

  // Handle pane close - actually dispose and remove the terminal
  const handleClose = useCallback(() => {
    // Remove terminal from registry (this disposes it)
    removeTerminal(pane.id)
    // Tell backend to kill the pane
    killPane(pane.id)
  }, [pane.id, killPane])

  const handleRename = useCallback(
    (newName: string) => {
      renamePane(pane.id, newName)
    },
    [pane.id, renamePane]
  )

  const handlePin = useCallback(() => {
    togglePin(pane.id)
  }, [pane.id, togglePin])

  const handleLaunchAI = useCallback(() => {
    sendInputRef.current(pane.id, `${aiCommand}\r`)
  }, [pane.id, aiCommand])

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      for (const file of files) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          // Remove the data URL prefix
          const base64Data = base64.split(",")[1] || base64
          uploadFile(pane.id, file.name, base64Data)
        }
        reader.readAsDataURL(file)
      }
    },
    [pane.id, uploadFile]
  )

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
