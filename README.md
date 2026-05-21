# TermoteUI

A web-native terminal multiplexer frontend built with Next.js, React, and xterm.js. Provides a beautiful, responsive interface for accessing and managing terminal panes from any device.

Termote is now desktop-first. The Tauri desktop app is the main install target and bundles the Rust Termote backend as a sidecar, so users install one GUI app instead of running a CLI-only setup plus a hosted web deployment.

## Features

- **Split pane view**: Arrange terminals in a responsive grid
- **Tabs view**: Switch between terminals in a tabed interface
- **Mobile responsive**: Optimized for phone and tablet browsers
- **QR code connection**: Scan to connect from mobile devices
- **Real-time sync**: Instant terminal updates via WebSocket
- **Auto-reconnect**: Handles network interruptions gracefully
- **Focus button**: Reset terminal size when switching devices
- **Dark theme**: Modern, eye-friendly dark interface
- **Drag-and-drop file transfer**: Drag files into terminal panes to upload them
- **AI quick-launch**: One-click launch of AI CLI tools (Claude Code, Gemini CLI, etc.)
- **Pane groups**: Color-code and organize terminals into groups
- **Security & device management**: View and manage connected devices, ban IPs

## Install Termote

### Recommended: Desktop Installer

Download the latest Termote desktop installer from the TermoteUI releases page, then run the app. The installer includes:

- the Termote desktop GUI
- the bundled Termote Rust backend
- local WebSocket access on `127.0.0.1:9090`
- mobile access through Microsoft Dev Tunnels from the GUI

After launch, Termote starts the local backend automatically. Click **Mobile Access** in the dashboard toolbar to open a Dev Tunnel for your phone or another device. The copied/QR mobile link points directly at your forwarded local Termote GUI; it does not use a hosted deployment.

### Build The Installer From Source

Clone both repos side by side:

```powershell
mkdir C:\AppsNew\TermoteFull
cd C:\AppsNew\TermoteFull
git clone https://github.com/AliSharjeell/Termote.git
git clone https://github.com/AliSharjeell/TermoteUI.git
```

Install dependencies and build the desktop bundle:

```powershell
cd C:\AppsNew\TermoteFull\TermoteUI
npm install
npm run tauri:build
```

The Tauri build runs `npm run build:tauri`, which exports the Next.js GUI and prepares the backend sidecar from `..\Termote`. Installer artifacts are written under:

```text
src-tauri\target\release\bundle
```

If your backend repo is somewhere else, set `TERMOTE_BACKEND_DIR` before building:

```powershell
$env:TERMOTE_BACKEND_DIR="D:\code\Termote"
npm run tauri:build
```

### Development

Run the desktop app in development mode:

```powershell
npm install
npm run tauri:dev
```

`tauri:dev` prepares a debug backend sidecar and starts the Next dev server for the Tauri webview.

