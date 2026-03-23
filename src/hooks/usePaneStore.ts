import { create } from "zustand"
import type { Pane, PaneGroup, Shell } from "@/lib/types"

const STORAGE_KEY = "termote-pinned-panes"
const VIEW_MODE_KEY = "termote-view-mode"
const PANE_GROUPS_KEY = "termote-pane-groups-map"

const GROUP_COLORS = [
  "#E44", // red
  "#4A4", // green
  "#44A", // blue
  "#AA4", // yellow
  "#A4A", // purple
  "#4AA", // cyan
  "#FA0", // orange
  "#0AF", // light blue
]

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
  // Pane groups
  groups: PaneGroup[]
  selectedGroupId: string | null

  // Actions
  setWebSocket: (ws: WebSocket | null) => void
  setConnected: (connected: boolean) => void
  setAuthenticated: (authenticated: boolean) => void
  setLayout: (panes: Pane[], activePanes: string[], floatingPanes: string[], groups?: PaneGroup[]) => void
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
  // Group actions
  createGroup: (name: string) => string
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  setPaneGroup: (paneId: string, groupId: string | null) => void
  selectGroup: (groupId: string | null) => void
  // Backend group event handlers
  handleGroupCreated: (group: PaneGroup) => void
  handleGroupDeleted: (groupId: string) => void
  handleGroupRenamed: (groupId: string, name: string) => void
  handlePaneGroupSet: (paneId: string, groupId: string | null) => void
  // Persistence helpers
  loadPersistedState: () => { pinnedPaneIds: string[]; viewMode: "auto" | "tabs" | "panes"; paneGroupMap: Record<string, string> }
}

