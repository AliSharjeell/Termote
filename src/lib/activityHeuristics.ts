import { usePaneStore } from "@/hooks/usePaneStore"
import { isNotificationActivityStatus } from "@/lib/activityStatus"
import type { PaneActivityState } from "@/lib/types"

type ActivityKind = "unknown" | "agent" | "server" | "build" | "command"

interface PaneRuntime {
  buffer: string
  inputBuffer: string
  kind: ActivityKind
  lastOutputAt: number
  startedAt: number
}

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

const paneRuntimes = new Map<string, PaneRuntime>()
const debounceTimers = new Map<string, number>()

const AI_COMMANDS = new Set([
  "claude",
  "claude-code",
  "codex",
  "antigravity",
  "antigravity-cli",
  "agy",
  "opencode",
  "aider",
  "gemini",
])

const serverCommandPatterns = [
  /^npm(?:\.cmd)?\s+(?:run\s+)?(?:dev|start|serve)\b/i,
  /^pnpm(?:\.cmd)?\s+(?:run\s+)?(?:dev|start|serve)\b/i,
  /^yarn(?:\.cmd)?\s+(?:run\s+)?(?:dev|start|serve)\b/i,
  /^bun(?:\.cmd)?\s+(?:run\s+)?(?:dev|start|serve)\b/i,
  /^next(?:\.cmd)?\s+dev\b/i,
  /^vite(?:\.cmd)?\b/i,
  /^cargo(?:\.exe)?\s+run\b/i,
  /^python(?:\.exe)?\s+manage\.py\s+runserver\b/i,
  /^uvicorn\b/i,
  /^fastapi\b/i,
  /^flask\b/i,
  /^rails\s+server\b/i,
]

const buildCommandPatterns = [
  /^npm(?:\.cmd)?\s+run\s+(?:build|test|check|lint)\b/i,
  /^pnpm(?:\.cmd)?\s+(?:build|test|check|lint)\b/i,
  /^yarn(?:\.cmd)?\s+(?:build|test|check|lint)\b/i,
  /^bun(?:\.cmd)?\s+(?:build|test|check|lint)\b/i,
  /^cargo(?:\.exe)?\s+(?:build|check|test)\b/i,
  /^pytest\b/i,
  /^go\s+test\b/i,
]

const crashPatterns = [
  /\bpanic:/i,
  /traceback \(most recent call last\):/i,
  /\buncaught\b/i,
  /segmentation fault/i,
  /exited with (?:code|status)\s*[1-9]/i,
  /exit code\s*[1-9]/i,
  /\bnpm ERR!/i,
  /\bELIFECYCLE\b/i,
  /failed to (?:start|compile|listen|bind)/i,
  /address already in use/i,
  /\bEADDRINUSE\b/i,
]

const promptRequestPatterns = [
  /\([Yy]\/[Nn]\)/,
  /\([Yy]es\/[Nn]o\)/,
  /\b(?:approve|allow|confirm|continue|permission|proceed|select|choose|enter|press enter)\b/i,
  /\bdo you want\b/i,
  /\bwould you like\b/i,
  /\bneeds? input\b/i,
]

function getRuntime(paneId: string): PaneRuntime {
  const existing = paneRuntimes.get(paneId)
  if (existing) return existing

  const runtime: PaneRuntime = {
    buffer: "",
    inputBuffer: "",
    kind: "unknown",
    lastOutputAt: 0,
    startedAt: 0,
  }
  paneRuntimes.set(paneId, runtime)
  return runtime
}

function playBeep(type: "input" | "done" | "crashed") {
  const store = usePaneStore.getState()
  if (!store.soundEnabled) return
  if (typeof window === "undefined") return

  const audioWindow = window as AudioContextWindow
  const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextCtor) return

  try {
    const ctx = new AudioContextCtor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "crashed") {
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
      return
    }

    osc.type = "sine"
    osc.frequency.setValueAtTime(type === "done" ? 600 : 800, ctx.currentTime)
    if (type === "done") {
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1)
    }
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch (error) {
    console.error("[Termote] Audio playback failed:", error)
  }
}

