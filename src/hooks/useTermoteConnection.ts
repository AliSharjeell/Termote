'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type ConnectionMode = 'tauri' | 'browser';

export interface TermoteStatus {
  isTauri: boolean;
  serverRunning: boolean;
  mode: ConnectionMode;
  wsUrl: string | null;
  error: string | null;
}

export interface TermoteCommands {
  checkStatus: () => Promise<boolean>;
  startServer: () => Promise<string>;
  stopServer: () => Promise<string>;
  restartServer: () => Promise<string>;
  checkForUpdates: () => Promise<string>;
}

function detectTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

function getWsUrl(): string {
  return 'ws://localhost:8080';
}

export function useTermoteConnection(): {
  status: TermoteStatus;
  commands: TermoteCommands;
} {
  const [status, setStatus] = useState<TermoteStatus>({
    isTauri: false,
    serverRunning: false,
    mode: 'browser',
    wsUrl: null,
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
    startServer: async () => {
      if (isTauri) {
        return await invoke<string>('start_server');
      }
      throw new Error('Not in Tauri mode');
    },
    stopServer: async () => {
      if (isTauri) {
        return await invoke<string>('stop_server');
      }
      throw new Error('Not in Tauri mode');
    },
    restartServer: async () => {
      if (isTauri) {
        return await invoke<string>('restart_server');
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
      invoke<boolean>('check_status')
        .then(running => {
          setStatus(prev => ({ ...prev, serverRunning: running }));
        })
        .catch(err => {
          setStatus(prev => ({ ...prev, error: String(err) }));
        });
    } else {
      setStatus(prev => ({ ...prev, wsUrl: getWsUrl() }));
    }
  }, [isTauri]);

  return { status, commands };
}