// Load persisted state from localStorage
function loadPersistedState() {
  try {
    const pinnedJson = localStorage.getItem(STORAGE_KEY)
    const viewModeJson = localStorage.getItem(VIEW_MODE_KEY)
    const paneGroupsJson = localStorage.getItem(PANE_GROUPS_KEY)
    return {
      pinnedPaneIds: pinnedJson ? JSON.parse(pinnedJson) : [],
      viewMode: (viewModeJson as "auto" | "tabs" | "panes") || "panes",
      paneGroupMap: paneGroupsJson ? JSON.parse(paneGroupsJson) : {},
    }
  } catch {
    return { pinnedPaneIds: [], viewMode: "panes" as const, paneGroupMap: {} }
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

// Save pane group map to localStorage
function savePaneGroupMap(paneGroupMap: Record<string, string>) {
  try {
    localStorage.setItem(PANE_GROUPS_KEY, JSON.stringify(paneGroupMap))
  } catch {
    // Storage full or unavailable
  }
}

// Get pane groupId from localStorage
export function getPaneGroupIdFromStorage(paneId: string): string | null {
  try {
    const paneGroupsJson = localStorage.getItem(PANE_GROUPS_KEY)
    if (paneGroupsJson) {
      const paneGroupMap = JSON.parse(paneGroupsJson)
      return paneGroupMap[paneId] || null
    }
  } catch {
    // Ignore
  }
  return null
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
  groups: [],
  selectedGroupId: null,

  setWebSocket: (ws) => set({ ws }),

  setConnected: (isConnected) => set({ isConnected }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Backend is source of truth - just accept what it sends
  // Auto-select first pane when layout is set
  setLayout: (panes, activePanes, floatingPanes, groups) => {
    const state = get()
    let selectedTab = state.selectedTab
    // Load persisted pinned pane IDs
    const persisted = loadPersistedState()
    const pinnedPaneIdSet = new Set(persisted.pinnedPaneIds)
    // Apply pinned state from localStorage, use groupId from backend or localStorage
    const updatedPanes = panes.map(p => ({
      ...p,
      pinned: pinnedPaneIdSet.has(p.id),
      // Restore groupId from localStorage if backend doesn't provide it
      groupId: p.groupId ?? persisted.paneGroupMap[p.id] ?? null,
    }))
    // Auto-select first pane if none selected or current selection is gone
    if (!selectedTab || !updatedPanes.find(p => p.id === selectedTab)) {
      selectedTab = updatedPanes.length > 0 ? updatedPanes[0].id : ""
    }
    // Use groups from backend if provided, otherwise keep existing
    // Also preserve existing groups if backend sends empty array (backend might not persist groups)
    const hasGroups = groups && groups.length > 0
    set({
      panes: updatedPanes,
      activePanes,
      floatingPanes,
      selectedTab,
      groups: hasGroups ? groups : state.groups
    })
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

  createGroup: (name) => {
    const { groups, ws, isAuthenticated } = get()
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length]
    // Send to backend
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "create_group", id, name, color }))
    }
    // Optimistically update local state
    const newGroup: PaneGroup = { id, name, color }
    const updatedGroups = [...groups, newGroup]
    set({ groups: updatedGroups })
    return id
  },

  deleteGroup: (groupId) => {
    console.log("[Termote Store] deleteGroup called with:", groupId)
    const { groups, panes, ws, isAuthenticated } = get()
    // Send to backend
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "delete_group", group_id: groupId }))
    }
    // Optimistically update local state
    const updatedGroups = groups.filter(g => g.id !== groupId)
    const updatedPanes = panes.map(p =>
      p.groupId === groupId ? { ...p, groupId: null } : p
    )
    set({
      groups: updatedGroups,
      panes: updatedPanes,
      selectedGroupId: get().selectedGroupId === groupId ? null : get().selectedGroupId,
    })
  },

  renameGroup: (groupId, name) => {
    const { groups, ws, isAuthenticated } = get()
    // Send to backend
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "rename_group", group_id: groupId, name }))
    }
    // Optimistically update local state
    const updatedGroups = groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    )
    set({ groups: updatedGroups })
  },

  setPaneGroup: (paneId, groupId) => {
    const { panes, ws, isAuthenticated } = get()
    // Send to backend
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "set_pane_group", pane_id: paneId, group_id: groupId }))
    }
    // Optimistically update local state
    const updatedPanes = panes.map(p =>
      p.id === paneId ? { ...p, groupId } : p
    )
    set({ panes: updatedPanes })
    // Persist pane-group association to localStorage
    const persisted = loadPersistedState()
    const paneGroupMap = { ...persisted.paneGroupMap }
    if (groupId) {
      paneGroupMap[paneId] = groupId
    } else {
      delete paneGroupMap[paneId]
    }
    savePaneGroupMap(paneGroupMap)
  },

  selectGroup: (groupId) => {
    console.log("[Termote Store] selectGroup called with:", groupId)
    set({ selectedGroupId: groupId })
  },

  handleGroupCreated: (group) => {
    const { groups } = get()
    // Avoid duplicates
    if (!groups.find(g => g.id === group.id)) {
      set({ groups: [...groups, group] })
    }
  },

  handleGroupDeleted: (groupId) => {
    const { groups, panes, selectedGroupId } = get()
    const updatedGroups = groups.filter(g => g.id !== groupId)
    const updatedPanes = panes.map(p =>
      p.groupId === groupId ? { ...p, groupId: null } : p
    )
    set({
      groups: updatedGroups,
      panes: updatedPanes,
      selectedGroupId: selectedGroupId === groupId ? null : selectedGroupId,
    })
    // Update localStorage - remove all panes in this group from the map
    const persisted = loadPersistedState()
    const paneGroupMap = { ...persisted.paneGroupMap }
    for (const paneId of Object.keys(paneGroupMap)) {
      if (paneGroupMap[paneId] === groupId) {
        delete paneGroupMap[paneId]
      }
    }
    savePaneGroupMap(paneGroupMap)
  },

  handleGroupRenamed: (groupId, name) => {
    const { groups } = get()
    const updatedGroups = groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    )
    set({ groups: updatedGroups })
  },

  handlePaneGroupSet: (paneId, groupId) => {
    const { panes } = get()
    const updatedPanes = panes.map(p =>
      p.id === paneId ? { ...p, groupId } : p
    )
    set({ panes: updatedPanes })
    // Sync to localStorage
    const persisted = loadPersistedState()
    const paneGroupMap = { ...persisted.paneGroupMap }
    if (groupId) {
      paneGroupMap[paneId] = groupId
    } else {
      delete paneGroupMap[paneId]
    }
    savePaneGroupMap(paneGroupMap)
  },

  loadPersistedState: () => loadPersistedState(),
}))

// Initialize view mode from localStorage
const initialPersisted = loadPersistedState()
usePaneStore.setState({ viewMode: initialPersisted.viewMode })
