"use client"

import { useState, useEffect, useCallback } from "react"
import { PanelRight, RefreshCw, Square, Bot, Settings } from "lucide-react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { useIsTauri } from "@/hooks/useIsTauri"
import { invoke } from "@tauri-apps/api/core"

interface ProfilePaneProps {
  tunnelUrl?: string
  authToken?: string
  shareUrl?: string
}

export function ProfilePane({ tunnelUrl, authToken, shareUrl }: ProfilePaneProps) {
  const { isTauri, checked } = useIsTauri()
  const setShowSecurityModal = usePaneStore((state) => state.setShowSecurityModal)
  const aiCommand = usePaneStore((state) => state.aiCommand)
  const setAiCommand = usePaneStore((state) => state.setAiCommand)

  const [serverRunning, setServerRunning] = useState(true)
  const [serverAction, setServerAction] = useState<string | null>(null)
  const [customCommand, setCustomCommand] = useState("")
  const [customSelected, setCustomSelected] = useState(false)
  const toggleProfileSidebar = usePaneStore((state) => state.toggleProfileSidebar)

  const isMica = false

  const aiOptions = [
    { value: "claude", label: "Claude" },
    { value: "codex", label: "Codex" },
    { value: "agy", label: "Agy" },
    { value: "opencode", label: "Opencode" },
  ]
  const isCustomCommand = customSelected || (!!aiCommand && !aiOptions.some(o => o.value === aiCommand) && aiCommand !== "")

  useEffect(() => {
    const isCustom = !aiOptions.some(o => o.value === aiCommand)
    if (isCustom && aiCommand) setCustomCommand(aiCommand)
  }, [aiCommand])

  const handleRestartServer = async () => {
    if (!isTauri) return
    setServerAction("restarting")
    try { await invoke("restart_server"); setServerRunning(true) }
    catch (err) { console.error("Restart failed:", err) }
    finally { setTimeout(() => setServerAction(null), 1000) }
  }

  const handleStopServer = async () => {
    if (!isTauri) return
    setServerAction("stopping")
    try { await invoke("stop_server"); setServerRunning(false) }
    catch (err) { console.error("Stop failed:", err) }
    finally { setTimeout(() => setServerAction(null), 1000) }
  }

  return (
    <>
      {/* Sidebar content */}
      <div className={`flex flex-col h-full border-l border-[#353535] overflow-hidden ${isMica ? "bg-transparent border-transparent" : "bg-black"}`} style={{ width: 260 }}>
        {/* Collapse button */}
        <div className={`flex justify-start px-2 py-1 ${isMica ? "border-transparent" : "border-b border-[#1a1a1a]"}`}>
          <button
            onClick={toggleProfileSidebar}
            title="Collapse sidebar"
            className="text-[#CCCCCC] hover:text-white cursor-pointer"
          >
            <PanelRight size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Settings header */}
          <div className={`px-3 py-3 flex items-center gap-1.5 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
            <Settings className="h-4.5 w-4.5 sm:h-3.5 sm:w-3.5 text-[#808080] shrink-0" />
            <span className="text-sm sm:text-xs font-normal text-white">
              Settings
            </span>
          </div>

          {/* Server Controls - Tauri only */}
          {checked && isTauri && (
            <div className={`px-1.5 py-3 ${isMica ? "border-transparent" : "border-b border-[#252525]"}`}>
              <div className="space-y-1">
                <button
                  onClick={handleRestartServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <RefreshCw className={`h-3 w-3 shrink-0 ${serverAction === "restarting" ? "animate-spin" : ""}`} />
                  Restart
                </button>
                <button
                  onClick={handleStopServer}
                  disabled={!!serverAction || !serverRunning}
                  className="flex items-center gap-1.5 w-full rounded bg-transparent px-1.5 py-2 text-sm text-[#CCCCCC] hover:text-white hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  <Square className="h-3 w-3 shrink-0" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Default AI CLI - Both versions */}
          <div className="px-1.5 py-3">
            <div className="flex items-center gap-1.5 mb-2 px-1.5">
              <Bot className="h-3 w-3 text-[#CCCCCC]" />
              <span className="text-[10px] text-[#CCCCCC]">Default AI CLI</span>
            </div>
             <div className="space-y-0.5">
              {aiOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-1.5 px-1.5 py-2 rounded cursor-pointer transition-colors text-sm ${
                    aiCommand === option.value ? "text-[#CCCCCC] bg-white/[0.08]" : "text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-cli-profile"
                    value={option.value}
                    checked={aiCommand === option.value}
                    onChange={() => { setAiCommand(option.value); setCustomSelected(false) }}
                    className="sr-only"
                  />
                  <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                    aiCommand === option.value ? "border-[#CCCCCC] bg-[#CCCCCC]" : "border-[#555]"
                  }`} />
                  <span>{option.label}</span>
                </label>
              ))}
              {/* Custom option */}
              <label
                onClick={() => {
                  setCustomSelected(true)
                  if (customCommand.trim()) {
                    setAiCommand(customCommand.trim())
                  } else {
                    setAiCommand("")
                  }
                }}
                className={`flex items-center gap-1.5 px-1.5 py-2 rounded cursor-pointer transition-colors text-sm ${
                  isCustomCommand ? "text-[#CCCCCC] bg-white/[0.08]" : "text-[#CCCCCC] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <input
                  type="radio"
                  name="ai-cli-profile"
                  checked={isCustomCommand}
                  readOnly
                  className="sr-only"
                />
                <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${
                  isCustomCommand ? "border-[#CCCCCC] bg-[#CCCCCC]" : "border-[#555]"
                }`} />
                <span>Custom</span>
              </label>
              {/* Custom input dropdown */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCustomCommand ? "max-h-16 opacity-100 mt-1.5 mb-1" : "max-h-0 opacity-0 pointer-events-none"
              }`}>
                <div className="pl-[22px] pr-1">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => {
                      setCustomCommand(e.target.value)
                      setAiCommand(e.target.value)
                    }}
                    placeholder="Enter custom CLI command..."
                    className="w-full bg-[#1a1a1a] px-2.5 py-1.5 text-[11px] text-[#CCCCCC] placeholder-[#555] outline-none border border-[#3B3B3B] rounded-md focus:border-[#58A6FF] focus:ring-1 focus:ring-[#58A6FF]/20"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#666] mt-1.5 px-1.5 mb-3">
              Sends: {aiCommand || "claude"}
            </p>
          </div>
        </div>

        {/* Security & Devices - Tauri only */}
        {checked && isTauri && (
          <div className={`px-1.5 py-3 shrink-0 ${isMica ? "border-transparent" : "border-t border-[#252525]"}`}>
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex w-full items-center justify-start gap-1.5 rounded bg-transparent px-1.5 py-2 text-sm text-white hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Security & Devices
            </button>
          </div>
        )}
      </div>
    </>
  )
}