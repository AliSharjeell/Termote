"use client"

import { ReactNode } from "react"
import { Minus, Square, X } from "lucide-react"
import { useIsTauri } from "@/hooks/useIsTauri"

interface TauriTitlebarProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}

export function TauriTitlebar({ left, center, right }: TauriTitlebarProps) {
  const { isTauri } = useIsTauri()

  if (!isTauri) return null

  async function getWindow() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window")
    return getCurrentWindow()
  }

  async function minimize() {
    const appWindow = await getWindow()
    await appWindow.minimize()
  }

  async function toggleMaximize() {
    const appWindow = await getWindow()
    await appWindow.toggleMaximize()
  }

  async function close() {
    const appWindow = await getWindow()
    await appWindow.close()
  }

  return (
    <div
      data-tauri-drag-region
      className="tauri-titlebar h-10 shrink-0 flex items-center justify-between bg-transparent border-none select-none relative"
    >
      <div data-tauri-drag-region className="flex-1 h-full flex items-center px-4">
        {left}
      </div>

      {center && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10">
          {center}
        </div>
      )}

      <div className="flex h-full items-center z-10">
        {right}
        <div className="titlebar-controls flex h-full">
          <button
            data-tauri-no-drag
            type="button"
            aria-label="Minimize"
            onClick={minimize}
            className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Minus size={14} className="text-[#CCCCCC]" />
          </button>

          <button
            data-tauri-no-drag
            type="button"
            aria-label="Maximize"
            onClick={toggleMaximize}
            className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Square size={11} className="text-[#CCCCCC]" />
          </button>

          <button
            data-tauri-no-drag
            type="button"
            aria-label="Close"
            onClick={close}
            className="titlebar-close h-10 w-12 flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X size={16} className="text-[#CCCCCC] hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}