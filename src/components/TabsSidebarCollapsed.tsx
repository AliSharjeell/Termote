"use client"

import { PanelLeft } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"

export function TabsSidebarCollapsed() {
  const { panes, toggleTabsSidebar } = usePaneStore()

  return (
    <div className="shrink-0 flex flex-col items-center gap-1 border-r border-[#252525] bg-[#0d0d0d] p-1 w-10">
      <button
        onClick={toggleTabsSidebar}
        title="Expand sidebar"
        className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
      >
        <PanelLeft size={14} />
      </button>
      <span className="text-[8px] text-[#CCCCCC]">{panes.length} panes</span>
    </div>
  )
}
