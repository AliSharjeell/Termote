"use client"

import { useEffect, type RefObject } from "react"
import {
  closeNativeBrowserWebview,
  ensureNativeBrowserWebview,
  hideNativeBrowserWebview,
  measureNativeBrowserRects,
  type BrowserPhysicalRect,
} from "@/lib/nativeBrowserWebview"

interface UseNativeBrowserWebviewOptions {
  paneId: string
  url: string | null | undefined
  enabled: boolean
  viewportRef: RefObject<HTMLElement | null>
  refreshKey: number
  onPhysicalRect: (rect: BrowserPhysicalRect | null) => void
}

export function useNativeBrowserWebview({
  paneId,
  url,
  enabled,
  viewportRef,
  refreshKey,
  onPhysicalRect,
}: UseNativeBrowserWebviewOptions) {
  useEffect(() => {
    if (!enabled || !url) {
      onPhysicalRect(null)
      void hideNativeBrowserWebview(paneId)
      return
    }

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null
    let rafId = 0

    const sync = () => {
      if (cancelled) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const element = viewportRef.current
        if (!element || cancelled) return

        void measureNativeBrowserRects(element)
          .then(({ viewport, physical }) => {
            if (cancelled || viewport.width < 2 || viewport.height < 2) return
            onPhysicalRect(physical)
            return ensureNativeBrowserWebview(paneId, url, viewport)
          })
          .catch((error) => {
            console.error("[NativeBrowserWebview] sync failed", error)
            onPhysicalRect(null)
          })
      })
    }

    sync()

    const element = viewportRef.current
    if (element) {
      resizeObserver = new ResizeObserver(sync)
      resizeObserver.observe(element)
    }

    window.addEventListener("resize", sync)
    window.addEventListener("scroll", sync, true)
    intervalId = setInterval(sync, 600)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      window.removeEventListener("resize", sync)
      window.removeEventListener("scroll", sync, true)
      if (intervalId) clearInterval(intervalId)
      onPhysicalRect(null)
      void closeNativeBrowserWebview(paneId)
    }
  }, [enabled, onPhysicalRect, paneId, refreshKey, url, viewportRef])
}
