/**
 * Global Terminal Instance Registry
 *
 * Persists Terminal instances across React component unmounts/remounts.
 * This prevents terminal buffer loss when switching between TabBar/SplitPane
 * layouts or when rapid tab switching causes React to remount components.
 *
 * IMPORTANT: Never call terminal.dispose() in React cleanup functions.
 * Terminals are disposed ONLY when explicitly removed via removeTerminal().
 */

import { Terminal, ITerminalOptions } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"

export interface TerminalInstance {
  terminal: Terminal
  fitAddon: FitAddon
  paneId: string
  /** Whether the terminal's DOM element is currently attached */
  isAttached: boolean
  /** Custom key event handler registered on this terminal */
  keyHandler: ((arg: unknown) => boolean) | null
  /** Data handler disposable for cleanup */
  dataDisposable: import("@xterm/xterm").IDisposable | null
  /** Resize observer instance */
  resizeObserver: ResizeObserver | null
}

const terminalRegistry = new Map<string, TerminalInstance>()

const DEFAULT_TERMINAL_OPTIONS: Partial<ITerminalOptions> = {
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

/**
 * Get an existing terminal instance, or create a new one if none exists.
 * The terminal is NOT automatically opened to a DOM element.
 */
export function getOrCreateTerminal(
  paneId: string,
  cols: number,
  rows: number,
  options?: Partial<ITerminalOptions>
): TerminalInstance {
  const existing = terminalRegistry.get(paneId)
  if (existing) {
    // Update dimensions if changed
    existing.terminal.resize(cols, rows)
    return existing
  }

  const terminal = new Terminal({
    ...DEFAULT_TERMINAL_OPTIONS,
    ...options,
    cols,
    rows,
  })

  const fitAddon = new FitAddon()
  const webLinksAddon = new WebLinksAddon()

  terminal.loadAddon(fitAddon)
  terminal.loadAddon(webLinksAddon)

  const instance: TerminalInstance = {
    terminal,
    fitAddon,
    paneId,
    isAttached: false,
    keyHandler: null,
    dataDisposable: null,
    resizeObserver: null,
  }

  terminalRegistry.set(paneId, instance)
  return instance
}

/**
 * Get an existing terminal instance without creating a new one.
 */
export function getTerminal(paneId: string): TerminalInstance | undefined {
  return terminalRegistry.get(paneId)
}

/**
 * Check if a terminal exists for this paneId.
 */
export function hasTerminal(paneId: string): boolean {
  return terminalRegistry.has(paneId)
}

/**
 * Remove and dispose a terminal instance.
 * Call this when a pane is permanently destroyed (not just hidden).
 */
export function removeTerminal(paneId: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return

  // Disconnect resize observer if attached
  if (instance.resizeObserver) {
    instance.resizeObserver.disconnect()
    instance.resizeObserver = null
  }

  // Dispose the terminal
  instance.terminal.dispose()

  terminalRegistry.delete(paneId)
}

/**
 * Open the terminal to a DOM element.
 * Safe to call multiple times - only opens if not already attached.
 */
export function openTerminal(
  paneId: string,
  element: HTMLElement,
  options?: {
    onData?: (data: string) => void
    onResize?: (cols: number, rows: number) => void
  }
): TerminalInstance | null {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return null

  // If already attached to a different element, detach first
  if (instance.isAttached) {
    // Check if already attached to this element
    try {
      if (instance.terminal.element && element.contains(instance.terminal.element)) {
        // Already attached to this element, just refresh
        scheduleFitAndRefresh(instance)
        return instance
      }
    } catch {
      // DOM comparison failed, continue to reattach
    }
  }

  // Register data handler if provided
  if (options?.onData) {
    // Remove old handler if exists
    if (instance.dataDisposable) {
      instance.dataDisposable.dispose()
    }
    instance.dataDisposable = instance.terminal.onData(options.onData)
  }

  // Open terminal to element
  instance.terminal.open(element)
  instance.isAttached = true

  // Schedule fit and refresh after DOM is fully rendered
  scheduleFitAndRefresh(instance)

  return instance
}

/**
 * Schedule fit() and refresh() after a brief delay to ensure
 * the DOM element has actual dimensions (not 0x0).
 */
export function scheduleFitAndRefresh(instance: TerminalInstance): void {
  // Use requestAnimationFrame to wait for DOM paint
  requestAnimationFrame(() => {
    // Also add a small delay for cases where rAF isn't enough
    setTimeout(() => {
      try {
        instance.fitAddon.fit()
        // Force xterm to redraw the entire buffer
        instance.terminal.refresh(0, instance.terminal.rows - 1)
      } catch (e) {
        // Fit can fail if element has 0x0 dimensions - this is safe to ignore
        console.warn(`[TerminalRegistry] Fit failed for pane ${instance.paneId}:`, e)
      }
    }, 10)
  })
}

/**
 * Force a fit and refresh on an existing terminal.
 * Call this when the pane becomes visible after being hidden.
 */
export function refitTerminal(paneId: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return
  scheduleFitAndRefresh(instance)
}

/**
 * Update the data handler for a terminal.
 */
export function setTerminalDataHandler(paneId: string, handler: (data: string) => void): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return

  // Remove old handler if exists
  if (instance.dataDisposable) {
    instance.dataDisposable.dispose()
  }

  instance.dataDisposable = instance.terminal.onData(handler)
}

/**
 * Set a custom key event handler on a terminal.
 */
export function setTerminalKeyHandler(
  paneId: string,
  handler: (arg: unknown) => boolean
): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return

  instance.keyHandler = handler
  instance.terminal.attachCustomKeyEventHandler(handler)
}

/**
 * Get the resize observer callback factory for a pane.
 * Returns a function suitable for ResizeObserver.observe().
 */
export function createResizeObserverCallback(
  paneId: string,
  onResize: (cols: number, rows: number) => void
): (element: Element) => void {
  return (element: Element) => {
    const instance = terminalRegistry.get(paneId)
    if (!instance) return

    // Create or reuse ResizeObserver
    if (!instance.resizeObserver) {
      const lastDims = { cols: 0, rows: 0 }

      instance.resizeObserver = new ResizeObserver(() => {
        try {
          const dims = instance.fitAddon.proposeDimensions()
          if (!dims) return

          // Only resize if dimensions actually changed
          if (lastDims.cols === dims.cols && lastDims.rows === dims.rows) {
            return
          }

          lastDims.cols = dims.cols
          lastDims.rows = dims.rows

          // Debounced fit
          setTimeout(() => {
            try {
              instance.fitAddon.fit()
              instance.terminal.refresh(0, instance.terminal.rows - 1)
              onResize(dims.cols, dims.rows)
            } catch (e) {
              // Ignore fit failures during rapid resize
            }
          }, 50)
        } catch (e) {
          // Ignore resize observation errors
        }
      })
    }

    instance.resizeObserver.observe(element)
  }
}

/**
 * Disconnect the resize observer for a pane without disposing the terminal.
 * Call this on component unmount to stop resize observation while keeping the terminal alive.
 */
export function disconnectResizeObserver(paneId: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance || !instance.resizeObserver) return

  instance.resizeObserver.disconnect()
}

/**
 * Write data to a terminal's PTY process input.
 */
export function writeToTerminal(paneId: string, data: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return
  instance.terminal.write(data)
}

/**
 * Get all registered pane IDs.
 */
export function getRegisteredPaneIds(): string[] {
  return Array.from(terminalRegistry.keys())
}
