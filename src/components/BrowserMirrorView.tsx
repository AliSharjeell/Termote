"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import {
  BROWSER_MIRROR_SIGNAL_EVENT,
  createBrowserMirrorConnection,
  createBrowserMirrorPeerId,
  isSignalForPeer,
  sendBrowserMirrorSignal,
} from "@/lib/browserMirror"
import type { BrowserMirrorSignalEvent } from "@/lib/types"

interface BrowserMirrorFrame {
  dataUrl: string
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  timestamp: number
}

interface BrowserMirrorViewProps {
  paneId: string
  title: string
  aspectRatio?: string
  className?: string
}

function keyToRemoteText(event: React.KeyboardEvent<HTMLElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (event.key.length === 1) return event.key
  return null
}

export function BrowserMirrorView({ paneId, title, aspectRatio, className = "" }: BrowserMirrorViewProps) {
  const ws = usePaneStore(state => state.ws)
  const [status, setStatus] = useState("Connecting to desktop browser host...")
  const [frame, setFrame] = useState<BrowserMirrorFrame | null>(null)
  const peerIdRef = useRef("")
  const hostPeerIdRef = useRef<string | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const controlChannelRef = useRef<RTCDataChannel | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    peerIdRef.current = createBrowserMirrorPeerId("viewer")
  }, [paneId])

  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatus("Waiting for WebSocket...")
      return
    }

    let disposed = false
    const pc = createBrowserMirrorConnection()
    peerConnectionRef.current = pc
    setStatus("Negotiating browser mirror...")

    const frames = pc.createDataChannel("frames", { ordered: false, maxRetransmits: 0 })
    const control = pc.createDataChannel("control", { ordered: true })
    controlChannelRef.current = control

    frames.onopen = () => setStatus("Waiting for first frame...")
    frames.onclose = () => setStatus("Desktop mirror disconnected")
    frames.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.kind === "frame") {
          setFrame(message as BrowserMirrorFrame)
          setStatus("Live")
        }
      } catch (error) {
        console.warn("[BrowserMirrorView] invalid frame", error)
      }
    }

    control.onopen = () => {
      containerRef.current?.focus()
    }

    const sendSignal = (toPeerId: string | null, kind: string, data: unknown) => {
      sendBrowserMirrorSignal(ws, paneId, peerIdRef.current, toPeerId, kind, data)
    }

    pc.onicecandidate = (iceEvent) => {
      if (iceEvent.candidate) {
        sendSignal(hostPeerIdRef.current, "ice", iceEvent.candidate.toJSON())
      }
    }

    const handleSignal = async (event: Event) => {
      const signal = (event as CustomEvent<BrowserMirrorSignalEvent>).detail
      if (!signal || !isSignalForPeer(signal, paneId, peerIdRef.current)) return

      if (signal.kind === "answer") {
        hostPeerIdRef.current = signal.from_peer_id
        await pc.setRemoteDescription(signal.data as RTCSessionDescriptionInit)
        setStatus("Mirror connected")
      } else if (signal.kind === "ice") {
        await pc.addIceCandidate(signal.data as RTCIceCandidateInit).catch(() => undefined)
      }
    }

    window.addEventListener(BROWSER_MIRROR_SIGNAL_EVENT, handleSignal)

    void (async () => {
      const offer = await pc.createOffer()
      if (disposed) return
      await pc.setLocalDescription(offer)
      sendSignal(null, "offer", offer)
    })().catch((error) => {
      console.error("[BrowserMirrorView] offer failed", error)
      setStatus("Failed to start browser mirror")
    })

    return () => {
      disposed = true
      window.removeEventListener(BROWSER_MIRROR_SIGNAL_EVENT, handleSignal)
      controlChannelRef.current = null
      peerConnectionRef.current = null
      pc.close()
    }
  }, [paneId, ws])

  const sendControl = (message: unknown) => {
    const channel = controlChannelRef.current
    if (!channel || channel.readyState !== "open") return
    channel.send(JSON.stringify(message))
  }

  const pointToFrameRatio = (clientX: number, clientY: number, element: HTMLDivElement) => {
    const bounds = element.getBoundingClientRect()
    let contentLeft = bounds.left
    let contentTop = bounds.top
    let contentWidth = bounds.width
    let contentHeight = bounds.height

    if (frame?.sourceWidth && frame?.sourceHeight) {
      const frameAspect = frame.sourceWidth / frame.sourceHeight
      const boundsAspect = bounds.width / bounds.height

      if (boundsAspect > frameAspect) {
        contentWidth = bounds.height * frameAspect
        contentLeft = bounds.left + (bounds.width - contentWidth) / 2
      } else {
        contentHeight = bounds.width / frameAspect
        contentTop = bounds.top + (bounds.height - contentHeight) / 2
      }
    }

    return {
      xRatio: Math.min(1, Math.max(0, (clientX - contentLeft) / contentWidth)),
      yRatio: Math.min(1, Math.max(0, (clientY - contentTop) / contentHeight)),
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.focus()
    const point = pointToFrameRatio(event.clientX, event.clientY, event.currentTarget)
    sendControl({ kind: "click", ...point, button: event.button === 2 ? "right" : "left" })
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const point = pointToFrameRatio(event.clientX, event.clientY, event.currentTarget)
    sendControl({
      kind: "scroll",
      ...point,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const text = keyToRemoteText(event)
    if (text) {
      sendControl({ kind: "text", text })
      return
    }

    const supportedKeys = new Set([
      "Enter",
      "Backspace",
      "Tab",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Delete",
    ])
    if (supportedKeys.has(event.key)) {
      event.preventDefault()
      sendControl({ kind: "key", key: event.key })
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative h-full w-full overflow-hidden bg-black outline-none ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      title={title}
    >
      {frame ? (
        <img
          src={frame.dataUrl}
          alt={title}
          className="h-full w-full select-none object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-sm text-[#9CA3AF]">
          <div className="flex flex-col items-center gap-2 px-4">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>{status}</span>
          </div>
        </div>
      )}

      <input
        aria-label="Type into mirrored browser"
        className="absolute bottom-3 left-3 w-[min(18rem,calc(100%-1.5rem))] rounded-md border border-white/15 bg-black/65 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/40"
        placeholder="Tap here to type on mobile"
        onChange={(event) => {
          const value = event.currentTarget.value
          if (value) {
            sendControl({ kind: "text", text: value })
            event.currentTarget.value = ""
          }
        }}
      />

      <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/65 px-2 py-1 text-[11px] text-white/70">
        {status}
      </div>
    </div>
  )
}
