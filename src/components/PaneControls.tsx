"use client"

interface PaneControlsProps {
  paneId: string
  shell: string
  onClose: () => void
}

export function PaneControls({ onClose }: PaneControlsProps) {
  return (
    <div className="absolute top-1 right-1 z-10">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E74856] hover:bg-[#ff3b30]">
        <button
          onClick={onClose}
          className="flex h-full w-full items-center justify-center rounded-full"
          title="Close terminal"
        >
          <span className="text-white" style={{ fontSize: "11px", lineHeight: 1, fontWeight: "bold" }}>×</span>
        </button>
      </div>
    </div>
  )
}