function notifyForStatus(status: PaneActivityState) {
  if (status === "needs_input") {
    playBeep("input")
  } else if (status === "done") {
    playBeep("done")
  } else if (status === "crashed") {
    playBeep("crashed")
  }
}

function setPaneActivity(paneId: string, status: PaneActivityState) {
  const store = usePaneStore.getState()
  const previousStatus = store.paneActivities[paneId] ?? "idle"
  if (previousStatus === status) return

  store.setPaneActivity(paneId, status)
  if (isNotificationActivityStatus(status)) {
    notifyForStatus(status)
  }
}

function classifyCommand(command: string): ActivityKind {
  const normalized = command.trim().replace(/^\s*[&.]\s+/, "")
  if (!normalized) return "unknown"

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.replace(/^["']|["']$/g, "").toLowerCase())

  if (tokens.some((token) => AI_COMMANDS.has(token.replace(/\.(cmd|exe)$/i, "")))) {
    return "agent"
  }

  if (serverCommandPatterns.some((pattern) => pattern.test(normalized))) {
    return "server"
  }

  if (buildCommandPatterns.some((pattern) => pattern.test(normalized))) {
    return "build"
  }

  return "command"
}

function beginCommand(paneId: string, command: string) {
  const trimmedCommand = command.trim()
  if (!trimmedCommand) return

  const runtime = getRuntime(paneId)
  runtime.kind = classifyCommand(trimmedCommand)
  runtime.startedAt = Date.now()
  setPaneActivity(paneId, "running")
}

function appendInput(paneId: string, data: string) {
  const runtime = getRuntime(paneId)

  for (const char of data) {
    if (char === "\x03") {
      runtime.kind = "unknown"
      runtime.inputBuffer = ""
      setPaneActivity(paneId, "idle")
      continue
    }

    if (char === "\r" || char === "\n") {
      beginCommand(paneId, runtime.inputBuffer)
      runtime.inputBuffer = ""
      continue
    }

    if (char === "\b" || char === "\x7f") {
      runtime.inputBuffer = runtime.inputBuffer.slice(0, -1)
      continue
    }

    if (char >= " " && char !== "\x1b") {
      runtime.inputBuffer += char
    }
  }
}

function stripAnsi(data: string): string {
  return data
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g, "")
    .replace(/\r/g, "\n")
}

function getLastMeaningfulLine(cleanBuffer: string): string {
  const lines = cleanBuffer
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)

  return lines.at(-1) ?? ""
}

