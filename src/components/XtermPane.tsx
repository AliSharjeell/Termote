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
  drainBufferedTerminalOutput,
  scheduleFitAndRefresh,
  registerGlobalFit,
  fitAfterFontLoad,
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
  const unregisterGlobalFitRef = useRef<(() => void) | null>(null)
  const visibilityObserverRef = useRef<MutationObserver | null>(null)

  // Use refs for handlers to avoid recreating callbacks on every render
  const sendInputRef = useRef(usePaneStore.getState().sendInput)
  const sendResizeRef = useRef(usePaneStore.getState().sendResize)

  const { killPane, renamePane, togglePin, uploadFile, aiCommand } = usePaneStore()
  const [isDragOver, setIsDragOver] = useState(false)

  // Smart Clipboard: Ctrl+C = Copy if text selected, SIGINT if not
  const getKeyHandler = useCallback(
    (terminal: import("@xterm/xterm").Terminal) => {
      return (arg: unknown) => {
        const keyEvent = arg as { type: string; ctrlKey: boolean; code: string }
        if (keyEvent.type !== "keydown") return true

        if (keyEvent.ctrlKey && keyEvent.code === "KeyC") {
          const selection = terminal.getSelection()
          if (selection) {
            navigator.clipboard.writeText(selection)
            return false
          }
          return true
        }

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

  // Register global fit function for this pane
  const registerFit = useCallback(() => {
    if (unregisterGlobalFitRef.current) {
      unregisterGlobalFitRef.current()
    }
    unregisterGlobalFitRef.current = registerGlobalFit(pane.id, (reason: string) => {
      if (terminalInstanceRef.current) {
        scheduleFitAndRefresh(terminalInstanceRef.current)
      }
    })
  }, [pane.id])

  // Initialize terminal on mount - only once per pane.id
  useEffect(() => {
    if (!terminalRef.current) return
    isMountedRef.current = true

    const instance = getOrCreateTerminal(pane.id, 80, 24)
    terminalInstanceRef.current = instance

    if (!instance.keyHandler) {
      const keyHandler = getKeyHandler(instance.terminal)
      instance.terminal.attachCustomKeyEventHandler(keyHandler)
      instance.keyHandler = keyHandler
    }

    openTerminal(pane.id, terminalRef.current, {
      onData: handleData,
      onResize: handleResize,
    })
    drainBufferedTerminalOutput(pane.id)

    // Schedule multiple fits: immediate, 50ms, 250ms
    scheduleFitAndRefresh(instance)
    setTimeout(() => scheduleFitAndRefresh(instance), 50)
    setTimeout(() => scheduleFitAndRefresh(instance), 250)

    // Fit after fonts load
    fitAfterFontLoad()

    // Register global fit function
    registerFit()

    // Create and attach ResizeObserver
    resizeObserverCallbackRef.current = createResizeObserverCallback(pane.id, handleResize)
    resizeObserverCallbackRef.current(terminalRef.current)

    return () => {
      isMountedRef.current = false
      if (unregisterGlobalFitRef.current) {
        unregisterGlobalFitRef.current()
        unregisterGlobalFitRef.current = null
      }
      disconnectResizeObserver(pane.id)
    }
  }, [pane.id, handleData, handleResize, getKeyHandler, registerFit])

  // Observe visibility changes via MutationObserver
  useEffect(() => {
    if (!terminalRef.current) return

    visibilityObserverRef.current = new MutationObserver(() => {
      if (isMountedRef.current && terminalInstanceRef.current) {
        // Small delay to let CSS transition complete
        setTimeout(() => {
          if (terminalInstanceRef.current) {
            scheduleFitAndRefresh(terminalInstanceRef.current)
          }
        }, 50)
      }
    })

    visibilityObserverRef.current.observe(terminalRef.current, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: true,
    })

    return () => {
      if (visibilityObserverRef.current) {
        visibilityObserverRef.current.disconnect()
      }
    }
  }, [pane.id])

  // Re-fit on pane visibility (for TabBar inactive tabs)
  useEffect(() => {
    const el = terminalRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && terminalInstanceRef.current) {
          scheduleFitAndRefresh(terminalInstanceRef.current)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [pane.id])

  const handleClose = useCallback(() => {
    removeTerminal(pane.id)
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
          const base64Data = base64.split(",")[1] || base64
          uploadFile(pane.id, file.name, base64Data)
        }
        reader.readAsDataURL(file)
      }
    },
    [pane.id, uploadFile]
  )

  return (
    <div className="terminal-pane-root relative flex h-full w-full flex-col bg-[#0C0C0C]">
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
        className={`terminal-container flex-1 overflow-hidden relative ${isDragOver ? "ring-2 ring-blue-500 ring-inset" : ""}`}
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