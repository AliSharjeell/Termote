'use client';

import { useEffect, useState } from 'react';
import { useTermoteConnection } from '@/hooks/useTermoteConnection';

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
      <div className={`w-3 h-3 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      <span className={`text-sm font-medium ${running ? 'text-green-400' : 'text-gray-400'}`}>
        {running ? 'Running' : 'Stopped'}
      </span>
    </div>
  );
}

export default function HostManager() {
  const { status, commands } = useTermoteConnection();
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    if (status.isTauri && !status.serverRunning && !status.error) {
      commands.startServer().catch(console.error);
    }
  }, [status.isTauri, status.serverRunning, status.error, commands]);

  const handleStart = async () => {
    try {
      await commands.startServer();
    } catch (err) {
      console.error('Start failed:', err);
    }
  };

  const handleStop = async () => {
    try {
      await commands.stopServer();
    } catch (err) {
      console.error('Stop failed:', err);
    }
  };

  const handleRestart = async () => {
    try {
      await commands.restartServer();
    } catch (err) {
      console.error('Restart failed:', err);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await commands.checkForUpdates();
      alert(result);
    } catch (err) {
      console.error('Update check failed:', err);
    } finally {
      setCheckingUpdates(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Termote Host Manager</h1>
          <p className="text-gray-400">Manage your Termote server directly from your desktop</p>
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
                WebSocket URL: <code className="text-green-400">{status.wsUrl}</code>
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Server Controls</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleStart}
              disabled={status.serverRunning}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                status.serverRunning
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Start Server
            </button>

            <button
              onClick={handleStop}
              disabled={!status.serverRunning}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                !status.serverRunning
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Stop Server
            </button>

            <button
              onClick={handleRestart}
              className="px-4 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Restart Server
            </button>

            <button
              onClick={handleCheckUpdates}
              disabled={checkingUpdates}
              className="px-4 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50"
            >
              {checkingUpdates ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>
        </div>

        {/* Host Manager Features - Only in Tauri mode */}
        {status.isTauri && (
          <div className="mt-6 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Host Manager Features</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-green-400 text-2xl mb-2">✓</div>
                <h3 className="font-medium mb-1">Auto-Start</h3>
                <p className="text-sm text-gray-400">Server auto-starts on app launch</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-green-400 text-2xl mb-2">✓</div>
                <h3 className="font-medium mb-1">Process Management</h3>
                <p className="text-sm text-gray-400">Full control over server process</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-green-400 text-2xl mb-2">✓</div>
                <h3 className="font-medium mb-1">Native Integration</h3>
                <p className="text-sm text-gray-400">Deep OS integration</p>
              </div>
            </div>
          </div>
        )}

        {/* Browser Mode Notice */}
        {!status.isTauri && (
          <div className="mt-6 bg-blue-900/30 rounded-xl p-6 border border-blue-800/50">
            <h2 className="text-lg font-semibold mb-2 text-blue-400">Browser Mode</h2>
            <p className="text-sm text-gray-400">
              You're running in browser mode. For full Host Manager features like server process
              control, use the Tauri desktop app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}