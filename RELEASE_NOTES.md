# Termote Desktop v0.1.0

Termote v0.1.0 is the first public desktop release. It packages the Termote UI, the Rust backend, and the remote-access tooling into native installers for Windows, macOS, and Linux so users can install one app instead of cloning and building multiple repos.

## Release Assets

The GitHub Actions release workflow publishes every desktop build to the same GitHub Release:

| Platform | Asset | Use this when |
| --- | --- | --- |
| Windows x64 | `Termote_0.1.0_x64-setup.exe` | You want the standard Windows installer for Windows 10/11. |
| macOS Apple Silicon | `Termote_0.1.0_aarch64.dmg` | You use an M1, M2, M3, or newer Apple Silicon Mac. |
| macOS Intel | `Termote_0.1.0_x64.dmg` | You use an Intel-based Mac. |
| Linux x64 | `Termote_0.1.0_amd64.AppImage` | You want the most portable Linux download. |
| Debian/Ubuntu x64 | `Termote_0.1.0_amd64.deb` | You use Debian, Ubuntu, Pop!_OS, Linux Mint, or a related distro. |
| Fedora/RHEL x64 | `Termote-0.1.0-1.x86_64.rpm` | You use Fedora, RHEL, Rocky, AlmaLinux, or a related distro. |

## What Is Included

- Native Tauri desktop shell for Windows, macOS, and Linux.
- Static Next.js frontend exported into the app bundle.
- Bundled Geist font files, so the UI uses the intended font without downloading Google Fonts during build or install.
- Bundled Rust Termote backend sidecar compiled for each release target.
- Bundled Microsoft Dev Tunnels CLI sidecar for the supported release targets.
- App icons and static assets required by the installer packages.

## Core Features

- Multi-pane terminal workspace for running several commands side by side.
- Desktop host manager for starting, stopping, and checking the local backend.
- QR-code based mobile access flow for connecting from a phone or tablet.
- Remote access powered by Microsoft Dev Tunnels after user sign-in.
- Browser-friendly dashboard route for mobile and remote sessions.
- Local installer flow that does not require the user to manually install Node.js, clone the frontend, or build the backend.

## Installation Notes

### Windows

Download the `.exe` installer, run it, then launch Termote from the Start Menu. The installer contains the desktop app, frontend, backend sidecar, and Dev Tunnels sidecar.

### macOS

Download the `.dmg` that matches your CPU architecture and drag Termote into Applications. These v0.1.0 builds are unsigned unless Apple signing secrets are configured before release, so macOS may show a Gatekeeper warning.

### Linux

Use `.AppImage` for a portable desktop download, `.deb` for Debian/Ubuntu-based systems, or `.rpm` for Fedora/RHEL-based systems. Linux desktop WebKitGTK runtime requirements are handled through the native packages where applicable.

## Known Limitations

- This is a 0.1.0 release and should be treated as early public software.
- macOS and Linux packages are produced by CI but still need real-machine install testing before a wider announcement.
- Windows and macOS installers are unsigned unless code-signing secrets are added.
- Windows SmartScreen and macOS Gatekeeper may warn until signed builds gain reputation.
- Remote access requires signing in through Microsoft Dev Tunnels.
- The backend repo must be public or accessible to the release workflow through `TERMOTE_BACKEND_TOKEN`.

## Release Verification Checklist

- Windows NSIS installer installs and launches Termote.
- macOS Apple Silicon DMG installs and opens on an Apple Silicon Mac.
- macOS Intel DMG installs and opens on an Intel Mac.
- Linux AppImage launches on a clean x64 desktop Linux machine.
- Linux `.deb` installs on Ubuntu/Debian and starts from the app launcher.
- Linux `.rpm` installs on Fedora/RHEL-family systems and starts from the app launcher.
- Backend sidecar starts automatically from the installed app.
- Remote access flow opens the Dev Tunnels login and produces a mobile QR URL after sign-in.

## GitHub Actions

The release is built by the `Build Installers and Release` workflow:

https://github.com/AliSharjeell/Termote/actions/workflows/release.yml

Run the workflow manually with the default `termote-v0.1.0` tag, or push the tag:

```bash
git tag termote-v0.1.0
git push origin termote-v0.1.0
```
