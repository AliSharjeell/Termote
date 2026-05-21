'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type ConnectionMode = 'tauri' | 'browser';

export interface TermoteStatus {
  isTauri: boolean;
  serverRunning: boolean;
  tunnelRunning: boolean;
  mode: ConnectionMode;
  wsUrl: string | null;
  mobileUrl: string | null;
  error: string | null;
}

export interface RuntimeSnapshot {
  backendRunning: boolean;
  tunnelRunning: boolean;
  backendUrl: string;
  wsUrl: string;
  authToken: string;
  tunnelUrl: string | null;
  mobileUrl: string;
}

export interface TermoteCommands {
  checkStatus: () => Promise<boolean>;
  getRuntimeState: () => Promise<RuntimeSnapshot | null>;
  startServer: () => Promise<RuntimeSnapshot>;
  stopServer: () => Promise<RuntimeSnapshot>;
  restartServer: () => Promise<RuntimeSnapshot>;
  startRemoteAccess: () => Promise<RuntimeSnapshot>;
  stopRemoteAccess: () => Promise<RuntimeSnapshot>;
  checkForUpdates: () => Promise<string>;
}

function detectTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

function getWsUrl(): string {
  return 'ws://127.0.0.1:9090/ws';
}

export function useTermoteConnection(): {
  status: TermoteStatus;
  commands: TermoteCommands;
} {
  const [status, setStatus] = useState<TermoteStatus>({
    isTauri: false,
    serverRunning: false,
    tunnelRunning: false,
    mode: 'browser',
    wsUrl: null,
    mobileUrl: null,
    error: null,
  });

  const isTauri = detectTauri();

  const commands: TermoteCommands = {
    checkStatus: async () => {
      if (isTauri) {
        return await invoke<boolean>('check_status');
      }
      return false;
    },
    getRuntimeState: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('get_runtime_state');
      }
      return null;
    },
    startServer: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('start_server');
      }
      throw new Error('Not in Tauri mode');
    },
    stopServer: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('stop_server');
      }
      throw new Error('Not in Tauri mode');
    },
    restartServer: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('restart_server');
      }
      throw new Error('Not in Tauri mode');
    },
    startRemoteAccess: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('start_remote_access');
      }
      throw new Error('Not in Tauri mode');
    },
    stopRemoteAccess: async () => {
      if (isTauri) {
        return await invoke<RuntimeSnapshot>('stop_remote_access');
      }
      throw new Error('Not in Tauri mode');
    },
    checkForUpdates: async () => {
      if (isTauri) {
        return await invoke<string>('check_for_updates');
      }
      return 'Updates not available in browser mode';
    },
  };

  useEffect(() => {
    setStatus(prev => ({ ...prev, isTauri, mode: isTauri ? 'tauri' : 'browser' }));

    if (isTauri) {
      invoke<RuntimeSnapshot>('get_runtime_state')
        .then(snapshot => {
          setStatus(prev => ({
            ...prev,
            serverRunning: snapshot.backendRunning,
            tunnelRunning: snapshot.tunnelRunning,
            wsUrl: snapshot.wsUrl,
            mobileUrl: snapshot.mobileUrl,
          }));
        })
        .catch(err => {
          setStatus(prev => ({ ...prev, error: String(err) }));
        });
    } else {
      setStatus(prev => ({ ...prev, wsUrl: getWsUrl(), mobileUrl: null }));
    }
  }, [isTauri]);

  return { status, commands };
}
