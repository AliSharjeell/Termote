import { useCallback } from 'react'
import { usePaneStore } from '@/hooks/usePaneStore'
import { isTauriBuild } from '@/lib/tauriDetect'
import { fitAllTerminals } from '@/lib/terminalRegistry'
import { resizeAllWhiteboards } from '@/lib/whiteboardRegistry'

function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function useFocusDevice() {
  const {
    setViewMode,
    setTabsSidebarCollapsed,
    setTabsProfileSidebarCollapsed,
    setProfileSidebarCollapsed
  } = usePaneStore()

  const focusThisDevice = useCallback(async () => {
    const isTauriApp = isTauriBuild()
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches

    const targetMode = isTauriApp && !isMobile ? "panes" : "tabs"
    const temporaryMode = targetMode === "tabs" ? "panes" : "tabs"

    console.log("[FOCUS DEVICE] start", {
      isTauriApp,
      isMobile,
      targetMode,
      temporaryMode,
    })

    // Step 1: collapse sidebars for clean focused layout
    if (targetMode === "tabs") {
      setTabsSidebarCollapsed(true)
      setTabsProfileSidebarCollapsed(true)
    }
    if (targetMode === "panes") {
      setProfileSidebarCollapsed(true)
    }

    // Step 2: force the same reflow users are doing manually
    setViewMode(temporaryMode)
    await nextFrame()
    await nextFrame()
    setViewMode(targetMode)
    await nextFrame()
    await nextFrame()

    // Step 3: refit all interactive panes
    fitAllTerminals("focus-this-device")
    resizeAllWhiteboards("focus-this-device")

    setTimeout(() => {
      fitAllTerminals("focus-this-device-delayed-100")
      resizeAllWhiteboards("focus-this-device-delayed-100")
    }, 100)

    setTimeout(() => {
      fitAllTerminals("focus-this-device-delayed-400")
      resizeAllWhiteboards("focus-this-device-delayed-400")
    }, 400)
  }, [
    setViewMode,
    setTabsSidebarCollapsed,
    setTabsProfileSidebarCollapsed,
    setProfileSidebarCollapsed
  ])

  return focusThisDevice
}
