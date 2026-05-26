"use client"

import { useCallback, useEffect, useRef, type RefObject } from "react"
import {
  closeNativeBrowserWebview,
  ensureNativeBrowserWebview,
  hideNativeBrowserWebview,
  measureNativeBrowserRects,
  type BrowserPhysicalRect,
} from "@/lib/nativeBrowserWebview"
import { isTauriBuild } from "@/lib/tauriDetect"

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
  const createdRef = useRef(false)
  const creatingRef = useRef<Promise<void> | null>(null)
  const missingLoggedRef = useRef(false)

  useEffect(() => {
    if (!isTauriBuild()) return
    if (!enabled || !url || !paneId) {
      onPhysicalRect(null)
      void hideNativeBrowserWebview(paneId)
      void closeNativeBrowserWebview(paneId)
      createdRef.current = false
      creatingRef.current = null
      missingLoggedRef.current = false
      return
    }

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let rafId = 0

    async function ensureThenSync() {
      if (cancelled) return
      const element = viewportRef.current
      if (!element) return

      const { viewport, physical } = await measureNativeBrowserRects(element)
      if (cancelled) return

      if (viewport.width < 2 || viewport.height < 2) {
        onPhysicalRect(null)
        return
      }

      onPhysicalRect(physical)

      try {
        // Only create if not already created
        if (!createdRef.current) {
          // If creation is already in progress, wait for it
          if (!creatingRef.current) {
            creatingRef.current = ensureNativeBrowserWebview(paneId, url!, viewport)
              .then(() => {
                createdRef.current = true
              })
              .catch((err) => {
                // If creation fails, reset so we can retry
                console.warn("[NativeBrowserWebview] create failed, will retry:", err)
                createdRef.current = false
                creatingRef.current = null
                throw err
              })
          }
          await creatingRef.current
        }

        if (cancelled) return

        // Now sync - this repositions and sets visibility
        await ensureNativeBrowserWebview(paneId, url!, viewport)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        // Throttle error spam - only log missing webview once
        if (msg.includes("webview not found") || msg.includes("not found")) {
          if (!missingLoggedRef.current) {
            console.warn("[NativeBrowserWebview] webview missing, will recreate:", msg)
            missingLoggedRef.current = true
            // Reset so next sync will create fresh
            createdRef.current = false
            creatingRef.current = null
          }
        } else {
          console.error("[NativeBrowserWebview] sync failed", error)
        }
        onPhysicalRect(null)
      }
    }

    const scheduleSync = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(ensureThenSync)
    }

    scheduleSync()

    const element = viewportRef.current
    if (element) {
      resizeObserver = new ResizeObserver(scheduleSync)
      resizeObserver.observe(element)
    }

    window.addEventListener("resize", scheduleSync)
    window.addEventListener("scroll", scheduleSync, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      window.removeEventListener("resize", scheduleSync)
      window.removeEventListener("scroll", scheduleSync, true)
      missingLoggedRef.current = false
      // Note: we don't close the webview on cleanup here
      // because the pane might remount with the same paneId
      // and we want to reuse the webview. The parent component
      // should call closeNativeBrowserWebview explicitly on pane close.
    }
  }, [enabled, paneId, url, refreshKey])

  // Cleanup on pane close - called separately when pane is destroyed
  const cleanupOnClose = useCallback(() => {
    createdRef.current = false
    creatingRef.current = null
    missingLoggedRef.current = false
    void closeNativeBrowserWebview(paneId)
  }, [paneId])

  // Expose cleanup for parent to call on pane close
  ;(useNativeBrowserWebview as unknown as { cleanup: typeof cleanupOnClose }).cleanup = cleanupOnClose
}
