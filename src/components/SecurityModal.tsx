"use client"

import { useState } from "react"
import { usePaneStore } from "@/hooks/usePaneStore"
import { Button } from "./ui/Button"

export function SecurityModal() {
  const {
    devices,
    showSecurityModal,
    setShowSecurityModal,
    kickDevice,
    banDevice,
    requestDeviceList,
  } = usePaneStore()

  const [activeTab, setActiveTab] = useState<"devices" | "banned">("devices")

  if (!showSecurityModal) return null

  const handleClose = () => {
    setShowSecurityModal(false)
  }

  const handleKick = (deviceId: string) => {
    kickDevice(deviceId)
  }

  const handleBan = (ip: string) => {
    if (confirm(`Are you sure you want to ban IP ${ip}? This will disconnect all devices from this IP.`)) {
      banDevice(ip)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333]">
          <h2 className="text-lg font-semibold text-white">Security & Devices</h2>
          <button
            onClick={handleClose}
            className="text-[#999999] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#333333]">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "devices"
                ? "text-white border-b-2 border-[#0037DA]"
                : "text-[#999999] hover:text-white"
            }`}
            onClick={() => setActiveTab("devices")}
          >
            Active Devices
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "banned"
                ? "text-white border-b-2 border-[#0037DA]"
                : "text-[#999999] hover:text-white"
            }`}
            onClick={() => setActiveTab("banned")}
          >
            Banned IPs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "devices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#999999]">
                  {devices.length} device{devices.length !== 1 ? "s" : ""} connected
                </p>
                <Button
                  variant="outline"
                  onClick={() => requestDeviceList()}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>

              {devices.length === 0 ? (
                <div className="text-center py-8 text-[#999999]">
                  No devices connected
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#333333]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#999999]">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white truncate">
                              {device.device || "Unknown Device"}
                            </p>
                            <p className="text-xs text-[#999999]">
                              {device.ip} • {device.authenticated ? "Authenticated" : "Unauthenticated"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-[#666666] mt-2">
                          Connected: {formatTime(device.connected_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          onClick={() => handleKick(device.id)}
                          className="text-xs px-3 py-1"
                        >
                          Kick
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleBan(device.ip)}
                          className="text-xs px-3 py-1"
                        >
                          Ban IP
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "banned" && (
            <div className="space-y-4">
              <p className="text-sm text-[#999999] mb-4">
                Banned IPs are blocked from connecting to the server.
              </p>
              <div className="text-center py-8 text-[#999999]">
                No banned IPs
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
