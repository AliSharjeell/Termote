import { execFileSync } from "node:child_process"
import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs"
import http from "node:http"
import https from "node:https"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const uiRoot = resolve(__dirname, "..")
const workspaceRoot = resolve(uiRoot, "..")
const backendRoot = process.env.TERMOTE_BACKEND_DIR
  ? resolve(process.env.TERMOTE_BACKEND_DIR)
  : join(workspaceRoot, "Termote")
const rawArgs = process.argv.slice(2)
const args = new Set(rawArgs)
const profileArg = rawArgs.find((arg) => arg.startsWith("--profile="))
const profile = profileArg?.slice("--profile=".length) || process.env.TERMOTE_BACKEND_PROFILE || "release"
const explicitTarget = readArgValue("--target") || process.env.TAURI_ENV_TARGET_TRIPLE || process.env.CARGO_BUILD_TARGET || ""
const targetTriple = explicitTarget || detectHostTriple()
const targetWasProvided = Boolean(explicitTarget)
const skipBuild = args.has("--skip-build") || process.env.TERMOTE_SKIP_BACKEND_BUILD === "1"
const outDir = join(uiRoot, "src-tauri", "binaries")
const backendTargetDir = process.env.TERMOTE_BACKEND_TARGET_DIR
  ? resolve(process.env.TERMOTE_BACKEND_TARGET_DIR)
  : join(uiRoot, "src-tauri", "target", "backend-sidecars")

function readArgValue(name) {
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index]
    if (arg === name && rawArgs[index + 1]) {
      return rawArgs[index + 1]
    }
    if (arg.startsWith(`${name}=`)) {
      return arg.slice(name.length + 1)
    }
  }
  return ""
}

