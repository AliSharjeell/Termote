# Termote Desktop v0.2.0

Termote v0.2.0 builds on the v0.1.0 desktop shell with a richer notification system, native browser panes, a polished Mica desktop look, mobile keyboard improvements, and dozens of pane management and accessibility fixes. Installers ship for the same platforms as v0.1.0.

## Release Assets

The GitHub Actions release workflow publishes every desktop build to the same GitHub Release:

| Platform | Asset | Use this when |
| --- | --- | --- |
| Windows x64 | `Termote_0.2.0_x64-setup.exe` | You want the standard Windows installer for Windows 10/11. |
| macOS Apple Silicon | `Termote_0.2.0_aarch64.dmg` | You use an M1, M2, M3, or newer Apple Silicon Mac. |
| macOS Intel | `Termote_0.2.0_x64.dmg` | You use an Intel-based Mac. |
| Linux x64 | `Termote_0.2.0_amd64.AppImage` | You want the most portable Linux download. |
| Debian/Ubuntu x64 | `Termote_0.2.0_amd64.deb` | You use Debian, Ubuntu, Pop!_OS, Linux Mint, or a related distro. |
| Fedora/RHEL x64 | `Termote-0.2.0-1.x86_64.rpm` | You use Fedora, RHEL, Rocky, AlmaLinux, or a related distro. |

## What Is Included

- Native Tauri desktop shell for Windows, macOS, and Linux.
- Static Next.js frontend exported into the app bundle.
- Bundled Geist font files, so the UI uses the intended font without downloading Google Fonts during build or install.
- Bundled Rust Termote backend sidecar compiled for each release target.
- Bundled Microsoft Dev Tunnels CLI sidecar for the supported release targets.
- App icons and static assets required by the installer packages.

## Highlights

### Notification system

- New notification history panel you can open from the bell to review past activity.
- Notifications sync across every device signed into the same backend, so activity in one terminal shows up on the phone and the desktop at the same time.
- Pane title bar turns blue when a notification targets that pane, so you can see at a glance which session is asking for attention.
- Reliability fixes for Codex CLI idle prompts, interactive AI CLI activity tracking, and false positives in the terminal activity watcher.

### Native browser panes

- Browser panes now use native Tauri webviews instead of the remote proxy, so the desktop app can host the browser locally with a much smaller round-trip.
- Open browser panes directly from the sidebar instead of through a modal.
- Sidebar pane list scrolls when it overflows, and the PortManager stays pinned to the bottom.
- New single-instance plugin integration, so launching Termote again with a path forwards the `open_dir` command to the running window.

### Mica desktop polish

- Mica shell is darker, with a subtle grayscale overlay for less visual noise.
- Curved card look for the terminal container restored after the html className handling fix.
- Consistent dark background between expanded and collapsed right sidebars.
- Standardized pane title bar icons: every icon is white on a uniform grey circle.

### Pane groups

- Selecting a group auto-expands it in both tabs and split-pane modes.
- Group chevron aligns with pane icons in both sidebars, with a consistent ring border on the unselected state.
- Delete-group button appears on hover so the sidebar stays clean until you need it.

### Mobile and keyboard

- Native keyboard accessory bar gives you Ctrl, Esc, Tab, and arrow keys above the soft keyboard.
- Visual viewport height now updates dynamically so the on-screen keyboard never covers the terminal.
- Virtual keyboard no longer hides on a single tap, and Ctrl stays sticky.
- Notification dropdown renders through a React portal and anchors to the screen edge so it no longer overflows on small viewports.

### Agent terminal

- Ctrl+V sends a real bracketed paste to Claude Code, Codex, and other TUIs that require it.
- Defensive debounce stops a single paste from being inserted twice in agent sessions.
- Pressing `Cmd/Ctrl+F` jumps to the terminal and reveals a "Focus" hint when more than one device is connected.

### Open folder popup

- Breadcrumb navigation for jumping up to any parent directory.
- Last opened folder is remembered between sessions.
- Search field filters the file list as you type.

## Features

- **Notifications**: cross-client sync, history panel, and a blue title bar on the pane that triggered the alert.
- **Single instance**: Termote is now single-instance on the desktop; re-launching forwards `open_dir` into the running window.
- **Native browser webviews** for browser panes, replacing the remote proxy approach.
- **Sidebar browser entry** lets you open a browser pane directly from the sidebar.
- **Scrollable sidebar** with the PortManager sticky at the bottom.
- **Group auto-expand** when selecting a tab or selecting inside a group in split-pane mode.
- **Hover-to-delete** on group rows in the sidebar.
- **Duplicate terminal** button on every pane title bar.
- **Mobile keyboard accessory bar** for terminal control without hardware keys.
- **Dynamic visual viewport** that resizes for the on-screen keyboard.
- **Focus hint** plus auto-focus on terminal interaction when more than one device is connected.
- **Notification history panel** accessible from the bell icon.
- **Open folder popup**: breadcrumbs, last-folder memory, and live search.
- **Updated app logo, icons, and favicon**.
- **Pinned Tauri npm packages** to `2.10.x` so the JavaScript and Rust crates stay in lockstep.

## Fixes

