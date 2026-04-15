"use client"

import { usePaneStore } from "@/hooks/usePaneStore"
import { useEffect } from "react"

export function PortManager() {
  const { portProcesses, fetchPortProcesses, killProcess } = usePaneStore()

  useEffect(() => {
    fetchPortProcesses()
    const interval = setInterval(fetchPortProcesses, 10000)
    return () => clearInterval(interval)
  }, [fetchPortProcesses])

  return (
    <div className="border-t border-[#252525] bg-[#0d0d0d] px-2 py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#CCCCCC] uppercase tracking-wider">Ports</span>
        <button
          onClick={fetchPortProcesses}
          title="Refresh"
          className="text-[#CCCCCC] hover:text-white text-[10px] px-1"
        >
          ↻
        </button>
      </div>
      {portProcesses.length === 0 ? (
        <p className="text-[10px] text-[#CCCCCC] px-1">No ports found</p>
      ) : (
        <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
          {portProcesses.map((proc) => (
            <div key={`${proc.port}-${proc.pid}`} className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[#1a1a1a] cursor-default group" title={`PID: ${proc.pid} — click × to kill`}>
              <span className="text-[10px] text-[#CCCCCC] font-mono w-12 shrink-0">{proc.port}</span>
              <span className="text-[10px] text-[#CCCCCC] truncate flex-1">{proc.process_name}</span>
              <button
                onClick={() => killProcess(proc.pid)}
                title="Kill"
                className="opacity-0 group-hover:opacity-100 text-[#E44] hover:text-[#F55] text-[10px] px-1 shrink-0 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
