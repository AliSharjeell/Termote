export type Shell = "powershell" | "cmd" | "wsl"

export interface Pane {
  id: string
  pid: number
  shell: Shell
  name: string
  cols: number
  rows: number
  pinned?: boolean
}

// Client -> Server messages
export type SpawnMessage = { action: "spawn"; shell: Shell }
export type InputMessage = { action: "input"; pane_id: string; data: string }
export type ResizeMessage = { action: "resize"; pane_id: string; cols: number; rows: number }
export type KillMessage = { action: "kill"; pane_id: string }
export type MoveToFloatingMessage = { action: "move_to_floating"; pane_id: string }
export type MoveToActiveMessage = { action: "move_to_active"; pane_id: string }
export type AuthMessage = { action: "auth"; token: string }

export type ClientMessage = SpawnMessage | InputMessage | ResizeMessage | KillMessage | MoveToFloatingMessage | MoveToActiveMessage | AuthMessage

// Server -> Client messages
export type StateUpdate = {
  event: "state_update"
  panes: Pane[]
  active_panes: string[]
  floating_panes: string[]
}
export type OutputEvent = { event: "output"; pane_id: string; data: string }
export type AuthResult = { event: "auth_result"; success: boolean; message?: string }

export type ServerMessage = StateUpdate | OutputEvent | AuthResult
