import { usePaneStore } from "@/hooks/usePaneStore"
import { isNotificationActivityStatus } from "@/lib/activityStatus"
import { notificationSoundTypeForStatus, playNotificationSound } from "@/lib/notificationSound"
import type { PaneActivityState } from "@/lib/types"

type ActivityKind = "agent" | "server" | "build"

interface PaneRuntime {
  buffer: string
  inputBuffer: string
  kind: ActivityKind | null
  lastOutputAt: number
  startedAt: number
  agentAwaitingInput: boolean
  sawOutputSinceStart: boolean
}

const paneRuntimes = new Map<string, PaneRuntime>()
const debounceTimers = new Map<string, number>()
const OUTPUT_ANALYSIS_DELAY_MS = 600
const AGENT_STREAM_IDLE_MS = 3000
const AGENT_SILENT_IDLE_MS = 15000

const AI_COMMANDS = new Set([
  "claude",
  "claude-code",
  "codex",
  "antigravity",
  "antigravity-cli",
  "antigravity-agent",
  "ag",
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
  /\b(?:ask|message|tell|send)\s+(?:codex|claude|gemini|aider)\b/i,
  /\bpress\s+enter\s+to\s+send\b/i,
]

function getRuntime(paneId: string): PaneRuntime {
  const existing = paneRuntimes.get(paneId)
  if (existing) return existing

  const runtime: PaneRuntime = {
    buffer: "",
    inputBuffer: "",
    kind: null,
    lastOutputAt: 0,
    startedAt: 0,
    agentAwaitingInput: false,
    sawOutputSinceStart: false,
  }
  paneRuntimes.set(paneId, runtime)
  return runtime
}

function clearAnalysisTimer(paneId: string) {
  const previousTimer = debounceTimers.get(paneId)
  if (previousTimer != null) {
    window.clearTimeout(previousTimer)
    debounceTimers.delete(paneId)
  }
}

function scheduleAnalysis(paneId: string, delayMs: number) {
  if (typeof window === "undefined") return

  clearAnalysisTimer(paneId)
  const timer = window.setTimeout(() => {
    debounceTimers.delete(paneId)
    analyzeTerminalBuffer(paneId)
  }, delayMs)

  debounceTimers.set(paneId, timer)
}

function notifyForStatus(status: PaneActivityState) {
  const type = notificationSoundTypeForStatus(status)
  if (type) playNotificationSound(type, usePaneStore.getState().soundEnabled)
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

function clearPaneNotification(paneId: string) {
  const store = usePaneStore.getState()
  const currentStatus = store.paneActivities[paneId] ?? "idle"
  if (isNotificationActivityStatus(currentStatus)) {
    store.setPaneActivity(paneId, "idle")
  }
}

function normalizeCommandToken(token: string): string {
  return token
    .replace(/^["']|["']$/g, "")
    .toLowerCase()
    .split(/[\\/]/)
    .at(-1)!
    .replace(/\.(cmd|exe)$/i, "")
}

function classifyCommand(command: string): ActivityKind | null {
  const normalized = command.trim().replace(/^\s*[&.]\s+/, "")
  if (!normalized) return null

  const tokens = normalized.split(/\s+/).map(normalizeCommandToken)

  if (tokens.some((token) => AI_COMMANDS.has(token))) {
    return "agent"
  }

  if (serverCommandPatterns.some((pattern) => pattern.test(normalized))) {
    return "server"
  }

  if (buildCommandPatterns.some((pattern) => pattern.test(normalized))) {
    return "build"
  }

  return null
}

function beginCommand(paneId: string, command: string) {
  const trimmedCommand = command.trim()
  if (!trimmedCommand) return

  const runtime = getRuntime(paneId)
  const kind = classifyCommand(trimmedCommand)

  if (!kind && runtime.kind === "agent") {
    runtime.startedAt = Date.now()
    runtime.lastOutputAt = runtime.startedAt
    runtime.buffer = ""
    runtime.agentAwaitingInput = false
    runtime.sawOutputSinceStart = false
    setPaneActivity(paneId, "running")
    scheduleAnalysis(paneId, AGENT_SILENT_IDLE_MS)
    return
  }

  clearAnalysisTimer(paneId)
  runtime.kind = kind
  runtime.startedAt = kind ? Date.now() : 0
  runtime.lastOutputAt = kind ? runtime.startedAt : runtime.lastOutputAt
  runtime.buffer = ""

  if (kind) {
    runtime.agentAwaitingInput = false
    runtime.sawOutputSinceStart = false
    setPaneActivity(paneId, "running")
    if (kind === "agent") {
      scheduleAnalysis(paneId, AGENT_SILENT_IDLE_MS)
    }
  }
}

function appendInput(paneId: string, data: string) {
  const runtime = getRuntime(paneId)
  if (/^\x1b(?:\[[0-9;?]*[A-Za-z~]|O[A-Za-z])$/.test(data)) {
    return
  }

  for (const char of data) {
    if (char === "\x03") {
      const wasServer = runtime.kind === "server"
      runtime.kind = null
      runtime.inputBuffer = ""
      runtime.agentAwaitingInput = false
      runtime.sawOutputSinceStart = false
      clearAnalysisTimer(paneId)
      setPaneActivity(paneId, wasServer ? "crashed" : "idle")
      continue
    }

    if (char === "\r" || char === "\n") {
      clearPaneNotification(paneId)
      const inferredCommand = runtime.inputBuffer.trim() || inferCommandFromPromptLine(stripAnsi(runtime.buffer))
      beginCommand(paneId, inferredCommand)
      runtime.inputBuffer = ""
      continue
    }

    if (char === "\b" || char === "\x7f") {
      clearPaneNotification(paneId)
      runtime.inputBuffer = runtime.inputBuffer.slice(0, -1)
      continue
    }

    if (char >= " " && char !== "\x1b") {
      clearPaneNotification(paneId)
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

function getRecentMeaningfulLines(cleanBuffer: string, count = 16): string[] {
  return cleanBuffer
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(-count)
}

function normalizePromptLine(line: string): string {
  return line
    .replace(/[\u2500-\u257F]/gu, " ")
    .replace(/[\u2580-\u259F]/gu, " ")
    .replace(/[\uE000-\uF8FF]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
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

function inferCommandFromPromptLine(cleanBuffer: string): string {
  const line = getLastMeaningfulLine(cleanBuffer)
  return line
    .replace(/^PS\s+[A-Z]:\\.*>\s*/i, "")
    .replace(/^[A-Z]:\\.*>\s*/i, "")
    .replace(/^[^@\s]+@[^:\s]+:.*[$#%]\s*/i, "")
    .replace(/^[$#%]\s*/, "")
    .trim()
}

function looksLikeAiInputPrompt(runtime: PaneRuntime, line: string, cleanBuffer: string): boolean {
  if (runtime.kind !== "agent") return false

  const recentLines = getRecentMeaningfulLines(cleanBuffer)
  const recentText = recentLines.slice(-8).join("\n")
  const normalizedLines = recentLines.map(normalizePromptLine)
  const normalizedLastLine = normalizePromptLine(line)

  if (normalizedLines.slice(-3).some((candidate) => /^(?:>|\u203a|\u276F)\s*$/u.test(candidate))) {
    return true
  }

  if (/^(?:>|\u203a|\u276F)\s*$/u.test(normalizedLastLine)) return true
  if (normalizedLastLine.endsWith("?")) return true

  return promptRequestPatterns.some((pattern) => pattern.test(recentText))
}

function hasCrashSignal(cleanBuffer: string): boolean {
  return crashPatterns.some((pattern) => pattern.test(cleanBuffer))
}

function looksLikeServerStillRunning(cleanBuffer: string): boolean {
  return /(?:localhost|127\.0\.0\.1|listening|server running|ready in|compiled successfully|started server|webpack compiled|vite v)/i.test(cleanBuffer)
}

function looksLikeTrackedOutput(runtime: PaneRuntime, cleanBuffer: string, lastLine: string): boolean {
  if (runtime.kind) return true
  if (looksLikeShellPrompt(lastLine)) return false

  if (looksLikeServerStillRunning(cleanBuffer)) {
    runtime.kind = "server"
    runtime.startedAt = Date.now()
    return true
  }

  return false
}

function shouldNotifyDone(runtime: PaneRuntime, cleanBuffer: string): boolean {
  const elapsed = Date.now() - runtime.startedAt
  if (runtime.kind === "agent" || runtime.kind === "build") return true
  if (runtime.kind === "server") return false
  return elapsed > 5000 && /\b(?:done|success|completed|finished)\b/i.test(cleanBuffer)
}

function clearRuntimeCommand(runtime: PaneRuntime) {
  runtime.kind = null
  runtime.startedAt = 0
  runtime.agentAwaitingInput = false
  runtime.sawOutputSinceStart = false
}

function analyzeTerminalBuffer(paneId: string) {
  const runtime = getRuntime(paneId)
  if (!runtime.buffer) return

  const cleanBuffer = stripAnsi(runtime.buffer)
  const lastLine = getLastMeaningfulLine(cleanBuffer)
  const isTrackedOutput = looksLikeTrackedOutput(runtime, cleanBuffer, lastLine)
  if (!isTrackedOutput) return

  const hasPrompt = looksLikeShellPrompt(lastLine)
  const hasCrash = hasCrashSignal(cleanBuffer)

  if (hasCrash) {
    clearRuntimeCommand(runtime)
    setPaneActivity(paneId, "crashed")
    return
  }

  if (looksLikeAiInputPrompt(runtime, lastLine, cleanBuffer)) {
    runtime.agentAwaitingInput = true
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

  if (runtime.kind === "agent") {
    const timeSinceOutput = Date.now() - runtime.lastOutputAt
    const idleAfterMs = runtime.sawOutputSinceStart ? AGENT_STREAM_IDLE_MS : AGENT_SILENT_IDLE_MS

    if (timeSinceOutput >= idleAfterMs) {
      runtime.agentAwaitingInput = true
      setPaneActivity(paneId, "needs_input")
      return
    }

    setPaneActivity(paneId, "running")
    scheduleAnalysis(paneId, idleAfterMs - timeSinceOutput)
    return
  }

  if (runtime.kind === "build" || runtime.kind === "server") {
    setPaneActivity(paneId, "running")
    return
  }

  const timeSinceOutput = Date.now() - runtime.lastOutputAt
  if (timeSinceOutput > 5000) {
    setPaneActivity(paneId, "idle")
    return
  }

  scheduleAnalysis(paneId, 5000 - timeSinceOutput)
}

export function handleTerminalInput(paneId: string, data: string) {
  appendInput(paneId, data)
}

export function getPaneKind(paneId: string): ActivityKind | null {
  return paneRuntimes.get(paneId)?.kind ?? null
}

export function handleTerminalOutput(paneId: string, data: string) {
  const runtime = getRuntime(paneId)
  runtime.buffer = `${runtime.buffer}${data}`.slice(-4000)
  runtime.lastOutputAt = Date.now()

  const cleanBuffer = stripAnsi(runtime.buffer)
  const lastLine = getLastMeaningfulLine(cleanBuffer)
  const isTrackedOutput = looksLikeTrackedOutput(runtime, cleanBuffer, lastLine)
  if (!isTrackedOutput) return

  if (runtime.kind === "agent" && runtime.agentAwaitingInput) {
    return
  }

  if (runtime.kind === "agent") {
    runtime.sawOutputSinceStart = true
  }

  const currentStatus = usePaneStore.getState().paneActivities[paneId] ?? "idle"
  if (currentStatus !== "crashed") {
    setPaneActivity(paneId, "running")
  }

  scheduleAnalysis(paneId, OUTPUT_ANALYSIS_DELAY_MS)
}

export function clearPaneActivity(paneId: string) {
  clearPaneNotification(paneId)
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
