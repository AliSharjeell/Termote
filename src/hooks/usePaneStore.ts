import { create } from "zustand"
import type { Pane, Shell } from "@/lib/types"

const STORAGE_KEY = "termote-pinned-panes"
const VIEW_MODE_KEY = "termote-view-mode"

interface PaneState {
  panes: Pane[]
  activePanes: string[]
  floatingPanes: string[]
  selectedTab: string
  ws: WebSocket | null
  isConnected: boolean
  isAuthenticated: boolean
  // View mode: "auto", "tabs", or "panes"
  viewMode: "auto" | "tabs" | "panes"

  // Actions
  setWebSocket: (ws: WebSocket | null) => void
  setConnected: (connected: boolean) => void
  setAuthenticated: (authenticated: boolean) => void
  setLayout: (panes: Pane[], activePanes: string[], floatingPanes: string[]) => void
  spawnPane: (shell: Shell) => void
  killPane: (paneId: string) => void
  sendInput: (paneId: string, data: string) => void
  sendResize: (paneId: string, cols: number, rows: number) => void
  sendRefocus: (paneId: string, cols: number, rows: number) => void
  refocusAll: (dimensions: Record<string, { cols: number, rows: number }>) => void
  moveToFloating: (paneId: string) => void
  moveToActive: (paneId: string) => void
  selectTab: (tabId: string) => void
  setViewMode: (mode: "auto" | "tabs" | "panes") => void
  renamePane: (paneId: string, name: string) => void
  togglePin: (paneId: string) => void
  // Persistence helpers
  loadPersistedState: () => { pinnedPaneIds: string[]; viewMode: "auto" | "tabs" | "panes" }
}

// Load persisted state from localStorage
function loadPersistedState() {
  try {
    const pinnedJson = localStorage.getItem(STORAGE_KEY)
    const viewModeJson = localStorage.getItem(VIEW_MODE_KEY)
    return {
      pinnedPaneIds: pinnedJson ? JSON.parse(pinnedJson) : [],
      viewMode: (viewModeJson as "auto" | "tabs" | "panes") || "panes",
    }
  } catch {
    return { pinnedPaneIds: [], viewMode: "panes" as const }
  }
}

// Save pinned pane IDs to localStorage
function savePinnedPanes(paneIds: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paneIds))
  } catch {
    // Storage full or unavailable
  }
}

// Save view mode to localStorage
function saveViewMode(mode: "auto" | "tabs" | "panes") {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // Storage full or unavailable
  }
}

export const usePaneStore = create<PaneState>((set, get) => ({
  panes: [],
  activePanes: [],
  floatingPanes: [],
  selectedTab: "",
  ws: null,
  isConnected: false,
  isAuthenticated: false,
  viewMode: "panes",

  setWebSocket: (ws) => set({ ws }),

  setConnected: (isConnected) => set({ isConnected }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Backend is source of truth - just accept what it sends
  // Auto-select first pane when layout is set
  setLayout: (panes, activePanes, floatingPanes) => {
    const state = get()
    let selectedTab = state.selectedTab
    // Load persisted pinned pane IDs
    const persisted = loadPersistedState()
    const pinnedPaneIdSet = new Set(persisted.pinnedPaneIds)
    // Apply pinned state from localStorage
    const updatedPanes = panes.map(p => ({
      ...p,
      pinned: pinnedPaneIdSet.has(p.id),
    }))
    // Auto-select first pane if none selected or current selection is gone
    if (!selectedTab || !updatedPanes.find(p => p.id === selectedTab)) {
      selectedTab = updatedPanes.length > 0 ? updatedPanes[0].id : ""
    }
    set({ panes: updatedPanes, activePanes, floatingPanes, selectedTab })
  },

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

  sendRefocus: (paneId, cols, rows) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "refocus", pane_id: paneId, cols, rows }))
    }
  },

  refocusAll: (dimensions) => {
    const { ws, isAuthenticated, activePanes } = get()
    if (ws && isAuthenticated) {
      for (const paneId of activePanes) {
        const dims = dimensions[paneId]
        if (dims) {
          ws.send(JSON.stringify({ action: "refocus", pane_id: paneId, cols: dims.cols, rows: dims.rows }))
        }
      }
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

  selectTab: (tabId) => set({ selectedTab: tabId }),
  setViewMode: (mode) => {
    saveViewMode(mode)
    set({ viewMode: mode })
  },

  renamePane: (paneId, name) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "rename", pane_id: paneId, name }))
    }
  },

  togglePin: (paneId) => {
    const { panes } = get()
    const updatedPanes = panes.map(p =>
      p.id === paneId ? { ...p, pinned: !p.pinned } : p
    )
    // Save pinned pane IDs to localStorage
    const pinnedPaneIds = updatedPanes.filter(p => p.pinned).map(p => p.id)
    savePinnedPanes(pinnedPaneIds)
    set({ panes: updatedPanes })
  },

  loadPersistedState: () => loadPersistedState(),
}))

// Initialize view mode from localStorage
const initialPersisted = loadPersistedState()
usePaneStore.setState({ viewMode: initialPersisted.viewMode })
