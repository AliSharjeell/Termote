![Termote Cover](public/maincover.png)

# Termote - Desktop & Web Interface

<div align="center">

![Termote](https://img.shields.io/github/stars/AliSharjeell/Termote?style=social)

**Termote is a lightweight ADE (Agent Development Environment) that boosts your productivity with a persistent multi-pane workspace, built-in tools, and one-click remote access so you can keep working from your phone, anywhere.**

</div>

---

## What is Termote?

Termote lets you use your terminal from your phone, tablet, or another computer — without VPNs or complicated setup. Your terminals run on your local machine, so you get full access to everything: your files, tools, and AI agents.

**Works from any browser** — same experience on desktop, tablet, or phone.

---

## Quick Install

**Download from [Termote Releases](https://github.com/AliSharjeell/Termote/releases)**

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