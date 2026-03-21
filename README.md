# TermoteUI

A web-native terminal multiplexer frontend built with Next.js, React, and xterm.js. Provides a beautiful, responsive interface for accessing and managing terminal panes from any device.

## Features

- **Split pane view**: Arrange terminals in a responsive grid
- **Tabs view**: Switch between terminals in a tabbed interface
- **Mobile responsive**: Optimized for phone and tablet browsers
- **QR code connection**: Scan to connect from mobile devices
- **Real-time sync**: Instant terminal updates via WebSocket
- **Auto-reconnect**: Handles network interruptions gracefully
- **Focus button**: Reset terminal size when switching devices
- **Dark theme**: Modern, eye-friendly dark interface

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
- **XtermPane**: Individual terminal with xterm.js
- **PaneTitleBar**: Terminal header with close/rename buttons
- **ProfileSidebar**: Connection info and mobile QR code
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
}
```

## Setup

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Connection Flow

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

Example: `https://termote.example.com/?tunnel=wss://backend.example.com&token=abc123`

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

### ProfileSidebar

Connection management panel:

- Displays tunnel URL (masked)
- Displays auth token (masked)
- "Connect to Mobile" button with QR code
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
```

### Server Messages

```typescript
// Auth result
{ event: "auth_result", success: boolean, message?: string }

// State sync
{ event: "state_update", panes: Pane[], active_panes: string[], floating_panes: string[] }

// Terminal output
{ event: "output", pane_id: string, data: string }
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
