"use client"

import { PanelRight } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"

export function TabsGitSidebarCollapsed() {
  const { toggleTabsGitSidebar } = usePaneStore()

  return (
    <div className="shrink-0 flex flex-col items-center border-l border-[#252525] bg-[#0d0d0d] w-10 py-2 gap-2">
      <button
        onClick={toggleTabsGitSidebar}
        title="Expand git sidebar"
        className="w-8 h-8 flex flex-col items-center justify-center text-[#CCCCCC] hover:text-white"
      >
        <PanelRight size={14} />
      </button>
    </div>
  )
}
