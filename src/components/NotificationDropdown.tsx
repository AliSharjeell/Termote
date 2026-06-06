import { useState, useRef, useEffect } from "react"
import { Bell, CheckCircle2, AlertCircle, HelpCircle, Loader2, Trash2 } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { activityPriority, isVisibleActivityStatus } from "@/lib/activityStatus"
import type { NotificationHistoryItem, PaneActivityState } from "@/lib/types"

interface NotificationItem {
  id: string
  name: string
  status: Exclude<PaneActivityState, "idle">
  detail?: string
  paneId?: string
  sourceId: string
  sourceType: "pane" | "system"
}

interface NotificationDropdownProps {
  compact?: boolean
}

export function NotificationDropdown({ compact }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    panes,
    paneActivities,
    systemActivities,
    notificationHistory,
    selectTab,
    clearSystemActivity,
    clearNotificationHistory,
  } = usePaneStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const intervalId = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(intervalId)
  }, [isOpen])

  const paneItems: NotificationItem[] = panes.flatMap((pane) => {
    const status = paneActivities[pane.id]
    if (!isVisibleActivityStatus(status)) return []

    return [{
      id: pane.id,
      name: pane.name,
      paneId: pane.id,
      sourceId: pane.id,
      sourceType: "pane",
      status,
    }]
  })

  const systemItems: NotificationItem[] = Object.values(systemActivities).flatMap((activity) => {
    if (!isVisibleActivityStatus(activity.state)) return []

    return [{
      id: activity.id,
      name: activity.name,
      status: activity.state,
      detail: activity.detail,
      sourceId: activity.id,
      sourceType: "system",
    }]
  })

  const items = [...systemItems, ...paneItems].sort((a, b) => {
    return activityPriority[a.status] - activityPriority[b.status]
  })
  const priorityItems = items.filter((item) => item.status !== "running")
  const runningItems = items.filter((item) => item.status === "running")
  const activeItemKeys = new Set(
    items.map((item) => `${item.sourceType}:${item.sourceId}:${item.status}`)
  )
  const pastItems = notificationHistory
    .filter((item) => !activeItemKeys.has(`${item.sourceType}:${item.sourceId}:${item.status}`))
    .slice(0, 20)

  const hasCrashed = items.some((item) => item.status === "crashed")
  const hasInput = items.some((item) => item.status === "needs_input")
  const hasDone = items.some((item) => item.status === "done")
  const hasRunning = items.some((item) => item.status === "running")

  let badgeColor = ""
  if (hasCrashed) badgeColor = "bg-red-500"
  else if (hasInput || hasDone) badgeColor = "bg-blue-500"

  function getStatusIcon(status: PaneActivityState) {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      case "needs_input":
        return <HelpCircle className="h-4 w-4 text-blue-500" />
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "crashed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  function formatTimestamp(timestamp: number) {
    const elapsedMs = (now || timestamp) - timestamp
    if (elapsedMs < 60000) return "just now"
    if (elapsedMs < 3600000) return `${Math.floor(elapsedMs / 60000)}m ago`
    if (elapsedMs < 86400000) return `${Math.floor(elapsedMs / 3600000)}h ago`

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp))
  }

  function handleItemClick(item: NotificationItem) {
    if (item.paneId) {
      selectTab(item.paneId)
    } else {
      clearSystemActivity(item.id)
    }
    setIsOpen(false)
  }

  function handleHistoryItemClick(item: NotificationHistoryItem) {
    if (item.sourceType === "pane" && panes.some((pane) => pane.id === item.sourceId)) {
      selectTab(item.sourceId)
      setIsOpen(false)
    }
  }

  function renderNotificationItem(item: NotificationItem) {
    return (
      <button
        key={`${item.sourceType}:${item.id}`}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#2D2D2D]"
        onClick={() => handleItemClick(item)}
      >
        {getStatusIcon(item.status)}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-200">{item.name}</span>
          {item.detail && <span className="block truncate text-xs text-gray-500">{item.detail}</span>}
        </span>
        <span className="text-xs capitalize text-gray-500">{item.status.replace("_", " ")}</span>
      </button>
    )
  }

  function renderHistoryItem(item: NotificationHistoryItem) {
    const canOpenPane = item.sourceType === "pane" && panes.some((pane) => pane.id === item.sourceId)

    return (
      <button
        key={item.id}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#2D2D2D] disabled:cursor-default disabled:hover:bg-transparent"
        onClick={() => handleHistoryItemClick(item)}
        disabled={!canOpenPane}
      >
        {getStatusIcon(item.status)}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-300">{item.name}</span>
          {item.detail && <span className="block truncate text-xs text-gray-500">{item.detail}</span>}
        </span>
        <span className="shrink-0 text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
      </button>
    )
  }

  return (
    <div ref={dropdownRef}>
      <button
        onClick={() => {
          const nextOpen = !isOpen
          if (nextOpen) setNow(Date.now())
          setIsOpen(nextOpen)
        }}
        className={`relative hover:bg-[#333333] rounded-md text-gray-400 hover:text-white transition-colors ${compact ? "p-1" : "p-1.5"}`}
        title="Notifications"
      >
        <Bell className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {badgeColor && (
          <span className={`absolute top-0.5 right-0.5 h-2 w-2 rounded-full ${badgeColor} border border-[#0C0C0C]`} />
        )}
        {!badgeColor && hasRunning && (
          <span className="absolute top-0.5 right-0.5">
            <Loader2 className="h-2 w-2 animate-spin rounded-full bg-[#0C0C0C] text-gray-400" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-md border border-[#333333] bg-[#1E1E1E] py-1 shadow-lg" style={{ minWidth: '16rem' }}>
          <div className="flex items-center justify-between border-b border-[#333333] px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Activity</span>
            {pastItems.length > 0 && (
              <button
                onClick={clearNotificationHistory}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-[#333333] hover:text-gray-200"
                title="Clear past notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {priorityItems.length === 0 && runningItems.length === 0 && pastItems.length === 0 && (
              <div className="px-4 py-3 text-center text-sm text-gray-500">No notifications</div>
            )}
            {priorityItems.length > 0 && (
              <div>
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Needs Attention
                </div>
                {priorityItems.map(renderNotificationItem)}
              </div>
            )}
            {runningItems.length > 0 && (
              <div>
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Running
                </div>
                {runningItems.map(renderNotificationItem)}
              </div>
            )}
            {pastItems.length > 0 && (
              <div className="border-t border-[#333333]">
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Past
                </div>
                {pastItems.map(renderHistoryItem)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
