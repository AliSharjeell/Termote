export type SyncEnvelope<T> = {
  content: T
  clientId: string
  revision: number
  updatedAt: number
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
      "revision" in parsed &&
      "updatedAt" in parsed
    ) {
      return parsed as SyncEnvelope<T>
    }

    // Old format fallback - wrap legacy content
    return {
      content: parsed as T,
      clientId: "legacy",
      revision: 0,
      updatedAt: 0,
    }
  } catch {
    return null
  }
}

export function createSyncEnvelope<T>(content: T, clientId: string, revision: number): SyncEnvelope<T> {
  return {
    content,
    clientId,
    revision,
    updatedAt: Date.now(),
  }
}