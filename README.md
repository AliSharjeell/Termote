# Termote - Desktop & Web Interface

<div align="center">

![Termote](https://img.shields.io/github/stars/AliSharjeell/TermoteUI?style=social)

**Termote is a lightweight ADE (Agent Development Environment) that boosts your productivity with a persistent multi-pane workspace, built-in tools, and one-click remote access so you can keep working from your phone, anywhere.**

</div>

---

## What is Termote?

Termote lets you use your terminal from your phone, tablet, or another computer — without VPNs or complicated setup. Your terminals run on your local machine, so you get full access to everything: your files, tools, and AI agents.

**Works from any browser** — same experience on desktop, tablet, or phone.

---

## Quick Install

**Download from [TermoteUI Releases](https://github.com/AliSharjeell/TermoteUI/releases)**

The installer includes everything — one download, one install, done.

After install, open Termote from your Start Menu or type `termote` in any terminal.

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

## Architecture

Two parts work together:

| Component | Where it runs | Built with |
|-----------|---------------|------------|
| **Frontend** (this repo) | Your desktop | Tauri + Next.js |
| **Backend** ([Termote](https://github.com/AliSharjeell/Termote)) | Sidecar process | Rust |

The installer packages both together. You install one app.

---

## Why Not SSH?

| SSH | Termote |
|-----|---------|
| Needs port forwarding | Works through firewalls |
| Requires VPN for remote | Just open in browser |
| Text only | Visual multi-pane UI |
| Not mobile-friendly | Optimized for phones |

---

## Build From Source

```powershell
# Clone both repos
git clone https://github.com/AliSharjeell/TermoteUI.git
git clone https://github.com/AliSharjeell/Termote.git

# Build
cd TermoteUI
npm install
npm run tauri:build
```

Installer is in `src-tauri/target/release/bundle`.

---

## Contributing

1. Open an Issue or email `alisharjeelofficial@gmail.com`
2. Get assigned before writing code
3. Open a PR with tests

---

## License

MIT License