function looksLikeShellPrompt(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  return (
    /^PS\s+[A-Z]:\\.*>\s*$/i.test(trimmed) ||
    /^[A-Z]:\\.*>\s*$/i.test(trimmed) ||
    /^[^@\s]+@[^:\s]+:.*[$#%]\s*$/.test(trimmed) ||
    /^[$#%]\s*$/.test(trimmed)
  )
}

function looksLikeAiInputPrompt(runtime: PaneRuntime, line: string, cleanBuffer: string): boolean {
  if (runtime.kind !== "agent") return false

  const trimmed = line.trim()
  if (/^(?:>|\u203a|\u276f)\s*$/u.test(trimmed)) return true
  if (trimmed.endsWith("?")) return true

  return promptRequestPatterns.some((pattern) => pattern.test(trimmed) || pattern.test(cleanBuffer))
}

function hasCrashSignal(cleanBuffer: string): boolean {
  return crashPatterns.some((pattern) => pattern.test(cleanBuffer))
}

function looksLikeServerStillRunning(cleanBuffer: string): boolean {
  return /(?:localhost|127\.0\.0\.1|listening|server running|ready in|compiled successfully|started server|webpack compiled|vite v)/i.test(cleanBuffer)
}

function shouldNotifyDone(runtime: PaneRuntime, cleanBuffer: string): boolean {
  const elapsed = Date.now() - runtime.startedAt
  if (runtime.kind === "agent" || runtime.kind === "build") return true
  if (runtime.kind === "server") return false
  return elapsed > 5000 && /\b(?:done|success|completed|finished)\b/i.test(cleanBuffer)
}

function clearRuntimeCommand(runtime: PaneRuntime) {
  runtime.kind = "unknown"
  runtime.startedAt = 0
}

function analyzeTerminalBuffer(paneId: string) {
  const runtime = getRuntime(paneId)
  if (!runtime.buffer) return

  const cleanBuffer = stripAnsi(runtime.buffer)
  const lastLine = getLastMeaningfulLine(cleanBuffer)
  const hasPrompt = looksLikeShellPrompt(lastLine)
  const hasCrash = hasCrashSignal(cleanBuffer)

  if (hasCrash) {
    clearRuntimeCommand(runtime)
    setPaneActivity(paneId, "crashed")
    return
  }

  if (looksLikeAiInputPrompt(runtime, lastLine, cleanBuffer)) {
    setPaneActivity(paneId, "needs_input")
    return
  }

  if (hasPrompt) {
    if (runtime.kind === "server") {
      clearRuntimeCommand(runtime)
      setPaneActivity(paneId, "crashed")
      return
    }

    if (shouldNotifyDone(runtime, cleanBuffer)) {
      clearRuntimeCommand(runtime)
      setPaneActivity(paneId, "done")
      return
    }

    clearRuntimeCommand(runtime)
    setPaneActivity(paneId, "idle")
    return
  }

  if (runtime.kind === "agent" || runtime.kind === "build" || runtime.kind === "server" || looksLikeServerStillRunning(cleanBuffer)) {
    setPaneActivity(paneId, "running")
    return
  }

  const timeSinceOutput = Date.now() - runtime.lastOutputAt
  if (timeSinceOutput > 5000) {
    setPaneActivity(paneId, "idle")
    return
  }

  const timer = window.setTimeout(() => {
    debounceTimers.delete(paneId)
    analyzeTerminalBuffer(paneId)
  }, 5000 - timeSinceOutput)

  debounceTimers.set(paneId, timer)
}

export function handleTerminalInput(paneId: string, data: string) {
  appendInput(paneId, data)
}

export function handleTerminalOutput(paneId: string, data: string) {
  const runtime = getRuntime(paneId)
  runtime.buffer = `${runtime.buffer}${data}`.slice(-4000)
  runtime.lastOutputAt = Date.now()

  const currentStatus = usePaneStore.getState().paneActivities[paneId] ?? "idle"
  if (currentStatus !== "crashed") {
    setPaneActivity(paneId, "running")
  }

  const previousTimer = debounceTimers.get(paneId)
  if (previousTimer != null) {
    window.clearTimeout(previousTimer)
  }

  const timer = window.setTimeout(() => {
    debounceTimers.delete(paneId)
    analyzeTerminalBuffer(paneId)
  }, 1200)

  debounceTimers.set(paneId, timer)
}

export function clearPaneActivity(paneId: string) {
  const store = usePaneStore.getState()
  if ((store.paneActivities[paneId] ?? "idle") !== "idle") {
    store.setPaneActivity(paneId, "idle")
  }
}

export function notifySystemActivity(
  id: string,
  name: string,
  state: Exclude<PaneActivityState, "idle">,
  detail?: string
) {
  const store = usePaneStore.getState()
  const previousStatus = store.systemActivities[id]?.state ?? "idle"

  store.setSystemActivity({
    id,
    name,
    state,
    detail,
    updatedAt: Date.now(),
  })

  if (previousStatus !== state && isNotificationActivityStatus(state)) {
    notifyForStatus(state)
  }
}

export function clearSystemActivity(id: string) {
  usePaneStore.getState().clearSystemActivity(id)
}
