"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePaneStore } from "./usePaneStore"
import type { ServerMessage, StateUpdate, OutputEvent, AuthResult } from "@/lib/types"

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
    setPanes,
    addPane,
    removePane,
  } = usePaneStore()

  const connect = useCallback(() => {
    if (!url) return

    try {
      const ws = new WebSocket(url)
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
          handleMessage(message)
        } catch (e) {
          // If not JSON, it might be terminal output directly
          console.error("Failed to parse message:", e)
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
        console.error("WebSocket error:", error)
      }
    } catch (e) {
      console.error("Failed to create WebSocket:", e)
    }
  }, [url, token, setWebSocket, setConnected, setAuthenticated])

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.event) {
        case "state_update":
          setPanes(message.panes)
          break
        case "output":
          // This is handled by the individual XtermPane components
          // via a custom event or callback mechanism
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
          } else {
            console.error("Authentication failed:", message.message)
          }
          break
      }
    },
    [setPanes, setAuthenticated]
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