For mobile access in development or production, install Microsoft Dev Tunnels CLI and make `devtunnel` available on `PATH`, or set `DEVTUNNEL_PATH` to the executable. On Windows the app also checks `%USERPROFILE%\termote\bin\devtunnel.exe`.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TermoteUI (Next.js)                   │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    Dashboard                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │
│  │  │  TabBar/    │  │   PaneBar   │  │  Profile │ │ │
│  │  │  SplitPane  │  │   Layout    │  │ Sidebar  │ │ │
│  │  └─────────────┘  └─────────────┘  └──────────┘ │ │
│  │         │                                    │     │ │
│  │         ▼                                    │     │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │              XtermPane (xterm.js)            │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                            │                              │
│                            ▼                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  useWebSocket Hook                  │ │
│  │              (auto-reconnect, auth)                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket (wss://)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Termote Backend                      │
│                    (Rust + axum)                         │
└─────────────────────────────────────────────────────────┘
```

### Components

- **Dashboard**: Main application shell with toolbar and content area
- **SplitPane**: Grid layout for terminal panes
- **TabBar**: Tab-based terminal organization
- **XtermPane**: Individual terminal with xterm.js (includes drag-and-drop file upload)
- **PaneTitleBar**: Terminal header with close/rename/pin/AI launch buttons
- **ProfileSidebar**: Connection info, mobile QR code, AI CLI settings, security button
- **SecurityModal**: View connected devices, kick sessions, manage banned IPs
- **LoginForm**: Tunnel URL and token entry
- **ConnectionStatus**: Visual connection indicator

### State Management

Uses Zustand for global state:

```typescript
interface PaneState {
  panes: Pane[]
  activePanes: string[]
  floatingPanes: string[]
  viewMode: "tabs" | "panes"
  isConnected: boolean
  isAuthenticated: boolean
  groups: PaneGroup[]
  selectedGroupId: string | null
  devices: DeviceInfo[]
  showSecurityModal: boolean
  aiCommand: string  // Quick-launch AI CLI command
}
```

## Web-Only Development

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
npm install
```

### Next.js Only

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Build

```bash
npm run build
```

### Next.js Production

```bash
npm run start
```

## Connection Flow

### Desktop App Flow

1. The Tauri app starts the bundled Termote backend sidecar.
2. The desktop webview connects to `ws://127.0.0.1:9090/ws` using the generated local auth token.
3. Clicking **Mobile Access** runs `devtunnel host -p 9090 --allow-anonymous`.
4. The QR/copy link opens the same local GUI through the Dev Tunnel and passes the WebSocket URL plus token to `/dashboard/`.

### Manual Connection

1. Start the backend server
2. Enter the tunnel WebSocket URL (e.g., `wss://your-server.com`)
3. Enter the authentication token
4. Click "Connect"

### Auto-Login (Mobile)

1. Open the backend's `/launch` endpoint in a browser
2. Redirects to frontend with credentials in URL params
3. QR code available in Profile sidebar for future connections

### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `tunnel` | WebSocket tunnel URL |
| `token` | Authentication token |

Example: `https://abc-9090.devtunnels.ms/dashboard/?tunnel=wss%3A%2F%2Fabc-9090.devtunnels.ms%2Fws&token=abc123`

## View Modes

### Panes View

- Grid layout with auto-balancing
- Gap between panes for visual separation
- "+ New Terminal" button in toolbar
- Click x to close a pane

### Tabs View

- Single terminal visible at a time
- Tab bar shows all open panes
- Click tab to switch
- Extract pane to floating (hidden from grid)

## Components

### XtermPane

Individual terminal instance using xterm.js:

- **FitAddon**: Auto-fits terminal to container
- **Resize circuit breaker**: 200ms debounce, tracks last sent dimensions
- **Scrollback**: Preserved on reconnection
- **Input forwarding**: Keystrokes sent to backend
- **Drag-and-drop upload**: Visual feedback when dragging files over pane, uploads to pane's working directory
- **AI quick-launch button**: Launches configured AI CLI (Claude Code, Gemini, etc.) with one click

### ProfileSidebar

Connection management panel:

- Displays tunnel URL (masked)
- Displays auth token (masked)
- "Connect to Mobile" button with QR code
- **Default AI CLI** selector (Claude Code, Gemini CLI, aichat, Codex, llm)
- **Security & Devices** button to view/manage connected devices and banned IPs
- Sign out button

### Connection Status

Toolbar indicator showing:

- **Green glow**: Connected and authenticated
- **Yellow glow**: Connected, authenticating
- **Red glow**: Disconnected
- **Refresh icon**: Focus button to reset terminal size

## State Synchronization

Multi-client sync via broadcast channel:

1. Any client action broadcasts `StateUpdate` to all clients
2. New clients receive scrollback buffer replay on auth
3. Output events broadcast to all clients simultaneously

## WebSocket Protocol

### Client Messages

```typescript
// Authentication
{ action: "auth", token: string }

// Spawn terminal
{ action: "spawn", shell: "powershell" | "cmd" | "wsl" }

// Input
{ action: "input", pane_id: string, data: string }

// Resize (debounced)
{ action: "resize", pane_id: string, cols: number, rows: number }

// Force resize (no circuit breaker)
{ action: "refocus", pane_id: string, cols: number, rows: number }

// Kill
{ action: "kill", pane_id: string }

// Move between views
{ action: "move_to_floating", pane_id: string }
{ action: "move_to_active", pane_id: string }

// Rename
{ action: "rename", pane_id: string, name: string }

// Pane groups
{ action: "create_group", id?: string, name: string, color: string }
{ action: "delete_group", group_id: string }
{ action: "rename_group", group_id: string, name: string }
{ action: "set_pane_group", pane_id: string, group_id: string | null }

// Directory picker
{ action: "request_directory_picker", shell: string }

// File transfer
{ action: "upload_file", pane_id: string, file_name: string, data: string }

// Device management
{ action: "get_device_list" }
{ action: "kick_device", device_id: string }
{ action: "ban_device", ip: string }
```

### Server Messages

```typescript
// Auth result
{ event: "auth_result", success: boolean, message?: string }

// State sync
{ event: "state_update", panes: Pane[], active_panes: string[], floating_panes: string[], groups: PaneGroup[] }

// Terminal output
{ event: "output", pane_id: string, data: string }

// Group events
{ event: "group_created", group: PaneGroup }
{ event: "group_deleted", group_id: string }
{ event: "group_renamed", group_id: string, name: string }
{ event: "pane_group_set", pane_id: string, group_id: string | null }

// Directory picker
{ event: "directory_picker_cancelled" }

// File transfer
{ event: "file_uploaded", pane_id: string, file_name: string }

// Device management
{ event: "device_list", devices: DeviceInfo[] }
{ event: "device_kicked", device_id: string }
{ event: "device_banned", ip: string }
{ event: "error", message: string }
```

## Auto-Reconnect

WebSocket connection with:

- **3 second retry delay**
- **30 second ping interval**
- **Clean sessionStorage on sign out**

## Mobile Optimization

- **Safe area insets**: Respects notch and home indicator
- **Viewport fit**: `viewportFit: "cover"` for full screen
- **Touch-friendly**: Large tap targets
- **QR code**: Easy mobile connection flow

## Tech Stack

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **xterm.js**: Terminal emulator
- **Zustand**: State management
- **Tailwind CSS 4**: Styling
- **Lucide React**: Icons
- **qrcode.react**: QR code generation
- **Allotment**: Split pane library

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── dashboard/
│       └── page.tsx      # Main dashboard
├── components/
│   ├── LoginForm.tsx
│   ├── XtermPane.tsx
│   ├── PaneTitleBar.tsx
│   ├── SplitPane.tsx
│   ├── TabBar.tsx
│   ├── ProfileSidebar.tsx
│   └── ConnectionStatus.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── usePaneStore.ts
│   └── useMediaQuery.ts
└── lib/
    └── types.ts          # TypeScript types
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | - | Default backend WebSocket URL |

## License

MIT
