import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const uiRoot = resolve(__dirname, "..")
const workspaceRoot = resolve(uiRoot, "..")
const backendRoot = process.env.TERMOTE_BACKEND_DIR
  ? resolve(process.env.TERMOTE_BACKEND_DIR)
  : join(workspaceRoot, "Termote")
const args = new Set(process.argv.slice(2))
const profileArg = process.argv.find((arg) => arg.startsWith("--profile="))
const profile = profileArg?.slice("--profile=".length) || process.env.TERMOTE_BACKEND_PROFILE || "release"
const skipBuild = args.has("--skip-build") || process.env.TERMOTE_SKIP_BACKEND_BUILD === "1"

if (!["debug", "release"].includes(profile)) {
  throw new Error(`Unsupported backend profile "${profile}". Use debug or release.`)
}

if (!existsSync(join(backendRoot, "Cargo.toml"))) {
  throw new Error(`Termote backend repo not found at ${backendRoot}. Set TERMOTE_BACKEND_DIR to override.`)
}

if (!skipBuild) {
  const buildArgs = profile === "release" ? ["build", "--release"] : ["build"]
  execFileSync("cargo", buildArgs, { stdio: "inherit", cwd: backendRoot, shell: false })
}

const rustcVersion = execFileSync("rustc", ["-vV"], { encoding: "utf8" })
const hostLine = rustcVersion.split(/\r?\n/).find((line) => line.startsWith("host: "))
if (!hostLine) {
  throw new Error("Unable to determine Rust target triple from rustc -vV")
}

const triple = hostLine.slice("host: ".length).trim()
const exe = process.platform === "win32" ? ".exe" : ""
const source = join(backendRoot, "target", profile, `termote${exe}`)
const outDir = join(uiRoot, "src-tauri", "binaries")
const destination = join(outDir, `termote-backend-${triple}${exe}`)

if (!existsSync(source)) {
  throw new Error(`Backend binary was not produced at ${source}`)
}

mkdirSync(outDir, { recursive: true })
copyFileSync(source, destination)
console.log(`Prepared sidecar: ${destination}`)
