"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePaneStore } from "./usePaneStore"
import type { ServerMessage, StateUpdate, OutputEvent, AuthResult, GroupCreated, GroupDeleted, GroupRenamed, PaneGroupSet, DirectoryContentsEvent, DeviceListEvent, DeviceKickedEvent, DeviceBannedEvent, ErrorEvent, FileUploadedEvent } from "@/lib/types"

interface UseWebSocketOptions {
  url: string | null
  token: string | null
}

/**
 * Checks tunnel connectivity by making an HTTP fetch to the tunnel's
 * /tunnel-check endpoint. This establishes the Dev Tunnel session/cookies
 * which are required before WebSocket connections will work.
 * 
 * Microsoft Dev Tunnels serve an anti-phishing interstitial page on the
 * first connection from a new origin. This preflight fetch triggers that
 * flow so the WebSocket upgrade can succeed afterward.
 */
async function checkTunnelConnectivity(tunnelBaseUrl: string): Promise<{ ok: boolean; needsConsent: boolean }> {
  // Convert wss:// to https:// for the HTTP fetch
  let httpUrl = tunnelBaseUrl
  if (httpUrl.startsWith("wss://")) {
    httpUrl = "https://" + httpUrl.slice(6)
  } else if (httpUrl.startsWith("ws://")) {
    httpUrl = "http://" + httpUrl.slice(5)
  }
  // Remove trailing /ws if present
  httpUrl = httpUrl.replace(/\/ws\/?$/, "")

  try {
    // First try the tunnel-check endpoint
    const response = await fetch(`${httpUrl}/tunnel-check`, {
      method: "GET",
      credentials: "include", // Include cookies for Dev Tunnel session
      headers: {
        "Accept": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("[Termote] Tunnel check passed:", data)
      return { ok: true, needsConsent: false }
    }

    // If we get a redirect or non-200, the tunnel may need consent
    console.warn("[Termote] Tunnel check returned status:", response.status)
    return { ok: false, needsConsent: true }
  } catch (error) {
    console.warn("[Termote] Tunnel check failed (may need consent):", error)

    // Try a simple health check as fallback
    try {
      const healthResponse = await fetch(`${httpUrl}/health`, {
        method: "GET",
        credentials: "include",
      })
      if (healthResponse.ok) {
        console.log("[Termote] Health check passed, tunnel is reachable")
        return { ok: true, needsConsent: false }
      }
    } catch {
      // Both checks failed
    }

    return { ok: false, needsConsent: true }
  }
}

/**
 * Opens the tunnel URL in a popup window for the user to complete
 * the Dev Tunnel anti-phishing consent flow.
 */
function openTunnelConsentPopup(tunnelBaseUrl: string): Window | null {
  let httpUrl = tunnelBaseUrl
  if (httpUrl.startsWith("wss://")) {
    httpUrl = "https://" + httpUrl.slice(6)
  } else if (httpUrl.startsWith("ws://")) {
    httpUrl = "http://" + httpUrl.slice(5)
  }
  httpUrl = httpUrl.replace(/\/ws\/?$/, "")

  // Open /health in a popup — the Dev Tunnel consent page will show there
  const popup = window.open(
    `${httpUrl}/health`,
    "termote_tunnel_consent",
    "width=600,height=500,menubar=no,toolbar=no,location=yes,status=yes"
  )
  return popup
}

export function useWebSocket({ url, token }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [tunnelStatus, setTunnelStatus] = useState<"idle" | "checking" | "consent" | "ready" | "error">("idle")

  const {
    setWebSocket,
    setConnected,
    setAuthenticated,
    setLayout,
    handleGroupCreated,
    handleGroupDeleted,
    handleGroupRenamed,
    handlePaneGroupSet,
    handleDirectoryContents,
    handleDeviceList,
    handleDeviceKicked,
    handleDeviceBanned,
    handleFileUploaded,
  } = usePaneStore()

  const connectWebSocket = useCallback((wsUrl: string) => {
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      setWebSocket(ws)

      ws.onopen = () => {
        console.log("[Termote] WebSocket connected to:", wsUrl)
        setConnected(true)
        setTunnelStatus("ready")
        // Send auth message on connect
        if (token) {
          ws.send(JSON.stringify({ action: "auth", token }))
        }
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "ping" }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          console.log("[Termote WS] Raw message:", event.data)
          const message: ServerMessage = JSON.parse(event.data)
          console.log("[Termote WS] Received:", message.event, message)
          handleMessage(message)
        } catch (e) {
          // If not JSON, it might be terminal output directly
          console.error("[Termote WS] Failed to parse message:", e, "Raw:", event.data)
        }
      }

      ws.onclose = () => {
        console.log("[Termote] WebSocket closed, will reconnect in 3s")
        setConnected(false)
        setAuthenticated(false)
        setWebSocket(null)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error("[Termote] WebSocket error:", error, "URL:", wsUrl, "readyState:", ws.readyState)
      }
    } catch (e) {
      console.error("[Termote] Failed to create WebSocket:", e)
      setTunnelStatus("error")
    }
  }, [token, setWebSocket, setConnected, setAuthenticated])

  const connect = useCallback(async () => {
    if (!url) return

    // Build WebSocket URL
    let wsUrl = url
    if (wsUrl.startsWith("https://")) {
      wsUrl = "wss://" + wsUrl.slice(8)
    } else if (wsUrl.startsWith("http://")) {
      wsUrl = "ws://" + wsUrl.slice(7)
    }
    // Append /ws if not already present
    if (!wsUrl.endsWith("/ws")) {
      wsUrl = wsUrl.replace(/\/?$/, "/ws")
    }

    console.log("[Termote] Connecting to:", wsUrl)
    setTunnelStatus("checking")

    // Pre-flight: check tunnel connectivity via HTTP fetch first
    // This establishes the Dev Tunnel session/cookies needed for WebSocket
    const result = await checkTunnelConnectivity(wsUrl)

    if (result.ok) {
      // Tunnel is reachable, connect WebSocket directly
      console.log("[Termote] Tunnel pre-flight passed, opening WebSocket")
      connectWebSocket(wsUrl)
    } else if (result.needsConsent) {
      // Tunnel needs consent — open popup and retry
      console.log("[Termote] Tunnel needs consent, opening popup")
      setTunnelStatus("consent")

      const popup = openTunnelConsentPopup(wsUrl)

      // Poll until popup is closed or tunnel becomes reachable
      const pollInterval = setInterval(async () => {
        // Check if popup was closed
        if (popup && popup.closed) {
          clearInterval(pollInterval)
          console.log("[Termote] Consent popup closed, retrying tunnel check")
          
          // Wait a moment for cookies to propagate
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const retryResult = await checkTunnelConnectivity(wsUrl)
          if (retryResult.ok) {
            console.log("[Termote] Tunnel now reachable after consent")
            connectWebSocket(wsUrl)
          } else {
            console.log("[Termote] Tunnel still not reachable, attempting WebSocket anyway")
            // Try connecting anyway — sometimes the consent flow sets cookies
            // that we can't detect via fetch due to CORS
            connectWebSocket(wsUrl)
          }
          return
        }

        // Also try checking connectivity while popup is open
        const check = await checkTunnelConnectivity(wsUrl)
        if (check.ok) {
          clearInterval(pollInterval)
          if (popup && !popup.closed) popup.close()
          console.log("[Termote] Tunnel became reachable during consent")
          connectWebSocket(wsUrl)
        }
      }, 2000)

      // Timeout after 60 seconds — try connecting anyway
      setTimeout(() => {
        clearInterval(pollInterval)
        if (popup && !popup.closed) popup.close()
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log("[Termote] Consent timeout, attempting WebSocket connection anyway")
          connectWebSocket(wsUrl)
        }
      }, 60000)
    } else {
      // Unknown error, try connecting anyway
      console.log("[Termote] Tunnel check inconclusive, attempting WebSocket")
      connectWebSocket(wsUrl)
    }
  }, [url, token, connectWebSocket])

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.event) {
        case "state_update":
          console.log("[Termote] state_update:", {
            panesCount: message.panes?.length,
            groupsCount: message.groups?.length,
            groups: message.groups,
            panesWithGroup: message.panes?.filter(p => p.groupId).map(p => ({ id: p.id, groupId: p.groupId }))
          })
          setLayout(message.panes, message.active_panes, message.floating_panes, message.groups ?? [])
          break
        case "output":
          window.dispatchEvent(
            new CustomEvent("terminal-output", {
              detail: {
                paneId: message.pane_id,
                data: message.data,
              },
            })
          )
          break
        case "auth_result":
          if (message.success) {
            setAuthenticated(true)
            console.log("[Termote] Authenticated!")
            // Request device list after successful authentication
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ action: "get_device_list" }))
            }
          } else {
            console.error("[Termote] Authentication failed:", message.message)
          }
          break
        case "group_created":
          console.log("[Termote] group_created:", message.group)
          handleGroupCreated(message.group)
          break
        case "group_deleted":
          console.log("[Termote] group_deleted:", message.group_id)
          handleGroupDeleted(message.group_id)
          break
        case "group_renamed":
          console.log("[Termote] group_renamed:", message.group_id, message.name)
          handleGroupRenamed(message.group_id, message.name)
          break
        case "pane_group_set":
          console.log("[Termote] pane_group_set:", message.pane_id, message.group_id)
          handlePaneGroupSet(message.pane_id, message.group_id)
          break
        case "directory_picker_cancelled":
          console.log("[Termote] Directory picker cancelled by user")
          break
        case "directory_contents":
          console.log("[Termote] directory_contents:", message.path, message.items)
          handleDirectoryContents(message.path, message.items)
          break
        case "device_list":
          console.log("[Termote] device_list:", message.devices)
          handleDeviceList(message.devices)
          break
        case "device_kicked":
          console.log("[Termote] device_kicked:", message.device_id)
          handleDeviceKicked(message.device_id)
          break
        case "device_banned":
          console.log("[Termote] device_banned:", message.ip)
          handleDeviceBanned(message.ip)
          break
        case "error":
          console.error("[Termote] Error from server:", message.message)
          break
        case "file_uploaded":
          console.log("[Termote] file_uploaded:", message.file_name, "to pane", message.pane_id)
          handleFileUploaded(message.pane_id, message.file_name)
          break
      }
    },
    [setLayout, setAuthenticated, handleDirectoryContents, handleDeviceList, handleDeviceKicked, handleDeviceBanned, handleFileUploaded]
  )

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    disconnect,
    reconnect: connect,
    tunnelStatus,
  }
}
