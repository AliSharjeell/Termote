"use client"

import { useState } from "react"
import { X, Monitor, Smartphone, Tablet, Laptop } from "lucide-react"

export interface DevicePreset {
  name: string
  label: string
  width: number
  height: number
  icon: "desktop" | "mobile" | "tablet" | "laptop"
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { name: "desktop", label: "Desktop", width: 1920, height: 1080, icon: "desktop" },
  { name: "laptop", label: "Laptop", width: 1366, height: 768, icon: "laptop" },
  { name: "tablet-landscape", label: "Tablet (L)", width: 1024, height: 768, icon: "tablet" },
  { name: "tablet-portrait", label: "Tablet (P)", width: 768, height: 1024, icon: "tablet" },
  { name: "mobile", label: "Mobile", width: 390, height: 844, icon: "mobile" },
  { name: "mobile-small", label: "Small Phone", width: 320, height: 568, icon: "mobile" },
  { name: "wide", label: "Ultrawide", width: 2560, height: 1080, icon: "desktop" },
  { name: "hd", label: "720p", width: 1280, height: 720, icon: "desktop" },
]

const iconMap = {
  desktop: Monitor,
  laptop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
}

interface DevicePreviewModalProps {
  url: string
  proxyUrl: string | null
  onClose: () => void
}

export function DevicePreviewModal({ url, proxyUrl, onClose }: DevicePreviewModalProps) {
  const [selected, setSelected] = useState<DevicePreset>(DEVICE_PRESETS[0])

  const src = proxyUrl ?? url

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80">
      {/* Preview container */}
      <div className="flex flex-col items-center gap-4 max-w-full max-h-full overflow-auto p-4">
        {/* Device selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
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
                  title={`${preset.width}×${preset.height}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{preset.label}</span>
                  <span className="text-[10px] opacity-60">{preset.width}×{preset.height}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Device frame */}
        <div
          className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
          style={{
            width: selected.width,
            height: selected.height,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 160px)",
          }}
        >
          <iframe
            src={src}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`Device preview: ${selected.label}`}
          />
        </div>

        {/* Label */}
        <div className="text-xs text-[#808080]">
          {selected.label} — {selected.width} × {selected.height}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#27272A] hover:bg-[#333333] text-[#808080] hover:text-white transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
