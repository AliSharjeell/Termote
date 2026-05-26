/**
 * Browser iframe src builder with runtime-aware proxy support.
 * Handles Tauri desktop (direct localhost) vs web/Dev Tunnel (preview proxy) routing.
 */

import { invoke } from "@tauri-apps/api/core"

export interface RuntimeSnapshot {
  backendRunning: boolean
  tunnelRunning: boolean
  backendUrl: string
  wsUrl: string
  authToken: string
  tunnelUrl: string | null
}

/**
 * Normalize a raw URL input to a full URL string.
 * Adds http:// prefix if missing.
 */
export function normalizeUrl(input: string): string {
  let url = input.trim()

  if (!url) throw new Error("Missing URL")

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`
  }

  return new URL(url).toString()
}

/**
 * Check if a URL points to a local/private network address.
 * These can be loaded directly in Tauri without proxy.
 */
export function isLocalOrPrivateUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()

    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    )
  } catch {
    return false
  }
}

/**
 * Check if running inside Tauri desktop app.
 */
export async function isRunningInTauri(): Promise<boolean> {
  try {
    const { isTauri } = await import("@tauri-apps/api/core")
    return isTauri()
  } catch {
    return false
  }
}

function buildProxyUrl(proxyOrigin: string, targetUrl: string): string {
  const target = new URL(targetUrl)
  const scheme = target.protocol === "https:" ? "https" : "http"
  const proxyPath = `/proxy/${scheme}/${target.host}${target.pathname}${target.search}${target.hash}`
  return new URL(proxyPath, proxyOrigin).toString()
}

/**
 * Register a preview session for a browser pane.
 * This tells the backend to proxy requests for /preview/<paneId>/* to the target URL.
 */
export async function registerPreviewSession(
  paneId: string,
  targetUrl: string,
  backendOrigin = typeof window !== "undefined" ? window.location.origin : "",
): Promise<string | null> {
  try {
    const response = await fetch(new URL('/preview-register', backendOrigin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pane_id: paneId, target_url: targetUrl }),
    })

    if (!response.ok) {
      console.error('[BROWSER FRAME SRC] Failed to register preview session:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[BROWSER FRAME SRC] Preview registered:', data)
    return new URL(data.preview_base as string, backendOrigin).toString()
  } catch (error) {
    console.error('[BROWSER FRAME SRC] Error registering preview:', error)
    return null
  }
}

/**
 * Build the iframe src for a browser pane.
 *
 * Tauri desktop:
 *   - Local/private URLs → direct iframe (http://localhost:3001)
 *   - This avoids proxy and loads directly
 *
 * Web/Dev Tunnel:
 *   - All URLs → use preview proxy /preview/<paneId>/
 *   - First registers session, then uses /preview/<paneId>/ as iframe src
 *   - This isolates the target app from Termote's Next.js app
 */
export async function buildBrowserFrameSrc(targetUrl: string, paneId?: string): Promise<string> {
  const normalizedTarget = normalizeUrl(targetUrl)

  console.log('[BROWSER FRAME SRC] Building for target', {
    targetUrl,
    normalizedTarget,
  })

  const isTauri = await isRunningInTauri()

  // Tauri desktop: for local/private URLs, use direct iframe
  if (isTauri && isLocalOrPrivateUrl(normalizedTarget)) {
    console.log('[BROWSER FRAME SRC] Tauri + local URL → direct iframe')
    return normalizedTarget
  }

  // Web/Dev Tunnel: use preview proxy
  if (!isTauri) {
    const previewId = paneId ?? `browser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const previewBase = await registerPreviewSession(previewId, normalizedTarget)

    if (previewBase) {
      console.log('[BROWSER FRAME SRC] Web → using preview proxy', {
        previewBase,
        previewId,
      })
      return previewBase
    }

    // Fallback if registration fails
    console.warn('[BROWSER FRAME SRC] Preview registration failed, falling back to proxy')
    const proxy = new URL('/proxy', window.location.origin)
    proxy.searchParams.set('url', normalizedTarget)
    return proxy.toString()
  }

  // Tauri but non-local URL: use the backend preview proxy. Avoid /proxy?url=...
  // because older sidecars/static fallbacks can serve the Termote app at that exact path.
  console.log('[BROWSER FRAME SRC] Tauri + non-local URL → backend preview proxy')
  const runtime = await invoke<RuntimeSnapshot>('get_runtime_state').catch(() => null)
  const proxyOrigin = runtime?.backendUrl ?? 'http://127.0.0.1:9090'
  const previewId = paneId ?? `browser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const previewBase = await registerPreviewSession(previewId, normalizedTarget, proxyOrigin)

  if (previewBase) {
    return previewBase
  }

  console.warn('[BROWSER FRAME SRC] Preview registration failed, falling back to path proxy')
  return buildProxyUrl(proxyOrigin, normalizedTarget)
}
