import { create } from "zustand"
import type { Pane, Shell } from "@/lib/types"

interface PaneState {
  panes: Pane[]
  activePanes: string[]
  floatingPanes: string[]
  selectedTab: string
  ws: WebSocket | null
  isConnected: boolean
  isAuthenticated: boolean

  // Actions
  setWebSocket: (ws: WebSocket | null) => void
  setConnected: (connected: boolean) => void
  setAuthenticated: (authenticated: boolean) => void
  setLayout: (panes: Pane[], activePanes: string[], floatingPanes: string[]) => void
  spawnPane: (shell: Shell) => void
  killPane: (paneId: string) => void
  sendInput: (paneId: string, data: string) => void
  sendResize: (paneId: string, cols: number, rows: number) => void
  moveToFloating: (paneId: string) => void
  moveToActive: (paneId: string) => void
}

export const usePaneStore = create<PaneState>((set, get) => ({
  panes: [],
  activePanes: [],
  floatingPanes: [],
  selectedTab: "",
  ws: null,
  isConnected: false,
  isAuthenticated: false,

  setWebSocket: (ws) => set({ ws }),

  setConnected: (isConnected) => set({ isConnected }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Backend is source of truth - just accept what it sends
  setLayout: (panes, activePanes, floatingPanes) =>
    set({ panes, activePanes, floatingPanes }),

  spawnPane: (shell) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "spawn", shell }))
    }
  },

  killPane: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "kill", pane_id: paneId }))
    }
  },

  sendInput: (paneId, data) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "input", pane_id: paneId, data }))
    }
  },

  sendResize: (paneId, cols, rows) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "resize", pane_id: paneId, cols, rows }))
    }
  },

  moveToFloating: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "move_to_floating", pane_id: paneId }))
    }
  },

  moveToActive: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "move_to_active", pane_id: paneId }))
    }
  },
}))
