import { Volume2, VolumeX } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"

export function NotificationSoundToggle() {
  const { soundEnabled, setSoundEnabled } = usePaneStore()

  return (
    <button
      onClick={() => setSoundEnabled(!soundEnabled)}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#CCCCCC] hover:bg-[#333333] hover:text-white transition-colors"
      title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
    >
      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span>{soundEnabled ? "Sounds Enabled" : "Sounds Disabled"}</span>
    </button>
  )
}
