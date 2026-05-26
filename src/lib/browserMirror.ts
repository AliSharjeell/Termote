import type { BrowserMirrorSignalEvent } from "./types"

export const BROWSER_MIRROR_SIGNAL_EVENT = "termote-browser-mirror-signal"
export const BROWSER_MIRROR_STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
]

const PEER_ID_KEY = "termote-browser-mirror-peer-id"

export function createBrowserMirrorPeerId(prefix = "peer") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getBrowserMirrorPeerId(namespace = "default") {
  if (typeof window === "undefined") return createBrowserMirrorPeerId("server")

  try {
    const key = `${PEER_ID_KEY}:${namespace}`
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const id = createBrowserMirrorPeerId("peer")
    sessionStorage.setItem(key, id)
    return id
  } catch {
    return createBrowserMirrorPeerId("peer")
  }
}

export function createBrowserMirrorConnection() {
  return new RTCPeerConnection({ iceServers: BROWSER_MIRROR_STUN_SERVERS })
}

export function sendBrowserMirrorSignal(
  ws: WebSocket | null,
  paneId: string,
  fromPeerId: string,
  toPeerId: string | null,
  kind: string,
  data: unknown
) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false

  ws.send(JSON.stringify({
    action: "browser_mirror_signal",
    pane_id: paneId,
    from_peer_id: fromPeerId,
    to_peer_id: toPeerId,
    kind,
    data,
  }))
  return true
}

export function isSignalForPeer(
  signal: BrowserMirrorSignalEvent,
  paneId: string,
  peerId: string
) {
  return (
    signal.pane_id === paneId &&
    signal.from_peer_id !== peerId &&
    (!signal.to_peer_id || signal.to_peer_id === peerId)
  )
}
