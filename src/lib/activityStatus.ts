import type { PaneActivityState } from "@/lib/types"

export const activityPriority: Record<PaneActivityState, number> = {
  crashed: 0,
  needs_input: 1,
  done: 2,
  running: 3,
  idle: 4,
}

export function getHighestActivityStatus(statuses: Array<PaneActivityState | undefined>): PaneActivityState {
  return statuses.reduce<PaneActivityState>((current, status) => {
    const nextStatus = status ?? "idle"
    return activityPriority[nextStatus] < activityPriority[current] ? nextStatus : current
  }, "idle")
}

export function isVisibleActivityStatus(status: PaneActivityState | undefined): status is Exclude<PaneActivityState, "idle"> {
  return status != null && status !== "idle"
}

export function isNotificationActivityStatus(status: PaneActivityState | undefined): boolean {
  return status === "crashed" || status === "needs_input" || status === "done"
}

