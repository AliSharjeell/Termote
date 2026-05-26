"use client"

import { useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import { usePaneStore } from "./usePaneStore"
import {
  BROWSER_MIRROR_SIGNAL_EVENT,
  createBrowserMirrorConnection,
  getBrowserMirrorPeerId,
  isSignalForPeer,
  sendBrowserMirrorSignal,
} from "@/lib/browserMirror"
import type { BrowserPhysicalRect } from "@/lib/nativeBrowserWebview"
import type { BrowserMirrorSignalEvent } from "@/lib/types"

type ControlMessage =
  | { kind: "click"; xRatio: number; yRatio: number; button?: string }
  | { kind: "scroll"; xRatio: number; yRatio: number; deltaX: number; deltaY: number }
  | { kind: "text"; text: string }
  | { kind: "key"; key: string }

interface BrowserCaptureFrame {
  dataUrl: string
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  timestamp: number
}

interface UseBrowserMirrorHostOptions {
  paneId: string
  enabled: boolean
  physicalRect: BrowserPhysicalRect | null
}

function mapPoint(rect: BrowserPhysicalRect, xRatio: number, yRatio: number) {
  const clampedX = Math.min(1, Math.max(0, xRatio))
  const clampedY = Math.min(1, Math.max(0, yRatio))
  return {
    x: Math.round(rect.x + rect.width * clampedX),
    y: Math.round(rect.y + rect.height * clampedY),
  }
}

export function useBrowserMirrorHost({ paneId, enabled, physicalRect }: UseBrowserMirrorHostOptions) {
  const ws = usePaneStore(state => state.ws)
  const peerIdRef = useRef("")
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const viewerPeerIdRef = useRef<string | null>(null)
  const framesChannelRef = useRef<RTCDataChannel | null>(null)
  const physicalRectRef = useRef<BrowserPhysicalRect | null>(physicalRect)
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captureRunningRef = useRef(false)

  useEffect(() => {
    physicalRectRef.current = physicalRect
  }, [physicalRect])

  useEffect(() => {
    peerIdRef.current = getBrowserMirrorPeerId(`host:${paneId}`)
  }, [paneId])

  useEffect(() => {
    if (!enabled) return

    let disposed = false

    const stopCaptureLoop = () => {
      captureRunningRef.current = false
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current)
        captureTimerRef.current = null
      }
    }

    const cleanupConnection = () => {
      stopCaptureLoop()
      framesChannelRef.current = null
      peerConnectionRef.current?.close()
      peerConnectionRef.current = null
      viewerPeerIdRef.current = null
    }

    const sendSignal = (toPeerId: string | null, kind: string, data: unknown) => {
      sendBrowserMirrorSignal(ws, paneId, peerIdRef.current, toPeerId, kind, data)
    }

    const scheduleCapture = (delay = 0) => {
      if (!captureRunningRef.current || disposed) return
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
      captureTimerRef.current = setTimeout(captureFrame, delay)
    }

    const captureFrame = async () => {
      if (!captureRunningRef.current || disposed) return

      const rect = physicalRectRef.current
      const channel = framesChannelRef.current
      if (!rect || !channel || channel.readyState !== "open" || channel.bufferedAmount > 3_000_000) {
        scheduleCapture(140)
        return
      }

      try {
        const frame = await invoke<BrowserCaptureFrame>("capture_browser_region", {
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            maxWidth: 1920,
            quality: 68,
          },
        })
        if (channel.readyState === "open") {
          channel.send(JSON.stringify({ kind: "frame", ...frame }))
        }
      } catch (error) {
        console.warn("[BrowserMirrorHost] capture failed", error)
      } finally {
        scheduleCapture(110)
      }
    }

    const startCaptureLoop = () => {
      if (captureRunningRef.current) return
      captureRunningRef.current = true
      scheduleCapture(0)
    }

    const applyControl = (message: ControlMessage) => {
      const rect = physicalRectRef.current
      if (!rect) return

      if (message.kind === "click") {
        const point = mapPoint(rect, message.xRatio, message.yRatio)
        void invoke("apply_browser_remote_input", {
          input: { kind: "click", x: point.x, y: point.y, button: message.button ?? "left" },
        })
      } else if (message.kind === "scroll") {
        const point = mapPoint(rect, message.xRatio, message.yRatio)
        void invoke("apply_browser_remote_input", {
          input: {
            kind: "scroll",
            x: point.x,
            y: point.y,
            delta_x: Math.round(message.deltaX),
            delta_y: Math.round(message.deltaY),
          },
        })
      } else if (message.kind === "text") {
        void invoke("apply_browser_remote_input", { input: { kind: "text", text: message.text } })
      } else if (message.kind === "key") {
        void invoke("apply_browser_remote_input", { input: { kind: "key", key: message.key } })
      }
    }

    const handleSignal = async (event: Event) => {
      const signal = (event as CustomEvent<BrowserMirrorSignalEvent>).detail
      if (!signal || !isSignalForPeer(signal, paneId, peerIdRef.current)) return

      if (signal.kind === "offer") {
        cleanupConnection()
        const viewerPeerId = signal.from_peer_id
        viewerPeerIdRef.current = viewerPeerId

        const pc = createBrowserMirrorConnection()
        peerConnectionRef.current = pc

        pc.onicecandidate = (iceEvent) => {
          if (iceEvent.candidate) {
            sendSignal(viewerPeerId, "ice", iceEvent.candidate.toJSON())
          }
        }

        pc.ondatachannel = (channelEvent) => {
          const channel = channelEvent.channel
          if (channel.label === "frames") {
            framesChannelRef.current = channel
            channel.onopen = startCaptureLoop
            channel.onclose = stopCaptureLoop
          } else if (channel.label === "control") {
            channel.onmessage = (messageEvent) => {
              try {
                applyControl(JSON.parse(messageEvent.data) as ControlMessage)
              } catch (error) {
                console.warn("[BrowserMirrorHost] invalid control message", error)
              }
            }
          }
        }

        await pc.setRemoteDescription(signal.data as RTCSessionDescriptionInit)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal(viewerPeerId, "answer", answer)
      } else if (signal.kind === "ice" && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(signal.data as RTCIceCandidateInit).catch(() => undefined)
      }
    }

    window.addEventListener(BROWSER_MIRROR_SIGNAL_EVENT, handleSignal)

    return () => {
      disposed = true
      window.removeEventListener(BROWSER_MIRROR_SIGNAL_EVENT, handleSignal)
      cleanupConnection()
    }
  }, [enabled, paneId, ws])
}
