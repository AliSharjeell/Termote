import type { PaneActivityState } from "@/lib/types"

interface ActivityIndicatorProps {
  status?: PaneActivityState
}

export function ActivityIndicator({ status }: ActivityIndicatorProps) {
  if (status === "running") {
    return (
      <span
        className="h-3 w-3 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin"
        title="Running"
      />
    )
  }

  if (status === "done") {
    return <span className="h-2.5 w-2.5 rounded-full bg-[#58A6FF]" title="Finished" />
  }

  if (status === "needs_input") {
    return <span className="h-2.5 w-2.5 rounded-full bg-[#58A6FF] animate-pulse" title="Needs input" />
  }

  if (status === "crashed") {
    return <span className="h-2.5 w-2.5 rounded-full bg-[#F85149]" title="Crashed" />
  }

  return null
}

