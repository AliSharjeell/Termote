"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePaneStore } from "./usePaneStore"
import type { ServerMessage } from "@/lib/types"

interface UseWebSocketOptions {
  url: string | null
  token: string | null
}

export function useWebSocket({ url, token }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptRef = useRef(0)
  const [tunnelStatus, setTunnelStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle")

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
    handleGitStatus,
    handleGitLog,
    handleSourceControlState,
    handleGitReposFound,
    handlePortProcesses,
  } = usePaneStore()

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.event) {
        case "state_update":
          console.log("[Termote] state_update:", {
            panesCount: message.panes?.length,
            groupsCount: message.groups?.length,
          })
          setLayout(message.panes, message.active_panes, message.floating_panes, message.groups ?? [])
          break
        case "output":
          window.dispatchEvent(
            new CustomEvent("terminal-output", {
              detail: { paneId: message.pane_id, data: message.data },
            })
          )
          break
        case "auth_result":
          if (message.success) {
            setAuthenticated(true)
            console.log("[Termote] Authenticated!")
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ action: "get_device_list" }))
            }
          } else {
            console.error("[Termote] Authentication failed:", message.message)
          }
          break
        case "group_created":
          handleGroupCreated(message.group)
          break
        case "group_deleted":
          handleGroupDeleted(message.group_id)
          break
        case "group_renamed":
          handleGroupRenamed(message.group_id, message.name)
          break
        case "pane_group_set":
          handlePaneGroupSet(message.pane_id, message.group_id)
          break
        case "directory_picker_cancelled":
          break
        case "directory_contents":
          handleDirectoryContents(message.path, message.items)
          break
        case "device_list":
          handleDeviceList(message.devices)
          break
        case "device_kicked":
          handleDeviceKicked(message.device_id)
          break
        case "device_banned":
          handleDeviceBanned(message.ip)
          break
        case "error":
          console.error("[Termote] Error from server:", message.message)
          break
        case "file_uploaded":
          handleFileUploaded(message.pane_id, message.file_name)
          break
        case "git_status":
          handleGitStatus(message)
          break
        case "git_commit_result":
          if (message.success) {
            // Refresh git status after commit
            const { getGitStatus } = usePaneStore.getState()
            getGitStatus(message.pane_id)
          }
          break
        case "git_log":
          handleGitLog(message)
          break
        case "source_control_state":
          handleSourceControlState(message)
          break
        case "git_repos_found":
          handleGitReposFound(message.repos)
          break
        case "port_processes":
          handlePortProcesses(message.processes)
          break
      }
    },
    [setLayout, setAuthenticated, handleDirectoryContents, handleDeviceList, handleDeviceKicked, handleDeviceBanned, handleFileUploaded, handleGroupCreated, handleGroupDeleted, handleGroupRenamed, handlePaneGroupSet, handleGitStatus, handleGitLog, handleGitReposFound, handlePortProcesses]
  )

  const connect = useCallback(() => {
    if (!url) return

    // Build WebSocket URL
    let wsUrl = url
    if (wsUrl.startsWith("https://")) {
      wsUrl = "wss://" + wsUrl.slice(8)
    } else if (wsUrl.startsWith("http://")) {
      wsUrl = "ws://" + wsUrl.slice(7)
    }
    if (!wsUrl.endsWith("/ws")) {
      wsUrl = wsUrl.replace(/\/?$/, "/ws")
    }

    console.log("[Termote] Connecting to:", wsUrl, "attempt:", reconnectAttemptRef.current)
    setTunnelStatus("connecting")

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      setWebSocket(ws)

      ws.onopen = () => {
        console.log("[Termote] WebSocket connected!")
        reconnectAttemptRef.current = 0
        setConnected(true)
        setTunnelStatus("connected")
        if (token) {
          ws.send(JSON.stringify({ action: "auth", token }))
        }
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
          console.error("[Termote] Failed to parse message:", e)
        }
      }

      ws.onclose = (event) => {
        console.log("[Termote] WebSocket closed, code:", event.code, "reason:", event.reason)
        setConnected(false)
        setAuthenticated(false)
        setWebSocket(null)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
        reconnectAttemptRef.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current - 1), 15000)

        if (reconnectAttemptRef.current > 5) {
          setTunnelStatus("failed")
        }

        console.log(`[Termote] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      ws.onerror = (error) => {
        console.error("[Termote] WebSocket error:", error, "readyState:", ws.readyState)
      }
    } catch (e) {
      console.error("[Termote] Failed to create WebSocket:", e)
      setTunnelStatus("failed")
    }
  }, [url, token, setWebSocket, setConnected, setAuthenticated, handleMessage])

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
    reconnect: () => {
      reconnectAttemptRef.current = 0
      setTunnelStatus("idle")
      disconnect()
      setTimeout(connect, 100)
    },
    tunnelStatus,
  }
}
