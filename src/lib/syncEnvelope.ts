export type SyncEnvelope<T> = {
  content: T
  clientId: string
  clientSeq: number
  updatedAt: number
  serverVersion?: number
  serverUpdatedAt?: number
}

export function parseSyncEnvelope<T>(raw: string | null | undefined): SyncEnvelope<T> | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (
      parsed &&
      typeof parsed === "object" &&
      "content" in parsed &&
      "clientId" in parsed &&
      "clientSeq" in parsed &&
      "updatedAt" in parsed
    ) {
      return parsed as SyncEnvelope<T>
    }

    // Legacy fallback
    return {
      content: parsed as T,
      clientId: "legacy",
      clientSeq: 0,
      updatedAt: 0,
    }
  } catch {
    return null
  }
}

export function createSyncEnvelope<T>(
  content: T,
  clientId: string,
  clientSeq: number
): SyncEnvelope<T> {
  return {
    content,
    clientId,
    clientSeq,
    updatedAt: Date.now(),
  }
}