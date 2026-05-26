import { useState, useRef, useEffect } from "react"
import { Bell, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { activityPriority, isVisibleActivityStatus } from "@/lib/activityStatus"
import type { PaneActivityState } from "@/lib/types"

interface NotificationItem {
  id: string
  name: string
  status: Exclude<PaneActivityState, "idle">
  detail?: string
  paneId?: string
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { panes, paneActivities, systemActivities, selectTab, clearSystemActivity } = usePaneStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const paneItems: NotificationItem[] = panes.flatMap((pane) => {
    const status = paneActivities[pane.id]
    if (!isVisibleActivityStatus(status)) return []

    return [{
      id: pane.id,
      name: pane.name,
      paneId: pane.id,
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
    }]
  })

  const items = [...systemItems, ...paneItems].sort((a, b) => {
    return activityPriority[a.status] - activityPriority[b.status]
  })

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

  function handleItemClick(item: NotificationItem) {
    if (item.paneId) {
      selectTab(item.paneId)
    } else {
      clearSystemActivity(item.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 hover:bg-[#333333] rounded-md text-gray-400 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {badgeColor && (
          <span className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full ${badgeColor} border border-[#0C0C0C]`} />
        )}
        {!badgeColor && hasRunning && (
          <span className="absolute top-1 right-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin rounded-full bg-[#0C0C0C] text-gray-400" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-md border border-[#333333] bg-[#1E1E1E] py-1 shadow-lg">
          <div className="border-b border-[#333333] px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Activity
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500">No active tasks</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