- **Agent Ctrl+V**: routed through bracketed paste and debounced to stop a single paste from printing twice in Claude Code and other TUIs.
- **Pane sync**: trust the backend's pane list when connected so shared panes stay in sync across devices.
- **Notification dropdown**: moved to a React portal and anchored to the screen edge so it can no longer overflow on mobile.
- **Codex CLI** idle and interactive prompts now show notifications reliably and stop false-positive activity alerts.
- **Browser pane lifecycle**: webview is closed on unmount, repositioned through a fresh `Webview.getByLabel` lookup, and uses sequential create-and-sync with throttled error logging.
- **Popup z-index**: the folder and security popups now layer correctly above the topbar.
- **Store wiring**: the `setMobileAccessModalOpen` action is now wired through the store instead of being a no-op.
- **Tauri single-instance**: the `open_dir` argument from a second launch is forwarded to the already-running window.
- **Installer layout**: `termote.cmd` lives in `bin/` so it no longer collides with the desktop `.exe`.
- **Sidebar group selection**: only the parent group highlights in the SplitPane sidebar, not every child pane.
- **Sidebar chevron alignment** between the TabBar and SplitPane sidebars.
- **Right sidebar collapse width** is now a consistent 40px in both modes.
- **Topbar row 2** is centered, the notification panel no longer overflows, the bell icon size matches between the desktop and the Tauri build, and the left sidebar toggle is larger on mobile.
- **Mobile virtual keyboard** no longer hides after a single tap; Ctrl is sticky.
- **Mica transparency** restored after the html className handling fix, with the curved card look back on the terminal container.
- **Grayscale overlay** added on the Mica shell for a less vibrant look.
- **Pinned Tauri** at `2.10.x` so the npm packages match the Rust crate version and the build no longer warns about a mismatch.
- **Syntax fix** for a missing closing div introduced by the mobile viewport work.

## Style and Polish

- **Pane title bar icons** standardized to white on a uniform grey circle (`#27272A`).
- **Notification title bar** uses `bg-blue-500` for a softer, lighter blue when a pane has an alert.
- **Right sidebar** dark background (`#000000`) in both expanded and collapsed states, with matching `#353535` borders.
- **Settings header** removed from the right sidebar.
- **Server Controls header** removed from the right sidebar (controls remain, just unlabeled).
- **Empty panes state** dark to pure black (`#000000`) so the panes view matches the tabs view in the Tauri build.
- **Open folder popup** stacks search and breadcrumbs on separate rows so they no longer crowd each other.
- **Topbar layout** spans the full width and splits into 2 rows for a cleaner look.

## Installation Notes

### Windows

Download the `.exe` installer, run it, then launch Termote from the Start Menu. The installer contains the desktop app, frontend, backend sidecar, and Dev Tunnels sidecar. Single-instance is enabled, so launching Termote a second time forwards any `open_dir` argument to the running window.

### macOS

Download the `.dmg` that matches your CPU architecture and drag Termote into Applications. These v0.2.0 builds are unsigned unless Apple signing secrets are configured before release, so macOS may show a Gatekeeper warning.

### Linux

Use `.AppImage` for a portable desktop download, `.deb` for Debian/Ubuntu-based systems, or `.rpm` for Fedora/RHEL-based systems. Linux desktop WebKitGTK runtime requirements are handled through the native packages where applicable.

## Known Limitations

- This is a 0.2.0 release and should still be treated as early public software.
- macOS and Linux packages are produced by CI but still need real-machine install testing before a wider announcement.
- Windows and macOS installers are unsigned unless code-signing secrets are added.
- Windows SmartScreen and macOS Gatekeeper may warn until signed builds gain reputation.
- Remote access requires signing in through Microsoft Dev Tunnels.
- The backend repo must be public or accessible to the release workflow through `TERMOTE_BACKEND_TOKEN`.
- Browser panes are still flagged as experimental; the underlying webview works for most sites but some interactive sites may need fallback.

## Release Verification Checklist

- Windows NSIS installer installs and launches Termote.
- macOS Apple Silicon DMG installs and opens on an Apple Silicon Mac.
- macOS Intel DMG installs and opens on an Intel Mac.
- Linux AppImage launches on a clean x64 desktop Linux machine.
- Linux `.deb` installs on Ubuntu/Debian and starts from the app launcher.
- Linux `.rpm` installs on Fedora/RHEL-family systems and starts from the app launcher.
- Backend sidecar starts automatically from the installed app.
- Single-instance launches forward a second `open_dir` to the running window.
- Notification history panel opens from the bell icon and lists past activity.
- Triggering a notification in one device shows up on a second signed-in device.
- Pane title bar turns blue for any pane that has an unread notification.
- Browser pane opens from the sidebar, navigates, and closes cleanly without leaving a webview behind.
- Mobile keyboard accessory bar stays visible while typing in a terminal pane.

## GitHub Actions

The release is built by the `Build Installers and Release` workflow:

https://github.com/AliSharjeell/Termote/actions/workflows/release.yml

Run the workflow manually with the default `termote-v0.2.0` tag, or push the tag:

```bash
git tag termote-v0.2.0
git push origin termote-v0.2.0
```
