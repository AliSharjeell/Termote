import { normalizeUrl } from "./browserFrame"

export interface BrowserViewportRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BrowserPhysicalRect {
  x: number
  y: number
  width: number
  height: number
  scaleFactor: number
}

type NativeWebviewHandle = {
  webview: import("@tauri-apps/api/webview").Webview
  url: string
}

const webviews = new Map<string, NativeWebviewHandle>()

export function getNativeBrowserWebviewLabel(paneId: string) {
  return `browser_${paneId.replace(/[^a-zA-Z0-9_/:.-]/g, "_")}`
}

async function createNativeWebview(
  label: string,
  url: string,
  rect: BrowserViewportRect
): Promise<NativeWebviewHandle> {
  const [{ Webview }, { getCurrentWindow }] = await Promise.all([
    import("@tauri-apps/api/webview"),
    import("@tauri-apps/api/window"),
  ])

  // Clean up any existing webview with this label
  try {
    const existing = await Webview.getByLabel(label)
    if (existing) {
      console.log(`[NativeBrowserWebview] Closing existing webview: ${label}`)
      await existing.close()
    }
  } catch (err) {
    console.warn(`[NativeBrowserWebview] Could not close existing webview: ${err}`)
  }

  const appWindow = getCurrentWindow()
  console.log(`[NativeBrowserWebview] Creating webview: ${label} at (${rect.x}, ${rect.y}) ${rect.width}x${rect.height}`)
  const webview = new Webview(appWindow, label, {
    url,
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
    focus: false,
    backgroundColor: "#ffffff",
  })

  return { webview, url }
}

export async function ensureNativeBrowserWebview(
  paneId: string,
  rawUrl: string,
  rect: BrowserViewportRect
) {
  const label = getNativeBrowserWebviewLabel(paneId)
  const url = normalizeUrl(rawUrl)
  console.log(`[NativeBrowserWebview] ensure: ${label} url=${url} rect=(${rect.x}, ${rect.y}) ${rect.width}x${rect.height}`)
  const existing = webviews.get(label)

  if (!existing || existing.url !== url) {
    if (existing) {
      console.log(`[NativeBrowserWebview] URL changed, recreating: ${label}`)
      await existing.webview.close().catch(() => undefined)
      webviews.delete(label)
    }

    console.log(`[NativeBrowserWebview] Creating new webview: ${label}`)
    const handle = await createNativeWebview(label, url, rect)
    console.log(`[NativeBrowserWebview] Storing webview in map: ${label} handle=${!!handle} webview=${!!handle.webview}`)
    webviews.set(label, handle)
    console.log(`[NativeBrowserWebview] Webview stored, map has: ${webviews.has(label)}`)
    return handle.webview
  }

  console.log(`[NativeBrowserWebview] Repositioning existing webview: ${label}`)
  const { Webview } = await import("@tauri-apps/api/webview")
  const { LogicalPosition, LogicalSize } = await import("@tauri-apps/api/dpi")

  // Get fresh webview reference from Tauri instead of using cached one
  let webviewObj
  try {
    webviewObj = await Webview.getByLabel(label)
    console.log(`[NativeBrowserWebview] Got fresh webview reference: ${!!webviewObj}`)
  } catch (err) {
    console.error(`[NativeBrowserWebview] Failed to get webview by label: ${err}`)
    webviews.delete(label)
    throw err
  }

  if (!webviewObj) {
    console.error(`[NativeBrowserWebview] Webview not found by label: ${label}`)
    webviews.delete(label)
    throw new Error("webview not found")
  }

  try {
    console.log(`[NativeBrowserWebview] Calling setPosition on webview...`)
    await webviewObj.setPosition(new LogicalPosition(Math.round(rect.x), Math.round(rect.y)))
    console.log(`[NativeBrowserWebview] Position set for: ${label}`)
    await webviewObj.setSize(new LogicalSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height))))
    console.log(`[NativeBrowserWebview] Size set for: ${label}`)
    await webviewObj.show()
    console.log(`[NativeBrowserWebview] Webview shown: ${label}`)
  } catch (err) {
    console.error(`[NativeBrowserWebview] Failed to reposition webview: ${label}`, err)
    webviews.delete(label)
    throw err
  }

  // Update the map with fresh reference
  webviews.set(label, { webview: webviewObj, url: existing.url })
  return webviewObj
}

export async function closeNativeBrowserWebview(paneId: string) {
  const label = getNativeBrowserWebviewLabel(paneId)
  const existing = webviews.get(label)
  webviews.delete(label)
  await existing?.webview.close().catch(() => undefined)
}

export async function hideNativeBrowserWebview(paneId: string) {
  const label = getNativeBrowserWebviewLabel(paneId)
  await webviews.get(label)?.webview.hide().catch(() => undefined)
}

export async function measureNativeBrowserRects(element: HTMLElement) {
  const { getCurrentWindow } = await import("@tauri-apps/api/window")
  const appWindow = getCurrentWindow()
  const [innerPosition, scaleFactor] = await Promise.all([
    appWindow.innerPosition(),
    appWindow.scaleFactor(),
  ])

  const bounds = element.getBoundingClientRect()
  const viewport: BrowserViewportRect = {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  }
  const physical: BrowserPhysicalRect = {
    x: Math.round(innerPosition.x + bounds.left * scaleFactor),
    y: Math.round(innerPosition.y + bounds.top * scaleFactor),
    width: Math.max(1, Math.round(bounds.width * scaleFactor)),
    height: Math.max(1, Math.round(bounds.height * scaleFactor)),
    scaleFactor,
  }

  return { viewport, physical }
}
