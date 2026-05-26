"use client"

import { useCallback, useRef, useState } from "react"
import { Laptop, Monitor, RefreshCw, Smartphone, Tablet, X } from "lucide-react"
import { useNativeBrowserWebview } from "@/hooks/useNativeBrowserWebview"
import { BrowserMirrorView } from "./BrowserMirrorView"

export interface DevicePreset {
  name: string
  label: string
  aspectRatio: string
  ratio: number
  hint: string
  icon: "desktop" | "mobile" | "tablet" | "laptop"
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { name: "desktop", label: "Desktop", aspectRatio: "16 / 9", ratio: 16 / 9, hint: "16:9", icon: "desktop" },
  { name: "laptop", label: "Laptop", aspectRatio: "16 / 10", ratio: 16 / 10, hint: "16:10", icon: "laptop" },
  { name: "tablet-landscape", label: "Tablet L", aspectRatio: "4 / 3", ratio: 4 / 3, hint: "4:3", icon: "tablet" },
  { name: "tablet-portrait", label: "Tablet P", aspectRatio: "3 / 4", ratio: 3 / 4, hint: "3:4", icon: "tablet" },
  { name: "mobile", label: "Mobile", aspectRatio: "9 / 16", ratio: 9 / 16, hint: "9:16", icon: "mobile" },
  { name: "mobile-tall", label: "Tall Phone", aspectRatio: "9 / 19.5", ratio: 9 / 19.5, hint: "9:19.5", icon: "mobile" },
  { name: "wide", label: "Ultrawide", aspectRatio: "21 / 9", ratio: 21 / 9, hint: "21:9", icon: "desktop" },
]

const iconMap = {
  desktop: Monitor,
  laptop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
}

interface DevicePreviewModalProps {
  paneId: string
  title: string
  url: string
  isTauri: boolean
  onClose: () => void
}

export function DevicePreviewModal({ paneId, title, url, isTauri, onClose }: DevicePreviewModalProps) {
  const [selected, setSelected] = useState<DevicePreset>(DEVICE_PRESETS[0])
  const [previewKey, setPreviewKey] = useState(0)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const ignorePhysicalRect = useCallback(() => {}, [])

  useNativeBrowserWebview({
    paneId: `${paneId}-preview`,
    url,
    enabled: isTauri,
    viewportRef: previewRef,
    refreshKey: previewKey,
    onPhysicalRect: ignorePhysicalRect,
  })

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80">
      <div className="flex max-h-full max-w-full flex-col items-center gap-4 overflow-auto p-4">
        <div className="flex flex-wrap justify-center gap-2">
          {DEVICE_PRESETS.map((preset) => {
            const Icon = iconMap[preset.icon]
            const isActive = selected.name === preset.name
            return (
              <button
                key={preset.name}
                onClick={() => setSelected(preset)}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "bg-white text-black"
                    : "bg-[#27272A] text-[#CCCCCC] hover:bg-[#333333]"
                }`}
                title={preset.hint}
              >
                <Icon className="h-4 w-4" />
                <span>{preset.label}</span>
                <span className="text-[10px] opacity-60">{preset.hint}</span>
              </button>
            )
          })}
        </div>

        <div
          className="relative max-h-[calc(100vh-160px)] overflow-hidden rounded-xl bg-black shadow-2xl"
          style={{
            aspectRatio: selected.aspectRatio,
            width: `min(calc(100vw - 32px), calc((100vh - 160px) * ${selected.ratio}), 1200px)`,
          }}
        >
          {isTauri ? (
            <div ref={previewRef} className="relative h-full w-full overflow-hidden bg-white">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-black/35">
                Native responsive browser preview
              </div>
            </div>
          ) : (
            <BrowserMirrorView
              key={`${selected.name}-${previewKey}`}
              paneId={paneId}
              title={`${title} preview: ${selected.label}`}
              aspectRatio={selected.aspectRatio}
            />
          )}
        </div>

        <div className="text-xs text-[#808080]">
          {selected.label} - aspect {selected.hint}; scales to available space
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] text-[#808080] transition-colors hover:bg-[#333333] hover:text-white"
        aria-label="Close preview"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        onClick={() => setPreviewKey(prev => prev + 1)}
        className="absolute right-16 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] text-[#808080] transition-colors hover:bg-[#333333] hover:text-white"
        title="Reconnect preview"
      >
        <RefreshCw className="h-5 w-5" />
      </button>
    </div>
  )
}
