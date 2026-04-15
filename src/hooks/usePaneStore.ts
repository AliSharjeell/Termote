import { create } from "zustand"
import type { Pane, PaneGroup, Shell, DeviceInfo, DirectoryItem } from "@/lib/types"
import type { Terminal } from "@xterm/xterm"

const STORAGE_KEY = "termote-pinned-panes"
const VIEW_MODE_KEY = "termote-view-mode"
const SIDEBAR_KEY = "termote-sidebar-collapsed"
const GIT_SIDEBAR_KEY = "termote-git-sidebar-collapsed"
const TABS_SIDEBAR_KEY = "termote-tabs-sidebar-collapsed"
const TABS_GIT_SIDEBAR_KEY = "termote-tabs-git-sidebar-collapsed"
const PANE_GROUPS_KEY = "termote-pane-groups-map"
const SELECTED_GROUP_KEY = "termote-selected-group"
const AI_COMMAND_KEY = "termote-ai-command"
const PANES_KEY = "termote-panes"
const ACTIVE_PANES_KEY = "termote-active-panes"
const FLOATING_PANES_KEY = "termote-floating-panes"
const SELECTED_TAB_KEY = "termote-selected-tab"
const GROUPS_KEY = "termote-groups"
const SOURCE_CONTROL_REPOS_KEY = "termote-source-control-repos"
const SOURCE_CONTROL_SELECTED_KEY = "termote-source-control-selected"

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
  // Sidebar collapse states (panes mode)
  sidebarCollapsed: boolean
  gitSidebarCollapsed: boolean
  // Sidebar collapse states (tabs mode)
  tabsSidebarCollapsed: boolean
  tabsGitSidebarCollapsed: boolean
  // Pane groups
  groups: PaneGroup[]
  selectedGroupId: string | null
  // Device management
  devices: DeviceInfo[]
  showSecurityModal: boolean
  // File explorer state
  explorerOpen: boolean
  imagePickerOpen: boolean
  browserModalOpen: boolean
  explorerCurrentPath: string
  explorerContents: DirectoryItem[]
  // Git status per pane
  gitStatuses: Record<string, {
    pane_id: string
    dir: string
    is_repo: boolean
    branch: string | null
    staged: string[]
    unstaged: string[]
    untracked: string[]
    ahead: number | null
    behind: number | null
  }>
  // Git log per pane
  gitLogs: Record<string, {
    pane_id: string
    dir: string
    commits: Array<{
      hash: string
      short_hash: string
      message: string
      author: string
      date: string
    }>
  }>
  // Source control state (keyed by path)
  sourceControlStates: Record<string, {
    path: string
    is_repo: boolean
    branch: string | null
    remote: string | null
    staged: Array<{ path: string; status: string; added?: number; deleted?: number }>
    unstaged: Array<{ path: string; status: string; added?: number; deleted?: number }>
    untracked: Array<{ path: string; status: string }>
    ahead: number
    behind: number
    outgoing_commits: Array<{
      hash: string
      short_hash: string
      message: string
      author: string
      date: string
    }>
  }>
  // Git repos found in current directory
  sourceControlRepos: Array<{
    path: string
    name: string
    branch: string | null
  }>
  // Selected source control repo path
  selectedSourceControlRepo: string | null
  // Lazygit terminal instances keyed by pane ID (for embedded sidebar rendering)
  lazygitTerminals: Record<string, { terminal: Terminal }>
  // The actual pane ID of the spawned lazygit (set when LazygitSpawned event arrives)
  lazySidebarPaneId: string | null
  // Port manager
  portProcesses: Array<{
    port: number
    pid: number
    process_name: string
    cwd?: string
  }>

  // AI CLI command
  aiCommand: string

  // Actions
  setWebSocket: (ws: WebSocket | null) => void
  setConnected: (connected: boolean) => void
  setAuthenticated: (authenticated: boolean) => void
  setLayout: (panes: Pane[], activePanes: string[], floatingPanes: string[], groups?: PaneGroup[]) => void
  spawnPane: (shell: Shell) => void
  spawnNotePane: () => void
  spawnImagePane: () => void
  spawnWhiteboardPane: () => void
  requestDirectoryPicker: (shell: Shell) => void
  killPane: (paneId: string) => void
  sendInput: (paneId: string, data: string) => void
  sendResize: (paneId: string, cols: number, rows: number) => void
  sendRefocus: (paneId: string, cols: number, rows: number) => void
  updatePaneContent: (paneId: string, noteContent?: string, whiteboardData?: string, imageData?: string) => void
  refocusAll: (dimensions: Record<string, { cols: number, rows: number }>) => void
  moveToFloating: (paneId: string) => void
  moveToActive: (paneId: string) => void
  selectTab: (tabId: string) => void
  setViewMode: (mode: "auto" | "tabs" | "panes") => void
  toggleSidebar: () => void
  toggleGitSidebar: () => void
  toggleTabsSidebar: () => void
  toggleTabsGitSidebar: () => void
  fetchPortProcesses: () => void
  killProcess: (pid: number) => void
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
  // Device management actions
  requestDeviceList: () => void
  kickDevice: (deviceId: string) => void
  banDevice: (ip: string) => void
  handleDeviceList: (devices: DeviceInfo[]) => void
  handleDeviceKicked: (deviceId: string) => void
  handleDeviceBanned: (ip: string) => void
  setShowSecurityModal: (show: boolean) => void
  // File explorer actions
  openExplorer: () => void
  openBrowser: (url: string) => void
  openBrowserModal: () => void
  closeBrowserModal: () => void
  spawnBrowserPane: (url: string) => void
  closeExplorer: () => void
  openImagePicker: () => void
  closeImagePicker: () => void
  fetchDirectory: (path: string) => void
  handleDirectoryContents: (path: string, items: DirectoryItem[]) => void
  spawnAtDirectory: (dir: string) => void
  // File transfer actions
  uploadFile: (paneId: string, fileName: string, data: string) => void
  handleFileUploaded: (paneId: string, fileName: string) => void
  setPaneContent: (paneId: string, noteContent: string | null, whiteboardData: string | null, imageData: string | null) => void
  readImageFile: (absolute_path: string) => void
  handleImageFileRead: (result: { success: boolean; absolute_path: string; data?: string; error?: string }) => void
  // Git actions
  getGitStatus: (paneId: string) => void
  gitCommit: (paneId: string, message: string) => void
  gitStage: (paneId: string, files: string[], unstage: boolean) => void
  gitPush: (paneId: string) => void
  gitPull: (paneId: string) => void
  gitLog: (paneId: string, dir: string) => void
  spawnLazygit: (paneId: string, cwd: string) => void
  getSourceControlState: (path: string) => void
  findGitRepos: (path: string) => void
  setSelectedSourceControlRepo: (path: string | null) => void
  handleGitReposFound: (repos: Array<{path: string; name: string; branch: string | null}>) => void
  setLazygitTerminal: (paneId: string, terminal: Terminal) => void
  removeLazygitTerminal: (paneId: string) => void
  setLazygitSidebarPaneId: (paneId: string | null) => void
  handlePortProcesses: (processes: Array<{port: number; pid: number; process_name: string; cwd?: string}>) => void
  handleProcessKilled: (pid: number, success: boolean) => void
  handleGitStatus: (status: {
    pane_id: string
    dir: string
    is_repo: boolean
    branch: string | null
    staged: string[]
    unstaged: string[]
    untracked: string[]
    ahead: number | null
    behind: number | null
  }) => void
  handleSourceControlState: (state: {
    path: string
    is_repo: boolean
    branch: string | null
    remote: string | null
    staged: Array<{ path: string; status: string }>
    unstaged: Array<{ path: string; status: string }>
    untracked: Array<{ path: string; status: string }>
    ahead: number
    behind: number
    outgoing_commits: Array<{
      hash: string
      short_hash: string
      message: string
      author: string
      date: string
    }>
  }) => void
  handleGitLog: (log: {
    pane_id: string
    dir: string
    commits: Array<{
      hash: string
      short_hash: string
      message: string
      author: string
      date: string
    }>
  }) => void
  // AI settings
  setAiCommand: (command: string) => void
  // Persistence helpers
  loadPersistedState: () => { pinnedPaneIds: string[]; viewMode: "auto" | "tabs" | "panes"; paneGroupMap: Record<string, string> }
}

