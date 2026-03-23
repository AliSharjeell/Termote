"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePaneStore } from "./usePaneStore"
import type { ServerMessage, StateUpdate, OutputEvent, AuthResult, GroupCreated, GroupDeleted, GroupRenamed, PaneGroupSet } from "@/lib/types"

interface UseWebSocketOptions {
  url: string | null
  token: string | null
}

export function useWebSocket({ url, token }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    setWebSocket,
    setConnected,
    setAuthenticated,
    setLayout,
    handleGroupCreated,
    handleGroupDeleted,
    handleGroupRenamed,
    handlePaneGroupSet,
  } = usePaneStore()

  const connect = useCallback(() => {
    if (!url) return

    try {
      // Convert https:// to wss:// and http:// to ws://, then append /ws
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

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      setWebSocket(ws)

      ws.onopen = () => {
        setConnected(true)
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
          const message: ServerMessage = JSON.parse(event.data)
          console.log("[Termote WS] Received:", message.event, message)
          handleMessage(message)
        } catch (e) {
          // If not JSON, it might be terminal output directly
          console.error("[Termote WS] Failed to parse message:", e)
        }
      }

      ws.onclose = () => {
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
        console.error("WebSocket error:", error, "URL:", wsUrl, "readyState:", ws.readyState)
      }
    } catch (e) {
      console.error("Failed to create WebSocket:", e)
    }
  }, [url, token, setWebSocket, setConnected, setAuthenticated])

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
      }
    },
    [setLayout, setAuthenticated]
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
  }
}
