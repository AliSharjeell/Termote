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
  setPanes: (panes: Pane[]) => void
  addPane: (pane: Pane) => void
  removePane: (paneId: string) => void
  selectTab: (paneId: string) => void
  moveToFloating: (paneId: string) => void
  moveToActive: (paneId: string) => void
  spawnPane: (shell: Shell) => void
  killPane: (paneId: string) => void
  sendInput: (paneId: string, data: string) => void
  sendResize: (paneId: string, cols: number, rows: number) => void
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

  setPanes: (panes) => set((state) => {
    console.log("setPanes called with", panes.length, "panes")
    // Auto-populate activePanes if empty and we have panes - only add first one
    let newActivePanes = state.activePanes
    if (newActivePanes.length === 0 && panes.length > 0) {
      newActivePanes = [panes[0].id]
      console.log("Auto-populated activePanes with first pane:", panes[0].id)
    } else {
      // Add any new panes that aren't already in activePanes
      const panesToAdd = panes.filter(p => !newActivePanes.includes(p.id))
      if (panesToAdd.length > 0) {
        console.log("Adding new panes to activePanes:", panesToAdd.map(p => p.id))
        newActivePanes = [...newActivePanes, ...panesToAdd.map(p => p.id)]
      }
    }
    console.log("Final activePanes:", newActivePanes)
    return { panes, activePanes: newActivePanes }
  }),

  addPane: (pane) =>
    set((state) => ({
      panes: [...state.panes, pane],
      activePanes: [...state.activePanes, pane.id],
    })),

  removePane: (paneId) =>
    set((state) => ({
      panes: state.panes.filter((p) => p.id !== paneId),
      activePanes: state.activePanes.filter((id) => id !== paneId),
      floatingPanes: state.floatingPanes.filter((id) => id !== paneId),
      selectedTab:
        state.selectedTab === paneId
          ? state.floatingPanes[0] || state.activePanes[0] || ""
          : state.selectedTab,
    })),

  selectTab: (paneId) => set({ selectedTab: paneId }),

  moveToFloating: (paneId) =>
    set((state) => ({
      activePanes: state.activePanes.filter((id) => id !== paneId),
      floatingPanes: [...state.floatingPanes, paneId],
      selectedTab: paneId,
    })),

  moveToActive: (paneId) =>
    set((state) => ({
      floatingPanes: state.floatingPanes.filter((id) => id !== paneId),
      activePanes: [...state.activePanes, paneId],
    })),

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
}))