function psString(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function detectHostTriple() {
  try {
    const hostTuple = execFileSync("rustc", ["--print", "host-tuple"], { encoding: "utf8" }).trim()
    if (hostTuple) {
      return hostTuple
    }
  } catch {
    // Rust before 1.84 does not support `--print host-tuple`.
  }

  const rustcVersion = execFileSync("rustc", ["-vV"], { encoding: "utf8" })
  const hostLine = rustcVersion.split(/\r?\n/).find((line) => line.startsWith("host: "))
  if (!hostLine) {
    throw new Error("Unable to determine Rust target triple from rustc -vV")
  }
  return hostLine.slice("host: ".length).trim()
}

function isWindowsTarget(triple) {
  return triple.includes("windows")
}

function executableExtension(triple) {
  return isWindowsTarget(triple) ? ".exe" : ""
}

function makeExecutable(path, triple) {
  if (!isWindowsTarget(triple)) {
    chmodSync(path, 0o755)
  }
}

function killStaleDevProcesses() {
  if (process.platform !== "win32") return

  const targetDebug = join(uiRoot, "src-tauri", "target", "debug")
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$target = ${psString(targetDebug)}
$names = @('termote', 'termote-backend', 'devtunnel')
Get-Process -Name $names -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -and $_.Path.StartsWith($target, [System.StringComparison]::OrdinalIgnoreCase) } |
  ForEach-Object {
    Write-Host "Stopping stale dev process: $($_.ProcessName) ($($_.Id))"
    try {
      Stop-Process -Id $_.Id -Force -ErrorAction Stop
    } catch {}
  }
exit 0
`

  try {
    execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
      stdio: "inherit",
      shell: false,
    })
  } catch (error) {
    console.warn(`Warning: failed to stop stale Tauri dev processes: ${error.message}`)
  }
}

function backendBinaryCandidates() {
  const exe = executableExtension(targetTriple)
  const targetParts = targetWasProvided
    ? ["target", targetTriple, profile, `termote${exe}`]
    : ["target", profile, `termote${exe}`]

  const isolatedTargetParts = targetWasProvided
    ? [targetTriple, profile, `termote${exe}`]
    : [profile, `termote${exe}`]

  return [
    join(backendTargetDir, ...isolatedTargetParts),
    join(backendRoot, ...targetParts),
  ]
}

function devtunnelDownloadForTarget(triple) {
  switch (triple) {
    case "x86_64-pc-windows-msvc":
      return {
        url: "https://aka.ms/TunnelsCliDownload/win-x64",
        archive: false,
      }
    case "x86_64-apple-darwin":
      return {
        url: "https://aka.ms/TunnelsCliDownload/osx-x64-zip",
        archive: "zip",
      }
    case "aarch64-apple-darwin":
      return {
        url: "https://aka.ms/TunnelsCliDownload/osx-arm64-zip",
        archive: "zip",
      }
    case "x86_64-unknown-linux-gnu":
      return {
        url: "https://aka.ms/TunnelsCliDownload/linux-x64",
        archive: false,
      }
    default:
      return null
  }
}

async function downloadFile(url, destination, redirects = 0) {
  if (redirects > 8) {
    throw new Error(`Too many redirects while downloading ${url}`)
  }

  const client = url.startsWith("https:") ? https : http

  await new Promise((resolve, reject) => {
    const request = client.get(url, { headers: { "User-Agent": "TermoteReleaseBuilder/1.0" } }, async (response) => {
      const status = response.statusCode || 0
      const redirect = response.headers.location

      if ([301, 302, 303, 307, 308].includes(status) && redirect) {
        response.resume()
        try {
          await downloadFile(new URL(redirect, url).toString(), destination, redirects + 1)
          resolve()
        } catch (error) {
          reject(error)
        }
        return
      }

      if (status < 200 || status >= 300) {
        response.resume()
        reject(new Error(`Download failed with HTTP ${status}: ${url}`))
        return
      }

      try {
        await pipeline(response, createWriteStream(destination))
        resolve()
      } catch (error) {
        reject(error)
      }
    })

    request.on("error", reject)
  })
}

function findFileRecursive(root, fileName) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const entryPath = join(root, entry.name)
    if (entry.isDirectory()) {
      const nested = findFileRecursive(entryPath, fileName)
      if (nested) {
        return nested
      }
    } else if (entry.name === fileName) {
      return entryPath
    }
  }
  return null
}

async function prepareDevtunnelSidecar() {
  const exe = executableExtension(targetTriple)
  const destination = join(outDir, `devtunnel-${targetTriple}${exe}`)

  if (existsSync(destination)) {
    console.log(`Prepared sidecar already exists: ${destination}`)
    return
  }

  const localSource = join(outDir, `devtunnel${exe}`)
  if (existsSync(localSource)) {
    copyFileSync(localSource, destination)
    makeExecutable(destination, targetTriple)
    console.log(`Prepared sidecar from local binary: ${destination}`)
    return
  }

  const download = devtunnelDownloadForTarget(targetTriple)
  if (!download) {
    throw new Error(
      `No Dev Tunnels CLI download is configured for ${targetTriple}. ` +
        "Set DEVTUNNEL_PATH at runtime or add this target to scripts/prepare-sidecars.mjs."
    )
  }

  const tempDir = mkdtempSync(join(tmpdir(), "termote-devtunnel-"))
  try {
    const downloadPath = join(tempDir, download.archive === "zip" ? "devtunnel.zip" : `devtunnel${exe}`)
    console.log(`Downloading Dev Tunnels CLI for ${targetTriple}...`)
    await downloadFile(download.url, downloadPath)

    let binaryPath = downloadPath
    if (download.archive === "zip") {
      execFileSync("unzip", ["-q", downloadPath, "-d", tempDir], { stdio: "inherit", shell: false })
      binaryPath = findFileRecursive(tempDir, `devtunnel${exe}`)
      if (!binaryPath) {
        throw new Error(`Downloaded Dev Tunnels archive did not contain devtunnel${exe}`)
      }
    }

    copyFileSync(binaryPath, destination)
    makeExecutable(destination, targetTriple)
    console.log(`Prepared sidecar: ${destination}`)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

if (!["debug", "release"].includes(profile)) {
  throw new Error(`Unsupported backend profile "${profile}". Use debug or release.`)
}

if (!targetTriple) {
  throw new Error("Unable to determine target triple")
}

if (!existsSync(join(backendRoot, "Cargo.toml"))) {
  throw new Error(`Termote backend repo not found at ${backendRoot}. Set TERMOTE_BACKEND_DIR to override.`)
}

killStaleDevProcesses()
mkdirSync(outDir, { recursive: true })

if (!skipBuild) {
  const buildArgs = ["build"]
  if (profile === "release") {
    buildArgs.push("--release")
  }
  if (targetWasProvided) {
    buildArgs.push("--target", targetTriple)
  }

  execFileSync("cargo", buildArgs, {
    stdio: "inherit",
    cwd: backendRoot,
    shell: false,
    env: {
      ...process.env,
      CARGO_TARGET_DIR: backendTargetDir,
    },
  })
}

const candidates = backendBinaryCandidates()
const source = candidates.find((candidate) => existsSync(candidate))
const backendDestination = join(outDir, `termote-backend-${targetTriple}${executableExtension(targetTriple)}`)

if (!source) {
  throw new Error(`Backend binary was not produced. Checked: ${candidates.join(", ")}`)
}

copyFileSync(source, backendDestination)
makeExecutable(backendDestination, targetTriple)
console.log(`Prepared sidecar: ${backendDestination}`)

await prepareDevtunnelSidecar()
