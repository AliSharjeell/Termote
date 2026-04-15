export function detectTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function isTauriBuild(): boolean {
  return detectTauri();
}