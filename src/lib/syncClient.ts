export function getSyncClientId(): string {
  if (typeof window === "undefined") return "server"

  const key = "termote-sync-client-id"
  let id = localStorage.getItem(key)

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }

  return id
}