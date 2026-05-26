import type { PaneActivityState } from "@/lib/types"

type NotificationSoundType = "input" | "done" | "crashed"

type AudioContextWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

export function notificationSoundTypeForStatus(status: PaneActivityState): NotificationSoundType | null {
  if (status === "needs_input") return "input"
  if (status === "done") return "done"
  if (status === "crashed") return "crashed"
  return null
}

export function playNotificationSound(type: NotificationSoundType, enabled: boolean) {
  if (!enabled) return
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
