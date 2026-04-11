export type Shell = "powershell" | "cmd" | "wsl" | "note" | "image" | "whiteboard"

export interface PaneGroup {
  id: string
  name: string
  color: string
}

export interface Pane {
  id: string
  pid: number
  shell: Shell
  name: string
  cols: number
  rows: number
  pinned?: boolean
  groupId?: string | null
  cwd?: string | null
  url?: string | null
  proxyUrl?: string | null
}

export interface DeviceInfo {
  id: string
  ip: string
  device: string
  connected_at: number
  authenticated: boolean
}

export interface DirectoryItem {
  name: string
  absolute_path: string
  is_dir: boolean
}

// Client -> Server messages
export type SpawnMessage = { action: "spawn"; shell: Shell }
export type SpawnAtDirMessage = { action: "spawn_at_dir"; shell: Shell; dir: string }
export type InputMessage = { action: "input"; pane_id: string; data: string }
export type ResizeMessage = { action: "resize"; pane_id: string; cols: number; rows: number }
export type KillMessage = { action: "kill"; pane_id: string }
export type MoveToFloatingMessage = { action: "move_to_floating"; pane_id: string }
export type MoveToActiveMessage = { action: "move_to_active"; pane_id: string }
export type AuthMessage = { action: "auth"; token: string }
export type RequestDirectoryPickerMessage = { action: "request_directory_picker"; shell: Shell }
export type ListDirectoryMessage = { action: "list_directory"; path: string | null }
export type GetDeviceListMessage = { action: "get_device_list" }
export type KickDeviceMessage = { action: "kick_device"; device_id: string }
export type BanDeviceMessage = { action: "ban_device"; ip: string }
export type UploadFileMessage = { action: "upload_file"; pane_id: string; file_name: string; data: string }
export type GetGitStatusMessage = { action: "get_git_status"; pane_id: string }
export type GitCommitMessage = { action: "git_commit"; pane_id: string; message: string }
export type GitStageMessage = { action: "git_stage"; pane_id: string; files: string[]; unstage: boolean }
export type GitPushMessage = { action: "git_push"; pane_id: string }
export type GitPullMessage = { action: "git_pull"; pane_id: string }
export type GitLogMessage = { action: "git_log"; pane_id: string; dir: string }
export type GetSourceControlStateMessage = { action: "get_source_control_state"; path: string }
export type FindGitReposMessage = { action: "find_git_repos"; path: string }
export type GetPortProcessesMessage = { action: "get_port_processes" }
export type KillProcessMessage = { action: "kill_process"; pid: number }

export type ClientMessage = SpawnMessage | SpawnAtDirMessage | InputMessage | ResizeMessage | KillMessage | MoveToFloatingMessage | MoveToActiveMessage | AuthMessage | RequestDirectoryPickerMessage | ListDirectoryMessage | GetDeviceListMessage | KickDeviceMessage | BanDeviceMessage | UploadFileMessage | GetGitStatusMessage | GitCommitMessage | GitStageMessage | GitPushMessage | GitPullMessage | GitLogMessage | GetSourceControlStateMessage | FindGitReposMessage | GetPortProcessesMessage | KillProcessMessage

// Server -> Client messages
export type StateUpdate = {
  event: "state_update"
  panes: Pane[]
  active_panes: string[]
  floating_panes: string[]
  groups: PaneGroup[]
}
export type OutputEvent = { event: "output"; pane_id: string; data: string }
export type AuthResult = { event: "auth_result"; success: boolean; message?: string }
export type GroupCreated = { event: "group_created"; group: PaneGroup }
export type GroupDeleted = { event: "group_deleted"; group_id: string }
export type GroupRenamed = { event: "group_renamed"; group_id: string; name: string }
export type PaneGroupSet = { event: "pane_group_set"; pane_id: string; group_id: string | null }
export type DirectoryPickerCancelled = { event: "directory_picker_cancelled" }
export type DirectoryContentsEvent = { event: "directory_contents"; path: string; items: DirectoryItem[] }
export type DeviceListEvent = { event: "device_list"; devices: DeviceInfo[] }
export type DeviceKickedEvent = { event: "device_kicked"; device_id: string }
export type DeviceBannedEvent = { event: "device_banned"; ip: string }
export type ErrorEvent = { event: "error"; message: string }
export type FileUploadedEvent = { event: "file_uploaded"; pane_id: string; file_name: string }

export type GitStatusEvent = {
  event: "git_status"
  pane_id: string
  dir: string
  is_repo: boolean
  branch: string | null
  staged: string[]
  unstaged: string[]
  untracked: string[]
  ahead: number | null
  behind: number | null
}

export type GitCommitResultEvent = { event: "git_commit_result"; pane_id: string; success: boolean; message: string }

export type GitCommitInfo = {
  hash: string
  short_hash: string
  message: string
  author: string
  date: string
}

export type GitLogEvent = {
  event: "git_log"
  pane_id: string
  dir: string
  commits: GitCommitInfo[]
}

export type SourceControlFile = {
  path: string
  status: string
  added?: number
  deleted?: number
}

export type OutgoingCommit = {
  hash: string
  short_hash: string
  message: string
  author: string
  date: string
}

export type SourceControlStateEvent = {
  event: "source_control_state"
  path: string
  is_repo: boolean
  branch: string | null
  remote: string | null
  staged: SourceControlFile[]
  unstaged: SourceControlFile[]
  untracked: SourceControlFile[]
  ahead: number
  behind: number
  outgoing_commits: OutgoingCommit[]
}

export type GitRepoInfo = {
  path: string
  name: string
  branch: string | null
}

export type GitReposFoundEvent = {
  event: "git_repos_found"
  repos: GitRepoInfo[]
}

export type PortProcessesEvent = {
  event: "port_processes"
  processes: Array<{ port: number; pid: number; process_name: string; cwd?: string }>
}

export type ProcessKilledEvent = {
  event: "process_killed"
  pid: number
  success: boolean
  message: string
}

export type ServerMessage = StateUpdate | OutputEvent | AuthResult | GroupCreated | GroupDeleted | GroupRenamed | PaneGroupSet | DirectoryPickerCancelled | DirectoryContentsEvent | DeviceListEvent | DeviceKickedEvent | DeviceBannedEvent | ErrorEvent | FileUploadedEvent | GitStatusEvent | GitCommitResultEvent | GitLogEvent | SourceControlStateEvent | GitReposFoundEvent | PortProcessesEvent | ProcessKilledEvent