// Load persisted state from localStorage
function loadPersistedState() {
  if (typeof window === 'undefined') {
    return { pinnedPaneIds: [], viewMode: "panes" as const, paneGroupMap: {}, selectedGroupId: null, sidebarCollapsed: false, gitSidebarCollapsed: false, tabsSidebarCollapsed: false, tabsGitSidebarCollapsed: false }
  }
  try {
    const pinnedJson = localStorage.getItem(STORAGE_KEY)
    const viewModeJson = localStorage.getItem(VIEW_MODE_KEY)
    const paneGroupsJson = localStorage.getItem(PANE_GROUPS_KEY)
    const selectedGroupJson = localStorage.getItem(SELECTED_GROUP_KEY)
    const sidebarJson = localStorage.getItem(SIDEBAR_KEY)
    const gitSidebarJson = localStorage.getItem(GIT_SIDEBAR_KEY)
    const tabsSidebarJson = localStorage.getItem(TABS_SIDEBAR_KEY)
    const tabsGitSidebarJson = localStorage.getItem(TABS_GIT_SIDEBAR_KEY)
    const tabsViewMode = (viewModeJson as "auto" | "tabs" | "panes") || "panes"
    return {
      pinnedPaneIds: pinnedJson ? JSON.parse(pinnedJson) : [],
      viewMode: tabsViewMode,
      paneGroupMap: paneGroupsJson ? JSON.parse(paneGroupsJson) : {},
      selectedGroupId: selectedGroupJson || null,
      sidebarCollapsed: sidebarJson === "true",
      gitSidebarCollapsed: gitSidebarJson === "true",
      // For tabs mode, default to collapsed unless explicitly saved
      tabsSidebarCollapsed: tabsSidebarJson ? tabsSidebarJson === "true" : tabsViewMode === "tabs",
      tabsGitSidebarCollapsed: tabsGitSidebarJson ? tabsGitSidebarJson === "true" : tabsViewMode === "tabs",
    }
  } catch {
    return { pinnedPaneIds: [], viewMode: "panes" as const, paneGroupMap: {}, selectedGroupId: null, sidebarCollapsed: false, gitSidebarCollapsed: false, tabsSidebarCollapsed: false, tabsGitSidebarCollapsed: false }
  }
}

