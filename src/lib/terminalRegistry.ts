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
  /** React container currently owning the terminal DOM */
  containerElement: HTMLElement | null
  /** Custom key event handler registered on this terminal */
  keyHandler: ((arg: unknown) => boolean) | null
  /** Data handler disposable for cleanup */
  dataDisposable: import("@xterm/xterm").IDisposable | null
  /** Resize observer instance */
  resizeObserver: ResizeObserver | null
  /** Last fitted dimensions to avoid redundant resize calls */
  lastDims: { cols: number; rows: number }
  /** Fit request animation frame ID */
  fitRafId: number | null
}

const terminalRegistry = new Map<string, TerminalInstance>()
const pendingOutput = new Map<string, string>()
const MAX_PENDING_OUTPUT_LENGTH = 5_000_000

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

function isContainerVisible(container: HTMLElement): boolean {
  const rect = container.getBoundingClientRect()
  if (rect.width < 20 || rect.height < 20) return false

  const style = getComputedStyle(container)
  if (style.display === "none") return false
  if (style.visibility === "hidden") return false
  if (parseFloat(style.opacity) === 0) return false

  return true
}

function fitTerminalInternal(instance: TerminalInstance, reason: string): boolean {
  const container = instance.containerElement ?? instance.terminal.element?.parentElement
  if (!container) return false

  if (!isContainerVisible(container)) {
    return false
  }

  const rect = container.getBoundingClientRect()
  if (rect.width < 20 || rect.height < 20) {
    return false
  }

  try {
    instance.fitAddon.fit()
    const cols = instance.terminal.cols
    const rows = instance.terminal.rows

    if (!cols || !rows || cols < 2 || rows < 2) {
      return false
    }

    const last = instance.lastDims
    const changed = last.cols !== cols || last.rows !== rows

    if (changed) {
      instance.lastDims = { cols, rows }
      console.log(`[TERMINAL FIT] ${instance.paneId} cols=${cols} rows=${rows} reason=${reason}`)
      return true
    }

    return true
  } catch (error) {
    console.error(`[TERMINAL FIT] ${instance.paneId} failed:`, error)
    return false
  }
}

/**
 * Schedule a fit on the next animation frame.
 * Debounces multiple rapid fit requests.
 */
function scheduleFitOnInstance(instance: TerminalInstance, reason: string) {
  if (instance.fitRafId !== null) {
    cancelAnimationFrame(instance.fitRafId)
  }

  instance.fitRafId = requestAnimationFrame(() => {
    instance.fitRafId = null
    fitTerminalInternal(instance, reason)
  })
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
    containerElement: null,
    keyHandler: null,
    dataDisposable: null,
    resizeObserver: null,
    lastDims: { cols: 0, rows: 0 },
    fitRafId: null,
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

function appendPendingOutput(paneId: string, data: string): void {
  const existing = pendingOutput.get(paneId) ?? ""
  const next = existing + data
  pendingOutput.set(
    paneId,
    next.length > MAX_PENDING_OUTPUT_LENGTH
      ? next.slice(next.length - MAX_PENDING_OUTPUT_LENGTH)
      : next
  )
}

export function writeOrBufferTerminalOutput(paneId: string, data: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) {
    appendPendingOutput(paneId, data)
    return
  }

  // Buffer output until terminal is properly sized
  if (!instance.containerElement || instance.lastDims.cols === 0) {
    appendPendingOutput(paneId, data)
    return
  }

  instance.terminal.write(data)
}

export function setTerminalScrollback(paneId: string, data: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) {
    pendingOutput.set(
      paneId,
      data.length > MAX_PENDING_OUTPUT_LENGTH
        ? data.slice(data.length - MAX_PENDING_OUTPUT_LENGTH)
        : data
    )
    return
  }

  instance.terminal.reset()
  if (data) {
    instance.terminal.write(data)
  }
  scheduleFitOnInstance(instance, "scrollback-restore")
}

