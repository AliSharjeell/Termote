'use client';

import { useEffect, useState } from 'react';
import { useTermoteConnection } from '@/hooks/useTermoteConnection';
import { isTauriBuild } from '@/lib/tauriDetect';

function StatusIndicator({ running, error }: { running: boolean; error: string | null }) {
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-sm font-medium">Error</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${running ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
      <span className={`text-sm font-medium ${running ? 'text-white' : 'text-gray-400'}`}>
        {running ? 'Running' : 'Stopped'}
      </span>
    </div>
  );
}

export default function HostManager() {
  const { status } = useTermoteConnection();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Termote Host Manager</h1>
          <p className="text-gray-400">Monitor your Termote server status and connections</p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Server Status</h2>
              <p className="text-sm text-gray-400">
                {status.isTauri ? 'Tauri Desktop Mode' : 'Browser Mode'}
              </p>
            </div>
            <StatusIndicator running={status.serverRunning} error={status.error} />
          </div>

          {status.wsUrl && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                WebSocket URL: <code className="text-white">{status.wsUrl}</code>
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Server Controls</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-blue-400 text-2xl mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 className="font-medium mb-1">Profile Sidebar</h3>
              <p className="text-sm text-gray-400">Server controls (Restart, Stop, Mobile Access) are now accessible from the profile sidebar in the main dashboard.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-white text-2xl mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="font-medium mb-1">Security & Devices</h3>
              <p className="text-sm text-gray-400">Manage connected devices and view banned IPs from the Security modal in the dashboard.</p>
            </div>
          </div>
        </div>

        {/* Browser Mode Notice */}
        {!status.isTauri && (
          <div className="mt-6 bg-blue-900/30 rounded-xl p-6 border border-blue-800/50">
            <h2 className="text-lg font-semibold mb-2 text-blue-400">Browser Mode</h2>
            <p className="text-sm text-gray-400">
              You're running in browser mode. For full Termote features, use the Tauri desktop app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}