// Load selected group ID from localStorage
function loadSelectedGroup(): string | null {
  try {
    return localStorage.getItem(SELECTED_GROUP_KEY)
  } catch {
    return null
  }
}

// Save selected group ID to localStorage
function saveSelectedGroup(groupId: string | null) {
  try {
    if (groupId === null) {
      localStorage.removeItem(SELECTED_GROUP_KEY)
    } else {
      localStorage.setItem(SELECTED_GROUP_KEY, groupId)
    }
  } catch {
    // Storage full or unavailable
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

// Load persisted AI command from localStorage
function loadAiCommand() {
  try {
    return localStorage.getItem(AI_COMMAND_KEY) || "claude"
  } catch {
    return "claude"
  }
}

// Save AI command to localStorage
function saveAiCommand(command: string) {
  try {
    localStorage.setItem(AI_COMMAND_KEY, command)
  } catch {
    // Storage full or unavailable
  }
}

// Load panes from localStorage
function loadPanes(): Pane[] {
  try {
    const panesJson = localStorage.getItem(PANES_KEY)
    return panesJson ? JSON.parse(panesJson) : []
  } catch {
    return []
  }
}

// Save panes to localStorage
function savePanes(panes: Pane[]) {
  try {
    localStorage.setItem(PANES_KEY, JSON.stringify(panes))
  } catch {
    // Storage full or unavailable
  }
}

// Load active panes from localStorage
function loadActivePanes(): string[] {
  try {
    const activeJson = localStorage.getItem(ACTIVE_PANES_KEY)
    return activeJson ? JSON.parse(activeJson) : []
  } catch {
    return []
  }
}

// Save active panes to localStorage
function saveActivePanes(activePanes: string[]) {
  try {
    localStorage.setItem(ACTIVE_PANES_KEY, JSON.stringify(activePanes))
  } catch {
    // Storage full or unavailable
  }
}

// Load floating panes from localStorage
function loadFloatingPanes(): string[] {
  try {
    const floatingJson = localStorage.getItem(FLOATING_PANES_KEY)
    return floatingJson ? JSON.parse(floatingJson) : []
  } catch {
    return []
  }
}

// Save floating panes to localStorage
function saveFloatingPanes(floatingPanes: string[]) {
  try {
    localStorage.setItem(FLOATING_PANES_KEY, JSON.stringify(floatingPanes))
  } catch {
    // Storage full or unavailable
  }
}

// Load selected tab from localStorage
function loadSelectedTab(): string {
  try {
    return localStorage.getItem(SELECTED_TAB_KEY) || ""
  } catch {
    return ""
  }
}

// Save selected tab to localStorage
function saveSelectedTab(tabId: string) {
  try {
    localStorage.setItem(SELECTED_TAB_KEY, tabId)
  } catch {
    // Storage full or unavailable
  }
}

// Load groups from localStorage
function loadGroups(): PaneGroup[] {
  try {
    const groupsJson = localStorage.getItem(GROUPS_KEY)
    return groupsJson ? JSON.parse(groupsJson) : []
  } catch {
    return []
  }
}

// Save groups to localStorage
function saveGroups(groups: PaneGroup[]) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
  } catch {
    // Storage full or unavailable
  }
}