export function drainBufferedTerminalOutput(paneId: string): void {
  const instance = terminalRegistry.get(paneId)
  const data = pendingOutput.get(paneId)
  if (!instance || !data) return

  pendingOutput.delete(paneId)
  instance.terminal.write(data)
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

  if (instance.fitRafId !== null) {
    cancelAnimationFrame(instance.fitRafId)
    instance.fitRafId = null
  }

  if (instance.resizeObserver) {
    instance.resizeObserver.disconnect()
    instance.resizeObserver = null
  }
  if (instance.dataDisposable) {
    instance.dataDisposable.dispose()
    instance.dataDisposable = null
  }

  instance.terminal.dispose()

  terminalRegistry.delete(paneId)
  pendingOutput.delete(paneId)
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

  // Register data handler if provided
  if (options?.onData) {
    if (instance.dataDisposable) {
      instance.dataDisposable.dispose()
    }
    instance.dataDisposable = instance.terminal.onData(options.onData)
  }

  const terminalElement = instance.terminal.element
  if (terminalElement) {
    if (!element.contains(terminalElement)) {
      element.replaceChildren(terminalElement)
    }
  } else {
    element.replaceChildren()
    instance.terminal.open(element)
  }

  instance.isAttached = true
  instance.containerElement = element

  // Setup mobile textarea attributes for better keyboard handling
  const textarea = element.querySelector("textarea")
  if (textarea) {
    textarea.setAttribute("autocomplete", "off")
    textarea.setAttribute("autocorrect", "off")
    textarea.setAttribute("autocapitalize", "off")
    textarea.setAttribute("spellcheck", "false")
    textarea.setAttribute("inputmode", "text")
  }

  scheduleFitOnInstance(instance, "terminal-open")

  return instance
}

/**
 * Schedule fit() and refresh() after a brief delay to ensure
 * the DOM element has actual dimensions (not 0x0).
 */
export function scheduleFitAndRefresh(instance: TerminalInstance, attempts = 8): void {
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (fitTerminalInternal(instance, `retry-${attempts}`)) {
        return
      }
      if (attempts > 0) {
        scheduleFitAndRefresh(instance, attempts - 1)
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
  scheduleFitOnInstance(instance, "refit-terminal")
}

/**
 * Fit a specific terminal by pane ID.
 */
export function fitTerminalByPaneId(paneId: string, reason: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return
  scheduleFitOnInstance(instance, reason)
}

/**
 * Fit ALL registered terminals. Call this after layout changes.
 */
export function fitAllTerminals(reason: string): void {
  for (const instance of terminalRegistry.values()) {
    scheduleFitOnInstance(instance, reason)
  }
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

    if (instance.resizeObserver) {
      instance.resizeObserver.disconnect()
    }

    instance.resizeObserver = new ResizeObserver(() => {
      if (!isContainerVisible(element as HTMLElement)) return

      const fitted = fitTerminalInternal(instance, `resize-observer-${paneId}`)
      if (fitted) {
        onResize(instance.lastDims.cols, instance.lastDims.rows)
      }
    })

    instance.resizeObserver.observe(element)
  }
}

/**
 * Disconnect the resize observer for a pane without disposing the terminal.
 */
export function disconnectResizeObserver(paneId: string): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return

  if (instance.resizeObserver) {
    instance.resizeObserver.disconnect()
  }
  instance.isAttached = false
  instance.containerElement = null
}

/**
 * Update the data handler for a terminal.
 */
export function setTerminalDataHandler(paneId: string, handler: (data: string) => void): void {
  const instance = terminalRegistry.get(paneId)
  if (!instance) return

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

/**
 * Register a global fit function for a pane ID.
 * Returns cleanup function.
 */
type GlobalFitFn = (reason: string) => void
const globalFitRegistry = new Map<string, GlobalFitFn>()

export function registerGlobalFit(paneId: string, fit: GlobalFitFn): () => void {
  globalFitRegistry.set(paneId, fit)
  return () => globalFitRegistry.delete(paneId)
}

export function fitTerminalById(paneId: string, reason: string): void {
  globalFitRegistry.get(paneId)?.(reason)
}

export function fitAllByGlobal(reason: string): void {
  for (const fit of globalFitRegistry.values()) {
    fit(reason)
  }
}

/**
 * Wait for fonts to load, then fit all terminals.
 */
export function fitAfterFontLoad(): void {
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      setTimeout(() => fitAllTerminals("fonts-ready"), 50)
    })
  }
}

/**
 * Setup visual viewport handler for mobile keyboard issues.
 * Returns cleanup function.
 */
export function setupVisualViewport(): () => void {
  if (typeof window === "undefined") return () => {}
  if (!window.visualViewport) return () => {}

  const vv = window.visualViewport

  function update() {
    document.documentElement.style.setProperty(
      "--visual-viewport-height",
      `${vv.height}px`
    )
    document.documentElement.style.setProperty(
      "--visual-viewport-offset",
      `${vv.offsetTop}px`
    )
    fitAllTerminals("visual-viewport")
  }

  vv.addEventListener("resize", update)
  vv.addEventListener("scroll", update)
  update()

  return () => {
    vv.removeEventListener("resize", update)
    vv.removeEventListener("scroll", update)
  }
}

/**
 * Setup window resize handler.
 * Returns cleanup function.
 */
export function setupWindowResizeHandler(): () => void {
  let rafId: number | null = null

  function handleResize() {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      fitAllTerminals("window-resize")
    })
  }

  window.addEventListener("resize", handleResize)

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    window.removeEventListener("resize", handleResize)
  }
}