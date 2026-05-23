"use client"

import { Minus, Square, X } from "lucide-react"
import { useIsTauri } from "@/hooks/useIsTauri"

export function TauriTitlebar() {
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
      className="tauri-titlebar h-10 shrink-0 flex items-center justify-between bg-transparent border-none select-none"
    >
      <div data-tauri-drag-region className="flex-1 h-full" />

      <div className="flex h-full">
        <button
          type="button"
          aria-label="Minimize"
          onClick={minimize}
          className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Minus size={14} className="text-[#CCCCCC]" />
        </button>

        <button
          type="button"
          aria-label="Maximize"
          onClick={toggleMaximize}
          className="h-10 w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Square size={11} className="text-[#CCCCCC]" />
        </button>

        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="h-10 w-12 flex items-center justify-center hover:bg-red-500 transition-colors"
        >
          <X size={16} className="text-[#CCCCCC] hover:text-white" />
        </button>
      </div>
    </div>
  )
}