// Load source control repos from localStorage
function loadSourceControlRepos() {
  try {
    const json = localStorage.getItem(SOURCE_CONTROL_REPOS_KEY)
    return json ? JSON.parse(json) : []
  } catch {
    return []
  }
}

// Save source control repos to localStorage
function saveSourceControlRepos(repos: Array<{path: string; name: string; branch: string | null}>) {
  try {
    localStorage.setItem(SOURCE_CONTROL_REPOS_KEY, JSON.stringify(repos))
  } catch {
    // Storage full or unavailable
  }
}

// Load selected source control repo from localStorage
function loadSourceControlSelected(): string | null {
  try {
    return localStorage.getItem(SOURCE_CONTROL_SELECTED_KEY)
  } catch {
    return null
  }
}

// Save selected source control repo to localStorage
function saveSourceControlSelected(path: string | null) {
  try {
    if (path) {
      localStorage.setItem(SOURCE_CONTROL_SELECTED_KEY, path)
    } else {
      localStorage.removeItem(SOURCE_CONTROL_SELECTED_KEY)
    }
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
  panes: loadPanes(),
  activePanes: loadActivePanes(),
  floatingPanes: loadFloatingPanes(),
  selectedTab: loadSelectedTab(),
  ws: null,
  isConnected: false,
  isAuthenticated: false,
  viewMode: "auto",
  sidebarCollapsed: false,
  gitSidebarCollapsed: false,
  tabsSidebarCollapsed: false,
  tabsGitSidebarCollapsed: false,
  groups: loadGroups(),
  selectedGroupId: null,
  devices: [],
  showSecurityModal: false,
  explorerOpen: false,
  imagePickerOpen: false,
  browserModalOpen: false,
  explorerCurrentPath: "",
  explorerContents: [],
  gitStatuses: {},
  gitLogs: {},
  sourceControlStates: {},
  sourceControlRepos: loadSourceControlRepos(),
  selectedSourceControlRepo: loadSourceControlSelected(),
  lazygitTerminals: {},
  lazySidebarPaneId: null,
  portProcesses: [],
  aiCommand: loadAiCommand(),

  setWebSocket: (ws) => set({ ws }),

  setConnected: (isConnected) => set({ isConnected }),

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  // Backend is source of truth - just accept what it sends
  // Auto-select first pane when layout is set
  setLayout: (panes, activePanes, floatingPanes, groups) => {
    const state = get()
    let selectedTab = state.selectedTab

    // Preserve frontend-only panes (browser, note, image, whiteboard) - they don't come from backend
    const frontendPanes = state.panes.filter(p => p.url != null || ["note", "image", "whiteboard"].includes(p.shell))
    const backendPaneIds = new Set(panes.map(p => p.id))
    const survivingFrontendPanes = frontendPanes.filter(p => backendPaneIds.has(p.id) || state.activePanes.includes(p.id))

    // Load persisted pinned pane IDs
    const persisted = loadPersistedState()
    const pinnedPaneIdSet = new Set(persisted.pinnedPaneIds)
    // Apply pinned state from localStorage, use groupId from backend or localStorage
    const updatedPanes = [...survivingFrontendPanes, ...panes.map(p => ({
      ...p,
      pinned: pinnedPaneIdSet.has(p.id),
      // Restore groupId from localStorage if backend doesn't provide it
      groupId: p.groupId ?? persisted.paneGroupMap[p.id] ?? null,
      // Preserve url and proxyUrl if this pane has one
      url: state.panes.find(sp => sp.id === p.id)?.url ?? p.url,
      proxyUrl: state.panes.find(sp => sp.id === p.id)?.proxyUrl ?? p.proxyUrl,
    }))]
    // Auto-select the last pane if count increased (new pane spawned) and current selection is gone
    const prevPaneCount = state.panes.length
    if (!selectedTab || !updatedPanes.find(p => p.id === selectedTab)) {
      // If we had fewer panes before and now have more, select the last one (newest)
      if (panes.length > prevPaneCount && panes.length > 0) {
        selectedTab = panes[panes.length - 1].id
      } else {
        selectedTab = updatedPanes.length > 0 ? updatedPanes[0].id : ""
      }
    }
    // Use groups from backend if provided, otherwise keep existing
    // Also preserve existing groups if backend sends empty array (backend might not persist groups)
    const hasGroups = groups && groups.length > 0
    const finalGroups = hasGroups ? groups : state.groups
    // Preserve ALL frontend panes that exist in state.panes (note, image, whiteboard, browser)
    // They don't come from backend so we always keep them
    const frontendPaneIds = frontendPanes.map(p => p.id)
    const mergedActivePanes = [...new Set([...activePanes, ...frontendPaneIds])]
    // Prune repos whose cwd is no longer used by any open pane
    const remainingCwds = new Set(
      updatedPanes
        .filter(p => mergedActivePanes.includes(p.id) && p.cwd)
        .map(p => p.cwd!)
    )
    const updatedRepos = state.sourceControlRepos.filter(r => remainingCwds.has(r.path))
    // If selected repo was removed, switch to another
    let newSelected = state.selectedSourceControlRepo
    if (newSelected && !updatedRepos.find(r => r.path === newSelected)) {
      newSelected = updatedRepos.length > 0 ? updatedRepos[0].path : null
      saveSourceControlSelected(newSelected)
    }
    // Persist panes and groups to localStorage
    savePanes(updatedPanes)
    saveActivePanes(mergedActivePanes)
    saveFloatingPanes(floatingPanes)
    saveSelectedTab(selectedTab)
    saveGroups(finalGroups)
    set({
      panes: updatedPanes,
      activePanes: mergedActivePanes,
      floatingPanes,
      selectedTab,
      groups: finalGroups,
      sourceControlRepos: updatedRepos,
      selectedSourceControlRepo: newSelected,
    })
  },

  spawnPane: (shell) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "spawn", shell }))
    }
  },

  spawnNotePane: () => {
    const { panes, activePanes } = get()
    const id = `note-${Date.now()}`
    const newPane: Pane = {
      id,
      pid: 0,
      shell: "note" as any,
      name: "Untitled Note",
      cols: 80,
      rows: 24,
    }
    const updatedPanes = [...panes, newPane]
    set({
      panes: updatedPanes,
      activePanes: [...activePanes, id],
      selectedTab: id,
    })
    savePanes(updatedPanes)
    saveActivePanes([...activePanes, id])
    saveSelectedTab(id)
  },

  spawnImagePane: () => {
    const { panes, activePanes } = get()
    const id = `image-${Date.now()}`
    const newPane: Pane = {
      id,
      pid: 0,
      shell: "image",
      name: "Image Viewer",
      cols: 80,
      rows: 24,
    }
    const updatedPanes = [...panes, newPane]
    set({
      panes: updatedPanes,
      activePanes: [...activePanes, id],
      selectedTab: id,
    })
    savePanes(updatedPanes)
    saveActivePanes([...activePanes, id])
    saveSelectedTab(id)
  },

  spawnWhiteboardPane: () => {
    const { panes, activePanes } = get()
    const id = `whiteboard-${Date.now()}`
    const newPane: Pane = {
      id,
      pid: 0,
      shell: "whiteboard",
      name: "Whiteboard",
      cols: 80,
      rows: 24,
    }
    const updatedPanes = [...panes, newPane]
    set({
      panes: updatedPanes,
      activePanes: [...activePanes, id],
      selectedTab: id,
    })
    savePanes(updatedPanes)
    saveActivePanes([...activePanes, id])
    saveSelectedTab(id)
  },

  requestDirectoryPicker: (shell) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "request_directory_picker", shell }))
    }
  },

  killPane: (paneId) => {
    const { ws, isAuthenticated, panes, sourceControlRepos, selectedSourceControlRepo } = get()
    const pane = panes.find(p => p.id === paneId)
    const paneCwd = pane?.cwd
    // Frontend-only panes: browser, note, image, whiteboard have no backend process
    const isFrontendOnly = pane?.url != null ||
      pane?.shell === "note" ||
      pane?.shell === "image" ||
      pane?.shell === "whiteboard"
    if (isFrontendOnly) {
      const updatedPanes = panes.filter(p => p.id !== paneId)
      const updatedActivePanes = get().activePanes.filter(id => id !== paneId)
      // Remove repos whose cwd is no longer used by any open pane
      const remainingCwds = new Set(
        updatedPanes
          .filter(p => get().activePanes.includes(p.id) && p.cwd)
          .map(p => p.cwd!)
      )
      const updatedRepos = sourceControlRepos.filter(r => remainingCwds.has(r.path))
      // If selected repo was removed, switch to another
      let newSelected = selectedSourceControlRepo
      if (newSelected && !updatedRepos.find(r => r.path === newSelected)) {
        newSelected = updatedRepos.length > 0 ? updatedRepos[0].path : null
        saveSourceControlSelected(newSelected)
      }
      set({ panes: updatedPanes, activePanes: updatedActivePanes, sourceControlRepos: updatedRepos, selectedSourceControlRepo: newSelected })
      savePanes(updatedPanes)
      saveActivePanes(updatedActivePanes)
    }
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "kill", pane_id: paneId }))
    }
  },

  sendInput: (paneId, data) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      // Windows ConPTY has limited input buffer (~16KB).
      // Large pastes get truncated if sent as a single chunk.
      // Chunk into 512-byte pieces with small delays to avoid buffer overflow.
      const CHUNK_SIZE = 512
      const CHUNK_DELAY_MS = 5

      if (data.length <= CHUNK_SIZE) {
        // Small input: send directly
        ws.send(JSON.stringify({ action: "input", pane_id: paneId, data }))
      } else {
        // Large input: chunk and send with delays
        const chunks: string[] = []
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          chunks.push(data.slice(i, i + CHUNK_SIZE))
        }

        // Send first chunk immediately
        ws.send(JSON.stringify({ action: "input", pane_id: paneId, data: chunks[0] }))

        // Send remaining chunks with small delays
        let delay = CHUNK_DELAY_MS
        for (let i = 1; i < chunks.length; i++) {
          setTimeout(() => {
            const { ws: wsNow, isAuthenticated: authNow } = get()
            if (wsNow && authNow) {
              wsNow.send(JSON.stringify({ action: "input", pane_id: paneId, data: chunks[i] }))
            }
          }, delay)
          delay += CHUNK_DELAY_MS
        }
      }
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

  updatePaneContent: (paneId, noteContent, whiteboardData, imageData) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "update_pane_content", pane_id: paneId, note_content: noteContent ?? null, whiteboard_data: whiteboardData ?? null, image_data: imageData ?? null }))
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

  selectTab: (tabId) => {
    saveSelectedTab(tabId)
    set({ selectedTab: tabId })
  },
  setViewMode: (mode) => {
    saveViewMode(mode)
    set({ viewMode: mode })
  },

  toggleSidebar: () => {
    set(state => {
      const next = !state.sidebarCollapsed
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next))
      } catch {}
      return { sidebarCollapsed: next }
    })
  },

  toggleGitSidebar: () => {
    set(state => {
      const next = !state.gitSidebarCollapsed
      try {
        localStorage.setItem(GIT_SIDEBAR_KEY, String(next))
      } catch {}
      return { gitSidebarCollapsed: next }
    })
  },

  toggleTabsSidebar: () => {
    set(state => {
      const next = !state.tabsSidebarCollapsed
      try {
        localStorage.setItem(TABS_SIDEBAR_KEY, String(next))
      } catch {}
      return { tabsSidebarCollapsed: next }
    })
  },

  toggleTabsGitSidebar: () => {
    set(state => {
      const next = !state.tabsGitSidebarCollapsed
      try {
        localStorage.setItem(TABS_GIT_SIDEBAR_KEY, String(next))
      } catch {}
      return { tabsGitSidebarCollapsed: next }
    })
  },

  fetchPortProcesses: () => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "get_port_processes" }))
    }
  },

  killProcess: (pid) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "kill_process", pid }))
    }
  },

  renamePane: (paneId, name) => {
    const { panes, ws, isAuthenticated } = get()
    const updatedPanes = panes.map(p =>
      p.id === paneId ? { ...p, name } : p
    )
    savePanes(updatedPanes)
    set({ panes: updatedPanes })
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
    savePanes(updatedPanes)
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
    saveGroups(updatedGroups)
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
    saveGroups(updatedGroups)
    savePanes(updatedPanes)
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
    saveGroups(updatedGroups)
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
    saveSelectedGroup(groupId)
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

  // Device management actions
  requestDeviceList: () => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "get_device_list" }))
    }
  },

  kickDevice: (deviceId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "kick_device", device_id: deviceId }))
    }
  },

  banDevice: (ip) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "ban_device", ip }))
    }
  },

  handleDeviceList: (devices) => {
    set({ devices })
  },

  handleDeviceKicked: (deviceId) => {
    const { devices } = get()
    set({ devices: devices.filter(d => d.id !== deviceId) })
  },

  handleDeviceBanned: (ip) => {
    const { devices } = get()
    // Remove all devices with this IP
    set({ devices: devices.filter(d => d.ip !== ip) })
  },

  setShowSecurityModal: (show) => {
    set({ showSecurityModal: show })
    // Request fresh device list when opening modal
    if (show) {
      get().requestDeviceList()
    }
  },

  // File explorer actions
  openExplorer: () => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      // Reset state and request root/drill contents
      set({ explorerOpen: true, explorerCurrentPath: "", explorerContents: [] })
      ws.send(JSON.stringify({ action: "list_directory", path: "" }))
    }
  },

  openImagePicker: () => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      set({ imagePickerOpen: true, explorerOpen: true, explorerCurrentPath: "", explorerContents: [] })
      ws.send(JSON.stringify({ action: "list_directory", path: "" }))
    }
  },

  closeImagePicker: () => {
    set({ imagePickerOpen: false, explorerOpen: false, explorerCurrentPath: "", explorerContents: [] })
  },

  openBrowser: (url) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "spawn_browser", url }))
    }
  },

  closeExplorer: () => {
    set({ explorerOpen: false, explorerCurrentPath: "", explorerContents: [] })
  },

  spawnBrowserPane: (url) => {
    const { panes, activePanes } = get()
    const id = `browser-${Date.now()}`
    // Build proxy URL using tunnel - path-based format: /proxy/<scheme>/<host><path>
    let proxyUrl: string | null = null
    const stored = localStorage.getItem("tunnelUrl")
    if (stored) {
      try {
        const wsUrl = new URL(stored)
        const baseUrl = `${wsUrl.protocol === "wss:" ? "https" : "http"}://${wsUrl.host}`
        // Parse the target URL and construct path-based proxy URL
        const target = new URL(url)
        const scheme = target.protocol === "https:" ? "https" : "http"
        const proxyPath = `${baseUrl}/proxy/${scheme}/${target.host}${target.pathname}${target.search}`
        proxyUrl = proxyPath
      } catch {
        // fall through - proxyUrl stays null
      }
    }
    const newPane: Pane = {
      id,
      pid: 0,
      shell: "browser" as any,
      name: new URL(url).hostname,
      cols: 80,
      rows: 24,
      url,
      proxyUrl,
    }
    const updatedPanes = [...panes, newPane]
    set({
      panes: updatedPanes,
      activePanes: [...activePanes, id],
      selectedTab: id,
    })
    savePanes(updatedPanes)
    saveActivePanes([...activePanes, id])
    saveSelectedTab(id)
  },

  openBrowserModal: () => {
    set({ browserModalOpen: true })
  },

  closeBrowserModal: () => {
    set({ browserModalOpen: false })
  },

  fetchDirectory: (path) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      set({ explorerCurrentPath: path })
      ws.send(JSON.stringify({ action: "list_directory", path }))
    }
  },

  handleDirectoryContents: (path, items) => {
    const { imagePickerOpen } = get()
    set({
      explorerCurrentPath: path,
      explorerContents: items,
      // Close image picker since we're now showing directory contents
      imagePickerOpen: false,
    })
  },

  spawnAtDirectory: (dir) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      // Close explorer first
      set({ explorerOpen: false, explorerCurrentPath: "", explorerContents: [] })
      // Send spawn_at_dir action
      ws.send(JSON.stringify({ action: "spawn_at_dir", shell: "powershell", dir }))
      // Select the group so new panes show
      get().selectGroup(null)
    }
  },

  // File transfer
  uploadFile: (paneId, fileName, data) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "upload_file", pane_id: paneId, file_name: fileName, data }))
    }
  },

  handleFileUploaded: (paneId, fileName) => {
    console.log(`[Termote] File uploaded: ${fileName} to pane ${paneId}`)
  },

  setPaneContent: (paneId, noteContent, whiteboardData, imageData) => {
    const state = get()
    const pane = state.panes.find(p => p.id === paneId)
    if (pane) {
      set({ panes: state.panes.map(p => p.id === paneId ? {
        ...p,
        noteContent: noteContent ?? p.noteContent,
        whiteboardData: whiteboardData ?? p.whiteboardData,
        imageData: imageData ?? p.imageData,
      } : p) })
    }
  },

  readImageFile: (absolute_path) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "read_file", absolute_path }))
    }
  },

  handleImageFileRead: (result) => {
    console.log("[Termote] Image file read:", result.success ? "success" : result.error)
  },

  getGitStatus: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "get_git_status", pane_id: paneId }))
    }
  },

  gitCommit: (paneId, message) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "git_commit", pane_id: paneId, message }))
    }
  },

  gitStage: (paneId, files, unstage) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "git_stage", pane_id: paneId, files, unstage }))
    }
  },

  gitPush: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "git_push", pane_id: paneId }))
    }
  },

  gitPull: (paneId) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "git_pull", pane_id: paneId }))
    }
  },

  gitLog: (paneId, dir) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "git_log", pane_id: paneId, dir }))
    }
  },

  spawnLazygit: (paneId, cwd) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "spawn_lazygit", pane_id: paneId, cwd }))
    }
  },

  getSourceControlState: (path) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "get_source_control_state", path }))
    }
  },

  findGitRepos: (path) => {
    const { ws, isAuthenticated } = get()
    if (ws && isAuthenticated) {
      ws.send(JSON.stringify({ action: "find_git_repos", path }))
    }
  },

  setSelectedSourceControlRepo: (path) => {
    saveSourceControlSelected(path)
    set({ selectedSourceControlRepo: path })
  },

  handleGitReposFound: (repos) => {
    set((state) => {
      // Merge new repos with existing ones, avoiding duplicates by path
      const existingPaths = new Set(state.sourceControlRepos.map(r => r.path))
      const newRepos = repos.filter(r => !existingPaths.has(r.path))
      const merged = [...state.sourceControlRepos, ...newRepos]
      saveSourceControlRepos(merged)

      // Auto-select first repo if none selected or previous selection not in new list
      let selected = state.selectedSourceControlRepo
      if (!selected || !merged.find(r => r.path === selected)) {
        selected = merged.length > 0 ? merged[0].path : null
        saveSourceControlSelected(selected)
      }
      return {
        sourceControlRepos: merged,
        selectedSourceControlRepo: selected,
      }
    })
  },

  setLazygitTerminal: (paneId, terminal) => {
    set((state) => ({
      lazygitTerminals: {
        ...state.lazygitTerminals,
        [paneId]: { terminal },
      },
    }))
  },

  removeLazygitTerminal: (paneId) => {
    set((state) => {
      const { [paneId]: _, ...rest } = state.lazygitTerminals
      return { lazygitTerminals: rest }
    })
  },

  setLazygitSidebarPaneId: (paneId) => {
    set({ lazySidebarPaneId: paneId })
  },

  handlePortProcesses: (processes) => {
    set({ portProcesses: processes })
  },

  handleProcessKilled: (pid, success) => {
    if (success) {
      set(state => ({
        portProcesses: state.portProcesses.filter(p => p.pid !== pid)
      }))
    }
  },

  handleGitStatus: (status) => {
    set((state) => ({
      gitStatuses: {
        ...state.gitStatuses,
        [status.pane_id]: status,
      },
    }))
  },

  handleGitLog: (log) => {
    set((state) => ({
      gitLogs: {
        ...state.gitLogs,
        [log.pane_id]: log,
      },
    }))
    // Also dispatch as event for components listening on git-log-received
    window.dispatchEvent(new CustomEvent("git-log-received", { detail: log }))
  },

  handleSourceControlState: (scState) => {
    set((state) => ({
      sourceControlStates: {
        ...state.sourceControlStates,
        [scState.path]: scState,
      },
    }))
  },

  setAiCommand: (command) => {
    saveAiCommand(command)
    set({ aiCommand: command })
  },

  loadPersistedState: () => loadPersistedState(),
}))

// Initialize view mode from localStorage
const initialPersisted = loadPersistedState()
usePaneStore.setState({ viewMode: initialPersisted.viewMode })

// Initialize AI command from localStorage
usePaneStore.setState({ aiCommand: loadAiCommand() })

// Initialize selected group from localStorage
usePaneStore.setState({ selectedGroupId: loadSelectedGroup() })

// Initialize tabs sidebar states from localStorage
usePaneStore.setState({
  tabsSidebarCollapsed: initialPersisted.tabsSidebarCollapsed,
  tabsGitSidebarCollapsed: initialPersisted.tabsGitSidebarCollapsed,
})
