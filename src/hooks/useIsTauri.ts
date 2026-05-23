'use client'

import { useEffect, useState } from 'react'

export function useIsTauri() {
  const [isTauriApp, setIsTauriApp] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function detect() {
      try {
        const { isTauri } = await import('@tauri-apps/api/core')
        const result = isTauri()

        console.log('[Tauri Detection]', {
          isTauri: result,
          hasWindowTauri: typeof window !== 'undefined' && '__TAURI__' in window,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        })

        if (!cancelled) {
          setIsTauriApp(result)
          setChecked(true)
        }
      } catch (error) {
        console.log('[Tauri Detection] Not running in Tauri', error)

        if (!cancelled) {
          setIsTauriApp(false)
          setChecked(true)
        }
      }
    }

    detect()

    return () => {
      cancelled = true
    }
  }, [])

  return { isTauri: isTauriApp, checked }
}