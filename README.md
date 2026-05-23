![Termote Cover](public/maincover.png)

# Termote - Desktop & Web Interface

<div align="center">

![Termote](https://img.shields.io/github/stars/AliSharjeell/Termote?style=social)

**Termote is a Rust-based lightweight Agentic Development Environment (ADE) that boosts your productivity with a persistent multi-pane workspace, built-in tools, and one-click remote access so you can keep working from your phone, anywhere.**

</div>

---

## Quick Install

**Download from [Termote Releases](https://github.com/AliSharjeell/Termote/releases)**

The installer includes everything — one download, one install, done.

After install, open Termote from your Start Menu or type `termote` in any terminal.

| Platform | Installer |
|----------|-----------|
| Windows x64 | `.exe` NSIS installer |
| macOS Apple Silicon | `.dmg` |
| macOS Intel | `.dmg` |
| Linux x64 | `.AppImage`, `.deb`, `.rpm` |

---

## What Can You Do?

**From your phone or tablet:**
- Monitor long-running builds or scripts
- Restart servers if something crashes
- Access AI agents running on your desktop

**On your desktop:**
- Multiple terminal panes in one window
- Split view, tabs, or both
- Drag-and-drop files

**Anywhere:**
- Connect via QR code from mobile devices

---

![Desktop Interface](public/mainss1.png)

---

## Mobile Access

Scan the QR code to connect from your phone or tablet — no VPN needed.

![Mobile QR Access](public/mobileqr.png)

---

## Features

| Feature | What it does |
|---------|--------------|
| Multi-pane terminals | Split your workspace into multiple terminals |
| Mobile access | Open from any browser, anywhere |
| QR connect | Scan to link mobile devices |
| File transfer | Drag files into terminal panes |
| AI agents | Quick-launch Claude Code and other CLI tools |
| Auto-reconnect | Handles network drops gracefully |

---

![Mobile Interface](public/phone1new.png)

![Mobile Tabs View](public/phone2new.png)

---

## Architecture

Two parts work together:

| Component | Where it runs | Built with |
|-----------|---------------|------------|
| **Frontend** (this repo) | Your desktop | Tauri + Next.js |
| **Backend** ([TermoteBackend](https://github.com/AliSharjeell/TermoteBackend)) | Sidecar process | Rust |

The installer packages both together. You install one app.

---

## Build From Source

```powershell
# Clone both repos
git clone https://github.com/AliSharjeell/Termote.git
git clone https://github.com/AliSharjeell/TermoteBackend.git

# Build
cd Termote
npm install
npm run tauri:build
```

Installer is in `src-tauri/target/release/bundle`.

---

## Release Automation

This repo includes `.github/workflows/release.yml` for public releases. It builds native installers on GitHub-hosted Windows, macOS, and Ubuntu runners, checks out the backend repo, bundles the backend and Dev Tunnels sidecars, then uploads the installers to a GitHub Release.

Run it from the **Actions** tab or push a tag such as `termote-v0.1.0`. If `TermoteBackend` is still private, add a `TERMOTE_BACKEND_TOKEN` repository secret with read access before running the workflow.

---

## Contributing

1. Open an Issue or email `alisharjeelofficial@gmail.com`
2. Get assigned before writing code
3. Open a PR with tests

---

## License

MIT License
